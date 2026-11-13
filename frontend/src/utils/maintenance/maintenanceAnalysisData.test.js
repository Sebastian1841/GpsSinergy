import assert from "node:assert/strict"
import test from "node:test"
import { computed, reactive, ref } from "vue"
import {
  aggregateMaintenanceAnalysisPeriod,
  buildMaintenanceAnalysisIndex,
  maintenanceAnalysisMonthKey,
  parseMaintenanceAnalysisDate,
  buildMaintenanceCalendarBuckets,
  buildMaintenanceCycleRanking,
  maintenanceAnalysisCostCeiling,
} from "./maintenanceAnalysisData.js"

test('all historical charts share the period cutoff and the same compliance result', () => {
  const source = [
    { vehicleId: 'a', status: 'finished', scheduledDate: '2026-11-01', closedAt: '2026-11-01T15:00:00-03:00', actualCost: 100, laborCost: 100 },
    { vehicleId: 'a', status: 'finished', scheduledDate: '2026-11-01', closedAt: '2026-11-02T15:00:00-03:00', actualCost: 200, partsCost: 200 },
    { vehicleId: 'a', status: 'finished', closedAt: '2035-11-01T15:00:00-03:00', actualCost: 999, partsCost: 999 },
    { vehicleId: 'a', status: 'finished', closedAt: '2026-11-13T18:00:00-03:00', actualCost: 999, partsCost: 999 },
  ]
  const end = new Date('2026-11-13T12:00:00-03:00')
  const result = aggregateMaintenanceAnalysisPeriod(buildMaintenanceAnalysisIndex(source), new Date(2026, 10, 1), end)
  assert.equal(result.statistics.actualCost, 300)
  assert.equal(result.statistics.onTimeRate, 50)
  assert.equal(result.vehicles.get('a').onTime, 1)
  assert.equal(result.vehicles.get('a').measurable, 2)
  assert.equal(result.vehicles.get('a').cost, 300)
  assert.deepEqual(result.composition, { labor: 100, parts: 200, other: 0 })
  assert.equal([...result.monthlyCosts.values()].reduce((a, b) => a + b, 0), 300)
})

test('date parsing uses Chile calendar days for timestamps and rejects invalid dates', () => {
  const closed = parseMaintenanceAnalysisDate('2026-11-02T01:00:00Z')
  assert.equal(closed.getDate(), 1)
  assert.equal(closed.getMonth(), 10)
  assert.equal(parseMaintenanceAnalysisDate('2026-02-30'), null)
  assert.equal(parseMaintenanceAnalysisDate('31/02/2026'), null)
  assert.equal(parseMaintenanceAnalysisDate('2026-11-01').getDate(), 1)
})

test('calendar buckets never interpret kilometers or hours as days and include configured future dates', () => {
  const plan = (source, remainingValue, status = 'current') => ({ readingSourceLabel: source, remainingValue, status })
  const rows = buildMaintenanceCalendarBuckets([
    plan('Odometro', 4, 'due'), plan('Horometro', 14, 'due'),
    plan('Fecha/Hora', -2, 'overdue'), plan('Fecha/Hora', 0, 'overdue'),
    plan('Fecha/Hora', 15), plan('Fecha/Hora', 16), plan('Fecha/Hora', 30),
    plan('Fecha/Hora', 31), plan('Fecha/Hora', 60), plan('Fecha/Hora', 61), plan('Fecha/Hora', 90),
    plan('Fecha/Hora', 91), plan('Fecha/Hora', null, 'unconfigured'), plan('Fecha/Hora', 5, 'renewal-pending'),
  ])
  assert.deepEqual(rows.map((row) => row.count), [2, 1, 2, 2, 2])
})

test('cycle priority uses actual progress, excludes missing readings and picks one plan per asset', () => {
  const plan = (vehicleId, status, cycleProgressPercent, remainingValue) => ({ vehicleId, status, cycleProgressPercent, remainingValue })
  const result = buildMaintenanceCycleRanking([
    plan('a', 'current', 34, 6600), plan('a', 'due', 80, 20),
    plan('b', 'due', 95, 5), plan('c', 'overdue', 120, -200),
    plan('d', 'no-reading', null, null), plan('e', 'renewal-pending', 150, -500),
  ])
  assert.deepEqual(result.map((row) => row.id), ['c', 'b', 'a'])
  assert.equal(result[0].percent, 100)
  assert.equal(result[0].cycleProgressPercent, 120)
  assert.equal(result[1].percent, 95)
})

test('cost chart ceiling never distorts values with a minimum visible bar', () => {
  assert.equal(maintenanceAnalysisCostCeiling(0), 1)
  assert.equal(maintenanceAnalysisCostCeiling(120000), 200000)
  assert.equal(maintenanceAnalysisCostCeiling(600000), 1000000)
  assert.equal(maintenanceAnalysisCostCeiling(1000000), 1000000)
  assert.equal(maintenanceAnalysisCostCeiling(2630000), 3000000)
})

const orders = [
  { vehicleId: 1, status: "finished", closedAt: "02/10/2026", scheduledDate: "02/10/2026", actualCost: "$ 12.000", laborCost: "$ 5.000", partsCost: "$ 6.000", otherCost: "$ 1.000" },
  { vehicleId: "1", status: "finished", closedAt: "03-10-2026, 10:30", scheduledDate: "02-10-2026", actualCost: "$ 8.000", laborCost: "$ 3.000", partsCost: "$ 4.000", otherCost: "$ 1.000" },
  { vehicleId: 2, status: "finished", closedAt: "10/09/2026", actualCost: "$ 7.000", laborCost: "$ 7.000" },
  { vehicleId: 2, status: "finished", closedAt: "01/04/2026", scheduledDate: "01/04/2026", actualCost: "$ 99.000", laborCost: "$ 99.000" },
  { vehicleId: 2, status: "finished", closedAt: "04/10/2026", scheduledDate: "invalid", actualCost: "$ 2.000", partsCost: "$ 2.000" },
  { vehicleId: 1, status: "cancelled", closedAt: "03/10/2026", actualCost: "$ 99.000" },
  { vehicleId: 1, status: "in-progress", closedAt: "03/10/2026", actualCost: "$ 99.000" },
  { vehicleId: 1, status: "finished", closedAt: "invalid", actualCost: "$ 99.000" },
]

test("shared aggregates match previous monthly costs, compliance, composition and ranking", () => {
  const start = new Date(2026, 4, 1)
  const index = buildMaintenanceAnalysisIndex(orders)
  const result = aggregateMaintenanceAnalysisPeriod(index, start)
  const money = (value) => Number(String(value || 0).replace(/[^0-9]/g, "")) || 0
  const completed = orders.filter((order) => order.status === "finished" && parseMaintenanceAnalysisDate(order.closedAt) >= start)
  for (const id of [1, 2, 3]) {
    const matching = completed.filter((order) => String(order.vehicleId) === String(id))
    const measured = matching.filter((order) => parseMaintenanceAnalysisDate(order.scheduledDate))
    const onTime = measured.filter((order) => {
      const deadline = parseMaintenanceAnalysisDate(order.scheduledDate)
      deadline.setHours(23, 59, 59, 999)
      return parseMaintenanceAnalysisDate(order.closedAt) <= deadline
    })
    const summary = result.vehicles.get(String(id))
    assert.equal(summary?.orders || 0, matching.length)
    assert.equal(summary?.measurable || 0, measured.length)
    assert.equal(summary?.onTime || 0, onTime.length)
    assert.equal(summary?.cost || 0, matching.reduce((sum, order) => sum + money(order.actualCost), 0))
    const latest = matching.map((order) => parseMaintenanceAnalysisDate(order.closedAt)).sort((a, b) => b - a)[0]
    assert.equal(summary?.lastClosed?.getTime(), latest?.getTime())
  }
  for (const [field, source] of [["labor", "laborCost"], ["parts", "partsCost"], ["other", "otherCost"]]) {
    assert.equal(result.composition[field], completed.reduce((sum, order) => sum + money(order[source]), 0))
  }
  assert.equal(index.monthlyCosts.get(maintenanceAnalysisMonthKey(new Date(2026, 9, 1))), 22000)
  assert.equal(index.monthlyCosts.get(maintenanceAnalysisMonthKey(new Date(2026, 8, 1))), 7000)
  assert.equal(index.monthlyCosts.get(maintenanceAnalysisMonthKey(new Date(2026, 3, 1))), 99000)
})

test("uses inclusive period boundaries and end-of-day deadlines", () => {
  const index = buildMaintenanceAnalysisIndex([
    { vehicleId: "a", status: "finished", closedAt: "2026-10-01T23:59:59", scheduledDate: "01/10/2026" },
    { vehicleId: "a", status: "finished", closedAt: "2026-09-30T23:59:59", scheduledDate: "30/09/2026" },
    { vehicleId: "a", status: "finished", closedAt: "2026-10-02T00:00:00", scheduledDate: "01/10/2026" },
  ])
  const summary = aggregateMaintenanceAnalysisPeriod(index, new Date(2026, 9, 1)).vehicles.get("a")
  assert.equal(summary.orders, 2)
  assert.equal(summary.onTime, 1)
  assert.equal(summary.measurable, 2)
})

test("changing period reuses the index, while closing or editing an OT updates aggregates", () => {
  const source = reactive([{ vehicleId: "a", status: "scheduled", closedAt: "02/10/2026", actualCost: "$ 1.000" }])
  const start = ref(new Date(2026, 9, 1))
  let builds = 0
  const index = computed(() => {
    builds += 1
    return buildMaintenanceAnalysisIndex(source)
  })
  const period = computed(() => aggregateMaintenanceAnalysisPeriod(index.value, start.value))
  assert.equal(period.value.vehicles.size, 0)
  source[0].status = "finished"
  assert.equal(period.value.vehicles.get("a").cost, 1000)
  const previousBuilds = builds
  start.value = new Date(2026, 8, 1)
  assert.equal(period.value.vehicles.get("a").cost, 1000)
  assert.equal(builds, previousBuilds)
  source[0].actualCost = "$ 2.000"
  assert.equal(period.value.vehicles.get("a").cost, 2000)
  start.value = new Date(2026, 10, 1)
  assert.equal(period.value.vehicles.size, 0)
})

test("empty or invalid histories produce empty aggregates", () => {
  assert.equal(parseMaintenanceAnalysisDate("invalid"), null)
  assert.equal(parseMaintenanceAnalysisDate(""), null)
  const result = aggregateMaintenanceAnalysisPeriod(buildMaintenanceAnalysisIndex([]), new Date())
  assert.equal(result.vehicles.size, 0)
  assert.deepEqual(result.composition, { labor: 0, parts: 0, other: 0 })
})
