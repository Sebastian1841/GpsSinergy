<template>
  <section
    class="alarm-config-layout"
    :class="{ 'alarm-config-configuration': presentation === 'configuration' }"
  >
    <div v-if="rulesLoadError" class="rules-load-error" role="alert">
      <span>{{ rulesLoadError }}</span>
      <button type="button" @click="reloadRules">Reintentar lectura</button>
    </div>
    <div v-else-if="rulesWriteError && !isEditorOpen" class="rules-load-error" role="alert">{{ rulesWriteError }}</div>
    <section
      v-if="presentation !== 'configuration'"
      class="grid min-h-0 grid-rows-[auto_1fr] gap-3"
    >
      <AlarmRuleFilters
        v-model:search-term="searchTerm"
        v-model:selected-company-id="selectedCompanyId"
        v-model:selected-status="selectedStatus"
        v-model:selected-type="selectedType"
        :company-options="companyOptions"
        :can-manage="canManage && !rulesLoadError"
        :feedback-message="feedbackMessage"
        :is-company-locked="isCompanyLocked"
        :type-options="typeOptions"
        @clear="clearFilters"
        @create="startNewRule"
      />

      <AlarmRuleTable
        :can-manage="canManage && !rulesLoadError"
        :is-creating-rule="isCreatingRule"
        :rows="visibleRows"
        :selected-rule-id="selectedRuleId"
        @delete-rule="handleDeleteRule"
        @select-rule="selectRule"
        @toggle-rule="handleToggleRule"
      />
    </section>

    <section v-else class="configuration-rule-list">
      <AlarmRuleFilters
        v-model:search-term="searchTerm"
        v-model:selected-company-id="selectedCompanyId"
        v-model:selected-status="selectedStatus"
        v-model:selected-type="selectedType"
        class="configuration-rule-toolbar"
        integrated-clear
        :company-options="companyOptions"
        :can-manage="canManage && !rulesLoadError"
        :feedback-message="feedbackMessage"
        :is-company-locked="isCompanyLocked"
        :type-options="typeOptions"
        :inbox-to="inboxTo"
        @clear="clearFilters"
        @create="startNewRule()"
      />
      <div class="configuration-rule-rows" aria-label="Reglas configuradas">
        <article v-for="rule in configurationRows" :key="rule.id" class="configuration-rule-row">
          <span
            class="configuration-rule-type-icon"
            :class="ruleTypeVisual(rule.type).tone"
            aria-hidden="true"
          >
            <SvgIcon :name="ruleTypeVisual(rule.type).icon" />
          </span>
          <div class="configuration-rule-copy">
            <div class="configuration-rule-title">
              <h2>{{ rule.name }}</h2>
              <span class="rule-active-badge" :class="{ inactive: !rule.enabled }">{{
                rule.enabled ? "Activa" : "Inactiva"
              }}</span
              ><span class="rule-level-badge" :class="{ critical: rule.severity === 'critical' }">{{
                rule.severityLabel
              }}</span>
            </div>
            <p class="configuration-rule-description">
              {{ rule.description || rule.conditionLabel }}
            </p>
            <div class="configuration-rule-extra">
              <p v-if="rule.description?.trim() && rule.description.trim() !== rule.conditionLabel?.trim()" class="configuration-rule-condition">Condición: {{ rule.conditionLabel }}</p>
              <div class="configuration-rule-channels">
                <span v-if="rule.notificationChannels.inApp">En plataforma</span
                ><span v-if="rule.notificationChannels.email" class="muted"
                  >Correo · sin proveedor</span
                ><span v-if="rule.notificationChannels.whatsapp" class="muted"
                  >WhatsApp · sin proveedor</span
                >
              </div>
            </div>
          </div>
          <div class="configuration-rule-summary">
            <dl>
              <div>
                <dt>{{ rule.type === "ignition" ? "Horario" : "Umbral" }}</dt>
                <dd>{{ ruleThreshold(rule) }}</dd>
              </div>
              <div>
                <dt>Alcance</dt>
                <dd>
                  {{
                    rule.assetScope.type === "all"
                      ? "Toda la flota"
                      : rule.assetScope.type === "specific"
                        ? rule.selectedAssetCount +
                          (rule.selectedAssetCount === 1
                            ? " activo específico"
                            : " activos específicos")
                        : rule.targetLabel
                  }}
                </dd>
              </div>
              <div>
                <dt>Vigencia</dt>
                <dd>
                  {{
                    rule.schedule.type === "always"
                      ? "Siempre"
                      : rule.schedule.from + " - " + rule.schedule.to
                  }}
                </dd>
              </div>
            </dl>
            <div class="configuration-rule-actions">
              <button v-if="canManage && !rulesLoadError" type="button" @click="selectRule(rule.id)">Editar</button>
              <button
                type="button"
                role="switch"
                class="configuration-rule-switch"
                :aria-checked="rule.enabled"
                :aria-label="(rule.enabled ? 'Desactivar ' : 'Activar ') + rule.name"
                :disabled="Boolean(rulesLoadError) || !canManage"
                @click="handleToggleRule(rule.id)"
              >
                <span></span>
              </button>
            </div>
          </div>
        </article>
        <p v-if="!configurationRows.length" class="configuration-rule-empty">
          {{ searchTerm ? "No se encontraron reglas." : "No hay reglas configuradas." }}
        </p>
      </div>
      <footer class="configuration-rule-pagination">
        <span
          >Mostrando
          {{ visibleRows.length ? (configurationPage - 1) * configurationPageSize + 1 : 0 }}-{{
            Math.min(configurationPage * configurationPageSize, visibleRows.length)
          }}
          de {{ visibleRows.length }}</span
        >
        <div v-if="configurationPages > 1">
          <button
            type="button"
            :disabled="configurationPage === 1"
            aria-label="Reglas anteriores"
            @click="configurationPage--"
          >
            <SvgIcon name="chevron-left" /></button
          ><strong>{{ configurationPage }} / {{ configurationPages }}</strong
          ><button
            type="button"
            :disabled="configurationPage >= configurationPages"
            aria-label="Reglas siguientes"
            @click="configurationPage++"
          >
            <SvgIcon name="chevron-right" />
          </button>
        </div>
      </footer>
    </section>

    <Teleport to="body">
      <dialog
        v-if="isEditorOpen"
        ref="editorDialog"
        class="alarm-rule-modal-overlay"
        :aria-label="isCreatingRule ? 'Nueva regla' : 'Editar regla'"
        @cancel.prevent="closeEditor"
        @click.self="closeEditor"
      >
        <aside class="alarm-rule-modal" :class="{ 'alarm-rule-wizard': isWizard }">
          <header
            class="flex items-start justify-between gap-4 border-b border-[#d8e0eb] px-6 py-5"
          >
            <div class="min-w-0">
              <h2 class="text-[24px] font-black leading-tight text-[#102372]">
                {{
                  isWizard
                    ? isCreatingRule
                      ? "Nueva regla"
                      : "Editar regla"
                    : isCreatingRule
                      ? "Nueva alerta"
                      : "Editar alerta"
                }}
              </h2>
              <p class="mt-1 text-[14px] font-semibold text-[#49618a]">
                {{
                  isWizard
                    ? draft.name || "Sin nombre todavia"
                    : "Configura una nueva regla de monitoreo."
                }}
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

          <nav v-if="isWizard" class="alarm-wizard-steps" aria-label="Pasos de la regla">
            <button
              v-for="(label, index) in wizardSteps"
              :key="label"
              type="button"
              :aria-current="editorStep === index + 1 ? 'step' : undefined"
              @click="goToEditorStep(index + 1)"
            >
              <span>{{ index + 1 }}</span
              >{{ label }}
            </button>
          </nav>
          <main
            ref="editorBody"
            class="alarm-rule-modal-body"
            :class="{
              'wizard-body': isWizard,
              'wizard-fleet-body': isWizard && editorStep === 3 && draft.assetScope.type === 'all',
            }"
          >
            <section v-if="isWizard && editorStep === 1" class="alarm-wizard-detection">
              <label class="wizard-field"
                ><span>Nombre de la regla</span>
                <input
                  v-model="draft.name"
                  type="text"
                  :disabled="Boolean(rulesLoadError) || !canManage"
                  placeholder="Ej: Exceso de velocidad sostenido"
                />
              </label>
              <fieldset class="wizard-detectors">
                <legend>Que detectar</legend>
                <label
                  v-for="option in wizardDetectorOptions"
                  :key="option.id"
                  :class="{ selected: draft.type === option.id, unavailable: option.disabled }"
                >
                  <input
                    v-model="draft.type"
                    type="radio"
                    name="wizard-detector"
                    :value="option.id"
                    :disabled="Boolean(rulesLoadError) || !canManage || option.disabled"
                    @change="applyTypePreset"
                  />
                  <SvgIcon :name="ruleTypeVisual(option.id).icon" />
                  <span
                    ><strong>{{ option.label }}</strong
                    ><small v-if="option.status" class="wizard-detector-status">{{
                      option.status
                    }}</small>
                    <small>{{
                      option.description || AUTOMATIC_ALERT_TYPE_PRESETS[option.id]?.description
                    }}</small></span
                  >
                </label>
              </fieldset>
              <label
                v-if="!['speeding', 'signal'].includes(draft.type) && !isFuelDropEpisode"
                class="wizard-field"
                ><span>Nivel de la alerta</span>
                <select v-model="draft.severity" :disabled="Boolean(rulesLoadError) || !canManage">
                  <option
                    v-for="option in ALARM_SEVERITY_OPTIONS"
                    :key="option.id"
                    :value="option.id"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label class="wizard-field"
                ><span>Descripcion opcional</span>
                <input
                  v-model="draft.description"
                  type="text"
                  :disabled="Boolean(rulesLoadError) || !canManage"
                  placeholder="Descripcion de la regla"
                />
              </label>
            </section>
            <AlarmRuleGeneralSection
              v-if="!isWizard"
              :can-manage="canManage && !rulesLoadError"
              :draft="draft"
              :type-options="typeOptions"
              @apply-type-preset="applyTypePreset"
            />

            <AlarmRuleScopeSection
              v-if="!isWizard || editorStep === 3"
              v-model:asset-search-term="assetSearchTerm"
              v-model:asset-company-filter="assetCompanyFilter"
              :wizard="isWizard"
              :asset-tag-options="assetTagOptions"
              :assets-for-draft-company="assetsForDraftCompany"
              :can-manage="canManage && !rulesLoadError"
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
              @select-all-assets="selectEditorAssets"
              @clear-assets="clearEditorAssets"
              @set-asset-scope="setEditorAssetScope"
              @toggle-asset="toggleEditorAsset"
              @toggle-asset-tag="toggleDraftAssetTag"
            />

            <AlarmRuleSpeedingSection
              v-if="isWizard && editorStep === 1 && draft.type === 'speeding'"
              :draft="draft"
              :can-manage="canManage && !rulesLoadError"
            />
            <AlarmRuleEpisodeSection
              v-if="
                isEpisodeType(draft.type) &&
                draft.type !== 'signal' &&
                (!isWizard || editorStep === 1)
              "
              :draft="draft"
              :can-manage="canManage && !rulesLoadError"
            />
            <AlarmRuleFuelDropSection
              v-if="isFuelDropEpisode && (!isWizard || editorStep === 1)"
              :draft="draft"
              :can-manage="canManage && !rulesLoadError"
            />
            <AlarmRuleSignalSection
              v-if="draft.type === 'signal' && (!isWizard || editorStep === 1)"
              :draft="draft"
              :assets="assetsForDraftCompany"
              :can-manage="canManage && !rulesLoadError"
            />
            <AlarmRuleTriggerSection
              v-if="
                !isWizard ||
                (editorStep === 1 &&
                  !(
                    editorStep === 1 &&
                    (draft.type === 'speeding' || isFuelDropEpisode || isEpisodeType(draft.type))
                  ))
              "
              :section="
                !isWizard
                  ? isEpisodeType(draft.type) || isFuelDropEpisode
                    ? 'schedule'
                    : 'all'
                  : editorStep === 1
                    ? 'condition'
                    : 'schedule'
              "
              v-model:fuel-drop-amount="fuelDropAmount"
              v-model:geofence-search-term="geofenceSearchTerm"
              :battery-condition-options="batteryConditionOptions"
              :can-manage="canManage && !rulesLoadError"
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

            <AlarmRuleTimingSection
              v-if="isWizard && editorStep === 2"
              :draft="draft"
              :can-manage="canManage && !rulesLoadError"
            />
            <AlarmRuleNotificationsSection
              v-if="!isWizard"
              :can-manage="canManage && !rulesLoadError"
              :draft="draft"
              :provider-unavailable="isWizard"
            />
            <AlarmRuleWizardActions
              v-if="isWizard && editorStep === 3"
              :draft="draft"
              :can-manage="canManage && !rulesLoadError"
            />
            <p v-if="isWizard && editorStep === 3" class="wizard-save-note">
              {{
                isCreatingRule
                  ? "La regla se guardara inactiva. Podras activarla desde el listado."
                  : draft.enabled
                    ? "La regla conservara su estado activo."
                    : "La regla conservara su estado inactivo."
              }}
            </p>
          </main>

          <footer class="border-t border-[#d8e0eb] px-6 py-5">
            <div v-if="editorConflict" class="wizard-error" role="alert">
              La regla cambió o fue eliminada en otra ventana. Tu borrador se conserva; debes cargar la versión actual antes de guardar.
              <button type="button" @click="reloadEditor">Cargar versión actual</button>
            </div>
            <p v-if="rulesWriteError" class="wizard-error" role="alert">{{ rulesWriteError }}</p>
            <p v-if="wizardError" class="wizard-error" role="alert">{{ wizardError }}</p>
            <p
              v-else-if="isWizard && editorStep === 3 && !isDraftValid"
              class="wizard-error"
              role="status"
            >
              {{
                draft.assetScope.type === "specific" && !selectedDraftAssetCount
                  ? "El alcance por lista necesita al menos un vehiculo."
                  : "Completa la empresa y los activos del alcance. Si elegiste geocercas especificas, completa su seleccion en el primer paso."
              }}
            </p>
            <div class="flex items-center justify-between gap-2">
              <button
                type="button"
                class="inline-flex h-11 min-w-[7.5rem] items-center justify-center rounded-lg border border-[#cfd8e6] bg-white px-5 text-[13px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
                @click="closeEditor"
              >
                Cancelar
              </button>

              <div class="wizard-footer-actions">
                <button
                  v-if="isWizard && editorStep > 1"
                  type="button"
                  class="wizard-back"
                  @click="goToEditorStep(editorStep - 1)"
                >
                  Anterior
                </button>
                <button
                  v-if="isWizard && editorStep < 3"
                  type="button"
                  class="wizard-next"
                  :disabled="Boolean(rulesLoadError) || !canManage"
                  @click="goToEditorStep(editorStep + 1)"
                >
                  Siguiente <SvgIcon name="chevron-right" />
                </button>
                <button
                  v-else
                  type="button"
                  class="inline-flex h-11 min-w-[11rem] items-center justify-center rounded-lg bg-[#ff6600] px-6 text-[13px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
                  :disabled="Boolean(rulesLoadError) || editorConflict || !canManage || !isDraftValid"
                  @click="saveDraft"
                >
                  {{
                    isWizard
                      ? isCreatingRule
                        ? "Guardar inactiva"
                        : "Guardar cambios"
                      : isCreatingRule
                        ? "Crear alerta"
                        : "Guardar"
                  }}
                </button>
              </div>
            </div>
          </footer>
        </aside>
      </dialog>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router"
import { useAlarmRuleDraftProtection } from "../../composables/alarms/useAlarmRuleDraftProtection.js"

import { useAlarmRuleAssetScope } from "../../composables/alarms/useAlarmRuleAssetScope.js"
import {
  createInitialAlarmRuleDraft,
  useAlarmRuleDraft,
} from "../../composables/alarms/useAlarmRuleDraft.js"
import { useAlarmRuleGeofenceSelection } from "../../composables/alarms/useAlarmRuleGeofenceSelection.js"
import { useAutomaticAlertRulesService } from "../../services/alarms/useAutomaticAlertRulesService.js"
import { ALARM_SEVERITY_OPTIONS, ALARM_TYPE_OPTIONS } from "../../utils/alarms/alarmUtils.js"
import {
  AUTOMATIC_ALERT_TYPE_PRESETS,
  buildAutomaticAlertRuleRows,
  filterAutomaticAlertRuleRows,
} from "../../utils/alarms/automaticAlertRuleUtils.js"
import { getAlarmRuleStepError } from "../../utils/alarms/alarmRuleWizard.js"
import { normalizeId } from "../../utils/idUtils.js"
import AlarmRuleGeneralSection from "./AlarmRuleGeneralSection.vue"
import AlarmRuleFilters from "./AlarmRuleFilters.vue"
import AlarmRuleNotificationsSection from "./AlarmRuleNotificationsSection.vue"
import AlarmRuleScopeSection from "./AlarmRuleScopeSection.vue"
import AlarmRuleTable from "./AlarmRuleTable.vue"
import AlarmRuleTriggerSection from "./AlarmRuleTriggerSection.vue"
import AlarmRuleSpeedingSection from "./AlarmRuleSpeedingSection.vue"
import AlarmRuleEpisodeSection from "./AlarmRuleEpisodeSection.vue"
import AlarmRuleSignalSection from "./AlarmRuleSignalSection.vue"
import AlarmRuleTimingSection from "./AlarmRuleTimingSection.vue"
import AlarmRuleWizardActions from "./AlarmRuleWizardActions.vue"
import { applySignalRulePreset } from "../../utils/alarms/signalRulePresets.js"
import AlarmRuleFuelDropSection from "./AlarmRuleFuelDropSection.vue"
import { fuelDropEpisode } from "../../utils/alarms/fuelDropEpisode.js"
import {
  CONFIGURATION_ALERT_TYPES,
  isEpisodeType,
} from "../../utils/alarms/configurationAlertTypes.js"
import SvgIcon from "../icons/SvgIcon.vue"

const props = defineProps({
  presentation: { type: String, default: "table" },
  inboxTo: { type: String, default: "" },
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

const { rules, rulesLoadError, rulesWriteError, reloadRules, createRule, updateRule, deleteRule, toggleRule } = useAutomaticAlertRulesService()

const typeOptions = computed(() =>
  isWizard.value
    ? [
        ...CONFIGURATION_ALERT_TYPES,
        ...ALARM_TYPE_OPTIONS.filter(
          (option) => !CONFIGURATION_ALERT_TYPES.some((type) => type.id === option.id),
        ),
      ]
    : [
        ...ALARM_TYPE_OPTIONS,
        ...CONFIGURATION_ALERT_TYPES.filter(
          (option) => !ALARM_TYPE_OPTIONS.some((type) => type.id === option.id),
        ),
      ],
)
const wizardDetectorOptions = computed(() =>
  CONFIGURATION_ALERT_TYPES.some((option) => option.id === draft.value.type)
    ? CONFIGURATION_ALERT_TYPES
    : [
        ...CONFIGURATION_ALERT_TYPES,
        ...ALARM_TYPE_OPTIONS.filter((option) => option.id === draft.value.type),
      ],
)
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
const { captureDraft, expectedRule, editorConflict, confirmDiscard, protectUnload } =
  useAlarmRuleDraftProtection({ draft, isEditorOpen, rules })
const isFuelDropEpisode = computed(
  () => draft.value.type === "fuel" && draft.value.condition.episodeSource === "fuel-drop",
)
const isWizard = computed(() => props.presentation === "configuration")
const editorStep = ref(1)
const editorDialog = ref(null)
const editorBody = ref(null)
const wizardError = ref("")
const wizardSteps = ["Que detectar", "Ruido y vigencia", "Alcance y acciones"]
const wizardDays = [
  { id: "monday", label: "Lun" },
  { id: "tuesday", label: "Mar" },
  { id: "wednesday", label: "Mie" },
  { id: "thursday", label: "Jue" },
  { id: "friday", label: "Vie" },
  { id: "saturday", label: "Sab" },
  { id: "sunday", label: "Dom" },
]
const goToEditorStep = async (step) => {
  if (step > editorStep.value) {
    for (let current = 1; current < step; current++) {
      const error = getAlarmRuleStepError(draft.value, current)
      if (error) {
        wizardError.value = error
        editorStep.value = current
        return
      }
    }
  }
  wizardError.value = ""
  editorStep.value = step
  await nextTick()
  editorBody.value?.scrollTo(0, 0)
  editorBody.value?.querySelector("input, select, button")?.focus()
}
let previousBodyOverflow = null
watch(isEditorOpen, async (open) => {
  if (open) {
    editorStep.value = 1
    wizardError.value = ""
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    await nextTick()
    if (isEditorOpen.value) editorDialog.value?.showModal()
  } else if (previousBodyOverflow !== null) {
    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = null
  }
})

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
  assetCompanyFilter,
  assetTagOptions,
  assetsForDraftCompany,
  clearAssetSearchTerm,
  filteredAssetsForDraftCompany,
  hiddenFilteredAssetCount,
  isDraftAssetSelected,
  isDraftAssetTagSelected,
  selectAllDraftAssets,
  selectFilteredDraftAssets,
  clearDraftAssetSelection,
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
  allCompanies: computed(
    () => !normalizedCompanyId.value && (isWizard.value || draft.value.platformScope === true),
  ),
  scopeAllCompanies: computed(
    () => !normalizedCompanyId.value && draft.value.platformScope === true,
  ),
  pickerVisibleLimit: computed(() => (isWizard.value ? Infinity : 120)),
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
      ? ruleRows.value.filter((rule) =>
          rule.platformScope
            ? rule.scopeCompanyIds.includes(companyFilterId)
            : rule.companyId === companyFilterId,
        )
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

const ruleTypeVisuals = {
  idle: { icon: "alarm-after-hours", tone: "blue" },
  fuel_load: { icon: "alarm-fuel-variation", tone: "warning" },
  ignition_event: { icon: "alarm-after-hours", tone: "blue" },
  speeding: { icon: "alarm-speeding", tone: "danger" },
  battery: { icon: "alarm-low-battery", tone: "warning" },
  no_signal: { icon: "alarm-no-signal", tone: "blue" },
  geofence: { icon: "alarm-geofence-exit", tone: "purple" },
  fuel: { icon: "alarm-fuel-variation", tone: "danger" },
  stop_time: { icon: "alarm-long-stop", tone: "blue" },
  ignition: { icon: "alarm-after-hours", tone: "blue" },
}
const ruleTypeVisual = (type) => ruleTypeVisuals[type] || { icon: "configuracion", tone: "blue" }
const ruleThreshold = (rule) => {
  if (rule.type === "fuel" && rule.condition.episodeSource === "fuel-drop") return "Fin de la caida"
  if (rule.type === "speeding" && rule.condition.limitSource === "vehicle-type")
    return "Por tipo de vehiculo"
  if (rule.type === "ignition")
    return rule.schedule.type === "custom"
      ? rule.schedule.from + " - " + rule.schedule.to
      : "Contacto activo"
  if (["speeding", "battery", "no_signal", "stop_time", "fuel"].includes(rule.type))
    return String(rule.condition.value) + (rule.condition.unit ? " " + rule.condition.unit : "")
  return rule.conditionLabel
}
const configurationPageSize = 6
const configurationPage = ref(1)
const configurationPages = computed(() =>
  Math.max(1, Math.ceil(visibleRows.value.length / configurationPageSize)),
)
const configurationRows = computed(() =>
  visibleRows.value.slice(
    (configurationPage.value - 1) * configurationPageSize,
    configurationPage.value * configurationPageSize,
  ),
)
watch([searchTerm, selectedType, selectedCompanyId, selectedStatus], () => {
  configurationPage.value = 1
})
watch(configurationPages, (pages) => {
  configurationPage.value = Math.min(configurationPage.value, pages)
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
  if (isWizard.value && draft.value.type === "speeding" && !draft.value.condition.limitSource) {
    Object.assign(draft.value.condition, {
      limitSource: "custom",
      minimumExcessSeverity: "mild",
      severityMode: "excess",
      hysteresisKmh: 5,
    })
  }
  captureDraft(rules.value.find(item => item.id === rule.id) || rule)

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
  if (!confirmDiscard()) return
  const rule = ruleRows.value.find((item) => item.id === ruleId)

  if (!rule) return

  loadRuleDraft(rule)
}

const startNewRule = ({ openEditor = true } = {}) => {
  if (!confirmDiscard()) return
  selectedRuleId.value = ""
  isCreatingRule.value = true
  isEditorOpen.value = openEditor
  clearAssetSearchTerm()
  clearGeofenceSearchTerm()
  draft.value = createDraft()
  if (isWizard.value) {
    draft.value.name = ""
    draft.value.enabled = false
    if (!normalizedCompanyId.value) draft.value.platformScope = true
    draft.value.schedule.days = []
    if (draft.value.type === "speeding")
      Object.assign(draft.value.condition, {
        limitSource: "vehicle-type",
        minimumExcessSeverity: "mild",
        severityMode: "excess",
        hysteresisKmh: 5,
      })
  }
  captureDraft()
}

defineExpose({
  startNewRule,
})

const applyTypePreset = () => {
  clearGeofenceSearchTerm()
  applyDraftTypePreset()
  if (isWizard.value && draft.value.type === "door_open")
    applySignalRulePreset(draft.value, "door-open")
  if (isWizard.value && draft.value.type === "fuel")
    draft.value.condition = fuelDropEpisode({ episodeSource: "fuel-drop" })
  if (isWizard.value && draft.value.type === "speeding")
    Object.assign(draft.value.condition, {
      limitSource: "vehicle-type",
      minimumExcessSeverity: "mild",
      severityMode: "excess",
      hysteresisKmh: 5,
    })
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

const setEditorAssetScope = (type) => {
  if (isWizard.value && !normalizedCompanyId.value) draft.value.platformScope = true
  if (isWizard.value && type === "specific") {
    draft.value.assetScope = {
      type: "specific",
      assetIds:
        draft.value.assetScope.type === "specific" ? [...draft.value.assetScope.assetIds] : [],
      assetTagIds: [],
    }
    return
  }
  setDraftAssetScope(type)
}

const toggleEditorAsset = (assetId) => {
  if (isWizard.value && !normalizedCompanyId.value) draft.value.platformScope = true
  toggleDraftAsset(assetId)
}

const selectEditorAssets = () => {
  if (rulesLoadError.value || !props.canManage) return
  if (isWizard.value) {
    if (!normalizedCompanyId.value) draft.value.platformScope = true
    selectFilteredDraftAssets()
  } else selectAllDraftAssets()
}

const clearEditorAssets = () => {
  if (rulesLoadError.value || !props.canManage) return
  if (isWizard.value && !normalizedCompanyId.value) draft.value.platformScope = true
  clearDraftAssetSelection()
}

const closeEditor = () => {
  if (!confirmDiscard()) return
  isEditorOpen.value = false
  resetDraftFromSelection({ openEditor: false })
}

const reloadEditor = () => {
  if (!confirmDiscard()) return
  const id = expectedRule.value?.id
  if (!reloadRules()) return
  const current = rules.value.find(rule => rule.id === id)
  if (current) loadRuleDraft(current)
  else {
    isEditorOpen.value = false
    startNewRule()
  }
}

const saveDraft = () => {
  if (rulesLoadError.value || editorConflict.value || !props.canManage || !isDraftValid.value) return

  if (isWizard.value) {
    for (let step = 1; step <= 2; step++) {
      const error = getAlarmRuleStepError(draft.value, step)
      if (error) {
        editorStep.value = step
        wizardError.value = error
        return
      }
    }
  }
  const wasCreatingRule = isCreatingRule.value
  const payload = getDraftPayload()
  if (isWizard.value && !payload.schedule.days.length) {
    payload.schedule.days = wizardDays.map((day) => day.id)
  }
  if (isWizard.value) {
    payload.notificationChannels.whatsapp = Boolean(draft.value.notificationChannels.whatsapp)
  }
  const savedRule = draft.value.id ? updateRule(draft.value.id, payload, { expected: expectedRule.value }) : createRule(payload)

  if (!savedRule) {
    feedbackMessage.value = ""
    return
  }

  selectedRuleId.value = savedRule.id
  isCreatingRule.value = false
  draft.value = cloneDraft(savedRule)
  captureDraft(savedRule)
  isEditorOpen.value = false

  showFeedback(wasCreatingRule ? "Alerta creada." : "Alerta guardada.")
}

const handleDeleteRule = (ruleId = draft.value.id) => {
  if (rulesLoadError.value || !props.canManage || !ruleId) return

  if (typeof window !== "undefined" && !window.confirm("Eliminar esta alerta automatica?")) {
    return
  }

  const deletedRule = deleteRule(ruleId)

  if (!deletedRule) {
    feedbackMessage.value = ""
    return
  }

  if (selectedRuleId.value === deletedRule.id) {
    isEditorOpen.value = false
    selectedRuleId.value = ""
    draft.value = createDraft()
    captureDraft()
    isCreatingRule.value = true
  }

  showFeedback("Alerta eliminada.")
}

const handleToggleRule = (ruleId) => {
  if (rulesLoadError.value || !props.canManage) return
  if (isEditorOpen.value && selectedRuleId.value === ruleId && !confirmDiscard()) return

  const updatedRule = toggleRule(ruleId)

  if (!updatedRule) {
    feedbackMessage.value = ""
    return
  }

  if (selectedRuleId.value === updatedRule.id && !isCreatingRule.value) {
    draft.value = cloneDraft(updatedRule)
    captureDraft(updatedRule)
  }

  showFeedback(updatedRule.enabled ? "Alerta activada." : "Alerta desactivada.")
}

watch(
  ruleRows,
  (rows) => {
    if (isEditorOpen.value) return
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
  window.removeEventListener("beforeunload", protectUnload)
  if (previousBodyOverflow !== null) document.body.style.overflow = previousBodyOverflow
  if (feedbackTimeoutId && typeof window !== "undefined") {
    window.clearTimeout(feedbackTimeoutId)
  }
})
onMounted(() => window.addEventListener("beforeunload", protectUnload))
onBeforeRouteLeave(confirmDiscard)
onBeforeRouteUpdate((to, from) => to.params.empresaId === from.params.empresaId || confirmDiscard())
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
  margin: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  border: 0;
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

.alarm-config-layout.alarm-config-configuration {
  display: flex;
  height: 100%;
  min-height: 0;
}
.configuration-rule-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
  color: #102372;
}
.configuration-rule-header {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
  padding: 0 0 14px;
}
.configuration-rule-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 7px;
  background: #e4ecff;
  color: #163bda;
  flex-shrink: 0;
}
.configuration-rule-icon :deep(.svg-icon-wrapper) {
  width: 28px;
  height: 28px;
}
.configuration-rule-heading {
  flex: 1;
  min-width: 0;
}
.configuration-rule-header h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.3;
  font-weight: 800;
}
.configuration-rule-header p {
  margin: 5px 0 0;
  font-size: 13px;
  line-height: 1.5;
}
.configuration-rule-search {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  width: auto;
  min-width: 140px;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid #ccd8ed;
  border-radius: 6px;
  background: white;
  color: #7185a6;
}
.configuration-rule-search input {
  width: 100%;
  min-width: 0;
  padding: 10px 0;
  border: 0;
  background: transparent;
  outline: none;
  font: inherit;
  font-size: 13px;
  color: #102372;
}
.configuration-rule-search:focus-within {
  outline: 2px solid #476aca;
  outline-offset: 1px;
}
.configuration-rule-header button,
.configuration-rule-header a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 8px 18px;
  border: 1px solid #ccd8ed;
  border-radius: 6px;
  background: white;
  color: #102372;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}
.configuration-rule-header button.primary {
  background: #ff6600;
  border-color: #ff6600;
  color: white;
}

.configuration-rule-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid #d8dee8;
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: white;
}
.configuration-rule-row {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 20px;
  min-height: 112px;
  padding: 14px 20px;
  border: 0;
  border-bottom: 1px solid #edf1f5;
  border-radius: 0;
  background: white;
}
.configuration-rule-row:last-of-type { border-bottom: 0; }
.configuration-rule-row:focus-within { background: #f8faff; }
.configuration-rule-copy {
  flex: 1;
  min-width: 0;
}
.configuration-rule-type-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 2px;
  border-radius: 8px;
  color: #2563eb;
  background: #eef5ff;
}
.configuration-rule-type-icon.warning {
  color: #ff8a00;
  background: #fff7e8;
}
.configuration-rule-type-icon.danger {
  color: #ef1b23;
  background: #fff0f0;
}
.configuration-rule-type-icon.purple {
  color: #7c3aed;
  background: #f3edff;
}
.configuration-rule-type-icon :deep(.svg-icon-wrapper) {
  width: 22px;
  height: 22px;
}
.configuration-rule-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
}
.configuration-rule-title h2 {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 800;
  overflow-wrap: anywhere;
}
.rule-active-badge,
.rule-level-badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 5px;
  background: #e1f8ea;
  color: #087c43;
  font-size: 12px;
  font-weight: 800;
}
.rule-active-badge.inactive {
  background: #edf1f6;
  color: #7185a6;
}
.rule-level-badge {
  background: #edf0fb;
  color: #102372;
}
.rule-level-badge.critical {
  background: #ffe4e8;
  color: #d30827;
}
.configuration-rule-description {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.5;
}
.configuration-rule-condition {
  margin: 3px 0 0;
  color: #7185a6;
  font-size: 12px;
  line-height: 1.5;
}
.configuration-rule-channels {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.configuration-rule-channels span {
  padding: 3px 8px;
  border: 0;
  border-radius: 5px;
  background: #f1f4f8;
  font-size: 10px;
  line-height: 1.3;
  font-weight: 600;
}
.configuration-rule-channels span.muted {
  background: #f0f3f8;
  color: #8899b6;
}
.configuration-rule-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
.configuration-rule-summary dl {
  display: grid;
  grid-template-columns: 100px 165px 115px;
  margin: 0;
}
.configuration-rule-summary dl > div {
  padding: 0 18px;
  border-left: 1px solid #e2e9f4;
  min-width: 0;
}
.configuration-rule-summary dt {
  margin-bottom: 6px;
  color: #7185a6;
  font-size: 10px;
}
.configuration-rule-summary dd {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 800;
  overflow-wrap: anywhere;
}
.configuration-rule-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-left: 20px;
  border-left: 1px solid #e2e9f4;
}
.configuration-rule-actions > button:not([role="switch"]) {
  min-height: 40px;
  min-width: 78px;
  padding: 8px 16px;
  border: 1px solid #ccd8ed;
  border-radius: 6px;
  background: white;
  color: #102372;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}
.configuration-rule-switch {
  position: relative;
  display: block;
  width: 46px;
  height: 26px;
  padding: 3px;
  border: 0;
  border-radius: 16px;
  background: #a4afc1;
  cursor: pointer;
  flex-shrink: 0;
}
.configuration-rule-switch[aria-checked="true"] {
  background: #22b53e;
}
.configuration-rule-switch span {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px #0002;
  transition: transform 0.15s;
}
.configuration-rule-switch[aria-checked="true"] span {
  transform: translateX(20px);
}
.configuration-rule-switch:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.configuration-rule-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  margin-top: 0;
  padding: 10px 16px;
  border: 1px solid #d8dee8;
  border-radius: 0 0 8px 8px;
  background: white;
  color: #102372;
  font-size: 12px;
  flex-shrink: 0;
}
.configuration-rule-pagination > div {
  display: flex;
  align-items: center;
  gap: 10px;
}
.configuration-rule-pagination button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid #ccd8ed;
  border-radius: 5px;
  background: white;
  color: #102372;
  cursor: pointer;
}
.configuration-rule-pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.configuration-rule-feedback {
  margin: 0 10px 12px;
  color: #087a55;
  font-size: 12px;
}
.configuration-rule-empty {
  padding: 24px;
  text-align: center;
  color: #7185a6;
  font-size: 13px;
}
.configuration-rule-list button:focus-visible,
.configuration-rule-list a:focus-visible {
  outline: 2px solid #ff6600;
  outline-offset: 2px;
}
@media (max-width: 1350px) {
  .configuration-rule-header {
    flex-wrap: wrap;
  }
  .configuration-rule-heading {
    flex-basis: 55%;
  }
  .configuration-rule-header h1 {
    font-size: 21px;
  }
  .configuration-rule-search {
    flex: 1;
    width: auto;
  }
  .configuration-rule-summary dl {
    grid-template-columns: 85px 145px 95px;
  }
  .configuration-rule-summary dl > div {
    padding: 0 12px;
  }
  .configuration-rule-actions {
    gap: 12px;
    padding-left: 14px;
  }
  .configuration-rule-row {
    gap: 12px;
    padding: 14px;
  }
}
@media (max-width: 1100px) {
  .configuration-rule-row {
    flex-wrap: wrap;
  }
  .configuration-rule-summary {
    width: 100%;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #e7ecf7;
  }
  .configuration-rule-summary dl {
    grid-template-columns: 100px 165px 115px;
  }
}
@media (max-width: 700px) {
  .configuration-rule-header {
    padding: 6px 0 16px;
    gap: 10px;
  }
  .configuration-rule-icon {
    width: 42px;
    height: 42px;
  }
  .configuration-rule-heading {
    flex-basis: 75%;
  }
  .configuration-rule-header h1 {
    font-size: 19px;
  }
  .configuration-rule-search {
    flex-basis: 100%;
    order: 2;
  }
  .configuration-rule-header a,
  .configuration-rule-header button {
    font-size: 12px;
    padding: 8px 12px;
    min-height: 38px;
  }
  .configuration-rule-summary {
    flex-wrap: wrap;
    gap: 14px;
  }
  .configuration-rule-summary dl {
    width: 100%;
    grid-template-columns: 1fr 1.4fr 1fr;
  }
  .configuration-rule-summary dl > div {
    padding: 0 8px;
  }
  .configuration-rule-summary dd {
    font-size: 12px;
  }
  .configuration-rule-actions {
    margin-left: auto;
    padding: 0;
    border: 0;
  }
  .configuration-rule-title h2 {
    font-size: 15px;
  }
  .configuration-rule-pagination {
    font-size: 12px;
  }
}
@media (min-width: 1101px) {
  .configuration-rule-row {
    min-height: 90px;
    padding: 10px 16px;
    gap: 12px;
  }
  .configuration-rule-title {
    gap: 7px;
  }
  .configuration-rule-title h2 {
    font-size: 15px;
    line-height: 20px;
  }
  .rule-active-badge,
  .rule-level-badge {
    padding: 1px 6px;
    font-size: 12px;
    line-height: 17px;
  }
  .configuration-rule-description {
    margin: 2px 0 0;
    font-size: 13px;
    line-height: 18px;
  }
  .configuration-rule-extra {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 3px 10px;
    margin-top: 3px;
  }
  .configuration-rule-condition {
    margin: 0;
    font-size: 12px;
    line-height: 17px;
  }
  .configuration-rule-channels {
    margin: 0;
    gap: 5px;
  }
  .configuration-rule-channels span {
    padding: 1px 5px;
    font-size: 10px;
    line-height: 14px;
  }
  .configuration-rule-type-icon {
    width: 34px;
    height: 34px;
    align-self: center;
    margin-top: 0;
  }
  .configuration-rule-actions > button:not([role="switch"]) {
    min-height: 34px;
    min-width: 68px;
    padding: 6px 12px;
    font-size: 13px;
  }
  .configuration-rule-summary dd {
    font-size: 14px;
  }
  .configuration-rule-summary dt {
    font-size: 11px;
  }
}
@media (min-width: 1351px) {
  .configuration-rule-summary {
    flex: 0 0 44%;
    min-width: 530px;
  }
  .configuration-rule-summary dl {
    flex: 1;
    grid-template-columns: minmax(80px, 1fr) minmax(130px, 1.6fr) minmax(110px, 1.1fr);
  }
  .configuration-rule-summary dd {
    line-height: 1.4;
  }
}
.configuration-rule-toolbar {
  flex-shrink: 0;
  margin-bottom: 14px;
}
.configuration-rule-type-icon :deep(svg) {
  width: 22px;
  height: 22px;
  max-width: 22px;
  max-height: 22px;
  transform: none;
  overflow: hidden;
}
.alarm-rule-modal-overlay::backdrop {
  background: transparent;
}
.alarm-rule-wizard {
  height: min(810px, calc(100dvh - 40px));
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  border-radius: 8px;
}
.alarm-wizard-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 12px 24px;
  gap: 8px;
  border-bottom: 1px solid #d8e0eb;
}
.alarm-wizard-steps button {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  background: #f3f6fb;
  color: #49618a;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
}
.alarm-wizard-steps button[aria-current="step"] {
  background: #102372;
  color: white;
}
.alarm-wizard-steps button > span {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: 1px solid currentColor;
  border-radius: 50%;
}
.wizard-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 24px;
}
.wizard-fleet-body {
  gap: 12px;
  padding-top: 16px;
  padding-bottom: 16px;
}
.wizard-fleet-body :deep(.scope-segments) {
  margin-top: 0;
}
.wizard-fleet-body :deep(.wizard-rule-actions) {
  gap: 10px;
}
.wizard-fleet-body :deep(.historical) {
  padding: 10px 14px;
}
.wizard-fleet-body :deep(.actions-preview) {
  padding-top: 12px;
}
.wizard-fleet-body .wizard-save-note {
  margin: 0;
  padding: 8px 12px;
}
.wizard-body :deep(.alarm-modal-card) {
  border: 0;
  border-radius: 0;
  padding: 0;
}
.wizard-body :deep(.alarm-step-number) {
  display: none;
}
.alarm-wizard-detection {
  display: grid;
  gap: 16px;
}
.wizard-field {
  display: block;
  min-width: 0;
  font-size: 13px;
  color: #102372;
}
.wizard-field > span,
.wizard-detectors legend,
.wizard-days legend {
  display: block;
  margin-bottom: 8px;
  font-weight: 800;
  font-size: 13px;
}
.wizard-field input,
.wizard-field select {
  height: 42px;
  width: 100%;
  min-width: 0;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  padding: 0 12px;
  background: white;
  color: #102372;
  font-size: 14px;
}
.wizard-field small {
  display: block;
  margin-top: 6px;
  color: #5f7396;
}
.wizard-detectors {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.wizard-detectors label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #d8e0eb;
  border-radius: 6px;
  cursor: pointer;
  min-width: 0;
  color: #102372;
}
.wizard-detectors label.selected {
  border-color: #102372;
  background: #eef3ff;
}
.wizard-detectors label.unavailable {
  cursor: not-allowed;
  background: #f8fafc;
  color: #7f93b3;
}
.wizard-detectors label.unavailable strong,
.wizard-detectors label.unavailable small:not(.wizard-detector-status) {
  color: #7f93b3;
}
.wizard-detectors input {
  accent-color: #102372;
  flex-shrink: 0;
}
.wizard-detectors :deep(.svg-icon-wrapper) {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}
.wizard-detectors :deep(svg) {
  width: 22px;
  height: 22px;
  transform: none;
}
.wizard-detectors strong {
  display: inline;
  color: #102372;
  font-size: 13px;
}
.wizard-detectors small {
  display: block;
  color: #5f7396;
  font-size: 12px;
  line-height: 1.45;
  margin-top: 4px;
}
.wizard-detectors .wizard-detector-status {
  display: inline-block;
  margin: 0 0 0 6px;
  color: #ad5500;
  background: #fff4e8;
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 4px;
}
.wizard-timing {
  display: grid;
  gap: 20px;
}
.wizard-days-note {
  margin: -10px 0 0;
  color: #5f7396;
  font-size: 12px;
}
.wizard-unit {
  display: flex;
  align-items: center;
  gap: 12px;
}
.wizard-unit input {
  max-width: 180px;
}
.wizard-days {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.wizard-days legend {
  float: left;
  width: 100%;
}
.wizard-days label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border: 1px solid #d8e0eb;
  border-radius: 6px;
  font-size: 13px;
  color: #102372;
}
.wizard-days label.selected {
  background: #eef3ff;
  border-color: #102372;
}
.wizard-days input {
  accent-color: #102372;
}
.wizard-save-note {
  padding: 12px;
  border-left: 3px solid #ff6600;
  background: #fff7ed;
  font-size: 13px;
  color: #49618a;
}
.wizard-body :deep(.alarm-notification-card small) {
  overflow: visible;
  white-space: normal;
  line-height: 1.4;
}
.wizard-error {
  color: #c02626;
  font-size: 13px;
  margin-bottom: 10px;
}
.wizard-footer-actions {
  display: flex;
  gap: 8px;
}
.wizard-back,
.wizard-next {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 800;
  border-radius: 6px;
}
.wizard-back {
  border: 1px solid #cfd8e6;
  color: #102372;
}
.wizard-next {
  background: #ff6600;
  color: white;
}
.wizard-next:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}
@media (max-width: 767px) {
  .alarm-rule-wizard {
    height: calc(100dvh - 16px);
    max-height: calc(100dvh - 16px);
  }
  .alarm-wizard-steps {
    padding: 10px;
    gap: 4px;
  }
  .alarm-wizard-steps button {
    flex-direction: column;
    gap: 6px;
    padding: 8px 4px;
    font-size: 11px;
    text-align: center;
  }
  .wizard-body {
    padding: 16px;
  }
  .wizard-detectors {
    grid-template-columns: minmax(0, 1fr);
  }
  .alarm-rule-wizard > header,
  .alarm-rule-wizard > footer {
    padding: 16px;
  }
  .alarm-rule-wizard > footer button {
    min-width: 0;
    padding: 0 12px;
  }
}
.rules-load-error { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 12px 16px; color: #a31f32; background: #fff0f1; border: 1px solid #f0b6bf; border-radius: 6px; font-size: 13px; }
.rules-load-error span { flex: 1; min-width: 180px; }
.rules-load-error button { padding: 8px 12px; background: white; border: 1px solid #f0b6bf; border-radius: 5px; color: #a31f32; cursor: pointer; }
</style>
