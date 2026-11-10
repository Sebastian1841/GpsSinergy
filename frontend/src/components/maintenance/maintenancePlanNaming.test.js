import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { effectScope, ref } from "vue"
import { useMaintenanceModule } from "../../composables/maintenance/useMaintenanceModule.js"

test("selecting a maintenance type fills the plan name without changing the catalog", () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: "a", companyId: "c", patente: "AAAA11", odometro: "1000" }]),
      companies: ref([]), route: { params: { empresaId: "c" }, query: {} },
    }))
    const catalog = [...module.maintenanceTypes.value]
    module.openMaintenanceModal("maintenance")
    module.modalDraft.value = { vehicleId: "a", type: "Tipo de prueba", name: "Nombre anterior" }
    module.syncMaintenanceTypeDraft()
    assert.equal(module.modalDraft.value.name, "Tipo de prueba")
    Object.assign(module.modalDraft.value, { intervalValue: "10000", alertValue: "1000", lastReading: "1000" })
    module.submitMaintenanceModal()
    const plan = module.getVehicleMaintenancePlans(module.selectedVehicle.value).find((item) => item.name === "Tipo de prueba")
    assert.ok(plan)
    assert.equal(plan.type, "Tipo de prueba")
    assert.deepEqual(module.maintenanceTypes.value, catalog)
  } finally { scope.stop() }
})

test("plan name is read-only while catalog type names remain editable", () => {
  const source = readFileSync(new URL("./MaintenanceActionModal.vue", import.meta.url), "utf8")
  assert.match(source, /Tipo seleccionado<\/small><strong>{{ draft.type \|\| draft.originalType \|\| draft.name }}/)
  assert.match(source, /<input :value="draft.name" type="text" readonly/)
  assert.match(source, /v-model="draft.name"/)
  assert.match(source, /Nombre del plan<\/span><strong>{{ draft.name }}/)
})
