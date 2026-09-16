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

  const canViewAssetTags = computed(() => {
    return canViewGps.value
  })

  const canManageAssetTags = computed(() => {
    return canManageAssets.value
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

  const canViewMaintenance = computed(() => {
    return Boolean(
      activeCompanyId.value &&
      canAccessFunction("maintenance-view", permissionCompanyId.value, "view"),
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

  const canViewAlerts = computed(() => {
    return Boolean(
      activeCompanyId.value && canAccessFunction("alarms", permissionCompanyId.value, "view"),
    )
  })

  const allowedSidebarSections = computed(() => {
    const sections = []

    if (canViewGps.value) sections.push("activos")
    if (canViewReports.value) sections.push("reportes")
    if (canViewItineraries.value) sections.push("itinerarios")
    if (canViewGeofences.value) sections.push("geocercas")
    if (canViewAssetTags.value) sections.push("etiquetas")
    if (canViewAlerts.value) sections.push("alertas")

    return sections
  })

  return {
    allowedSidebarSections,
    canCreateAssets,
    canEditGeofences,
    canManageAssets,
    canManageAssetTags,
    canViewAlerts,
    canViewAssetTags,
    canViewGeofences,
    canViewGps,
    canViewItineraries,
    canViewMaintenance,
    canViewReports,
  }
}
