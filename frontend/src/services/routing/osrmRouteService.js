const DEFAULT_OSRM_BASE_URL = "https://router.project-osrm.org"
const DEFAULT_PROFILE = "driving"
const DEFAULT_SNAP_RADIUS_METERS = 80
const MAX_ROUTE_GEOMETRY_POINTS = 900

const getOsrmBaseUrl = () => {
  return String(import.meta.env?.VITE_OSRM_BASE_URL || DEFAULT_OSRM_BASE_URL).replace(/\/+$/, "")
}

const hasValidCoordinates = (point) => {
  return Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng))
}

const normalizePoint = (point = {}) => {
  return {
    lat: Number(point.lat),
    lng: Number(point.lng),
  }
}

const samplePoints = (points = [], limit = MAX_ROUTE_GEOMETRY_POINTS) => {
  if (points.length <= limit) return points

  const lastIndex = points.length - 1
  const step = lastIndex / (limit - 1)

  return Array.from({ length: limit }, (_item, index) => {
    return points[Math.round(index * step)]
  })
}

const buildCoordinatesParam = (points = []) => {
  return points
    .map((point) => {
      return `${Number(point.lng).toFixed(6)},${Number(point.lat).toFixed(6)}`
    })
    .join(";")
}

const buildRadiusesParam = (points = [], radiusMeters = DEFAULT_SNAP_RADIUS_METERS) => {
  return points
    .map(() => {
      return String(radiusMeters)
    })
    .join(";")
}

const parseOsrmRoute = (payload = {}) => {
  const route = Array.isArray(payload.routes) ? payload.routes[0] : null
  const coordinates = route?.geometry?.coordinates

  if (!route || !Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error(payload.message || "No se pudo calcular la ruta por calles.")
  }

  const points = coordinates
    .map(([lng, lat]) => {
      return {
        lat: Number(lat),
        lng: Number(lng),
      }
    })
    .filter(hasValidCoordinates)

  if (points.length < 2) {
    throw new Error("La ruta calculada no tiene geometria suficiente.")
  }

  return {
    provider: "osrm",
    points: samplePoints(points),
    distanceMeters: Number(route.distance || 0),
    durationSeconds: Number(route.duration || 0),
  }
}

const parseOsrmNearestPoint = (payload = {}, radiusMeters = DEFAULT_SNAP_RADIUS_METERS) => {
  const waypoint = Array.isArray(payload.waypoints) ? payload.waypoints[0] : null
  const [lng, lat] = Array.isArray(waypoint?.location) ? waypoint.location : []
  const distanceMeters = Number(waypoint?.distance)

  if (!waypoint || !hasValidCoordinates({ lat, lng }) || !Number.isFinite(distanceMeters)) {
    throw new Error(payload.message || "Marca el punto sobre una calle habilitada.")
  }

  if (distanceMeters > radiusMeters) {
    throw new Error("Marca el punto sobre una calle habilitada.")
  }

  return {
    provider: "osrm",
    lat: Number(lat),
    lng: Number(lng),
    name: waypoint.name || "",
    distanceMeters,
  }
}

export const buildRoutingStopsSignature = (points = []) => {
  return points
    .filter(hasValidCoordinates)
    .map((point) => {
      return `${Number(point.lat).toFixed(6)}:${Number(point.lng).toFixed(6)}`
    })
    .join("|")
}

export const snapOsrmPointToRoad = async ({
  point,
  profile = DEFAULT_PROFILE,
  radiusMeters = DEFAULT_SNAP_RADIUS_METERS,
  signal,
} = {}) => {
  if (!hasValidCoordinates(point)) {
    throw new Error("Marca el punto sobre una calle habilitada.")
  }

  const normalizedPoint = normalizePoint(point)
  const baseUrl = getOsrmBaseUrl()
  const coordinates = buildCoordinatesParam([normalizedPoint])
  const url = new URL(`${baseUrl}/nearest/v1/${encodeURIComponent(profile)}/${coordinates}`)

  url.searchParams.set("number", "1")

  const response = await fetch(url.toString(), {
    signal,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload.code !== "Ok") {
    throw new Error(payload.message || payload.code || "Marca el punto sobre una calle habilitada.")
  }

  return parseOsrmNearestPoint(payload, radiusMeters)
}

export const calculateOsrmRoute = async ({
  points = [],
  profile = DEFAULT_PROFILE,
  signal,
} = {}) => {
  const routePoints = points.map(normalizePoint).filter(hasValidCoordinates)

  if (routePoints.length < 2) {
    throw new Error("La ruta necesita al menos origen y destino.")
  }

  const baseUrl = getOsrmBaseUrl()
  const coordinates = buildCoordinatesParam(routePoints)
  const url = new URL(`${baseUrl}/route/v1/${encodeURIComponent(profile)}/${coordinates}`)

  url.searchParams.set("overview", "full")
  url.searchParams.set("geometries", "geojson")
  url.searchParams.set("steps", "false")
  url.searchParams.set("annotations", "false")
  url.searchParams.set("radiuses", buildRadiusesParam(routePoints))

  const response = await fetch(url.toString(), {
    signal,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload.code !== "Ok") {
    throw new Error(payload.message || payload.code || "No se pudo calcular la ruta por calles.")
  }

  return parseOsrmRoute(payload)
}
