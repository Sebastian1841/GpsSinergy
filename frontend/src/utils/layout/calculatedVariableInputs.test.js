import test from "node:test"
import assert from "node:assert/strict"
import { calculatedVariableInputs, calculatedProfileValue } from "./calculatedVariableInputs.js"
import { readCalculatedVariables, seedCalculatedVariables, updateCalculatedVariable } from "./calculatedVariables.js"

test("static references separate telemetry and profile keys and ignore comments and literals", () => {
  const script = [
    '# ficha["comentario"] var["ignorado"]',
    'texto = "var[\\"texto\\"] ficha[\\"texto\\"]"',
    'doc = """ficha["documentacion"]\nvar["documentacion"]"""',
    "texto = r'ficha[\"raw\"]'",
    'velocidad = var [ "speed" ]',
    "capacidad = ficha['capacidad_estanque_l']",
    'otra = ficha["capacidad_estanque_l"]',
    'objeto.var["no_global"]',
    'objeto.ficha["no_global"]',
    'out["resultado"] = var["speed"]',
  ].join("\n")
  assert.deepEqual(calculatedVariableInputs(script), { signals: ["speed"], profile: ["capacidad_estanque_l"] })
  assert.deepEqual(calculatedVariableInputs('x = var["speed"]\ny = ficha["speed"]'), { signals: ["speed"], profile: ["speed"] })
  assert.deepEqual(calculatedVariableInputs('x = "texto incompleto ficha['), { signals: [], profile: [] })
  assert.deepEqual(calculatedVariableInputs('ficha[variable]\nficha["" ]'), { signals: [], profile: [] })
})

test("profile values never fall back to telemetry and preserve zero, false and explicit absence", () => {
  assert.equal(calculatedProfileValue({ ficha: { capacidad: 0 } }, "capacidad"), 0)
  assert.equal(calculatedProfileValue({ ficha: { habilitado: false } }, "habilitado"), false)
  assert.equal(calculatedProfileValue({ ficha_capacidad: 100 }, "capacidad"), 100)
  assert.equal(calculatedProfileValue({ ficha_capacidad: 100 }, "ficha_capacidad"), 100)
  assert.equal(calculatedProfileValue({ speed: 50 }, "speed"), undefined)
  assert.equal(calculatedProfileValue({ ficha: { capacidad: null }, ficha_capacidad: 100 }, "capacidad"), null)
  assert.equal(calculatedProfileValue({ ficha: {} }, "constructor"), undefined)
})

test("profile indicator derives from script on loading and editing, not the old flag", () => {
  const seed = seedCalculatedVariables()
  const script = 'out["estado_vehiculo"] = ficha["capacidad_estanque_l"]'
  const raw = JSON.stringify({ version: 1, records: [{ ...seed[0], script, readsProfile: false }] })
  assert.equal(readCalculatedVariables(() => raw)[0].readsProfile, true)
  const options = { actor: "Ana", timestamp: "2026-11-03T12:00:00Z", id: "unused" }
  const next = updateCalculatedVariable(seed, { ...seed[0], script, readsProfile: false }, options)
  assert.equal(next[0].readsProfile, true)
  const cleared = updateCalculatedVariable(next, { ...next[0], script: 'out["estado_vehiculo"] = 1 # ficha["ignorado"]', readsProfile: true }, options)
  assert.equal(cleared[0].readsProfile, false)
})
