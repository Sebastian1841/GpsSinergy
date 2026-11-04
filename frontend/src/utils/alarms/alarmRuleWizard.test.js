import test from "node:test"
import assert from "node:assert/strict"
import { getAlarmRuleStepError } from "./alarmRuleWizard.js"

const draft = () => ({
  name: "Regla valida",
  type: "speeding",
  condition: { value: 90, durationSeconds: 30 },
  cooldownMinutes: 15,
  schedule: { type: "always", days: [] },
})

test("wizard validates name and threshold before advancing", () => {
  assert.equal(getAlarmRuleStepError(draft(), 1), "")
  assert.match(getAlarmRuleStepError({ ...draft(), name: "  a " }, 1), /nombre/)
  for (const value of ["", null, -1, "abc", Infinity]) {
    assert.match(getAlarmRuleStepError({ ...draft(), condition: { value } }, 1), /umbral/)
  }
  assert.equal(
    getAlarmRuleStepError(
      { ...draft(), type: "fuel", condition: { value: -15, windowMinutes: 10 } },
      1,
    ),
    "",
  )
  assert.match(
    getAlarmRuleStepError(
      { ...draft(), type: "fuel", condition: { value: 0, windowMinutes: 10 } },
      1,
    ),
    /baja/,
  )
})

test("wizard validates silence, duration and schedules, including overnight windows", () => {
  assert.equal(getAlarmRuleStepError(draft(), 2), "")
  assert.match(getAlarmRuleStepError({ ...draft(), cooldownMinutes: -1 }, 2), /silencio/)
  assert.match(
    getAlarmRuleStepError({ ...draft(), condition: { value: 90, durationSeconds: "" } }, 2),
    /duracion/,
  )
  for (const [from, to] of [
    ["", "18:00"],
    ["25:00", "18:00"],
    ["08:00", "08:00"],
  ]) {
    assert.notEqual(
      getAlarmRuleStepError({ ...draft(), schedule: { type: "custom", from, to } }, 2),
      "",
    )
  }
  assert.equal(
    getAlarmRuleStepError(
      { ...draft(), schedule: { type: "custom", from: "20:00", to: "08:00" } },
      2,
    ),
    "",
  )
})
