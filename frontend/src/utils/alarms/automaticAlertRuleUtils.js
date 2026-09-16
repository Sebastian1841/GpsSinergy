import { ALARM_SEVERITY_OPTIONS, ALARM_TYPE_OPTIONS } from "./alarmUtils.js"
import { normalizeId } from "../idUtils.js"
import { assetMatchesTagIds, normalizeAssetTagId } from "../users/userAssetTagUtils.js"

export const AUTOMATIC_ALERT_TYPE_PRESETS = {
  speeding: {
    field: "speed",
    fieldLabel: "Velocidad",
    operator: ">",
    value: 90,
    unit: "km/h",
    description: "Genera una alerta cuando el activo supera la velocidad configurada.",
  },
  no_signal: {
    field: "offlineMinutes",
    fieldLabel: "Sin reporte",
    operator: ">=",
    value: 30,
    unit: "min",
    description: "Genera una alerta cuando el activo deja de reportar posicion.",
  },
  battery: {
    field: "batteryVoltage",
    fieldLabel: "Voltaje",
    operator: "<",
    value: 11.8,
    unit: "V",
    description: "Genera una alerta cuando el dispositivo reporta bajo voltaje.",
  },
  geofence: {
    field: "geofenceEvent",
    fieldLabel: "Evento de geocerca",
    operator: "=",
    value: "Salida",
    unit: "",
    description: "Genera una alerta cuando el activo entra o sale de una geocerca.",
  },
  stop_time: {
    field: "stopMinutes",
    fieldLabel: "Tiempo detenido",
    operator: ">=",
    value: 30,
    unit: "min",
    description: "Genera una alerta cuando el activo supera el tiempo detenido permitido.",
  },
  ignition: {
    field: "ignitionState",
    fieldLabel: "Contacto",
    operator: "=",
    value: "Encendido",
    unit: "",
    description: "Genera una alerta cuando hay encendido fuera de la ventana operativa.",
  },
  fuel: {
    field: "fuelVariation",
    fieldLabel: "Variacion combustible",
    operator: "<=",
    value: -15,
    unit: "%",
    description: "Genera una alerta cuando se detecta una baja brusca de combustible.",
  },
}

export const AUTOMATIC_ALERT_OPERATOR_OPTIONS = [
  { id: ">", label: "Mayor que" },
  { id: ">=", label: "Mayor o igual" },
  { id: "<", label: "Menor que" },
  { id: "<=", label: "Menor o igual" },
  { id: "=", label: "Igual a" },
]

const TYPE_LABELS = new Map(ALARM_TYPE_OPTIONS.map((option) => [option.id, option.label]))
const SEVERITY_LABELS = new Map(ALARM_SEVERITY_OPTIONS.map((option) => [option.id, option.label]))
const OPERATOR_LABELS = new Map(
  AUTOMATIC_ALERT_OPERATOR_OPTIONS.map((option) => [option.id, option.label]),
)

const DEFAULT_TYPE = "speeding"
const DEFAULT_SEVERITY = "medium"
const DEFAULT_SCHEDULE = {
  type: "always",
  from: "08:00",
  to: "18:00",
  days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
}

const normalizeText = (value, fallback = "") => {
  const text = String(value ?? "").trim()

  return text || fallback
}

const normalizeSearchText = (value) => {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

const parseDateTime = (value) => {
  const time = Date.parse(value)

  return Number.isFinite(time) ? time : 0
}

const normalizeNumber = (value, fallback = 0) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

const normalizeTime = (value, fallback) => {
  const text = normalizeText(value, fallback)

  return /^\d{2}:\d{2}$/.test(text) ? text : fallback
}

const normalizeSchedule = (schedule = {}) => {
  const rawSchedule = schedule && typeof schedule === "object" ? schedule : {}
  const scheduleType = normalizeId(rawSchedule.type) === "custom" ? "custom" : "always"
  const days = Array.isArray(rawSchedule.days)
    ? rawSchedule.days.map(normalizeId).filter(Boolean)
    : DEFAULT_SCHEDULE.days

  return {
    type: scheduleType,
    from: normalizeTime(rawSchedule.from, DEFAULT_SCHEDULE.from),
    to: normalizeTime(rawSchedule.to, DEFAULT_SCHEDULE.to),
    days: days.length ? [...new Set(days)] : [...DEFAULT_SCHEDULE.days],
  }
}

const normalizeAssetScope = (assetScope = {}) => {
  const rawAssetScope = assetScope && typeof assetScope === "object" ? assetScope : {}
  const scopeType = normalizeId(rawAssetScope.type)
  const type =
    scopeType === "specific" || scopeType === "asset-tags" || scopeType === "tags"
      ? scopeType === "tags"
        ? "asset-tags"
        : scopeType
      : "all"

  return {
    type,
    assetIds: Array.isArray(rawAssetScope.assetIds)
      ? rawAssetScope.assetIds.map(normalizeId).filter(Boolean)
      : [],
    assetTagIds: Array.isArray(rawAssetScope.assetTagIds)
      ? rawAssetScope.assetTagIds.map(normalizeAssetTagId).filter(Boolean)
      : [],
  }
}

const normalizeIdList = (values = []) => {
  if (!Array.isArray(values)) return []

  return [...new Set(values.map(normalizeId).filter(Boolean))]
}

const normalizeTextList = (values = []) => {
  if (!Array.isArray(values)) return []

  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))]
}

const normalizeGeofenceScope = (value) => {
  const scope = normalizeId(value)

  return scope === "group" || scope === "specific" ? scope : "all"
}

const cloneConditionPreset = (type = DEFAULT_TYPE) => {
  const normalizedType = normalizeId(type)
  const preset =
    AUTOMATIC_ALERT_TYPE_PRESETS[normalizedType] || AUTOMATIC_ALERT_TYPE_PRESETS[DEFAULT_TYPE]
  const condition = {
    field: preset.field,
    operator: preset.operator,
    value: preset.value,
    unit: preset.unit,
  }

  if (normalizedType === "geofence") {
    return {
      ...condition,
      geofenceName: "",
      geofenceScope: "all",
      geofenceGroupId: "",
      geofenceGroupName: "",
      geofenceIds: [],
      geofenceNames: [],
    }
  }

  return condition
}

const getCompanyName = (company = {}, fallback = "") => {
  return company.name || company.shortName || fallback || "Empresa"
}

const getAssetName = (asset = {}) => {
  return asset.vehiculo || asset.nombrePantalla || asset.name || asset.nombre || "Activo"
}

const getAssetPlate = (asset = {}) => {
  return asset.patente || asset.patent || asset.plate || asset.ppu || asset.matricula || "-"
}

const getPreset = (type) => {
  return (
    AUTOMATIC_ALERT_TYPE_PRESETS[normalizeId(type)] || AUTOMATIC_ALERT_TYPE_PRESETS[DEFAULT_TYPE]
  )
}

export const getAutomaticAlertTypeLabel = (type) => {
  return TYPE_LABELS.get(normalizeId(type)) || "Operacion"
}

export const getAutomaticAlertSeverityLabel = (severity) => {
  return SEVERITY_LABELS.get(normalizeId(severity)) || "Media"
}

export const getAutomaticAlertConditionLabel = (rule = {}) => {
  const type = normalizeId(rule.type || DEFAULT_TYPE)
  const preset = getPreset(type)
  const condition = rule.condition || {}
  const fieldLabel = preset.fieldLabel
  const operator = normalizeText(condition.operator, preset.operator)
  const value = normalizeText(condition.value, preset.value)
  const unit = normalizeText(condition.unit, preset.unit)

  if (type === "speeding") {
    const durationSeconds = normalizeNumber(condition.durationSeconds, 0)
    const durationLabel = durationSeconds > 0 ? ` durante ${durationSeconds} seg` : ""

    return `Velocidad > ${value} km/h${durationLabel}`
  }

  if (type === "battery") {
    const metricLabel = condition.field === "batteryPercent" ? "Bateria" : "Voltaje"

    return `${metricLabel} < ${value}${unit ? ` ${unit}` : ""}`
  }

  if (type === "no_signal") {
    return `Sin reporte >= ${value} min`
  }

  if (type === "geofence") {
    const scope = normalizeGeofenceScope(condition.geofenceScope)
    const geofenceName = normalizeText(condition.geofenceName)
    const groupName = normalizeText(condition.geofenceGroupName || condition.geofenceGroupId)
    const geofenceNames = normalizeTextList(condition.geofenceNames)
    const geofenceIds = normalizeIdList(condition.geofenceIds)

    if (scope === "group") {
      return groupName ? `${value} - Grupo ${groupName}` : `${value} - Grupo`
    }

    if (scope === "specific") {
      if (geofenceNames.length === 1) return `${value} - ${geofenceNames[0]}`

      const geofenceCount = geofenceNames.length || geofenceIds.length

      return geofenceCount ? `${value} - ${geofenceCount} geocercas` : `${value} - Geocercas`
    }

    return geofenceName ? `${value} - ${geofenceName}` : `${value} - Todas`
  }

  if (type === "stop_time") {
    const engineState = normalizeId(condition.engineState)
    const engineLabel =
      engineState === "on"
        ? "con motor encendido"
        : engineState === "off"
          ? "con motor apagado"
          : ""

    return `Detenido >= ${value} min${engineLabel ? ` ${engineLabel}` : ""}`
  }

  if (type === "ignition") {
    return rule.schedule?.type === "custom"
      ? "Contacto encendido fuera de horario"
      : "Contacto encendido"
  }

  if (type === "fuel") {
    const windowMinutes = normalizeNumber(condition.windowMinutes, 0)
    const amount = Math.abs(normalizeNumber(value, 0))
    const windowLabel = windowMinutes > 0 ? ` en ${windowMinutes} min` : ""

    return `Baja >= ${amount}${unit ? ` ${unit}` : ""}${windowLabel}`
  }

  return `${fieldLabel} ${operator} ${value}${unit ? ` ${unit}` : ""}`
}

export const getAutomaticAlertOperatorLabel = (operator) => {
  return OPERATOR_LABELS.get(normalizeText(operator)) || normalizeText(operator, "Condicion")
}

export const getDefaultAutomaticAlertRulePayload = ({
  companyId = "",
  name = "",
  type = DEFAULT_TYPE,
} = {}) => {
  const normalizedType = normalizeId(type) || DEFAULT_TYPE
  const now = new Date().toISOString()

  return {
    id: "",
    companyId: normalizeId(companyId),
    name: normalizeText(name, `Nueva regla ${getAutomaticAlertTypeLabel(normalizedType)}`),
    type: normalizedType,
    severity: DEFAULT_SEVERITY,
    enabled: true,
    condition: cloneConditionPreset(normalizedType),
    assetScope: {
      type: "all",
      assetIds: [],
      assetTagIds: [],
    },
    description: "",
    schedule: {
      ...DEFAULT_SCHEDULE,
      type: normalizedType === "ignition" ? "custom" : DEFAULT_SCHEDULE.type,
    },
    cooldownMinutes: 15,
    notificationChannels: {
      inApp: true,
      email: false,
      whatsapp: false,
    },
    createdAt: now,
    updatedAt: now,
  }
}

export const normalizeAutomaticAlertRule = (rule = {}) => {
  const type = normalizeId(rule.type || DEFAULT_TYPE) || DEFAULT_TYPE
  const presetCondition = cloneConditionPreset(type)
  const condition = rule.condition && typeof rule.condition === "object" ? rule.condition : {}
  const rawChannels =
    rule.notificationChannels && typeof rule.notificationChannels === "object"
      ? rule.notificationChannels
      : {}
  const assetScope = normalizeAssetScope(rule.assetScope)
  const schedule = normalizeSchedule(rule.schedule)

  const normalizedCondition = {
    field: normalizeText(condition.field, presetCondition.field),
    operator: normalizeText(condition.operator, presetCondition.operator),
    value:
      condition.value === null || condition.value === undefined || condition.value === ""
        ? presetCondition.value
        : condition.value,
    unit: normalizeText(condition.unit, presetCondition.unit),
  }

  if (type === "speeding") {
    normalizedCondition.durationSeconds = Math.max(0, normalizeNumber(condition.durationSeconds, 0))
  }

  if (type === "geofence") {
    const geofenceIds = normalizeIdList(condition.geofenceIds)
    const geofenceNames = normalizeTextList(condition.geofenceNames)
    const geofenceGroupId = normalizeText(condition.geofenceGroupId)
    const geofenceGroupName = normalizeText(condition.geofenceGroupName)
    const legacyGeofenceName = normalizeText(condition.geofenceName)
    const inferredScope =
      geofenceIds.length > 0
        ? "specific"
        : geofenceGroupId || geofenceGroupName
          ? "group"
          : normalizeGeofenceScope(condition.geofenceScope)

    normalizedCondition.geofenceScope = inferredScope
    normalizedCondition.geofenceGroupId = inferredScope === "group" ? geofenceGroupId : ""
    normalizedCondition.geofenceGroupName = inferredScope === "group" ? geofenceGroupName : ""
    normalizedCondition.geofenceIds = inferredScope === "specific" ? geofenceIds : []
    normalizedCondition.geofenceNames = inferredScope === "specific" ? geofenceNames : []
    normalizedCondition.geofenceName =
      legacyGeofenceName ||
      (inferredScope === "group"
        ? geofenceGroupName || geofenceGroupId
        : inferredScope === "specific" && (geofenceNames.length || geofenceIds.length)
          ? `${geofenceNames.length || geofenceIds.length} geocercas`
          : "")
  }

  if (type === "stop_time") {
    normalizedCondition.engineState = ["on", "off"].includes(normalizeId(condition.engineState))
      ? normalizeId(condition.engineState)
      : "any"
  }

  if (type === "ignition") {
    normalizedCondition.field = "ignitionState"
    normalizedCondition.operator = "="
    normalizedCondition.value = "Encendido"
    normalizedCondition.unit = ""
    schedule.type = "custom"
  }

  if (type === "fuel") {
    normalizedCondition.windowMinutes = Math.max(1, normalizeNumber(condition.windowMinutes, 15))
  }

  return {
    id: normalizeText(rule.id),
    companyId: normalizeId(rule.companyId),
    name: normalizeText(rule.name, `Regla ${getAutomaticAlertTypeLabel(type)}`),
    description: normalizeText(rule.description),
    type,
    severity: normalizeId(rule.severity || DEFAULT_SEVERITY) || DEFAULT_SEVERITY,
    enabled: rule.enabled !== false,
    condition: normalizedCondition,
    assetScope,
    schedule,
    cooldownMinutes: Math.max(0, normalizeNumber(rule.cooldownMinutes, 15)),
    notificationChannels: {
      inApp: rawChannels.inApp !== false,
      email: Boolean(rawChannels.email),
      whatsapp: Boolean(rawChannels.whatsapp),
    },
    createdAt: normalizeText(rule.createdAt, new Date().toISOString()),
    updatedAt: normalizeText(rule.updatedAt, rule.createdAt || new Date().toISOString()),
  }
}

export const buildAutomaticAlertRuleRows = ({
  rules = [],
  companies = [],
  assets = [],
  companyId = "",
} = {}) => {
  const normalizedCompanyId = normalizeId(companyId)
  const companiesById = new Map(companies.map((company) => [normalizeId(company.id), company]))
  const hasCompanyScope = companiesById.size > 0
  const assetsByCompanyId = new Map()

  assets.forEach((asset) => {
    const assetCompanyId = normalizeId(asset.companyId)
    const companyAssets = assetsByCompanyId.get(assetCompanyId) || []

    companyAssets.push(asset)
    assetsByCompanyId.set(assetCompanyId, companyAssets)
  })

  return rules
    .map(normalizeAutomaticAlertRule)
    .filter((rule) => rule.id && rule.companyId)
    .filter((rule) => !normalizedCompanyId || rule.companyId === normalizedCompanyId)
    .filter((rule) => !hasCompanyScope || companiesById.has(rule.companyId))
    .map((rule) => {
      const companyAssets = assetsByCompanyId.get(rule.companyId) || []
      const availableAssetIds = new Set(companyAssets.map((asset) => normalizeId(asset.id)))
      const selectedAssetIds =
        rule.assetScope.type === "specific"
          ? rule.assetScope.assetIds.filter((assetId) => availableAssetIds.has(assetId))
          : rule.assetScope.type === "asset-tags"
            ? companyAssets
                .filter((asset) => assetMatchesTagIds(asset, rule.assetScope.assetTagIds))
                .map((asset) => normalizeId(asset.id))
            : companyAssets.map((asset) => normalizeId(asset.id))
      const selectedAssetIdSet = new Set(selectedAssetIds)
      const selectedAssets = companyAssets.filter((asset) => {
        return selectedAssetIdSet.has(normalizeId(asset.id))
      })
      const company = companiesById.get(rule.companyId) || null
      const updatedTime = parseDateTime(rule.updatedAt || rule.createdAt)
      const targetLabel =
        rule.assetScope.type === "specific"
          ? `${selectedAssetIds.length} activos especificos`
          : rule.assetScope.type === "asset-tags"
            ? `${rule.assetScope.assetTagIds.length} etiquetas / ${selectedAssetIds.length} activos`
            : `Todos los activos (${companyAssets.length})`

      return {
        ...rule,
        company,
        companyName: getCompanyName(company),
        typeLabel: getAutomaticAlertTypeLabel(rule.type),
        severityLabel: getAutomaticAlertSeverityLabel(rule.severity),
        conditionLabel: getAutomaticAlertConditionLabel(rule),
        updatedTime,
        availableAssetCount: companyAssets.length,
        selectedAssetCount: selectedAssetIds.length,
        selectedAssetIds,
        selectedAssets: selectedAssets.map((asset) => ({
          id: normalizeId(asset.id),
          label: `${getAssetPlate(asset)} - ${getAssetName(asset)}`,
        })),
        targetLabel,
      }
    })
}

export const filterAutomaticAlertRuleRows = ({
  rows = [],
  searchTerm = "",
  selectedStatus = "all",
  selectedType = "all",
} = {}) => {
  const normalizedSearch = normalizeSearchText(searchTerm)
  const normalizedStatus = normalizeId(selectedStatus || "all")
  const normalizedType = normalizeId(selectedType || "all")

  return rows.filter((rule) => {
    if (normalizedStatus === "enabled" && !rule.enabled) return false
    if (normalizedStatus === "disabled" && rule.enabled) return false
    if (normalizedType !== "all" && rule.type !== normalizedType) return false

    if (!normalizedSearch) return true

    const searchValues = [
      rule.name,
      rule.companyName,
      rule.typeLabel,
      rule.severityLabel,
      rule.conditionLabel,
      rule.targetLabel,
    ]

    return searchValues.some((value) => normalizeSearchText(value).includes(normalizedSearch))
  })
}

export const sortAutomaticAlertRuleRows = (rows = []) => {
  return [...rows].sort((left, right) => {
    if (left.enabled !== right.enabled) return left.enabled ? -1 : 1

    return right.updatedTime - left.updatedTime
  })
}

export const buildAutomaticAlertRuleSummary = (rows = []) => {
  const enabledRows = rows.filter((rule) => rule.enabled)
  const disabledRows = rows.filter((rule) => !rule.enabled)
  const criticalRows = rows.filter((rule) => rule.enabled && rule.severity === "critical")

  return {
    total: rows.length,
    enabled: enabledRows.length,
    disabled: disabledRows.length,
    critical: criticalRows.length,
  }
}
