import { formatCurrency, parseNumber } from "./maintenanceFormatUtils.js"

export const groupMaintenanceOrderCosts = (rows) => {
  const totals = new Map()
  for (const row of rows) {
    let cost = totals.get(row.orderId)
    if (!cost) {
      cost = { labor: 0, parts: 0, other: 0, total: 0 }
      totals.set(row.orderId, cost)
    }
    cost.labor += parseNumber(row.labor)
    cost.parts += parseNumber(row.parts)
    cost.other += parseNumber(row.other)
    cost.total += parseNumber(row.total)
  }
  return totals
}

export const applyMaintenanceOrderCosts = (order, totals) => {
  const cost = totals.get(order.id)
  const labor = cost?.labor || order.demoLaborCost || 0
  const parts = cost?.parts || order.demoPartsCost || 0
  const other = cost?.other || order.demoOtherCost || 0
  return {
    ...order,
    actualCost: formatCurrency(cost?.total || labor + parts + other),
    laborCost: formatCurrency(labor),
    partsCost: formatCurrency(parts),
    otherCost: formatCurrency(other),
  }
}
