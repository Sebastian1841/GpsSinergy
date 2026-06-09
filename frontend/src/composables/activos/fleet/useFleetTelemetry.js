import { computed, onBeforeUnmount, shallowRef, triggerRef } from "vue"
import { createMockTelemetryStream } from "../../../data/mockTelemetryStream.js"
import { parseNumberFromLabel } from "../../../utils/numberUtils.js"
import { endDevMeasure, startDevMeasure } from "../../../utils/performanceUtils.js"
import { formatTelemetryTime, getTelemetryTimestamp } from "../../../utils/telemetryUtils.js"
import {
  appendTelemetryReports,
  clearReportsForAsset,
  clearTelemetryHistory,
} from "./useTelemetryHistory.js"

const DEFAULT_MOCK_INTERVAL_MS = 1000
const DEFAULT_MOCK_BATCH_SIZE = 25
const APPLY_TELEMETRY_BATCH_MEASURE = "applyTelemetryBatch"

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

const removeTelemetryReportsFromActivo = (activo = {}) => {
  const cleanActivo = { ...activo }

  delete cleanActivo.telemetryReports

  return cleanActivo
}

const appendActivoTelemetryReports = (activo = {}) => {
  const id = normalizeId(activo?.id)
  const telemetryReports = Array.isArray(activo?.telemetryReports) ? activo.telemetryReports : []

  if (!id || !telemetryReports.length) return

  appendTelemetryReports(
    telemetryReports.map((report) => ({
      ...report,
      id,
      assetId: id,
      activo,
      isLiveTelemetry: report.isLiveTelemetry ?? false,
      isCurrentLocation: report.isCurrentLocation ?? false,
    })),
  )
}

const appendSnapshotTelemetryReports = (snapshot = []) => {
  snapshot.forEach((activo) => {
    appendActivoTelemetryReports(activo)
  })
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

  return removeTelemetryReportsFromActivo({
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
  })
}

export function useFleetTelemetry(initialSnapshot = [], options = {}) {
  const activos = shallowRef([])
  const activosById = shallowRef(new Map())
  const assetOrderIds = shallowRef([])

  const indexById = new Map()

  let mockTelemetryStream = null

  const activeCount = computed(() => {
    return assetOrderIds.value.length
  })

  const rebuildIndexes = (snapshot = []) => {
    indexById.clear()

    const nextActivosById = new Map()
    const nextAssetOrderIds = []

    snapshot.forEach((activo, index) => {
      const id = normalizeId(activo?.id)

      if (!id) return

      indexById.set(id, index)
      nextActivosById.set(id, activo)
      nextAssetOrderIds.push(id)
    })

    activosById.value = nextActivosById
    assetOrderIds.value = nextAssetOrderIds
  }

  const replaceFleetSnapshot = (snapshot = []) => {
    const sourceSnapshot = Array.isArray(snapshot) ? snapshot : []

    clearTelemetryHistory()
    appendSnapshotTelemetryReports(sourceSnapshot)

    const nextSnapshot = sourceSnapshot.map(removeTelemetryReportsFromActivo)

    activos.value = nextSnapshot
    rebuildIndexes(nextSnapshot)

    if (mockTelemetryStream) {
      mockTelemetryStream.replaceSnapshot(nextSnapshot)
    }
  }

  const upsertActivo = (activo) => {
    const id = normalizeId(activo?.id)

    if (!id) return

    appendActivoTelemetryReports(activo)

    const cleanActivo = removeTelemetryReportsFromActivo(activo)
    const existingIndex = indexById.get(id)

    if (existingIndex === undefined) {
      indexById.set(id, activos.value.length)
      activosById.value.set(id, cleanActivo)

      activos.value = [...activos.value, cleanActivo]
      assetOrderIds.value = [...assetOrderIds.value, id]

      triggerRef(activosById)
      triggerRef(assetOrderIds)

      return
    }

    const currentActivo = activos.value[existingIndex]

    const nextActivo = {
      ...currentActivo,
      ...cleanActivo,
    }

    activos.value[existingIndex] = nextActivo
    activosById.value.set(id, nextActivo)

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

    clearReportsForAsset(normalizedId)

    activos.value = nextSnapshot
    rebuildIndexes(nextSnapshot)

    triggerRef(activos)
    triggerRef(activosById)
    triggerRef(assetOrderIds)
  }

  const applyTelemetryBatch = (batch = []) => {
    const measure = startDevMeasure(APPLY_TELEMETRY_BATCH_MEASURE)

    try {
      if (!Array.isArray(batch) || !batch.length) return []

      const updatesById = new Map()

      batch.forEach((rawUpdate) => {
        const update = normalizeTelemetryUpdate(rawUpdate)

        if (!update) return

        updatesById.set(update.id, update)
      })

      if (!updatesById.size) return []

      const appliedUpdates = []

      updatesById.forEach((update) => {
        const currentActivo = activosById.value.get(update.id)
        const existingIndex = indexById.get(update.id)

        if (!currentActivo || existingIndex === undefined) return

        const nextActivo = mergeTelemetryIntoActivo(currentActivo, update)

        activosById.value.set(update.id, nextActivo)
        activos.value[existingIndex] = nextActivo

        appliedUpdates.push({
          ...update,
          activo: nextActivo,
        })
      })

      if (appliedUpdates.length) {
        appendTelemetryReports(appliedUpdates)

        triggerRef(activos)
        triggerRef(activosById)
      }

      return appliedUpdates
    } finally {
      endDevMeasure(measure)
    }
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
    assetOrderIds,
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
