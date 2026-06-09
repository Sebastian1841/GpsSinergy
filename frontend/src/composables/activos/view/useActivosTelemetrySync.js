import { computed, ref, shallowRef, unref, watch } from "vue"
import { normalizeId } from "../../../utils/idUtils.js"

const DEFAULT_TABLE_SYNC_INTERVAL_MS = 2500
const MIN_TABLE_SYNC_INTERVAL_MS = 500

const cloneFleetSnapshot = (snapshot = []) => {
  return snapshot.map((activo) => {
    return {
      ...activo,
    }
  })
}

export function useActivosTelemetrySync({
  telemetryActivos,
  baseNormalizedActivos,
  filterActivosByCurrentState,
  statusFilter,
  sectionSearch,
  replaceFleetSnapshot,
  startMockTelemetry,
  stopMockTelemetry,
  appendTelemetryPulses,
  ensureSelectedActivo,
  mockTelemetryEnabled,
  mockTelemetryIntervalMs,
  mockTelemetryBatchSize,
  tableSyncIntervalMs,
}) {
  const tableActivos = shallowRef([])
  const latestTelemetryBatch = ref([])

  let tableSyncTimer = null
  let pendingFullTableSync = false
  let pendingTableUpdateIds = new Set()

  const normalizedActivos = computed(() => {
    return telemetryActivos.value
  })

  const resolvedTableSyncIntervalMs = computed(() => {
    const interval = Number(unref(tableSyncIntervalMs))

    if (!Number.isFinite(interval) || interval <= 0) {
      return DEFAULT_TABLE_SYNC_INTERVAL_MS
    }

    return Math.max(interval, MIN_TABLE_SYNC_INTERVAL_MS)
  })

  /*
    IMPORTANTE:
    El mapa usa los activos vivos, no el snapshot de tabla.
    Así puede recibir telemetría frecuente sin obligar a la tabla a rerenderizar.
  */
  const mapActivos = computed(() => {
    return filterActivosByCurrentState(normalizedActivos.value)
  })

  /*
    La tabla usa un snapshot controlado.
    Esto evita que ordenamiento, filtros y filas se recalculen con cada pulso GPS.
  */
  const filteredActivos = computed(() => {
    return filterActivosByCurrentState(tableActivos.value)
  })

  const mapActivoIdsSignature = computed(() => {
    return mapActivos.value
      .map((activo) => normalizeId(activo?.id))
      .filter(Boolean)
      .join("|")
  })

  const syncTableActivos = () => {
    tableActivos.value = cloneFleetSnapshot(normalizedActivos.value)
  }

  const queueTableUpdates = (updates = []) => {
    if (!Array.isArray(updates)) return

    updates.forEach((update) => {
      const id = normalizeId(update?.id)

      if (id) {
        pendingTableUpdateIds.add(id)
      }
    })
  }

  const buildActivoIndex = (activos = []) => {
    const indexById = new Map()

    activos.forEach((activo, index) => {
      const id = normalizeId(activo?.id)

      if (id) {
        indexById.set(id, index)
      }
    })

    return indexById
  }

  const buildActivosById = (activos = []) => {
    const activosById = new Map()

    activos.forEach((activo) => {
      const id = normalizeId(activo?.id)

      if (id) {
        activosById.set(id, activo)
      }
    })

    return activosById
  }

  const syncTableActivosIncrementally = () => {
    if (!pendingTableUpdateIds.size || !tableActivos.value.length) {
      syncTableActivos()
      return
    }

    const tableIndexById = buildActivoIndex(tableActivos.value)
    const normalizedActivosById = buildActivosById(normalizedActivos.value)
    const nextTableActivos = [...tableActivos.value]
    let hasChanges = false

    pendingTableUpdateIds.forEach((id) => {
      const tableIndex = tableIndexById.get(id)
      const nextActivo = normalizedActivosById.get(id)

      if (tableIndex === undefined || !nextActivo) return

      nextTableActivos[tableIndex] = {
        ...nextActivo,
      }

      hasChanges = true
    })

    if (hasChanges) {
      tableActivos.value = nextTableActivos
    }
  }

  const flushTableActivosSync = () => {
    if (pendingFullTableSync) {
      syncTableActivos()
    } else {
      syncTableActivosIncrementally()
    }

    pendingFullTableSync = false
    pendingTableUpdateIds = new Set()
  }

  const scheduleTableActivosSync = ({ immediate = false, full = false, updates = [] } = {}) => {
    if (full) {
      pendingFullTableSync = true
    }

    queueTableUpdates(updates)

    if (immediate) {
      if (tableSyncTimer) {
        window.clearTimeout(tableSyncTimer)
        tableSyncTimer = null
      }

      pendingFullTableSync = true
      flushTableActivosSync()
      return
    }

    if (tableSyncTimer) return

    tableSyncTimer = window.setTimeout(() => {
      tableSyncTimer = null
      flushTableActivosSync()
    }, resolvedTableSyncIntervalMs.value)
  }

  watch(
    baseNormalizedActivos,
    (snapshot) => {
      latestTelemetryBatch.value = []
      replaceFleetSnapshot(snapshot)
      scheduleTableActivosSync({
        immediate: true,
        full: true,
      })
    },
    {
      immediate: true,
    },
  )

  watch(normalizedActivos, (snapshot) => {
    if (snapshot.length !== tableActivos.value.length) {
      scheduleTableActivosSync({
        full: true,
      })

      return
    }

    /*
      Respaldo para telemetría real o externa:
      si telemetryActivos cambia fuera de startMockTelemetry/onBatch,
      la tabla igual se actualiza, pero de forma lenta.
    */
    scheduleTableActivosSync()
  })

  watch(
    () => [statusFilter.value, sectionSearch.value.activos],
    () => {
      scheduleTableActivosSync({
        full: true,
      })
    },
  )

  /*
    Antes esto observaba mapActivos completo.
    Eso podía ejecutar ensureSelectedActivo() por cada cambio de lat/lng.
    Ahora se dispara cuando cambia el conjunto de activos visibles.
  */
  watch(
    mapActivoIdsSignature,
    () => {
      ensureSelectedActivo()
    },
    {
      immediate: true,
    },
  )

  if (mockTelemetryEnabled) {
    startMockTelemetry({
      intervalMs: mockTelemetryIntervalMs,
      batchSize: mockTelemetryBatchSize,
      onBatch: (batch = []) => {
        latestTelemetryBatch.value = batch
        appendTelemetryPulses(batch)
        scheduleTableActivosSync({
          updates: batch,
        })
      },
    })
  }

  const cleanupTelemetrySync = () => {
    stopMockTelemetry()

    if (tableSyncTimer) {
      window.clearTimeout(tableSyncTimer)
      tableSyncTimer = null
    }

    pendingFullTableSync = false
    pendingTableUpdateIds = new Set()
  }

  return {
    normalizedActivos,
    tableActivos,
    latestTelemetryBatch,
    mapActivos,
    filteredActivos,

    syncTableActivos,
    scheduleTableActivosSync,
    cleanupTelemetrySync,
  }
}
