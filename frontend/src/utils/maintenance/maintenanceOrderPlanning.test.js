import test from "node:test"
import assert from "node:assert/strict"
import { toOrderPlanningDate, validateOrderPlanning } from "./maintenanceOrderPlanning.js"

test("planning dates normalize legacy formats without timezone shifts", () => {
  assert.equal(toOrderPlanningDate("30/09/2026"), "2026-09-30")
  assert.equal(toOrderPlanningDate("2026-09-30"), "2026-09-30")
  assert.equal(toOrderPlanningDate(""), "")
})

test("planning validates deadline, date order, time and assignment", () => {
  const valid = { plannedStartDate: "2026-11-06", scheduledDate: "2026-11-07", scheduledTime: "09:00", owner: "Ana", workshop: "Taller" }
  assert.equal(validateOrderPlanning(valid), "")
  assert.equal(validateOrderPlanning({ ...valid, plannedStartDate: "", scheduledTime: "" }), "")
  for (const patch of [{ scheduledDate: "" }, { scheduledDate: "2026-02-30" }, { plannedStartDate: "2026-11-08" }, { owner: " " }, { workshop: "" }, { scheduledTime: "25:00" }]) {
    assert.notEqual(validateOrderPlanning({ ...valid, ...patch }), "")
  }
})
