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

const roundMetric = (value, decimals = 1) => {
  return Number(Number(value).toFixed(decimals))
}

const parseNumberFromValue = (value, fallback = 0) => {
  if (Number.isFinite(Number(value))) return Number(value)

  const match = String(value ?? "").match(/-?\d[\d.,]*/)

  if (!match) return fallback

  const rawNumber = match[0]
  const hasComma = rawNumber.includes(",")
  const hasDot = rawNumber.includes(".")
  const normalizedNumber =
    hasComma && hasDot
      ? rawNumber.replace(/\./g, "").replace(",", ".")
      : hasComma
        ? rawNumber.replace(",", ".")
        : hasDot && (rawNumber.split(".").length > 2 || rawNumber.split(".").at(-1)?.length === 3)
          ? rawNumber.replace(/\./g, "")
          : rawNumber
  const parsedValue = Number(normalizedNumber)

  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

const formatKilometers = (value) => {
  return `${roundMetric(value, 1).toLocaleString("es-CL")} km`
}

const formatHours = (value) => {
  return `${roundMetric(value, 1).toLocaleString("es-CL")} h`
}

const formatPercent = (value) => {
  return `${Math.round(clamp(value, 0, 100))}%`
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

const normalizeStateText = (value) => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const isActiveStateValue = (value) => {
  if (value === true) return true
  if (value === false) return false

  const numberValue = Number(value)

  if (Number.isFinite(numberValue)) return numberValue > 0

  return ["on", "si", "yes", "active", "activo", "activa", "encendido", "encendida"].includes(
    normalizeStateText(value),
  )
}

const isEngineOnStatus = (status) => {
  return status === TELEMETRY_STATUS.MOVING || status === TELEMETRY_STATUS.IDLE
}

const getInitialSwitchState = ({ value, fallback }) => {
  if (value === null || value === undefined || value === "") return Boolean(fallback)

  return isActiveStateValue(value)
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

  const estado = getInitialStatus(activo)
  const ignition = getInitialSwitchState({
    value: activo.ignition ?? activo.ignicion ?? activo.contacto,
    fallback: isEngineOnStatus(estado),
  })

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
    estado,
    ignition,
    digitalInput1: getInitialSwitchState({
      value: activo.digitalInput1 ?? activo.input1 ?? activo.di1,
      fallback: Boolean(ignition),
    }),
    digitalInput2: getInitialSwitchState({
      value: activo.digitalInput2 ?? activo.input2 ?? activo.di2,
      fallback: index % 4 === 0,
    }),
    velocidad: getInitialSpeed(activo),
    heading: randomBetween(0, 360),
    odometerKm: parseNumberFromValue(activo.odometer ?? activo.odometro, 50000 + index * 180),
    totalHourmeterHours: parseNumberFromValue(
      activo.engineHours ?? activo.horometroTotal,
      1200 + index * 14,
    ),
    dailyHourmeterHours: parseNumberFromValue(activo.horometroDiario, index % 5),
    fuelPercent: parseNumberFromValue(activo.fuelPercent ?? activo.combustible, 45 + (index % 45)),
    gpsSignal: parseNumberFromValue(
      activo.gpsSignal,
      activo.estado === TELEMETRY_STATUS.OFFLINE ? 0 : 82,
    ),
    gpsSatellites: parseNumberFromValue(
      activo.gpsSatellites,
      activo.estado === TELEMETRY_STATUS.OFFLINE ? 0 : 10 + (index % 8),
    ),
    canRpm: parseNumberFromValue(
      activo.canRpm,
      activo.estado === TELEMETRY_STATUS.MOVING ? 1500 : 0,
    ),
    canEngineTemp: parseNumberFromValue(activo.canEngineTemp, 82 + (index % 10)),
    canBatteryVoltage: parseNumberFromValue(activo.canBatteryVoltage, 12.6 + (index % 12) / 10),
    canEngineLoad: parseNumberFromValue(
      activo.canEngineLoad,
      activo.estado === TELEMETRY_STATUS.MOVING ? 42 + (index % 24) : 0,
    ),
    canThrottle: parseNumberFromValue(
      activo.canThrottle,
      activo.estado === TELEMETRY_STATUS.MOVING ? 18 + (index % 32) : 0,
    ),
    canFuelRate: parseNumberFromValue(
      activo.canFuelRate,
      activo.estado === TELEMETRY_STATUS.MOVING ? 8 + (index % 11) : 0,
    ),
    canFuelUsed: parseNumberFromValue(activo.canFuelUsed, 1200 + index * 9),
    canOilPressure: parseNumberFromValue(
      activo.canOilPressure,
      activo.estado === TELEMETRY_STATUS.OFFLINE ? 0 : 28 + (index % 18),
    ),
    canAdBlueLevel: parseNumberFromValue(
      activo.canAdBlueLevel,
      activo.estado === TELEMETRY_STATUS.OFFLINE ? 0 : 45 + (index % 42),
    ),
    canDtcCount: parseNumberFromValue(
      activo.canDtcCount,
      estado === TELEMETRY_STATUS.OFFLINE ? 0 : index % 3,
    ),
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
      distanceKm: 0,
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
    distanceKm,
  }
}

const getNextFuelPercent = ({ previousFuelPercent, status, speed, intervalMs }) => {
  if (status === TELEMETRY_STATUS.OFFLINE) return previousFuelPercent

  const hours = intervalMs / 3600000
  const usageRate = status === TELEMETRY_STATUS.IDLE ? 0.9 : speed > 0 ? 2.2 : 0.15
  const nextFuelPercent = Number(previousFuelPercent || 0) - usageRate * hours

  return roundMetric(clamp(nextFuelPercent, 0, 100), 1)
}

const getNextGpsSignal = (status, previousSignal = 82) => {
  if (status === TELEMETRY_STATUS.OFFLINE) return randomInteger(0, 8)

  return randomInteger(
    clamp(Number(previousSignal || 82) - 8, 45, 99),
    clamp(Number(previousSignal || 82) + 8, 45, 99),
  )
}

const getNextSatellites = (status) => {
  if (status === TELEMETRY_STATUS.OFFLINE) return 0

  return randomInteger(7, 18)
}

const getNextCanMetrics = ({ status, speed }) => {
  if (status === TELEMETRY_STATUS.OFFLINE) {
    return {
      canRpm: 0,
      canEngineTemp: 0,
      canBatteryVoltage: 0,
      canEngineLoad: 0,
      canThrottle: 0,
      canFuelRate: 0,
      canOilPressure: 0,
      canAdBlueLevel: 0,
      canDtcCount: 0,
    }
  }

  if (status === TELEMETRY_STATUS.STOPPED) {
    return {
      canRpm: 0,
      canEngineTemp: randomInteger(45, 72),
      canBatteryVoltage: roundMetric(randomBetween(12.1, 12.8), 1),
      canEngineLoad: 0,
      canThrottle: 0,
      canFuelRate: 0,
      canOilPressure: randomInteger(0, 8),
      canAdBlueLevel: randomInteger(35, 92),
      canDtcCount: randomInteger(0, 2),
    }
  }

  if (status === TELEMETRY_STATUS.IDLE) {
    return {
      canRpm: randomInteger(680, 980),
      canEngineTemp: randomInteger(76, 91),
      canBatteryVoltage: roundMetric(randomBetween(13.2, 14.1), 1),
      canEngineLoad: randomInteger(12, 28),
      canThrottle: randomInteger(0, 8),
      canFuelRate: roundMetric(randomBetween(1.4, 3.8), 1),
      canOilPressure: randomInteger(18, 32),
      canAdBlueLevel: randomInteger(35, 92),
      canDtcCount: randomInteger(0, 2),
    }
  }

  return {
    canRpm: randomInteger(1050, Math.max(1450, Math.round(1200 + speed * 24))),
    canEngineTemp: randomInteger(82, 98),
    canBatteryVoltage: roundMetric(randomBetween(13.5, 14.4), 1),
    canEngineLoad: randomInteger(35, 88),
    canThrottle: randomInteger(18, 78),
    canFuelRate: roundMetric(randomBetween(5.8, 24.5), 1),
    canOilPressure: randomInteger(28, 52),
    canAdBlueLevel: randomInteger(35, 92),
    canDtcCount: randomInteger(0, 2),
  }
}

const normalizePriorityIds = (priorityIds = []) => {
  if (!Array.isArray(priorityIds)) return []

  return priorityIds.map(normalizeId).filter(Boolean)
}

const pickIdsForBatch = ({ ids, batchSize, priorityIds = [] }) => {
  if (!ids.length) return []

  const limit = clamp(batchSize || DEFAULT_BATCH_SIZE, 1, ids.length)

  if (limit >= ids.length) return ids

  const availableIds = new Set(ids)
  const selectedIds = new Set()

  normalizePriorityIds(priorityIds).forEach((id) => {
    if (selectedIds.size >= limit) return
    if (!availableIds.has(id)) return

    selectedIds.add(id)
  })

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
    heading: nextState.heading,
    ignition: nextState.ignition,
    ignicion: nextState.ignition,
    contacto: nextState.ignition,
    digitalInput1: nextState.digitalInput1,
    digitalInput2: nextState.digitalInput2,
    input1: nextState.digitalInput1,
    input2: nextState.digitalInput2,

    speed: speedValue,
    velocidad: speedLabel,
    velocidad_kmh: speedValue,

    odometro: formatKilometers(nextState.odometerKm),
    odometer: nextState.odometerKm,
    horometroTotal: formatHours(nextState.totalHourmeterHours),
    horometroDiario: formatHours(nextState.dailyHourmeterHours),
    engineHours: nextState.totalHourmeterHours,
    engineHoursDaily: nextState.dailyHourmeterHours,

    combustible: formatPercent(nextState.fuelPercent),
    fuelPercent: nextState.fuelPercent,
    combustibleNivel: nextState.fuelPercent,

    gpsSignal: nextState.gpsSignal,
    gpsSignalLabel: formatPercent(nextState.gpsSignal),
    gpsSatellites: nextState.gpsSatellites,
    gpsFix: nextState.gpsSignal > 20 ? "Fix 3D" : "Sin fix",

    canStatus: nextState.estado === TELEMETRY_STATUS.OFFLINE ? "Sin datos" : "OK",
    canRpm: nextState.canRpm,
    canEngineTemp: nextState.canEngineTemp,
    canBatteryVoltage: nextState.canBatteryVoltage,
    canEngineLoad: nextState.canEngineLoad,
    canThrottle: nextState.canThrottle,
    canFuelRate: nextState.canFuelRate,
    canFuelUsed: nextState.canFuelUsed,
    canOilPressure: nextState.canOilPressure,
    canAdBlueLevel: nextState.canAdBlueLevel,
    canDtcCount: nextState.canDtcCount,
    canSummary:
      nextState.estado === TELEMETRY_STATUS.OFFLINE
        ? "Sin datos"
        : `RPM ${nextState.canRpm.toLocaleString("es-CL")} / ${nextState.canEngineTemp} C / ${nextState.canEngineLoad}%`,

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
  priorityIds = [],
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
    priorityIds,
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
      const engineHoursDelta =
        estado === TELEMETRY_STATUS.MOVING || estado === TELEMETRY_STATUS.IDLE
          ? intervalMs / 3600000
          : 0
      const nextFuelPercent = getNextFuelPercent({
        previousFuelPercent: previous.fuelPercent,
        status: estado,
        speed: velocidad,
        intervalMs,
      })
      const nextCanMetrics = getNextCanMetrics({
        status: estado,
        speed: velocidad,
      })
      const nextCanFuelUsed = roundMetric(
        (previous.canFuelUsed || 0) + ((nextCanMetrics.canFuelRate || 0) * intervalMs) / 3600000,
        2,
      )
      const nextIgnition = isEngineOnStatus(estado)

      const nextState = {
        ...previous,
        ...nextPosition,
        estado,
        ignition: nextIgnition,
        digitalInput1: nextIgnition,
        digitalInput2: estado === TELEMETRY_STATUS.OFFLINE ? false : previous.digitalInput2,
        velocidad,
        heading,
        odometerKm: roundMetric((previous.odometerKm || 0) + nextPosition.distanceKm, 1),
        totalHourmeterHours: roundMetric((previous.totalHourmeterHours || 0) + engineHoursDelta, 2),
        dailyHourmeterHours: roundMetric((previous.dailyHourmeterHours || 0) + engineHoursDelta, 2),
        fuelPercent: nextFuelPercent,
        gpsSignal: getNextGpsSignal(estado, previous.gpsSignal),
        gpsSatellites: getNextSatellites(estado),
        ...nextCanMetrics,
        canFuelUsed: nextCanFuelUsed,
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
  getPriorityIds = null,
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
    const priorityIds = typeof getPriorityIds === "function" ? getPriorityIds() : []

    return generateTelemetryBatch({
      telemetryState,
      batchSize,
      intervalMs,
      priorityIds,
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
