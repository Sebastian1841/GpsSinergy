import { ref } from "vue"

import { endDevMeasure, startDevMeasure } from "../../../utils/performanceUtils.js"
import {
  MOVEMENT_TRAIL_MAX_BACKGROUND_RAW_POINTS,
  MOVEMENT_TRAIL_MAX_JUMP_METERS,
  MOVEMENT_TRAIL_MAX_SELECTED_RAW_POINTS,
  MOVEMENT_TRAIL_MAX_START_MARKERS,
  MOVEMENT_TRAIL_MAX_VIEWPORT_ENTRIES,
  MOVEMENT_TRAIL_MIN_DISTANCE_METERS,
  MOVEMENT_TRAIL_MIN_RENDER_ZOOM,
  MOVEMENT_TRAIL_MIN_START_MARKER_ZOOM,
  MOVEMENT_TRAIL_PANE,
  RENDER_MOVEMENT_TRAILS_MEASURE,
} from "./movementTrails/movementTrailConstants.js"
import {
  buildRenderableTrailPoints,
  trimRawTrailPoints,
} from "./movementTrails/movementTrailData.js"
import { createMovementTrailStyleController } from "./movementTrails/movementTrailStyles.js"
import { createMovementTrailViewportController } from "./movementTrails/movementTrailViewport.js"

export function createMovementTrailController({
  L,
  getMap,
  getMapType,
  layers,
  getActivoLatLng,
  normalizeId,
  getSelectedActivoId = () => null,
  getFocusedActivoIds = () => [],
}) {
  const showMovementTrails = ref(true)
  const movementTrailCache = new Map()
  const startMarkerCache = new Map()

  let pendingTrailFrame = null
  let sharedHaloLine = null
  let sharedCoreLine = null
  let sharedStyleSignature = ""
  let focusedActivoIdSetCache = new Set()
  let focusedActivoSignatureCache = ""

  const { getMovementTrailStyle, getTrailStartIcon, getTrailStyleSignature } =
    createMovementTrailStyleController({
      L,
      getMapType,
    })

  const {
    bindMovementTrailViewportEvents,
    getViewportBounds,
    trailHasPointInsideViewport,
    unbindMovementTrailViewportEvents,
  } = createMovementTrailViewportController({
    getMap,
    scheduleRender: scheduleMovementTrailRender,
  })

  const requestTrailFrame = (callback) => {
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      return window.requestAnimationFrame(callback)
    }

    return setTimeout(callback, 16)
  }

  const cancelTrailFrame = (frameId) => {
    if (typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(frameId)
      return
    }

    clearTimeout(frameId)
  }

  const getNormalizedSelectedActivoId = () => {
    return normalizeId(getSelectedActivoId?.())
  }

  const isSelectedTrail = (activoId) => {
    const selectedActivoId = getNormalizedSelectedActivoId()

    return Boolean(selectedActivoId && selectedActivoId === normalizeId(activoId))
  }

  const getFocusedActivoIdSet = () => {
    const focusedIds = getFocusedActivoIds?.() || []
    const nextSignature = focusedIds
      .map((activoId) => normalizeId(activoId))
      .filter((activoId) => Boolean(activoId))
      .sort()
      .join("|")

    if (nextSignature !== focusedActivoSignatureCache) {
      focusedActivoSignatureCache = nextSignature
      focusedActivoIdSetCache = new Set(nextSignature ? nextSignature.split("|") : [])
    }

    return focusedActivoIdSetCache
  }

  const isTrailAllowedByFocus = (activoId) => {
    const focusedActivoIds = getFocusedActivoIdSet()

    if (!focusedActivoIds.size) return true

    return focusedActivoIds.has(normalizeId(activoId))
  }

  const getMaxRawPointsForTrail = (activoId) => {
    return isSelectedTrail(activoId)
      ? MOVEMENT_TRAIL_MAX_SELECTED_RAW_POINTS
      : MOVEMENT_TRAIL_MAX_BACKGROUND_RAW_POINTS
  }

  const ensureMovementTrailPane = () => {
    const map = getMap()

    if (!map) return

    if (!map.getPane(MOVEMENT_TRAIL_PANE)) {
      map.createPane(MOVEMENT_TRAIL_PANE)
    }

    const pane = map.getPane(MOVEMENT_TRAIL_PANE)

    if (!pane) return

    pane.style.zIndex = "430"
    pane.style.pointerEvents = "none"
  }

  const ensureMovementTrailLayer = () => {
    const map = getMap()

    if (!map) return null

    ensureMovementTrailPane()
    bindMovementTrailViewportEvents(map)

    if (!layers.movementTrailLayer) {
      layers.movementTrailLayer = L.layerGroup().addTo(map)
    }

    return layers.movementTrailLayer
  }

  const shouldRenderMovementTrails = () => {
    const map = getMap()
    const zoom = map?.getZoom?.() ?? 0

    return Boolean(showMovementTrails.value && zoom >= MOVEMENT_TRAIL_MIN_RENDER_ZOOM)
  }

  const shouldRenderStartMarkers = (entries = []) => {
    const map = getMap()
    const zoom = map?.getZoom?.() ?? 0

    return Boolean(
      showMovementTrails.value &&
      zoom >= MOVEMENT_TRAIL_MIN_START_MARKER_ZOOM &&
      entries.length <= MOVEMENT_TRAIL_MAX_START_MARKERS,
    )
  }

  const getLatLngSignature = (latLng) => {
    if (!latLng) return ""

    return `${latLng.lat}:${latLng.lng}`
  }

  const toLeafletLatLng = (activoLatLng) => {
    if (!activoLatLng) return null

    return L.latLng(activoLatLng[0], activoLatLng[1])
  }

  const getRenderableTrailEntries = () => {
    const entries = []
    const selectedEntries = []
    const viewportEntries = []
    const viewportBounds = getViewportBounds()

    movementTrailCache.forEach((trail, activoId) => {
      if ((trail.renderPoints || []).length < 2) return
      if (!isTrailAllowedByFocus(activoId)) return

      const entry = {
        activoId,
        path: trail.renderPoints,
      }

      if (isSelectedTrail(activoId)) {
        selectedEntries.push(entry)
        return
      }

      if (!trailHasPointInsideViewport(trail, viewportBounds)) {
        return
      }

      viewportEntries.push(entry)
    })

    entries.push(...selectedEntries)
    entries.push(...viewportEntries.slice(0, MOVEMENT_TRAIL_MAX_VIEWPORT_ENTRIES))

    return entries
  }

  const removeSharedMovementTrailLines = () => {
    const layer = ensureMovementTrailLayer()

    if (!layer) return

    if (sharedHaloLine) {
      layer.removeLayer(sharedHaloLine)
      sharedHaloLine = null
    }

    if (sharedCoreLine) {
      layer.removeLayer(sharedCoreLine)
      sharedCoreLine = null
    }

    sharedStyleSignature = ""
  }

  const removeStartMarker = (activoId) => {
    const cachedMarker = startMarkerCache.get(activoId)
    const layer = ensureMovementTrailLayer()

    if (!cachedMarker) return

    if (layer) {
      layer.removeLayer(cachedMarker.marker)
    }

    startMarkerCache.delete(activoId)
  }

  const clearStartMarkers = () => {
    const markerIds = Array.from(startMarkerCache.keys())

    markerIds.forEach((activoId) => {
      removeStartMarker(activoId)
    })
  }

  const clearRenderedMovementTrailSegments = () => {
    removeSharedMovementTrailLines()
    clearStartMarkers()
  }

  const syncStartMarkers = ({ entries, trailStyle, styleSignature }) => {
    const layer = ensureMovementTrailLayer()

    if (!layer) return

    if (!shouldRenderStartMarkers(entries)) {
      clearStartMarkers()
      return
    }

    const nextMarkerIds = new Set()

    entries.slice(0, MOVEMENT_TRAIL_MAX_START_MARKERS).forEach((entry) => {
      const firstPoint = entry.path[0]
      const startSignature = getLatLngSignature(firstPoint)
      const cachedMarker = startMarkerCache.get(entry.activoId)

      nextMarkerIds.add(entry.activoId)

      if (!cachedMarker) {
        const marker = L.marker(firstPoint, {
          pane: MOVEMENT_TRAIL_PANE,
          icon: getTrailStartIcon(trailStyle, styleSignature),
          interactive: false,
        })

        marker.addTo(layer)

        startMarkerCache.set(entry.activoId, {
          marker,
          startSignature,
          styleSignature,
        })

        return
      }

      if (cachedMarker.startSignature !== startSignature) {
        cachedMarker.marker.setLatLng(firstPoint)
        cachedMarker.startSignature = startSignature
      }

      if (cachedMarker.styleSignature !== styleSignature) {
        cachedMarker.marker.setIcon(getTrailStartIcon(trailStyle, styleSignature))
        cachedMarker.styleSignature = styleSignature
      }
    })

    const staleMarkerIds = []

    startMarkerCache.forEach((_cachedMarker, activoId) => {
      if (!nextMarkerIds.has(activoId)) {
        staleMarkerIds.push(activoId)
      }
    })

    staleMarkerIds.forEach((activoId) => {
      removeStartMarker(activoId)
    })
  }

  const renderMovementTrails = ({ forceStyle = false } = {}) => {
    const measure = startDevMeasure(RENDER_MOVEMENT_TRAILS_MEASURE)

    try {
      const layer = ensureMovementTrailLayer()

      if (!layer) return

      if (!shouldRenderMovementTrails()) {
        clearRenderedMovementTrailSegments()
        return
      }

      const entries = getRenderableTrailEntries()

      if (!entries.length) {
        clearRenderedMovementTrailSegments()
        return
      }

      const trailStyle = getMovementTrailStyle()
      const styleSignature = getTrailStyleSignature(trailStyle)
      const shouldUpdateStyle = forceStyle || sharedStyleSignature !== styleSignature
      const paths = entries.map((entry) => entry.path)

      if (!sharedHaloLine) {
        sharedHaloLine = L.polyline(paths, {
          pane: MOVEMENT_TRAIL_PANE,
          color: trailStyle.haloColor,
          weight: trailStyle.haloWeight,
          opacity: trailStyle.haloOpacity,
          lineCap: "round",
          lineJoin: "round",
          smoothFactor: 1.8,
          interactive: false,
        })

        sharedHaloLine.addTo(layer)
      } else {
        sharedHaloLine.setLatLngs(paths)

        if (shouldUpdateStyle) {
          sharedHaloLine.setStyle({
            color: trailStyle.haloColor,
            weight: trailStyle.haloWeight,
            opacity: trailStyle.haloOpacity,
          })
        }
      }

      if (!sharedCoreLine) {
        sharedCoreLine = L.polyline(paths, {
          pane: MOVEMENT_TRAIL_PANE,
          color: trailStyle.coreColor,
          weight: trailStyle.coreWeight,
          opacity: trailStyle.coreOpacity,
          lineCap: "round",
          lineJoin: "round",
          smoothFactor: 1.8,
          interactive: false,
        })

        sharedCoreLine.addTo(layer)
      } else {
        sharedCoreLine.setLatLngs(paths)

        if (shouldUpdateStyle) {
          sharedCoreLine.setStyle({
            color: trailStyle.coreColor,
            weight: trailStyle.coreWeight,
            opacity: trailStyle.coreOpacity,
          })
        }
      }

      syncStartMarkers({
        entries,
        trailStyle,
        styleSignature,
      })

      sharedStyleSignature = styleSignature
    } finally {
      endDevMeasure(measure)
    }
  }

  const clearPendingMovementTrailUpdates = () => {
    if (pendingTrailFrame === null) return

    cancelTrailFrame(pendingTrailFrame)
    pendingTrailFrame = null
  }

  const flushPendingMovementTrailUpdates = () => {
    pendingTrailFrame = null
    renderMovementTrails()
  }

  function scheduleMovementTrailRender() {
    if (pendingTrailFrame !== null) return

    pendingTrailFrame = requestTrailFrame(flushPendingMovementTrailUpdates)
  }

  const trimAllRawTrailsBySelection = () => {
    movementTrailCache.forEach((trail, activoId) => {
      trimRawTrailPoints(trail.rawPoints, getMaxRawPointsForTrail(activoId))
    })
  }

  const redrawAllMovementTrails = () => {
    clearPendingMovementTrailUpdates()
    trimAllRawTrailsBySelection()

    movementTrailCache.forEach((trail) => {
      trail.renderPoints = buildRenderableTrailPoints(trail.rawPoints)
    })

    renderMovementTrails({
      forceStyle: true,
    })
  }

  const rebuildMovementTrail = (activoId) => {
    const normalizedActivoId = normalizeId(activoId)
    const trail = movementTrailCache.get(normalizedActivoId)

    if (!trail) return

    trimRawTrailPoints(trail.rawPoints, getMaxRawPointsForTrail(normalizedActivoId))
    trail.renderPoints = buildRenderableTrailPoints(trail.rawPoints)
  }

  const refreshMovementTrailSelection = ({ previousId = "", nextId = "" } = {}) => {
    clearPendingMovementTrailUpdates()

    const changedIds = new Set([normalizeId(previousId), normalizeId(nextId)].filter(Boolean))

    changedIds.forEach((activoId) => {
      rebuildMovementTrail(activoId)
    })

    renderMovementTrails()
  }

  const refreshMovementTrailVisibility = () => {
    scheduleMovementTrailRender()
  }

  const refreshMovementTrailStyle = () => {
    clearPendingMovementTrailUpdates()

    renderMovementTrails({
      forceStyle: true,
    })
  }

  const registerMovementTrailPoint = (activo) => {
    if (!activo) return

    const activoId = normalizeId(activo.id)
    const activoLatLng = getActivoLatLng(activo)
    const currentLatLng = toLeafletLatLng(activoLatLng)

    if (!activoId || !currentLatLng) return

    let trail = movementTrailCache.get(activoId)

    if (!trail) {
      trail = {
        rawPoints: [],
        renderPoints: [],
      }

      movementTrailCache.set(activoId, trail)
    }

    const lastPoint = trail.rawPoints[trail.rawPoints.length - 1]

    if (lastPoint) {
      const distance = lastPoint.distanceTo(currentLatLng)

      if (distance < MOVEMENT_TRAIL_MIN_DISTANCE_METERS) {
        return
      }

      if (distance > MOVEMENT_TRAIL_MAX_JUMP_METERS) {
        trail.rawPoints = [currentLatLng]
        trail.renderPoints = [currentLatLng]
        scheduleMovementTrailRender()
        return
      }
    }

    trail.rawPoints.push(currentLatLng)
    trimRawTrailPoints(trail.rawPoints, getMaxRawPointsForTrail(activoId))
    trail.renderPoints = buildRenderableTrailPoints(trail.rawPoints)

    scheduleMovementTrailRender()
  }

  const removeMovementTrail = (id) => {
    const activoId = normalizeId(id)

    if (!movementTrailCache.has(activoId)) return

    movementTrailCache.delete(activoId)
    removeStartMarker(activoId)
    scheduleMovementTrailRender()
  }

  const clearMovementTrails = () => {
    clearPendingMovementTrailUpdates()
    clearRenderedMovementTrailSegments()
    movementTrailCache.clear()
  }

  const cleanupMovementTrails = () => {
    clearMovementTrails()
    unbindMovementTrailViewportEvents()
  }

  const toggleMovementTrails = () => {
    showMovementTrails.value = !showMovementTrails.value

    if (!showMovementTrails.value) {
      clearPendingMovementTrailUpdates()
      clearRenderedMovementTrailSegments()
      return
    }

    redrawAllMovementTrails()
  }

  return {
    showMovementTrails,
    ensureMovementTrailPane,
    registerMovementTrailPoint,
    removeMovementTrail,
    clearMovementTrails,
    cleanupMovementTrails,
    toggleMovementTrails,
    redrawAllMovementTrails,
    refreshMovementTrailSelection,
    refreshMovementTrailStyle,
    refreshMovementTrailVisibility,
  }
}
