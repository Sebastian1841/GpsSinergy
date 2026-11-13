import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, ref } from 'vue'
import { useMaintenanceModule } from './useMaintenanceModule.js'
import { createMaintenanceTestFixture } from './maintenanceTestFixture.js'

const setup = () => useMaintenanceModule({
  assets: ref([
    { id: 'a', companyId: 'c', patente: 'AAAA11', odometro: '1000' },
    { id: 'b', companyId: 'c', patente: 'BBBB22', odometro: '1000' },
  ]),
  companies: ref([]), route: { params: { empresaId: 'c' }, query: {} },
})

test('plan deletion confirms its orders, preserves other vehicles and archives associated costs', () => {
  const scope = effectScope()
  try {
    const module = scope.run(setup)
    const first = createMaintenanceTestFixture(module, 'a')
    const second = createMaintenanceTestFixture(module, 'b')
    module.openWorkOrderCostModal(first.order.id)
    Object.assign(module.modalDraft.value, { labor: '1200', parts: '0', other: '0' })
    module.submitMaintenanceModal()
    module.openWorkOrderActionModal(first.order.id, 'assign-order', 'in-progress')
    module.openDeleteMaintenancePlan(first.plan)
    assert.deepEqual(module.modalDraft.value.linkedOrders, [{ id: first.order.id, status: 'in-progress' }])
    module.closeMaintenanceModal()
    assert.ok(module.workOrders.value.some(order => order.id === first.order.id))
    module.openDeleteMaintenancePlan(first.plan)
    module.submitMaintenanceModal()
    assert.equal(module.workOrders.value.some(order => order.id === first.order.id), false)
    assert.ok(module.workOrders.value.some(order => order.id === second.order.id))
    const vehicle = module.maintenanceItems.value.find(vehicle => vehicle.id === 'a')
    assert.equal(module.getVehicleMaintenancePlans(vehicle).some(plan => plan.id === first.plan.id), false)
    assert.equal(module.displayCostRows.value.some(row => row.orderId === first.order.id), false)
    module.openDeleteMaintenancePlan({ ...second.plan, vehicleId: 'a' })
    assert.notEqual(module.activeMaintenanceModal.value, 'delete-maintenance')
  } finally { scope.stop() }
})

test('a change in linked orders refreshes the warning and requires confirmation again', () => {
  const scope = effectScope()
  try {
    const module = scope.run(setup)
    const { plan, order } = createMaintenanceTestFixture(module)
    module.openDeleteMaintenancePlan(plan)
    const originalConfirmation = { ...module.modalDraft.value }
    module.openWorkOrderActionModal(order.id, 'assign-order', 'in-progress')
    module.activeMaintenanceModal.value = 'delete-maintenance'
    module.modalDraft.value = originalConfirmation
    module.submitMaintenanceModal()
    assert.ok(module.workOrders.value.some(row => row.id === order.id))
    assert.match(module.modalActionMessage.value, /confirma nuevamente/)
    assert.equal(module.modalDraft.value.linkedOrders[0].status, 'in-progress')
    module.submitMaintenanceModal()
    assert.equal(module.workOrders.value.some(row => row.id === order.id), false)
  } finally { scope.stop() }
})

test('cancelled orders disappear and are not listed in the plan deletion warning', () => {
  const scope = effectScope()
  try {
    const module = scope.run(setup)
    const { plan, order } = createMaintenanceTestFixture(module)
    module.openWorkOrderActionModal(order.id, 'cancel-order')
    module.modalDraft.value.cancelReason = 'Trabajo no requerido'
    module.submitMaintenanceModal()
    assert.equal(module.workOrders.value.some(row => row.id === order.id), false)
    module.openCreateWorkOrder('a', plan.id)
    module.submitMaintenanceModal()
    const newOrder = module.workOrders.value.find(row => row.maintenancePlanId === plan.id)
    assert.ok(newOrder)
    assert.notEqual(newOrder.id, order.id)
    module.openDeleteMaintenancePlan(plan)
    assert.deepEqual(module.modalDraft.value.linkedOrders.map(row => row.id), [newOrder.id])
  } finally { scope.stop() }
})

test('a plan without linked orders can still be deleted', () => {
  const scope = effectScope()
  try {
    const module = scope.run(setup)
    const { plan } = createMaintenanceTestFixture(module, 'a', false)
    module.openDeleteMaintenancePlan(plan)
    assert.deepEqual(module.modalDraft.value.linkedOrders, [])
    module.submitMaintenanceModal()
    const vehicle = module.maintenanceItems.value.find(vehicle => vehicle.id === 'a')
    assert.equal(module.getVehicleMaintenancePlans(vehicle).length, 0)
  } finally { scope.stop() }
})
