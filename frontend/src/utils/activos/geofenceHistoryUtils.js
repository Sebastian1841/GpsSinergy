export const DEFAULT_GEOFENCE_HISTORY_DATE_PRESET = "all"

export const geofenceHistoryPageSizeOptions = [25, 50, 100, 200]

export const normalizeGeofenceHistoryText = (value) => {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export const getGeofenceHistoryEventLabel = (type) => {
  const labels = {
    entry: "Entrada",
    exit: "Salida",
    pass: "Paso",
    deviation: "Desvio",
  }

  return labels[type] || "Evento"
}

export const parseGeofenceHistoryLocalDateInput = (value, endOfDay = false) => {
  if (!value) return null

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return null

  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  }

  return date.getTime()
}

export const parseGeofenceHistoryEventDate = (value) => {
  if (!value) return null

  const direct = new Date(value)

  if (!Number.isNaN(direct.getTime())) {
    return direct.getTime()
  }

  const normalized = String(value).trim()
  const match = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/)

  if (!match) return null

  const [, day, month, year, hour = "0", minute = "0"] = match
  const fullYear = year.length === 2 ? `20${year}` : year

  const parsed = new Date(
    Number(fullYear),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  )

  if (Number.isNaN(parsed.getTime())) return null

  return parsed.getTime()
}

export const formatGeofenceHistoryEventDate = (rawDate, time) => {
  if (!rawDate) return "Sin fecha"
  if (!time) return rawDate

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time))
}

export const getGeofenceHistoryEventDateValue = (event) => {
  return event.date || event.timestamp || event.createdAt || event.created_at || null
}

export const getGeofenceHistoryDurationSeconds = (value) => {
  if (typeof value === "number") return value

  const text = normalizeGeofenceHistoryText(value).replace(",", ".")

  if (!text) return 0

  const clockMatch = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)

  if (clockMatch) {
    const [, hours, minutes, seconds = "0"] = clockMatch

    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
  }

  const hours = Number(text.match(/(\d+(?:\.\d+)?)\s*h/)?.[1] || 0)
  const minutes = Number(text.match(/(\d+(?:\.\d+)?)\s*m/)?.[1] || 0)
  const seconds = Number(text.match(/(\d+(?:\.\d+)?)\s*s/)?.[1] || 0)

  if (hours || minutes || seconds) {
    return hours * 3600 + minutes * 60 + seconds
  }

  const numericValue = Number.parseFloat(text)

  return Number.isNaN(numericValue) ? 0 : numericValue
}

export const getGeofenceHistoryNumericValue = (value) => {
  const number = Number(String(value ?? "").replace(",", "."))

  return Number.isNaN(number) ? 0 : number
}

export const getGeofenceHistoryDefaultSortDirection = (key) => {
  if (["date", "speed", "duration"].includes(key)) {
    return "desc"
  }

  return "asc"
}

export const getGeofenceHistoryEventClass = (type) => {
  const classes = {
    entry: "bg-emerald-50 text-emerald-700",
    exit: "bg-orange-50 text-[#FF6600]",
    pass: "bg-blue-50 text-[#102372]",
    deviation: "bg-red-50 text-red-600",
  }

  return classes[type] || "bg-slate-100 text-slate-600"
}
