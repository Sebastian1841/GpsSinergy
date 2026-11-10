import test from "node:test"
import assert from "node:assert/strict"
import { getLegacyMaintenanceOrderReview } from "./maintenanceOrderIdentity.js"

test("legacy review groups only technical references, excludes another known company and never reveals payloads", () => {
  const state = {
    workOrderOverrides: {
      "OT-300": { companyId: "a", plate: "SECRET", vehicleId: "v", description: "private" },
      "OT-301": { companyId: "b" }, "OT-BASE:a:v": {}, "OT-901": {},
    },
    extraCostRows: [{ orderId: "OT-300", companyId: "a", total: 999 }, { orderId: "OT-302", plate: "HIDDEN" }],
    maintenancePlanOrderStates: { plan: { orderId: "OT-300" } },
  }
  const before = JSON.stringify(state)
  const rows = getLegacyMaintenanceOrderReview(state, "a")
  assert.deepEqual(rows, [
    { id: "OT-300", sources: "Datos de OT, Registro de costo, Estado de plan" },
    { id: "OT-302", sources: "Registro de costo" },
  ])
  assert.doesNotMatch(JSON.stringify(rows), /SECRET|HIDDEN|999|private/)
  assert.equal(JSON.stringify(state), before)
  assert.deepEqual(getLegacyMaintenanceOrderReview({}, "a"), [])
})
