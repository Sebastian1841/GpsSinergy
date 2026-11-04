export const SPEEDING_LEVELS = [
  { id: "mild", label: "Leve", range: "Hasta +10 km/h", severity: "Informativa" },
  {
    id: "moderate",
    label: "Moderada",
    range: "Mas de +10 y hasta +20 km/h",
    severity: "Advertencia",
  },
  { id: "severe", label: "Grave", range: "Mas de +20 km/h", severity: "Critica" },
]

// Rules created before the wizard used a single fixed threshold and severity.
export function speedingRuleOptions(condition = {}) {
  if (!["vehicle-type", "custom"].includes(condition.limitSource)) return {}
  return {
    limitSource: condition.limitSource,
    minimumExcessSeverity: SPEEDING_LEVELS.some(
      (level) => level.id === condition.minimumExcessSeverity,
    )
      ? condition.minimumExcessSeverity
      : "mild",
    severityMode: "excess",
    hysteresisKmh: 5,
  }
}

export const speedingLevel = (delta) => (delta > 20 ? "severe" : delta > 10 ? "moderate" : "mild")

export function speedingConditionLabel(condition) {
  const options = speedingRuleOptions(condition)
  if (!options.limitSource) return ""
  const limit =
    options.limitSource === "vehicle-type"
      ? "Limite por tipo de vehiculo"
      : `Velocidad > ${condition.value} km/h`
  const level = SPEEDING_LEVELS.find((level) => level.id === options.minimumExcessSeverity)
  const duration =
    Number(condition.durationSeconds) > 0 ? ` durante ${condition.durationSeconds} seg` : ""
  return `${limit}; desde ${level.label.toLowerCase()}${duration}`
}
