import { parseNumber } from './maintenanceFormatUtils.js'

export const readMaintenanceHours = (asset = {}) => {
  for (const key of ['engineHours', 'hourMeterHours', 'horometroTotal', 'totalHourmeter', 'horometro']) {
    const raw = asset[key]
    if (raw == null || String(raw).trim() === '' || !/\d/.test(String(raw))) continue
    const numeric = typeof raw === 'number' ? raw
      : ['engineHours', 'hourMeterHours'].includes(key) && /^-?\d+(\.\d+)?$/.test(String(raw).trim())
        ? Number(raw) : parseNumber(raw)
    if (Number.isFinite(numeric) && numeric >= 0) return numeric
  }
  return null
}
