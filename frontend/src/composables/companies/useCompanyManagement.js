import { computed, ref, watch } from "vue"

import { useCompaniesService } from "../../services/companies/useCompaniesService.js"
import { useDebouncedValue } from "../ui/useDebouncedValue.js"

import {
  cloneCompanyData,
  companyMatchesSearch,
  getCompanyOperationHealth,
  getCompanyWorkspacePath,
} from "../../utils/companies/companyUtils.js"

const DEFAULT_PAGE_SIZE = 8

const createEmptyDraftCompany = () => ({
  id: null,
  name: "",
  rut: "",
  status: "active",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  region: "",
  city: "",
})

const createCompanyReports = (reportTypes = []) => {
  return reportTypes.map((reportType) => ({
    reportId: reportType.id,
    enabled: true,
  }))
}

const buildCompanyId = (companiesCount) => {
  return `company-${String(companiesCount + 1).padStart(3, "0")}`
}

const buildApplicationId = (companiesCount) => {
  return `app-${String(companiesCount + 1).padStart(3, "0")}`
}

const getEnabledReportsCount = (company) => {
  return (company?.reports || []).filter((report) => report.enabled !== false).length
}

const companyMatchesStatusFilter = (company, statusFilter) => {
  if (statusFilter === "all") return true

  if (statusFilter === "inactive") {
    return company.status === "inactive" || company.status === "internal"
  }

  return company.status === statusFilter
}

export function useCompanyManagement() {
  const {
    companyRecords: companies,
    reportTypes,
    createCompany: createDatabaseCompany,
    updateCompany: updateDatabaseCompany,
  } = useCompaniesService()

  const searchTerm = ref("")
  const selectedStatus = ref("all")
  const selectedRegion = ref("all")
  const selectedCity = ref("all")

  const sortKey = ref("name")
  const sortDirection = ref("asc")
  const viewMode = ref("table")

  const currentPage = ref(1)
  const pageSize = ref(DEFAULT_PAGE_SIZE)

  const selectedCompanyId = ref(companies.value[0]?.id || null)

  const showEditorModal = ref(false)
  const editorMode = ref("create")
  const draftCompany = ref(createEmptyDraftCompany())

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 180)

  const regionOptions = computed(() => {
    return Array.from(
      new Set(companies.value.map((company) => company.region).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right, "es"))
  })

  const cityOptions = computed(() => {
    const sourceCompanies =
      selectedRegion.value === "all"
        ? companies.value
        : companies.value.filter((company) => {
            return company.region === selectedRegion.value
          })

    return Array.from(new Set(sourceCompanies.map((company) => company.city).filter(Boolean))).sort(
      (left, right) => left.localeCompare(right, "es"),
    )
  })

  const filteredCompanies = computed(() => {
    return companies.value.filter((company) => {
      const matchesSearch = companyMatchesSearch({
        company,
        term: debouncedSearchTerm.value,
      })

      const matchesStatus = companyMatchesStatusFilter(company, selectedStatus.value)

      const matchesRegion =
        selectedRegion.value === "all" || company.region === selectedRegion.value

      const matchesCity = selectedCity.value === "all" || company.city === selectedCity.value

      return matchesSearch && matchesStatus && matchesRegion && matchesCity
    })
  })

  const sortedCompanies = computed(() => {
    return [...filteredCompanies.value].sort((left, right) => {
      let leftValue
      let rightValue

      if (sortKey.value === "status") {
        leftValue = left.status || ""
        rightValue = right.status || ""
      } else if (sortKey.value === "assets") {
        leftValue = Number(left.assetsCount) || 0
        rightValue = Number(right.assetsCount) || 0
      } else if (sortKey.value === "users") {
        leftValue = Number(left.usersCount) || 0
        rightValue = Number(right.usersCount) || 0
      } else if (sortKey.value === "reports") {
        leftValue = getEnabledReportsCount(left)
        rightValue = getEnabledReportsCount(right)
      } else {
        leftValue = left.name || ""
        rightValue = right.name || ""
      }

      const result =
        typeof leftValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue), "es", {
              sensitivity: "base",
            })

      return sortDirection.value === "desc" ? -result : result
    })
  })

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(sortedCompanies.value.length / pageSize.value))
  })

  const paginatedCompanies = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value

    return sortedCompanies.value.slice(start, start + pageSize.value)
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
    const pendingCompanies = companies.value.filter((company) => company.status === "pending")
    const inactiveCompanies = companies.value.filter((company) => company.status === "inactive")
    const internalCompanies = companies.value.filter((company) => company.status === "internal")
    const totalAssets = companies.value.reduce((total, company) => {
      return total + (Number(company.assetsCount) || 0)
    }, 0)

    return [
      { key: "all", label: "Empresas", value: companies.value.length },
      { key: "active", label: "Activas", value: activeCompanies.length },
      { key: "pending", label: "Suspendidas", value: pendingCompanies.length },
      { key: "inactive", label: "Inactivas", value: inactiveCompanies.length },
      { key: "internal", label: "Internas", value: internalCompanies.length },
      { key: "assets", label: "Activos", value: totalAssets },
    ]
  })

  watch(
    [debouncedSearchTerm, selectedStatus, selectedRegion, selectedCity, sortKey, sortDirection],
    () => {
      currentPage.value = 1
    },
  )

  watch(selectedRegion, () => {
    if (selectedCity.value !== "all" && !cityOptions.value.includes(selectedCity.value)) {
      selectedCity.value = "all"
    }
  })

  watch(totalPages, (pages) => {
    if (currentPage.value > pages) {
      currentPage.value = pages
    }
  })

  const selectCompany = (companyId) => {
    selectedCompanyId.value = companyId
  }

  const clearFilters = () => {
    searchTerm.value = ""
    selectedStatus.value = "all"
    selectedRegion.value = "all"
    selectedCity.value = "all"
    currentPage.value = 1
  }

  const goToPage = (page) => {
    currentPage.value = Math.min(Math.max(Number(page) || 1, 1), totalPages.value)
  }

  const goToNextPage = () => {
    goToPage(currentPage.value + 1)
  }

  const goToPreviousPage = () => {
    goToPage(currentPage.value - 1)
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
      billingEmail: _billingEmail,
      timezone: _timezone,
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

  const getCompanyHealth = (company) => {
    return getCompanyOperationHealth(company)
  }

  return {
    companies,
    reportTypes,

    searchTerm,
    selectedStatus,
    selectedRegion,
    selectedCity,
    regionOptions,
    cityOptions,

    sortKey,
    sortDirection,
    viewMode,

    currentPage,
    pageSize,
    totalPages,

    selectedCompanyId,
    selectedCompany,

    filteredCompanies,
    sortedCompanies,
    paginatedCompanies,

    summaryItems,

    showEditorModal,
    editorMode,
    draftCompany,

    selectCompany,
    clearFilters,
    goToPage,
    goToNextPage,
    goToPreviousPage,

    openCreateCompanyModal,
    openEditCompanyModal,
    closeEditorModal,
    saveCompanyFromModal,
    toggleSelectedCompanyStatus,
    getCompanyHealth,
  }
}
