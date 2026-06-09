import { formatTelemetryTime } from "../utils/telemetryUtils.js"

const DEFAULT_INTERVAL_MS = 1000
const DEFAULT_BATCH_SIZE = 25
const DEFAULT_BASE_LAT = -33.4489
const DEFAULT_BASE_LNG = -70.6693

const TELEMETRY_STATUS = {
  MOVING: "moving",
  IDLE: "idle",
  STOPPED: "stopped",
  OFFLINE: "offline",
}

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max)
}

const randomBetween = (min, max) => {
  return min + Math.random() * (max - min)
}

const randomInteger = (min, max) => {
  return Math.floor(randomBetween(min, max + 1))
}

const normalizeId = (value) => {
  return String(value ?? "")
}

const isValidNumber = (value) => {
  return Number.isFinite(Number(value))
}

const normalizeCoordinate = (value, fallback) => {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return fallback

  return numberValue
}

const roundCoordinate = (value) => {
  return Number(Number(value).toFixed(7))
}

const roundSpeed = (value) => {
  return Number(Number(value).toFixed(1))
}

const getFallbackCoordinate = ({ index, type }) => {
  const offset = index * 0.0018

  if (type === "lat") return DEFAULT_BASE_LAT + offset

  return DEFAULT_BASE_LNG + offset
}

const getInitialStatus = (activo) => {
  if (activo?.estado) return activo.estado

  return TELEMETRY_STATUS.OFFLINE
}

const getInitialSpeed = (activo) => {
  if (isValidNumber(activo?.speed)) return Number(activo.speed)
  if (isValidNumber(activo?.velocidad)) return Number(activo.velocidad)
  if (isValidNumber(activo?.velocidad_kmh)) return Number(activo.velocidad_kmh)

  if (activo?.estado === TELEMETRY_STATUS.MOVING) {
    return randomInteger(20, 75)
  }

  return 0
}

const createTelemetryStateFromActivo = (activo, index = 0) => {
  const id = normalizeId(activo?.id)

  if (!id) return null

  const timestamp =
    activo?.timestamp ||
    activo?.lastReport ||
    activo?.lastReportAt ||
    activo?.reportedAt ||
    activo?.updatedAt ||
    new Date().toISOString()

  return {
    id,
    lat: normalizeCoordinate(activo.lat, getFallbackCoordinate({ index, type: "lat" })),
    lng: normalizeCoordinate(activo.lng, getFallbackCoordinate({ index, type: "lng" })),
    estado: getInitialStatus(activo),
    velocidad: getInitialSpeed(activo),
    heading: randomBetween(0, 360),
    updatedAt: timestamp,
    timestamp,
  }
}

const shouldChangeStatus = () => {
  return Math.random() < 0.08
}

const getNextStatus = (currentStatus) => {
  if (!shouldChangeStatus()) return currentStatus || TELEMETRY_STATUS.OFFLINE

  const roll = Math.random()

  if (roll < 0.58) return TELEMETRY_STATUS.MOVING
  if (roll < 0.78) return TELEMETRY_STATUS.IDLE
  if (roll < 0.92) return TELEMETRY_STATUS.STOPPED

  return TELEMETRY_STATUS.OFFLINE
}

const getNextSpeed = (status, previousSpeed = 0) => {
  if (status === TELEMETRY_STATUS.OFFLINE) return 0
  if (status === TELEMETRY_STATUS.STOPPED) return 0
  if (status === TELEMETRY_STATUS.IDLE) return 0

  const nextSpeed = Number(previousSpeed || 0) + randomBetween(-8, 10)

  return roundSpeed(clamp(nextSpeed || randomInteger(20, 70), 8, 96))
}

const getNextHeading = (previousHeading = 0) => {
  const nextHeading = Number(previousHeading || 0) + randomBetween(-18, 18)

  return (nextHeading + 360) % 360
}

const moveCoordinate = ({ lat, lng, heading, speed, intervalMs }) => {
  if (!speed) {
    return {
      lat: roundCoordinate(lat),
      lng: roundCoordinate(lng),
    }
  }

  const kilometersPerMillisecond = speed / 3600000
  const distanceKm = kilometersPerMillisecond * intervalMs
  const headingRadians = (heading * Math.PI) / 180

  const deltaLat = (distanceKm * Math.cos(headingRadians)) / 111.32
  const deltaLng =
    (distanceKm * Math.sin(headingRadians)) / (111.32 * Math.cos((lat * Math.PI) / 180))

  return {
    lat: roundCoordinate(lat + deltaLat),
    lng: roundCoordinate(lng + deltaLng),
  }
}

const pickIdsForBatch = ({ ids, batchSize }) => {
  if (!ids.length) return []

  const limit = clamp(batchSize || DEFAULT_BATCH_SIZE, 1, ids.length)

  if (limit >= ids.length) return ids

  const selectedIds = new Set()

  while (selectedIds.size < limit) {
    const randomIndex = randomInteger(0, ids.length - 1)
    selectedIds.add(ids[randomIndex])
  }

  return Array.from(selectedIds)
}

const buildTelemetryReport = ({ id, nextState, timestamp }) => {
  const speedValue = Number(nextState.velocidad) || 0
  const speedLabel = `${speedValue} km/h`
  const currentTimeLabel = formatTelemetryTime(timestamp, {
    fallbackToNow: true,
  })

  return {
    id,
    lat: nextState.lat,
    lng: nextState.lng,
    estado: nextState.estado,

    speed: speedValue,
    velocidad: speedLabel,
    velocidad_kmh: speedValue,

    timestamp,
    lastReport: timestamp,
    lastReportAt: timestamp,
    reportedAt: timestamp,
    updatedAt: timestamp,
    updated_at: timestamp,

    datosUlt: currentTimeLabel,
  }
}

const generateTelemetryBatch = ({
  telemetryState,
  activos = [],
  batchSize = DEFAULT_BATCH_SIZE,
  intervalMs = DEFAULT_INTERVAL_MS,
  timestamp = new Date().toISOString(),
} = {}) => {
  const state = telemetryState instanceof Map ? telemetryState : new Map()

  activos.forEach((activo, index) => {
    const id = normalizeId(activo?.id)

    if (!id || state.has(id)) return

    const initialState = createTelemetryStateFromActivo(activo, index)

    if (initialState) {
      state.set(id, initialState)
    }
  })

  const ids = Array.from(state.keys())
  const selectedIds = pickIdsForBatch({
    ids,
    batchSize,
  })

  return selectedIds
    .map((id) => {
      const previous = state.get(id)

      if (!previous) return null

      const estado = getNextStatus(previous.estado)
      const velocidad = getNextSpeed(estado, previous.velocidad)
      const heading = getNextHeading(previous.heading)

      const nextPosition = moveCoordinate({
        lat: previous.lat,
        lng: previous.lng,
        heading,
        speed: velocidad,
        intervalMs,
      })

      const nextState = {
        ...previous,
        ...nextPosition,
        estado,
        velocidad,
        heading,
        timestamp,
        updatedAt: timestamp,
      }

      state.set(id, nextState)

      return buildTelemetryReport({
        id,
        nextState,
        timestamp,
      })
    })
    .filter(Boolean)
}

export const createMockTelemetryStream = ({
  activos = [],
  intervalMs = DEFAULT_INTERVAL_MS,
  batchSize = DEFAULT_BATCH_SIZE,
  onBatch = () => {},
} = {}) => {
  const telemetryState = new Map()
  let timerId = null

  const replaceSnapshot = (nextActivos = []) => {
    telemetryState.clear()

    nextActivos.forEach((activo, index) => {
      const initialState = createTelemetryStateFromActivo(activo, index)

      if (initialState) {
        telemetryState.set(initialState.id, initialState)
      }
    })
  }

  const updateSnapshot = (nextActivos = []) => {
    const nextIds = new Set()

    nextActivos.forEach((activo, index) => {
      const id = normalizeId(activo?.id)

      if (!id) return

      nextIds.add(id)

      if (telemetryState.has(id)) return

      const initialState = createTelemetryStateFromActivo(activo, index)

      if (initialState) {
        telemetryState.set(id, initialState)
      }
    })

    Array.from(telemetryState.keys()).forEach((id) => {
      if (!nextIds.has(id)) {
        telemetryState.delete(id)
      }
    })
  }

  const generateBatch = () => {
    return generateTelemetryBatch({
      telemetryState,
      batchSize,
      intervalMs,
      timestamp: new Date().toISOString(),
    })
  }

  const tick = () => {
    const batch = generateBatch()

    if (batch.length) {
      onBatch(batch)
    }

    return batch
  }

  const start = () => {
    if (timerId) return

    timerId = window.setInterval(tick, intervalMs)
  }

  const stop = () => {
    if (!timerId) return

    window.clearInterval(timerId)
    timerId = null
  }

  const isRunning = () => {
    return Boolean(timerId)
  }

  replaceSnapshot(activos)

  return {
    telemetryState,
    replaceSnapshot,
    updateSnapshot,
    generateBatch,
    tick,
    start,
    stop,
    isRunning,
  }
}
