import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { matchesWorkOrderList } from "./workOrderList.js"

test("default open list contains only scheduled, active and waiting work", () => {
  const statuses = ["scheduled", "in-progress", "waiting", "finished", "cancelled"]
  assert.deepEqual(statuses.filter((status) => matchesWorkOrderList(status, "open")), statuses.slice(0, 3))
  assert.deepEqual(statuses.filter((status) => matchesWorkOrderList(status, "finished")), ["finished"])
  assert.deepEqual(statuses.filter((status) => matchesWorkOrderList(status, "cancelled")), ["cancelled"])
  assert.equal(matchesWorkOrderList("unknown", "open"), false)
})

test("reset and new orders show open work, explicit terminal navigation remains available", () => {
  const source = readFileSync(new URL("./MaintenanceWorkOrdersTab.vue", import.meta.url), "utf8")
  assert.match(source, /const activeList = ref\("open"\)/)
  assert.match(source, /label: "Finalizadas"/)
  assert.match(source, /label: "Canceladas"/)
  assert.match(source, /activeList.value = \["finished", "cancelled"\].includes\(target.status\) \? target.status : "open"/)
  assert.match(source, /props.workOrders.map\(\(order\) => order.id\)/)
  assert.match(source, /de {{ pagination.total }}/)
})
