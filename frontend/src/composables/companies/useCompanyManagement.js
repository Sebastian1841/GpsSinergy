import { computed, ref, watch } from "vue"

import { useMockDatabase } from "../mock/useMockDatabase.js"
import { useDebouncedValue } from "../ui/useDebouncedValue.js"

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
    enabled: false,
  }))
}

const buildCompanyId = (companiesCount) => {
  return `company-${String(companiesCount + 1).padStart(3, "0")}`
}

const buildApplicationId = (companiesCount) => {
  return `app-${String(companiesCount + 1).padStart(3, "0")}`
}

export function useCompanyManagement() {
  const {
    companyRecords: companies,
    reportTypes,
    createCompany: createDatabaseCompany,
    updateCompany: updateDatabaseCompany,
    updateAsset,
    addSucursal: addDatabaseSucursal,
    updateSucursal,
    deleteSucursal: deleteDatabaseSucursal,
  } = useMockDatabase()

  const searchTerm = ref("")
  const selectedStatus = ref("all")
  const visibleCompanyLimit = ref(DEFAULT_VISIBLE_COMPANY_LIMIT)
  const selectedCompanyId = ref(companies.value[0]?.id || null)

  const showEditorModal = ref(false)
  const editorMode = ref("create")
  const draftCompany = ref(createEmptyDraftCompany())

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 180)

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
      { key: "all", label: "Empresas", value: companies.value.length },
      { key: "active", label: "Activas", value: activeCompanies.length },
      { key: "assets", label: "Activos", value: totalAssets },
      { key: "online", label: "En linea", value: activeAssets },
      { key: "alerts", label: "Alertas", value: totalAlerts },
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
    const applicationId = buildApplicationId(companies.value.length)

    createDatabaseCompany({
      ...draftCompany.value,
      id: companyId,
      applicationId,
      name,
      rut,
      shortName: name
        .split(" ")
        .filter(Boolean)
        .slice(0, 3)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
      createdAt: new Date().toISOString().slice(0, 10),
      lastTelemetryAt: "Sin telemetria",
      workspacePath: `/app/${companyId}/activos`,
      sucursalesHabilitadas: true,
      sucursales: [],
      reports: createCompanyReports(reportTypes.value),
    })

    selectedCompanyId.value = companyId
    closeEditorModal()
  }

  const updateCompany = () => {
    if (!draftCompany.value.id) return

    const {
      assets: _assets,
      assetsCount: _assetsCount,
      activeAssetsCount: _activeAssetsCount,
      movingAssetsCount: _movingAssetsCount,
      alertsCount: _alertsCount,
      usersCount: _usersCount,
      ...companyChanges
    } = draftCompany.value

    updateDatabaseCompany(draftCompany.value.id, {
      ...companyChanges,
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

    updateDatabaseCompany(selectedCompany.value.id, {
      status: selectedCompany.value.status === "active" ? "inactive" : "active",
    })
  }

  const toggleCompanyReport = (reportId) => {
    const reportAccess = selectedCompany.value?.reports?.find((item) => item.reportId === reportId)

    if (!reportAccess || !selectedCompany.value) return

    updateDatabaseCompany(selectedCompany.value.id, {
      reports: selectedCompany.value.reports.map((item) => {
        return item.reportId === reportId ? { ...item, enabled: !item.enabled } : item
      }),
    })
  }

  const alternarSucursalesHabilitadas = () => {
    if (!selectedCompany.value) return

    updateDatabaseCompany(selectedCompany.value.id, {
      sucursalesHabilitadas: !selectedCompany.value.sucursalesHabilitadas,
    })
  }

  const agregarSucursal = (name) => {
    const nombreSucursal = name.trim()

    if (!selectedCompany.value || !nombreSucursal) return

    addDatabaseSucursal(selectedCompany.value.id, {
      id: `sucursal-${selectedCompany.value.id}-${Date.now()}`,
      name: nombreSucursal,
      active: true,
    })
  }

  const actualizarNombreSucursal = (sucursalId, name) => {
    updateSucursal(sucursalId, { name })
  }

  const alternarEstadoSucursal = (sucursalId) => {
    const sucursal = selectedCompany.value?.sucursales?.find((item) => item.id === sucursalId)

    if (!sucursal) return

    updateSucursal(sucursalId, { active: !sucursal.active })
  }

  const eliminarSucursal = (sucursalId) => {
    deleteDatabaseSucursal(sucursalId)
  }

  const actualizarSucursalActivo = ({ assetId, sucursalId }) => {
    if (!selectedCompany.value) return

    const assetBelongsToCompany = selectedCompany.value.assets?.some((asset) => {
      return String(asset.id) === String(assetId)
    })
    const siguienteSucursalId = sucursalId || null
    const sucursalExiste =
      !siguienteSucursalId ||
      selectedCompany.value.sucursales?.some((sucursal) => sucursal.id === siguienteSucursalId)

    if (!assetBelongsToCompany || !sucursalExiste) return

    updateAsset(assetId, { sucursalId: siguienteSucursalId })
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
