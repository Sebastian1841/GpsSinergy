import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { effectScope, ref } from "vue"
import { useMaintenanceModule } from "./useMaintenanceModule.js"

test("create, close and renew offer the exact next target without automatic renewal", () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: "a", companyId: "c", patente: "AAAA11", odometro: "1000" }]),
      companies: ref([]), route: { params: { empresaId: "c" }, query: {} },
    }))
    module.openMaintenanceModal("maintenance")
    module.modalDraft.value = {
      vehicleId: "a", name: "Prueba flujo", type: "Prueba flujo",
      readingSourceLabel: "Odometro", intervalValue: 1000, alertValue: 1000, lastReading: 1000,
    }
    module.submitMaintenanceModal()
    const plan = module.getVehicleMaintenancePlans(module.selectedVehicle.value).find((item) => item.name === "Prueba flujo")
    assert.ok(plan)
    module.openCreateWorkOrder("a", plan.id, plan.name)
    Object.assign(module.modalDraft.value, { plannedStartDate: "2026-11-05", owner: "Responsable", workshop: "Taller" })
    module.submitMaintenanceModal()
    const created = module.maintenanceFeedbackAction.value
    assert.equal(created.type, "order")
    assert.equal(module.selectedOrder.value.id, created.orderId)
    module.openWorkOrderActionModal(created.orderId, "close-order")
    Object.assign(module.modalDraft.value, { workPerformed: "Trabajo realizado", closedBy: "Responsable", closingReading: "1200" })
    module.submitMaintenanceModal()
    assert.deepEqual(module.maintenanceFeedbackAction.value, {
      type: "renew", vehicleId: "a", planId: plan.id, label: "Revisar renovacion",
    })
    assert.equal(module.selectedOrder.value.status, "finished")
    module.openRenewMaintenance("a", plan.id)
    module.submitMaintenanceModal()
    assert.equal(module.maintenanceFeedbackAction.value.type, "plan")
    assert.equal(module.maintenanceFeedbackAction.value.vehicleId, "a")
    module.maintenanceFeedbackMessage.value = "Otro aviso sin accion"
    assert.equal(module.maintenanceFeedbackAction.value, null)
  } finally { scope.stop() }
})

test("results are outside conditional header, dismissible and have no expiry timer", () => {
  const source = readFileSync(new URL("../../views/MaintenanceView.vue", import.meta.url), "utf8")
  const result = source.indexOf('class="maintenance-result"')
  assert.ok(result > source.indexOf("</header>"))
  assert.match(source, /aria-label="Descartar mensaje"/)
  assert.match(source, /role="status" aria-live="polite"/)
  assert.doesNotMatch(source, /watch\(maintenanceFeedbackMessage/)
  assert.match(source, /watch\(\(\) => route.params.empresaId, dismissMaintenanceResult\)/)
  const header = source.slice(source.indexOf("<header"), source.indexOf("</header>"))
  assert.match(header, /Planes sin OT/)
  assert.doesNotMatch(header, /Nueva OT/)
  assert.doesNotMatch(header, /Nuevo plan de mantenci/)
})

test("fleet avoids duplicate due labels and open orders are not presented as closed", () => {
  const fleet = readFileSync(new URL("../../components/maintenance/MaintenanceFleetTab.vue", import.meta.url), "utf8")
  assert.match(fleet, /\.date !== priorityMaintenance\(item, index\)\.detail/)
  const modal = readFileSync(new URL("../../components/maintenance/MaintenanceActionModal.vue", import.meta.url), "utf8")
  assert.match(modal, /draft.status === "finished" \? "OT cerrada el" : "Fecha limite de ejecucion"/)
  assert.match(modal, /draft.status === 'finished' \? 'is-closed' : 'is-open'/)
})

test("legacy references do not expose a review button or dialog in the client interface", () => {
  const source = readFileSync(new URL("../../views/MaintenanceView.vue", import.meta.url), "utf8")
  const toolbar = source.slice(source.indexOf('class="fleet-toolbar-summary"'), source.indexOf('@click="openFleetExport"'))
  assert.doesNotMatch(toolbar, /maintenanceItems.length/)
  assert.doesNotMatch(toolbar, /legacy|advertencia|maintenanceFeedbackMessage/)
  assert.doesNotMatch(source, /showLegacyOrderReview|OT por revisar|id="legacy-order-review"/)
})
