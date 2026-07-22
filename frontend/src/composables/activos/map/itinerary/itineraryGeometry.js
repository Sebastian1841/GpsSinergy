import { ITINERARY_MAX_RENDER_POINTS } from "./itineraryConstants.js"

const toRad = (value) => (value * Math.PI) / 180
const toDeg = (value) => (value * 180) / Math.PI

export const isValidLatLng = (point) => {
  if (!point) return false

  const lat = Number(point.lat)
  const lng = Number(point.lng)

  return Number.isFinite(lat) && Number.isFinite(lng)
}

export const toLatLng = (point) => {
  return [Number(point.lat), Number(point.lng)]
}

export const buildRenderableItineraryPoints = (points = []) => {
  if (!Array.isArray(points)) return []

  if (points.length <= ITINERARY_MAX_RENDER_POINTS) {
    return [...points]
  }

  const renderPoints = []
  const lastIndex = points.length - 1
  const step = lastIndex / (ITINERARY_MAX_RENDER_POINTS - 1)

  for (let index = 0; index < ITINERARY_MAX_RENDER_POINTS; index += 1) {
    const point = points[Math.round(index * step)]

    if (point) {
      renderPoints.push(point)
    }
  }

  return renderPoints
}

export const getBearing = (fromPoint, toPoint) => {
  const lat1 = toRad(Number(fromPoint.lat))
  const lat2 = toRad(Number(toPoint.lat))
  const deltaLng = toRad(Number(toPoint.lng) - Number(fromPoint.lng))

  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

  return (toDeg(Math.atan2(y, x)) + 360) % 360
}
