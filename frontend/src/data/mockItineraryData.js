export const mockItineraryAssets = [
  {
    id: "asset-001",
    activoId: 1,
    patente: "MAESOL",
    deviceId: "868123450001",
    conductor: "Carlos Ramírez",
    estado: "idle",
    lat: -33.4489,
    lng: -70.6693,
    speed: 0,
    direccion: "Ubicación actual MAESOL",
    last_report: "2026-05-14T23:59:59",
  },
  {
    id: "asset-002",
    activoId: 2,
    patente: "CAMIONETA JAC",
    deviceId: "868123450002",
    conductor: "Ana Torres",
    estado: "idle",
    lat: -33.4521,
    lng: -70.6625,
    speed: 0,
    direccion: "Ubicación actual CAMIONETA JAC",
    last_report: "2026-05-14T23:59:59",
  },
  {
    id: "asset-003",
    activoId: 3,
    patente: "TWDR56 PESO",
    deviceId: "868123450003",
    conductor: "Juan Pérez",
    estado: "idle",
    lat: -33.4448,
    lng: -70.6755,
    speed: 0,
    direccion: "Ubicación actual TWDR56 PESO",
    last_report: "2026-05-14T23:59:59",
  },
  {
    id: "asset-004",
    activoId: 4,
    patente: "CAMIONETA SSANGYONG",
    deviceId: "868123450004",
    conductor: "María González",
    estado: "moving",
    lat: -33.4568,
    lng: -70.6712,
    speed: 38,
    direccion: "Ubicación actual CAMIONETA SSANGYONG",
    last_report: "2026-05-14T23:59:59",
  },
  {
    id: "asset-005",
    activoId: 5,
    patente: "VIEJITO HACKER",
    deviceId: "868123450005",
    conductor: "Felipe Soto",
    estado: "stopped",
    lat: -33.461,
    lng: -70.658,
    speed: 0,
    direccion: "Ubicación actual VIEJITO HACKER",
    last_report: "2026-05-14T23:59:59",
  },
  {
    id: "asset-006",
    activoId: 6,
    patente: "MAXUS T 60",
    deviceId: "868123450006",
    conductor: "Luis Hidalgo",
    estado: "offline",
    lat: -33.4412,
    lng: -70.6552,
    speed: 0,
    direccion: "Ubicación actual MAXUS T 60",
    last_report: "2026-05-14T23:59:59",
  },
]

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
    [0.0000, 0.0000],
    [0.0065, 0.0100],
    [0.0010, 0.0215],
    [-0.0060, 0.0180],
    [-0.0115, 0.0270],
    [-0.0045, 0.0365],
    [0.0040, 0.0310],
    [0.0110, 0.0430],
  ],
  "asset-002": [
    [0.0000, 0.0000],
    [-0.0090, 0.0080],
    [-0.0170, 0.0030],
    [-0.0220, 0.0150],
    [-0.0140, 0.0260],
    [-0.0265, 0.0360],
    [-0.0180, 0.0470],
    [-0.0060, 0.0410],
  ],
  "asset-003": [
    [0.0000, 0.0000],
    [-0.0060, -0.0120],
    [0.0040, -0.0210],
    [0.0140, -0.0160],
    [0.0200, -0.0300],
    [0.0100, -0.0410],
    [-0.0020, -0.0340],
    [-0.0110, -0.0460],
  ],
  "asset-004": [
    [0.0000, 0.0000],
    [0.0080, -0.0070],
    [0.0180, -0.0010],
    [0.0220, -0.0130],
    [0.0130, -0.0240],
    [0.0250, -0.0350],
    [0.0340, -0.0260],
    [0.0290, -0.0110],
  ],
  "asset-005": [
    [0.0000, 0.0000],
    [-0.0100, 0.0040],
    [-0.0160, -0.0080],
    [-0.0070, -0.0180],
    [-0.0190, -0.0290],
    [-0.0310, -0.0210],
    [-0.0260, -0.0060],
    [-0.0380, 0.0040],
  ],
  "asset-006": [
    [0.0000, 0.0000],
    [0.0120, 0.0060],
    [0.0200, -0.0070],
    [0.0320, -0.0020],
    [0.0380, 0.0140],
    [0.0280, 0.0270],
    [0.0150, 0.0200],
    [0.0040, 0.0340],
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
  isCurrentLocation,
})

const getRoutePointOffset = ({
  assetId,
  pointIndex,
  dayIndex,
  assetIndex,
}) => {
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

const buildCurrentLocationPoint = ({
  asset,
  dateString,
  pointIndex,
  odometer,
}) => {
  return createPoint({
    id: `${asset.id}-${dateString}-current`,
    assetId: asset.id,
    timestamp: asset.last_report || `${dateString}T23:59:59`,
    lat: asset.lat,
    lng: asset.lng,
    speed: Number(asset.speed) || 0,
    address: asset.direccion || `Ubicación actual ${asset.patente}`,
    event: "Ubicación actual",
    odometer,
    isCurrentLocation: true,
  })
}

const generateDailyPointsForAsset = ({
  asset,
  dateString,
  dayIndex,
  assetIndex,
}) => {
  const profile = itineraryAssetProfiles[asset.id]
  const template = routeTemplates[asset.id]

  if (!profile || !template) return []

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
      }),
    ]
  }

  const pointCount = isSaturday ? 6 : 8
  const startHour = 7 + ((assetIndex + dayIndex) % 3)
  const startMinute = (assetIndex * 7 + dayIndex * 3) % 45

  const points = Array.from({ length: pointCount }, (_, index) => {
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
      dayIndex * (45 + assetIndex * 5) +
      index * (isStop ? 3 : 9 + assetIndex)

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
    })
  })

  if (dateString === CURRENT_MOCK_DATE && hasValidLocation(asset)) {
    const lastHistoricalPoint = points[points.length - 1]

    return [
      ...points.slice(0, -1),
      buildCurrentLocationPoint({
        asset,
        dateString,
        pointIndex: points.length,
        odometer: lastHistoricalPoint?.odometer || profile.odometerStart,
      }),
    ]
  }

  return points
}

const generateMonthlyItineraryPoints = () => {
  const endDate = new Date(`${CURRENT_MOCK_DATE}T00:00:00`)
  const days = 30

  return Array.from({ length: days }, (_, dayIndex) => {
    const date = new Date(endDate)
    date.setDate(endDate.getDate() - (days - 1 - dayIndex))
    const dateString = toDateString(date)

    return mockItineraryAssets.flatMap((asset, assetIndex) => {
      return generateDailyPointsForAsset({
        asset,
        dateString,
        dayIndex,
        assetIndex,
      })
    })
  }).flat()
}

export const mockItineraryPoints = generateMonthlyItineraryPoints()

export const getLatestItineraryDate = () => {
  const dates = mockItineraryPoints
    .map((point) => point.timestamp.slice(0, 10))
    .sort()

  return dates[dates.length - 1] || new Date().toISOString().slice(0, 10)
}

export const addDays = (dateString, amount) => {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + amount)
  return date.toISOString().slice(0, 10)
}

export const formatDateLabel = (timestamp) => {
  if (!timestamp) return "-"

  const date = new Date(timestamp)

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date)
}

export const formatTimeLabel = (timestamp) => {
  if (!timestamp) return "-"

  const date = new Date(timestamp)

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

export const formatMinutes = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0 min"

  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)

  if (!hours) return `${mins} min`
  if (!mins) return `${hours} h`

  return `${hours} h ${mins} min`
}

export const haversineDistanceKm = (pointA, pointB) => {
  if (!pointA || !pointB) return 0

  const earthRadiusKm = 6371
  const toRad = (value) => (value * Math.PI) / 180

  const dLat = toRad(pointB.lat - pointA.lat)
  const dLng = toRad(pointB.lng - pointA.lng)

  const lat1 = toRad(pointA.lat)
  const lat2 = toRad(pointB.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}

export const filterItineraryPoints = ({
  assetId,
  fromDate,
  toDate,
}) => {
  return mockItineraryPoints
    .filter((point) => {
      const date = point.timestamp.slice(0, 10)

      return point.assetId === assetId && date >= fromDate && date <= toDate
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

export const buildItineraryResult = ({
  asset,
  points,
}) => {
  const sortedPoints = [...points].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
  )

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