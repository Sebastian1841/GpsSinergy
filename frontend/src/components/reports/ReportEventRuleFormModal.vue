<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[940] flex items-end justify-center bg-slate-950/55 p-2 sm:items-center sm:p-4"
      @click.self="closeModal"
    >
      <section
        class="flex max-h-[calc(100vh-16px)] w-full max-w-[920px] flex-col overflow-hidden rounded-t-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.34)] sm:max-h-[calc(100vh-32px)] sm:rounded-xl"
      >
        <header class="shrink-0 border-b border-white/10 bg-[#102372] px-4 py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                Reglas de evento
              </p>

              <h2 class="mt-0.5 truncate text-[15px] font-black text-white">
                {{ draft.id ? "Editar regla" : "Nueva regla" }}
              </h2>
            </div>

            <button
              type="button"
              class="rounded-lg px-2 py-1 text-[18px] font-black leading-none text-white/65 transition hover:bg-white/10 hover:text-white"
              @click="closeModal"
            >
              x
            </button>
          </div>
        </header>

        <div
          class="grid min-h-0 flex-1 grid-cols-1 overflow-hidden bg-[#f6f8fb] md:grid-cols-[190px_minmax(0,1fr)]"
        >
          <ReportEventRuleModuleNav
            :modules="formModules"
            :active-module="activeModule"
            @select="activeModule = $event"
          />

          <main class="min-h-0 overflow-auto p-3">
            <div
              class="rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
            >
              <ReportEventRuleGeneralSection
                v-if="activeModule === 'general'"
                :draft="draft"
                @update-field="updateDraftField"
              />

              <ReportEventRuleCalendarSection
                v-if="activeModule === 'calendar'"
                :draft="draft"
                :schedule-scope-label="scheduleScopeLabel"
                :weekday-options="REPORT_EVENT_RULE_WEEKDAY_OPTIONS"
                @update-schedule-field="updateScheduleField"
                @toggle-weekday="toggleWeekday"
              />

              <ReportEventRuleActivationSection
                v-if="activeModule === 'activation'"
                :draft="draft"
                :activation-scope-label="activationScopeLabel"
                @update-activation-field="updateActivationField"
              />

              <ReportEventRuleScopeSection
                v-if="activeModule === 'scope'"
                :draft="draft"
                :group-scope-label="groupScopeLabel"
                :available-groups="availableGroups"
                :filtered-groups="filteredGroups"
                :group-sections="groupSections"
                :group-search="groupSearch"
                @update-group-search="groupSearch = $event"
                @select-filtered-groups="selectFilteredGroups"
                @clear-selected-groups="clearSelectedGroups"
                @toggle-company-groups="toggleCompanyGroups"
                @toggle-group="toggleGroup"
              />

              <ReportEventRuleExpressionsSection
                v-if="activeModule === 'expressions'"
                :draft="draft"
                :selected-expression-type="selectedExpressionType"
                :expression-options="REPORT_EVENT_RULE_EXPRESSION_OPTIONS"
                :is-expression-option-disabled="isExpressionOptionDisabled"
                :get-expression-label="getExpressionLabel"
                :get-field-options-for-condition="getFieldOptionsForCondition"
                :get-operator-options-for-condition="getOperatorOptionsForCondition"
                :is-digital-expression="isDigitalExpression"
                :operator-needs-value="operatorNeedsValue"
                @add-expression="handleSelectedExpressionChange"
                @remove-condition="removeCondition"
                @update-condition="updateCondition"
              />

              <ReportEventRuleNotificationsSection
                v-if="activeModule === 'notifications'"
                :draft="draft"
                :selected-notification-type="selectedNotificationType"
                :notification-options="REPORT_EVENT_RULE_NOTIFICATION_OPTIONS"
                :get-notification-label="getNotificationLabel"
                :get-notification-target-label="getNotificationTargetLabel"
                :get-notification-message-label="getNotificationMessageLabel"
                @add-notification="handleSelectedNotificationChange"
                @remove-notification="removeNotification"
                @update-notification="updateNotification"
              />
            </div>
          </main>
        </div>

        <ReportEventRuleFormFooter
          :draft="draft"
          :can-save-draft="canSaveDraft"
          @close="closeModal"
          @delete="deleteSelectedRule"
          @save="saveDraft"
        />
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue"

import ReportEventRuleActivationSection from "./event-rules/ReportEventRuleActivationSection.vue"
import ReportEventRuleExpressionsSection from "./event-rules/ReportEventRuleExpressionsSection.vue"
import ReportEventRuleFormFooter from "./event-rules/ReportEventRuleFormFooter.vue"
import ReportEventRuleCalendarSection from "./event-rules/ReportEventRuleCalendarSection.vue"
import ReportEventRuleGeneralSection from "./event-rules/ReportEventRuleGeneralSection.vue"
import ReportEventRuleModuleNav from "./event-rules/ReportEventRuleModuleNav.vue"
import ReportEventRuleNotificationsSection from "./event-rules/ReportEventRuleNotificationsSection.vue"
import ReportEventRuleScopeSection from "./event-rules/ReportEventRuleScopeSection.vue"

import { useAuditTrail } from "../../composables/audit/useAuditTrail.js"
import {
  REPORT_EVENT_RULE_ALERT_TYPE_OPTIONS,
  REPORT_EVENT_RULE_EXPRESSION_OPTIONS,
  REPORT_EVENT_RULE_FIELD_OPTIONS,
  REPORT_EVENT_RULE_NOTIFICATION_OPTIONS,
  REPORT_EVENT_RULE_OPERATOR_OPTIONS,
  REPORT_EVENT_RULE_WEEKDAY_OPTIONS,
  useReportEventRules,
} from "../../composables/reports/useReportEventRules.js"
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

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  ruleId: {
    type: String,
    default: "",
  },
  groups: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["update:modelValue", "saved", "deleted"])

const { reportEventRules, createEventRule, updateEventRule, deleteEventRule } =
  useReportEventRules()
const { recordAudit } = useAuditTrail()

const formModules = REPORT_EVENT_RULE_FORM_MODULES

const activeModule = ref("general")
const draft = ref(createEmptyReportEventRuleDraft())
const groupSearch = ref("")
const selectedExpressionType = ref("")
const selectedNotificationType = ref("")

const updateDraftField = (field, value) => {
  draft.value = {
    ...draft.value,
    [field]: value,
  }
}

const selectedRule = computed(() => {
  return reportEventRules.value.find((rule) => rule.id === props.ruleId) || null
})

const availableGroups = computed(() => {
  return normalizeReportEventRuleGroups(props.groups)
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

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return
    hydrateDraft()
  },
  {
    immediate: true,
  },
)

watch(
  () => props.ruleId,
  () => {
    if (!props.modelValue) return
    hydrateDraft()
  },
)

function hydrateDraft() {
  draft.value = selectedRule.value ? cloneRule(selectedRule.value) : createEmptyReportEventRuleDraft()
  activeModule.value = "general"
  groupSearch.value = ""
  selectedExpressionType.value = ""
  selectedNotificationType.value = ""
}

function cloneRule(rule) {
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
    groupIds: Array.isArray(rule.groupIds)
      ? rule.groupIds.map((groupId) => String(groupId)).filter(Boolean)
      : [],
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

function closeModal() {
  emit("update:modelValue", false)
}

function normalizeAlertType(value) {
  const normalizedValue = String(value || "").trim()

  return REPORT_EVENT_RULE_ALERT_TYPE_OPTIONS.some((alertType) => alertType.id === normalizedValue)
    ? normalizedValue
    : "warning"
}

function createLocalId(prefix = "rule-config") {
  return createReportEventRuleLocalId(prefix)
}

function getNotificationOption(type) {
  return (
    REPORT_EVENT_RULE_NOTIFICATION_OPTIONS.find((notification) => notification.id === type) ||
    REPORT_EVENT_RULE_NOTIFICATION_OPTIONS[0]
  )
}

function normalizeNotificationType(type) {
  return getNotificationOption(type)?.id || "text"
}

function cloneNotificationsForForm(notifications = []) {
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

function getNotificationLabel(type) {
  return getNotificationOption(type)?.label || "Notificacion"
}

function getNotificationTargetLabel(type) {
  return getNotificationOption(type)?.targetLabel || "Destino"
}

function getNotificationMessageLabel(type) {
  return getNotificationOption(type)?.messageLabel || "Mensaje"
}

function inferExpressionType(condition = {}) {
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

function operatorNeedsValue(operatorId) {
  return REPORT_EVENT_RULE_OPERATOR_OPTIONS.find((operator) => operator.id === operatorId)
    ?.needsValue
}

function getFieldOptionsForCondition(condition = {}) {
  const allowedFieldIds =
    REPORT_EVENT_RULE_EXPRESSION_FIELD_GROUPS[condition.expressionType] ||
    REPORT_EVENT_RULE_EXPRESSION_FIELD_GROUPS.custom

  return REPORT_EVENT_RULE_FIELD_OPTIONS.filter((field) => allowedFieldIds.includes(field.id))
}

function getOperatorOptionsForCondition(condition = {}) {
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

function isDigitalExpression(condition = {}) {
  return getFieldOptionById(condition.field)?.category === "digital"
}

function getFieldOptionById(fieldId) {
  return REPORT_EVENT_RULE_FIELD_OPTIONS.find((field) => field.id === fieldId) || null
}

function isExpressionOptionDisabled(expressionType) {
  if (expressionType !== "script") return false

  return draft.value.conditions.some((condition) => condition.expressionType === "script")
}

function getFirstAllowedField(condition = {}) {
  return getFieldOptionsForCondition(condition)[0]?.id || "event"
}

function getFirstAllowedOperator(condition = {}) {
  return getOperatorOptionsForCondition(condition)[0]?.id || "exists"
}

function createConditionUiId(condition = {}) {
  return String(condition._uiId || condition.id || createLocalId("condition"))
}

function normalizeConditionForForm(condition = {}) {
  return normalizeConditionForCategory({
    ...condition,
    _uiId: createConditionUiId(condition),
  })
}

function serializeCondition(condition = {}) {
  const serializedCondition = { ...condition }

  delete serializedCondition._uiId

  return serializedCondition
}

function normalizeConditionForCategory(condition = {}) {
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

function getExpressionLabel(expressionType) {
  return (
    REPORT_EVENT_RULE_EXPRESSION_OPTIONS.find((expression) => expression.id === expressionType)
      ?.label || "Anadir expresion"
  )
}

function createExpressionCondition(expressionType = "custom") {
  const template =
    REPORT_EVENT_RULE_EXPRESSION_TEMPLATES[expressionType] ||
    REPORT_EVENT_RULE_EXPRESSION_TEMPLATES.custom

  return normalizeConditionForForm({
    expressionType,
    ...template,
  })
}

function addSelectedExpression() {
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

function handleSelectedExpressionChange(expressionType) {
  selectedExpressionType.value = expressionType
  addSelectedExpression()
}

function updateCondition(index, field, value) {
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

function removeCondition(index) {
  draft.value = {
    ...draft.value,
    conditions: draft.value.conditions.filter((_, conditionIndex) => conditionIndex !== index),
  }
}

function createNotification(type = "text") {
  return {
    id: createLocalId("notification"),
    type: normalizeNotificationType(type),
    target: "",
    message: "{regla} detectado en {patente}",
    enabled: true,
  }
}

function addSelectedNotification() {
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

function handleSelectedNotificationChange(notificationType) {
  selectedNotificationType.value = notificationType
  addSelectedNotification()
}

function updateNotification(index, field, value) {
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

function removeNotification(index) {
  draft.value = {
    ...draft.value,
    notifications: draft.value.notifications.filter(
      (_, notificationIndex) => notificationIndex !== index,
    ),
  }
}

function updateScheduleField(field, value) {
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

function isWeekdaySelected(weekdayId) {
  return draft.value.schedule.weekdays.includes(Number(weekdayId))
}

function toggleWeekday(weekdayId) {
  if (draft.value.id === "all" || draft.value.schedule.mode !== "calendar") return

  const normalizedWeekdayId = Number(weekdayId)
  const isSelected = isWeekdaySelected(normalizedWeekdayId)

  draft.value = {
    ...draft.value,
    schedule: {
      ...draft.value.schedule,
      weekdays: isSelected
        ? draft.value.schedule.weekdays.filter((id) => id !== normalizedWeekdayId)
        : [...draft.value.schedule.weekdays, normalizedWeekdayId],
    },
  }
}

function updateActivationField(field, value) {
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

function isGroupSelected(groupId) {
  return draft.value.groupIds.includes(String(groupId))
}

function toggleGroup(groupId) {
  if (draft.value.id === "all") return

  const normalizedGroupId = String(groupId)
  const isSelected = isGroupSelected(normalizedGroupId)

  draft.value = {
    ...draft.value,
    groupIds: isSelected
      ? draft.value.groupIds.filter((id) => id !== normalizedGroupId)
      : [...draft.value.groupIds, normalizedGroupId],
  }
}

function setSelectedGroups(groupIds) {
  draft.value = {
    ...draft.value,
    groupIds: Array.from(new Set(groupIds.map((groupId) => String(groupId)).filter(Boolean))),
  }
}

function selectFilteredGroups() {
  if (draft.value.id === "all") return

  setSelectedGroups([...draft.value.groupIds, ...filteredGroups.value.map((group) => group.id)])
}

function clearSelectedGroups() {
  if (draft.value.id === "all") return

  setSelectedGroups([])
}

function areAllCompanyGroupsSelected(groups = []) {
  return groups.every((group) => isGroupSelected(group.id))
}

function toggleCompanyGroups(groups = []) {
  if (draft.value.id === "all") return

  const groupIds = groups.map((group) => group.id)
  const shouldRemove = areAllCompanyGroupsSelected(groups)

  if (shouldRemove) {
    setSelectedGroups(draft.value.groupIds.filter((groupId) => !groupIds.includes(groupId)))
    return
  }

  setSelectedGroups([...draft.value.groupIds, ...groupIds])
}

function saveDraft() {
  if (!canSaveDraft.value) return

  const isEditing = Boolean(draft.value.id)
  const payload = {
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
    groupIds: draft.value.id === "all" ? [] : draft.value.groupIds,
    notifications: draft.value.id === "all" ? [] : draft.value.notifications,
    conditions: draft.value.id === "all" ? [] : draft.value.conditions.map(serializeCondition),
  }

  const savedRule = draft.value.id
    ? updateEventRule(draft.value.id, payload)
    : createEventRule(payload)

  if (savedRule) {
    recordAudit({
      module: "reportes",
      action: isEditing ? "event-rule:update" : "event-rule:create",
      entityType: "regla de evento",
      entityName: savedRule.label || payload.label || "Regla de evento",
      description: isEditing ? "Se actualizo una regla de evento." : "Se creo una regla de evento.",
      metadata: {
        ruleId: savedRule.id,
      },
    })

    emit("saved", savedRule)
    closeModal()
  }
}

function deleteSelectedRule() {
  if (!draft.value.id || draft.value.source !== "custom") return

  const deleted = deleteEventRule(draft.value.id)

  if (deleted) {
    recordAudit({
      module: "reportes",
      action: "event-rule:delete",
      entityType: "regla de evento",
      entityName: draft.value.label || "Regla de evento",
      severity: "warning",
      description: "Se elimino una regla de evento.",
      metadata: {
        ruleId: draft.value.id,
      },
    })

    emit("deleted", draft.value.id)
    closeModal()
  }
}
</script>
