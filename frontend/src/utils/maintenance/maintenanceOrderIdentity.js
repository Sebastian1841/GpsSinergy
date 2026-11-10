export const baseMaintenanceOrderId = (vehicle) =>
  `OT-BASE:${encodeURIComponent(String(vehicle.companyId || ""))}:${encodeURIComponent(String(vehicle.id))}`

export const getLegacyMaintenanceOrderReview = (state, companyId) => {
  const rows = new Map()
  const add = (id, record, source) => {
    if (!/^OT-\d+$/.test(String(id)) || Number(String(id).slice(3)) < 250 || Number(String(id).slice(3)) >= 900) return
    if (record?.companyId && String(record.companyId) !== String(companyId)) return
    if (!rows.has(id)) rows.set(id, { id, sources: new Set() })
    rows.get(id).sources.add(source)
  }
  for (const [id, record] of Object.entries(state.workOrderOverrides || {})) add(id, record, "Datos de OT")
  for (const row of state.extraCostRows || []) add(row.orderId, row, "Registro de costo")
  for (const record of Object.values(state.maintenancePlanOrderStates || {})) add(record?.orderId, record, "Estado de plan")
  // Only technical references are exposed when the vehicle/company is unverified.
  return [...rows.values()].map(({ id, sources }) => ({ id, sources: [...sources].join(", ") }))
}

// Old positional IDs are migrated only with a stored vehicle reference, never by row order.
export const migrateLegacyMaintenanceOrders = (state, vehicles) => {
  const vehicleById = new Map(vehicles.map((vehicle) => [String(vehicle.id), vehicle]))
  const bindings = new Map()
  const legacy = (id) =>
    /^OT-\d+$/.test(id) && Number(id.slice(3)) >= 250 && Number(id.slice(3)) < 900
  const bind = (orderId, vehicleId) => {
    if (!legacy(orderId) || !vehicleById.has(String(vehicleId))) return
    const id = baseMaintenanceOrderId(vehicleById.get(String(vehicleId)))
    if (!bindings.has(orderId)) bindings.set(orderId, new Set())
    bindings.get(orderId).add(id)
  }
  for (const [id, patch] of Object.entries(state.workOrderOverrides || {}))
    bind(id, patch.vehicleId)
  for (const row of state.extraCostRows || []) bind(row.orderId, row.vehicleId)
  for (const [planId, value] of Object.entries(state.maintenancePlanOrderStates || {})) {
    for (const vehicle of vehicles) {
      if (planId === `base-${vehicle.id}` || planId.startsWith(`base-${vehicle.id}-`)) {
        bind(value?.orderId, vehicle.id)
      }
    }
  }
  const resolve = (id) => (bindings.get(id)?.size === 1 ? [...bindings.get(id)][0] : id)
  let unresolved = 0
  const overrides = { ...(state.workOrderOverrides || {}) }
  for (const [id, patch] of Object.entries(overrides)) {
    if (!legacy(id)) continue
    const target = resolve(id)
    if (target === id || overrides[target]) {
      unresolved++
      continue
    }
    overrides[target] = { ...patch, id: target }
    delete overrides[id]
  }
  const costs = (state.extraCostRows || []).map((row) => {
    const orderId = resolve(row.orderId)
    if (legacy(orderId)) unresolved++
    return { ...row, orderId }
  })
  const planStates = Object.fromEntries(
    Object.entries(state.maintenancePlanOrderStates || {}).map(([id, value]) => [
      id,
      value && typeof value === "object" ? { ...value, orderId: resolve(value.orderId) } : value,
    ]),
  )
  return {
    workOrderOverrides: overrides,
    extraCostRows: costs,
    maintenancePlanOrderStates: planStates,
    unresolved,
  }
}
