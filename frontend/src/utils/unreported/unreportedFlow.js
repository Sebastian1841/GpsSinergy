import { consultationsForInterruption } from "./unreportedHistory.js"

export const connectivityLabel = (record) => {
  if (record.mode === "recovered") return "Recuperado"
  if (record.mode === "reporting") return "Reportando"
  return record.lastSeenAt ? "Sin reportar" : "Nunca reporto"
}

export const followUpLabel = (record) =>
  record.followUp === "field_review"
    ? "Revision en terreno"
    : record.followUp === "no_visit"
      ? "Sin revision por ahora"
      : "Pendiente de confirmar"

export const consultationSituations = [
  { value: "working", label: "Esta funcionando" },
  { value: "not_in_use", label: "Sin uso" },
  { value: "workshop", label: "En taller" },
  { value: "not_contacted", label: "No se logro contactar" },
]
export const consultationDecisions = [
  { value: "pending", label: "Pendiente de confirmar" },
  { value: "field_review", label: "Requiere revision en terreno" },
  { value: "no_visit", label: "No requiere por ahora" },
]
export const consultationDecisionForSituation = (situation) =>
  situation === "working"
    ? "field_review"
    : ["not_in_use", "not_contacted", "workshop"].includes(situation)
      ? "pending"
      : ""
export const matchesConsultation = (row, value) => {
  if (value === "all") return true
  const latest = currentConsultations(row).at(-1)
  return value === "none" ? !latest : latest?.situation === value
}

export const matchesSilenceDays = (row, value, customDays = null) => {
  if (value === "all") return true
  if (value === "unknown") return !Number.isFinite(row.elapsedHours)
  const days = value === "custom" ? customDays : { "1d": 1, "3d": 3, "7d": 7, "15d": 15 }[value]
  return (
    Number.isInteger(days) &&
    days >= 1 &&
    days <= 3650 &&
    Number.isFinite(row.elapsedHours) &&
    row.elapsedHours >= days * 24
  )
}

export const compareUnreportedPriority = (a, b) => {
  if (a.mode === "recovered" && b.mode === "recovered")
    return (Date.parse(b.recoveredAt) || 0) - (Date.parse(a.recoveredAt) || 0)
  const priority = Number(!!b.workshopReminder) - Number(!!a.workshopReminder)
  if (priority) return priority
  const hours = (row) => (Number.isFinite(row.elapsedHours) ? row.elapsedHours : -1)
  return hours(b) - hours(a) || String(a.name || "").localeCompare(String(b.name || ""), "es")
}

export const currentConsultations = (record) => {
  if (record.mode !== "active") return record.consultations || []
  const open = record.interruptions?.find((item) => !item.recoveredAt)
  if (open) return consultationsForInterruption(record, open)
  // Never-reported devices do not yet have a dated interruption.
  return (record.consultations || []).filter((call) => !call.interruptionId)
}

const chileDate = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Santiago",
})
export const localFollowUpDate = (value = new Date()) => {
  const parts = Object.fromEntries(
    chileDate.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}
export const followUpDateLabel = (value) => (value ? value.split("-").reverse().join("-") : "")
export const visitResults = [
  { value: "repaired", label: "Falla corregida" },
  { value: "pending", label: "Requiere otra intervencion" },
  { value: "no_fault", label: "No se encontro falla" },
]
export const visitResultLabel = (value) =>
  visitResults.find((option) => option.value === value)?.label || ""
export const consultationFollowUpText = (call) =>
  [
    consultationContactLabel(call),
    call?.workshopDays ? `Estadia estimada en taller: ${call.workshopDays} dias` : "",
    call?.nextCallDate ? `Proxima llamada: ${followUpDateLabel(call.nextCallDate)}` : "",
    call?.visitResult
      ? `Visita del ${followUpDateLabel(call.visitDate)}: ${visitResultLabel(call.visitResult)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n")

export const consultationContactLabel = (call) => {
  const person = String(call?.contactedPerson || "").trim()
  const role = String(call?.contactedRole || "").trim()
  return person ? `Hablo con: ${person}${role ? ` (${role})` : ""}` : role ? `Cargo: ${role}` : ""
}
