import test from "node:test"
import assert from "node:assert/strict"
import { effectScope, ref } from "vue"
import { useMaintenanceModule } from "./useMaintenanceModule.js"
import { createMaintenanceTestFixture } from './maintenanceTestFixture.js'

test("global new plan never inherits a vehicle; contextual creation keeps the explicit vehicle", () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: "a", companyId: "c", patente: "AAAA11", odometro: "1000" }, { id: "b", companyId: "c", patente: "BBBB22", odometro: "2000" }]),
      companies: ref([]), route: { params: { empresaId: "c" }, query: {} },
    }))
    createMaintenanceTestFixture(module, 'a', false)
    module.openVehicleMaintenancePlans("b")
    module.openMaintenanceModal("maintenance")
    assert.equal(module.modalDraft.value.vehicleId, "")
    module.syncMaintenanceTypeDraft()
    assert.equal(module.modalDraft.value.vehicleId, "")
    module.submitMaintenanceModal()
    assert.equal(module.activeMaintenanceModal.value, "maintenance")
    assert.match(module.modalActionMessage.value, /Selecciona un activo/)
    module.modalDraft.value.vehicleId = "missing"
    module.syncMaintenanceVehicleDraft()
    assert.equal(module.modalDraft.value.vehicleId, "")
    module.modalDraft.value.vehicleId = "a"
    module.syncMaintenanceVehicleDraft()
    assert.equal(module.modalDraft.value.vehicleId, "a")
    for (const plan of module.modalVehicleMaintenancePlans.value) {
      assert.equal(module.isMaintenanceTemplateUsed("a", plan.name), true, plan.name)
    }
    assert.equal(module.isMaintenanceTemplateUsed("a", module.modalDraft.value.type), false)
    const existing = module.modalVehicleMaintenancePlans.value[0]
    module.modalDraft.value.planId = existing.id
    module.modalDraft.value.editMode = true
    assert.equal(module.isMaintenanceTemplateUsed("a", existing.name), true)
    assert.equal(module.isMaintenanceTemplateUsed("missing", "Revision tecnica"), false)
    module.openVehicleMaintenancePlans("b")
    module.openMaintenanceModal("maintenance", "maintenance-detail")
    assert.equal(module.modalDraft.value.vehicleId, "b")
    module.openMaintenanceModal("maintenance")
    assert.equal(module.modalDraft.value.vehicleId, "")
  } finally { scope.stop() }
})
