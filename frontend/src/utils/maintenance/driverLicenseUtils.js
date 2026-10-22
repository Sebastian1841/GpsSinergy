import { formatCompanyRut } from "../companies/companyRut.js"

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
export const licenseState = (expiresAt, today = driverToday()) => {
  if (!validLicenseDate(expiresAt)) return { key: "unknown", label: "Sin fecha", days: null }
  const days = Math.round((Date.parse(expiresAt) - Date.parse(today)) / 86400000)
  return days < 0
    ? { key: "expired", label: "Vencida", days }
    : days <= 30
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
  if (!["soon", "expired"].includes(licenseState(previous.expiresAt, today).key))
    throw new Error("Solo puedes renovar licencias por vencer o vencidas.")
}
export function normalizeDriverLicense(data) {
  const name = String(data.name || "").trim()
  const rut = formatCompanyRut(data.rut)
  const rawRut = rut.replace(/[.-]/g, "")
  const phone = String(data.phone || "").trim()
  const classes = [...new Set(Array.isArray(data.classes) ? data.classes : [])]
  if (!name || name.length > 100) throw new Error("Ingresa un nombre de hasta 100 caracteres.")
  if (!/^\d{6,8}[0-9K]$/.test(rawRut)) throw new Error("Ingresa el RUT completo del conductor.")
  if (phone.length > 30) throw new Error("El telefono admite hasta 30 caracteres.")
  if (!classes.length || classes.some((item) => !LICENSE_CLASSES.includes(item)))
    throw new Error("Selecciona al menos una clase de licencia.")
  if (!validLicenseDate(data.expiresAt)) throw new Error("Ingresa una fecha de vencimiento valida.")
  return { name, rut, phone, classes, expiresAt: data.expiresAt }
}
