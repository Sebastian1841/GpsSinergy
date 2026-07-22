import { computed } from "vue"

export function useActivosPermissions({ activeCompanyId, canAccessFunction }) {
  const permissionCompanyId = computed(() => {
    return activeCompanyId.value || null
  })

  const canManageAssets = computed(() => {
    return Boolean(
      activeCompanyId.value && canAccessFunction("gps", permissionCompanyId.value, "edit"),
    )
  })

  const canCreateAssets = computed(() => {
    return canManageAssets.value
  })

  const canViewGps = computed(() => {
    return Boolean(
      activeCompanyId.value && canAccessFunction("gps", permissionCompanyId.value, "view"),
    )
  })

  const canViewReports = computed(() => {
    return Boolean(
      activeCompanyId.value && canAccessFunction("reports", permissionCompanyId.value, "view"),
    )
  })

  const canViewItineraries = computed(() => {
    return Boolean(
      activeCompanyId.value && canAccessFunction("itineraries", permissionCompanyId.value, "view"),
    )
  })

  const canViewGeofences = computed(() => {
    return Boolean(
      activeCompanyId.value && canAccessFunction("geofences", permissionCompanyId.value, "view"),
    )
  })

  const canEditGeofences = computed(() => {
    return Boolean(
      activeCompanyId.value && canAccessFunction("geofences", permissionCompanyId.value, "edit"),
    )
  })

  const canViewSucursales = computed(() => {
    return Boolean(
      activeCompanyId.value && canAccessFunction("branches", permissionCompanyId.value, "view"),
    )
  })

  const canManageSucursales = computed(() => {
    return Boolean(
      activeCompanyId.value && canAccessFunction("branches", permissionCompanyId.value, "edit"),
    )
  })

  const allowedSidebarSections = computed(() => {
    const sections = []

    if (canViewGps.value) sections.push("activos")
    if (canViewReports.value) sections.push("reportes")
    if (canViewItineraries.value) sections.push("itinerarios")
    if (canViewGeofences.value) sections.push("geocercas")
    if (canViewSucursales.value) sections.push("sucursales")

    return sections
  })

  return {
    allowedSidebarSections,
    canCreateAssets,
    canEditGeofences,
    canManageAssets,
    canManageSucursales,
    canViewGeofences,
    canViewGps,
    canViewItineraries,
    canViewReports,
    canViewSucursales,
  }
}
