// Explicit test setup: production must not generate plans or orders on its own.
export const createMaintenanceTestFixture = (module, vehicleId = 'a', withOrder = true) => {
  const name = `Plan prueba ${vehicleId}`
  module.openMaintenanceModal('maintenance')
  Object.assign(module.modalDraft.value, {
    vehicleId, name, type: name, readingSourceLabel: 'Odometro',
    lastReading: '1000', intervalValue: '1000', alertValue: '100',
  })
  module.submitMaintenanceModal()
  const vehicle = module.maintenanceItems.value.find((item) => item.id === vehicleId)
  const plan = module.getVehicleMaintenancePlans(vehicle).find((item) => item.name === name)
  if (!withOrder) return { plan }
  module.openCreateWorkOrder(vehicleId, plan.id, plan.name)
  module.submitMaintenanceModal()
  return { plan, order: module.workOrders.value.find((item) => item.maintenancePlanId === plan.id) }
}
