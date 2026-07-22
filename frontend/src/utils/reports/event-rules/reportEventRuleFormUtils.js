export const REPORT_EVENT_RULE_FORM_MODULES = [
  { id: "general", label: "General" },
  { id: "calendar", label: "Calendario" },
  { id: "activation", label: "Activacion" },
  { id: "scope", label: "Alcance" },
  { id: "expressions", label: "Expresiones" },
  { id: "notifications", label: "Notificaciones" },
]

export const REPORT_EVENT_RULE_EXPRESSION_TEMPLATES = {
  custom: {
    field: "event",
    operator: "exists",
    value: "",
  },
  text: {
    field: "event",
    operator: "contains",
    value: "",
  },
  analog: {
    field: "speed",
    operator: "greaterThan",
    value: "0",
  },
  digital: {
    field: "ignition",
    operator: "equals",
    value: "true",
  },
  speeding: {
    field: "speedingDelta",
    operator: "greaterThan",
    value: "0",
  },
  driverLogin: {
    field: "driver",
    operator: "exists",
    value: "",
  },
  driverGroup: {
    field: "driverGroup",
    operator: "exists",
    value: "",
  },
  offline: {
    field: "state",
    operator: "equals",
    value: "offline",
  },
  geofence: {
    field: "geofence",
    operator: "exists",
    value: "",
  },
  poi: {
    field: "poi",
    operator: "exists",
    value: "",
  },
  rendezvous: {
    field: "rendezvousDistance",
    operator: "lessThanOrEqual",
    value: "100",
  },
  script: {
    field: "script",
    operator: "exists",
    value: "",
  },
  http: {
    field: "http",
    operator: "exists",
    value: "",
  },
}

export const REPORT_EVENT_RULE_EXPRESSION_FIELD_GROUPS = {
  text: ["event", "state", "alert", "driver", "driverGroup", "geofence", "poi", "script", "http"],
  analog: [
    "speed",
    "speedLimit",
    "speedingDelta",
    "fuel",
    "can",
    "satellites",
    "engineHours",
    "duration",
    "odometer",
    "canRpm",
    "canEngineTemp",
    "canBatteryVoltage",
    "canEngineLoad",
    "canThrottle",
    "canFuelRate",
    "canFuelUsed",
    "canOilPressure",
    "canAdBlueLevel",
    "canDtcCount",
    "rendezvousDistance",
  ],
  digital: ["ignition", "gpsFix", "digitalInput1", "digitalInput2", "speeding", "rendezvous"],
  driverLogin: ["driver"],
  driverGroup: ["driverGroup"],
  offline: ["state"],
  geofence: ["geofence"],
  poi: ["poi"],
  rendezvous: ["rendezvousDistance", "rendezvous"],
  script: ["script"],
  speeding: ["speedingDelta", "speedLimit", "speed", "speeding"],
  http: ["http"],
  custom: ["event", "state", "alert", "driver", "driverGroup"],
}

export const REPORT_EVENT_RULE_EXPRESSION_OPERATOR_GROUPS = {
  text: ["contains", "equals", "notEquals", "exists", "notExists"],
  analog: [
    "exists",
    "notExists",
    "greaterThan",
    "greaterThanOrEqual",
    "lessThan",
    "lessThanOrEqual",
    "equals",
    "notEquals",
  ],
  digital: ["equals", "notEquals", "exists", "notExists"],
  driverLogin: ["exists", "notExists", "equals", "notEquals"],
  driverGroup: ["exists", "notExists", "equals", "notEquals", "contains"],
  offline: ["equals", "notEquals"],
  geofence: ["exists", "notExists", "equals", "contains"],
  poi: ["exists", "notExists", "equals", "contains"],
  rendezvous: [
    "lessThan",
    "lessThanOrEqual",
    "greaterThan",
    "greaterThanOrEqual",
    "equals",
    "notEquals",
    "exists",
    "notExists",
  ],
  script: ["exists", "notExists", "equals", "contains"],
  speeding: ["greaterThan", "greaterThanOrEqual", "equals", "notEquals", "exists"],
  http: ["exists", "notExists", "equals", "contains"],
  custom: ["exists", "notExists", "equals", "notEquals", "contains"],
}

export const normalizeReportEventRuleSearch = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export const createReportEventRuleLocalId = (prefix = "rule-config") => {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
}

export const createEmptyReportEventRuleDraft = () => {
  return {
    id: null,
    label: "Nueva regla",
    description: "",
    source: "custom",
    active: true,
    alertType: "warning",
    schedule: {
      mode: "always",
      timeFrom: "",
      timeTo: "",
      weekdays: [],
    },
    activation: {
      mode: "immediate",
      delayMinutes: 1,
      autoExecuteAfterDelay: false,
    },
    groupIds: [],
    notifications: [],
    conditions: [],
  }
}

export const normalizeReportEventRuleGroups = (groups = []) => {
  return groups
    .filter((group) => group?.active !== false)
    .map((group) => ({
      id: String(group.id),
      name: group.name || "Grupo",
      companyId: String(group.companyId || ""),
      companyName: group.companyName || "",
    }))
}

export const filterReportEventRuleGroups = (groups = [], search = "") => {
  const term = normalizeReportEventRuleSearch(search)

  if (!term) return groups

  return groups.filter((group) => {
    return normalizeReportEventRuleSearch([group.name, group.companyName].join(" ")).includes(term)
  })
}

export const groupReportEventRuleSections = (groups = []) => {
  const sectionsByCompany = new Map()

  groups.forEach((group) => {
    const companyKey = group.companyId || group.companyName || "sin-empresa"

    if (!sectionsByCompany.has(companyKey)) {
      sectionsByCompany.set(companyKey, {
        companyKey,
        companyName: group.companyName || "Empresa",
        groups: [],
      })
    }

    sectionsByCompany.get(companyKey).groups.push(group)
  })

  return Array.from(sectionsByCompany.values()).sort((firstSection, secondSection) => {
    return firstSection.companyName.localeCompare(secondSection.companyName, "es")
  })
}

export const getReportEventRuleGroupScopeLabel = (groupIds = []) => {
  const groupCount = groupIds.length

  if (!groupCount) return "Todos"

  return `${groupCount} grupo${groupCount === 1 ? "" : "s"}`
}

export const getReportEventRuleScheduleScopeLabel = (schedule = {}) => {
  if (schedule.mode !== "calendar") return "Siempre"

  const weekdayCount = Array.isArray(schedule.weekdays) ? schedule.weekdays.length : 0
  const hasTimeRange = schedule.timeFrom || schedule.timeTo

  if (!weekdayCount && !hasTimeRange) return "Calendario"

  const parts = []

  if (hasTimeRange) parts.push("Horario")
  if (weekdayCount) parts.push(`${weekdayCount} dia${weekdayCount === 1 ? "" : "s"}`)

  return parts.join(" - ")
}

export const getReportEventRuleActivationScopeLabel = (activation = {}) => {
  if (activation.mode !== "delayed") return "Inmediato"

  return `${activation.delayMinutes || 1} min`
}
