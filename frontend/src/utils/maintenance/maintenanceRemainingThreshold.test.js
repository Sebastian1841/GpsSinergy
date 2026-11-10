import test from 'node:test'
import assert from 'node:assert/strict'
import { maintenanceRemainingThreshold } from './maintenanceRemainingThreshold.js'

test('remaining threshold compares target against live GPS, not advance warning or historical baseline', () => {
  const draft = { lastReading: '124700', intervalValue: '5300', alertValue: '1000', readingSourceLabel: 'Odometro' }
  assert.equal(maintenanceRemainingThreshold(draft, 125430), 'Faltan 4.570 km')
  assert.equal(maintenanceRemainingThreshold({ ...draft, alertValue: '500' }, 125430), 'Faltan 4.570 km')
  assert.equal(maintenanceRemainingThreshold(draft, 130000), 'Vence ahora')
  assert.equal(maintenanceRemainingThreshold(draft, 130100), 'Vencida por 100 km')
  assert.equal(maintenanceRemainingThreshold(draft, null), 'Sin lectura actual disponible')
  assert.equal(maintenanceRemainingThreshold(draft, 0), 'Faltan 130.000 km')
  assert.equal(maintenanceRemainingThreshold({ ...draft, intervalValue: '' }, 125430), '')
})

test('remaining hours and calendar days use current reference', () => {
  const draft = { lastReading: '6000', intervalValue: '500', readingSourceLabel: 'Horometro' }
  assert.equal(maintenanceRemainingThreshold(draft, 6200), 'Faltan 300 horas')
  assert.equal(maintenanceRemainingThreshold({ readingSourceLabel: 'Fecha/Hora', lastReading: '2026-11-01', intervalValue: '30' }, null, '2026-11-09'), 'Faltan 22 dias')
})
