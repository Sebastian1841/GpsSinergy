import assert from "node:assert/strict"
import test from "node:test"
import { computed, reactive } from "vue"
import { summarizeMaintenanceOrders } from "./maintenanceOrderSummary.js"
import { formatDecimalNumber, formatNumber } from "./maintenanceFormatUtils.js"

test("order summary counts open deadlines and finished compliance independently", () => {
  const result = summarizeMaintenanceOrders([
    { status: "scheduled", scheduledDate: "07/10/2026", estimatedCost: "$ 10.000" },
    { status: "waiting", scheduledDate: "2026-10-08" },
    { status: "in-progress", scheduledDate: "invalid" },
    { status: "finished", scheduledDate: "06/10/2026", closedAt: "06/10/2026", createdAt: "04/10/2026", actualCost: "$ 5.000" },
    { status: "finished", scheduledDate: "05/10/2026", closedAt: "07/10/2026", createdAt: "03/10/2026" },
    { status: "cancelled", scheduledDate: "01/10/2026", actualCost: "$ 1.000" },
  ], new Date(2026, 9, 8, 12))
  assert.equal(result.openCount, 3)
  assert.equal(result.overdueCount, 1)
  assert.equal(result.counts.get("finished"), 2)
  assert.equal(result.onTimeRate, 50)
  assert.equal(result.averageClosingDays, 3)
  assert.equal(result.estimatedCost, 10000)
  assert.equal(result.actualCost, 6000)
})

test("missing dates do not become zero compliance or closing durations", () => {
  for (const orders of [[], [{ status: "finished", closedAt: "invalid" }]]) {
    const result = summarizeMaintenanceOrders(orders)
    assert.equal(result.onTimeRate, null)
    assert.equal(result.averageClosingDays, null)
    assert.equal(result.actualCost, 0)
  }
  const reversed = summarizeMaintenanceOrders([
    { status: "finished", createdAt: "08/10/2026", closedAt: "07/10/2026", scheduledDate: "07/10/2026" },
  ])
  assert.equal(reversed.averageClosingDays, null)
  assert.equal(reversed.onTimeRate, 100)
})

test("computed order summary is cached and updates when orders change", () => {
  const orders = reactive([{ status: "scheduled" }])
  let runs = 0
  const summary = computed(() => {
    runs += 1
    return summarizeMaintenanceOrders(orders)
  })
  assert.equal(summary.value.openCount, 1)
  assert.equal(summary.value.counts.get("scheduled"), 1)
  assert.equal(runs, 1)
  orders[0].status = "finished"
  assert.equal(summary.value.openCount, 0)
  assert.equal(runs, 2)
})

test("shared numeric formatters preserve Chilean integer and decimal formatting", () => {
  for (const value of [0, 1234567, 12.34, -25.67]) {
    assert.equal(formatNumber(value), new Intl.NumberFormat("es-CL").format(Math.round(value)))
    assert.equal(formatDecimalNumber(value), new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(value))
  }
})
