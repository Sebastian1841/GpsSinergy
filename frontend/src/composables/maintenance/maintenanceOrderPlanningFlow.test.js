import test from "node:test"
import assert from "node:assert/strict"
import { effectScope, ref } from "vue"
import { useMaintenanceModule } from "./useMaintenanceModule.js"
import { createMaintenanceTestFixture } from './maintenanceTestFixture.js'

test("unified planning saves dates and assignment without changing execution status or losing detail context", () => {
  const scope = effectScope()
  try {
    const module = scope.run(() => useMaintenanceModule({
      assets: ref([{ id: "a", companyId: "c", patente: "AAAA11", odometro: "1000" }]),
      companies: ref([]), route: { params: { empresaId: "c" }, query: {} },
    }))
    const { order: createdOrder } = createMaintenanceTestFixture(module)
    const id = createdOrder.id
    for (const status of ["scheduled", "in-progress", "waiting"]) {
      if (status !== "scheduled") {
        module.openWorkOrderActionModal(id, "assign-order", status)
        module.modalDraft.value.waitingReason = "Repuestos"
        module.submitMaintenanceModal()
      }
      const before = module.workOrders.value.find((item) => item.id === id)
      module.openWorkOrderActionModal(id, "reprogram-order", "", "order-detail")
      Object.assign(module.modalDraft.value, { plannedStartDate: "2026-11-06", scheduledDate: "2026-11-08", scheduledTime: "11:30", owner: "Ana", workshop: "Taller nuevo", priority: "Alta" })
      module.submitMaintenanceModal()
      assert.equal(module.activeMaintenanceModal.value, "order-detail")
      const order = module.workOrders.value.find((item) => item.id === id)
      assert.equal(order.status, status)
      assert.equal(order.startedAt, before.startedAt)
      assert.equal(order.waitingReason, before.waitingReason)
      for (const [key, value] of Object.entries({ plannedStartDate: "2026-11-06", scheduledDate: "2026-11-08", scheduledTime: "11:30", owner: "Ana", workshop: "Taller nuevo", priority: "Alta" })) assert.equal(order[key], value)
      assert.equal(order.audit.at(-1).action, "Planificacion actualizada")
      module.openWorkOrderActionModal(id, "reprogram-order", "", "order-detail")
      module.modalDraft.value.owner = "No guardar"
      module.closeMaintenanceModal()
      assert.equal(module.modalDraft.value.owner, "Ana")
    }
    module.openWorkOrderActionModal(id, "reprogram-order", "", "order-detail")
    module.modalDraft.value.scheduledDate = "2026-11-01"
    module.submitMaintenanceModal()
    assert.equal(module.activeMaintenanceModal.value, "reprogram-order")
    assert.match(module.modalActionMessage.value, /posterior/)
  } finally { scope.stop() }
})
