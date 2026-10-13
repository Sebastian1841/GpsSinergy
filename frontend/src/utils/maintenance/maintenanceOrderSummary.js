export const parseMaintenanceOrderDate = (value) => {
  if (!value) return null
  const text = String(value).trim()
  const parts = text.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/)
  const isoParts = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const date = parts
    ? new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]))
    : isoParts
      ? new Date(Number(isoParts[1]), Number(isoParts[2]) - 1, Number(isoParts[3]))
      : new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

export const parseMaintenanceOrderCost = (value) => Number(String(value || "0").replace(/[^0-9]/g, "")) || 0

export const summarizeMaintenanceOrders = (orders, now = new Date()) => {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const counts = new Map()
  let estimatedCost = 0
  let actualCost = 0
  let openCount = 0
  let overdueCount = 0
  let durationCount = 0
  let durationDays = 0
  let measuredCount = 0
  let onTimeCount = 0
  for (const order of orders) {
    const status = order.status
    counts.set(status, (counts.get(status) || 0) + 1)
    estimatedCost += parseMaintenanceOrderCost(order.estimatedCost)
    actualCost += parseMaintenanceOrderCost(order.actualCost)
    const open = ["scheduled", "waiting", "in-progress"].includes(status)
    if (!open && status !== "finished") continue
    const scheduled = parseMaintenanceOrderDate(order.scheduledDate)
    if (open) {
      openCount += 1
      if (scheduled && scheduled < today) overdueCount += 1
      continue
    }
    const closed = parseMaintenanceOrderDate(order.closedAt)
    const created = parseMaintenanceOrderDate(order.createdAt)
    if (closed && created && closed >= created) {
      durationDays += (closed - created) / 86400000
      durationCount += 1
    }
    if (closed && scheduled) {
      measuredCount += 1
      scheduled.setHours(23, 59, 59, 999)
      if (closed <= scheduled) onTimeCount += 1
    }
  }
  return {
    counts, estimatedCost, actualCost, openCount, overdueCount,
    averageClosingDays: durationCount ? durationDays / durationCount : null,
    onTimeRate: measuredCount ? Math.round(onTimeCount / measuredCount * 100) : null,
  }
}
