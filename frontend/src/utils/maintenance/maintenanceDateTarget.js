const calendarTime = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date.getTime() : null
}

export const maintenanceTargetDate = (reference, interval) => {
  const start = calendarTime(reference)
  if (start == null || String(interval ?? '').trim() === '' || !Number.isFinite(Number(interval)) || Number(interval) <= 0) return ''
  const result = new Date(start + Number(interval) * 86400000)
  return Number.isFinite(result.getTime()) ? result.toISOString().slice(0, 10) : ''
}

export const maintenanceDateInterval = (reference, target) => {
  const start = calendarTime(reference)
  const end = calendarTime(target)
  return start == null || end == null ? '' : String(Math.round((end - start) / 86400000))
}
