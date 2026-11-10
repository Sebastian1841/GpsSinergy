import test from "node:test"
import assert from "node:assert/strict"
import { effectScope, ref } from "vue"
import { useMaintenanceModule } from "./useMaintenanceModule.js"

test("odometer target and advance warning follow current readings without shifting the target", () => {
  const scope = effectScope()
  try {
    const assets = ref([{ id: "a", companyId: "c", patente: "AAAA11", odometro: "125000" }])
    const module = scope.run(() => useMaintenanceModule({ assets, companies: ref([]), route: { params: { empresaId: "c" }, query: {} } }))
    module.openMaintenanceModal("maintenance")
    module.modalDraft.value.vehicleId = "a"
    module.syncMaintenanceVehicleDraft()
    module.modalDraft.value.type = "Prueba objetivo"
    module.syncMaintenanceTypeDraft()
    assert.equal(module.modalDraft.value.lastReading, "125000")
    assert.equal(module.modalDraft.value.intervalValue, "")
    Object.assign(module.modalDraft.value, { vehicleId: "a", type: "Prueba objetivo", name: "Prueba objetivo", readingSourceLabel: "Odometro", lastReading: "125000", intervalValue: "10000", alertValue: "1000", manualReading: false })
    module.submitMaintenanceModal()
    const getPlan = () => module.getVehicleMaintenancePlans(module.maintenanceItems.value[0]).find((plan) => plan.name === "Prueba objetivo")
    assert.match(getPlan().nextLabel, /135[.,]?000/)
    assert.equal(getPlan().status, "current")
    assets.value = [{ ...assets.value[0], odometro: "134000" }]
    assert.equal(getPlan().status, "due")
    assert.match(getPlan().nextLabel, /135[.,]?000/)
    assets.value = [{ ...assets.value[0], odometro: "135000" }]
    assert.equal(getPlan().status, "overdue")
    assets.value = [{ id: "a", companyId: "c", patente: "AAAA11" }]
    assert.equal(getPlan().status, "no-reading")
    assert.equal(getPlan().actualLabel, "Sin lectura disponible")
    assert.match(getPlan().nextLabel, /135[.,]?000/)
    module.openMaintenanceModal("maintenance")
    Object.assign(module.modalDraft.value, { vehicleId: "a", type: "Otro tipo" })
    module.syncMaintenanceTypeDraft()
    assert.equal(module.modalDraft.value.lastReading, "")
    assets.value = [{ ...assets.value[0], odometro: 0 }]
    assert.equal(getPlan().status, "current")
    module.syncMaintenanceTypeDraft()
    assert.equal(module.modalDraft.value.lastReading, "0")
  } finally { scope.stop() }
})
