import {
  SIGNAL_RULE_PRESETS,
  canonicalSignalField,
  displaySignalField,
} from "./signalRulePresets.js"

export const CONFIGURATION_ALERT_TYPES = [
  {
    id: "speeding",
    label: "Exceso de velocidad",
    description: "Sobre el limite del tipo de vehiculo o uno propio de la regla.",
  },
  {
    id: "idle",
    disabled: true,
    status: "Pr\u00f3ximamente",
    label: "Ralenti",
    description: "Vehiculo quieto con el motor encendido durante un tiempo minimo.",
  },
  {
    id: "temperature",
    disabled: true,
    label: "Temperatura fuera de rango",
    description: "Temperatura de una sonda fuera del rango permitido.",
    status: "Pr\u00f3ximamente",
  },
  {
    id: "fuel_load",
    label: "Carga de combustible",
    description: "Subida de nivel de combustible con el vehiculo detenido.",
    status: "Requiere sensor de nivel",
  },
  {
    id: "fuel",
    label: "Caida de nivel de combustible",
    description: "Baja de combustible con el vehiculo detenido.",
    status: "Requiere sensor de nivel",
  },
  {
    id: "geofence",
    disabled: true,
    status: "Pr\u00f3ximamente",
    label: "Entrada o salida de geocerca",
    description: "Cruce de entrada o salida de las geocercas seleccionadas.",
  },
  {
    id: "door_open",
    disabled: true,
    label: "Puerta abierta",
    description: "Estado de apertura recibido mediante una entrada digital.",
    status: "Pr\u00f3ximamente",
  },
  {
    id: "no_signal",
    label: "Equipo sin reportar",
    description: "El equipo no envia reportes durante el tiempo configurado.",
  },
  {
    id: "ignition_event",
    disabled: true,
    label: "Ignicion",
    description: "Cambio de estado de encendido o apagado del motor.",
    status: "Pr\u00f3ximamente",
  },
  {
    id: "signal",
    label: "Valor de una senal o variable calculada",
    description: "Comparacion de una senal o variable con un umbral y duracion minima.",
  },
]

export const EPISODE_PRESETS = {
  idle: { field: "idleMinutes", fieldLabel: "Ralenti", operator: ">=", value: 5, unit: "min" },
  temperature: {
    field: "temperature",
    fieldLabel: "Temperatura",
    operator: "outside",
    value: 0,
    unit: "C",
  },
  fuel_load: {
    field: "fuelVariation",
    fieldLabel: "Carga de combustible",
    operator: ">=",
    value: 15,
    unit: "%",
  },
  door_open: { field: "digitalInput2", fieldLabel: "Puerta", operator: "=", value: 1, unit: "" },
  ignition_event: {
    field: "ignitionState",
    fieldLabel: "Ignicion",
    operator: "=",
    value: "Encendido",
    unit: "",
  },
  signal: { field: "speed", fieldLabel: "Senal", operator: ">", value: 0, unit: "" },
}

const number = (value, fallback) =>
  value !== "" && value !== null && Number.isFinite(Number(value)) ? Number(value) : fallback
const text = (value, fallback) => String(value ?? "").trim() || fallback
export const isEpisodeType = (type) => Object.hasOwn(EPISODE_PRESETS, type)

export function episodeCondition(type, raw = {}) {
  const preset = EPISODE_PRESETS[type]
  if (!preset) return null
  const condition = {
    ...preset,
    field: text(raw.field, preset.field),
    operator: text(raw.operator, preset.operator),
    value: raw.value ?? preset.value,
    unit: String(raw.unit ?? preset.unit),
  }
  delete condition.fieldLabel
  if (type === "idle")
    Object.assign(condition, {
      value: Math.max(1, number(raw.value, 5)),
      engineState: "on",
      stationaryOnly: true,
    })
  if (type === "temperature")
    Object.assign(condition, {
      operator: "outside",
      lower: number(raw.lower, 0),
      upper: number(raw.upper, 8),
      durationSeconds: Math.max(0, number(raw.durationSeconds, 30)),
    })
  if (type === "fuel_load")
    Object.assign(condition, {
      value: Math.max(0.1, number(raw.value, 15)),
      unit: raw.unit === "litros" ? "litros" : "%",
      windowMinutes: Math.max(1, number(raw.windowMinutes, 15)),
      stationaryOnly: true,
    })
  if (type === "door_open")
    Object.assign(condition, {
      field: ["digitalInput1", "digitalInput2"].includes(raw.field) ? raw.field : "digitalInput2",
      operator: "=",
      value: Number(raw.value) === 0 ? 0 : 1,
      durationSeconds: Math.max(0, number(raw.durationSeconds, 0)),
    })
  if (type === "ignition_event")
    Object.assign(condition, {
      operator: "=",
      value: raw.value === "Apagado" ? "Apagado" : "Encendido",
      durationSeconds: Math.max(0, number(raw.durationSeconds, 0)),
    })
  if (type === "signal")
    Object.assign(condition, {
      field: canonicalSignalField(condition.field),
      ...(SIGNAL_RULE_PRESETS.some((preset) => preset.id === raw.presetId)
        ? { presetId: raw.presetId }
        : {}),
      source: raw.source === "calculated" ? "calculated" : "measured",
      operator: [">", ">=", "<", "<=", "=", "!="].includes(raw.operator) ? raw.operator : ">",
      value: number(raw.value, 0),
      exitMargin: Math.max(0, number(raw.exitMargin, 0)),
      durationSeconds: Math.max(0, number(raw.durationSeconds, 30)),
    })
  return condition
}

export function episodeConditionLabel(type, condition) {
  if (type === "idle") return `Ralenti >= ${condition.value} min (motor encendido)`
  if (type === "temperature")
    return `${condition.field}: fuera de ${condition.lower} a ${condition.upper} ${condition.unit}`
  if (type === "fuel_load")
    return `Subida >= ${condition.value} ${condition.unit} en ${condition.windowMinutes} min; detenido`
  if (type === "door_open") return `${condition.field} = ${condition.value} (puerta abierta)`
  if (type === "ignition_event") return `Contacto ${String(condition.value).toLowerCase()}`
  if (type === "signal")
    return `${displaySignalField(condition.field)} ${condition.operator} ${condition.value}${condition.unit ? " " + condition.unit : ""}`
  return ""
}

export function episodeConditionError(type, condition = {}) {
  if (!isEpisodeType(type)) return ""
  const finite = (value) =>
    value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value))
  if (["temperature", "signal"].includes(type) && !String(condition.field || "").trim())
    return "Indica el identificador de la senal o variable."
  if (type === "idle" && (!finite(condition.value) || Number(condition.value) < 1))
    return "Ingresa una duracion de ralenti de al menos 1 minuto."
  if (
    type === "temperature" &&
    (!finite(condition.lower) ||
      !finite(condition.upper) ||
      Number(condition.lower) >= Number(condition.upper))
  )
    return "El minimo de temperatura debe ser menor al maximo."
  if (
    type === "fuel_load" &&
    (!finite(condition.value) ||
      Number(condition.value) <= 0 ||
      !finite(condition.windowMinutes) ||
      Number(condition.windowMinutes) < 1)
  )
    return "Indica una subida mayor a cero y una ventana de al menos 1 minuto."
  if (type === "signal" && !finite(condition.value)) return "Ingresa un umbral numerico valido."
  if (
    type === "signal" &&
    condition.exitMargin !== undefined &&
    (!finite(condition.exitMargin) || Number(condition.exitMargin) < 0)
  )
    return "El margen de salida debe ser cero o mayor."
  if (
    ["temperature", "door_open", "ignition_event", "signal"].includes(type) &&
    (!finite(condition.durationSeconds) || Number(condition.durationSeconds) < 0)
  )
    return "Ingresa una duracion valida."
  return ""
}
