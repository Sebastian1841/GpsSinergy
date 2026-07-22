import { mockAssets } from "./mockDatabase.js"

export const mockItineraryAssets = mockAssets.map((asset) => ({
  ...asset,
  id: asset.id,
  activoId: asset.id,
  patente: asset.patente,
  deviceId: asset.imei,
  conductor: asset.conductor,
  estado: asset.estado,
  lat: asset.lat,
  lng: asset.lng,
  speed: Number(asset.speed) || 0,
  gpsSatellites: asset.gpsSatellites ?? null,
  ignition: asset.ignition ?? asset.ignicion ?? asset.contacto ?? null,
  ignicion: asset.ignicion ?? asset.ignition ?? asset.contacto ?? null,
  contacto: asset.contacto ?? asset.ignition ?? asset.ignicion ?? null,
  digitalInput1: asset.digitalInput1 ?? asset.input1 ?? asset.di1 ?? null,
  digitalInput2: asset.digitalInput2 ?? asset.input2 ?? asset.di2 ?? null,
  direccion: asset.direccion,
}))

const CURRENT_MOCK_DATE = "2026-05-14"

const itineraryAssetProfiles = {
  "asset-001": {
    baseLat: -33.4489,
    baseLng: -70.6693,
    odometerStart: 125430,
    addresses: [
      "Base operacional, Santiago",
      "Av. Libertador Bernardo O'Higgins",
      "Sector República",
      "Parque Quinta Normal",
      "Sector Mapocho",
      "Providencia, punto de detención",
      "Av. Providencia",
      "Destino operacional",
    ],
  },
  "asset-002": {
    baseLat: -33.4561,
    baseLng: -70.6804,
    odometerStart: 88420,
    addresses: [
      "Centro de distribución",
      "Ruta urbana sector sur",
      "Av. Departamental",
      "San Joaquín",
      "Cliente sector oriente",
      "Punto de carga",
      "Ruta de retorno",
      "Retorno a base",
    ],
  },
  "asset-003": {
    baseLat: -33.4211,
    baseLng: -70.7012,
    odometerStart: 54210,
    addresses: [
      "Punto inicial",
      "Tramo ruta poniente",
      "Sector Pudahuel",
      "Detención operacional",
      "Ruta enlace norte",
      "Sector industrial",
      "Tramo secundario",
      "Fin de jornada",
    ],
  },
  "asset-004": {
    baseLat: -33.4104,
    baseLng: -70.6423,
    odometerStart: 76550,
    addresses: [
      "Bodega norte",
      "Av. Independencia",
      "Sector Recoleta",
      "Cliente comercial",
      "Ruta de retorno",
      "Sector Patronato",
      "Parada técnica",
      "Estacionamiento operacional",
    ],
  },
  "asset-005": {
    baseLat: -33.5028,
    baseLng: -70.6167,
    odometerStart: 99280,
    addresses: [
      "Base San Miguel",
      "Gran Avenida",
      "Punto de revisión",
      "Cliente zona sur",
      "Ruta intermedia",
      "Sector La Cisterna",
      "Parada programada",
      "Fin de servicio",
    ],
  },
  "asset-006": {
    baseLat: -33.3702,
    baseLng: -70.7416,
    odometerStart: 143210,
    addresses: [
      "Base Quilicura",
      "Ruta logística norte",
      "Centro de abastecimiento",
      "Parada técnica",
      "Acceso autopista",
      "Sector industrial norte",
      "Retorno logístico",
      "Cierre de ruta",
    ],
  },
}

const routeTemplates = {
  "asset-001": [
    [0.0, 0.0],
    [0.0065, 0.01],
    [0.001, 0.0215],
    [-0.006, 0.018],
    [-0.0115, 0.027],
    [-0.0045, 0.0365],
    [0.004, 0.031],
    [0.011, 0.043],
  ],
  "asset-002": [
    [0.0, 0.0],
    [-0.009, 0.008],
    [-0.017, 0.003],
    [-0.022, 0.015],
    [-0.014, 0.026],
    [-0.0265, 0.036],
    [-0.018, 0.047],
    [-0.006, 0.041],
  ],
  "asset-003": [
    [0.0, 0.0],
    [-0.006, -0.012],
    [0.004, -0.021],
    [0.014, -0.016],
    [0.02, -0.03],
    [0.01, -0.041],
    [-0.002, -0.034],
    [-0.011, -0.046],
  ],
  "asset-004": [
    [0.0, 0.0],
    [0.008, -0.007],
    [0.018, -0.001],
    [0.022, -0.013],
    [0.013, -0.024],
    [0.025, -0.035],
    [0.034, -0.026],
    [0.029, -0.011],
  ],
  "asset-005": [
    [0.0, 0.0],
    [-0.01, 0.004],
    [-0.016, -0.008],
    [-0.007, -0.018],
    [-0.019, -0.029],
    [-0.031, -0.021],
    [-0.026, -0.006],
    [-0.038, 0.004],
  ],
  "asset-006": [
    [0.0, 0.0],
    [0.012, 0.006],
    [0.02, -0.007],
    [0.032, -0.002],
    [0.038, 0.014],
    [0.028, 0.027],
    [0.015, 0.02],
    [0.004, 0.034],
  ],
}

const pad = (value) => String(value).padStart(2, "0")

const toDateString = (date) => {
  return date.toISOString().slice(0, 10)
}

const buildTimestamp = (dateString, hour, minute) => {
  return `${dateString}T${pad(hour)}:${pad(minute)}:00`
}

const toFixedCoordinate = (value) => {
  return Number(Number(value).toFixed(6))
}

const hasValidLocation = (asset) => {
  return Number.isFinite(Number(asset?.lat)) && Number.isFinite(Number(asset?.lng))
}

const createPoint = ({
  id,
  assetId,
  timestamp,
  lat,
  lng,
  speed,
  address,
  event,
  odometer,
  gpsSatellites = null,
  ignition = null,
  digitalInput1 = null,
  digitalInput2 = null,
  isCurrentLocation = false,
}) => ({
  id,
  assetId,
  timestamp,
  lat: toFixedCoordinate(lat),
  lng: toFixedCoordinate(lng),
  speed,
  address,
  event,
  odometer,
  gpsSatellites,
  ignition,
  ignicion: ignition,
  contacto: ignition,
  digitalInput1,
  digitalInput2,
  isCurrentLocation,
})

const getRoutePointOffset = ({ assetId, pointIndex, dayIndex, assetIndex }) => {
  const template = routeTemplates[assetId] || routeTemplates["asset-001"]
  const [baseLatOffset, baseLngOffset] = template[pointIndex]

  const wave = Math.sin((dayIndex + pointIndex + assetIndex) * 0.85)
  const curve = Math.cos((dayIndex * 0.5 + pointIndex) * 0.7)

  const dayVariationLat = wave * 0.0026
  const dayVariationLng = curve * 0.0029

  const rotationFactor = (dayIndex % 6) * 0.00075
  const latOffset = baseLatOffset + dayVariationLat + rotationFactor
  const lngOffset = baseLngOffset + dayVariationLng - rotationFactor

  return {
    latOffset,
    lngOffset,
  }
}

const getItineraryProfile = (asset, assetIndex) => {
  return (
    itineraryAssetProfiles[asset.id] || {
      baseLat: Number(asset.lat),
      baseLng: Number(asset.lng),
      odometerStart: 50000 + assetIndex * 12000,
      addresses: [
        `Base operacional ${asset.patente}`,
        "Inicio de recorrido",
        "Tramo operativo",
        "Punto de control",
        "Destino intermedio",
        "Parada programada",
        "Ruta de retorno",
        `Fin de recorrido ${asset.patente}`,
      ],
    }
  )
}

const generateDailyPointsForAsset = ({ asset, dateString, dayIndex, assetIndex }) => {
  const profile = getItineraryProfile(asset, assetIndex)

  const weekday = new Date(`${dateString}T00:00:00`).getDay()
  const isSunday = weekday === 0
  const isSaturday = weekday === 6

  if (isSunday && asset.id === "asset-006") {
    return [
      createPoint({
        id: `${asset.id}-${dateString}-001`,
        assetId: asset.id,
        timestamp: buildTimestamp(dateString, 9, 10),
        lat: profile.baseLat,
        lng: profile.baseLng,
        speed: 0,
        address: profile.addresses[0],
        event: "Sin operación",
        odometer: profile.odometerStart + dayIndex * 42,
        gpsSatellites: asset.gpsSatellites ?? 0,
        ignition: false,
        digitalInput1: 0,
        digitalInput2: asset.digitalInput2 ?? asset.input2 ?? null,
      }),
    ]
  }

  const pointCount = isSaturday ? 6 : 8
  const startHour = 7 + ((assetIndex + dayIndex) % 3)
  const startMinute = (assetIndex * 7 + dayIndex * 3) % 45

  return Array.from({ length: pointCount }, (_, index) => {
    const isFirst = index === 0
    const isLast = index === pointCount - 1
    const isStop = isFirst || isLast || index === 3 || index === 5

    const speedBase = 28 + ((dayIndex + index + assetIndex) % 7) * 5
    const speed = isStop ? 0 : speedBase

    const minuteOffset = index * 24 + (index % 2) * 5
    const hour = startHour + Math.floor((startMinute + minuteOffset) / 60)
    const minute = (startMinute + minuteOffset) % 60

    const { latOffset, lngOffset } = getRoutePointOffset({
      assetId: asset.id,
      pointIndex: index,
      dayIndex,
      assetIndex,
    })

    const odometerIncrement =
      dayIndex * (45 + assetIndex * 5) + index * (isStop ? 3 : 9 + assetIndex)

    const event = isFirst
      ? "Inicio detenido"
      : isLast
        ? "Fin de tramo"
        : isStop
          ? "Parada"
          : index % 2 === 0
            ? "En ruta"
            : "Movimiento"

    return createPoint({
      id: `${asset.id}-${dateString}-${pad(index + 1)}`,
      assetId: asset.id,
      timestamp: buildTimestamp(dateString, hour, minute),
      lat: profile.baseLat + latOffset,
      lng: profile.baseLng + lngOffset,
      speed,
      address: profile.addresses[index % profile.addresses.length],
      event,
      odometer: profile.odometerStart + odometerIncrement,
      gpsSatellites: 7 + ((dayIndex + index + assetIndex) % 10),
      ignition: !(isStop && !isFirst),
      digitalInput1: isStop && !isFirst ? 0 : 1,
      digitalInput2: asset.digitalInput2 ?? asset.input2 ?? null,
    })
  })
}

const ITINERARY_POINTS_CACHE_LIMIT = 120
const itineraryPointsCache = new Map()

const getFallbackAssetIndex = (asset) => {
  return String(asset?.id || asset?.patente || "")
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0)
}

const findItineraryAssetById = (assetId) => {
  const normalizedAssetId = String(assetId || "")

  if (!normalizedAssetId) return null

  return (
    mockItineraryAssets.find((asset) => {
      return String(asset.id) === normalizedAssetId || String(asset.activoId) === normalizedAssetId
    }) || null
  )
}

const buildItineraryCacheKey = ({ assetId, asset, fromDate, toDate }) => {
  return [assetId, fromDate, toDate, asset?.lat ?? "", asset?.lng ?? "", asset?.patente ?? ""].join(
    "|",
  )
}

const getCachedItineraryPoints = (cacheKey) => {
  if (!itineraryPointsCache.has(cacheKey)) return null

  const points = itineraryPointsCache.get(cacheKey)

  itineraryPointsCache.delete(cacheKey)
  itineraryPointsCache.set(cacheKey, points)

  return points
}

const setCachedItineraryPoints = (cacheKey, points) => {
  itineraryPointsCache.set(cacheKey, points)

  if (itineraryPointsCache.size <= ITINERARY_POINTS_CACHE_LIMIT) return

  const oldestCacheKey = itineraryPointsCache.keys().next().value

  itineraryPointsCache.delete(oldestCacheKey)
}

const buildDateRange = ({ fromDate, toDate }) => {
  const start = new Date(`${fromDate}T00:00:00`)
  const end = new Date(`${toDate}T00:00:00`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return []

  const dates = []
  const cursor = new Date(start)
  const maxDays = 31

  while (cursor <= end && dates.length < maxDays) {
    dates.push(toDateString(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

const generateFallbackItineraryPoints = ({ asset, fromDate, toDate }) => {
  if (!asset || !hasValidLocation(asset)) return []

  const assetIndex = getFallbackAssetIndex(asset)

  return buildDateRange({ fromDate, toDate })
    .flatMap((dateString, dayIndex) => {
      return generateDailyPointsForAsset({
        asset,
        dateString,
        dayIndex,
        assetIndex,
      })
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

export const getLatestItineraryDate = () => CURRENT_MOCK_DATE

export const addDays = (dateString, amount) => {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + amount)
  return date.toISOString().slice(0, 10)
}

const formatDateLabel = (timestamp) => {
  if (!timestamp) return "-"

  const date = new Date(timestamp)

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date)
}

const formatTimeLabel = (timestamp) => {
  if (!timestamp) return "-"

  const date = new Date(timestamp)

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

const formatMinutes = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0 min"

  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)

  if (!hours) return `${mins} min`
  if (!mins) return `${hours} h`

  return `${hours} h ${mins} min`
}

const haversineDistanceKm = (pointA, pointB) => {
  if (!pointA || !pointB) return 0

  const earthRadiusKm = 6371
  const toRad = (value) => (value * Math.PI) / 180

  const dLat = toRad(pointB.lat - pointA.lat)
  const dLng = toRad(pointB.lng - pointA.lng)

  const lat1 = toRad(pointA.lat)
  const lat2 = toRad(pointB.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}

export const filterItineraryPoints = ({ assetId, asset, fromDate, toDate }) => {
  const resolvedAsset = asset || findItineraryAssetById(assetId)
  const resolvedAssetId = String(assetId || resolvedAsset?.id || resolvedAsset?.activoId || "")

  if (!resolvedAsset || !resolvedAssetId) return []

  const cacheKey = buildItineraryCacheKey({
    assetId: resolvedAssetId,
    asset: resolvedAsset,
    fromDate,
    toDate,
  })

  const cachedPoints = getCachedItineraryPoints(cacheKey)

  if (cachedPoints) return cachedPoints

  const points = generateFallbackItineraryPoints({
    asset: resolvedAsset,
    fromDate,
    toDate,
  })

  setCachedItineraryPoints(cacheKey, points)

  return points
}

export const buildItineraryResult = ({ asset, points }) => {
  const sortedPoints = [...points].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  let accumulatedDistanceKm = 0
  let movingMinutes = 0
  let stoppedMinutes = 0

  const rows = sortedPoints.map((point, index) => {
    const previousPoint = sortedPoints[index - 1]
    const nextPoint = sortedPoints[index + 1]

    if (previousPoint) {
      accumulatedDistanceKm += haversineDistanceKm(previousPoint, point)
    }

    if (nextPoint) {
      const currentTime = new Date(point.timestamp).getTime()
      const nextTime = new Date(nextPoint.timestamp).getTime()
      const diffMinutes = Math.max(0, (nextTime - currentTime) / 60000)

      if (point.speed > 0 || nextPoint.speed > 0) {
        movingMinutes += diffMinutes
      } else {
        stoppedMinutes += diffMinutes
      }
    }

    return {
      ...point,
      index: index + 1,
      dateLabel: formatDateLabel(point.timestamp),
      timeLabel: formatTimeLabel(point.timestamp),
      speedLabel: `${point.speed} km/h`,
      accumulatedDistanceKm,
      accumulatedDistanceLabel: `${accumulatedDistanceKm.toFixed(1)} km`,
      status: point.speed > 0 ? "moving" : "stopped",
    }
  })

  const movingPoints = rows.filter((point) => point.speed > 0)
  const stops = rows.filter((point) => point.speed === 0)
  const averageSpeed = movingPoints.length
    ? movingPoints.reduce((sum, point) => sum + point.speed, 0) / movingPoints.length
    : 0

  const firstPoint = rows[0] || null
  const lastPoint = rows[rows.length - 1] || null

  return {
    id: `route-${asset?.id || "unknown"}`,
    asset,
    rows,
    points: rows,
    routeLine: rows.map((point) => [point.lat, point.lng]),
    summary: {
      distanceKm: accumulatedDistanceKm,
      distanceLabel: `${accumulatedDistanceKm.toFixed(1)} km`,
      movingMinutes,
      movingLabel: formatMinutes(movingMinutes),
      stoppedMinutes,
      stoppedLabel: formatMinutes(stoppedMinutes),
      averageSpeed,
      averageSpeedLabel: `${averageSpeed.toFixed(0)} km/h`,
      stopsCount: stops.length,
      pointsCount: rows.length,
      firstReport: firstPoint?.timeLabel || "-",
      lastReport: lastPoint?.timeLabel || "-",
      startAddress: firstPoint?.address || "-",
      endAddress: lastPoint?.address || "-",
    },
  }
}
