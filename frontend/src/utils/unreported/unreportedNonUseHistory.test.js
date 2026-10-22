import test from "node:test"
import assert from "node:assert/strict"
import {
  closeInterruption,
  completedInterruptions,
  interruptionSummary,
} from "./unreportedHistory.js"
import { countHistoryEquipment, groupHistoryEquipment } from "./unreportedHistorySearch.js"

const start = "2026-10-01T12:00:00Z"
const end = "2026-10-19T12:00:00Z"
const call = (situation, createdAt = "2026-10-10T12:00:00Z", interruptionId = "current") => ({
  situation,
  createdAt,
  interruptionId,
})
const record = (consultations) => ({
  mode: "active",
  lastSeenAt: start,
  consultations,
  interruptions: [{ id: "current", lastReportAt: start, recoveredAt: null }],
})

test("non-use recovery is included in history, counters and groups with its consultations", () => {
  const original = record([call("not_in_use")])
  const closed = closeInterruption(original, end)
  assert.equal(closed.interruptions[0].recoveredAt, end)
  assert.equal(closed.interruptions[0].excludedFromHistory, undefined)
  assert.deepEqual(closed.consultations, original.consultations)
  assert.equal(original.interruptions[0].recoveredAt, null)
  assert.equal(completedInterruptions(closed).length, 1)
  assert.equal(interruptionSummary(closed).interruptionCount, 1)
  assert.equal(countHistoryEquipment([closed]), 1)
  assert.equal(groupHistoryEquipment([closed])[0].consultations[0].situation, "not_in_use")
  const legacy = {
    ...closed,
    interruptions: closed.interruptions.map((item) => ({ ...item, excludedFromHistory: true })),
  }
  assert.equal(completedInterruptions(legacy).length, 1)
  assert.equal(interruptionSummary(legacy).interruptionCount, 1)
  assert.equal(countHistoryEquipment([legacy]), 1)
  assert.equal(groupHistoryEquipment([legacy]).length, 1)
})
test("completed episodes remain visible regardless of consultation situation", () => {
  for (const calls of [
    [],
    [call("working")],
    [call("not_in_use"), call("workshop", "2026-10-11T12:00:00Z")],
    [call("not_in_use", undefined, "previous")],
    [call("not_in_use", "2026-10-20T12:00:00Z")],
  ]) {
    assert.equal(completedInterruptions(closeInterruption(record(calls), end)).length, 1)
  }
})
test("first report includes non-use and links the retained consultation", () => {
  const closed = closeInterruption(
    {
      mode: "active",
      lastSeenAt: null,
      interruptions: [],
      consultations: [call("not_in_use", undefined, null)],
    },
    end,
  )
  assert.equal(completedInterruptions(closed).length, 1)
  assert.equal(closed.consultations[0].interruptionId, closed.interruptions[0].id)
})
