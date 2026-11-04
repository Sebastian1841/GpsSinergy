import test from "node:test"
import assert from "node:assert/strict"
import {
  SIGNAL_RULE_PRESETS,
  applySignalRulePreset,
  availableAssetSignals,
  canonicalSignalField,
} from "./signalRulePresets.js"

test("all six signal presets remain available independently of upcoming episode types", () => {
  assert.equal(SIGNAL_RULE_PRESETS.length, 6)
  assert.ok(SIGNAL_RULE_PRESETS.every((preset) => !preset.disabled))
})

test("movement after hours uses movement equal one, warning and overnight schedule", () => {
  const draft = { severity: "critical", schedule: { type: "always", days: ["monday"] } }
  applySignalRulePreset(draft, "movement-after-hours")
  assert.equal(draft.condition.field, "movement")
  assert.equal(draft.condition.operator, "=")
  assert.equal(draft.condition.value, 1)
  assert.equal(draft.condition.unit, "")
  assert.equal(draft.severity, "medium")
  assert.equal(draft.schedule.type, "custom")
  assert.equal(draft.schedule.from, "22:00")
  assert.equal(draft.schedule.to, "06:00")
  assert.deepEqual(normalizeAutomaticAlertRule(draft).condition, draft.condition)
  assert.equal(
    availableAssetSignals({ movement: true }).find((signal) => signal.id === "movement").value,
    1,
  )
  assert.equal(
    availableAssetSignals({ speed: 35 }).some((signal) => signal.id === "movement"),
    false,
  )
})

test("low external power uses centivolts, exit margin and warning severity", () => {
  const draft = { severity: "critical", schedule: { type: "always", days: [] } }
  applySignalRulePreset(draft, "low-power")
  assert.equal(draft.condition.field, "ext_voltage_cv")
  assert.equal(draft.condition.operator, "<")
  assert.equal(draft.condition.value, 1000)
  assert.equal(draft.condition.unit, "cV")
  assert.equal(draft.condition.exitMargin, 20)
  assert.equal(draft.condition.durationSeconds, 120)
  assert.equal(draft.severity, "medium")
  assert.deepEqual(normalizeAutomaticAlertRule(draft).condition, draft.condition)
  assert.equal(
    availableAssetSignals({ ext_voltage_cv: 1408 }).find((signal) => signal.id === "ext_voltage_cv")
      .value,
    1408,
  )
  assert.equal(
    availableAssetSignals({ externalVoltage: 14.08 }).some(
      (signal) => signal.id === "ext_voltage_cv",
    ),
    false,
  )
})

test("power cut uses unplug equal one with critical severity", () => {
  const draft = { severity: "medium", schedule: { type: "always", days: [] } }
  applySignalRulePreset(draft, "power-cut")
  assert.equal(draft.condition.field, "unplug")
  assert.equal(draft.condition.operator, "=")
  assert.equal(draft.condition.value, 1)
  assert.equal(draft.condition.unit, "")
  assert.equal(draft.severity, "critical")
  const saved = normalizeAutomaticAlertRule(draft)
  assert.equal(saved.condition.field, "unplug")
  assert.equal(saved.severity, "critical")
  assert.equal(
    availableAssetSignals({ unplug: true }).find((signal) => signal.id === "unplug").value,
    1,
  )
  assert.equal(
    availableAssetSignals({ externalVoltage: 0 }).some((signal) => signal.id === "unplug"),
    false,
  )
})

test("low internal battery uses centivolts and keeps a configurable exit margin", () => {
  const draft = { schedule: { type: "always", days: [] } }
  applySignalRulePreset(draft, "low-internal-battery")
  assert.equal(draft.condition.field, "bat_voltage_cv")
  assert.equal(draft.condition.value, 350)
  assert.equal(draft.condition.unit, "cV")
  assert.equal(draft.condition.exitMargin, 20)
  draft.condition.exitMargin = 25
  assert.equal(normalizeAutomaticAlertRule(draft).condition.exitMargin, 25)
  assert.deepEqual(
    availableAssetSignals({ bat_voltage_cv: 365 }).map((signal) => [
      signal.id,
      signal.value,
      signal.unit,
    ]),
    [["bat_voltage_cv", 365, "cV"]],
  )
  assert.equal(
    availableAssetSignals({ internalVoltage: 3.65 }).some(
      (signal) => signal.id === "bat_voltage_cv",
    ),
    false,
  )
})
import { normalizeAutomaticAlertRule } from "./automaticAlertRuleUtils.js"
import { episodeCondition } from "./configurationAlertTypes.js"

test("door shortcut is a measured signal, digital input 2 equal zero for five minutes", () => {
  const draft = {
    type: "door_open",
    severity: "critical",
    schedule: { type: "always", days: ["monday"] },
  }
  applySignalRulePreset(draft, "door-open")
  assert.equal(draft.type, "signal")
  assert.equal(draft.condition.field, "digitalInput2")
  assert.equal(draft.condition.value, 0)
  assert.equal(draft.severity, "medium")
  assert.equal(draft.condition.durationSeconds, 300)
  assert.deepEqual(normalizeAutomaticAlertRule(draft).condition, draft.condition)
  assert.equal(episodeCondition("signal", draft.condition).presetId, "door-open")
  assert.equal(canonicalSignalField("digital_input_2"), "digitalInput2")
})

test("signal values are from the chosen asset and preserve false and zero", () => {
  assert.deepEqual(availableAssetSignals(null), [])
  assert.deepEqual(availableAssetSignals({}), [])
  const signals = availableAssetSignals({
    digitalInput2: 0,
    ignition: false,
    externalVoltage: null,
    internalVoltage: "-",
    telemetry: { speed: 45 },
  })
  assert.equal(signals.find((signal) => signal.id === "digitalInput2").value, 0)
  assert.equal(signals.find((signal) => signal.id === "ignition").value, 0)
  assert.equal(signals.find((signal) => signal.id === "speed").value, 45)
  assert.equal(
    signals.some((signal) => signal.id === "externalVoltage"),
    false,
  )
  assert.equal(
    signals.some((signal) => signal.id === "internalVoltage"),
    false,
  )
  assert.equal(
    availableAssetSignals({ digitalInput2: 1 }).find((signal) => signal.id === "digitalInput2")
      .value,
    1,
  )
})

test("switching templates resets previous nighttime schedule for ordinary signal rules", () => {
  const draft = { schedule: { type: "always", days: ["monday"] } }
  applySignalRulePreset(draft, "ignition-after-hours")
  assert.equal(draft.schedule.from, "22:00")
  assert.equal(draft.schedule.to, "06:00")
  applySignalRulePreset(draft, "door-open")
  assert.equal(draft.schedule.type, "always")
  assert.deepEqual(draft.schedule.days, ["monday"])
})
