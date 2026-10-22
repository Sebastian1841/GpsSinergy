import test from "node:test"
import assert from "node:assert/strict"
import { workshopSchedule, workshopReminder } from "./unreportedWorkshop.js"

test("a renewed workshop consultation restarts its deadline without rewriting prior calls", () => {
  const old = {
    situation: "workshop",
    workshopDays: 1,
    createdAt: "2026-10-01T12:00:00Z",
    interruptionId: "case",
  }
  const record = {
    mode: "active",
    interruptions: [{ id: "case", lastReportAt: "2026-09-01T12:00:00Z" }],
    consultations: [old],
  }
  assert.ok(workshopReminder(record, "2026-10-20T12:00:00Z"))
  const renewed = {
    ...record,
    consultations: [old, { ...old, workshopDays: 20, createdAt: "2026-10-20T12:00:00Z" }],
  }
  assert.equal(workshopReminder(renewed, "2026-10-20T12:00:00Z"), null)
  assert.equal(workshopReminder(renewed, "2026-11-09T12:00:00Z").releaseDate, "2026-11-09")
  assert.equal(record.consultations[0].workshopDays, 1)
})

test("workshop release is calendar days from consultation in Chile, reminder begins Monday", () => {
  assert.deepEqual(workshopSchedule(10, "2026-10-20T15:00:00Z"), {
    releaseDate: "2026-10-30",
    reminderDate: "2026-10-26",
  })
  assert.deepEqual(workshopSchedule(1, "2026-10-19T01:00:00Z"), {
    releaseDate: "2026-10-19",
    reminderDate: "2026-10-19",
  })
  for (const value of [0, -1, 1.5, "10", null, 3651])
    assert.equal(workshopSchedule(value, "2026-10-20T15:00:00Z"), null)
})
test("only current active workshop cases are promoted, including overdue ones", () => {
  const call = {
    situation: "workshop",
    workshopDays: 10,
    createdAt: "2026-10-20T15:00:00Z",
    interruptionId: "case",
  }
  const record = {
    mode: "active",
    interruptions: [{ id: "case", lastReportAt: "2026-10-01T12:00:00Z" }],
    consultations: [call],
  }
  assert.equal(workshopReminder(record, "2026-10-25T15:00:00Z"), null)
  assert.equal(workshopReminder(record, "2026-10-26T15:00:00Z").label, "Pronto a salir de taller")
  assert.equal(
    workshopReminder(record, "2026-10-31T15:00:00Z").label,
    "Fecha estimada de salida cumplida",
  )
  assert.equal(workshopReminder({ ...record, mode: "recovered" }, "2026-10-26T15:00:00Z"), null)
  assert.equal(
    workshopReminder(
      { ...record, consultations: [call, { ...call, situation: "working" }] },
      "2026-10-26T15:00:00Z",
    ),
    null,
  )
  assert.equal(
    workshopReminder(
      { ...record, consultations: [{ ...call, workshopDays: undefined }] },
      "2026-10-26T15:00:00Z",
    ),
    null,
  )
})
