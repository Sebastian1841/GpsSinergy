import test from 'node:test'
import assert from 'node:assert/strict'
import { readMaintenanceHours } from './maintenanceTelemetryReading.js'

test('maintenance reads actual platform total hours without inventing missing values or using daily hours', () => {
  assert.equal(readMaintenanceHours({ engineHours: 840.5 }), 840.5)
  assert.equal(readMaintenanceHours({ engineHours: '840.5' }), 840.5)
  assert.equal(readMaintenanceHours({ horometroTotal: '2.986,5 h' }), 2986.5)
  assert.equal(readMaintenanceHours({ engineHours: 0, horometroTotal: '99 h' }), 0)
  assert.equal(readMaintenanceHours({ engineHours: '-', horometroTotal: '840 h' }), 840)
  assert.equal(readMaintenanceHours({ hourMeterHours: 450 }), 450)
  assert.equal(readMaintenanceHours({ engineHoursDaily: 5, horometroDiario: '5 h' }), null)
  assert.equal(readMaintenanceHours({}), null)
})
