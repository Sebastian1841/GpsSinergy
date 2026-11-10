import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { effectScope, ref } from "vue"
import { useMaintenanceModule } from "../../composables/maintenance/useMaintenanceModule.js"
import { createMaintenanceTestFixture } from '../../composables/maintenance/maintenanceTestFixture.js'

test("order rows expose only view and next action; secondary actions live in detail", () => {
  const table = readFileSync(new URL("./MaintenanceWorkOrdersTab.vue", import.meta.url), "utf8")
  assert.doesNotMatch(table, /more-actions-button|order-secondary-actions|toggleActionMenu|runSecondaryOrderAction/)
  assert.match(table, /runNextOrderAction\(order\)/)
  assert.match(table, /order.id, 'order-detail'/)
  const modal = readFileSync(new URL("./MaintenanceActionModal.vue", import.meta.url), "utf8")
  for (const text of ["Editar planificacion", "Poner en espera", "Agregar costos", "Cancelar OT"]) assert.ok(modal.includes(text))
  assert.doesNotMatch(modal, />Reprogramar<|>Editar asignacion</)
  assert.match(modal, /v-if="\['finished', 'cancelled'\].includes\(draft.status\)" class="order-detail-result"/)
})

test("detail operations return to the same OT on cancel and save, without changing table-origin navigation", () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: "a", companyId: "c", patente: "AAAA11", odometro: "1000" }]),
      companies: ref([]), route: { params: { empresaId: "c" }, query: {} },
    }))
    const { order } = createMaintenanceTestFixture(module)
    for (const modal of ["reprogram-order", "assign-order", "cancel-order"]) {
      module.openWorkOrderActionModal(order.id, modal, "", "order-detail")
      module.closeMaintenanceModal()
      assert.equal(module.activeMaintenanceModal.value, "order-detail")
      assert.equal(module.modalDraft.value.orderId, order.id)
      assert.equal(module.selectedOrder.value.status, "scheduled")
    }
    module.openWorkOrderCostModal(order.id, "order-detail")
    module.closeMaintenanceModal()
    assert.equal(module.activeMaintenanceModal.value, "order-detail")
    module.openWorkOrderActionModal(order.id, "assign-order", "", "order-detail")
    module.modalDraft.value.owner = "Nuevo responsable"
    module.submitMaintenanceModal()
    assert.equal(module.activeMaintenanceModal.value, "order-detail")
    assert.equal(module.modalDraft.value.orderId, order.id)
    assert.equal(module.modalDraft.value.owner, "Nuevo responsable")
    module.closeMaintenanceModal()
    assert.equal(module.activeMaintenanceModal.value, "")
    module.openWorkOrderActionModal(order.id, "assign-order", "in-progress")
    module.closeMaintenanceModal()
    assert.equal(module.activeMaintenanceModal.value, "")
  } finally { scope.stop() }
})
