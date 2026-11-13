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
  for (const text of ["Editar planificacion", "Poner en espera", "Agregar costos", "Eliminar OT", "Anular OT"]) assert.ok(modal.includes(text))
  assert.doesNotMatch(modal, />Reprogramar<|>Editar asignacion</)
  assert.match(modal, /v-if="\['finished', 'cancelled'\].includes\(draft.status\)" class="order-detail-result"/)
  assert.match(modal, /v-if="modalType === 'order-detail' && draft.status === 'scheduled' && !draft.startedAt"/)
  assert.match(modal, /class="order-detail-start"/)
})

test('starting from detail keeps the same order open and prevents a second start', () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: 'a', companyId: 'c', patente: 'AAAA11', odometro: '1000' }]),
      companies: ref([]), route: { params: { empresaId: 'c' }, query: {} },
    }))
    const { order } = createMaintenanceTestFixture(module)
    module.openWorkOrderActionModal(order.id, 'order-detail')
    module.openWorkOrderActionModal(order.id, 'assign-order', 'in-progress', 'order-detail')
    assert.equal(module.activeMaintenanceModal.value, 'order-detail')
    assert.equal(module.modalDraft.value.orderId, order.id)
    assert.equal(module.modalDraft.value.status, 'in-progress')
    assert.ok(module.modalDraft.value.startedAt)
    const startedAt = module.modalDraft.value.startedAt
    module.openWorkOrderActionModal(order.id, 'assign-order', 'in-progress', 'order-detail')
    assert.equal(module.modalDraft.value.startedAt, startedAt)
  } finally { scope.stop() }
})

test('deleting an unused order hides it without reusing its number', () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: 'a', companyId: 'c', patente: 'AAAA11', odometro: '1000' }]),
      companies: ref([]), route: { params: { empresaId: 'c' }, query: {} },
    }))
    const { order, plan } = createMaintenanceTestFixture(module)
    module.openWorkOrderActionModal(order.id, 'order-detail')
    assert.equal(module.modalDraft.value.canDeleteOrder, true)
    module.openWorkOrderActionModal(order.id, 'delete-order')
    assert.equal(module.modalDraft.value.deleteMode, true)
    module.submitMaintenanceModal()
    assert.ok(module.workOrders.value.some(row => row.id === order.id))
    module.modalDraft.value.cancelReason = 'Creada por error'
    module.submitMaintenanceModal()
    assert.equal(module.workOrders.value.some(row => row.id === order.id), false)
    module.openCreateWorkOrder('a', plan.id)
    assert.notEqual(module.modalDraft.value.orderId, order.id)
  } finally { scope.stop() }
})

test('cancelling requires an explicit reason and identifies the selected order', () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: 'a', companyId: 'c', patente: 'AAAA11', odometro: '1000' }]),
      companies: ref([]), route: { params: { empresaId: 'c' }, query: {} },
    }))
    const { order } = createMaintenanceTestFixture(module)
    module.openWorkOrderActionModal(order.id, 'cancel-order')
    assert.equal(module.modalDraft.value.cancelReason, '')
    assert.equal(module.modalDraft.value.orderId, order.id)
    module.submitMaintenanceModal()
    assert.equal(module.selectedOrder.value.status, 'scheduled')
    module.modalDraft.value.cancelReason = 'Trabajo no requerido'
    module.submitMaintenanceModal()
    assert.equal(module.workOrders.value.some(row => row.id === order.id), false)
    assert.equal(module.activeMaintenanceModal.value, '')
  } finally { scope.stop() }
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
