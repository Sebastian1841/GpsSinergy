import { computed, ref, watch } from "vue"

import { useDebouncedValue } from "../ui/useDebouncedValue.js"

import {
  mockCompanyRecords,
  mockCompanyReportTypes,
} from "../../data/companies/mockCompanyManagementData.js"

import {
  cloneCompanyData,
  companyMatchesSearch,
  getCompanyOperationHealth,
  getCompanyWorkspacePath,
} from "../../utils/companies/companyUtils.js"

const DEFAULT_VISIBLE_COMPANY_LIMIT = 50
const COMPANY_LIMIT_INCREMENT = 50

const createEmptyDraftCompany = () => ({
  id: null,
  name: "",
  rut: "",
  status: "active",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  billingEmail: "",
  region: "",
  city: "",
  timezone: "America/Santiago",
})

const createCompanyReports = (reportTypes = []) => {
  return reportTypes.map((reportType) => ({
    reportId: reportType.id,
    enabled: reportType.id === "mileage" || reportType.id === "route-history",
  }))
}

const buildCompanyId = (companiesCount) => {
  return `company-${String(companiesCount + 1).padStart(3, "0")}`
}

const getSucursalFlotaStorageKey = (companyId) => {
  return `sinergy-sucursales-flota-${companyId || "general"}`
}

const getLegacySucursalFlotaStorageKey = (companyId) => {
  return `sinergy-fleet-branches-${companyId || "general"}`
}

const readSucursalFlotaState = (companyId) => {
  if (typeof window === "undefined") return null

  try {
    const serializedState =
      window.localStorage.getItem(getSucursalFlotaStorageKey(companyId)) ||
      window.localStorage.getItem(getLegacySucursalFlotaStorageKey(companyId))
    const parsedState = JSON.parse(serializedState || "null")

    if (!parsedState || typeof parsedState !== "object") return null

    const storedSucursales = parsedState.sucursales || parsedState.branches
    const storedAssets = Array.isArray(parsedState.assets) ? parsedState.assets : []

    return {
      sucursalesHabilitadas:
        parsedState.sucursalesHabilitadas ?? parsedState.branchesEnabled ?? true,
      sucursales: Array.isArray(storedSucursales) ? storedSucursales : [],
      assets: storedAssets.map((asset) => ({
        ...asset,
        sucursalId: asset.sucursalId ?? asset.branchId ?? null,
      })),
      asignacionesActivos: parsedState.asignacionesActivos || parsedState.assetAssignments || {},
    }
  } catch {
    return null
  }
}

const persistirSucursalesEmpresa = (company) => {
  if (typeof window === "undefined" || !company?.id) return

  try {
    window.localStorage.setItem(
      getSucursalFlotaStorageKey(company.id),
      JSON.stringify({
        sucursalesHabilitadas: company.sucursalesHabilitadas !== false,
        sucursales: company.sucursales || [],
        assets: company.assets || [],
        asignacionesActivos: Object.fromEntries(
          (company.assets || []).map((asset) => [String(asset.id), asset.sucursalId || null]),
        ),
        updatedAt: new Date().toISOString(),
      }),
    )
  } catch {
    // Local storage is optional for the frontend-only prototype.
  }
}

const PATENT_LETTERS = "BCDFGHJKLMPRSTVWXYZ"

const buildMockPatent = (companyId, assetIndex) => {
  const companySeed = String(companyId || "")
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0)

  let letterSeed = companySeed * 131 + assetIndex
  const letters = Array.from({ length: 4 }, () => {
    const letter = PATENT_LETTERS[letterSeed % PATENT_LETTERS.length]

    letterSeed = Math.floor(letterSeed / PATENT_LETTERS.length)
    return letter
  })

  const digits = String(((companySeed + assetIndex) % 90) + 10)

  return `${letters[0]}${letters[1]}-${letters[2]}${letters[3]}-${digits}`
}

const buildCompanyAssets = (company, sucursales) => {
  if (Array.isArray(company.assets)) {
    return company.assets.map((asset) => ({
      ...asset,
      sucursalId: asset.sucursalId || null,
    }))
  }

  const totalAssets = Number(company.assetsCount) || 0
  const assignedAssets = Math.floor(totalAssets * 0.85)

  return Array.from({ length: totalAssets }, (_, index) => ({
    id: `asset-${company.id}-${String(index + 1).padStart(3, "0")}`,
    patent: buildMockPatent(company.id, index),
    sucursalId:
      index < assignedAssets && sucursales.length ? sucursales[index % sucursales.length].id : null,
  }))
}

const normalizarSucursalesEmpresa = (company) => {
  const storedState = readSucursalFlotaState(company.id)
  const sucursales = Array.isArray(storedState?.sucursales)
    ? storedState.sucursales
    : company.sucursales || []
  const normalizedSucursales = sucursales.map((sucursal) => ({
    ...sucursal,
    active: sucursal.active ?? true,
  }))

  return {
    ...company,
    sucursalesHabilitadas:
      storedState?.sucursalesHabilitadas ?? company.sucursalesHabilitadas ?? true,
    sucursales: normalizedSucursales,
    assets: Array.isArray(storedState?.assets)
      ? storedState.assets
      : buildCompanyAssets(company, normalizedSucursales),
  }
}

export function useCompanyManagement() {
  const companies = ref(cloneCompanyData(mockCompanyRecords).map(normalizarSucursalesEmpresa))
  const reportTypes = ref(cloneCompanyData(mockCompanyReportTypes))

  const searchTerm = ref("")
  const selectedStatus = ref("all")
  const visibleCompanyLimit = ref(DEFAULT_VISIBLE_COMPANY_LIMIT)
  const selectedCompanyId = ref(companies.value[0]?.id || null)

  const showEditorModal = ref(false)
  const editorMode = ref("create")
  const draftCompany = ref(createEmptyDraftCompany())

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 180)

  watch(
    companies,
    (companyRecords) => {
      companyRecords.forEach(persistirSucursalesEmpresa)
    },
    { deep: true },
  )

  const filteredCompanies = computed(() => {
    return companies.value.filter((company) => {
      const matchesSearch = companyMatchesSearch({
        company,
        term: debouncedSearchTerm.value,
      })

      const matchesStatus =
        selectedStatus.value === "all" || company.status === selectedStatus.value

      return matchesSearch && matchesStatus
    })
  })

  const visibleCompanies = computed(() => {
    return filteredCompanies.value.slice(0, visibleCompanyLimit.value)
  })

  const visibleCompaniesRemaining = computed(() => {
    return Math.max(filteredCompanies.value.length - visibleCompanies.value.length, 0)
  })

  const canShowMoreCompanies = computed(() => {
    return visibleCompaniesRemaining.value > 0
  })

  const selectedCompany = computed(() => {
    return (
      companies.value.find((company) => company.id === selectedCompanyId.value) ||
      companies.value[0] ||
      null
    )
  })

  const summaryItems = computed(() => {
    const activeCompanies = companies.value.filter((company) => company.status === "active")
    const totalAssets = companies.value.reduce((total, company) => {
      return total + (Number(company.assetsCount) || 0)
    }, 0)
    const activeAssets = companies.value.reduce((total, company) => {
      return total + (Number(company.activeAssetsCount) || 0)
    }, 0)
    const totalAlerts = companies.value.reduce((total, company) => {
      return total + (Number(company.alertsCount) || 0)
    }, 0)

    return [
      {
        key: "all",
        label: "Empresas",
        value: companies.value.length,
      },
      {
        key: "active",
        label: "Activas",
        value: activeCompanies.length,
      },
      {
        key: "assets",
        label: "Activos",
        value: totalAssets,
      },
      {
        key: "online",
        label: "En linea",
        value: activeAssets,
      },
      {
        key: "alerts",
        label: "Alertas",
        value: totalAlerts,
      },
    ]
  })

  watch([debouncedSearchTerm, selectedStatus], () => {
    visibleCompanyLimit.value = DEFAULT_VISIBLE_COMPANY_LIMIT
  })

  const selectCompany = (companyId) => {
    selectedCompanyId.value = companyId
  }

  const clearFilters = () => {
    searchTerm.value = ""
    selectedStatus.value = "all"
    visibleCompanyLimit.value = DEFAULT_VISIBLE_COMPANY_LIMIT
  }

  const showMoreCompanies = () => {
    visibleCompanyLimit.value += COMPANY_LIMIT_INCREMENT
  }

  const openCreateCompanyModal = () => {
    editorMode.value = "create"
    draftCompany.value = createEmptyDraftCompany()
    showEditorModal.value = true
  }

  const openEditCompanyModal = () => {
    if (!selectedCompany.value) return

    editorMode.value = "edit"
    draftCompany.value = cloneCompanyData(selectedCompany.value)
    showEditorModal.value = true
  }

  const closeEditorModal = () => {
    showEditorModal.value = false
  }

  const createCompany = () => {
    const name = draftCompany.value.name.trim()
    const rut = draftCompany.value.rut.trim()

    if (!name || !rut) return

    const companyId = buildCompanyId(companies.value.length)

    companies.value.unshift({
      ...draftCompany.value,
      id: companyId,
      name,
      rut,
      createdAt: new Date().toISOString().slice(0, 10),
      assetsCount: 0,
      activeAssetsCount: 0,
      movingAssetsCount: 0,
      alertsCount: 0,
      usersCount: 0,
      lastTelemetryAt: "Sin telemetria",
      workspacePath: `/app/${companyId}/activos`,
      sucursalesHabilitadas: true,
      sucursales: [
        {
          id: `sucursal-${companyId}-001`,
          name: "Casa matriz",
          active: true,
        },
      ],
      assets: [],
      reports: createCompanyReports(reportTypes.value),
    })

    selectedCompanyId.value = companyId
    closeEditorModal()
  }

  const updateCompany = () => {
    if (!draftCompany.value.id) return

    const company = companies.value.find((item) => item.id === draftCompany.value.id)

    if (!company) return

    Object.assign(company, {
      ...draftCompany.value,
      name: draftCompany.value.name.trim(),
      rut: draftCompany.value.rut.trim(),
      workspacePath: getCompanyWorkspacePath(draftCompany.value),
    })

    closeEditorModal()
  }

  const saveCompanyFromModal = () => {
    if (editorMode.value === "edit") {
      updateCompany()
      return
    }

    createCompany()
  }

  const toggleSelectedCompanyStatus = () => {
    if (!selectedCompany.value) return

    selectedCompany.value.status = selectedCompany.value.status === "active" ? "inactive" : "active"
  }

  const toggleCompanyReport = (reportId) => {
    const reportAccess = selectedCompany.value?.reports?.find((item) => item.reportId === reportId)

    if (!reportAccess) return

    reportAccess.enabled = !reportAccess.enabled
  }

  const alternarSucursalesHabilitadas = () => {
    if (!selectedCompany.value) return

    selectedCompany.value.sucursalesHabilitadas = !selectedCompany.value.sucursalesHabilitadas
  }

  const agregarSucursal = (name) => {
    const nombreSucursal = name.trim()

    if (!selectedCompany.value || !nombreSucursal) return

    selectedCompany.value.sucursales = [
      ...(selectedCompany.value.sucursales || []),
      {
        id: `sucursal-${selectedCompany.value.id}-${Date.now()}`,
        name: nombreSucursal,
        active: true,
      },
    ]
  }

  const actualizarNombreSucursal = (sucursalId, name) => {
    const sucursal = selectedCompany.value?.sucursales?.find((item) => item.id === sucursalId)

    if (!sucursal) return

    sucursal.name = name
  }

  const alternarEstadoSucursal = (sucursalId) => {
    const sucursal = selectedCompany.value?.sucursales?.find((item) => item.id === sucursalId)

    if (!sucursal) return

    sucursal.active = !sucursal.active
  }

  const eliminarSucursal = (sucursalId) => {
    if (!selectedCompany.value) return

    selectedCompany.value.assets = (selectedCompany.value.assets || []).map((asset) => {
      if (asset.sucursalId !== sucursalId) return asset

      return {
        ...asset,
        sucursalId: null,
      }
    })

    selectedCompany.value.sucursales = (selectedCompany.value.sucursales || []).filter(
      (sucursal) => {
        return sucursal.id !== sucursalId
      },
    )
  }

  const actualizarSucursalActivo = ({ assetId, sucursalId }) => {
    if (!selectedCompany.value) return

    const siguienteSucursalId = sucursalId || null
    const sucursalExiste =
      !siguienteSucursalId ||
      selectedCompany.value.sucursales?.some((sucursal) => sucursal.id === siguienteSucursalId)

    if (!sucursalExiste) return

    const asset = selectedCompany.value.assets?.find((item) => item.id === assetId)

    if (!asset) return

    asset.sucursalId = siguienteSucursalId
  }

  const getCompanyHealth = (company) => {
    return getCompanyOperationHealth(company)
  }

  return {
    companies,
    reportTypes,

    searchTerm,
    selectedStatus,
    visibleCompanyLimit,
    selectedCompanyId,
    selectedCompany,
    filteredCompanies,
    visibleCompanies,
    visibleCompaniesRemaining,
    canShowMoreCompanies,
    summaryItems,

    showEditorModal,
    editorMode,
    draftCompany,

    selectCompany,
    clearFilters,
    showMoreCompanies,
    openCreateCompanyModal,
    openEditCompanyModal,
    closeEditorModal,
    saveCompanyFromModal,
    toggleSelectedCompanyStatus,
    toggleCompanyReport,
    alternarSucursalesHabilitadas,
    agregarSucursal,
    actualizarNombreSucursal,
    alternarEstadoSucursal,
    eliminarSucursal,
    actualizarSucursalActivo,
    getCompanyHealth,
  }
}
