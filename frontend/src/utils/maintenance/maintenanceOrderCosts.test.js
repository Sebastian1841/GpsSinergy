import assert from "node:assert/strict"
import test from "node:test"
import { computed, reactive } from "vue"
import { formatCurrency, parseNumber } from "./maintenanceFormatUtils.js"
import { applyMaintenanceOrderCosts, groupMaintenanceOrderCosts } from "./maintenanceOrderCosts.js"

const previousCalculation = (order, rows) => {
  const costs = rows.filter((cost) => cost.orderId === order.id)
  const sum = (field) => costs.reduce((total, cost) => total + parseNumber(cost[field]), 0)
  const labor = sum("labor") || order.demoLaborCost || 0
  const parts = sum("parts") || order.demoPartsCost || 0
  const other = sum("other") || order.demoOtherCost || 0
  return {
    ...order,
    actualCost: formatCurrency(sum("total") || labor + parts + other),
    laborCost: formatCurrency(labor),
    partsCost: formatCurrency(parts),
    otherCost: formatCurrency(other),
  }
}

test("grouped costs preserve previous amounts, fallbacks and strict order identifiers", () => {
  const orders = [
    { id: "OT-1", demoLaborCost: 8000, demoPartsCost: 9000, demoOtherCost: 1000 },
    { id: "OT-2" },
    { id: "OT-3", demoLaborCost: 45000, demoPartsCost: 65000, demoOtherCost: 8000 },
    { id: "OT-zero", demoLaborCost: 1000 },
    { id: "OT-empty" },
    { id: 1 },
    { id: "1" },
  ]
  const rows = [
    { orderId: "OT-1", labor: "$ 25.000", parts: "12.500", other: "2.500", total: "40.000" },
    { orderId: "OT-1", labor: 5000, parts: 3000, other: 1000, total: 9000 },
    { orderId: "OT-2", labor: "15.000", parts: "4.000", other: "invalid" },
    { orderId: "OT-zero", labor: 0, parts: 0, other: 0, total: 0 },
    { orderId: 1, labor: 1234 },
    { orderId: "1", labor: 5678 },
    { orderId: "unrelated", labor: 999999 },
  ]
  const totals = groupMaintenanceOrderCosts(rows)
  for (const order of orders) {
    assert.deepEqual(applyMaintenanceOrderCosts(order, totals), previousCalculation(order, rows))
  }
})

test("reads each cost field once, not once per order", () => {
  let reads = 0
  const rows = Array.from({ length: 100 }, (_, index) => ({
    orderId: `OT-${index % 10}`,
    get labor() { reads += 1; return 1000 },
    get parts() { reads += 1; return 2000 },
    get other() { reads += 1; return 300 },
    get total() { reads += 1; return 3300 },
  }))
  const totals = groupMaintenanceOrderCosts(rows)
  for (let index = 0; index < 50; index += 1) applyMaintenanceOrderCosts({ id: `OT-${index}` }, totals)
  assert.equal(reads, 400)
  assert.equal(totals.get("OT-0").total, 33000)
})

test("cost index reacts to additions and edits while reusing cached totals", () => {
  const rows = reactive([{ orderId: "OT-1", labor: 1000 }])
  let builds = 0
  const totals = computed(() => {
    builds += 1
    return groupMaintenanceOrderCosts(rows)
  })
  const result = computed(() => applyMaintenanceOrderCosts({ id: "OT-1" }, totals.value))
  assert.equal(result.value.actualCost, "$ 1.000")
  assert.equal(result.value.actualCost, "$ 1.000")
  assert.equal(builds, 1)
  rows.push({ orderId: "OT-1", labor: 500 })
  assert.equal(result.value.actualCost, "$ 1.500")
  rows[0].labor = 2000
  assert.equal(result.value.actualCost, "$ 2.500")
  rows.splice(1, 1)
  assert.equal(result.value.actualCost, "$ 2.000")
})
