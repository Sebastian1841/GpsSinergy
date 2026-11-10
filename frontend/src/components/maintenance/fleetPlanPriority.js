const priority = { overdue: 0, due: 1, 'renewal-pending': 2, workshop: 3, 'no-reading': 4, current: 5, unconfigured: 6 }
const rank = (plan) => priority[plan.orderState === 'pending-renewal' ? 'renewal-pending' : plan.status] ?? 7
const hasOpenOrder = (plan) => ['scheduled', 'in-progress', 'waiting'].includes(plan.order?.status)

export const sortFleetPlansByPriority = (plans) => [...plans].sort((first, second) => {
  const difference = rank(first) - rank(second)
  if (difference) return difference
  if (rank(first) <= 2) return Number(hasOpenOrder(first)) - Number(hasOpenOrder(second))
  return 0
})
