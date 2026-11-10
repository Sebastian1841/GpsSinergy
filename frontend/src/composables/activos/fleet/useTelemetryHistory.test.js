import assert from "node:assert/strict"
import test from "node:test"
import {
  appendTelemetryReports,
  clearReportsForAsset,
  clearTelemetryHistory,
  getReportsForAsset,
} from "./useTelemetryHistory.js"

const report = (identity, speed = 10) => ({
  ...identity,
  lat: -33,
  lng: -70,
  timestamp: `2026-11-04T12:00:${String(speed).padStart(2, "0")}.000Z`,
  speed,
})

test("placeholder plates never join different assets or companies", () => {
  for (const patente of ["-", "", "--", "N/A", "sin patente"]) {
    clearTelemetryHistory()
    const a = { id: "a", imei: "111", companyId: "A", patente }
    const b = { id: "b", imei: "222", companyId: "B", patente }
    appendTelemetryReports([report(a, 10), report(b, 20)])
    assert.deepEqual(
      getReportsForAsset(a).map((row) => row.speed),
      [10],
    )
    assert.deepEqual(
      getReportsForAsset(b).map((row) => row.speed),
      [20],
    )
    assert.deepEqual(getReportsForAsset({ patente }), [])
  }
  clearTelemetryHistory()
})

test("strong IDs stay separate despite shared plates and conflicting devices", () => {
  clearTelemetryHistory()
  const a = { id: "a", companyId: "A", patente: "BUS-01", imei: "111" }
  const b = { id: "b", companyId: "A", patente: "BUS-01", imei: "111" }
  appendTelemetryReports([report(a, 10), report(b, 20)])
  assert.deepEqual(
    getReportsForAsset(a).map((row) => row.assetId),
    ["a"],
  )
  assert.deepEqual(
    getReportsForAsset(b).map((row) => row.assetId),
    ["b"],
  )
  assert.deepEqual(getReportsForAsset({ patente: "BUS-01", companyId: "A" }), [])
  assert.deepEqual(getReportsForAsset({ id: "unknown", imei: "111" }), [])
  clearReportsForAsset({ patente: "BUS-01", companyId: "A" })
  assert.equal(getReportsForAsset(a).length, 1)
  clearReportsForAsset(a)
  assert.equal(getReportsForAsset(a).length, 0)
  assert.equal(getReportsForAsset(b).length, 1)
  clearTelemetryHistory()
})

test("identical asset IDs remain isolated by company and application", () => {
  clearTelemetryHistory()
  const a = { id: "same", companyId: "A", applicationId: "one" }
  const b = { id: "same", companyId: "B", applicationId: "one" }
  const c = { id: "same", companyId: "A", applicationId: "two" }
  appendTelemetryReports([report(a, 10), report(b, 20), report(c, 30)])
  assert.deepEqual(
    getReportsForAsset(a).map((row) => row.speed),
    [10],
  )
  assert.deepEqual(
    getReportsForAsset(b).map((row) => row.speed),
    [20],
  )
  assert.deepEqual(
    getReportsForAsset(c).map((row) => row.speed),
    [30],
  )
  assert.deepEqual(getReportsForAsset("same"), [])
  clearReportsForAsset(a)
  assert.equal(getReportsForAsset(b).length, 1)
  assert.equal(getReportsForAsset(c).length, 1)
  clearTelemetryHistory()
})

test("alias types cannot collide and unique device updates retain their asset", () => {
  clearTelemetryHistory()
  const a = { id: "a", imei: "shared", deviceId: "device-a", companyId: "A" }
  const b = { id: "b", patente: "shared", companyId: "A" }
  appendTelemetryReports([report(a, 10), report(b, 20)])
  appendTelemetryReports([report({ deviceId: "device-a", companyId: "A" }, 30)])
  assert.deepEqual(
    getReportsForAsset(a).map((row) => row.speed),
    [10, 30],
  )
  assert.deepEqual(
    getReportsForAsset({ imei: "shared", companyId: "A" }).map((row) => row.speed),
    [10, 30],
  )
  assert.deepEqual(
    getReportsForAsset({ patente: "shared", companyId: "A" }).map((row) => row.speed),
    [20],
  )
  assert.deepEqual(getReportsForAsset("shared"), [])
  clearTelemetryHistory()
})
