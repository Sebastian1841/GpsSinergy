import { computed, ref, watch } from "vue"
import { normalizeId } from "../../../utils/idUtils.js"

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
  const tableActivos = ref([])
  const mapSnapshotActivos = ref([])
  const latestTelemetryBatch = ref([])

  let tableSyncTimer = null
  let pendingFullTableSync = false
  let pendingTableUpdateIds = new Set()

  const normalizedActivos = computed(() => {
    return telemetryActivos.value
  })

  const mapActivos = computed(() => {
    return filterActivosByCurrentState(mapSnapshotActivos.value)
  })

  const filteredActivos = computed(() => {
    return filterActivosByCurrentState(tableActivos.value)
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

  const syncMapSnapshotActivos = (snapshot = normalizedActivos.value) => {
    mapSnapshotActivos.value = cloneFleetSnapshot(snapshot)
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
    }, tableSyncIntervalMs)
  }

  watch(
    baseNormalizedActivos,
    (snapshot) => {
      latestTelemetryBatch.value = []
      replaceFleetSnapshot(snapshot)
      syncMapSnapshotActivos(snapshot)
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
    }
  })

  watch(
    () => [statusFilter.value, sectionSearch.value.activos],
    () => {
      syncMapSnapshotActivos()
    },
  )

  watch(
    mapActivos,
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
  }

  return {
    normalizedActivos,
    tableActivos,
    mapSnapshotActivos,
    latestTelemetryBatch,
    mapActivos,
    filteredActivos,

    syncTableActivos,
    syncMapSnapshotActivos,
    scheduleTableActivosSync,
    cleanupTelemetrySync,
  }
}
