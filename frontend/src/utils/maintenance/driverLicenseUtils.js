import { formatCompanyRut } from "../companies/companyRut.js"
import { normalizeDriverLicenseNotifications } from './driverLicenseNotifications.js'

export const LICENSE_CLASSES = ["A1", "A2", "A3", "A4", "A5", "B", "C", "D", "E", "F"]
export const DRIVER_MANAGEMENT_OPTIONS = [
  { value: "not_contacted", label: "No se logro contactar" },
  { value: "notified", label: "Avisado de su vencimiento" },
  { value: "appointment", label: "Tiene hora para renovar" },
  { value: "processing", label: "Renovacion en tramite" },
]
export const driverManagementLabel = (value) =>
  DRIVER_MANAGEMENT_OPTIONS.find((option) => option.value === value)?.label ||
  "Sin gestion registrada"
export const currentDriverManagements = (row) =>
  (row.managements || []).filter((entry) => entry.licenseId === (row.licenseId || row.createdAt))
export const driverManagementStatus = (row, today = driverToday()) => {
  const entry = currentDriverManagements(row).at(-1)
  const labels = { not_contacted: 'Sin respuesta', notified: 'Avisado', appointment: 'Fecha agendada', processing: 'En tramite' }
  const needsFollowUp = entry?.result === 'appointment' && validLicenseDate(entry.appointmentDate) && entry.appointmentDate < today
  return { result: entry?.result || '', label: needsFollowUp ? 'Confirmar resultado' : labels[entry?.result] || 'Sin gestionar', appointmentDate: entry?.appointmentDate || '', needsFollowUp, entry }
}
const calendar = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Santiago",
})
export const driverToday = (now = new Date()) => {
  const parts = Object.fromEntries(
    calendar.formatToParts(new Date(now)).map(({ type, value }) => [type, value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}
export const validLicenseDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value || "") &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value
export const licenseState = (expiresAt, today = driverToday(), warningDays = 30) => {
  if (!validLicenseDate(expiresAt)) return { key: "unknown", label: "Sin fecha", days: null }
  const days = Math.round((Date.parse(expiresAt) - Date.parse(today)) / 86400000)
  return days < 0
    ? { key: "expired", label: "Vencida", days }
    : days <= warningDays
      ? { key: "soon", label: "Por vencer", days }
      : { key: "valid", label: "Vigente", days }
}
export const licenseDateLabel = (value) =>
  validLicenseDate(value) ? value.split("-").reverse().join("-") : "Sin fecha"
export const licenseExpiryMessage = (expiresAt, today = driverToday()) => {
  const { days } = licenseState(expiresAt, today)
  return days === null
    ? "Sin fecha conocida"
    : days < 0
      ? `Vencio hace ${-days} ${days === -1 ? "dia" : "dias"}`
      : days === 0
        ? "Vence hoy"
        : `Vence en ${days} ${days === 1 ? "dia" : "dias"}`
}
export const validateDriverRenewal = (expiresAt, previous, today = driverToday()) => {
  if (
    !previous ||
    !validLicenseDate(previous.expiresAt) ||
    !validLicenseDate(expiresAt) ||
    expiresAt <= previous.expiresAt ||
    expiresAt < today
  )
    throw new Error("La renovacion debe tener una fecha posterior a la anterior y no vencida.")
}
export const lastDriverRenewalDate = (driver) => (driver?.history || []).reduce((latest, entry) => {
  const raw = entry.renewedAt
  const date = validLicenseDate(raw) ? raw : raw && Number.isFinite(Date.parse(raw)) ? driverToday(raw) : ''
  return date > latest ? date : latest
}, '')
export const validateDriverLicenseCorrection = (expiresAt, previous) => {
  const renewedOn = lastDriverRenewalDate(previous)
  if (!validLicenseDate(expiresAt) || (renewedOn && expiresAt < renewedOn))
    throw new Error('El vencimiento corregido no puede ser anterior a la ultima renovacion registrada.')
}
export const validateDriverRenewalDetails = (details, expiresAt, today = driverToday(), previous = null) => {
  if (details.renewedOn && (!validLicenseDate(details.renewedOn) || details.renewedOn > today || details.renewedOn > expiresAt))
    throw new Error("Ingresa una fecha de renovacion valida, no futura y anterior al vencimiento.")
  if ((details.renewedOn || today) < lastDriverRenewalDate(previous))
    throw new Error('La fecha de renovacion no puede ser anterior a la ultima renovacion registrada.')
  if (String(details.notes || '').length > 1000)
    throw new Error("Las observaciones admiten hasta 1000 caracteres.")
  const receipt = details.receipt
  if (receipt && (!receipt.storageId || !['application/pdf', 'image/jpeg', 'image/png'].includes(receipt.type) || !(receipt.size > 0 && receipt.size <= 5 * 1024 * 1024)))
    throw new Error("El comprobante debe ser PDF, JPG o PNG de hasta 5 MB.")
}
export function normalizeDriverLicense(data) {
  const name = String(data.name || "").trim()
  const rut = formatCompanyRut(data.rut)
  const rawRut = rut.replace(/[.-]/g, "")
  const phone = String(data.phone || "").trim()
  const classes = [...new Set(Array.isArray(data.classes) ? data.classes : [])]
  const warningDays = data.warningDays === undefined ? 30 : Number(data.warningDays)
  if (data.warningDays === null || String(data.warningDays ?? 30).trim() === '' || !Number.isInteger(warningDays) || warningDays < 0 || warningDays > 3650)
    throw new Error('Avisar con debe ser un numero entero entre 0 y 3650 dias.')
  if (!name || name.length > 100) throw new Error("Ingresa un nombre de hasta 100 caracteres.")
  if (!/^\d{6,8}[0-9K]$/.test(rawRut)) throw new Error("Ingresa el RUT completo del conductor.")
  if (phone.length > 30) throw new Error("El telefono admite hasta 30 caracteres.")
  if (!classes.length || classes.some((item) => !LICENSE_CLASSES.includes(item)))
    throw new Error("Selecciona al menos una clase de licencia.")
  if (!validLicenseDate(data.expiresAt)) throw new Error("Ingresa una fecha de vencimiento valida.")
  return { name, rut, phone, classes, expiresAt: data.expiresAt, warningDays, notifications: normalizeDriverLicenseNotifications(data.notifications) }
}
