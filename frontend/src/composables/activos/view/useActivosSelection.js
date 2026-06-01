import { ref } from "vue"

export function useActivosSelection({
  baseSelectedId,
  getMapActivos,
  activeSidebarSection,
  refreshMapLayout,
}) {
  const selectedId = ref(baseSelectedId || null)
  const selectedGeofenceId = ref(null)
  const selectedItineraryRoute = ref(null)
  const selectedItineraryPoint = ref(null)

  const resolveMapActivos = () => {
    const activos = getMapActivos?.()

    return Array.isArray(activos) ? activos : []
  }

  const ensureSelectedActivo = () => {
    const activos = resolveMapActivos()

    if (!activos.length) {
      selectedId.value = null
      return
    }

    const selectedExists = activos.some((activo) => {
      return String(activo.id) === String(selectedId.value)
    })

    if (selectedExists) return

    selectedId.value = activos[0]?.id || null
  }

  const selectActivo = async (id) => {
    selectedId.value = id

    await refreshMapLayout(true)
  }

  const clearSelectedItinerary = () => {
    selectedItineraryRoute.value = null
    selectedItineraryPoint.value = null
  }

  const handleClearGeofenceSelection = () => {
    selectedGeofenceId.value = null
  }

  const handleSidebarGeofenceSelected = async (geofence) => {
    if (!geofence?.id) return

    selectedGeofenceId.value = geofence.id
    activeSidebarSection.value = "geocercas"

    await refreshMapLayout(true)
  }

  const handleItineraryRouteSelected = async (route) => {
    selectedItineraryRoute.value = route
    selectedItineraryPoint.value = null
    activeSidebarSection.value = "itinerarios"

    const routeAssetId = route?.asset?.activoId || route?.asset?.id

    if (routeAssetId) {
      selectedId.value = routeAssetId
    }

    await refreshMapLayout(true)
  }

  const handleItineraryPointSelected = async (payload) => {
    selectedItineraryPoint.value = payload?.point || payload || null
    activeSidebarSection.value = "itinerarios"

    await refreshMapLayout()
  }

  const handleClearItineraryRoute = async () => {
    clearSelectedItinerary()

    await refreshMapLayout(true)
  }

  return {
    selectedId,
    selectedGeofenceId,
    selectedItineraryRoute,
    selectedItineraryPoint,

    ensureSelectedActivo,
    selectActivo,
    clearSelectedItinerary,
    handleClearGeofenceSelection,
    handleSidebarGeofenceSelected,
    handleItineraryRouteSelected,
    handleItineraryPointSelected,
    handleClearItineraryRoute,
  }
}
