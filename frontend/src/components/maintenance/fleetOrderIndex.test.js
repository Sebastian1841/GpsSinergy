import assert from "node:assert/strict"
import test from "node:test"
import { computed, reactive } from "vue"
import { buildFleetOrderIndex, findFleetOpenOrder } from "./fleetOrderIndex.js"

test("matches open orders by vehicle and plan or name, preserving source order", () => {
  const orders = [
    { id: "closed", vehicleId: 1, maintenancePlanId: "p1", job: "Oil", status: "finished" },
    { id: "other", vehicleId: 2, maintenancePlanId: "p1", job: "Oil", status: "scheduled" },
    { id: "name", vehicleId: 1, maintenancePlanId: "legacy", job: "OIL", status: "waiting" },
    { id: "plan", vehicleId: 1, maintenancePlanId: "p1", job: "Different", status: "in-progress" },
  ]
  const index = buildFleetOrderIndex(orders)
  assert.equal(findFleetOpenOrder(index, "1", "p1", "Oil"), orders[2])
  assert.equal(findFleetOpenOrder(index, 1, "p1", "Unknown"), orders[3])
  assert.equal(findFleetOpenOrder(index, 1, null, "oil"), orders[2])
  assert.equal(findFleetOpenOrder(index, 2, "p1", "Oil"), orders[1])
  assert.equal(findFleetOpenOrder(index, 3, "p1", "Oil"), undefined)
})

test("reactive index is cached and updates when orders are created, closed or cancelled", () => {
  const orders = reactive([])
  let builds = 0
  const index = computed(() => {
    builds += 1
    return buildFleetOrderIndex(orders)
  })
  const lookup = () => findFleetOpenOrder(index.value, 1, "p1", "Oil")
  assert.equal(lookup(), undefined)
  lookup()
  assert.equal(builds, 1)
  orders.push({ id: "new", vehicleId: 1, maintenancePlanId: "p1", job: "Oil", status: "scheduled" })
  assert.equal(lookup().id, "new")
  orders[0].status = "finished"
  assert.equal(lookup(), undefined)
  orders.push({ id: "renewed", vehicleId: 1, maintenancePlanId: "p1", job: "Oil", status: "in-progress" })
  assert.equal(lookup().id, "renewed")
  orders[1].status = "cancelled"
  assert.equal(lookup(), undefined)
})

test("pending OT index preserves accent-insensitive names and its original matching rules", () => {
  const norm = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const options = { normalizeName: norm, planKey: (order) => String(order.maintenancePlanId) }
  const orders = [
    { id: "closed", vehicleId: 1, maintenancePlanId: "p1", job: "Revision tecnica", status: "finished" },
    { id: "cancelled", vehicleId: 1, maintenancePlanId: "p2", job: "Frenos", status: "cancelled" },
    { id: "by-name", vehicleId: "1", job: "Revisi\u00f3n t\u00e9cnica", status: "scheduled" },
    { id: "by-plan", vehicleId: 2, maintenancePlanId: "p3", job: "Different", status: "waiting" },
    { id: "numeric-plan", vehicleId: 3, maintenancePlanId: 0, job: "Other", status: "in-progress" },
  ]
  const plans = [
    { id: "p1", vehicleId: 1, nextJob: "Revision tecnica" },
    { id: "p2", assetId: 1, nextJob: "Frenos" },
    { id: "p3", vehicleId: 2, nextJob: "Oil" },
    { id: "0", vehicleId: 3, nextJob: "Oil" },
    { id: "p4", vehicleId: 4, nextJob: "Revision tecnica" },
  ]
  const index = buildFleetOrderIndex(orders, options)
  for (const plan of plans) {
    const previous = orders.some((order) =>
      String(order.vehicleId) === String(plan.vehicleId || plan.assetId || plan.id) &&
      !["finished", "cancelled"].includes(order.status) &&
      (String(order.maintenancePlanId) === String(plan.id) || norm(order.job) === norm(plan.nextJob)),
    )
    const indexed = Boolean(findFleetOpenOrder(index, plan.vehicleId || plan.assetId || plan.id, plan.id, plan.nextJob, options))
    assert.equal(indexed, previous)
  }
  assert.equal(findFleetOpenOrder(index, 1, "p1", "Revision tecnica", options).id, "by-name")
  assert.equal(findFleetOpenOrder(index, 1, "p2", "Frenos", options), undefined)
})

test("pending plan lookups do not rescan order names", () => {
  let reads = 0
  const orders = Array.from({ length: 100 }, (_, index) => ({
    vehicleId: index,
    maintenancePlanId: `p-${index}`,
    status: "scheduled",
    get job() { reads += 1; return "Oil" },
  }))
  const index = buildFleetOrderIndex(orders)
  assert.equal(reads, 100)
  for (let vehicle = 0; vehicle < 100; vehicle += 1) {
    assert.ok(findFleetOpenOrder(index, vehicle, `p-${vehicle}`, "Oil"))
  }
  assert.equal(reads, 100)
})
