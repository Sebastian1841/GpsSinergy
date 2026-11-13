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

test("start and resume are direct, while waiting requires a reason and confirmation", () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: "a", companyId: "c", patente: "AAAA11", odometro: "1000" }]),
      companies: ref([]), route: { params: { empresaId: "c" }, query: {} },
    }))
    const { order } = createMaintenanceTestFixture(module)
    assert.ok(order)
    module.openWorkOrderActionModal(order.id, "assign-order", "in-progress")
    assert.notEqual(module.activeMaintenanceModal.value, 'assign-order')
    assert.equal(module.selectedOrder.value.status, "in-progress")
    const startedAt = module.selectedOrder.value.startedAt
    module.openWorkOrderActionModal(order.id, 'delete-order')
    assert.notEqual(module.activeMaintenanceModal.value, 'cancel-order')
    assert.ok(module.workOrders.value.some(row => row.id === order.id))
    const job = module.selectedOrder.value.job
    module.openWorkOrderActionModal(order.id, 'reset-order')
    assert.equal(module.selectedOrder.value.status, 'scheduled')
    assert.equal(module.selectedOrder.value.startedAt, '')
    assert.equal(module.selectedOrder.value.job, job)
    assert.equal(module.selectedOrder.value.id, order.id)
    module.openWorkOrderActionModal(order.id, 'assign-order', 'in-progress')
    assert.equal(module.selectedOrder.value.status, 'in-progress')
    const restartedAt = module.selectedOrder.value.startedAt
    module.openWorkOrderActionModal(order.id, 'assign-order', 'in-progress')
    assert.ok(startedAt)
    assert.equal(module.selectedOrder.value.startedAt, restartedAt)
    module.openWorkOrderActionModal(order.id, "assign-order", "waiting")
    assert.equal(module.modalDraft.value.transitionLabel, "Poner en espera")
    module.modalDraft.value.waitingReason = ""
    module.submitMaintenanceModal()
    assert.equal(module.selectedOrder.value.status, "in-progress")
    assert.equal(module.activeMaintenanceModal.value, 'assign-order')
    module.modalDraft.value.waitingReason = "Faltan repuestos"
    module.submitMaintenanceModal()
    assert.equal(module.selectedOrder.value.status, "waiting")
    module.openWorkOrderActionModal(order.id, "assign-order", "in-progress")
    assert.notEqual(module.activeMaintenanceModal.value, 'assign-order')
    assert.equal(module.selectedOrder.value.status, "in-progress")
  } finally { scope.stop() }
})
