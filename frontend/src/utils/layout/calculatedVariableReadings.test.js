import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"
import { reactive, computed } from "vue"
import { calculatedVariableReadings, formatVariableInput, variableTestInputs } from "./calculatedVariableReadings.js"

test("manual count reacts when previously absent keys are filled or removed", () => {
  const values = reactive(Object.create(null))
  const count = computed(() => Object.keys(variableTestInputs(["speed", "ignition"], values)).length)
  assert.equal(count.value, 0)
  values.speed = "0"
  assert.equal(count.value, 1)
  values.ignition = "false"
  assert.equal(count.value, 2)
  delete values.speed
  assert.equal(count.value, 1)
})

test("manual empty inputs are absent and explicit zero/false remain supplied", () => {
  assert.deepEqual(variableTestInputs(["speed", "ignition", "missing"], { speed: "0", ignition: "false", missing: "  " }), { speed: "0", ignition: "false" })
  assert.deepEqual(variableTestInputs(["constructor", "__proto__", "toString"], {}), {})
})

test("reading rows preserve missing telemetry instead of filling it with current values", () => {
  const asset = { id: "a", speed: 100, ignition: true, reportedAt: "2026-11-02T12:00:00Z" }
  const rows = calculatedVariableReadings(asset, [
    { id: "r", timestamp: "2026-11-01T12:00:00Z", speed: 0, ignition: false },
    { id: "r2", timestamp: "2026-11-01T12:01:00Z", speed: null },
  ], ["speed", "ignition"])
  assert.equal(formatVariableInput(rows[0].inputs[0]), "0")
  assert.equal(formatVariableInput(rows[0].inputs[1]), "false")
  assert.ok(rows[1].inputs.every(input => input.missing))
  assert.equal(formatVariableInput(rows[1].inputs[0]), "sin dato")
  assert.equal(rows[0].localSnapshot, false)
  const fallback = calculatedVariableReadings(asset, [], ["speed"])
  assert.equal(fallback.length, 1)
  assert.equal(fallback[0].localSnapshot, true)
  assert.equal(fallback[0].timestamp, asset.reportedAt)
  assert.deepEqual(calculatedVariableReadings(null), [])
  assert.equal(calculatedVariableReadings(asset, Array.from({ length: 1000 }, (_, id) => ({ id })), []).length, 500)
})

test("test view compiles with manual fields and historical table without fake outputs", () => {
  const source = readFileSync(new URL("../../components/configuration/CalculatedVariableTest.vue", import.meta.url), "utf8")
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: "variable-test" })
  const template = compileTemplate({ source: descriptor.template.content, filename: "CalculatedVariableTest.vue", id: "variable-test", compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(template.errors, [])
  assert.match(source, /Con valores escritos a mano/)
  assert.match(source, /LO QUE USÓ/)
  assert.match(source, /getReportsForAsset/)
  assert.match(source, /Sin ejecutar/)
  assert.match(source, /Campos de la ficha/)
  assert.match(source, /manualProfileValues\[key\]/)
  assert.match(source, /Sin dato disponible en la ficha/)
  assert.doesNotMatch(source, /\beval\(|new Function\(/)
})
