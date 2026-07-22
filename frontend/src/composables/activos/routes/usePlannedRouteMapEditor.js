import { computed, ref } from "vue"

const activeDraft = ref(null)
const isPlannedRoutePanelHidden = ref(false)
const plannedRouteMapNotice = ref("")
const MAX_REFERENCE_POINTS = 700
const MAX_ROUTE_POINTS = 900
const MAP_NOTICE_TIMEOUT_MS = 2600

let mapNoticeTimer = null

const getTimerApi = () => {
  return typeof window !== "undefined" ? window : globalThis
}

const createId = (prefix) => {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const hasValidCoordinates = (point) => {
  return Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng))
}

const normalizePoint = (point = {}) => {
  return {
    lat: Number(point.lat),
    lng: Number(point.lng),
  }
}

const normalizeStop = (stop = {}, index = 0) => {
  return {
    id: stop.id || createId(`stop-${index + 1}`),
    name: String(stop.name || stop.address || stop.direccion || `Parada ${index + 1}`).trim(),
    lat: Number(stop.lat),
    lng: Number(stop.lng),
  }
}

const normalizeStops = (stops = []) => {
  return stops.map(normalizeStop).filter(hasValidCoordinates)
}

const normalizeReferencePoints = (points = []) => {
  const validPoints = points.map(normalizePoint).filter(hasValidCoordinates)

  if (validPoints.length <= MAX_REFERENCE_POINTS) return validPoints

  const lastIndex = validPoints.length - 1
  const step = lastIndex / (MAX_REFERENCE_POINTS - 1)

  return Array.from({ length: MAX_REFERENCE_POINTS }, (_item, index) => {
    return validPoints[Math.round(index * step)]
  })
}

const normalizeRoutePoints = (points = []) => {
  const validPoints = points.map(normalizePoint).filter(hasValidCoordinates)

  if (validPoints.length <= MAX_ROUTE_POINTS) return validPoints

  const lastIndex = validPoints.length - 1
  const step = lastIndex / (MAX_ROUTE_POINTS - 1)

  return Array.from({ length: MAX_ROUTE_POINTS }, (_item, index) => {
    return validPoints[Math.round(index * step)]
  })
}

const buildReferencePointsSignature = (points = []) => {
  if (!points.length) return "0"

  const firstPoint = points[0]
  const middlePoint = points[Math.floor(points.length / 2)]
  const lastPoint = points[points.length - 1]

  return [
    points.length,
    firstPoint.lat,
    firstPoint.lng,
    middlePoint.lat,
    middlePoint.lng,
    lastPoint.lat,
    lastPoint.lng,
  ].join(":")
}

const buildRoutePointsSignature = (points = []) => {
  return buildReferencePointsSignature(points)
}

export const usePlannedRouteMapEditor = () => {
  const isEditingPlannedRouteOnMap = computed(() => Boolean(activeDraft.value))

  const clearPlannedRouteMapNoticeTimer = () => {
    if (!mapNoticeTimer) return

    getTimerApi().clearTimeout(mapNoticeTimer)
    mapNoticeTimer = null
  }

  const setPlannedRouteMapNotice = (message = "") => {
    clearPlannedRouteMapNoticeTimer()
    plannedRouteMapNotice.value = String(message || "").trim()

    if (!plannedRouteMapNotice.value) return

    mapNoticeTimer = getTimerApi().setTimeout(() => {
      plannedRouteMapNotice.value = ""
      mapNoticeTimer = null
    }, MAP_NOTICE_TIMEOUT_MS)
  }

  const startPlannedRouteMapEditing = ({
    routeId = "",
    routeName = "Ruta esperada",
    stops = [],
    referencePoints = [],
    routePoints = [],
    focusPoint = null,
  } = {}) => {
    const normalizedStops = normalizeStops(stops)
    const normalizedReferencePoints = normalizeReferencePoints(referencePoints)
    const normalizedRoutePoints = normalizeRoutePoints(routePoints)
    const normalizedFocusPoint = hasValidCoordinates(focusPoint) ? normalizePoint(focusPoint) : null

    activeDraft.value = {
      routeId,
      routeName,
      selectedStopId: normalizedStops[0]?.id || "",
      stops: normalizedStops,
      referencePoints: normalizedReferencePoints,
      referencePointsSignature: buildReferencePointsSignature(normalizedReferencePoints),
      routePoints: normalizedRoutePoints,
      routePointsSignature: buildRoutePointsSignature(normalizedRoutePoints),
      focusPoint: normalizedFocusPoint,
    }
    isPlannedRoutePanelHidden.value = false
    setPlannedRouteMapNotice("")
  }

  const stopPlannedRouteMapEditing = () => {
    activeDraft.value = null
    isPlannedRoutePanelHidden.value = false
    setPlannedRouteMapNotice("")
  }

  const setPlannedRoutePanelHidden = (hidden) => {
    isPlannedRoutePanelHidden.value = Boolean(hidden)
  }

  const togglePlannedRoutePanelHidden = () => {
    isPlannedRoutePanelHidden.value = !isPlannedRoutePanelHidden.value
  }

  const selectPlannedRouteStop = (stopId) => {
    if (!activeDraft.value) return

    activeDraft.value = {
      ...activeDraft.value,
      selectedStopId: stopId,
    }
  }

  const updatePlannedRouteStops = (stops = []) => {
    if (!activeDraft.value) return

    const normalizedStops = normalizeStops(stops)
    const selectedStopStillExists = normalizedStops.some((stop) => {
      return stop.id === activeDraft.value.selectedStopId
    })

    activeDraft.value = {
      ...activeDraft.value,
      selectedStopId: selectedStopStillExists
        ? activeDraft.value.selectedStopId
        : normalizedStops[normalizedStops.length - 1]?.id || "",
      stops: normalizedStops,
    }
  }

  const updatePlannedRouteRoutePoints = (routePoints = []) => {
    if (!activeDraft.value) return

    const normalizedRoutePoints = normalizeRoutePoints(routePoints)

    activeDraft.value = {
      ...activeDraft.value,
      routePoints: normalizedRoutePoints,
      routePointsSignature: buildRoutePointsSignature(normalizedRoutePoints),
    }
  }

  const addPlannedRouteStop = (latLng) => {
    if (!activeDraft.value || !hasValidCoordinates(latLng)) return

    const nextIndex = activeDraft.value.stops.length + 1
    const nextStop = {
      id: createId("stop"),
      name: `Parada ${nextIndex}`,
      lat: Number(Number(latLng.lat).toFixed(6)),
      lng: Number(Number(latLng.lng).toFixed(6)),
    }

    activeDraft.value = {
      ...activeDraft.value,
      selectedStopId: nextStop.id,
      stops: [...activeDraft.value.stops, nextStop],
    }
  }

  const movePlannedRouteStop = (stopId, latLng) => {
    if (!activeDraft.value || !hasValidCoordinates(latLng)) return

    updatePlannedRouteStops(
      activeDraft.value.stops.map((stop) => {
        if (stop.id !== stopId) return stop

        return {
          ...stop,
          lat: Number(Number(latLng.lat).toFixed(6)),
          lng: Number(Number(latLng.lng).toFixed(6)),
        }
      }),
    )
    selectPlannedRouteStop(stopId)
  }

  return {
    plannedRouteMapDraft: activeDraft,
    isEditingPlannedRouteOnMap,
    isPlannedRoutePanelHidden,
    plannedRouteMapNotice,
    startPlannedRouteMapEditing,
    stopPlannedRouteMapEditing,
    setPlannedRoutePanelHidden,
    togglePlannedRoutePanelHidden,
    setPlannedRouteMapNotice,
    selectPlannedRouteStop,
    updatePlannedRouteStops,
    updatePlannedRouteRoutePoints,
    addPlannedRouteStop,
    movePlannedRouteStop,
  }
}
