import {
  buildCoordinatesSignature,
  normalizeSignatureValue,
} from "../../../utils/mapSignatureUtils.js"

const buildPointSignature = (point) => {
  if (!point) return ""

  return [
    point.id,
    point.lat,
    point.lng,
    point.speed,
    point.index,
    point.timeLabel,
    point.speedLabel,
    point.address,
    point.event,
    point.isCurrentLocation,
  ]
    .map(normalizeSignatureValue)
    .join(":")
}

const hashSignatureValue = (hash, value) => {
  const text = normalizeSignatureValue(value)
  let nextHash = hash

  for (let index = 0; index < text.length; index += 1) {
    nextHash ^= text.charCodeAt(index)
    nextHash = Math.imul(nextHash, 16777619)
  }

  nextHash ^= 124
  nextHash = Math.imul(nextHash, 16777619)

  return nextHash
}

const buildRoutePointsCompactHash = (points = []) => {
  if (!Array.isArray(points) || !points.length) return ""

  let hash = 2166136261

  points.forEach((point) => {
    ;[
      point?.id,
      point?.lat,
      point?.lng,
      point?.speed,
      point?.index,
      point?.timeLabel,
      point?.speedLabel,
      point?.address,
      point?.event,
      point?.isCurrentLocation,
    ].forEach((value) => {
      hash = hashSignatureValue(hash, value)
    })
  })

  return (hash >>> 0).toString(36)
}

const getRoutePoints = (routeItem = {}) => {
  if (Array.isArray(routeItem.points)) {
    return routeItem.points
  }

  if (Array.isArray(routeItem.rows)) {
    return routeItem.rows
  }

  return []
}

const buildRoutePointsLightSignature = (points = []) => {
  if (!Array.isArray(points) || !points.length) return ""

  const firstPoint = points[0]
  const middlePoint = points[Math.floor(points.length / 2)]
  const lastPoint = points[points.length - 1]

  return [
    points.length,
    buildPointSignature(firstPoint),
    buildPointSignature(middlePoint),
    buildPointSignature(lastPoint),
    buildRoutePointsCompactHash(points),
  ]
    .map(normalizeSignatureValue)
    .join(":")
}

const buildGeofencesSignature = (geofences = []) => {
  if (!Array.isArray(geofences)) return ""

  return geofences
    .map((geofence) => {
      return [
        geofence.id,
        geofence.type,
        geofence.name,
        geofence.groupName,
        geofence.color,
        geofence.radius,
        geofence.center?.lat,
        geofence.center?.lng,
        geofence.toleranceMeters,
        buildCoordinatesSignature(geofence.coordinates),
      ]
        .map(normalizeSignatureValue)
        .join(":")
    })
    .join("|")
}

const buildItineraryRouteSignature = (route) => {
  if (!route) return ""

  const sourceRoutes = Array.isArray(route.routes) && route.routes.length ? route.routes : [route]

  return sourceRoutes
    .map((item, index) => {
      const points = getRoutePoints(item)

      return [
        index,
        item.id,
        item.updatedAt,
        item.updated_at,
        item.version,
        item.asset?.id || route.asset?.id,
        item.asset?.activoId || route.asset?.activoId,
        item.summary?.distance,
        item.summary?.duration,
        buildRoutePointsLightSignature(points),
      ]
        .map(normalizeSignatureValue)
        .join(":")
    })
    .join("|")
}

const buildSelectedItineraryPointSignature = (point) => {
  return buildPointSignature(point)
}

export {
  buildGeofencesSignature,
  buildItineraryRouteSignature,
  buildSelectedItineraryPointSignature,
}
