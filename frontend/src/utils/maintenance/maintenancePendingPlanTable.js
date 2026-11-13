import { maintenanceTargetDate } from './maintenanceDateTarget.js'

export const pendingPlanDueLabel = (plan) => {
  const label = plan.nextLabel || plan.nextDateLabel || '-'
  if (plan.readingSourceLabel !== 'Fecha/Hora') return label
  const target = maintenanceTargetDate(plan.lastReading, plan.intervalValue)
  if (target) return target.split('-').reverse().join('-')
  const calendar = String(label).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (calendar) return `${calendar[3]}-${calendar[2]}-${calendar[1]}`
  const legacy = String(label).match(/^(\d{2})[/-](\d{2})[/-](\d{2}|\d{4})$/)
  if (legacy) return `${legacy[1]}-${legacy[2]}-${legacy[3].length === 2 ? `20${legacy[3]}` : legacy[3]}`
  return label
}
