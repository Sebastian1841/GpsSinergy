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

const normalizeRowPoint = (row = {}) => {
  const coordinates = String(row.values?.coordinates || row.report?.coordinates || "").split(",")
  const lat = Number(
    row.lat ??
      row.itineraryRow?.lat ??
      row.values?.lat ??
      row.report?.lat ??
      row.report?.latitude ??
      coordinates[0],
  )
  const lng = Number(
    row.lng ??
      row.itineraryRow?.lng ??
      row.values?.lng ??
      row.report?.lng ??
      row.report?.lon ??
      row.report?.longitude ??
      coordinates[1],
  )

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

const getRowTimestampValue = (row = {}) => {
  return (
    row.timestamp ||
    row.report?.timestamp ||
    row.report?.lastReport ||
    row.report?.reportedAt ||
    row.values?.ultimoDato ||
    row.values?.timestamp ||
    row.values?.fecha ||
    ""
  )
}

const getRowSortTime = (row = {}) => {
  const timestamp = new Date(getRowTimestampValue(row)).getTime()

  return Number.isFinite(timestamp) ? timestamp : 0
}

const getStopMarkerLabel = (row = {}, index = 0) => {
  return firstText(row.values?.stopIndex, row.stopIndex, row.index) || String(index + 1)
}

const getStopMarkerAddress = (row = {}) => {
  return firstText(
    row.values?.address,
    row.values?.lastPosition,
    row.report?.address,
    row.report?.direccion,
    row.address,
    row.itineraryRow?.address,
    "Detencion",
  )
}

const buildStopMarkerFromRow = (row = {}, index = 0) => {
  const point = normalizeRowPoint(row)

  if (!point) return null

  return {
    ...point,
    label: getStopMarkerLabel(row, index),
    address: getStopMarkerAddress(row),
  }
}

const isStopMarkerRow = (row = {}) => {
  return (
    row.routeTrip?.stopMarkerMode ||
    String(row.generatedEvent?.ruleId || row.ruleId || row.report?.ruleId || "")
      .trim()
      .toLowerCase() === "stops"
  )
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
  const hasRouteTripPoints = reportRows.some((row) => {
    return Array.isArray(row.routeTrip?.points) && row.routeTrip.points.length > 0
  })

  if (!hasRouteTripPoints) {
    const groupedRoutes = new Map()

    reportRows
      .map((row, index) => ({
        row,
        index,
        point: normalizeRowPoint(row),
      }))
      .filter((item) => item.point)
      .sort((firstItem, secondItem) => {
        return getRowSortTime(firstItem.row) - getRowSortTime(secondItem.row)
      })
      .forEach(({ row, index, point }) => {
        const deviceLabel = getRouteDeviceLabel(row, index)
        const deviceKey = getRouteDeviceKey(row, deviceLabel)
        const currentRoute = groupedRoutes.get(deviceKey) || {
          id: `stop-route-${deviceKey || index}`,
          deviceKey,
          deviceLabel,
          startAddress: "Primera detencion",
          endAddress: "Ultima detencion",
          points: [],
          stopMarkers: [],
        }
        const stopMarker = buildStopMarkerFromRow(row, currentRoute.stopMarkers.length)

        currentRoute.points.push(point)
        if (stopMarker) currentRoute.stopMarkers.push(stopMarker)
        groupedRoutes.set(deviceKey, currentRoute)
      })

    const colorByDeviceKey = new Map()

    return Array.from(groupedRoutes.values()).map((route, index) => {
      if (!colorByDeviceKey.has(route.deviceKey)) {
        colorByDeviceKey.set(route.deviceKey, ROUTE_COLORS[index % ROUTE_COLORS.length])
      }

      return {
        ...route,
        points: samplePoints(route.points),
        color: colorByDeviceKey.get(route.deviceKey),
      }
    })
  }

  const stopRoutesByKey = new Map()
  const tripRoutes = []

  reportRows.forEach((row, index) => {
    const points = Array.isArray(row.routeTrip?.points)
      ? row.routeTrip.points.map(normalizeRoutePoint).filter(Boolean)
      : []
    const deviceLabel = getRouteDeviceLabel(row, index)
    const deviceKey = getRouteDeviceKey(row, deviceLabel)
    const route = {
      id: row.id || `route-trip-${index}`,
      deviceKey,
      deviceLabel,
      startAddress: getRouteLabelText(
        row.routeTrip?.startAddress || row.values?.tripOrigin || row.report?.tripOrigin,
        "Inicio del viaje",
      ),
      endAddress: getRouteLabelText(
        row.routeTrip?.endAddress || row.values?.tripDestination || row.report?.tripDestination,
        "Fin del viaje",
      ),
      points,
    }

    if (isStopMarkerRow(row)) {
      const groupKey = `stop-route-${deviceKey || index}`
      const fallbackPoint = buildStopMarkerFromRow(row, 0)
      const currentRoute = stopRoutesByKey.get(groupKey) || {
        ...route,
        id: groupKey,
        points: route.points.length ? route.points : fallbackPoint ? [fallbackPoint] : [],
        stopMarkers: [],
      }
      const stopMarker = buildStopMarkerFromRow(row, currentRoute.stopMarkers.length)

      if (route.points.length > currentRoute.points.length) {
        currentRoute.points = route.points
      }

      if (stopMarker) currentRoute.stopMarkers.push(stopMarker)
      stopRoutesByKey.set(groupKey, currentRoute)
      return
    }

    if (!route.points.length) return

    tripRoutes.push({
      ...route,
      points: samplePoints(route.points),
    })
  })

  const routes = [
    ...tripRoutes,
    ...Array.from(stopRoutesByKey.values()).map((route) => ({
      ...route,
      points: samplePoints(route.points),
    })),
  ]
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
