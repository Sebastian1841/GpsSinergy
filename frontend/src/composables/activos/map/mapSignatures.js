const normalizeSignatureValue = (value) => {
  if (value === null || value === undefined) return ""

  return String(value)
}

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

const buildPointsSignature = (points = []) => {
  if (!Array.isArray(points)) return ""

  return points.map(buildPointSignature).join("|")
}

const buildGeofenceCoordinatesSignature = (coordinates = []) => {
  if (!Array.isArray(coordinates)) return ""

  return coordinates
    .map((point) => {
      return [point?.lat, point?.lng].map(normalizeSignatureValue).join(":")
    })
    .join("|")
}

const buildGeofencesSignature = (geofences = []) => {
  if (!Array.isArray(geofences)) return ""

  return geofences
    .map((geofence) => {
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
        buildGeofenceCoordinatesSignature(geofence.coordinates),
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
      const points = item.points || item.rows || []

      return [
        index,
        item.id,
        item.asset?.id || route.asset?.id,
        item.asset?.activoId || route.asset?.activoId,
        buildPointsSignature(points),
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