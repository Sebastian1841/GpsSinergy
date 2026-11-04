import { episodeConditionError } from "./configurationAlertTypes.js"

const hasNumber = (value, minimum) =>
  value !== "" &&
  value !== null &&
  value !== undefined &&
  Number.isFinite(Number(value)) &&
  Number(value) >= minimum

export function getAlarmRuleStepError(draft, step) {
  const condition = draft.condition || {}
  if (step === 1) {
    if (String(draft.name || "").trim().length < 3)
      return "Escribe un nombre de al menos 3 caracteres."
    const episodeError = episodeConditionError(draft.type, condition)
    if (episodeError) return episodeError
    if (
      ["speeding", "no_signal", "stop_time"].includes(draft.type) &&
      !(draft.type === "speeding" && condition.limitSource === "vehicle-type") &&
      !hasNumber(condition.value, 1)
    )
      return "Ingresa un umbral mayor o igual a 1."
    if (
      draft.type === "speeding" &&
      condition.limitSource === "custom" &&
      (!Number.isInteger(Number(condition.value)) || Number(condition.value) > 300)
    )
      return "Ingresa una velocidad entera entre 1 y 300 km/h."
    if (draft.type === "battery" && !hasNumber(condition.value, 0))
      return "Ingresa un umbral valido."
    if (
      draft.type === "fuel" &&
      condition.episodeSource !== "fuel-drop" &&
      (!hasNumber(Math.abs(Number(condition.value)), 0.1) || !hasNumber(condition.windowMinutes, 1))
    )
      return "Indica una baja mayor a cero y una ventana de al menos 1 minuto."
  }
  if (step === 2) {
    if (!hasNumber(draft.cooldownMinutes, 0)) return "El silencio debe ser de cero minutos o mas."
    if (draft.type === "speeding" && !hasNumber(condition.durationSeconds, 0))
      return "Ingresa una duracion valida."
    if (draft.schedule?.type === "custom") {
      const { from, to } = draft.schedule
      const validTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "")
      if (!validTime(from) || !validTime(to)) return "Completa la hora de inicio y de termino."
      if (from === to) return "Las horas deben ser distintas. Para todo el dia, selecciona Siempre."
    }
  }
  return ""
}
