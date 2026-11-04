import test from "node:test"
import assert from "node:assert/strict"
import { calculatedVariableCompatibility as check } from "./calculatedVariableCompatibility.js"

test("compatibility requires signals and profile inputs from their actual origins", () => {
  assert.equal(check({ speed: 0 }, ["speed"], ["capacity"]).compatible, false)
  assert.equal(check({ speed: 0, capacity: 100 }, ["speed"], ["capacity"]).compatible, false)
  assert.equal(check({ speed: 0, ficha: { capacity: 100 } }, ["speed"], ["capacity"]).compatible, true)
  assert.equal(check({ ficha_capacity: 100 }, ["speed"], ["capacity"]).compatible, false)
  assert.equal(check({ ficha_capacity: 100 }, [], ["capacity"]).compatible, true)
})

test("profile zero and false are available while missing and blank values are not", () => {
  for (const value of [0, false, "0"]) assert.equal(check({ ficha: { capacity: value } }, [], ["capacity"]).compatible, true)
  for (const value of [null, undefined, "", "   "]) assert.equal(check({ ficha: { capacity: value } }, [], ["capacity"]).compatible, false)
  assert.deepEqual(check({ speed: 0 }, ["speed"], ["capacity"]), { available: 1, profileAvailable: 0, compatible: false })
})
