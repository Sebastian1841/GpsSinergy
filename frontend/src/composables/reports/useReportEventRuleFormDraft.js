import { computed, ref } from "vue"

import {
  REPORT_EVENT_RULE_ALERT_TYPE_OPTIONS,
  REPORT_EVENT_RULE_EXPRESSION_OPTIONS,
  REPORT_EVENT_RULE_FIELD_OPTIONS,
  REPORT_EVENT_RULE_NOTIFICATION_OPTIONS,
  REPORT_EVENT_RULE_OPERATOR_OPTIONS,
  REPORT_EVENT_RULE_WEEKDAY_OPTIONS,
} from "./useReportEventRules.js"
import {
  REPORT_EVENT_RULE_EXPRESSION_FIELD_GROUPS,
  REPORT_EVENT_RULE_EXPRESSION_OPERATOR_GROUPS,
  REPORT_EVENT_RULE_EXPRESSION_TEMPLATES,
  REPORT_EVENT_RULE_FORM_MODULES,
  createEmptyReportEventRuleDraft,
  createReportEventRuleLocalId,
  filterReportEventRuleGroups,
  getReportEventRuleActivationScopeLabel,
  getReportEventRuleGroupScopeLabel,
  getReportEventRuleScheduleScopeLabel,
  groupReportEventRuleSections,
  normalizeReportEventRuleGroups,
} from "../../utils/reports/event-rules/reportEventRuleFormUtils.js"

const normalizeAlertType = (value) => {
  const normalizedValue = String(value || "").trim()

  return REPORT_EVENT_RULE_ALERT_TYPE_OPTIONS.some((alertType) => alertType.id === normalizedValue)
    ? normalizedValue
    : "warning"
}

const createLocalId = (prefix = "rule-config") => {
  return createReportEventRuleLocalId(prefix)
}

const getNotificationOption = (type) => {
  return (
    REPORT_EVENT_RULE_NOTIFICATION_OPTIONS.find((notification) => notification.id === type) ||
    REPORT_EVENT_RULE_NOTIFICATION_OPTIONS[0]
  )
}

const normalizeNotificationType = (type) => {
  return getNotificationOption(type)?.id || "text"
}

const cloneNotificationsForForm = (notifications = []) => {
  return Array.isArray(notifications)
    ? notifications.map((notification) => ({
        id: String(notification?.id || createLocalId("notification")),
        type: normalizeNotificationType(notification?.type),
        target: String(notification?.target || ""),
        message: String(notification?.message || ""),
        enabled: notification?.enabled !== false,
      }))
    : []
}

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

const operatorNeedsValue = (operatorId) => {
  return REPORT_EVENT_RULE_OPERATOR_OPTIONS.find((operator) => operator.id === operatorId)
    ?.needsValue
}

const getFieldOptionById = (fieldId) => {
  return REPORT_EVENT_RULE_FIELD_OPTIONS.find((field) => field.id === fieldId) || null
}

const getFieldOptionsForCondition = (condition = {}) => {
  const allowedFieldIds =
    REPORT_EVENT_RULE_EXPRESSION_FIELD_GROUPS[condition.expressionType] ||
    REPORT_EVENT_RULE_EXPRESSION_FIELD_GROUPS.custom

  return REPORT_EVENT_RULE_FIELD_OPTIONS.filter((field) => allowedFieldIds.includes(field.id))
}

const getOperatorOptionsForCondition = (condition = {}) => {
  const expressionOperatorIds =
    REPORT_EVENT_RULE_EXPRESSION_OPERATOR_GROUPS[condition.expressionType] ||
    REPORT_EVENT_RULE_EXPRESSION_OPERATOR_GROUPS.custom
  const fieldCategory = getFieldOptionById(condition.field)?.category
  const categoryOperatorIds =
    fieldCategory === "digital" || fieldCategory === "analog"
      ? REPORT_EVENT_RULE_EXPRESSION_OPERATOR_GROUPS[fieldCategory]
      : null
  const allowedOperatorIds = categoryOperatorIds
    ? expressionOperatorIds.filter((operatorId) => categoryOperatorIds.includes(operatorId))
    : expressionOperatorIds
  const normalizedOperatorIds = allowedOperatorIds.length
    ? allowedOperatorIds
    : expressionOperatorIds

  return REPORT_EVENT_RULE_OPERATOR_OPTIONS.filter((operator) =>
    normalizedOperatorIds.includes(operator.id),
  )
}

const isDigitalExpression = (condition = {}) => {
  return getFieldOptionById(condition.field)?.category === "digital"
}

const getFirstAllowedField = (condition = {}) => {
  return getFieldOptionsForCondition(condition)[0]?.id || "event"
}

const getFirstAllowedOperator = (condition = {}) => {
  return getOperatorOptionsForCondition(condition)[0]?.id || "exists"
}

const createConditionUiId = (condition = {}) => {
  return String(condition._uiId || condition.id || createLocalId("condition"))
}

const normalizeConditionForCategory = (condition = {}) => {
  const nextCondition = { ...condition }
  const allowedFields = getFieldOptionsForCondition(nextCondition).map((field) => field.id)
  const allowedOperators = getOperatorOptionsForCondition(nextCondition).map(
    (operator) => operator.id,
  )

  if (!allowedFields.includes(nextCondition.field)) {
    nextCondition.field = getFirstAllowedField(nextCondition)
  }

  if (!allowedOperators.includes(nextCondition.operator)) {
    nextCondition.operator = getFirstAllowedOperator(nextCondition)
  }

  if (!operatorNeedsValue(nextCondition.operator)) {
    nextCondition.value = ""
  } else if (
    isDigitalExpression(nextCondition) &&
    !["true", "false", "1", "0"].includes(String(nextCondition.value))
  ) {
    nextCondition.value = "true"
  }

  return nextCondition
}

const normalizeConditionForForm = (condition = {}) => {
  return normalizeConditionForCategory({
    ...condition,
    _uiId: createConditionUiId(condition),
  })
}

const serializeCondition = (condition = {}) => {
  const serializedCondition = { ...condition }

  delete serializedCondition._uiId

  return serializedCondition
}

const getRuleVehicleGroupIds = (rule = {}) => {
  return Array.isArray(rule.vehicleGroupIds)
    ? rule.vehicleGroupIds
    : Array.isArray(rule.groupIds)
      ? rule.groupIds
      : []
}

const cloneRule = (rule) => {
  return {
    id: rule.id || null,
    label: rule.label || "Nueva regla",
    description: rule.description || "",
    source: rule.source || "custom",
    active: rule.active !== false,
    alertType: normalizeAlertType(rule.alertType || rule.severity),
    schedule: {
      mode: rule.schedule?.mode === "calendar" ? "calendar" : "always",
      timeFrom: rule.schedule?.timeFrom || "",
      timeTo: rule.schedule?.timeTo || "",
      weekdays: Array.isArray(rule.schedule?.weekdays)
        ? rule.schedule.weekdays
            .map((weekday) => Number(weekday))
            .filter((weekday) => Number.isInteger(weekday) && weekday >= 0 && weekday <= 6)
        : [],
    },
    activation: {
      mode: rule.activation?.mode === "delayed" ? "delayed" : "immediate",
      delayMinutes:
        Number.isFinite(Number(rule.activation?.delayMinutes)) &&
        Number(rule.activation?.delayMinutes) > 0
          ? Math.round(Number(rule.activation.delayMinutes))
          : 1,
      autoExecuteAfterDelay: rule.activation?.autoExecuteAfterDelay === true,
    },
    groupIds: getRuleVehicleGroupIds(rule)
      .map((groupId) => String(groupId))
      .filter(Boolean),
    notifications: cloneNotificationsForForm(rule.notifications),
    conditions: Array.isArray(rule.conditions)
      ? rule.conditions.map((condition) =>
          normalizeConditionForForm({
            _uiId: createConditionUiId(condition),
            expressionType: condition.expressionType || inferExpressionType(condition),
            field: condition.field || "event",
            operator: condition.operator || "exists",
            value: condition.value ?? "",
          }),
        )
      : [],
  }
}

export function useReportEventRuleFormDraft({
  getGroups = () => [],
  getSelectedRule = () => null,
} = {}) {
  const activeModule = ref("general")
  const draft = ref(createEmptyReportEventRuleDraft())
  const groupSearch = ref("")
  const selectedExpressionType = ref("")
  const selectedNotificationType = ref("")

  const availableGroups = computed(() => {
    return normalizeReportEventRuleGroups(getGroups())
  })

  const filteredGroups = computed(() => {
    return filterReportEventRuleGroups(availableGroups.value, groupSearch.value)
  })

  const groupSections = computed(() => {
    return groupReportEventRuleSections(filteredGroups.value)
  })

  const groupScopeLabel = computed(() => {
    return getReportEventRuleGroupScopeLabel(draft.value.groupIds)
  })

  const scheduleScopeLabel = computed(() => {
    return getReportEventRuleScheduleScopeLabel(draft.value.schedule)
  })

  const activationScopeLabel = computed(() => {
    return getReportEventRuleActivationScopeLabel(draft.value.activation)
  })

  const canSaveDraft = computed(() => {
    const hasName = Boolean(String(draft.value.label || "").trim())
    const hasExpressions = draft.value.id === "all" || draft.value.conditions.length > 0

    return hasName && hasExpressions
  })

  const hydrateDraft = () => {
    const selectedRule = getSelectedRule()

    draft.value = selectedRule ? cloneRule(selectedRule) : createEmptyReportEventRuleDraft()
    activeModule.value = "general"
    groupSearch.value = ""
    selectedExpressionType.value = ""
    selectedNotificationType.value = ""
  }

  const updateDraftField = (field, value) => {
    draft.value = {
      ...draft.value,
      [field]: value,
    }
  }

  const getNotificationLabel = (type) => {
    return getNotificationOption(type)?.label || "Notificacion"
  }

  const getNotificationTargetLabel = (type) => {
    return getNotificationOption(type)?.targetLabel || "Destino"
  }

  const getNotificationMessageLabel = (type) => {
    return getNotificationOption(type)?.messageLabel || "Mensaje"
  }

  const isExpressionOptionDisabled = (expressionType) => {
    if (expressionType !== "script") return false

    return draft.value.conditions.some((condition) => condition.expressionType === "script")
  }

  const getExpressionLabel = (expressionType) => {
    return (
      REPORT_EVENT_RULE_EXPRESSION_OPTIONS.find((expression) => expression.id === expressionType)
        ?.label || "Anadir expresion"
    )
  }

  const createExpressionCondition = (expressionType = "custom") => {
    const template =
      REPORT_EVENT_RULE_EXPRESSION_TEMPLATES[expressionType] ||
      REPORT_EVENT_RULE_EXPRESSION_TEMPLATES.custom

    return normalizeConditionForForm({
      expressionType,
      ...template,
    })
  }

  const addSelectedExpression = () => {
    if (!selectedExpressionType.value) return

    if (isExpressionOptionDisabled(selectedExpressionType.value)) {
      selectedExpressionType.value = ""
      return
    }

    draft.value = {
      ...draft.value,
      conditions: [
        ...draft.value.conditions,
        createExpressionCondition(selectedExpressionType.value),
      ],
    }

    selectedExpressionType.value = ""
  }

  const handleSelectedExpressionChange = (expressionType) => {
    selectedExpressionType.value = expressionType
    addSelectedExpression()
  }

  const updateCondition = (index, field, value) => {
    const nextConditions = draft.value.conditions.map((condition, conditionIndex) => {
      if (conditionIndex !== index) return condition

      const nextCondition = {
        ...condition,
        [field]: value,
      }

      if (field === "operator" && !operatorNeedsValue(value)) {
        nextCondition.value = ""
      }

      return normalizeConditionForCategory(nextCondition)
    })

    draft.value = {
      ...draft.value,
      conditions: nextConditions,
    }
  }

  const removeCondition = (index) => {
    draft.value = {
      ...draft.value,
      conditions: draft.value.conditions.filter((_, conditionIndex) => conditionIndex !== index),
    }
  }

  const createNotification = (type = "text") => {
    return {
      id: createLocalId("notification"),
      type: normalizeNotificationType(type),
      target: "",
      message: "{regla} detectado en {patente}",
      enabled: true,
    }
  }

  const addSelectedNotification = () => {
    if (!selectedNotificationType.value) return

    draft.value = {
      ...draft.value,
      notifications: [
        ...draft.value.notifications,
        createNotification(selectedNotificationType.value),
      ],
    }

    selectedNotificationType.value = ""
  }

  const handleSelectedNotificationChange = (notificationType) => {
    selectedNotificationType.value = notificationType
    addSelectedNotification()
  }

  const updateNotification = (index, field, value) => {
    draft.value = {
      ...draft.value,
      notifications: draft.value.notifications.map((notification, notificationIndex) => {
        if (notificationIndex !== index) return notification

        return {
          ...notification,
          [field]: field === "type" ? normalizeNotificationType(value) : value,
        }
      }),
    }
  }

  const removeNotification = (index) => {
    draft.value = {
      ...draft.value,
      notifications: draft.value.notifications.filter(
        (_, notificationIndex) => notificationIndex !== index,
      ),
    }
  }

  const updateScheduleField = (field, value) => {
    if (draft.value.id === "all") return

    const nextSchedule = {
      ...draft.value.schedule,
      [field]: value,
    }

    if (field === "mode" && value === "always") {
      nextSchedule.timeFrom = ""
      nextSchedule.timeTo = ""
      nextSchedule.weekdays = []
    }

    draft.value = {
      ...draft.value,
      schedule: nextSchedule,
    }
  }

  const isWeekdaySelected = (weekdayId) => {
    return draft.value.schedule.weekdays.includes(Number(weekdayId))
  }

  const toggleWeekday = (weekdayId) => {
    if (draft.value.id === "all" || draft.value.schedule.mode !== "calendar") return

    const normalizedWeekdayId = Number(weekdayId)
    const selected = isWeekdaySelected(normalizedWeekdayId)

    draft.value = {
      ...draft.value,
      schedule: {
        ...draft.value.schedule,
        weekdays: selected
          ? draft.value.schedule.weekdays.filter((id) => id !== normalizedWeekdayId)
          : [...draft.value.schedule.weekdays, normalizedWeekdayId],
      },
    }
  }

  const updateActivationField = (field, value) => {
    if (draft.value.id === "all") return

    const nextActivation = {
      ...draft.value.activation,
      [field]: value,
    }

    if (field === "mode" && value === "immediate") {
      nextActivation.delayMinutes = 1
      nextActivation.autoExecuteAfterDelay = false
    }

    if (field === "delayMinutes") {
      const delayMinutes = Number(value)

      nextActivation.delayMinutes =
        Number.isFinite(delayMinutes) && delayMinutes > 0 ? Math.round(delayMinutes) : 1
    }

    draft.value = {
      ...draft.value,
      activation: nextActivation,
    }
  }

  const isGroupSelected = (groupId) => {
    return draft.value.groupIds.includes(String(groupId))
  }

  const toggleGroup = (groupId) => {
    if (draft.value.id === "all") return

    const normalizedGroupId = String(groupId)
    const selected = isGroupSelected(normalizedGroupId)

    draft.value = {
      ...draft.value,
      groupIds: selected
        ? draft.value.groupIds.filter((id) => id !== normalizedGroupId)
        : [...draft.value.groupIds, normalizedGroupId],
    }
  }

  const setSelectedGroups = (groupIds) => {
    draft.value = {
      ...draft.value,
      groupIds: Array.from(new Set(groupIds.map((groupId) => String(groupId)).filter(Boolean))),
    }
  }

  const selectFilteredGroups = () => {
    if (draft.value.id === "all") return

    setSelectedGroups([...draft.value.groupIds, ...filteredGroups.value.map((group) => group.id)])
  }

  const clearSelectedGroups = () => {
    if (draft.value.id === "all") return

    setSelectedGroups([])
  }

  const areAllCompanyGroupsSelected = (groups = []) => {
    return groups.every((group) => isGroupSelected(group.id))
  }

  const toggleCompanyGroups = (groups = []) => {
    if (draft.value.id === "all") return

    const groupIds = groups.map((group) => group.id)
    const shouldRemove = areAllCompanyGroupsSelected(groups)

    if (shouldRemove) {
      setSelectedGroups(draft.value.groupIds.filter((groupId) => !groupIds.includes(groupId)))
      return
    }

    setSelectedGroups([...draft.value.groupIds, ...groupIds])
  }

  const serializeDraft = () => {
    return {
      label: draft.value.label,
      description: draft.value.description,
      active: draft.value.id === "all" ? true : draft.value.active,
      alertType: draft.value.id === "all" ? "info" : draft.value.alertType,
      schedule:
        draft.value.id === "all"
          ? {
              mode: "always",
              timeFrom: "",
              timeTo: "",
              weekdays: [],
            }
          : draft.value.schedule,
      activation:
        draft.value.id === "all"
          ? {
              mode: "immediate",
              delayMinutes: 1,
              autoExecuteAfterDelay: false,
            }
          : draft.value.activation,
      vehicleGroupIds: draft.value.id === "all" ? [] : draft.value.groupIds,
      notifications: draft.value.id === "all" ? [] : draft.value.notifications,
      conditions: draft.value.id === "all" ? [] : draft.value.conditions.map(serializeCondition),
    }
  }

  return {
    formModules: REPORT_EVENT_RULE_FORM_MODULES,
    weekdayOptions: REPORT_EVENT_RULE_WEEKDAY_OPTIONS,
    expressionOptions: REPORT_EVENT_RULE_EXPRESSION_OPTIONS,
    notificationOptions: REPORT_EVENT_RULE_NOTIFICATION_OPTIONS,

    activeModule,
    draft,
    groupSearch,
    selectedExpressionType,
    selectedNotificationType,

    availableGroups,
    filteredGroups,
    groupSections,
    groupScopeLabel,
    scheduleScopeLabel,
    activationScopeLabel,
    canSaveDraft,

    hydrateDraft,
    updateDraftField,
    serializeDraft,

    getNotificationLabel,
    getNotificationTargetLabel,
    getNotificationMessageLabel,
    getExpressionLabel,
    getFieldOptionsForCondition,
    getOperatorOptionsForCondition,
    isDigitalExpression,
    isExpressionOptionDisabled,
    operatorNeedsValue,

    handleSelectedExpressionChange,
    updateCondition,
    removeCondition,
    handleSelectedNotificationChange,
    updateNotification,
    removeNotification,
    updateScheduleField,
    toggleWeekday,
    updateActivationField,
    selectFilteredGroups,
    clearSelectedGroups,
    toggleCompanyGroups,
    toggleGroup,
  }
}