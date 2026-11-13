import test from 'node:test'
import assert from 'node:assert/strict'
import { validateMaintenanceOrderStep } from './maintenanceOrderWizard.js'

const valid = { vehicleId: 'a', maintenancePlanId: 'p', job: 'Aceite', priority: 'Media', plannedStartDate: '2026-11-09', owner: 'Ana', workshop: 'Taller' }
test('order wizard validates each step independently, and all data at confirmation', () => {
  assert.equal(validateMaintenanceOrderStep({ ...valid, owner: '' }, 1), '')
  assert.match(validateMaintenanceOrderStep({ ...valid, maintenancePlanId: '' }, 1), /plan/)
  assert.match(validateMaintenanceOrderStep({ ...valid, job: ' ' }, 1), /titulo/)
  assert.match(validateMaintenanceOrderStep({ ...valid, priority: '' }, 1), /prioridad/)
  assert.equal(validateMaintenanceOrderStep({ ...valid, owner: '' }, 2), '')
  assert.match(validateMaintenanceOrderStep({ ...valid, owner: '' }, 3), /responsable/)
  assert.equal(validateMaintenanceOrderStep({ ...valid, plannedStartDate: '' }, 3), '')
  assert.match(validateMaintenanceOrderStep({ ...valid, plannedStartDate: '2026-02-30' }, 2), /valida/)
  assert.match(validateMaintenanceOrderStep({ ...valid, scheduledDate: '2026-11-08' }, 2), /anterior/)
  assert.equal(validateMaintenanceOrderStep(valid, 4), '')
  assert.equal(validateMaintenanceOrderStep({ ...valid, scheduledDate: valid.plannedStartDate }, 4), '')
  assert.match(validateMaintenanceOrderStep({ ...valid, workshop: ' ' }, 4), /taller/)
  assert.match(validateMaintenanceOrderStep({ ...valid, plannedStartDate: '' }, 4), /fecha/)
  assert.match(validateMaintenanceOrderStep({ ...valid, job: '' }, 4), /titulo/)
})
