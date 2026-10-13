import assert from "node:assert/strict"
import test from "node:test"
import { computed, reactive } from "vue"
import { normalizeText } from "./maintenanceFormatUtils.js"
import { buildMaintenancePlanIndex, findMaintenancePlansForVehicle } from "./maintenancePlanIndex.js"

const originalMatches = (plan, vehicle, routeCompanyId = "") => {
  if (!plan || !vehicle) return false
  if (plan.vehicleId && vehicle.id && String(plan.vehicleId) === String(vehicle.id)) return true
  const companyId = String(plan.companyId || "")
  const vehicleCompanyId = String(vehicle.companyId || routeCompanyId || "")
  const plate = normalizeText(plan.plate)
  const vehiclePlate = normalizeText(vehicle.plate)
  return Boolean(companyId && vehicleCompanyId && plate && vehiclePlate) && companyId === vehicleCompanyId && plate === vehiclePlate
}

test("preserves ID and company/plate matching, source order and count", () => {
  const plans = [
    { id: "scope-first", vehicleId: "old-id", companyId: "c1", plate: " JSFG-74 " },
    { id: "id-only", vehicleId: 1, companyId: "other", plate: "OTHER" },
    { id: "both", vehicleId: "1", companyId: "c1", plate: "jsfg-74" },
    { id: "other-company", companyId: "c2", plate: "JSFG-74" },
    { id: "missing-scope", vehicleId: "other" },
    { id: "zero-id", vehicleId: 0, companyId: "c3", plate: "ZERO" },
  ]
  const index = buildMaintenancePlanIndex(plans)
  for (const [vehicle, route] of [
    [{ id: 1, companyId: "c1", plate: "JSFG-74" }, ""],
    [{ id: 1, plate: "JSFG-74" }, "c1"],
    [{ companyId: "c2", plate: "JSFG-74" }, ""],
    [{ id: 0, companyId: "c3", plate: "ZERO" }, ""],
    [{ id: "missing", plate: "JSFG-74" }, ""],
    [null, "c1"],
  ]) {
    assert.deepEqual(findMaintenancePlansForVehicle(index, vehicle, route), plans.filter((plan) => originalMatches(plan, vehicle, route)))
  }
  assert.deepEqual(findMaintenancePlansForVehicle(index, { id: 1, companyId: "c1", plate: "JSFG-74" }).map((plan) => plan.id), ["scope-first", "id-only", "both"])
})

test("reuses matching arrays without rereading all plan keys", () => {
  let reads = 0
  const plans = Array.from({ length: 100 }, (_, position) => ({
    get vehicleId() { reads += 1; return `v-${position}` },
    companyId: "c1",
    plate: `PLATE-${position}`,
  }))
  const index = buildMaintenancePlanIndex(plans)
  const initialReads = reads
  const vehicle = { id: "v-1", companyId: "c1", plate: "PLATE-1" }
  const first = findMaintenancePlansForVehicle(index, vehicle)
  assert.equal(findMaintenancePlansForVehicle(index, vehicle), first)
  for (let position = 0; position < 100; position += 1) {
    findMaintenancePlansForVehicle(index, { id: `v-${position}` })
  }
  assert.equal(reads, initialReads)
})

test("reactive index updates on creation, deletion and reassignment; plan edits remain visible", () => {
  const plans = reactive([{ id: "p1", vehicleId: "v1", status: "due" }])
  const index = computed(() => buildMaintenancePlanIndex(plans))
  const lookup = (id) => findMaintenancePlansForVehicle(index.value, { id })
  const initialIndex = index.value
  assert.equal(lookup("v1")[0].status, "due")
  plans[0].status = "current"
  assert.equal(index.value, initialIndex)
  assert.equal(lookup("v1")[0].status, "current")
  plans.push({ id: "p2", vehicleId: "v1" })
  assert.equal(lookup("v1").length, 2)
  plans[0].vehicleId = "v2"
  assert.equal(lookup("v1")[0].id, "p2")
  assert.equal(lookup("v2")[0].id, "p1")
  plans.splice(0, 1)
  assert.equal(lookup("v2").length, 0)
})

test("route-company fallback has separate cached results", () => {
  const plans = [{ id: "a", companyId: "c1", plate: "P" }, { id: "b", companyId: "c2", plate: "P" }]
  const index = buildMaintenancePlanIndex(plans)
  const vehicle = { id: "v", plate: "P" }
  assert.deepEqual(findMaintenancePlansForVehicle(index, vehicle, "c1"), [plans[0]])
  assert.deepEqual(findMaintenancePlansForVehicle(index, vehicle, "c2"), [plans[1]])
  assert.deepEqual(findMaintenancePlansForVehicle(index, vehicle), [])
})
