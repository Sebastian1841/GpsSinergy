import test from 'node:test'
import assert from 'node:assert/strict'
import { pendingPlanDueLabel } from './maintenancePendingPlanTable.js'

test('pending plan targets show full dates without interpreting readings as dates', () => {
  assert.equal(pendingPlanDueLabel({ readingSourceLabel: 'Fecha/Hora', lastReading: '2026-11-10', intervalValue: '19', nextLabel: '29-11-26' }), '29-11-2026')
  assert.equal(pendingPlanDueLabel({ readingSourceLabel: 'Fecha/Hora', nextLabel: '29-11-26' }), '29-11-2026')
  assert.equal(pendingPlanDueLabel({ readingSourceLabel: 'Fecha/Hora', nextLabel: '2026-11-29' }), '29-11-2026')
  assert.equal(pendingPlanDueLabel({ readingSourceLabel: 'Fecha/Hora', nextLabel: 'Sin fecha' }), 'Sin fecha')
  assert.equal(pendingPlanDueLabel({ readingSourceLabel: 'Odometro', nextLabel: '130.000 km' }), '130.000 km')
  assert.equal(pendingPlanDueLabel({ readingSourceLabel: 'Horometro', nextLabel: '3.000 hrs' }), '3.000 hrs')
})
