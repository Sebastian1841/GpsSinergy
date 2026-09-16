<template>
  <section class="alarm-config-layout">
    <section class="grid min-h-0 grid-rows-[auto_1fr] gap-3">
      <AlarmRuleFilters
        v-model:search-term="searchTerm"
        v-model:selected-company-id="selectedCompanyId"
        v-model:selected-status="selectedStatus"
        v-model:selected-type="selectedType"
        :company-options="companyOptions"
        :feedback-message="feedbackMessage"
        :is-company-locked="isCompanyLocked"
        :type-options="typeOptions"
        @clear="clearFilters"
      />

      <AlarmRuleTable
        :can-manage="canManage"
        :is-creating-rule="isCreatingRule"
        :rows="visibleRows"
        :selected-rule-id="selectedRuleId"
        @delete-rule="handleDeleteRule"
        @select-rule="selectRule"
        @toggle-rule="handleToggleRule"
      />
    </section>

    <Teleport to="body">
      <div
        v-if="isEditorOpen"
        class="alarm-rule-modal-overlay"
        role="presentation"
        @click.self="closeEditor"
      >
        <aside
          class="alarm-rule-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="isCreatingRule ? 'Nueva alerta' : 'Editar alerta'"
        >
          <header
            class="flex items-start justify-between gap-4 border-b border-[#d8e0eb] px-6 py-5"
          >
            <div class="min-w-0">
              <h2 class="text-[24px] font-black leading-tight text-[#102372]">
                {{ isCreatingRule ? "Nueva alerta" : "Editar alerta" }}
              </h2>
              <p class="mt-1 text-[14px] font-semibold text-[#49618a]">
                Configura una nueva regla de monitoreo.
              </p>
            </div>

            <button
              type="button"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#102372] transition hover:bg-[#eef3ff] hover:text-[#ff6600]"
              aria-label="Cerrar formulario"
              @click="closeEditor"
            >
              <SvgIcon name="close" class="h-5 w-5" />
            </button>
          </header>

          <main class="alarm-rule-modal-body">
            <AlarmRuleGeneralSection
              :can-manage="canManage"
              :draft="draft"
              :type-options="typeOptions"
              @apply-type-preset="applyTypePreset"
            />

            <AlarmRuleScopeSection
              v-model:asset-search-term="assetSearchTerm"
              :asset-tag-options="assetTagOptions"
              :assets-for-draft-company="assetsForDraftCompany"
              :can-manage="canManage"
              :company-options="companyOptions"
              :draft="draft"
              :filtered-assets-for-draft-company="filteredAssetsForDraftCompany"
              :hidden-filtered-asset-count="hiddenFilteredAssetCount"
              :is-company-locked="isCompanyLocked"
              :is-draft-asset-selected="isDraftAssetSelected"
              :is-draft-asset-tag-selected="isDraftAssetTagSelected"
              :selected-draft-asset-count="selectedDraftAssetCount"
              :visible-assets-for-draft-company="visibleAssetsForDraftCompany"
              @company-change="handleCompanyChange"
              @select-all-assets="selectAllDraftAssets"
              @set-asset-scope="setDraftAssetScope"
              @toggle-asset="toggleDraftAsset"
              @toggle-asset-tag="toggleDraftAssetTag"
            />

            <AlarmRuleTriggerSection
              v-model:fuel-drop-amount="fuelDropAmount"
              v-model:geofence-search-term="geofenceSearchTerm"
              :battery-condition-options="batteryConditionOptions"
              :can-manage="canManage"
              :current-alert-type="currentAlertType"
              :current-type-preset="currentTypePreset"
              :draft="draft"
              :engine-state-options="engineStateOptions"
              :filtered-geofence-options="filteredGeofenceOptions"
              :geofence-event-options="geofenceEventOptions"
              :geofence-group-options="geofenceGroupOptions"
              :geofence-options-for-draft-company="geofenceOptionsForDraftCompany"
              :hidden-filtered-geofence-count="hiddenFilteredGeofenceCount"
              :is-draft-geofence-selected="isDraftGeofenceSelected"
              :selected-draft-geofence-count="selectedDraftGeofenceCount"
              :selected-draft-geofence-group-label="selectedDraftGeofenceGroupLabel"
              :visible-geofence-options="visibleGeofenceOptions"
              @apply-battery-condition-preset="applyBatteryConditionPreset"
              @geofence-group-change="handleGeofenceGroupChange"
              @select-all-geofences="selectAllDraftGeofences"
              @set-geofence-scope="setDraftGeofenceScope"
              @toggle-geofence="toggleDraftGeofence"
            />

            <AlarmRuleNotificationsSection :can-manage="canManage" :draft="draft" />
          </main>

          <footer class="border-t border-[#d8e0eb] px-6 py-5">
            <div class="flex items-center justify-between gap-2">
              <button
                type="button"
                class="inline-flex h-11 min-w-[7.5rem] items-center justify-center rounded-lg border border-[#cfd8e6] bg-white px-5 text-[13px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
                @click="closeEditor"
              >
                Cancelar
              </button>

              <button
                type="button"
                class="inline-flex h-11 min-w-[11rem] items-center justify-center rounded-lg bg-[#ff6600] px-6 text-[13px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
                :disabled="!canManage || !isDraftValid"
                @click="saveDraft"
              >
                {{ isCreatingRule ? "Crear alerta" : "Guardar" }}
              </button>
            </div>
          </footer>
        </aside>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue"

import { useAlarmRuleAssetScope } from "../../composables/alarms/useAlarmRuleAssetScope.js"
import {
  createInitialAlarmRuleDraft,
  useAlarmRuleDraft,
} from "../../composables/alarms/useAlarmRuleDraft.js"
import { useAlarmRuleGeofenceSelection } from "../../composables/alarms/useAlarmRuleGeofenceSelection.js"
import { useAutomaticAlertRulesService } from "../../services/alarms/useAutomaticAlertRulesService.js"
import { ALARM_TYPE_OPTIONS } from "../../utils/alarms/alarmUtils.js"
import {
  buildAutomaticAlertRuleRows,
  filterAutomaticAlertRuleRows,
} from "../../utils/alarms/automaticAlertRuleUtils.js"
import { normalizeId } from "../../utils/idUtils.js"
import AlarmRuleGeneralSection from "./AlarmRuleGeneralSection.vue"
import AlarmRuleFilters from "./AlarmRuleFilters.vue"
import AlarmRuleNotificationsSection from "./AlarmRuleNotificationsSection.vue"
import AlarmRuleScopeSection from "./AlarmRuleScopeSection.vue"
import AlarmRuleTable from "./AlarmRuleTable.vue"
import AlarmRuleTriggerSection from "./AlarmRuleTriggerSection.vue"
import SvgIcon from "../icons/SvgIcon.vue"

const props = defineProps({
  companyId: {
    type: String,
    default: "",
  },
  companies: {
    type: Array,
    default: () => [],
  },
  assets: {
    type: Array,
    default: () => [],
  },
  assetTags: {
    type: Array,
    default: () => [],
  },
  geofences: {
    type: Array,
    default: () => [],
  },
  geofenceGroups: {
    type: Array,
    default: () => [],
  },
  canManage: {
    type: Boolean,
    default: false,
  },
})

const { rules, createRule, updateRule, deleteRule, toggleRule } = useAutomaticAlertRulesService()

const typeOptions = ALARM_TYPE_OPTIONS
const batteryConditionOptions = [
  {
    id: "batteryVoltage",
    label: "Voltaje",
    value: 11.8,
    unit: "V",
  },
  {
    id: "batteryPercent",
    label: "Porcentaje",
    value: 20,
    unit: "%",
  },
]
const geofenceEventOptions = [
  {
    id: "enter",
    label: "Entrada",
    value: "Ingresar",
  },
  {
    id: "exit",
    label: "Salida",
    value: "Salir",
  },
  {
    id: "both",
    label: "Entrada o salida",
    value: "Entrada o salida",
  },
]
const engineStateOptions = [
  {
    id: "any",
    label: "Cualquier estado",
  },
  {
    id: "on",
    label: "Encendido",
  },
  {
    id: "off",
    label: "Apagado",
  },
]

const searchTerm = ref("")
const selectedType = ref("all")
const selectedCompanyId = ref("all")
const selectedStatus = ref("all")
const selectedRuleId = ref("")
const isCreatingRule = ref(false)
const isEditorOpen = ref(false)
const feedbackMessage = ref("")
const draft = ref(createInitialAlarmRuleDraft())

let feedbackTimeoutId = null

const assetSource = computed(() => props.assets)
const assetTagSource = computed(() => props.assetTags)
const geofenceSource = computed(() => props.geofences)
const geofenceGroupSource = computed(() => props.geofenceGroups)
const normalizedCompanyId = computed(() => normalizeId(props.companyId))
const isCompanyLocked = computed(() => Boolean(normalizedCompanyId.value))

const companyOptions = computed(() => {
  const options = props.companies
    .map((company) => ({
      id: normalizeId(company.id),
      label: company.name || company.shortName || "Empresa",
    }))
    .filter((company) => company.id)
    .sort((left, right) => left.label.localeCompare(right.label, "es", { sensitivity: "base" }))

  if (!normalizedCompanyId.value) {
    return options
  }

  return options.filter((company) => company.id === normalizedCompanyId.value)
})

const fallbackCompanyId = computed(() => {
  return normalizedCompanyId.value || companyOptions.value[0]?.id || ""
})

const {
  assetSearchTerm,
  assetTagOptions,
  assetsForDraftCompany,
  clearAssetSearchTerm,
  filteredAssetsForDraftCompany,
  hiddenFilteredAssetCount,
  isDraftAssetSelected,
  isDraftAssetTagSelected,
  selectAllDraftAssets,
  selectedDraftAssetCount,
  selectedDraftAssetIds,
  setDraftAssetScope,
  toggleDraftAsset,
  toggleDraftAssetTag,
  visibleAssetsForDraftCompany,
} = useAlarmRuleAssetScope({
  assets: assetSource,
  assetTags: assetTagSource,
  draft,
})

const {
  clearGeofenceSearchTerm,
  filteredGeofenceOptions,
  geofenceGroupOptions,
  geofenceOptionsForDraftCompany,
  geofenceSearchTerm,
  getSelectedGeofenceNames,
  handleGeofenceGroupChange,
  hiddenFilteredGeofenceCount,
  isDraftGeofenceSelected,
  selectAllDraftGeofences,
  selectedDraftGeofenceCount,
  selectedDraftGeofenceGroup,
  selectedDraftGeofenceGroupLabel,
  selectedDraftGeofenceIds,
  setDraftGeofenceScope,
  toggleDraftGeofence,
  visibleGeofenceOptions,
} = useAlarmRuleGeofenceSelection({
  draft,
  geofenceGroups: geofenceGroupSource,
  geofences: geofenceSource,
})

const {
  applyBatteryConditionPreset,
  applyTypePreset: applyDraftTypePreset,
  cloneDraft,
  createConditionFromType,
  createDraft,
  currentAlertType,
  currentTypePreset,
  fuelDropAmount,
  getDraftPayload,
  isDraftValid,
} = useAlarmRuleDraft({
  batteryConditionOptions,
  draft,
  fallbackCompanyId,
  getSelectedGeofenceNames,
  selectedDraftAssetIds,
  selectedDraftGeofenceGroup,
  selectedDraftGeofenceIds,
})

const ruleRows = computed(() => {
  return buildAutomaticAlertRuleRows({
    rules: rules.value,
    companies: props.companies,
    assets: props.assets,
    companyId: normalizedCompanyId.value,
  })
})

const filteredRows = computed(() => {
  const companyFilterId = normalizeId(selectedCompanyId.value)
  const companyFilteredRows =
    companyFilterId && companyFilterId !== "all"
      ? ruleRows.value.filter((rule) => rule.companyId === companyFilterId)
      : ruleRows.value

  return filterAutomaticAlertRuleRows({
    rows: companyFilteredRows,
    searchTerm: searchTerm.value,
    selectedStatus: selectedStatus.value,
    selectedType: selectedType.value,
  })
})

const visibleRows = computed(() => {
  return [...filteredRows.value].sort((left, right) => {
    const nameDelta = left.name.localeCompare(right.name, "es", { sensitivity: "base" })

    if (nameDelta) return nameDelta

    return left.id.localeCompare(right.id, "es", { sensitivity: "base" })
  })
})

const selectedRule = computed(() => {
  if (!selectedRuleId.value) return null

  return ruleRows.value.find((rule) => rule.id === selectedRuleId.value) || null
})

const showFeedback = (message) => {
  feedbackMessage.value = message

  if (feedbackTimeoutId && typeof window !== "undefined") {
    window.clearTimeout(feedbackTimeoutId)
  }

  if (typeof window !== "undefined") {
    feedbackTimeoutId = window.setTimeout(() => {
      feedbackMessage.value = ""
      feedbackTimeoutId = null
    }, 2200)
  }
}

const clearFilters = () => {
  searchTerm.value = ""
  selectedType.value = "all"
  selectedCompanyId.value = normalizedCompanyId.value || "all"
  selectedStatus.value = "all"
}

const loadRuleDraft = (rule, { openEditor = true } = {}) => {
  if (!rule) return

  selectedRuleId.value = rule.id
  isCreatingRule.value = false
  clearAssetSearchTerm()
  clearGeofenceSearchTerm()
  draft.value = cloneDraft(rule)

  if (openEditor) {
    isEditorOpen.value = true
  }
}

const resetDraftFromSelection = ({ openEditor = true } = {}) => {
  const fallbackRule = selectedRule.value || visibleRows.value[0] || ruleRows.value[0]

  if (fallbackRule) {
    loadRuleDraft(fallbackRule, { openEditor })
    isCreatingRule.value = false
    return
  }

  draft.value = createDraft()
  isCreatingRule.value = true

  if (openEditor) {
    isEditorOpen.value = true
  }
}

const selectRule = (ruleId) => {
  const rule = ruleRows.value.find((item) => item.id === ruleId)

  if (!rule) return

  loadRuleDraft(rule)
}

const startNewRule = ({ openEditor = true } = {}) => {
  selectedRuleId.value = ""
  isCreatingRule.value = true
  isEditorOpen.value = openEditor
  clearAssetSearchTerm()
  clearGeofenceSearchTerm()
  draft.value = createDraft()
}

defineExpose({
  startNewRule,
})

const applyTypePreset = () => {
  clearGeofenceSearchTerm()
  applyDraftTypePreset()
}

const handleCompanyChange = () => {
  clearAssetSearchTerm()
  clearGeofenceSearchTerm()
  draft.value.companyId = normalizeId(draft.value.companyId)
  draft.value.assetScope = {
    type: "all",
    assetIds: [],
    assetTagIds: [],
  }

  if (currentAlertType.value === "geofence") {
    draft.value.condition = createConditionFromType("geofence")
  }
}

const closeEditor = () => {
  resetDraftFromSelection({ openEditor: false })
  isEditorOpen.value = false
}

const saveDraft = () => {
  if (!props.canManage || !isDraftValid.value) return

  const wasCreatingRule = isCreatingRule.value
  const payload = getDraftPayload()
  const savedRule = draft.value.id ? updateRule(draft.value.id, payload) : createRule(payload)

  if (!savedRule) return

  selectedRuleId.value = savedRule.id
  isCreatingRule.value = false
  draft.value = cloneDraft(savedRule)
  isEditorOpen.value = false

  showFeedback(wasCreatingRule ? "Alerta creada." : "Alerta guardada.")
}

const handleDeleteRule = (ruleId = draft.value.id) => {
  if (!props.canManage || !ruleId) return

  if (typeof window !== "undefined" && !window.confirm("Eliminar esta alerta automatica?")) {
    return
  }

  const deletedRule = deleteRule(ruleId)

  if (!deletedRule) return

  if (selectedRuleId.value === deletedRule.id) {
    selectedRuleId.value = ""
    draft.value = createDraft()
    isCreatingRule.value = true
  }

  showFeedback("Alerta eliminada.")
}

const handleToggleRule = (ruleId) => {
  if (!props.canManage) return

  const updatedRule = toggleRule(ruleId)

  if (!updatedRule) return

  if (selectedRuleId.value === updatedRule.id && !isCreatingRule.value) {
    draft.value = cloneDraft(updatedRule)
  }

  showFeedback(updatedRule.enabled ? "Alerta activada." : "Alerta desactivada.")
}

watch(
  ruleRows,
  (rows) => {
    if (isCreatingRule.value) return

    if (selectedRuleId.value && rows.some((rule) => rule.id === selectedRuleId.value)) {
      resetDraftFromSelection({ openEditor: isEditorOpen.value })
      return
    }

    const firstRule = rows[0]

    if (firstRule) {
      loadRuleDraft(firstRule, { openEditor: isEditorOpen.value })
      return
    }

    startNewRule({ openEditor: isEditorOpen.value })
  },
  {
    immediate: true,
  },
)

watch(
  normalizedCompanyId,
  (companyId) => {
    selectedCompanyId.value = companyId || "all"
  },
  {
    immediate: true,
  },
)

watch(
  fallbackCompanyId,
  (companyId) => {
    if (draft.value.companyId) return

    draft.value.companyId = companyId
  },
  {
    immediate: true,
  },
)

onBeforeUnmount(() => {
  if (feedbackTimeoutId && typeof window !== "undefined") {
    window.clearTimeout(feedbackTimeoutId)
  }
})
</script>

<style scoped>
.alarm-config-layout {
  display: grid;
  height: 100%;
  min-height: 0;
  gap: 0.75rem;
}

.alarm-rule-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgb(15 23 42 / 0.48);
}

.alarm-rule-modal {
  display: grid;
  width: min(70rem, calc(100vw - 2.5rem));
  max-height: min(60rem, calc(100vh - 2.5rem));
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid #d8e0eb;
  background: #ffffff;
  box-shadow: 0 20px 56px rgb(15 23 42 / 0.24);
  contain: layout paint;
}

.alarm-rule-modal-body {
  display: grid;
  min-height: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  overflow-y: auto;
  padding: 1rem 1.25rem 0.875rem;
}

@media (max-width: 767px) {
  .alarm-rule-modal {
    width: calc(100vw - 1rem);
    max-height: calc(100vh - 1rem);
  }

  .alarm-rule-modal-body {
    grid-template-columns: minmax(0, 1fr);
    padding: 0.875rem;
  }
}
</style>
