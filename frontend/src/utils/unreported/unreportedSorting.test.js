import test from "node:test"
import assert from "node:assert/strict"
import { compareUnreportedColumn } from "./unreportedSorting.js"

test("header sorts use numeric durations and real dates, not displayed strings", () => {
  const a = { name: "Equipo 2", elapsedHours: 9, lastSeenAt: "2026-09-30T12:00:00Z" }
  const b = { name: "Equipo 10", elapsedHours: 100, lastSeenAt: "2026-10-01T12:00:00Z" }
  for (const key of ["equipment", "silence", "report"]) {
    assert.ok(compareUnreportedColumn(a, b, key) < 0)
    assert.ok(compareUnreportedColumn(a, b, key, "desc") > 0)
  }
  assert.ok(compareUnreportedColumn({}, a, "report", "desc") > 0)
  assert.equal(compareUnreportedColumn({}, {}, "report"), 0)
})

test("historical header sorts compare each episode and its own diagnosis", () => {
  const a = {
    episode: { lastReportAt: "2026-09-30T00:00:00Z", recoveredAt: "2026-09-30T12:00:00Z" },
  }
  const b = {
    episode: {
      lastReportAt: "2026-10-01T00:00:00Z",
      recoveredAt: "2026-10-02T00:00:00Z",
      telemetry: { reportedAt: "2026-10-01T00:00:00Z", externalVoltage: 0 },
    },
  }
  for (const key of ["historyCount", "historyRecovery", "historyDuration"])
    assert.ok(compareUnreportedColumn(a, b, key) < 0)
  assert.ok(compareUnreportedColumn(a, b, "historyReason") > 0)
  assert.ok(compareUnreportedColumn({ episode: {} }, b, "historyDuration", "desc") > 0)
})

test("operational columns can sort connectivity, decision and latest consultation", () => {
  assert.ok(
    compareUnreportedColumn({ status: "Nunca reporto" }, { status: "Sin reportar" }, "status") < 0,
  )
  assert.ok(
    compareUnreportedColumn(
      { followUpLabel: "Pendiente" },
      { followUpLabel: "Requiere visita" },
      "review",
    ) < 0,
  )
  assert.ok(
    compareUnreportedColumn(
      { lastConsultation: { createdAt: "2026-10-01T00:00:00Z" } },
      { lastConsultation: { createdAt: "2026-10-02T00:00:00Z" } },
      "consultation",
    ) < 0,
  )
})

test("grouped history sorts by total and latest recovery date", () => {
  const a = { completedCount: 2, lastRecoveryAt: "2026-09-30T00:00:00Z" }
  const b = { completedCount: 10, lastRecoveryAt: "2026-10-01T00:00:00Z" }
  for (const key of ["historyTotal", "historyLatest"]) {
    assert.ok(compareUnreportedColumn(a, b, key) < 0)
    assert.ok(compareUnreportedColumn(a, b, key, "desc") > 0)
  }
})

test("an old outage recovered today comes before a newer outage recovered yesterday", () => {
  const today = {
    name: "Recien recuperado",
    latestDisconnectionAt: "2026-09-01T00:00:00Z",
    lastRecoveryAt: "2026-10-19T14:00:00Z",
  }
  const yesterday = {
    name: "Anterior",
    latestDisconnectionAt: "2026-10-17T00:00:00Z",
    lastRecoveryAt: "2026-10-18T14:00:00Z",
  }
  assert.deepEqual(
    [yesterday, today, { name: "Sin fecha" }]
      .sort((a, b) => compareUnreportedColumn(a, b, "historyLatest", "desc"))
      .map((row) => row.name),
    ["Recien recuperado", "Anterior", "Sin fecha"],
  )
})
