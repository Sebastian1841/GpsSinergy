import { TILE_SIZE } from "./routeTripMapTileUtils.js"

const MAP_PADDING = 42
const MIN_ZOOM = 3
const MAX_ZOOM = 18
const MAX_MERCATOR_LAT = 85.05112878

const clampNumber = (value, min, max) => {
  return Math.min(max, Math.max(min, value))
}

const toRadians = (value) => {
  return (Number(value) * Math.PI) / 180
}

const getRouteBounds = (routes = []) => {
  const points = routes.flatMap((route) => route.points)

  if (!points.length) return null

  const bounds = points.reduce(
    (currentBounds, point) => {
      return {
        minLat: Math.min(currentBounds.minLat, point.lat),
        maxLat: Math.max(currentBounds.maxLat, point.lat),
        minLng: Math.min(currentBounds.minLng, point.lng),
        maxLng: Math.max(currentBounds.maxLng, point.lng),
      }
    },
    {
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
      minLng: Number.POSITIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY,
    },
  )
  const latPadding = bounds.maxLat === bounds.minLat ? 0.0015 : 0
  const lngPadding = bounds.maxLng === bounds.minLng ? 0.0015 : 0

  return {
    minLat: bounds.minLat - latPadding,
    maxLat: bounds.maxLat + latPadding,
    minLng: bounds.minLng - lngPadding,
    maxLng: bounds.maxLng + lngPadding,
  }
}

const latLngToWorldPixel = (point, zoom) => {
  const scale = TILE_SIZE * 2 ** zoom
  const lat = clampNumber(point.lat, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT)
  const sinLat = Math.sin(toRadians(lat))

  return {
    x: ((point.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  }
}

const getSnapshotZoom = ({ bounds, width, height }) => {
  const innerWidth = width - MAP_PADDING * 2
  const innerHeight = height - MAP_PADDING * 2

  for (let zoom = MAX_ZOOM; zoom >= MIN_ZOOM; zoom -= 1) {
    const northWest = latLngToWorldPixel(
      {
        lat: bounds.maxLat,
        lng: bounds.minLng,
      },
      zoom,
    )
    const southEast = latLngToWorldPixel(
      {
        lat: bounds.minLat,
        lng: bounds.maxLng,
      },
      zoom,
    )
    const routeWidth = Math.abs(southEast.x - northWest.x)
    const routeHeight = Math.abs(southEast.y - northWest.y)

    if (routeWidth <= innerWidth && routeHeight <= innerHeight) return zoom
  }

  return MIN_ZOOM
}

const getSnapshotCenter = (bounds, zoom) => {
  const northWest = latLngToWorldPixel(
    {
      lat: bounds.maxLat,
      lng: bounds.minLng,
    },
    zoom,
  )
  const southEast = latLngToWorldPixel(
    {
      lat: bounds.minLat,
      lng: bounds.maxLng,
    },
    zoom,
  )

  return {
    x: (northWest.x + southEast.x) / 2,
    y: (northWest.y + southEast.y) / 2,
  }
}

export const createRouteTripMapProjection = ({ routes = [], width, height }) => {
  const bounds = getRouteBounds(routes)

  if (!bounds) return null

  const zoom = getSnapshotZoom({ bounds, width, height })
  const center = getSnapshotCenter(bounds, zoom)
  const projectPoint = (point) => {
    const projectedPoint = latLngToWorldPixel(point, zoom)

    return {
      x: width / 2 + (projectedPoint.x - center.x),
      y: height / 2 + (projectedPoint.y - center.y),
    }
  }

  return {
    bounds,
    center,
    projectPoint,
    zoom,
  }
}
