import test from "node:test"
import assert from "node:assert/strict"
import { calculatedSignalGroups, calculatedSignalValue, calculatedSignalReadings, hasCalculatedFuelLevel } from "./calculatedVariableSignals.js"
import { calculatedVariableTokens } from "./calculatedVariableSyntax.js"

test("fuel category recognizes the catalog field and legacy keys, including zero", () => {
  for (const key of ["fuelPercent", "fuelLevel", "canFuelLevel", "fuelLevelPercent"]) {
    assert.equal(hasCalculatedFuelLevel({ [key]: 0 }), true)
    assert.equal(hasCalculatedFuelLevel({ [key]: 65 }), true)
    assert.equal(hasCalculatedFuelLevel({ [key]: null }), false)
    assert.equal(hasCalculatedFuelLevel({ [key]: undefined }), false)
  }
  assert.equal(hasCalculatedFuelLevel({}), false)
  assert.equal(hasCalculatedFuelLevel(null), false)
  assert.equal(hasCalculatedFuelLevel({ canFuelRate: 2.1, canFuelUsed: 15 }), false)
  const rows = [{ id: "a", fuelPercent: 80 }, { id: "b", fuelPercent: 0 }, { id: "c", canFuelLevel: 20 }, { id: "d", fuelPercent: null }]
  assert.deepEqual(rows.filter(hasCalculatedFuelLevel).map(row => row.id), ["a", "b", "c"])
})

test("signal catalog preserves the original GPS names without inventing readings", () => {
  assert.equal(calculatedSignalGroups[0].signals.length, 13)
  assert.equal(calculatedSignalValue({ ignition: false }, "ignition"), false)
  assert.equal(calculatedSignalValue({ speed: 0 }, "speed"), 0)
  assert.equal(calculatedSignalValue({ lat: -38.7 }, "lat_e7"), -387000000)
  assert.equal(calculatedSignalValue({ odometer: 12 }, "odometer_m"), 12000)
  assert.equal(calculatedSignalValue({ gpsSatellites: 0 }, "sats"), 0)
  assert.equal(calculatedSignalValue({ gpsSignal: 90 }, "gps_valid"), undefined)
  assert.equal(calculatedSignalValue({}, "constructor"), undefined)
  assert.equal(calculatedSignalValue({ lat_e7: null, lat: 20 }, "lat_e7"), null)
})

test("signal window is limited to 30 days and 500 timestamped local readings", () => {
  const now = Date.parse("2026-11-02T12:00:00Z")
  const rows = [{ timestamp: "2026-10-01T12:00:00Z" }, { timestamp: "2026-11-01T12:00:00Z" }, { timestamp: "2026-11-03T12:00:00Z" }, {}]
  assert.equal(calculatedSignalReadings({}, rows, now).length, 1)
  assert.equal(calculatedSignalReadings({ speed: 90 }, [], now).length, 0)
  assert.equal(calculatedSignalReadings(null, Array.from({ length: 600 }, () => rows[1]), now).length, 500)
})

test("syntax colors are visual tokens, preserve text and never insert HTML", () => {
  const source = 'if var["speed"] < 3:\n    out["value"] = "<img src=x>" # comment'
  const tokens = calculatedVariableTokens(source)
  assert.equal(tokens.map(token => token.text).join(""), source + "\n")
  assert.ok(tokens.some(token => token.type === "keyword" && token.text === "if"))
  assert.ok(tokens.some(token => token.type === "string" && token.text.includes("<img")))
})
