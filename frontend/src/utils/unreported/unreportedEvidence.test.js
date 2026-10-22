import test from "node:test"
import assert from "node:assert/strict"
import { describeUnreportedEvidence } from "./unreportedEvidence.js"

test("last evidence keeps zero voltage and uses only the sensor timestamp", () => {
  const result = describeUnreportedEvidence({
    reportedAt: "2026-10-19T12:35:00Z",
    externalVoltage: 0,
    internalVoltage: 3.7,
    mobileSignalDbm: -111,
    simStatus: "absent",
  })
  assert.equal(result.reportedAt, "2026-10-19T12:35:00.000Z")
  assert.deepEqual(
    result.fields.map(({ value }) => value),
    ["0 V", "3,7 V"],
  )
})
test("missing or invalid evidence is not invented or coerced", () => {
  for (const input of [
    undefined,
    null,
    {},
    {
      reportedAt: "invalid",
      externalVoltage: null,
      internalVoltage: -1,
      mobileSignalDbm: NaN,
      simStatus: "unknown",
    },
    {
      externalVoltage: "0",
      internalVoltage: Infinity,
      mobileSignalDbm: "-90",
      simStatus: "constructor",
    },
  ]) {
    const result = describeUnreportedEvidence(input)
    assert.equal(result.reportedAt, null)
    assert.ok(result.fields.every(({ value }) => value === "Sin informacion"))
  }
})
test("unsupported modem and SIM readings are not displayed", () => {
  const result = describeUnreportedEvidence({ simStatus: "absent", mobileSignalDbm: -111 })
  assert.deepEqual(
    result.fields.map(({ label }) => label),
    ["Alimentacion externa", "Bateria interna"],
  )
  assert.ok(result.fields.every(({ value }) => value === "Sin informacion"))
})
