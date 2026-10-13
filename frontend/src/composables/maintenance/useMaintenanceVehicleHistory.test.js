import assert from "node:assert/strict"
import test from "node:test"
import { effectScope, nextTick, reactive, ref } from "vue"
import { useMaintenanceVehicleHistory } from "./useMaintenanceVehicleHistory.js"

const setup = (orders) => {
  const source = reactive(orders)
  const vehicle = ref("v1")
  const scope = effectScope()
  const history = scope.run(() => useMaintenanceVehicleHistory({ orders: () => source, vehicleId: () => vehicle.value }))
  return { source, vehicle, scope, history }
}
const fixtures = () => Array.from({ length: 25 }, (_, index) => ({
  id: `OT-${index + 1}`, vehicleId: "v1", status: "finished",
  closedAt: new Date(2026, 9, index + 1, 12).toISOString(),
  job: index % 2 ? "Oil" : "Brakes", actualCost: `$ ${(index + 1) * 1000}`,
  closingReading: `${index * 1000} km`, owner: "Owner",
}))

test("renders only the current page, newest first, without mutating source", (t) => {
  const original = fixtures()
  const { history, source, scope } = setup(original)
  t.after(() => scope.stop())
  assert.equal(history.historyOrders.value.length, 25)
  assert.equal(history.displayed.value.length, 10)
  assert.equal(history.displayed.value[0].id, "OT-25")
  history.page.value = 3
  assert.equal(history.displayed.value.length, 5)
  assert.equal(history.displayed.value[0].id, "OT-5")
  assert.equal(source[0].id, "OT-1")
})

test("filters and page size reset pagination; dates include the full final day", async (t) => {
  const { history, scope } = setup(fixtures())
  t.after(() => scope.stop())
  history.page.value = 3
  history.type.value = "Oil"
  history.from.value = "2026-10-02"
  history.to.value = "2026-10-04"
  await nextTick()
  assert.equal(history.page.value, 1)
  assert.deepEqual(history.displayed.value.map((order) => order.id), ["OT-4", "OT-2"])
  history.type.value = "all"
  history.from.value = ""
  history.to.value = ""
  history.pageSize.value = 20
  await nextTick()
  assert.equal(history.displayed.value.length, 20)
})

test("sorting numeric costs and text retains newest-first ties and resets page", (t) => {
  const { history, scope } = setup(fixtures())
  t.after(() => scope.stop())
  history.page.value = 2
  history.sortBy("actualCost")
  assert.equal(history.page.value, 1)
  assert.equal(history.displayed.value[0].id, "OT-1")
  history.sortBy("actualCost")
  assert.equal(history.displayed.value[0].id, "OT-25")
  history.sortBy("owner")
  assert.equal(history.displayed.value[0].id, "OT-25")
})

test("updates when orders close, handles empty filters and clamps removed pages", async (t) => {
  const { history, source, vehicle, scope } = setup(fixtures())
  t.after(() => scope.stop())
  history.page.value = 3
  source.splice(10)
  await nextTick()
  assert.equal(history.page.value, 1)
  source.push({ id: "new", vehicleId: "v1", status: "scheduled", closedAt: "2026-10-28T12:00:00Z" })
  assert.equal(history.filteredOrders.value.length, 10)
  source.at(-1).status = "finished"
  assert.equal(history.filteredOrders.value.length, 11)
  assert.equal(history.displayed.value[0].id, "new")
  history.page.value = 2
  vehicle.value = "v2"
  await nextTick()
  assert.equal(history.page.value, 1)
  assert.equal(history.pageCount.value, 1)
  assert.deepEqual(history.displayed.value, [])
})
