import { computed } from "vue"

export function useMaintenanceCompanyScope({ assets, companies, route }) {
  const routeCompanyId = computed(() => String(route.params.empresaId || ""))

  const companiesById = computed(() => {
    return new Map(companies.value.map((company) => [String(company.id), company]))
  })

  const currentCompany = computed(() => {
    if (!routeCompanyId.value) return null

    return companiesById.value.get(routeCompanyId.value) || null
  })

  const activeCompanyLabel = computed(() => {
    return currentCompany.value?.name || "Todas las empresas"
  })

  const scopedAssets = computed(() => {
    if (!routeCompanyId.value) return assets.value

    return assets.value.filter((asset) => {
      return String(asset.companyId) === routeCompanyId.value
    })
  })

  const getCompanyName = (companyId) => {
    return companiesById.value.get(String(companyId))?.name || "Sin empresa"
  }

  return {
    activeCompanyLabel,
    currentCompany,
    getCompanyName,
    routeCompanyId,
    scopedAssets,
  }
}
