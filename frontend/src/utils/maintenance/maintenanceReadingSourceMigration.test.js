import assert from "node:assert/strict"
import test from "node:test"
import { MAINTENANCE_READING_SOURCES } from "./maintenanceModuleConfig.js"
import { migrateMaintenanceReadingSource } from "./maintenanceReadingSourceMigration.js"

test("maintenance exposes only odometer, hour meter and time criteria", () => {
  assert.deepEqual(MAINTENANCE_READING_SOURCES, ["Odometro", "Horometro", "Fecha/Hora"])
})

test("legacy manual plans retain their identity and evidence but require interval configuration", () => {
  const plan = { id: "plan-1", name: "Permiso de circulacion", readingSourceLabel: "Valor manual", status: "due", intervalValue: 123, evidence: [{ storageId: "file-1" }] }
  const migrated = migrateMaintenanceReadingSource(plan, { plan: true })
  assert.equal(migrated.id, plan.id)
  assert.equal(migrated.readingSourceLabel, "Fecha/Hora")
  assert.equal(migrated.status, "unconfigured")
  assert.equal(migrated.intervalValue, "")
  assert.equal(migrated.nextLabel, "Sin configurar")
  assert.equal(migrated.evidence, plan.evidence)
  assert.equal(plan.readingSourceLabel, "Valor manual")
  assert.equal(migrateMaintenanceReadingSource(migrated, { plan: true }), migrated)
})

test("historical orders keep status and links and supported plans are unchanged", () => {
  const order = { id: "OT-1", maintenancePlanId: "plan-1", readingSourceLabel: "Valor manual", status: "finished", closedAt: "2026-10-09" }
  const migrated = migrateMaintenanceReadingSource(order)
  assert.equal(migrated.readingSourceLabel, "Odometro")
  assert.equal(migrated.status, "finished")
  assert.equal(migrated.maintenancePlanId, "plan-1")
  assert.equal(migrated.closedAt, order.closedAt)
  const supported = { readingSourceLabel: "Horometro", intervalValue: 500 }
  assert.equal(migrateMaintenanceReadingSource(supported, { plan: true }), supported)
})
