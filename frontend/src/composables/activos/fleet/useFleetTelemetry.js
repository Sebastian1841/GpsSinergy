import { computed, onBeforeUnmount, shallowRef, triggerRef } from "vue"
import { createMockTelemetryStream } from "../../../data/mockTelemetryStream.js"

const DEFAULT_MOCK_INTERVAL_MS = 1000
const DEFAULT_MOCK_BATCH_SIZE = 25

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

const formatTelemetryTime = (timestamp) => {
  if (!timestamp) return "-"

  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

const formatSpeedLabel = (value) => {
  if (!isValidNumber(value)) return "-"

  return `${Number(value).toFixed(1)} km/h`
}

const normalizeTelemetryUpdate = (update = {}) => {
  const id = normalizeId(update.id)

  if (!id) return null

  return {
    id,
    lat: normalizeCoordinate(update.lat),
    lng: normalizeCoordinate(update.lng),
    estado: update.estado || update.status || null,
    velocidad: isValidNumber(update.velocidad) ? Number(update.velocidad) : null,
    speed: isValidNumber(update.speed) ? Number(update.speed) : null,
    timestamp: update.timestamp || update.updatedAt || new Date().toISOString(),
  }
}

const mergeTelemetryIntoActivo = (activo = {}, update = {}) => {
  const speedValue = update.velocidad ?? update.speed
  const hasSpeed = isValidNumber(speedValue)
  const timestamp = update.timestamp || new Date().toISOString()

  return {
    ...activo,

    lat: update.lat ?? activo.lat,
    lng: update.lng ?? activo.lng,

    estado: update.estado || activo.estado,

    speed: hasSpeed ? Number(speedValue) : activo.speed,
    velocidad: hasSpeed ? formatSpeedLabel(speedValue) : activo.velocidad,

    lastTelemetryAt: timestamp,
    timestamp,
    datosUlt: formatTelemetryTime(timestamp),
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
    const nextSnapshot = Array.isArray(snapshot) ? [...snapshot] : []

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
      indexById.set(id, activos.value.length)
      activos.value.push(activo)
      activosById.value.set(id, activo)

      triggerRef(activos)
      triggerRef(activosById)
      return
    }

    activos.value[existingIndex] = activo
    activosById.value.set(id, activo)

    triggerRef(activos)
    triggerRef(activosById)
  }

  const removeActivo = (id) => {
    const normalizedId = normalizeId(id)
    const existingIndex = indexById.get(normalizedId)

    if (existingIndex === undefined) return

    activos.value.splice(existingIndex, 1)
    activosById.value.delete(normalizedId)
    rebuildIndexes(activos.value)

    triggerRef(activos)
    triggerRef(activosById)
  }

  const applyTelemetryBatch = (batch = []) => {
    if (!Array.isArray(batch) || !batch.length) return []

    const appliedUpdates = []

    batch.forEach((rawUpdate) => {
      const update = normalizeTelemetryUpdate(rawUpdate)

      if (!update) return

      const existingIndex = indexById.get(update.id)

      if (existingIndex === undefined) return

      const currentActivo = activos.value[existingIndex]

      if (!currentActivo) return

      const nextActivo = mergeTelemetryIntoActivo(currentActivo, update)

      activos.value[existingIndex] = nextActivo
      activosById.value.set(update.id, nextActivo)
      appliedUpdates.push(update)
    })

    if (appliedUpdates.length) {
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

  const generateMockTelemetryBatch = ({
    batchSize = options.batchSize || DEFAULT_MOCK_BATCH_SIZE,
  } = {}) => {
    if (!mockTelemetryStream) {
      mockTelemetryStream = createMockTelemetryStream({
        activos: activos.value,
        intervalMs: options.intervalMs || DEFAULT_MOCK_INTERVAL_MS,
        batchSize,
      })
    }

    const batch = mockTelemetryStream.generateBatch()
    const appliedUpdates = applyTelemetryBatch(batch)

    return appliedUpdates
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
    generateMockTelemetryBatch,
  }
}
