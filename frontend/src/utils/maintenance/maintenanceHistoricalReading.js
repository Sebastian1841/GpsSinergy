import { parseNumber } from './maintenanceFormatUtils.js'

export const maintenanceDay = (value = new Date()) => {
  const date = new Date(value)
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' }).format(date) : ''
}

export const findMaintenanceHistoricalReading = (reports, day, source) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '') || day > maintenanceDay()) return null
  const fields = source === 'Horometro' ? ['hourMeterHours', 'horometro'] : ['odometer', 'odometro']
  return reports.reduce((latest, report) => {
    const at = report.timestamp
    if (!at || maintenanceDay(at) !== day) return latest
    const raw = fields.map((field) => report.recordedMaintenanceReadings?.[field]).find((value) => value != null && String(value).trim() !== '')
    if (raw == null || !/\d/.test(String(raw))) return latest
    const value = typeof raw === 'number' ? raw : parseNumber(raw)
    if (!Number.isFinite(value) || value < 0) return latest
    return !latest || new Date(at) > new Date(latest.at) ? { value, at } : latest
  }, null)
}
