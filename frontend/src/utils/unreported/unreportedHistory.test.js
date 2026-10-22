import assert from "node:assert/strict"
import test from "node:test"
import {
  ensureInterruptionHistory,
  closeInterruption,
  interruptionSummary,
  consultationsForInterruption,
  knownEquipmentWithHistory,
  interruptionDurationLabel,
  completedInterruptions,
  interruptionDiagnosis,
} from "./unreportedHistory.js"
const threshold = 6 * 3600000
const start = "2026-10-12T00:00:00.000Z"
const now = "2026-10-13T12:00:00.000Z"

test("history count and visible episodes exclude the current unfinished outage", () => {
  const closed = { id: "closed", lastReportAt: start, recoveredAt: now }
  const current = { id: "current", lastReportAt: now, recoveredAt: null }
  assert.deepEqual(completedInterruptions({ interruptions: [closed, current] }), [closed])
  assert.equal(completedInterruptions({ interruptions: [closed, current] }).length, 1)
  assert.equal(completedInterruptions({ interruptions: [current] }).length, 0)
  assert.deepEqual(completedInterruptions({}), [])
  const second = { ...closed, id: "second" }
  assert.equal(completedInterruptions({ interruptions: [closed, second, current] }).length, 2)
})

test("each episode keeps its own GPS data without using later recovery telemetry", () => {
  let record = ensureInterruptionHistory(
    {
      mode: "active",
      lastSeenAt: start,
      telemetry: { reportedAt: start, externalVoltage: 0, internalVoltage: 3.4 },
    },
    now,
    threshold,
  )
  const first = record.interruptions[0]
  assert.equal(interruptionDiagnosis(first).reason, "Alimentacion desconectada")
  record = closeInterruption(record, now, threshold)
  record = ensureInterruptionHistory(
    {
      ...record,
      mode: "active",
      lastSeenAt: now,
      telemetry: { reportedAt: now, simStatus: "absent" },
    },
    "2026-10-14T12:00:00Z",
    threshold,
  )
  assert.equal(record.interruptions.length, 2)
  assert.equal(interruptionDiagnosis(record.interruptions[0]).reason, "Alimentacion desconectada")
  assert.equal(interruptionDiagnosis(record.interruptions[1]).reason, "SIM ausente")
  assert.equal(interruptionDiagnosis({ lastReportAt: start }).reason, "Diagnostico no registrado")
  assert.equal(record.interruptions[0].telemetry.externalVoltage, 0)
})

test("current known silence creates one open episode and repeated observation is idempotent", () => {
  const record = ensureInterruptionHistory({ mode: "active", lastSeenAt: start }, now, threshold)
  assert.equal(record.interruptions.length, 1)
  assert.equal(record.interruptions[0].lastReportAt, start)
  assert.equal(record.interruptions[0].recoveredAt, null)
  assert.equal(ensureInterruptionHistory(record, now, threshold), record)
  assert.equal(interruptionDurationLabel(record.interruptions[0], now), "1 dias 12 h")
})
test("never reported equipment has no invented interruption and legacy recovery imports only known duration", () => {
  assert.equal(
    ensureInterruptionHistory({ mode: "active", lastSeenAt: null }, now, threshold).interruptions
      .length,
    0,
  )
  const legacy = ensureInterruptionHistory(
    { mode: "recovered", recoveredAt: now, lastSeenAt: now, outageDurationMs: 36 * 3600000 },
    now,
    threshold,
  )
  assert.equal(legacy.interruptions[0].lastReportAt, start)
  assert.equal(ensureInterruptionHistory(legacy, now, threshold), legacy)
  assert.equal(
    ensureInterruptionHistory(
      { mode: "recovered", recoveredAt: now, lastSeenAt: now, outageDurationMs: null },
      now,
      threshold,
    ).interruptions.length,
    0,
  )
})
test("late packets inside the threshold correct an open episode instead of inflating recovery counts", () => {
  const record = ensureInterruptionHistory({ mode: "active", lastSeenAt: start }, now, threshold)
  const corrected = closeInterruption(record, "2026-10-12T01:00:00.000Z", threshold, now)
  assert.equal(corrected.interruptions.length, 1)
  assert.equal(corrected.interruptions[0].id, record.interruptions[0].id)
  assert.equal(corrected.interruptions[0].recoveredAt, null)
  assert.equal(corrected.interruptions[0].lastReportAt, "2026-10-12T01:00:00.000Z")
})
test("closed episodes preserve their dates and summary after a new outage", () => {
  let record = ensureInterruptionHistory({ mode: "active", lastSeenAt: start }, now, threshold)
  record = closeInterruption(record, now, threshold, now)
  assert.equal(record.interruptions[0].durationMs, 36 * 3600000)
  record = ensureInterruptionHistory(
    { ...record, mode: "active", lastSeenAt: now },
    "2026-10-14T12:00:00.000Z",
    threshold,
  )
  assert.deepEqual(interruptionSummary(record), { interruptionCount: 2, lastRecoveryAt: now })
  assert.equal(record.interruptions[0].recoveredAt, now)
})
test("consultations belong to their episode and legacy calls use the date window", () => {
  const episode = { id: "one", lastReportAt: start, recoveredAt: now }
  const record = {
    consultations: [
      { id: "a", interruptionId: "one", createdAt: now },
      { id: "b", interruptionId: "other", createdAt: now },
      { id: "c", createdAt: "2026-10-13T11:00:00Z" },
      { id: "d", createdAt: "2026-10-14T12:00:00Z" },
    ],
  }
  assert.deepEqual(
    consultationsForInterruption(record, episode).map((call) => call.id),
    ["a", "c"],
  )
})
test("archived teams remain searchable without replacing current metadata or accepting invalid keys", () => {
  const source = [{ name: "Actual", company: "Empresa", imei: "01" }]
  const records = {
    '["Empresa","01"]': { equipment: { name: "Antiguo" } },
    '["Otra empresa","02"]': { equipment: { name: "Archivado" }, lastSeenAt: start },
    invalid: {},
  }
  const rows = knownEquipmentWithHistory(source, records)
  assert.equal(rows.length, 2)
  assert.equal(rows[0].name, "Actual")
  assert.equal(rows[1].name, "Archivado")
  assert.equal(rows[1].company, "Otra empresa")
})
test("already saved first recoveries with unknown start acquire a visible case exactly once", () => {
  const old = {
    historyInitialized: true,
    mode: "recovered",
    lastSeenAt: now,
    recoveredAt: now,
    outageDurationMs: null,
    interruptions: [],
    consultations: [{ id: "call", createdAt: "2026-10-01T00:00:00Z" }],
  }
  const restored = ensureInterruptionHistory(old, now, threshold)
  assert.equal(restored.interruptions.length, 1)
  assert.equal(restored.interruptions[0].kind, "first_report")
  assert.equal(restored.interruptions[0].lastReportAt, null)
  assert.equal(restored.consultations[0].interruptionId, restored.interruptions[0].id)
  assert.equal(ensureInterruptionHistory(restored, now, threshold).interruptions.length, 1)
})
