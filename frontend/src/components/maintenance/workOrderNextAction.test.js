import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { effectScope, ref } from "vue"
import { getWorkOrderNextAction } from "./workOrderNextAction.js"
import { useMaintenanceModule } from "../../composables/maintenance/useMaintenanceModule.js"
import { createMaintenanceTestFixture } from '../../composables/maintenance/maintenanceTestFixture.js'

test("next action follows status and terminal states expose no transition", () => {
  assert.deepEqual(getWorkOrderNextAction("scheduled"), { label: "Iniciar trabajo", modal: "assign-order", status: "in-progress" })
  assert.deepEqual(getWorkOrderNextAction("waiting"), { label: "Reanudar trabajo", modal: "assign-order", status: "in-progress" })
  assert.deepEqual(getWorkOrderNextAction("in-progress"), { label: "Cerrar OT", modal: "close-order", status: "finished" })
  for (const status of ["finished", "cancelled", "unknown"]) assert.equal(getWorkOrderNextAction(status), null)
})

test("start confirmation shows context without editable fields and leaves assignment and waiting forms separate", () => {
  const source = readFileSync(new URL("./MaintenanceActionModal.vue", import.meta.url), "utf8")
  const start = source.indexOf('<template v-else-if="isStartConfirmation">')
  const end = source.indexOf('<template v-else-if="modalType === \'assign-order\'">', start)
  const summary = source.slice(start, end)
  assert.match(summary, /draft.plate/)
  assert.match(summary, /draft.job/)
  assert.match(summary, /draft.owner/)
  assert.match(summary, /draft.workshop/)
  assert.doesNotMatch(summary, /<input|<select|<textarea/)
  assert.match(source, /v-if="draft.status === 'waiting'"/)
})

test("start, wait and resume only change the OT when the user confirms", () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: "a", companyId: "c", patente: "AAAA11", odometro: "1000" }]),
      companies: ref([]), route: { params: { empresaId: "c" }, query: {} },
    }))
    const { order } = createMaintenanceTestFixture(module)
    assert.ok(order)
    module.openWorkOrderActionModal(order.id, "assign-order", "in-progress")
    assert.equal(module.modalDraft.value.transitionLabel, "Iniciar trabajo")
    assert.equal(module.selectedOrder.value.status, "scheduled")
    module.closeMaintenanceModal()
    assert.equal(module.selectedOrder.value.status, "scheduled")
    module.openWorkOrderActionModal(order.id, "assign-order", "in-progress")
    module.submitMaintenanceModal()
    assert.equal(module.selectedOrder.value.status, "in-progress")
    module.openWorkOrderActionModal(order.id, "assign-order", "waiting")
    assert.equal(module.modalDraft.value.transitionLabel, "Poner en espera")
    module.modalDraft.value.waitingReason = ""
    module.submitMaintenanceModal()
    assert.equal(module.selectedOrder.value.status, "in-progress")
    module.modalDraft.value.waitingReason = "Faltan repuestos"
    module.submitMaintenanceModal()
    assert.equal(module.selectedOrder.value.status, "waiting")
    module.openWorkOrderActionModal(order.id, "assign-order", "in-progress")
    assert.equal(module.modalDraft.value.transitionLabel, "Reanudar trabajo")
    module.submitMaintenanceModal()
    assert.equal(module.selectedOrder.value.status, "in-progress")
  } finally { scope.stop() }
})
