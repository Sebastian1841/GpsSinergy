import { normalizeText } from "./maintenanceFormatUtils.js"

const scopeKey = (companyId, plate) => JSON.stringify([companyId, plate])
const append = (map, key, entry) => {
  if (!map.has(key)) map.set(key, [])
  map.get(key).push(entry)
}

export const buildMaintenancePlanIndex = (plans) => {
  const byVehicle = new Map()
  const byCompanyPlate = new Map()
  plans.forEach((plan, position) => {
    const entry = { plan, position }
    if (plan.vehicleId) append(byVehicle, String(plan.vehicleId), entry)
    const companyId = String(plan.companyId || "")
    const plate = normalizeText(plan.plate)
    if (companyId && plate) append(byCompanyPlate, scopeKey(companyId, plate), entry)
  })
  return { byVehicle, byCompanyPlate, matches: new Map() }
}

export const findMaintenancePlansForVehicle = (index, vehicle, routeCompanyId = "") => {
  if (!vehicle) return []
  const vehicleId = vehicle.id ? String(vehicle.id) : ""
  const companyId = String(vehicle.companyId || routeCompanyId || "")
  const plate = normalizeText(vehicle.plate)
  const key = JSON.stringify([vehicleId, companyId, plate])
  if (index.matches.has(key)) return index.matches.get(key)
  const byId = index.byVehicle.get(vehicleId) || []
  const byScope = companyId && plate ? index.byCompanyPlate.get(scopeKey(companyId, plate)) || [] : []
  const result = []
  let first = 0
  let second = 0
  // Merge both matching rules in source order; a plan matching both appears once.
  while (first < byId.length || second < byScope.length) {
    const idEntry = byId[first]
    const scopeEntry = byScope[second]
    if (!scopeEntry || (idEntry && idEntry.position < scopeEntry.position)) {
      result.push(idEntry.plan)
      first += 1
    } else if (!idEntry || scopeEntry.position < idEntry.position) {
      result.push(scopeEntry.plan)
      second += 1
    } else {
      result.push(idEntry.plan)
      first += 1
      second += 1
    }
  }
  index.matches.set(key, result)
  return result
}
