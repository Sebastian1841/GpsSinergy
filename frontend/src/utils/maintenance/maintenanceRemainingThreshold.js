import { maintenanceDay } from './maintenanceHistoricalReading.js'

export const maintenanceRemainingThreshold = (draft, currentReading, today = maintenanceDay()) => {
  const { intervalValue, lastReading, readingSourceLabel } = draft
  if ([intervalValue, lastReading].some((value) => value == null || String(value).trim() === '')) return ''
  const interval = Number(intervalValue)
  if (!Number.isFinite(interval) || interval <= 0) return ''
  let remaining
  let unit
  if (readingSourceLabel === 'Fecha/Hora') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastReading)) return ''
    const date = new Date(`${lastReading}T00:00:00Z`)
    if (!Number.isFinite(date.getTime())) return ''
    date.setUTCDate(date.getUTCDate() + interval)
    remaining = Math.round((date.getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000)
    unit = 'dias'
  } else {
    if (currentReading == null || String(currentReading).trim() === '' || !Number.isFinite(Number(currentReading))) return 'Sin lectura actual disponible'
    const last = Number(lastReading)
    if (!Number.isFinite(last) || last < 0) return ''
    remaining = last + interval - Number(currentReading)
    unit = readingSourceLabel === 'Horometro' ? 'horas' : 'km'
  }
  if (!Number.isFinite(remaining)) return ''
  const amount = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(Math.abs(remaining))
  if (remaining === 0) return 'Vence ahora'
  return remaining > 0 ? `Faltan ${amount} ${unit}` : `Vencida por ${amount} ${unit}`
}
