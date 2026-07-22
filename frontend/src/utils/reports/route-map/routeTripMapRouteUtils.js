export const MAP_POINT_LIMIT = 420

export const ROUTE_COLORS = [
  "#ff6600",
  "#2563eb",
  "#7c3aed",
  "#dc2626",
  "#0f766e",
  "#d97706",
  "#be123c",
  "#4f46e5",
]

const normalizeRoutePoint = (point = {}) => {
  const lat = Number(point.lat)
  const lng = Number(point.lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return {
    lat,
    lng,
  }
}

const firstText = (...values) => {
  return values.map((value) => String(value ?? "").trim()).find((value) => value && value !== "-")
}

const getRouteLabelText = (value, fallback) => {
  const text = firstText(value)

  if (!text) return fallback

  return text
}

const getRouteDeviceLabel = (row = {}, index = 0) => {
  return (
    firstText(
      row.values?.patente,
      row.values?.assetPatente,
      row.asset?.patente,
      row.asset?.patent,
      row.values?.vehiculo,
      row.values?.assetDisplayName,
      row.asset?.nombrePantalla,
      row.asset?.vehiculo,
      row.asset?.name,
      row.values?.deviceId,
      row.values?.assetDeviceId,
      row.report?.patente,
      row.report?.patent,
      row.report?.deviceId,
      row.asset?.deviceId,
      row.asset?.imei,
    ) || `Dispositivo ${index + 1}`
  )
}

const getRouteDeviceKey = (row = {}, deviceLabel) => {
  return String(
    firstText(
      row.asset?.id,
      row.asset?.activoId,
      row.asset?.deviceId,
      row.asset?.imei,
      row.values?.deviceId,
      row.values?.assetDeviceId,
      row.values?.patente,
      row.values?.assetPatente,
      row.asset?.patente,
      row.asset?.patent,
      deviceLabel,
    ),
  )
    .trim()
    .toLowerCase()
}

const samplePoints = (points = [], limit = MAP_POINT_LIMIT) => {
  if (points.length <= limit) return points
  if (limit <= 2) return [points[0], points.at(-1)]

  const lastIndex = points.length - 1
  const step = lastIndex / (limit - 1)

  return Array.from({ length: limit }, (_item, index) => {
    return points[Math.round(index * step)]
  })
}

export const getRouteTripMapRoutes = (reportRows = []) => {
  const routes = reportRows
    .map((row, index) => {
      const points = Array.isArray(row.routeTrip?.points)
        ? row.routeTrip.points.map(normalizeRoutePoint).filter(Boolean)
        : []
      const deviceLabel = getRouteDeviceLabel(row, index)

      return {
        id: row.id || `route-trip-${index}`,
        deviceKey: getRouteDeviceKey(row, deviceLabel),
        deviceLabel,
        startAddress: getRouteLabelText(
          row.routeTrip?.startAddress || row.values?.tripOrigin || row.report?.tripOrigin,
          "Inicio del viaje",
        ),
        endAddress: getRouteLabelText(
          row.routeTrip?.endAddress || row.values?.tripDestination || row.report?.tripDestination,
          "Fin del viaje",
        ),
        points: samplePoints(points),
      }
    })
    .filter((route) => route.points.length)
  const colorByDeviceKey = new Map()
  let colorIndex = 0

  return routes.map((route) => {
    if (!colorByDeviceKey.has(route.deviceKey)) {
      colorByDeviceKey.set(route.deviceKey, ROUTE_COLORS[colorIndex % ROUTE_COLORS.length])
      colorIndex += 1
    }

    return {
      ...route,
      color: colorByDeviceKey.get(route.deviceKey),
    }
  })
}
