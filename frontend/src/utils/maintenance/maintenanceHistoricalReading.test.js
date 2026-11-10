import test from 'node:test'
import assert from 'node:assert/strict'
import { findMaintenanceHistoricalReading } from './maintenanceHistoricalReading.js'

test('historical reference uses last explicit reading of selected Chilean day, including zero', () => {
  const reports = [
    { timestamp: '2026-01-05T02:30:00Z', recordedMaintenanceReadings: { odometer: 100 } },
    { timestamp: '2026-01-05T12:00:00Z', recordedMaintenanceReadings: { odometer: 120 } },
    { timestamp: '2026-01-05T22:00:00Z', recordedMaintenanceReadings: { odometer: 130, hourMeterHours: 0 } },
    { timestamp: '2026-01-06T12:00:00Z', recordedMaintenanceReadings: { odometer: 150 } },
    { timestamp: '2026-01-05T23:00:00Z', odometer: 999 },
  ]
  assert.deepEqual(findMaintenanceHistoricalReading(reports, '2026-01-05', 'Odometro'), { value: 130, at: '2026-01-05T22:00:00Z' })
  assert.equal(findMaintenanceHistoricalReading(reports, '2026-01-05', 'Horometro').value, 0)
  assert.equal(findMaintenanceHistoricalReading(reports, '2026-01-04', 'Odometro').value, 100)
  assert.equal(findMaintenanceHistoricalReading(reports, '2026-01-03', 'Odometro'), null)
  assert.equal(findMaintenanceHistoricalReading(reports, '2099-01-05', 'Odometro'), null)
})
