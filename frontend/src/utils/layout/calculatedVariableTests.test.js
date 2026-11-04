import test from "node:test"
import assert from "node:assert/strict"
import { CALCULATED_VARIABLE_TESTS_KEY, calculatedVariableTestStatus, readCalculatedVariableTests, saveCalculatedVariableTest } from "./calculatedVariableTests.js"

const variable = { id: "a", key: "resultado", script: 'out["resultado"] = var["speed"]', label: "Resultado", unit: "km/h" }
const result = { variableId: "a", key: variable.key, script: variable.script, status: "passed", source: "backend", testedAt: "2026-11-03T12:00:00Z", assetId: "asset-a" }

test("pending states depend on exact script and primary output, not display metadata", () => {
  assert.equal(calculatedVariableTestStatus(variable).state, "never")
  assert.equal(calculatedVariableTestStatus(variable, result).canSave, true)
  assert.equal(calculatedVariableTestStatus({ ...variable, label: "Otro nombre", unit: "m/s", assetIds: ["b"] }, result).state, "passed")
  assert.equal(calculatedVariableTestStatus({ ...variable, script: variable.script + "\n# nuevo" }, result).state, "stale")
  assert.equal(calculatedVariableTestStatus({ ...variable, key: "otro" }, result).canSave, false)
  assert.equal(calculatedVariableTestStatus(variable, { ...result, status: "failed", error: "Falta speed" }).state, "failed")
  assert.equal(calculatedVariableTestStatus(variable, { ...result, variableId: "b" }).state, "never")
  const rows = [variable, { ...variable, id: "b" }]
  assert.deepEqual(rows.filter(row => calculatedVariableTestStatus(row, result).pending).map(row => row.id), ["b"])
})

test("test registry is independent, persists only explicit engine results and rejects conflicts", () => {
  const data = new Map()
  const read = key => data.get(key) ?? null
  const write = (key, value) => { data.set(key, value); return true }
  assert.deepEqual(readCalculatedVariableTests(read), [])
  assert.equal(data.size, 0)
  const options = { read, write, result, expected: [], canEdit: () => true }
  assert.throws(() => saveCalculatedVariableTest({ ...options, canEdit: () => false }), /permiso/)
  assert.throws(() => saveCalculatedVariableTest({ ...options, write: () => false }), /guardar/)
  assert.equal(data.size, 0)
  assert.throws(() => saveCalculatedVariableTest({ ...options, result: { ...result, source: "frontend" } }), /invalido/)
  const saved = saveCalculatedVariableTest(options)
  assert.deepEqual(readCalculatedVariableTests(read), saved)
  assert.equal(data.size, 1)
  assert.ok(data.has(CALCULATED_VARIABLE_TESTS_KEY))
  assert.throws(() => saveCalculatedVariableTest(options), /cambio/)
  const failed = saveCalculatedVariableTest({ ...options, expected: saved, result: { ...result, status: "failed", error: "Dato ausente" } })
  assert.equal(failed.length, 1)
  assert.equal(calculatedVariableTestStatus(variable, failed[0]).canSave, false)
})

test("corrupt test registries are not silently replaced", () => {
  assert.throws(() => readCalculatedVariableTests(() => "{bad"), /leer/)
  assert.throws(() => readCalculatedVariableTests(() => JSON.stringify({ version: 1, results: [result, result] })), /invalido/)
  assert.throws(() => readCalculatedVariableTests(() => JSON.stringify({ version: 2, results: [] })), /compatible/)
})
