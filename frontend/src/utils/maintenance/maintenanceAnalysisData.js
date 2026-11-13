import { parseMaintenanceOrderDate, summarizeMaintenanceOrders } from './maintenanceOrderSummary.js'
import { maintenanceDay } from './maintenanceHistoricalReading.js'

export const parseMaintenanceAnalysisDate = parseMaintenanceOrderDate

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
      order,
      closedInstant: /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(String(order.closedAt)) ? new Date(order.closedAt) : null,
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

export const aggregateMaintenanceAnalysisPeriod = (index, start, end = new Date()) => {
  const vehicles = new Map()
  const composition = { labor: 0, parts: 0, other: 0 }
  const monthlyCosts = new Map()
  const orders = []
  const endDay = parseMaintenanceAnalysisDate(maintenanceDay(end))
  for (const order of index.completed) {
    if (order.closed < start || order.closed > endDay || (order.closedInstant && order.closedInstant > end)) continue
    orders.push(order.order)
    const month = maintenanceAnalysisMonthKey(order.closed)
    monthlyCosts.set(month, (monthlyCosts.get(month) || 0) + order.cost)
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
  return { vehicles, composition, monthlyCosts, statistics: summarizeMaintenanceOrders(orders, end) }
}

export const maintenanceAnalysisCostCeiling = (maximum) => {
  if (!(maximum > 0)) return 1
  const power = 10 ** Math.floor(Math.log10(maximum))
  return [1, 2, 3, 5, 10].find((step) => step * power >= maximum) * power
}

export const buildMaintenanceCycleRanking = (plans, limit = 5) => {
  const vehicles = new Map()
  const statusRank = { overdue: 0, due: 1, current: 2 }
  for (const plan of plans) {
    const progress = plan.cycleProgressPercent
    if (!Object.hasOwn(statusRank, plan.status) || typeof progress !== 'number' || !Number.isFinite(progress) || plan.remainingValue == null) continue
    const row = { ...plan, id: plan.vehicleId || plan.assetId, maintenance: plan.nextJob || plan.name, remaining: plan.remainingLabel || 'Sin lectura', estimate: `${Math.round(progress)}% del ciclo`, cycleProgressPercent: progress, percent: Math.min(100, Math.max(0, progress)), tone: plan.status === 'overdue' ? 'critical' : plan.status === 'due' ? 'warning' : 'good' }
    const previous = vehicles.get(String(row.id))
    if (!previous || statusRank[row.status] < statusRank[previous.status] || (row.status === previous.status && progress > previous.cycleProgressPercent)) vehicles.set(String(row.id), row)
  }
  return [...vehicles.values()].sort((a, b) => statusRank[a.status] - statusRank[b.status] || b.cycleProgressPercent - a.cycleProgressPercent).slice(0, limit)
}

export const buildMaintenanceCalendarBuckets = (plans) => {
  const dated = plans.filter((plan) => plan.readingSourceLabel === 'Fecha/Hora' && typeof plan.remainingValue === 'number' && Number.isFinite(plan.remainingValue) && ['overdue', 'due', 'current'].includes(plan.status))
  const definitions = [{ label: 'Vencidas', min: -Infinity, max: 0, status: 'overdue' }, { label: '1 - 15 dias', min: 1, max: 15, status: 'due' }, { label: '16 - 30 dias', min: 16, max: 30, status: 'due' }, { label: '31 - 60 dias', min: 31, max: 60, status: 'due' }, { label: '61 - 90 dias', min: 61, max: 90, status: 'due' }]
  const rows = definitions.map((definition) => ({ ...definition, count: dated.filter((plan) => plan.remainingValue >= definition.min && plan.remainingValue <= definition.max).length }))
  const maximum = Math.max(1, ...rows.map((row) => row.count))
  return rows.map((row) => ({ ...row, percent: row.count / maximum * 100 }))
}
