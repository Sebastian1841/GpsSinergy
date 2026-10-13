const defaultNameKey = (name) => String(name || "").toLowerCase()
const defaultPlanKey = (order) => String(order.maintenancePlanId || "")

export const buildFleetOrderIndex = (orders, {
  normalizeName = defaultNameKey,
  planKey = defaultPlanKey,
} = {}) => {
  const vehicles = new Map()
  orders.forEach((order, position) => {
    if (["finished", "cancelled"].includes(order.status)) return
    const vehicleId = String(order.vehicleId)
    if (!vehicles.has(vehicleId)) {
      vehicles.set(vehicleId, { plans: new Map(), names: new Map() })
    }
    const vehicle = vehicles.get(vehicleId)
    const planId = planKey(order)
    const name = normalizeName(order.job)
    const entry = { order, position }
    if (!vehicle.plans.has(planId)) vehicle.plans.set(planId, entry)
    if (!vehicle.names.has(name)) vehicle.names.set(name, entry)
  })
  return vehicles
}

export const findFleetOpenOrder = (index, vehicleId, planId, name, {
  normalizeName = defaultNameKey,
} = {}) => {
  const vehicle = index.get(String(vehicleId))
  if (!vehicle) return undefined
  const byPlan = planId == null ? undefined : vehicle.plans.get(String(planId))
  const byName = vehicle.names.get(normalizeName(name))
  if (!byPlan) return byName?.order
  if (!byName) return byPlan.order
  return byPlan.position < byName.position ? byPlan.order : byName.order
}
