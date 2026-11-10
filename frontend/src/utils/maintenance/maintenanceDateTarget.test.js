import test from 'node:test'
import assert from 'node:assert/strict'
import { maintenanceTargetDate, maintenanceDateInterval } from './maintenanceDateTarget.js'

test('exact maintenance date round trips through existing interval without timezone drift', () => {
  assert.equal(maintenanceDateInterval('2026-11-09', '2026-12-01'), '22')
  assert.equal(maintenanceTargetDate('2026-11-09', '22'), '2026-12-01')
  assert.equal(maintenanceTargetDate('2026-11-09', ''), '')
  assert.equal(maintenanceTargetDate('2026-11-09', '0'), '')
  assert.equal(maintenanceDateInterval('2026-02-30', '2026-03-10'), '')
  assert.equal(maintenanceTargetDate('2026-11-09', '-1'), '')
})
