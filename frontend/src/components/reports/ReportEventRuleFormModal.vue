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
                :weekday-options="weekdayOptions"
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
                :expression-options="expressionOptions"
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
                :notification-options="notificationOptions"
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
import { computed, watch } from "vue"

import ReportEventRuleActivationSection from "./event-rules/ReportEventRuleActivationSection.vue"
import ReportEventRuleExpressionsSection from "./event-rules/ReportEventRuleExpressionsSection.vue"
import ReportEventRuleFormFooter from "./event-rules/ReportEventRuleFormFooter.vue"
import ReportEventRuleCalendarSection from "./event-rules/ReportEventRuleCalendarSection.vue"
import ReportEventRuleGeneralSection from "./event-rules/ReportEventRuleGeneralSection.vue"
import ReportEventRuleModuleNav from "./event-rules/ReportEventRuleModuleNav.vue"
import ReportEventRuleNotificationsSection from "./event-rules/ReportEventRuleNotificationsSection.vue"
import ReportEventRuleScopeSection from "./event-rules/ReportEventRuleScopeSection.vue"

import { useAuditTrail } from "../../composables/audit/useAuditTrail.js"
import { useReportEventRuleFormDraft } from "../../composables/reports/useReportEventRuleFormDraft.js"
import { useReportEventRules } from "../../composables/reports/useReportEventRules.js"

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

const selectedRule = computed(() => {
  return reportEventRules.value.find((rule) => rule.id === props.ruleId) || null
})

const {
  formModules,
  weekdayOptions,
  expressionOptions,
  notificationOptions,
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
} = useReportEventRuleFormDraft({
  getGroups: () => props.groups,
  getSelectedRule: () => selectedRule.value,
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

function closeModal() {
  emit("update:modelValue", false)
}

function saveDraft() {
  if (!canSaveDraft.value) return

  const isEditing = Boolean(draft.value.id)
  const payload = serializeDraft()

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
