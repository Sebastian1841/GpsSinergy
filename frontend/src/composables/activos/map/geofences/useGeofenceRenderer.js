import L from "leaflet"

import {
  getRouteStyle,
  getShapeStyle,
} from "./geofenceMapStyles.js"

const normalizeSignatureValue = (value) => {
  if (value === null || value === undefined) return ""

  return String(value)
}

const buildCoordinatesSignature = (coordinates = []) => {
  if (!Array.isArray(coordinates)) return ""

  return coordinates
    .map((point) => {
      return [point?.lat, point?.lng].map(normalizeSignatureValue).join(":")
    })
    .join("|")
}

const buildGeofenceSignature = (geofence = {}) => {
  return [
    geofence.id,
    geofence.type,
    geofence.name,
    geofence.strokeColor || geofence.color,
    geofence.fillColor,
    geofence.fillOpacity,
    geofence.radius,
    geofence.center?.lat,
    geofence.center?.lng,
    geofence.toleranceMeters,
    buildCoordinatesSignature(geofence.coordinates),
  ]
    .map(normalizeSignatureValue)
    .join(":")
}

const isValidLatLngValue = (lat, lng) => {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
}

const getCoordinateLatLngs = (coordinates = []) => {
  if (!Array.isArray(coordinates)) return []

  return coordinates
    .filter((point) => {
      return isValidLatLngValue(point?.lat, point?.lng)
    })
    .map((point) => [Number(point.lat), Number(point.lng)])
}

export function createGeofenceRendererController({
  props,
  getMap,
  layers,
  editingDraft,
  drawMode,
  normalizeId,
  onStartEditGeofence,
}) {
  const geofenceLayerCache = new Map()

  const removeCachedGeofenceLayer = (geofenceId) => {
    const cachedLayer = geofenceLayerCache.get(geofenceId)

    if (!cachedLayer) return

    layers.geofenceLayer?.removeLayer(cachedLayer.layer)
    geofenceLayerCache.delete(geofenceId)
  }

  const createGeofenceLayer = (geofence) => {
    let layer = null

    if (geofence.type === "circle") {
      if (!isValidLatLngValue(geofence.center?.lat, geofence.center?.lng)) return null

      layer = L.circle([Number(geofence.center.lat), Number(geofence.center.lng)], {
        ...getShapeStyle(geofence),
        radius: Number(geofence.radius) || 10,
      })
    }

    if (geofence.type === "polygon") {
      const latLngs = getCoordinateLatLngs(geofence.coordinates)

      if (latLngs.length < 3) return null

      layer = L.polygon(latLngs, getShapeStyle(geofence))
    }

    if (geofence.type === "route") {
      const latLngs = getCoordinateLatLngs(geofence.coordinates)

      if (latLngs.length < 2) return null

      layer = L.polyline(latLngs, getRouteStyle(geofence))
    }

    if (!layer) return null

    layer.bindTooltip(`${geofence.name} · clic para editar`, {
      direction: "top",
      sticky: true,
      className: "sinergy-geofence-tooltip",
    })

    layer.on("click", () => {
      if (drawMode.value) return
      onStartEditGeofence(geofence.id)
    })

    return layer
  }

  const renderGeofences = () => {
    const map = getMap()

    if (!map || !layers.geofenceLayer) return

    const nextGeofenceIds = new Set()

    ;(props.geofences || []).forEach((geofence) => {
      const geofenceId = normalizeId(geofence.id)

      if (!geofenceId) return

      if (normalizeId(editingDraft.value?.id) === geofenceId) {
        removeCachedGeofenceLayer(geofenceId)
        return
      }

      nextGeofenceIds.add(geofenceId)

      const signature = buildGeofenceSignature(geofence)
      const cachedLayer = geofenceLayerCache.get(geofenceId)

      if (cachedLayer?.signature === signature) {
        return
      }

      removeCachedGeofenceLayer(geofenceId)

      const layer = createGeofenceLayer(geofence)

      if (!layer) return

      layer.addTo(layers.geofenceLayer)

      geofenceLayerCache.set(geofenceId, {
        layer,
        signature,
      })
    })

    const staleGeofenceIds = []

    geofenceLayerCache.forEach((_cachedLayer, geofenceId) => {
      if (!nextGeofenceIds.has(geofenceId)) {
        staleGeofenceIds.push(geofenceId)
      }
    })

    staleGeofenceIds.forEach((geofenceId) => {
      removeCachedGeofenceLayer(geofenceId)
    })
  }

  const clearGeofenceCache = () => {
    geofenceLayerCache.forEach((cachedLayer) => {
      layers.geofenceLayer?.removeLayer(cachedLayer.layer)
    })

    geofenceLayerCache.clear()
  }

  return {
    renderGeofences,
    removeCachedGeofenceLayer,
    clearGeofenceCache,
  }
}