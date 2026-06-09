import { ref } from "vue"

import { endDevMeasure, startDevMeasure } from "../../../utils/performanceUtils.js"

const MOVEMENT_TRAIL_PANE = "movementTrailPane"

const MOVEMENT_TRAIL_MAX_BACKGROUND_RAW_POINTS = 140
const MOVEMENT_TRAIL_MAX_SELECTED_RAW_POINTS = 900
const MOVEMENT_TRAIL_MAX_RENDER_POINTS = 55
const MOVEMENT_TRAIL_MAX_VIEWPORT_ENTRIES = 350

const MOVEMENT_TRAIL_MIN_RENDER_ZOOM = 13
const MOVEMENT_TRAIL_MIN_START_MARKER_ZOOM = 15
const MOVEMENT_TRAIL_MAX_START_MARKERS = 80
const MOVEMENT_TRAIL_MIN_DISTANCE_METERS = 14
const MOVEMENT_TRAIL_MAX_JUMP_METERS = 5000
const MOVEMENT_TRAIL_VIEWPORT_PADDING = 0.18

const MOVEMENT_TRAIL_COLOR = "#FF6600"
const MOVEMENT_TRAIL_HALO_COLOR = "#102372"
const MOVEMENT_TRAIL_WEIGHT = 3
const MOVEMENT_TRAIL_HALO_WEIGHT = 7

const MOVEMENT_TRAIL_SATELLITE_HALO_COLOR = "#ffffff"
const MOVEMENT_TRAIL_SATELLITE_CORE_COLOR = "#FF7A1A"

const RENDER_MOVEMENT_TRAILS_MEASURE = "renderMovementTrails"

const buildRenderableTrailPoints = (points = []) => {
  if (!Array.isArray(points)) return []

  if (points.length <= MOVEMENT_TRAIL_MAX_RENDER_POINTS) {
    return [...points]
  }

  const renderPoints = []
  const lastIndex = points.length - 1
  const step = lastIndex / (MOVEMENT_TRAIL_MAX_RENDER_POINTS - 1)

  for (let index = 0; index < MOVEMENT_TRAIL_MAX_RENDER_POINTS; index += 1) {
    const pointIndex = Math.round(index * step)
    const point = points[pointIndex]

    if (point) {
      renderPoints.push(point)
    }
  }

  return renderPoints
}

const trimRawTrailPoints = (points = [], maxPoints = MOVEMENT_TRAIL_MAX_BACKGROUND_RAW_POINTS) => {
  if (!Array.isArray(points)) return []

  if (points.length <= maxPoints) {
    return points
  }

  points.splice(0, points.length - maxPoints)

  return points
}

export function createMovementTrailController({
  L,
  getMap,
  getMapType,
  layers,
  getActivoLatLng,
  normalizeId,
  getSelectedActivoId = () => null,
}) {
  const showMovementTrails = ref(true)
  const movementTrailCache = new Map()
  const startMarkerCache = new Map()

  let pendingTrailFrame = null
  let sharedHaloLine = null
  let sharedCoreLine = null
  let sharedStyleSignature = ""
  let cachedStartIcon = null
  let cachedStartIconSignature = ""
  let boundViewportMap = null

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

  const getMaxRawPointsForTrail = (activoId) => {
    return isSelectedTrail(activoId)
      ? MOVEMENT_TRAIL_MAX_SELECTED_RAW_POINTS
      : MOVEMENT_TRAIL_MAX_BACKGROUND_RAW_POINTS
  }

  const getViewportBounds = () => {
    const map = getMap()
    const bounds = map?.getBounds?.()

    if (!bounds) return null

    if (typeof bounds.pad === "function") {
      return bounds.pad(MOVEMENT_TRAIL_VIEWPORT_PADDING)
    }

    return bounds
  }

  const trailHasPointInsideViewport = (trail, viewportBounds) => {
    if (!trail || !viewportBounds) return true

    const points = trail.renderPoints?.length ? trail.renderPoints : trail.rawPoints

    if (!points?.length) return false

    const lastPoint = points[points.length - 1]

    if (lastPoint && viewportBounds.contains(lastPoint)) {
      return true
    }

    return points.some((point) => viewportBounds.contains(point))
  }

  const bindMovementTrailViewportEvents = (map) => {
    if (!map || boundViewportMap === map) return

    if (boundViewportMap) {
      boundViewportMap.off("moveend zoomend resize", scheduleMovementTrailRender)
    }

    boundViewportMap = map
    boundViewportMap.on("moveend zoomend resize", scheduleMovementTrailRender)
  }

  const unbindMovementTrailViewportEvents = () => {
    if (!boundViewportMap) return

    boundViewportMap.off("moveend zoomend resize", scheduleMovementTrailRender)
    boundViewportMap = null
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

  const getMovementTrailStyle = () => {
    const isSatellite = getMapType() === "satellite"

    if (isSatellite) {
      return {
        haloColor: MOVEMENT_TRAIL_SATELLITE_HALO_COLOR,
        haloWeight: 9,
        haloOpacity: 0.72,
        coreColor: MOVEMENT_TRAIL_SATELLITE_CORE_COLOR,
        coreWeight: 4,
        coreOpacity: 0.95,
        startBorderColor: MOVEMENT_TRAIL_SATELLITE_CORE_COLOR,
        startBackground: "#ffffff",
        startShadow: "0 2px 8px rgba(0, 0, 0, 0.45)",
      }
    }

    return {
      haloColor: MOVEMENT_TRAIL_HALO_COLOR,
      haloWeight: MOVEMENT_TRAIL_HALO_WEIGHT,
      haloOpacity: 0.1,
      coreColor: MOVEMENT_TRAIL_COLOR,
      coreWeight: MOVEMENT_TRAIL_WEIGHT,
      coreOpacity: 0.68,
      startBorderColor: MOVEMENT_TRAIL_COLOR,
      startBackground: "#ffffff",
      startShadow: "0 2px 6px rgba(16, 35, 114, 0.22)",
    }
  }

  const getTrailStyleSignature = (trailStyle) => {
    return [
      trailStyle.haloColor,
      trailStyle.haloWeight,
      trailStyle.haloOpacity,
      trailStyle.coreColor,
      trailStyle.coreWeight,
      trailStyle.coreOpacity,
      trailStyle.startBorderColor,
      trailStyle.startBackground,
      trailStyle.startShadow,
      getMapType(),
    ].join(":")
  }

  const getLatLngSignature = (latLng) => {
    if (!latLng) return ""

    return `${latLng.lat}:${latLng.lng}`
  }

  const getTrailStartIcon = (trailStyle, styleSignature) => {
    if (cachedStartIcon && cachedStartIconSignature === styleSignature) {
      return cachedStartIcon
    }

    const size = getMapType() === "satellite" ? 12 : 10
    const half = size / 2

    cachedStartIcon = L.divIcon({
      className: "",
      html: `
        <div
          style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 999px;
            background: ${trailStyle.startBackground};
            border: 2px solid ${trailStyle.startBorderColor};
            box-shadow: ${trailStyle.startShadow};
          "
        ></div>
      `,
      iconSize: [size, size],
      iconAnchor: [half, half],
    })

    cachedStartIconSignature = styleSignature

    return cachedStartIcon
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
  }
}
