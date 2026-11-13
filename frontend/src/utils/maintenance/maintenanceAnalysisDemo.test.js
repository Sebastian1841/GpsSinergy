import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildMaintenanceAnalysisDemo } from './maintenanceAnalysisDemo.js'
import { aggregateMaintenanceAnalysisPeriod, buildMaintenanceAnalysisIndex } from './maintenanceAnalysisData.js'

test('preview supplies varied costs, assets and measurable compliance without future closures', () => {
  const now = new Date('2026-11-13T12:00:00-03:00')
  const demo = buildMaintenanceAnalysisDemo(now)
  assert.equal(demo.vehicles.length, 8)
  assert.equal(new Set(demo.orders.map((order) => order.closedAt.slice(0, 7))).size, 12)
  const ids = new Set(demo.vehicles.map((vehicle) => vehicle.id))
  for (const order of demo.orders) {
    assert.ok(ids.has(order.vehicleId))
    assert.ok(order.closedAt <= '2026-11-13')
    assert.ok(order.createdAt <= order.closedAt)
    assert.equal(order.actualCost, order.laborCost + order.partsCost + order.otherCost)
  }
  const result = aggregateMaintenanceAnalysisPeriod(buildMaintenanceAnalysisIndex(demo.orders), new Date(2026, 5, 1), now)
  assert.equal(result.monthlyCosts.size, 6)
  assert.ok(new Set(result.monthlyCosts.values()).size > 1)
  assert.ok(result.statistics.onTimeRate > 0 && result.statistics.onTimeRate < 100)
  assert.equal(result.statistics.actualCost, result.composition.labor + result.composition.parts + result.composition.other)
})

test('preview remains valid on the first day of a year', () => {
  const demo = buildMaintenanceAnalysisDemo(new Date('2027-01-01T00:01:00-03:00'))
  assert.ok(demo.orders.every((order) => order.closedAt <= '2027-01-01'))
  assert.equal(new Set(demo.orders.map((order) => order.closedAt.slice(0, 7))).size, 12)
})

test('demo is dev-only, isolated from pending plans and never persisted', () => {
  const source = readFileSync(new URL('../../components/maintenance/MaintenanceCostsTab.vue', import.meta.url), 'utf8')
  assert.match(source, /const canPreviewAnalysis = import.meta.env.DEV/)
  assert.match(source, /analysisSection.value === 'summary' && analysisDemoEnabled.value/)
  assert.match(source, /buildFleetOrderIndex\(props.workOrders/)
  const helper = readFileSync(new URL('./maintenanceAnalysisDemo.js', import.meta.url), 'utf8')
  assert.doesNotMatch(helper, /localStorage|indexedDB|fetch\(|\.save\(|\.push\(props/)
})
