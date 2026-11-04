import { getAlarmTriggerReason } from "./alarmUtils.js"
import { SPEEDING_LEVELS, speedingLevel } from "./speedingRule.js"

const speedNumber = (value) => {
  const match = String(value ?? "").match(/^\s*(\d+(?:[.,]\d+)?)\s*(?:km\/h)?\s*$/i)
  return match ? Number(match[1].replace(",", ".")) : null
}
const durationLabel = (seconds) =>
  seconds < 60 ? `${Math.round(seconds)} s` : `${Math.round(seconds / 60)} min`

export const alarmEpisodeDisplay = (alarm, now = Date.now()) => {
  const metadata = alarm.metadata || {}
  let measurement = alarm.triggerReason || getAlarmTriggerReason(alarm)
  if (alarm.type === "speeding") {
    const speed = speedNumber(metadata.speed ?? metadata.registeredSpeed)
    const limit = speedNumber(metadata.limit ?? metadata.threshold)
    if (speed !== null && limit !== null) {
      const delta = Math.round((speed - limit) * 10) / 10
      const excess =
        delta > 0
          ? ` · +${delta} km/h · ${SPEEDING_LEVELS.find((level) => level.id === speedingLevel(delta)).label.toLowerCase()}`
          : ""
      measurement = `${speed} km/h · limite ${limit} km/h${excess}`
    }
  }
  let seconds = metadata.durationSeconds
  if (seconds === undefined && metadata.startedAt && metadata.endedAt) {
    seconds = (Date.parse(metadata.endedAt) - Date.parse(metadata.startedAt)) / 1000
  }
  const hasDuration =
    seconds !== undefined &&
    seconds !== null &&
    seconds !== "" &&
    Number.isFinite(Number(seconds)) &&
    Number(seconds) >= 0
  const duration = hasDuration
    ? durationLabel(Number(seconds))
    : typeof metadata.duration === "string" && metadata.duration.trim()
      ? metadata.duration
      : "Sin dato"
  const detection =
    metadata.detectedOn === "episode-end" || metadata.notifyOn === "episode-end"
      ? "Detectada al cerrar"
      : metadata.detectedOn === "episode-start"
        ? "Detectada al iniciar"
        : "Deteccion sin dato"
  const ageMinutes = Math.max(0, Math.floor((now - Date.parse(alarm.createdAt)) / 60000))
  const age = !Number.isFinite(ageMinutes)
    ? ""
    : ageMinutes < 1
      ? "Ahora"
      : ageMinutes < 60
        ? `Hace ${ageMinutes} min`
        : ageMinutes < 1440
          ? `Hace ${Math.floor(ageMinutes / 60)} h`
          : `Hace ${Math.floor(ageMinutes / 1440)} dias`
  return { measurement, duration, detection, age }
}
