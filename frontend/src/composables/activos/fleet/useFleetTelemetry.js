import { computed, onBeforeUnmount, shallowRef, triggerRef } from "vue"
import { createMockTelemetryStream } from "../../../data/mockTelemetryStream.js"
import { parseNumberFromLabel } from "../../../utils/numberUtils.js"
import {
  formatTelemetryTime,
  getTelemetryTimestamp,
  normalizeTelemetryReports,
} from "../../../utils/telemetryUtils.js"

const DEFAULT_MOCK_INTERVAL_MS = 1000
const DEFAULT_MOCK_BATCH_SIZE = 25
const TELEMETRY_REPORTS_LIMIT = 500

const normalizeId = (value) => {
  return String(value ?? "")
}

const isValidNumber = (value) => {
  return Number.isFinite(Number(value))
}

const normalizeCoordinate = (value, fallback = null) => {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return fallback

  return numberValue
}

const formatSpeedLabel = (value) => {
  const numberValue = parseNumberFromLabel(value, null)

  if (!isValidNumber(numberValue)) return "-"

  return `${Number(numberValue).toFixed(1)} km/h`
}

const normalizeTelemetryUpdate = (update = {}) => {
  const id = normalizeId(update.id)

  if (!id) return null

  const timestamp = getTelemetryTimestamp(update)
  const speedValue = parseNumberFromLabel(
    update.speed ?? update.velocidad_kmh ?? update.velocidad ?? 0,
    null,
  )

  return {
    ...update,

    id,

    lat: normalizeCoordinate(update.lat),
    lng: normalizeCoordinate(update.lng),

    estado: update.estado || update.status || null,

    speed: speedValue ?? 0,
    velocidad: update.velocidad || formatSpeedLabel(speedValue ?? 0),
    velocidad_kmh: speedValue ?? 0,

    timestamp,
    lastReport: timestamp,
    lastReportAt: timestamp,
    reportedAt: timestamp,
    updatedAt: timestamp,
    updated_at: timestamp,

    datosUlt: update.datosUlt || formatTelemetryTime(timestamp),

    direccion: update.direccion || update.address || null,
    address: update.address || update.direccion || null,

    odometro: update.odometro || update.odometer || null,
    odometer: update.odometer || update.odometro || null,
  }
}

const buildTelemetryHistoryPoint = (activo = {}, update = {}) => {
  const timestamp = getTelemetryTimestamp(update)
  const assetId = normalizeId(activo.id || update.id)
  const speedValue = parseNumberFromLabel(
    update.speed ??
      update.velocidad_kmh ??
      update.velocidad ??
      activo.speed ??
      activo.velocidad ??
      0,
    null,
  )

  const lat = update.lat ?? activo.lat
  const lng = update.lng ?? activo.lng
  const cleanTimestamp = String(timestamp).replace(/\D/g, "")

  return {
    id: `${assetId}-telemetry-${cleanTimestamp}`,
    assetId,
    timestamp,

    lat,
    lng,

    speed: speedValue ?? 0,
    velocidad: update.velocidad || formatSpeedLabel(speedValue ?? 0),
    velocidad_kmh: speedValue ?? 0,

    estado: update.estado || activo.estado,

    address:
      update.address ||
      update.direccion ||
      activo.address ||
      activo.direccion ||
      "Ubicacion actual",
    direccion:
      update.direccion ||
      update.address ||
      activo.direccion ||
      activo.address ||
      "Ubicacion actual",

    event: "Reporte GPS",

    odometer: update.odometer || update.odometro || activo.odometer || activo.odometro || null,
    odometro: update.odometro || update.odometer || activo.odometro || activo.odometer || null,

    isLiveTelemetry: true,
    isCurrentLocation: true,
  }
}

const getTelemetryReportKey = (report = {}) => {
  return [report.assetId, report.timestamp, report.lat, report.lng, report.speed]
    .map((value) => String(value ?? ""))
    .join("|")
}

const appendTelemetryReport = ({ activo, update }) => {
  const currentReports = normalizeTelemetryReports(activo.telemetryReports)
  const nextReport = buildTelemetryHistoryPoint(activo, update)
  const nextReportKey = getTelemetryReportKey(nextReport)

  const alreadyExists = currentReports.some((report) => {
    return getTelemetryReportKey(report) === nextReportKey
  })

  if (alreadyExists) {
    return currentReports
  }

  return [...currentReports, nextReport].slice(-TELEMETRY_REPORTS_LIMIT)
}

const mergeTelemetryIntoActivo = (activo = {}, update = {}) => {
  const timestamp = getTelemetryTimestamp(update)

  const speedValue = parseNumberFromLabel(
    update.speed ??
      update.velocidad_kmh ??
      update.velocidad ??
      activo.speed ??
      activo.velocidad ??
      0,
    null,
  )

  const hasSpeed = isValidNumber(speedValue)

  const telemetryReports = appendTelemetryReport({
    activo,
    update,
  })

  return {
    ...activo,
    ...update,

    lat: update.lat ?? activo.lat,
    lng: update.lng ?? activo.lng,

    estado: update.estado || activo.estado,

    speed: hasSpeed ? speedValue : activo.speed,
    velocidad: hasSpeed ? formatSpeedLabel(speedValue) : activo.velocidad,
    velocidad_kmh: hasSpeed ? speedValue : activo.velocidad_kmh,

    lastTelemetryAt: timestamp,
    timestamp,
    lastReport: timestamp,
    lastReportAt: timestamp,
    reportedAt: timestamp,
    updatedAt: timestamp,
    updated_at: timestamp,

    datosUlt: update.datosUlt || formatTelemetryTime(timestamp),

    direccion: update.direccion || update.address || activo.direccion,
    address: update.address || update.direccion || activo.address || activo.direccion,

    odometro: update.odometro || update.odometer || activo.odometro,
    odometer: update.odometer || update.odometro || activo.odometer,

    telemetryReports,
  }
}

export function useFleetTelemetry(initialSnapshot = [], options = {}) {
  const activos = shallowRef([])
  const activosById = shallowRef(new Map())

  const indexById = new Map()

  let mockTelemetryStream = null

  const activeCount = computed(() => {
    return activos.value.length
  })

  const rebuildIndexes = (snapshot = []) => {
    indexById.clear()

    const nextActivosById = new Map()

    snapshot.forEach((activo, index) => {
      const id = normalizeId(activo?.id)

      if (!id) return

      indexById.set(id, index)
      nextActivosById.set(id, activo)
    })

    activosById.value = nextActivosById
  }

  const replaceFleetSnapshot = (snapshot = []) => {
    const nextSnapshot = Array.isArray(snapshot)
      ? snapshot.map((activo) => ({
          ...activo,
          telemetryReports: normalizeTelemetryReports(activo.telemetryReports),
        }))
      : []

    activos.value = nextSnapshot
    rebuildIndexes(nextSnapshot)

    if (mockTelemetryStream) {
      mockTelemetryStream.replaceSnapshot(nextSnapshot)
    }
  }

  const upsertActivo = (activo) => {
    const id = normalizeId(activo?.id)

    if (!id) return

    const existingIndex = indexById.get(id)

    if (existingIndex === undefined) {
      const nextActivo = {
        ...activo,
        telemetryReports: normalizeTelemetryReports(activo.telemetryReports),
      }

      const nextSnapshot = [...activos.value, nextActivo]

      activos.value = nextSnapshot
      rebuildIndexes(nextSnapshot)
      triggerRef(activos)
      triggerRef(activosById)
      return
    }

    const currentActivo = activos.value[existingIndex]

    const nextActivo = {
      ...activo,
      telemetryReports: normalizeTelemetryReports(
        activo.telemetryReports || currentActivo?.telemetryReports,
      ),
    }

    const nextSnapshot = activos.value.map((currentItem, index) => {
      return index === existingIndex ? nextActivo : currentItem
    })

    activos.value = nextSnapshot
    rebuildIndexes(nextSnapshot)
    triggerRef(activos)
    triggerRef(activosById)
  }

  const removeActivo = (id) => {
    const normalizedId = normalizeId(id)
    const existingIndex = indexById.get(normalizedId)

    if (existingIndex === undefined) return

    const nextSnapshot = activos.value.filter((_, index) => {
      return index !== existingIndex
    })

    activos.value = nextSnapshot
    rebuildIndexes(nextSnapshot)
    triggerRef(activos)
    triggerRef(activosById)
  }

  const applyTelemetryBatch = (batch = []) => {
    if (!Array.isArray(batch) || !batch.length) return []

    const updatesById = new Map()

    batch.forEach((rawUpdate) => {
      const update = normalizeTelemetryUpdate(rawUpdate)

      if (!update) return

      updatesById.set(update.id, update)
    })

    if (!updatesById.size) return []

    const appliedUpdates = []

    const nextSnapshot = activos.value.map((activo) => {
      const id = normalizeId(activo?.id)
      const update = updatesById.get(id)

      if (!update) return activo

      const nextActivo = mergeTelemetryIntoActivo(activo, update)

      appliedUpdates.push({
        ...update,
        activo: nextActivo,
      })

      return nextActivo
    })

    if (appliedUpdates.length) {
      activos.value = nextSnapshot
      rebuildIndexes(nextSnapshot)

      triggerRef(activos)
      triggerRef(activosById)
    }

    return appliedUpdates
  }

  const getActivoById = (id) => {
    return activosById.value.get(normalizeId(id)) || null
  }

  const stopMockTelemetry = () => {
    if (!mockTelemetryStream) return

    mockTelemetryStream.stop()
    mockTelemetryStream = null
  }

  const startMockTelemetry = ({
    intervalMs = options.intervalMs || DEFAULT_MOCK_INTERVAL_MS,
    batchSize = options.batchSize || DEFAULT_MOCK_BATCH_SIZE,
    onBatch,
  } = {}) => {
    stopMockTelemetry()

    mockTelemetryStream = createMockTelemetryStream({
      activos: activos.value,
      intervalMs,
      batchSize,
      onBatch: (batch) => {
        const appliedUpdates = applyTelemetryBatch(batch)

        if (typeof onBatch === "function") {
          onBatch(appliedUpdates)
        }
      },
    })

    mockTelemetryStream.start()

    return mockTelemetryStream
  }

  replaceFleetSnapshot(initialSnapshot)

  onBeforeUnmount(() => {
    stopMockTelemetry()
  })

  return {
    activos,
    activosById,
    activeCount,

    applyTelemetryBatch,
    replaceFleetSnapshot,
    upsertActivo,
    removeActivo,
    getActivoById,

    startMockTelemetry,
    stopMockTelemetry,
  }
}
