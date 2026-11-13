import {
  licenseDateLabel,
  licenseExpiryMessage,
  licenseState,
} from "./driverLicenseUtils.js"

export const normalizeDriverSearch = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f.\-\s]/g, "")
    .toLowerCase()
export const DRIVER_LICENSE_FILTERS = [
  { key: 'all', label: 'Todas las licencias' },
  { key: 'attention', label: 'Requieren atencion' },
  { key: 'soon', label: 'Por vencer' },
  { key: 'expired', label: 'Vencidas' },
  { key: 'today', label: 'Vencen hoy' },
  { key: 'next7', label: 'Vencen en los proximos 7 dias' },
  { key: 'next30', label: 'Vencen en los proximos 30 dias' },
  { key: 'valid', label: 'Vigentes' },
]
const matchesLicenseFilter = (row, status) => {
  if (status === 'all') return true
  if (status === 'attention') return row.state.key === 'soon' || row.state.key === 'expired'
  if (status === 'today') return row.state.days === 0
  if (status === 'next7' || status === 'next30')
    return row.state.days !== null && row.state.days >= 1 && row.state.days <= (status === 'next7' ? 7 : 30)
  return row.state.key === status
}
export function buildDriverLicenseList(records, today) {
  const counts = { all: records.length, expired: 0, soon: 0, valid: 0, unknown: 0 }
  const rows = records
    .map((row) => {
      const state = licenseState(row.expiresAt, today, row.warningDays ?? 30)
      counts[state.key]++
      return {
        ...row,
        state,
        avatarTone:
          [...String(row.id || row.rut)].reduce(
            (sum, character) => sum + character.charCodeAt(0),
            0,
          ) % 6,
        expiryLabel: licenseDateLabel(row.expiresAt),
        expiryMessage: licenseExpiryMessage(row.expiresAt, today),
        searchName: normalizeDriverSearch(row.name),
        searchRut: normalizeDriverSearch(row.rut),
        initials: row.name
          .split(/\s+/)
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
          .toUpperCase(),
      }
    })
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt) || a.name.localeCompare(b.name, "es"))
  return { counts, rows }
}
export function filterDriverLicenseList(rows, search, status = "all", licenseClass = "all") {
  const term = normalizeDriverSearch(search)
  return rows.filter(
    (row) =>
      matchesLicenseFilter(row, status) &&
      (licenseClass === "all" || row.classes.includes(licenseClass)) &&
      (!term || row.searchName.includes(term) || row.searchRut.includes(term)),
  )
}
export const countDriverLicenseFilters = (rows) => Object.fromEntries(
  DRIVER_LICENSE_FILTERS.map(({ key }) => [key, rows.filter((row) => matchesLicenseFilter(row, key)).length]),
)
const driverSortText = new Intl.Collator("es", { numeric: true, sensitivity: "base" })
export function sortDriverLicenseList(rows, key = "expiry", direction = "asc") {
  if (key === "expiry" && direction === "asc") return rows
  const value = (row) =>
    key === "name"
      ? row.name
      : key === "classes"
        ? row.classes.join(", ")
        : key === "status"
          ? { expired: 0, soon: 1, valid: 2, unknown: 3 }[row.state.key]
          : row.expiresAt
  return [...rows].sort((a, b) => {
    const left = value(a),
      right = value(b)
    const compared =
      typeof left === "number" ? left - right : driverSortText.compare(left || "", right || "")
    return (direction === "desc" ? -compared : compared) || driverSortText.compare(a.name, b.name)
  })
}
