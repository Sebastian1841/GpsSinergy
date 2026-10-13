const numberFormatter = new Intl.NumberFormat("es-CL")
const decimalFormatter = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 })
const shortDateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "short" })

export const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
}

export const parseNumber = (value) => {
  const normalizedValue = String(value ?? "")
    .replace(/[^\d.,-]/g, "")
    .replace(/\./g, "")
  const number = Number(normalizedValue.replace(",", "."))

  return Number.isFinite(number) ? number : 0
}

export const formatNumber = (value) => {
  return numberFormatter.format(Math.round(Number(value) || 0))
}

export const formatDecimalNumber = (value) => decimalFormatter.format(value)

export const formatCurrency = (value) => {
  return `$ ${formatNumber(value)}`
}

export const getDateInputDaysAgo = (days) => {
  const date = new Date()

  date.setDate(date.getDate() - days)

  return date.toISOString().split("T")[0]
}

export const formatDateLabel = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value || "-"

  return shortDateFormatter.format(date)
}

export const addDays = (value, days) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  date.setDate(date.getDate() + Number(days || 0))

  return date
}

export const getAssetName = (asset = {}) => {
  return asset.nombrePantalla || asset.vehiculo || asset.name || asset.deviceName || "Activo"
}

export const getAssetPlate = (asset = {}) => {
  return asset.patente || asset.patent || asset.plate || "Sin patente"
}

export const getInitials = (value = "") => {
  return String(value || "MT")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export const getReadingUnit = (source) => {
  if (source === "Horometro") return "hrs"
  if (source === "Fecha/Hora") return "dias"

  return "km"
}

export const formatMaintenanceIntervalLabel = (source, value) => {
  const unit = getReadingUnit(source)


  return `${formatNumber(parseNumber(value))} ${unit}`
}
