import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, ref } from 'vue'
import { useMaintenanceModule } from './useMaintenanceModule.js'
import { createMaintenanceTestFixture } from './maintenanceTestFixture.js'

test('current plans reject order creation from rows, convenience actions and direct submission', () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: 'a', companyId: 'c', patente: 'AAAA11', odometro: '1000' }]),
      companies: ref([]), route: { params: { empresaId: 'c' }, query: {} },
    }))
    const { plan } = createMaintenanceTestFixture(module, 'a', false)
    module.openEditMaintenancePlan(plan)
    module.modalDraft.value.alertValue = '1'
    module.submitMaintenanceModal()
    const vehicle = module.maintenanceItems.value.find(vehicle => vehicle.id === 'a')
    const current = module.getVehicleMaintenancePlans(vehicle).find(row => row.id === plan.id)
    assert.equal(current.status, 'current')
    module.openCreateWorkOrder('a', plan.id)
    assert.notEqual(module.activeMaintenanceModal.value, 'create-order')
    module.createWorkOrderFromMaintenancePlan({ ...current, status: 'due' })
    assert.equal(module.workOrders.value.length, 0)
    module.openMaintenanceModal('create-order')
    Object.assign(module.modalDraft.value, { vehicleId: 'a', maintenancePlanId: plan.id, job: plan.name, owner: 'Ana', workshop: 'Taller', plannedStartDate: '2026-11-11' })
    module.submitMaintenanceModal()
    assert.equal(module.workOrders.value.length, 0)
    assert.match(module.modalActionMessage.value, /proximas o vencidas/)
  } finally { scope.stop() }
})
