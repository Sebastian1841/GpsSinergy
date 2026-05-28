export const normalizePoint = (point) => ({
  lat: Number(point.lat.toFixed(7)),
  lng: Number(point.lng.toFixed(7)),
})

export const cloneGeofence = (geofence) => JSON.parse(JSON.stringify(geofence))

export const makeGeofenceId = () => {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `geofence-${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
}

export const toRad = (value) => (value * Math.PI) / 180

export const toDeg = (value) => (value * 180) / Math.PI

export const getCircleEdgePoint = (center, radiusMeters) => {
  const earthRadius = 6378137
  const bearing = toRad(90)

  const lat1 = toRad(center.lat)
  const lng1 = toRad(center.lng)
  const distance = radiusMeters / earthRadius

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance) +
      Math.cos(lat1) * Math.sin(distance) * Math.cos(bearing),
  )

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(distance) * Math.cos(lat1),
      Math.cos(distance) - Math.sin(lat1) * Math.sin(lat2),
    )

  return {
    lat: toDeg(lat2),
    lng: toDeg(lng2),
  }
}