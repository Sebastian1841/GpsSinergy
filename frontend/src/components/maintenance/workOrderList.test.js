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
  assert.match(source, /@click="selectOrderList\('finished'\)">Historial/)
  assert.doesNotMatch(source, /label: "Canceladas"/)
  assert.match(source, /activeList.value = target.status === 'finished' \? 'finished' : 'open'/)
  assert.match(source, /props.workOrders.map\(\(order\) => order.id\)/)
  assert.match(source, /de {{ pagination.total }}/)
})

test("open-order toolbar groups filters and uses clear state names in workflow order", () => {
  const source = readFileSync(new URL("./MaintenanceWorkOrdersTab.vue", import.meta.url), "utf8")
  assert.match(source, /class="orders-toolbar"/)
  assert.match(source, /Ordenes abiertas <span class="order-count">/)
  const labels = [...source.matchAll(/\{ id: "(?:open|scheduled|in-progress|waiting)", label: "([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(labels, ["Todas", "Por iniciar", "En ejecucion", "En espera"])
  assert.match(source, /border-bottom: 2px solid #ff6600/)
})
