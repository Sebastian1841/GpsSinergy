import { ref } from "vue"

const MOVEMENT_TRAIL_PANE = "movementTrailPane"
const MOVEMENT_TRAIL_MAX_POINTS = 55
const MOVEMENT_TRAIL_MIN_DISTANCE_METERS = 14
const MOVEMENT_TRAIL_MAX_JUMP_METERS = 5000

const MOVEMENT_TRAIL_COLOR = "#FF6600"
const MOVEMENT_TRAIL_HALO_COLOR = "#102372"
const MOVEMENT_TRAIL_WEIGHT = 3
const MOVEMENT_TRAIL_HALO_WEIGHT = 7

const MOVEMENT_TRAIL_SATELLITE_HALO_COLOR = "#ffffff"
const MOVEMENT_TRAIL_SATELLITE_CORE_COLOR = "#FF7A1A"

export function createMovementTrailController({
  L,
  getMap,
  getMapType,
  layers,
  getActivoLatLng,
  normalizeId,
}) {
  const showMovementTrails = ref(true)
  const movementTrailCache = new Map()
  const pendingTrailIds = new Set()

  let pendingTrailFrame = null
  let cachedStartIcon = null
  let cachedStartIconSignature = ""

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

    if (!layers.movementTrailLayer) {
      layers.movementTrailLayer = L.layerGroup().addTo(map)
    }

    return layers.movementTrailLayer
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

  const removeMovementTrailLayers = (trail) => {
    const layer = ensureMovementTrailLayer()

    if (!layer || !trail) return

    if (trail.haloLine) {
      layer.removeLayer(trail.haloLine)
      trail.haloLine = null
    }

    if (trail.coreLine) {
      layer.removeLayer(trail.coreLine)
      trail.coreLine = null
    }

    if (trail.startMarker) {
      layer.removeLayer(trail.startMarker)
      trail.startMarker = null
    }

    trail.styleSignature = ""
    trail.startSignature = ""
  }

  const clearRenderedMovementTrailSegments = () => {
    movementTrailCache.forEach((trail) => {
      removeMovementTrailLayers(trail)
    })
  }

  const updateMovementTrailLayer = (activoId, { forceStyle = false } = {}) => {
    const layer = ensureMovementTrailLayer()
    const normalizedActivoId = normalizeId(activoId)
    const trail = movementTrailCache.get(normalizedActivoId)

    if (!layer || !trail) return

    if (!showMovementTrails.value || trail.points.length < 2) {
      removeMovementTrailLayers(trail)
      return
    }

    const trailStyle = getMovementTrailStyle()
    const styleSignature = getTrailStyleSignature(trailStyle)
    const shouldUpdateStyle = forceStyle || trail.styleSignature !== styleSignature
    const path = trail.points

    if (!trail.haloLine) {
      trail.haloLine = L.polyline(path, {
        pane: MOVEMENT_TRAIL_PANE,
        color: trailStyle.haloColor,
        weight: trailStyle.haloWeight,
        opacity: trailStyle.haloOpacity,
        lineCap: "round",
        lineJoin: "round",
        smoothFactor: 1.8,
        interactive: false,
      })

      trail.haloLine.addTo(layer)
    } else {
      trail.haloLine.setLatLngs(path)

      if (shouldUpdateStyle) {
        trail.haloLine.setStyle({
          color: trailStyle.haloColor,
          weight: trailStyle.haloWeight,
          opacity: trailStyle.haloOpacity,
        })
      }
    }

    if (!trail.coreLine) {
      trail.coreLine = L.polyline(path, {
        pane: MOVEMENT_TRAIL_PANE,
        color: trailStyle.coreColor,
        weight: trailStyle.coreWeight,
        opacity: trailStyle.coreOpacity,
        lineCap: "round",
        lineJoin: "round",
        smoothFactor: 1.8,
        interactive: false,
      })

      trail.coreLine.addTo(layer)
    } else {
      trail.coreLine.setLatLngs(path)

      if (shouldUpdateStyle) {
        trail.coreLine.setStyle({
          color: trailStyle.coreColor,
          weight: trailStyle.coreWeight,
          opacity: trailStyle.coreOpacity,
        })
      }
    }

    const firstPoint = path[0]
    const startSignature = getLatLngSignature(firstPoint)

    if (!trail.startMarker) {
      trail.startMarker = L.marker(firstPoint, {
        pane: MOVEMENT_TRAIL_PANE,
        icon: getTrailStartIcon(trailStyle, styleSignature),
        interactive: false,
      })

      trail.startMarker.addTo(layer)
    } else {
      if (trail.startSignature !== startSignature) {
        trail.startMarker.setLatLng(firstPoint)
      }

      if (shouldUpdateStyle) {
        trail.startMarker.setIcon(getTrailStartIcon(trailStyle, styleSignature))
      }
    }

    trail.styleSignature = styleSignature
    trail.startSignature = startSignature
  }

  const clearPendingMovementTrailUpdates = () => {
    pendingTrailIds.clear()

    if (pendingTrailFrame === null) return

    cancelTrailFrame(pendingTrailFrame)
    pendingTrailFrame = null
  }

  const flushPendingMovementTrailUpdates = () => {
    pendingTrailFrame = null

    const trailIds = Array.from(pendingTrailIds)

    pendingTrailIds.clear()

    trailIds.forEach((activoId) => {
      updateMovementTrailLayer(activoId)
    })
  }

  const scheduleMovementTrailUpdate = (activoId) => {
    const normalizedActivoId = normalizeId(activoId)

    if (!normalizedActivoId) return

    pendingTrailIds.add(normalizedActivoId)

    if (pendingTrailFrame !== null) return

    pendingTrailFrame = requestTrailFrame(flushPendingMovementTrailUpdates)
  }

  const redrawAllMovementTrails = () => {
    clearPendingMovementTrailUpdates()

    movementTrailCache.forEach((_trail, activoId) => {
      updateMovementTrailLayer(activoId, {
        forceStyle: true,
      })
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
        points: [],
        haloLine: null,
        coreLine: null,
        startMarker: null,
        styleSignature: "",
        startSignature: "",
      }

      movementTrailCache.set(activoId, trail)
    }

    const lastPoint = trail.points[trail.points.length - 1]

    if (lastPoint) {
      const distance = lastPoint.distanceTo(currentLatLng)

      if (distance < MOVEMENT_TRAIL_MIN_DISTANCE_METERS) {
        return
      }

      if (distance > MOVEMENT_TRAIL_MAX_JUMP_METERS) {
        removeMovementTrailLayers(trail)
        trail.points = [currentLatLng]
        return
      }
    }

    trail.points.push(currentLatLng)

    if (trail.points.length > MOVEMENT_TRAIL_MAX_POINTS) {
      trail.points.shift()
    }

    scheduleMovementTrailUpdate(activoId)
  }

  const removeMovementTrail = (id) => {
    const activoId = normalizeId(id)
    const trail = movementTrailCache.get(activoId)

    if (!trail) return

    pendingTrailIds.delete(activoId)
    removeMovementTrailLayers(trail)
    movementTrailCache.delete(activoId)
  }

  const clearMovementTrails = () => {
    clearPendingMovementTrailUpdates()
    clearRenderedMovementTrailSegments()
    movementTrailCache.clear()
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
    toggleMovementTrails,
    redrawAllMovementTrails,
  }
}
