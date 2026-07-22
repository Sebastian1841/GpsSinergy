const EARTH_RADIUS_METERS = 6371000

const toRadians = (value) => (value * Math.PI) / 180

const parseCoordinate = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null

  const normalizedValue = String(value ?? "")
    .trim()
    .replace(",", ".")
  const coordinate = Number(normalizedValue)

  return Number.isFinite(coordinate) ? coordinate : null
}

const getFirstDefined = (...values) => {
  return values.find((value) => value !== null && value !== undefined && value !== "")
}

export const getAssetGeofencePoint = (asset = {}) => {
  const lat = parseCoordinate(getFirstDefined(asset.lat, asset.latitude, asset.latitud))
  const lng = parseCoordinate(
    getFirstDefined(asset.lng, asset.lon, asset.longitude, asset.longitud),
  )

  if (lat === null || lng === null) return null

  return { lat, lng }
}

const getDistanceMeters = (pointA, pointB) => {
  if (!pointA || !pointB) return Infinity

  const deltaLat = toRadians(pointB.lat - pointA.lat)
  const deltaLng = toRadians(pointB.lng - pointA.lng)
  const firstLat = toRadians(pointA.lat)
  const secondLat = toRadians(pointB.lat)
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLng / 2) ** 2

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

const projectPointToMeters = (point, referenceLat) => {
  const latRadians = toRadians(point.lat)
  const lngRadians = toRadians(point.lng)

  return {
    x: EARTH_RADIUS_METERS * lngRadians * Math.cos(toRadians(referenceLat)),
    y: EARTH_RADIUS_METERS * latRadians,
  }
}

const getPointToSegmentDistanceMeters = (point, segmentStart, segmentEnd) => {
  const referenceLat = point.lat
  const projectedPoint = projectPointToMeters(point, referenceLat)
  const projectedStart = projectPointToMeters(segmentStart, referenceLat)
  const projectedEnd = projectPointToMeters(segmentEnd, referenceLat)
  const deltaX = projectedEnd.x - projectedStart.x
  const deltaY = projectedEnd.y - projectedStart.y
  const lengthSquared = deltaX * deltaX + deltaY * deltaY

  if (!lengthSquared) return getDistanceMeters(point, segmentStart)

  const rawPosition =
    ((projectedPoint.x - projectedStart.x) * deltaX +
      (projectedPoint.y - projectedStart.y) * deltaY) /
    lengthSquared
  const position = Math.max(0, Math.min(1, rawPosition))
  const closestPoint = {
    x: projectedStart.x + position * deltaX,
    y: projectedStart.y + position * deltaY,
  }
  const distanceX = projectedPoint.x - closestPoint.x
  const distanceY = projectedPoint.y - closestPoint.y

  return Math.sqrt(distanceX * distanceX + distanceY * distanceY)
}

const isPointInsidePolygon = (point, coordinates = []) => {
  if (!point || coordinates.length < 3) return false

  let inside = false

  for (let index = 0, previousIndex = coordinates.length - 1; index < coordinates.length; index++) {
    const currentPoint = coordinates[index]
    const previousPoint = coordinates[previousIndex]
    const intersects =
      currentPoint.lng > point.lng !== previousPoint.lng > point.lng &&
      point.lat <
        ((previousPoint.lat - currentPoint.lat) * (point.lng - currentPoint.lng)) /
          (previousPoint.lng - currentPoint.lng) +
          currentPoint.lat

    if (intersects) inside = !inside

    previousIndex = index
  }

  return inside
}

const isPointInsideRoute = (point, coordinates = [], toleranceMeters = 100) => {
  if (!point || coordinates.length < 2) return false

  for (let index = 1; index < coordinates.length; index += 1) {
    const distance = getPointToSegmentDistanceMeters(
      point,
      coordinates[index - 1],
      coordinates[index],
    )

    if (distance <= toleranceMeters) return true
  }

  return false
}

export const isPointInsideGeofence = (point, geofence = {}) => {
  if (!point || !geofence?.type) return false

  if (geofence.type === "circle") {
    return getDistanceMeters(point, geofence.center) <= Number(geofence.radius || 0)
  }

  if (geofence.type === "polygon") {
    return isPointInsidePolygon(point, geofence.coordinates || [])
  }

  if (geofence.type === "route") {
    return isPointInsideRoute(
      point,
      geofence.coordinates || [],
      Number(geofence.toleranceMeters || 100),
    )
  }

  return false
}

export const getGeofenceGroupName = (geofence = {}) => {
  const sourceGeofence = geofence || {}

  return String(
    sourceGeofence.groupName ||
      sourceGeofence.group ||
      sourceGeofence.grupo ||
      sourceGeofence.groupLabel ||
      "",
  ).trim()
}

export const getGeofenceLocationLabel = (geofence = {}) => {
  const sourceGeofence = geofence || {}

  return getGeofenceGroupName(sourceGeofence) || String(sourceGeofence.name || "").trim()
}

export const getContainingGeofence = (asset = {}, geofences = []) => {
  const point = getAssetGeofencePoint(asset)

  if (!point || !Array.isArray(geofences) || !geofences.length) return null

  const containingGeofences = geofences.filter((geofence) => {
    return isPointInsideGeofence(point, geofence)
  })

  if (!containingGeofences.length) return null

  return (
    containingGeofences.find((geofence) => getGeofenceGroupName(geofence)) || containingGeofences[0]
  )
}

export const getGeofenceLocationLabelForAsset = (
  asset = {},
  geofences = [],
  { enabled = true } = {},
) => {
  if (!enabled) return ""

  const geofence = getContainingGeofence(asset, geofences)

  return getGeofenceLocationLabel(geofence)
}

export const withGeofenceLocationAddress = (
  asset = {},
  geofences = [],
  { replaceAddress = true } = {},
) => {
  const geofence = getContainingGeofence(asset, geofences)
  const locationLabel = getGeofenceLocationLabel(geofence)

  if (!locationLabel) return asset

  const assetWithGeofenceMetadata = {
    ...asset,
    geofenceName: geofence.name || locationLabel,
    geofenceGroupName: getGeofenceGroupName(geofence),
    geofenceLocationLabel: locationLabel,
  }

  if (!replaceAddress) return assetWithGeofenceMetadata

  return {
    ...assetWithGeofenceMetadata,
    resolvedAddress: locationLabel,
    address: locationLabel,
    direccion: locationLabel,
    lastPosition: locationLabel,
  }
}
