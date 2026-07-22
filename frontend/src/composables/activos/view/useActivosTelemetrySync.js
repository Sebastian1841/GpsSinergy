import { computed, shallowRef, unref, watch } from "vue"

import { normalizeId } from "../../../utils/idUtils.js"
import { appendTelemetryReports } from "../fleet/useTelemetryHistory.js"

const DEFAULT_TABLE_SYNC_INTERVAL_MS = 2500
const MIN_TABLE_SYNC_INTERVAL_MS = 500

const cloneFleetSnapshot = (snapshot = []) => {
  if (!Array.isArray(snapshot)) return []

  return snapshot.map((activo) => ({
    ...activo,
  }))
}

const getChangedIdsFromUpdates = (updates = []) => {
  if (!Array.isArray(updates)) return []

  return [
    ...new Set(
      updates
        .map((update) => {
          return normalizeId(
            update?.assetId ||
              update?.id ||
              update?.activoId ||
              update?.deviceId ||
              update?.patente ||
              update?.activo?.id ||
              update?.activo?.assetId ||
              update?.activo?.deviceId ||
              update?.activo?.patente,
          )
        })
        .filter(Boolean),
    ),
  ]
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

const buildActivoIdsSignature = (activos = []) => {
  let hash = 2166136261
  let count = 0

  activos.forEach((activo) => {
    const id = normalizeId(activo?.id)

    if (!id) return

    count += 1

    for (let index = 0; index < id.length; index += 1) {
      hash ^= id.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }
  })

  return `${count}:${hash >>> 0}`
}

export function useActivosTelemetrySync({
  telemetryActivos,
  baseNormalizedActivos,
  filterActivosByCurrentState,
  replaceFleetSnapshot,
  startMockTelemetry,
  stopMockTelemetry,
  appendTelemetryPulses,
  ensureSelectedActivo,
  getPriorityTelemetryIds = () => [],
  onTelemetryBatch,
  recordTelemetryReports = true,
  mockTelemetryEnabled,
  mockTelemetryIntervalMs,
  mockTelemetryBatchSize,
  tableSyncIntervalMs,
}) {
  const tableActivos = shallowRef([])

  let tableSyncTimer = null
  let pendingFullTableSync = false
  let pendingTableUpdateIds = new Set()
  let lastTableSourceSnapshot = null
  let isDisposed = false
  let hasVisibilityListener = false

  const stopWatchers = []

  const normalizedActivos = computed(() => {
    const snapshot = telemetryActivos.value

    return Array.isArray(snapshot) ? snapshot : []
  })

  const resolvedTableSyncIntervalMs = computed(() => {
    const interval = Number(unref(tableSyncIntervalMs))

    if (!Number.isFinite(interval) || interval <= 0) {
      return DEFAULT_TABLE_SYNC_INTERVAL_MS
    }

    return Math.max(interval, MIN_TABLE_SYNC_INTERVAL_MS)
  })

  /*
   * El mapa utiliza la telemetría viva.
   * La tabla usa un snapshot independiente y amortiguado.
   */
  const mapActivos = computed(() => {
    return filterActivosByCurrentState(normalizedActivos.value)
  })

  const filteredActivos = computed(() => {
    return filterActivosByCurrentState(tableActivos.value)
  })

  const mapActivoIdsSignature = computed(() => {
    return buildActivoIdsSignature(mapActivos.value)
  })

  const clearTableSyncTimer = () => {
    if (tableSyncTimer === null) return

    globalThis.clearTimeout(tableSyncTimer)
    tableSyncTimer = null
  }

  const resetPendingTableUpdates = () => {
    pendingFullTableSync = false
    pendingTableUpdateIds = new Set()
  }

  const syncTableActivos = () => {
    const sourceSnapshot = normalizedActivos.value

    tableActivos.value = cloneFleetSnapshot(sourceSnapshot)
    lastTableSourceSnapshot = sourceSnapshot
  }

  const queueTableChangedIds = (changedIds = []) => {
    if (!Array.isArray(changedIds)) return

    changedIds.forEach((id) => {
      const normalizedId = normalizeId(id)

      if (normalizedId) {
        pendingTableUpdateIds.add(normalizedId)
      }
    })
  }

  const queueTableUpdates = (updates = []) => {
    queueTableChangedIds(getChangedIdsFromUpdates(updates))
  }

  const syncTableActivosIncrementally = () => {
    const sourceSnapshot = normalizedActivos.value

    if (!pendingTableUpdateIds.size || !tableActivos.value.length) {
      syncTableActivos()
      return
    }

    if (sourceSnapshot.length !== tableActivos.value.length) {
      syncTableActivos()
      return
    }

    const tableIndexById = buildActivoIndex(tableActivos.value)
    const normalizedActivosById = buildActivosById(sourceSnapshot)
    const nextTableActivos = [...tableActivos.value]

    let hasChanges = false
    let requiresFullSync = false

    pendingTableUpdateIds.forEach((id) => {
      const tableIndex = tableIndexById.get(id)
      const nextActivo = normalizedActivosById.get(id)

      /*
       * Si cambió el conjunto de IDs manteniendo el mismo largo,
       * el reemplazo incremental ya no es seguro.
       */
      if (tableIndex === undefined || !nextActivo) {
        requiresFullSync = true
        return
      }

      nextTableActivos[tableIndex] = {
        ...nextActivo,
      }

      hasChanges = true
    })

    if (requiresFullSync) {
      syncTableActivos()
      return
    }

    if (hasChanges) {
      tableActivos.value = nextTableActivos
    }

    lastTableSourceSnapshot = sourceSnapshot
  }

  const flushTableActivosSync = () => {
    if (isDisposed) return

    if (!pendingFullTableSync && pendingTableUpdateIds.size === 0) {
      return
    }

    if (pendingFullTableSync) {
      syncTableActivos()
    } else {
      syncTableActivosIncrementally()
    }

    resetPendingTableUpdates()
  }

  const scheduleTableActivosSync = ({
    immediate = false,
    full = false,
    updates = [],
    changedIds = [],
  } = {}) => {
    if (isDisposed) return

    const hasQueuedUpdates = Array.isArray(updates) && updates.length > 0
    const hasQueuedIds = Array.isArray(changedIds) && changedIds.length > 0

    if (!immediate && !full && !hasQueuedUpdates && !hasQueuedIds) {
      return
    }

    if (full) {
      pendingFullTableSync = true
    }

    queueTableUpdates(updates)
    queueTableChangedIds(changedIds)

    if (immediate) {
      clearTableSyncTimer()

      pendingFullTableSync = true
      flushTableActivosSync()
      return
    }

    if (tableSyncTimer !== null) return

    tableSyncTimer = globalThis.setTimeout(() => {
      tableSyncTimer = null
      flushTableActivosSync()
    }, resolvedTableSyncIntervalMs.value)
  }

  const handleTelemetryBatch = (batch = []) => {
    if (isDisposed || !Array.isArray(batch) || batch.length === 0) {
      return
    }

    /*
     * El mapa recibe el lote inmediatamente.
     */
    if (typeof onTelemetryBatch === "function") {
      onTelemetryBatch(batch)
    }

    /*
     * La terminal mantiene su propio historial limitado.
     */
    if (typeof appendTelemetryPulses === "function") {
      appendTelemetryPulses(batch)
    }

    if (recordTelemetryReports) {
      /*
       * El historial global se actualiza con cada lote.
       * Los reportes no se regeneran automáticamente; solo leerán este
       * historial cuando el usuario vuelva a presionar Generar.
       */
      appendTelemetryReports(batch)
    }

    /*
     * La tabla acumula IDs modificados y los aplica cada 2,5 segundos.
     */
    scheduleTableActivosSync({
      updates: batch,
    })
  }

  const mockTelemetryConfig = {
    intervalMs: mockTelemetryIntervalMs,
    batchSize: mockTelemetryBatchSize,
    getPriorityIds: getPriorityTelemetryIds,
    onBatch: handleTelemetryBatch,
  }

  const isMockTelemetryEnabled = () => {
    return Boolean(unref(mockTelemetryEnabled))
  }

  const startTelemetryMock = () => {
    if (isDisposed || !isMockTelemetryEnabled()) return
    if (typeof startMockTelemetry !== "function") return

    startMockTelemetry(mockTelemetryConfig)
  }

  const stopTelemetryMock = () => {
    if (typeof stopMockTelemetry !== "function") return

    stopMockTelemetry()
  }

  const syncMockTelemetryVisibility = () => {
    if (!isMockTelemetryEnabled()) {
      stopTelemetryMock()
      return
    }

    if (typeof document !== "undefined" && document.hidden) {
      stopTelemetryMock()
      return
    }

    /*
     * Siempre se entrega la configuración completa al reanudar.
     * Así no se pierde onBatch después de cambiar de pestaña.
     */
    startTelemetryMock()
  }

  const stopBaseSnapshotWatcher = watch(
    baseNormalizedActivos,
    (snapshot) => {
      if (isDisposed) return

      replaceFleetSnapshot(Array.isArray(snapshot) ? snapshot : [])

      scheduleTableActivosSync({
        immediate: true,
        full: true,
      })
    },
    {
      immediate: true,
    },
  )

  stopWatchers.push(stopBaseSnapshotWatcher)

  const stopNormalizedActivosWatcher = watch(normalizedActivos, (snapshot) => {
    if (isDisposed || snapshot === lastTableSourceSnapshot) {
      return
    }

    if (snapshot.length !== tableActivos.value.length) {
      scheduleTableActivosSync({
        full: true,
      })

      return
    }

    /*
     * En el flujo normal, handleTelemetryBatch ya dejó los IDs
     * modificados en cola. No se programa una clonación completa.
     */
    if (pendingFullTableSync || pendingTableUpdateIds.size > 0) {
      return
    }

    /*
     * Respaldo para telemetría real o externa que modifique
     * telemetryActivos sin pasar por handleTelemetryBatch.
     */
    scheduleTableActivosSync({
      full: true,
    })
  })

  stopWatchers.push(stopNormalizedActivosWatcher)

  const stopMapActivoIdsWatcher = watch(
    mapActivoIdsSignature,
    () => {
      if (typeof ensureSelectedActivo === "function") {
        ensureSelectedActivo()
      }
    },
    {
      immediate: true,
    },
  )

  stopWatchers.push(stopMapActivoIdsWatcher)

  if (isMockTelemetryEnabled()) {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", syncMockTelemetryVisibility)

      hasVisibilityListener = true
    }

    syncMockTelemetryVisibility()
  }

  const cleanupTelemetrySync = () => {
    if (isDisposed) return

    isDisposed = true

    if (hasVisibilityListener && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", syncMockTelemetryVisibility)

      hasVisibilityListener = false
    }

    stopWatchers.forEach((stopWatcher) => {
      stopWatcher()
    })

    stopTelemetryMock()
    clearTableSyncTimer()
    resetPendingTableUpdates()

    lastTableSourceSnapshot = null
  }

  return {
    normalizedActivos,
    tableActivos,
    mapActivos,
    filteredActivos,

    syncTableActivos,
    scheduleTableActivosSync,
    cleanupTelemetrySync,
  }
}
