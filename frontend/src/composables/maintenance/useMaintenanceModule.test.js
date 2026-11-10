import test from "node:test"
import assert from "node:assert/strict"
import { ref, effectScope } from "vue"
import { useMaintenanceModule } from "./useMaintenanceModule.js"
import { createMaintenanceTestFixture } from './maintenanceTestFixture.js'

test("a vehicle without saved configuration has no plans or automatically created orders", () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: 'a', companyId: 'c', patente: 'AAAA11', odometro: '125430' }]),
      companies: ref([]), route: { params: { empresaId: 'c' }, query: {} },
    }))
    assert.deepEqual(module.getVehicleMaintenancePlans(module.maintenanceItems.value[0]), [])
    assert.equal(module.maintenanceItems.value[0].status, 'unconfigured')
    assert.equal(module.maintenanceItems.value[0].activeMaintenanceCount, 0)
    assert.equal(module.workOrders.value.length, 0)
    module.openMaintenanceModal('maintenance')
    Object.assign(module.modalDraft.value, { vehicleId: 'a', name: 'Incompleto', type: 'Incompleto', readingSourceLabel: 'Odometro', intervalValue: '', alertValue: '1000' })
    module.submitMaintenanceModal()
    assert.equal(module.getVehicleMaintenancePlans(module.maintenanceItems.value[0]).length, 0)
    assert.equal(module.activeMaintenanceModal.value, 'maintenance')
  } finally { scope.stop() }
})

test("opening creation for a plan with an open OT reuses its exact detail without creating another", () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: "a", companyId: "c", patente: "AAAA11", odometro: "1000" }]),
      companies: ref([]),
      route: { params: { empresaId: "c" }, query: {} },
    }))
    const { order } = createMaintenanceTestFixture(module)
    assert.ok(order)
    const count = module.workOrders.value.length
    module.openCreateWorkOrder(order.vehicleId, order.maintenancePlanId, order.job)
    assert.equal(module.activeMaintenanceModal.value, "order-detail")
    assert.equal(module.modalDraft.value.orderId, order.id)
    assert.equal(module.workOrders.value.length, count)
  } finally {
    scope.stop()
  }
})

test("plans follow live readings and derived OT identifiers survive plan creation and asset reordering", () => {
  const scope = effectScope()
  try {
    const assets = ref([
      { id: "a", companyId: "c", patente: "AAAA11", odometro: "1000" },
      { id: "b", companyId: "c", patente: "BBBB22", odometro: "2000" },
    ])
    const module = scope.run(() =>
      useMaintenanceModule({
        assets,
        companies: ref([]),
        route: { params: { empresaId: "c" }, query: {} },
      }),
    )
    const orderB = createMaintenanceTestFixture(module, 'b').order.id
    module.openMaintenanceModal("maintenance")
    module.modalDraft.value = {
      vehicleId: "a",
      name: "Test",
      type: "Test",
      readingSourceLabel: "Odometro",
      intervalValue: 1000,
      alertValue: 100,
      lastReading: 1000,
    }
    module.submitMaintenanceModal()
    assert.equal(module.workOrders.value.find((order) => order.vehicleId === "b").id, orderB)
    assets.value[0].odometro = "2500"
    const plan = module.selectedVehicleMaintenancePlans.value.find((p) => p.name === "Test")
    assert.equal(plan.actualLabel, "2.500 km")
    assert.equal(plan.status, "overdue")
    assert.match(plan.remainingLabel, /500/)
    assert.equal(module.selectedVehicle.value.status, "overdue")
    assets.value.reverse()
    assert.equal(module.workOrders.value.find((order) => order.vehicleId === "b").id, orderB)
  } finally {
    scope.stop()
  }
})

