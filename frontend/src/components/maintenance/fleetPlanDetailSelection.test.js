import test from "node:test"
import assert from "node:assert/strict"
import { effectScope, ref } from "vue"
import { useMaintenanceModule } from "../../composables/maintenance/useMaintenanceModule.js"
import { createMaintenanceTestFixture } from '../../composables/maintenance/maintenanceTestFixture.js'

test("opening a plan name targets that plan and rejects another vehicle's plan", () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: "a", companyId: "c", patente: "AAAA11", odometro: "1000" }, { id: "b", companyId: "c", patente: "BBBB22", odometro: "2000" }]),
      companies: ref([]), route: { params: { empresaId: "c" }, query: {} },
    }))
    createMaintenanceTestFixture(module, 'a', false)
    const vehicle = module.maintenanceItems.value.find((item) => item.id === "a")
    const plans = module.getVehicleMaintenancePlans(vehicle)
    assert.ok(plans.length)
    const target = plans.at(-1)
    module.openVehicleMaintenancePlans("a", target.id)
    assert.equal(module.activeMaintenanceModal.value, 'maintenance')
    assert.equal(module.modalDraft.value.sourcePlanId, target.id)
    assert.equal(module.modalDraft.value.editMode, true)
    assert.equal(module.modalDraft.value.returnToDetail, false)
    assert.equal(module.selectedVehicle.value.id, "a")
    module.closeMaintenanceModal()
    module.openVehicleMaintenancePlans("b", target.id)
    assert.equal(module.activeMaintenanceModal.value, "")
    module.openVehicleMaintenancePlans("a")
    assert.equal(module.activeMaintenanceModal.value, "")
    assert.equal(module.activeTab.value, 'overview')
    assert.equal(module.fleetPlanFocus.value.vehicleId, 'a')
    assert.equal(module.modalDraft.value.planId, undefined)
    module.openMaintenanceModal('maintenance-detail')
    assert.equal(module.activeMaintenanceModal.value, '')
  } finally { scope.stop() }
})
