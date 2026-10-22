import { currentConsultations, localFollowUpDate } from "./unreportedFlow.js"

export function workshopSchedule(days, createdAt) {
  if (!Number.isInteger(days) || days < 1 || days > 3650) return null
  const end = new Date(`${localFollowUpDate(createdAt)}T12:00:00Z`)
  if (!Number.isFinite(end.getTime())) return null
  end.setUTCDate(end.getUTCDate() + days)
  const releaseDate = end.toISOString().slice(0, 10)
  end.setUTCDate(end.getUTCDate() - ((end.getUTCDay() + 6) % 7))
  return { releaseDate, reminderDate: end.toISOString().slice(0, 10) }
}
export function workshopReminder(record, now) {
  if (record.mode !== "active") return null
  const call = currentConsultations(record).at(-1)
  if (call?.situation !== "workshop") return null
  const schedule = workshopSchedule(call.workshopDays, call.createdAt)
  const today = localFollowUpDate(now)
  if (!schedule || today < schedule.reminderDate) return null
  return {
    ...schedule,
    label:
      today > schedule.releaseDate
        ? "Fecha estimada de salida cumplida"
        : "Pronto a salir de taller",
  }
}
