import { ref, watch } from "vue"

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
  const userClearedSelectedActivo = ref(false)

  const normalizeSelectionId = (id) => {
    if (id === null || id === undefined || String(id).trim() === "") return null

    return id
  }

  const sameSelectionId = (firstId, secondId) => {
    const normalizedFirstId = normalizeSelectionId(firstId)
    const normalizedSecondId = normalizeSelectionId(secondId)

    if (normalizedFirstId === null || normalizedSecondId === null) return false

    return String(normalizedFirstId) === String(normalizedSecondId)
  }

  const resolveMapActivos = () => {
    const activos = getMapActivos?.()

    return Array.isArray(activos) ? activos : []
  }

  const ensureSelectedActivo = ({ force = false } = {}) => {
    const activos = resolveMapActivos()

    if (!activos.length) {
      selectedId.value = null
      return
    }

    const selectedExists = activos.some((activo) => {
      return String(activo.id) === String(selectedId.value)
    })

    if (selectedExists) return

    if (userClearedSelectedActivo.value && !force) return

    selectedId.value = activos[0]?.id || null
  }

  const selectActivo = async (id) => {
    const isSameSelectedActivo = sameSelectionId(selectedId.value, id)
    const nextSelectedId = isSameSelectedActivo ? null : normalizeSelectionId(id)

    selectedId.value = nextSelectedId
    userClearedSelectedActivo.value = nextSelectedId === null

    await refreshMapLayout(!isSameSelectedActivo)
  }

  const clearSelectedItinerary = () => {
    selectedItineraryRoute.value = null
    selectedItineraryPoint.value = null
  }

  const handleClearGeofenceSelection = () => {
    selectedGeofenceId.value = null
  }

  const handleSidebarGeofenceSelected = async (geofence) => {
    const geofenceId = geofence?.id ?? geofence

    if (!geofenceId) return

    const isSameSelectedGeofence = sameSelectionId(selectedGeofenceId.value, geofenceId)

    activeSidebarSection.value = "geocercas"

    await refreshMapLayout()

    if (!isSameSelectedGeofence) {
      selectedGeofenceId.value = geofenceId
    }
  }

  const handleItineraryRouteSelected = async (route) => {
    selectedItineraryRoute.value = route
    selectedItineraryPoint.value = null
    activeSidebarSection.value = "itinerarios"

    const routeAssetId = route?.asset?.activoId || route?.asset?.id

    if (routeAssetId) {
      selectedId.value = routeAssetId
      userClearedSelectedActivo.value = false
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

  watch(selectedId, (id) => {
    if (normalizeSelectionId(id) !== null) {
      userClearedSelectedActivo.value = false
    }
  })

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
