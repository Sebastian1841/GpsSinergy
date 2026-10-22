import test from "node:test"
import assert from "node:assert/strict"
import { withMockAssetReporting } from "./mockAssetReporting.js"
import { mockDatabaseSeed } from "./mockDatabase.js"
import { buildUnreportedEquipment } from "../services/unreported/unreportedAssetsSource.js"
import { describeUnreportedDiagnosis } from "../utils/unreported/unreportedDiagnosis.js"

const now = "2026-10-19T14:00:00Z"
const asset = { id: "asset-001", source: "mock-database", estado: "offline", datosUlt: "12:01:03" }

test("demo fixtures have full reports and varied multi-day offline scenarios", () => {
  const reasons = new Set()
  const ages = new Set()
  for (let index = 1; index <= 20; index++) {
    const row = withMockAssetReporting({ ...asset, id: `asset-${index}` }, now)
    assert.ok(Date.parse(now) - Date.parse(row.reportedAt) >= 2 * 86400000)
    assert.match(row.datosUlt, /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/)
    ages.add(Math.floor((Date.parse(now) - Date.parse(row.reportedAt)) / 86400000))
    reasons.add(
      describeUnreportedDiagnosis({
        ...row,
        mode: "active",
        lastReportAt: row.reportedAt,
        sensorReportedAt: row.reportedAt,
      }).reason,
    )
    assert.equal(withMockAssetReporting(row, "2026-10-20T00:00:00Z"), row)
  }
  assert.equal(ages.size, 5)
  assert.ok(reasons.has("Alimentacion desconectada"))
  assert.ok(reasons.has("Sin comunicacion"))
  assert.ok(!reasons.has("SIM ausente"))
  assert.ok(!reasons.has("Sin registro en red movil"))
  const recent = withMockAssetReporting({ ...asset, estado: "moving" }, now)
  assert.ok(Date.parse(now) - Date.parse(recent.reportedAt) < 6 * 60000)
})

test("migration preserves existing reports, real sources, user fields and Chile calendar dates", () => {
  for (const row of [
    { ...asset, reportedAt: now },
    { ...asset, reportedAt: null },
    { ...asset, datosUlt: "18-10-2026 11:00:00" },
    { ...asset, telemetry: { reportedAt: now } },
    { ...asset, source: "api" },
  ])
    assert.equal(withMockAssetReporting(row, now), row)
  const migrated = withMockAssetReporting(
    { ...asset, datosUlt: "11-05-2026", externalVoltage: 18, nombrePantalla: "Nombre editado" },
    now,
  )
  assert.equal(migrated.reportedAt, "2026-05-11T04:00:00.000Z")
  assert.match(migrated.datosUlt, /^11-05-2026/)
  assert.equal(migrated.externalVoltage, 18)
  assert.equal(migrated.nombrePantalla, "Nombre editado")
  assert.equal(asset.datosUlt, "12:01:03")
})

test("the shared Activos seed no longer relies on time-only reports", () => {
  const rows = buildUnreportedEquipment(mockDatabaseSeed.assets, mockDatabaseSeed.companies)
  assert.equal(rows.length, mockDatabaseSeed.assets.length)
  assert.ok(rows.every((row) => row.lastReport && !row.hasUndatedReport))
  assert.ok(rows.some((row) => row.sourceStatus === "offline"))
  assert.ok(rows.some((row) => row.sourceStatus === "moving"))
})
