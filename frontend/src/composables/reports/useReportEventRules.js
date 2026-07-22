import { computed, ref } from "vue"

import { REPORT_EVENT_RULES } from "../../data/mockReportTemplates.js"
import {
  DEFAULT_ACTIVATION,
  DEFAULT_ALERT_TYPE_BY_RULE_ID,
  DEFAULT_RULE_CONDITIONS,
  DEFAULT_SCHEDULE,
  REPORT_EVENT_RULE_ALERT_TYPE_OPTIONS,
  REPORT_EVENT_RULE_NOTIFICATION_OPTIONS,
} from "../../data/reportEventRuleConfig.js"
import { readJsonStorage, writeJsonStorage } from "../../services/storage/browserStorage.js"

export {
  REPORT_EVENT_RULE_ALERT_TYPE_OPTIONS,
  REPORT_EVENT_RULE_EXPRESSION_OPTIONS,
  REPORT_EVENT_RULE_FIELD_OPTIONS,
  REPORT_EVENT_RULE_NOTIFICATION_OPTIONS,
  REPORT_EVENT_RULE_OPERATOR_OPTIONS,
  REPORT_EVENT_RULE_WEEKDAY_OPTIONS,
} from "../../data/reportEventRuleConfig.js"

const REPORT_EVENT_RULES_STORAGE_KEY = "sinergy-report-event-rules"

const normalizeRuleIdKey = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
}

const SYSTEM_RULE_ID_BY_NORMALIZED_KEY = new Map(
  REPORT_EVENT_RULES.map((rule) => [normalizeRuleIdKey(rule.id), rule.id]),
)

const inferExpressionType = (condition = {}) => {
  if (condition.field === "geofence") return "geofence"
  if (condition.field === "poi") return "poi"
  if (condition.field === "script") return "script"
  if (condition.field === "http") return "http"
  if (condition.field === "driver") return "driverLogin"
  if (condition.field === "driverGroup") return "driverGroup"
  if (["rendezvous", "rendezvousDistance"].includes(condition.field)) return "rendezvous"
  if (["speeding", "speedingDelta", "speedLimit"].includes(condition.field)) return "speeding"
  if (
    ["ignition", "gpsFix", "digitalInput1", "digitalInput2", "speeding"].includes(condition.field)
  ) {
    return "digital"
  }
  if (condition.field === "state" && condition.value === "offline") return "offline"
  if (
    [
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
    ].includes(condition.field)
  ) {
    return "analog"
  }

  return "custom"
}

const cloneConditions = (conditions) => {
  return Array.isArray(conditions)
    ? conditions.map((condition) => ({
        expressionType: condition?.expressionType || inferExpressionType(condition),
        field: condition?.field || "event",
        operator: condition?.operator || "exists",
        value: condition?.value ?? "",
      }))
    : []
}

const cloneGroupIds = (groupIds) => {
  return Array.isArray(groupIds)
    ? Array.from(new Set(groupIds.map((groupId) => String(groupId || "").trim()).filter(Boolean)))
    : []
}

const makeRuleConfigId = () => {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `rule-config-${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
}

const normalizeAlertType = (value) => {
  const normalizedValue = String(value || "").trim()

  return REPORT_EVENT_RULE_ALERT_TYPE_OPTIONS.some((option) => option.id === normalizedValue)
    ? normalizedValue
    : "warning"
}

const normalizeNotificationType = (value) => {
  const normalizedValue = String(value || "").trim()

  return REPORT_EVENT_RULE_NOTIFICATION_OPTIONS.some((option) => option.id === normalizedValue)
    ? normalizedValue
    : "text"
}

const cloneNotifications = (notifications) => {
  return Array.isArray(notifications)
    ? notifications
        .map((notification) => ({
          id: String(notification?.id || makeRuleConfigId()),
          type: normalizeNotificationType(notification?.type),
          target: String(notification?.target || "").trim(),
          message: String(notification?.message || "").trim(),
          enabled: notification?.enabled !== false,
        }))
        .filter((notification) => notification.type)
    : []
}

const normalizeScheduleTime = (value) => {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/)

  if (!match) return ""

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return ""
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return ""

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

const normalizeSchedule = (schedule = {}) => {
  const mode = schedule.mode === "calendar" ? "calendar" : "always"
  const weekdays = Array.isArray(schedule.weekdays)
    ? Array.from(
        new Set(
          schedule.weekdays
            .map((weekday) => Number(weekday))
            .filter((weekday) => Number.isInteger(weekday) && weekday >= 0 && weekday <= 6),
        ),
      )
    : []

  return {
    mode,
    timeFrom: normalizeScheduleTime(schedule.timeFrom),
    timeTo: normalizeScheduleTime(schedule.timeTo),
    weekdays,
  }
}

const normalizeActivation = (activation = {}) => {
  const delayMinutes = Number(activation.delayMinutes)

  return {
    mode: activation.mode === "delayed" ? "delayed" : "immediate",
    delayMinutes: Number.isFinite(delayMinutes) && delayMinutes > 0 ? Math.round(delayMinutes) : 1,
    autoExecuteAfterDelay: activation.autoExecuteAfterDelay === true,
  }
}

const createSeedRules = () => {
  return REPORT_EVENT_RULES.map((rule) => ({
    ...rule,
    source: "system",
    active: true,
    alertType: normalizeAlertType(
      rule.alertType || rule.severity || DEFAULT_ALERT_TYPE_BY_RULE_ID[rule.id],
    ),
    schedule: DEFAULT_SCHEDULE,
    activation: DEFAULT_ACTIVATION,
    groupIds: [],
    notifications: cloneNotifications(rule.notifications),
    conditions: cloneConditions(DEFAULT_RULE_CONDITIONS[rule.id]),
  }))
}

const seedRules = createSeedRules()

export const normalizeReportEventRuleId = (value) => {
  const rawValue = String(value || "").trim()

  if (!rawValue) return ""

  const systemRuleId = SYSTEM_RULE_ID_BY_NORMALIZED_KEY.get(normalizeRuleIdKey(rawValue))

  if (systemRuleId) return systemRuleId

  return rawValue
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const normalizeRuleId = normalizeReportEventRuleId

const createRuleId = (label = "regla") => {
  const baseId = normalizeRuleId(label) || "regla"
  const suffix =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : String(Date.now()).slice(-8)

  return `${baseId}-${suffix}`
}

const normalizeEventRule = (rule = {}) => {
  return {
    id: normalizeRuleId(rule.id) || createRuleId(rule.label),
    label: String(rule.label || "Nueva regla").trim(),
    description: String(rule.description || "").trim(),
    source: rule.source === "custom" ? "custom" : "system",
    active: rule.active !== false,
    alertType: normalizeAlertType(rule.alertType || rule.severity),
    severity: normalizeAlertType(rule.alertType || rule.severity),
    schedule: normalizeSchedule(rule.schedule),
    activation: normalizeActivation(rule.activation),
    groupIds: cloneGroupIds(rule.groupIds),
    notifications: cloneNotifications(rule.notifications),
    conditions: cloneConditions(rule.conditions),
  }
}

const readStoredRules = () => {
  const parsedRules = readJsonStorage(REPORT_EVENT_RULES_STORAGE_KEY, null)

  return Array.isArray(parsedRules) ? parsedRules : null
}

const persistRules = (rules) => {
  writeJsonStorage(REPORT_EVENT_RULES_STORAGE_KEY, rules)
}

const mergeStoredRulesWithSeed = (storedRules = []) => {
  const storedRulesById = new Map(
    storedRules.map((rule) => [normalizeRuleId(rule.id), normalizeEventRule(rule)]),
  )

  const mergedSeedRules = seedRules.map((seedRule) => {
    const storedRule = storedRulesById.get(seedRule.id)

    if (!storedRule) return seedRule

    storedRulesById.delete(seedRule.id)

    return normalizeEventRule({
      ...seedRule,
      ...storedRule,
      id: seedRule.id,
      source: "system",
      conditions: storedRule.conditions.length ? storedRule.conditions : seedRule.conditions,
    })
  })

  const customRules = Array.from(storedRulesById.values()).filter((rule) => {
    return rule.source === "custom"
  })

  return [...mergedSeedRules, ...customRules]
}

const getInitialRules = () => {
  const storedRules = readStoredRules()

  if (storedRules?.length) return mergeStoredRulesWithSeed(storedRules)

  return seedRules
}

const reportEventRules = ref(getInitialRules())

const setRules = (rules) => {
  reportEventRules.value = rules.map(normalizeEventRule)
  persistRules(reportEventRules.value)
}

export const getActiveReportEventRulesSnapshot = () => {
  return reportEventRules.value.filter((rule) => rule.active !== false)
}

export const getReportEventRulesByIdSnapshot = () => {
  return new Map(reportEventRules.value.map((rule) => [rule.id, rule]))
}

export function useReportEventRules() {
  const activeEventRules = computed(() => {
    return reportEventRules.value.filter((rule) => rule.active !== false)
  })

  const eventRulesById = computed(() => {
    return new Map(reportEventRules.value.map((rule) => [rule.id, rule]))
  })

  const createEventRule = (payload = {}) => {
    const nextRule = normalizeEventRule({
      id: createRuleId(payload.label || "regla"),
      label: payload.label || "Nueva regla",
      description: payload.description || "",
      source: "custom",
      active: payload.active !== false,
      alertType: payload.alertType,
      schedule: payload.schedule,
      activation: payload.activation,
      groupIds: payload.groupIds,
      notifications: payload.notifications,
      conditions: payload.conditions?.length
        ? payload.conditions
        : [
            {
              field: "event",
              operator: "exists",
              value: "",
            },
          ],
    })

    setRules([...reportEventRules.value, nextRule])

    return nextRule
  }

  const updateEventRule = (ruleId, changes = {}) => {
    let updatedRule = null

    const nextRules = reportEventRules.value.map((rule) => {
      if (normalizeRuleId(rule.id) !== normalizeRuleId(ruleId)) return rule

      updatedRule = normalizeEventRule({
        ...rule,
        ...changes,
        id: rule.id,
        source: rule.source,
      })

      return updatedRule
    })

    setRules(nextRules)

    return updatedRule
  }

  const deleteEventRule = (ruleId) => {
    const normalizedRuleId = normalizeRuleId(ruleId)
    const rule = eventRulesById.value.get(normalizedRuleId)

    if (!rule || rule.source !== "custom") return false

    setRules(
      reportEventRules.value.filter((eventRule) => {
        return normalizeRuleId(eventRule.id) !== normalizedRuleId
      }),
    )

    return true
  }

  const resetEventRules = () => {
    setRules(seedRules)
  }

  return {
    reportEventRules,
    activeEventRules,
    eventRulesById,

    createEventRule,
    updateEventRule,
    deleteEventRule,
    resetEventRules,
  }
}
