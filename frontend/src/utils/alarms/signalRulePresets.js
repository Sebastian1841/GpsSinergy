export const SIGNAL_RULE_PRESETS = [
  {
    id: "power-cut",
    label: "Corte de alimentacion externa",
    description: "El equipo reporta el corte de alimentacion externa mediante unplug.",
    field: "unplug",
    operator: "=",
    value: 1,
    unit: "",
    severity: "critical",
    durationSeconds: 0,
  },
  {
    id: "low-power",
    label: "Alimentacion bajo 10 V",
    description: "Alimentacion externa bajo 10 V durante dos minutos.",
    field: "ext_voltage_cv",
    operator: "<",
    value: 1000,
    unit: "cV",
    exitMargin: 20,
    severity: "medium",
    durationSeconds: 120,
  },
  {
    id: "low-internal-battery",
    label: "Bateria del equipo baja",
    description: "Bateria interna bajo 3,5 V durante cinco minutos.",
    field: "bat_voltage_cv",
    operator: "<",
    value: 350,
    unit: "cV",
    exitMargin: 20,
    durationSeconds: 300,
  },
  {
    id: "door-open",
    label: "Puerta abierta",
    description:
      "Entrada de puerta en abierta mas de cinco minutos. Revisa la entrada y polaridad de cada equipo.",
    field: "digitalInput2",
    severity: "medium",
    operator: "=",
    value: 0,
    unit: "",
    durationSeconds: 300,
  },
  {
    id: "ignition-after-hours",
    label: "Encendido fuera de horario",
    description:
      "Motor encendido entre las 22:00 y las 06:00. Horario editable en el segundo paso.",
    field: "ignition",
    operator: "=",
    value: 1,
    unit: "",
    durationSeconds: 0,
    from: "22:00",
    to: "06:00",
  },
  {
    id: "movement-after-hours",
    label: "Movimiento fuera de horario",
    description: "Movimiento entre las 22:00 y las 06:00, incluso con motor apagado.",
    field: "movement",
    operator: "=",
    value: 1,
    unit: "",
    severity: "medium",
    durationSeconds: 0,
    from: "22:00",
    to: "06:00",
  },
]

export function applySignalRulePreset(draft, id) {
  const preset = SIGNAL_RULE_PRESETS.find((preset) => preset.id === id)
  if (!preset) return
  draft.type = "signal"
  if (preset.severity) draft.severity = preset.severity
  draft.condition = {
    source: "measured",
    field: preset.field,
    operator: preset.operator,
    value: preset.value,
    unit: preset.unit,
    durationSeconds: preset.durationSeconds,
    exitMargin: preset.exitMargin ?? 0,
    presetId: id,
  }
  if (preset.from)
    draft.schedule = { ...draft.schedule, type: "custom", from: preset.from, to: preset.to }
  else draft.schedule = { ...draft.schedule, type: "always" }
}

const SIGNAL_FIELDS = [
  { id: "movement", name: "movement", aliases: [], unit: "" },
  { id: "ext_voltage_cv", name: "ext_voltage_cv", aliases: [], unit: "cV" },
  { id: "unplug", name: "unplug", aliases: [], unit: "" },
  { id: "bat_voltage_cv", name: "bat_voltage_cv", aliases: [], unit: "cV" },
  {
    id: "digitalInput1",
    name: "digital_input_1",
    aliases: ["digital_input_1", "input1", "di1"],
    unit: "",
  },
  {
    id: "digitalInput2",
    name: "digital_input_2",
    aliases: ["digital_input_2", "input2", "di2"],
    unit: "",
  },
  { id: "ignition", name: "ignition", aliases: ["ignicion", "contacto"], unit: "" },
  { id: "speed", name: "speed", aliases: ["velocidad"], unit: "km/h" },
  { id: "externalVoltage", name: "external_voltage", aliases: ["external_voltage"], unit: "V" },
  { id: "internalVoltage", name: "internal_voltage", aliases: ["internal_voltage"], unit: "V" },
  { id: "batteryVoltage", name: "battery_voltage", aliases: ["battery_voltage"], unit: "V" },
  { id: "canBatteryVoltage", name: "can_battery_voltage", aliases: [], unit: "V" },
  { id: "fuelLevel", name: "fuel_level", aliases: ["fuel_level"], unit: "%" },
  { id: "temperature", name: "temperature", aliases: [], unit: "C" },
]

export const canonicalSignalField = (field) =>
  SIGNAL_FIELDS.find((item) => item.id === field || item.aliases.includes(field))?.id ||
  String(field || "").trim()
export const displaySignalField = (field) =>
  SIGNAL_FIELDS.find((item) => item.id === field)?.name || field

// Only show values supplied by the selected authorized asset; no sample values.
export function availableAssetSignals(asset) {
  if (!asset) return []
  const sources = [asset.lastReport, asset.telemetry, asset].filter(
    (value) => value && typeof value === "object" && !Array.isArray(value),
  )
  return SIGNAL_FIELDS.flatMap((field) => {
    for (const source of sources) {
      for (const key of [field.id, ...field.aliases]) {
        const raw = source[key]
        if (typeof raw === "boolean") return [{ ...field, value: Number(raw) }]
        if (
          (typeof raw === "number" || (typeof raw === "string" && raw.trim() !== "")) &&
          Number.isFinite(Number(raw))
        )
          return [{ ...field, value: Number(raw) }]
      }
    }
    return []
  })
}
