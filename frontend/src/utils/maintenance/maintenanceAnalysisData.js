export const parseMaintenanceAnalysisDate = (value) => {
  if (!value) return null
  const text = String(value).split(",")[0].trim()
  const localDate = text.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  const date = localDate
    ? new Date(Number(localDate[3]), Number(localDate[2]) - 1, Number(localDate[1]))
    : new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

const money = (value) => Number(String(value || 0).replace(/[^0-9]/g, "")) || 0
export const maintenanceAnalysisMonthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`

export const buildMaintenanceAnalysisIndex = (orders) => {
  const completed = []
  const monthlyCosts = new Map()
  for (const order of orders) {
    if (order.status !== "finished") continue
    const closed = parseMaintenanceAnalysisDate(order.closedAt)
    if (!closed) continue
    const deadline = parseMaintenanceAnalysisDate(order.scheduledDate)
    if (deadline) deadline.setHours(23, 59, 59, 999)
    const cost = money(order.actualCost)
    const month = maintenanceAnalysisMonthKey(closed)
    monthlyCosts.set(month, (monthlyCosts.get(month) || 0) + cost)
    completed.push({
      vehicleId: String(order.vehicleId),
      closed,
      deadline,
      cost,
      labor: money(order.laborCost),
      parts: money(order.partsCost),
      other: money(order.otherCost),
    })
  }
  return { completed, monthlyCosts }
}

export const aggregateMaintenanceAnalysisPeriod = (index, start) => {
  const vehicles = new Map()
  const composition = { labor: 0, parts: 0, other: 0 }
  for (const order of index.completed) {
    if (order.closed < start) continue
    let vehicle = vehicles.get(order.vehicleId)
    if (!vehicle) {
      vehicle = { cost: 0, orders: 0, measurable: 0, onTime: 0, lastClosed: null }
      vehicles.set(order.vehicleId, vehicle)
    }
    vehicle.cost += order.cost
    vehicle.orders += 1
    if (!vehicle.lastClosed || order.closed > vehicle.lastClosed) vehicle.lastClosed = order.closed
    if (order.deadline) {
      vehicle.measurable += 1
      if (order.closed <= order.deadline) vehicle.onTime += 1
    }
    composition.labor += order.labor
    composition.parts += order.parts
    composition.other += order.other
  }
  return { vehicles, composition }
}
