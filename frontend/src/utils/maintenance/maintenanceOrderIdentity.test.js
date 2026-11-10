import test from "node:test"
import assert from "node:assert/strict"
import {
  baseMaintenanceOrderId,
  migrateLegacyMaintenanceOrders,
} from "./maintenanceOrderIdentity.js"

test("base OT identity is stable across order and company, and cannot collide with another company", () => {
  assert.equal(baseMaintenanceOrderId({ id: "a", companyId: "c" }), "OT-BASE:c:a")
  assert.notEqual(
    baseMaintenanceOrderId({ id: "a", companyId: "c" }),
    baseMaintenanceOrderId({ id: "a", companyId: "other" }),
  )
  assert.notEqual(
    baseMaintenanceOrderId({ id: "b-c", companyId: "a" }),
    baseMaintenanceOrderId({ id: "c", companyId: "a-b" }),
  )
})

test("legacy migration uses stored identity and retains ambiguous records without guessing", () => {
  const state = {
    workOrderOverrides: { "OT-250": { status: "finished" }, "OT-251": { status: "cancelled" } },
    extraCostRows: [{ id: "cost", orderId: "OT-250", vehicleId: "a", total: 100 }],
    maintenancePlanOrderStates: { "base-a": { orderId: "OT-250", status: "pending-renewal" } },
  }
  const result = migrateLegacyMaintenanceOrders(state, [{ id: "a", companyId: "c" }])
  assert.equal(result.workOrderOverrides["OT-BASE:c:a"].status, "finished")
  assert.equal(result.extraCostRows[0].orderId, "OT-BASE:c:a")
  assert.equal(result.maintenancePlanOrderStates["base-a"].orderId, "OT-BASE:c:a")
  assert.equal(result.workOrderOverrides["OT-251"].status, "cancelled")
  assert.equal(result.unresolved, 1)
  assert.equal(state.extraCostRows[0].orderId, "OT-250")
})
