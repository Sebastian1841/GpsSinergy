import { licenseState } from '../../utils/maintenance/driverLicenseUtils.js'

export const buildDriverLicenseAlerts = (drivers, today) => drivers.flatMap((driver) => {
  const warningDays = driver.warningDays ?? 30
  const state = licenseState(driver.expiresAt, today, warningDays)
  if (state.key !== 'soon' && state.key !== 'expired') return []
  const milestone = state.days < 0 ? 'expired' : [0, 7, 15, warningDays].filter((days) => days <= warningDays).sort((a, b) => a - b).find((days) => state.days <= days)
  return [{
    key: JSON.stringify([driver.id, driver.licenseId || driver.createdAt, driver.expiresAt, warningDays, milestone]),
    driverId: driver.id, name: driver.name, days: state.days, status: state.key,
  }]
})

export const createDriverLicenseAlertTracker = ({ storage, companyId, userId }) => {
  const key = `sinergy-driver-license-alerts:${encodeURIComponent(companyId)}:${encodeURIComponent(userId)}`
  const readState = () => {
    if (!storage) throw new Error('No se pueden guardar las alertas revisadas en este navegador.')
    const raw = storage.getItem(key)
    const stored = raw === null ? { version: 2, shown: [], reviewed: [] } : JSON.parse(raw)
    const state = Array.isArray(stored) ? { version: 2, shown: stored, reviewed: [] } : stored
    if (!state || state.version !== 2 || [state.shown, state.reviewed].some((items) => !Array.isArray(items) || items.some((item) => typeof item !== 'string')))
      throw new Error('No se pudo leer el registro de avisos de licencias.')
    return { shown: new Set(state.shown), reviewed: new Set(state.reviewed) }
  }
  const persist = (state) => storage.setItem(key, JSON.stringify({ version: 2, shown: [...state.shown], reviewed: [...state.reviewed] }))
  return {
    pending(drivers, today) {
      const state = readState()
      return buildDriverLicenseAlerts(drivers, today).filter((alert) => !state.reviewed.has(alert.key))
    },
    unshown(drivers, today) {
      const state = readState()
      return buildDriverLicenseAlerts(drivers, today).filter((alert) => !state.shown.has(alert.key))
    },
    markShown(alerts) {
      const state = readState()
      alerts.forEach((alert) => state.shown.add(alert.key))
      persist(state)
    },
    acknowledge(alerts) {
      const state = readState()
      alerts.forEach((alert) => { state.shown.add(alert.key); state.reviewed.add(alert.key) })
      persist(state)
    },
  }
}
