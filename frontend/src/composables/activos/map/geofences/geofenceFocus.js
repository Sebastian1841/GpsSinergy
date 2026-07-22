import L from "leaflet"

const isValidLatLngValue = (lat, lng) => {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
}

const getGeofenceCoordinateLatLngs = (coordinates = []) => {
  if (!Array.isArray(coordinates)) return []

  return coordinates
    .filter((point) => isValidLatLngValue(point?.lat, point?.lng))
    .map((point) => [Number(point.lat), Number(point.lng)])
}

export const getGeofenceBounds = (geofence) => {
  if (!geofence) return null

  if (geofence.type === "circle") {
    if (!isValidLatLngValue(geofence.center?.lat, geofence.center?.lng)) return null

    const center = L.latLng(Number(geofence.center.lat), Number(geofence.center.lng))
    const radius = Math.max(Number(geofence.radius) || 10, 10)

    return center.toBounds(radius * 2)
  }

  if (geofence.type === "polygon" || geofence.type === "route") {
    const latLngs = getGeofenceCoordinateLatLngs(geofence.coordinates)

    if (latLngs.length < 2) return null

    return L.latLngBounds(latLngs)
  }

  return null
}

const applyMapFocus = ({ map, bounds, geofence, animate }) => {
  map.stop?.()
  map.invalidateSize?.({
    pan: false,
    debounceMoveend: true,
  })

  const northEast = bounds.getNorthEast()
  const southWest = bounds.getSouthWest()

  if (northEast.equals(southWest)) {
    const targetZoom = Math.max(map.getZoom?.() || 13, 16)

    map.flyTo?.(bounds.getCenter(), targetZoom, {
      animate,
      duration: animate ? 0.7 : 0,
      easeLinearity: 0.22,
    })
    return
  }

  const fitOptions = {
    paddingTopLeft: [72, 72],
    paddingBottomRight: [72, 72],
    maxZoom: geofence.type === "circle" ? 17 : 16,
    animate,
    duration: animate ? 0.7 : 0,
    easeLinearity: 0.22,
  }

  if (animate && typeof map.flyToBounds === "function") {
    map.flyToBounds(bounds, fitOptions)
    return
  }

  map.fitBounds(bounds, fitOptions)
}

export const focusGeofenceOnMap = ({ map, geofence, animate = true }) => {
  const bounds = getGeofenceBounds(geofence)

  if (!map || !bounds?.isValid?.()) return

  const scheduleFrame =
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (callback) => globalThis.setTimeout?.(callback, 16) ?? callback()

  scheduleFrame(() => {
    applyMapFocus({ map, bounds, geofence, animate })
  })
}
