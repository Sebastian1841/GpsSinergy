import assert from "node:assert/strict"
import test from "node:test"
import { nextTick, ref } from "vue"

import { clearTelemetryHistory, getReportsForAsset } from "../fleet/useTelemetryHistory.js"
import { useActivosTelemetrySync } from "./useActivosTelemetrySync.js"

const createFakeTimerApi = () => {
  const originalSetTimeout = globalThis.setTimeout
  const originalClearTimeout = globalThis.clearTimeout
  const timers = new Map()
  let nextTimerId = 0

  globalThis.setTimeout = (callback, delay) => {
    const timerId = `timer-${(nextTimerId += 1)}`

    timers.set(timerId, {
      callback,
      delay,
      cleared: false,
    })

    return timerId
  }

  globalThis.clearTimeout = (timerId) => {
    const timer = timers.get(timerId)

    if (timer) {
      timer.cleared = true
    }
  }

  return {
    timers,
    runNextTimer() {
      const nextTimer = Array.from(timers.entries()).find(([_timerId, timer]) => {
        return !timer.cleared
      })

      if (!nextTimer) return false

      const [timerId, timer] = nextTimer

      timers.delete(timerId)
      timer.callback()

      return true
    },
    restore() {
      globalThis.setTimeout = originalSetTimeout
      globalThis.clearTimeout = originalClearTimeout
    },
  }
}

const createSyncHarness = (overrides = {}) => {
  const telemetryActivos = ref([])
  const baseNormalizedActivos = ref(
    overrides.baseNormalizedActivos || [
      {
        id: "asset-1",
        patente: "AAA-111",
        estado: "moving",
        speed: 10,
      },
      {
        id: "asset-2",
        patente: "BBB-222",
        estado: "stopped",
        speed: 0,
      },
    ],
  )
  const replacedSnapshots = []
  const telemetryBatches = []
  const terminalBatches = []
  const ensureSelectedCalls = []
  let startedMockConfig = null
  let stopMockTelemetryCalls = 0

  const sync = useActivosTelemetrySync({
    telemetryActivos,
    baseNormalizedActivos,
    filterActivosByCurrentState:
      overrides.filterActivosByCurrentState ||
      ((activos = []) => {
        return activos
      }),
    replaceFleetSnapshot: (snapshot = []) => {
      replacedSnapshots.push(snapshot)
      telemetryActivos.value = snapshot.map((activo) => ({ ...activo }))
    },
    startMockTelemetry: (config) => {
      startedMockConfig = config
    },
    stopMockTelemetry: () => {
      stopMockTelemetryCalls += 1
    },
    appendTelemetryPulses: (batch) => {
      terminalBatches.push(batch)
    },
    ensureSelectedActivo: () => {
      ensureSelectedCalls.push(true)
    },
    getPriorityTelemetryIds: overrides.getPriorityTelemetryIds || (() => ["asset-2"]),
    onTelemetryBatch: (batch) => {
      telemetryBatches.push(batch)
    },
    mockTelemetryEnabled: overrides.mockTelemetryEnabled ?? false,
    mockTelemetryIntervalMs: 1000,
    mockTelemetryBatchSize: 3,
    tableSyncIntervalMs: overrides.tableSyncIntervalMs ?? 1,
  })

  return {
    telemetryActivos,
    baseNormalizedActivos,
    replacedSnapshots,
    telemetryBatches,
    terminalBatches,
    ensureSelectedCalls,
    get startedMockConfig() {
      return startedMockConfig
    },
    get stopMockTelemetryCalls() {
      return stopMockTelemetryCalls
    },
    sync,
  }
}

test("activos telemetry sync keeps the table snapshot buffered and applies incremental updates on flush", async () => {
  const timerApi = createFakeTimerApi()

  try {
    const harness = createSyncHarness()

    await nextTick()

    assert.equal(harness.replacedSnapshots.length, 1)
    assert.equal(harness.sync.tableActivos.value.length, 2)
    assert.equal(harness.sync.tableActivos.value[0].speed, 10)
    assert.deepEqual(
      harness.sync.mapActivos.value.map((activo) => activo.id),
      ["asset-1", "asset-2"],
    )

    const previousSecondTableActivo = harness.sync.tableActivos.value[1]

    harness.telemetryActivos.value = [
      {
        ...harness.telemetryActivos.value[0],
        speed: 48,
      },
      harness.telemetryActivos.value[1],
    ]

    harness.sync.scheduleTableActivosSync({
      updates: [
        {
          id: "asset-1",
        },
      ],
    })

    assert.equal(harness.sync.mapActivos.value[0].speed, 48)
    assert.equal(harness.sync.tableActivos.value[0].speed, 10)

    const [timer] = Array.from(timerApi.timers.values())

    assert.equal(timer.delay, 500)
    assert.equal(timerApi.runNextTimer(), true)
    assert.equal(harness.sync.tableActivos.value[0].speed, 48)
    assert.equal(harness.sync.tableActivos.value[1], previousSecondTableActivo)

    harness.sync.cleanupTelemetrySync()
  } finally {
    timerApi.restore()
  }
})

test("activos telemetry sync passes priority ids to mock telemetry and propagates batches", async () => {
  clearTelemetryHistory()

  const harness = createSyncHarness({
    mockTelemetryEnabled: true,
    getPriorityTelemetryIds: () => ["terminal-asset"],
  })

  await nextTick()

  assert.ok(harness.startedMockConfig)
  assert.deepEqual(harness.startedMockConfig.getPriorityIds(), ["terminal-asset"])
  assert.equal(harness.startedMockConfig.batchSize, 3)

  const batch = [
    {
      id: "asset-1",
      assetId: "asset-1",
      patente: "AAA-111",
      lat: -33.45,
      lng: -70.66,
      speed: 38,
      timestamp: "2026-07-15T10:00:00.000Z",
    },
  ]

  harness.startedMockConfig.onBatch(batch)

  assert.equal(harness.telemetryBatches.length, 1)
  assert.equal(harness.telemetryBatches[0], batch)
  assert.equal(harness.terminalBatches.length, 1)
  assert.equal(harness.terminalBatches[0], batch)
  assert.equal(getReportsForAsset("asset-1").length, 1)

  harness.sync.cleanupTelemetrySync()
  clearTelemetryHistory()
})

test("activos telemetry sync cleanup stops timers, watchers and mock telemetry", async () => {
  const timerApi = createFakeTimerApi()

  try {
    const harness = createSyncHarness({
      mockTelemetryEnabled: true,
    })

    await nextTick()

    harness.telemetryActivos.value = [
      {
        ...harness.telemetryActivos.value[0],
        speed: 64,
      },
      harness.telemetryActivos.value[1],
    ]

    harness.sync.scheduleTableActivosSync({
      changedIds: ["asset-1"],
    })

    harness.sync.cleanupTelemetrySync()
    assert.equal(harness.stopMockTelemetryCalls, 1)
    assert.equal(timerApi.runNextTimer(), false)

    const tableSpeedAfterCleanup = harness.sync.tableActivos.value[0].speed

    harness.baseNormalizedActivos.value = [
      {
        id: "asset-3",
        patente: "CCC-333",
        estado: "moving",
        speed: 12,
      },
    ]

    await nextTick()

    assert.equal(harness.replacedSnapshots.length, 1)
    assert.equal(harness.sync.tableActivos.value[0].speed, tableSpeedAfterCleanup)
  } finally {
    timerApi.restore()
  }
})
