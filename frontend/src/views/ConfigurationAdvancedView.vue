<template>
  <section class="advanced-page" aria-label="Ajustes avanzados">
    <form class="advanced-form" novalidate @submit.prevent="reviewSave">
      <header class="advanced-module-header">
        <div class="advanced-module-heading">
          <h1>Ajustes avanzados</h1>
          <span class="advanced-scope">Plataforma</span>
        </div>
        <div class="advanced-header-actions">
          <p
            class="advanced-save-status"
            :class="{ 'is-dirty': dirty, 'is-unavailable': !ready, 'is-error': Boolean(error) }"
            role="status"
          >
            <span class="advanced-status-dot" aria-hidden="true"></span>
            {{
              error
                ? "Requiere revisión"
                : !ready
                  ? "No disponible"
                  : dirty
                    ? "Cambios sin guardar"
                    : "Sin cambios"
            }}
          </p>
          <button v-if="error" type="button" @click="reload">Recargar</button>
          <button v-if="dirty" type="button" :disabled="!editable || !ready" @click="discard">
            <SvgIcon name="close" />Descartar cambios
          </button>
          <button
            type="button"
            :disabled="!editable || !ready || defaultCount === 7"
            @click="reset"
          >
            <SvgIcon name="limits-reset" />Restablecer todo
          </button>
          <button
            type="submit"
            class="advanced-save"
            :disabled="!editable || !ready || !dirty || Boolean(error)"
          >
            <SvgIcon name="limits-save" />Guardar cambios
          </button>
        </div>
      </header>
      <p v-if="error" role="alert" class="advanced-header-error">{{ error }}</p>
      <div v-if="auditWarning" class="advanced-audit-warning" role="alert">
        <span>{{ auditWarning }}</span
        ><button type="button" @click="syncAudit">Reintentar registro</button>
      </div>
      <div class="advanced-scroll" @scroll="closeInformation">
        <div class="advanced-content">
          <section class="advanced-introduction" aria-labelledby="advanced-parameters-title">
            <div>
              <h2 id="advanced-parameters-title">Parámetros de funcionamiento</h2>
              <p>Configura los criterios de detección y comportamiento de la plataforma.</p>
            </div>
            <span class="advanced-defaults-status">{{
              !ready
                ? "No disponible"
                : defaultCount === 7
                  ? "Valores de fábrica"
                  : `${defaultCount} de 7 valores de fábrica`
            }}</span>
          </section>
          <div class="advanced-editor">
            <span class="advanced-default-count sr-only"
              >{{ defaultCount }} de 7 valores de fábrica</span
            >
            <article
              v-for="group in ADVANCED_GROUPS"
              :key="group.id"
              class="advanced-setting"
              :data-setting="group.id"
              :aria-labelledby="group.id + '-title'"
            >
              <div class="advanced-setting-info">
                <header class="advanced-setting-header">
                  <h2 :id="group.id + '-title'">{{ groupPresentation[group.id].title }}</h2>
                  <span
                    class="advanced-setting-state sr-only"
                    :class="'advanced-state-' + groupStates[group.id].kind"
                  >
                    {{ groupStates[group.id].label }}
                  </span>
                </header>
                <p class="advanced-description">
                  {{ groupPresentation[group.id].description || group.description }}
                </p>
                <details
                  class="advanced-measurement"
                  title="Mediciones de la referencia enviada, no calculadas en este proyecto"
                >
                  <summary>Medición de referencia</summary>
                  <p v-if="groupPresentation[group.id].description">{{ group.description }}</p>
                  <p>{{ group.reference }}</p>
                </details>
              </div>
              <div class="advanced-controls">
                <div class="advanced-fields">
                  <div v-for="field in group.fields" :key="field.id" class="advanced-field-row">
                    <label :for="field.id">{{ field.prefix }}</label>
                    <input
                      :id="field.id"
                      v-model="draft[field.id]"
                      type="number"
                      :min="field.min"
                      :max="field.max"
                      :step="field.step"
                      :disabled="!editable || !ready"
                      :aria-label="field.label"
                      :aria-invalid="Boolean(errors[field.id])"
                      :aria-describedby="
                        [
                          errors[field.id] ? field.id + '-error' : '',
                          isFieldChanged(field) ? field.id + '-comparison' : '',
                          !isFactoryValue(field) ? field.id + '-factory' : '',
                        ]
                          .filter(Boolean)
                          .join(' ') || undefined
                      "
                      @input="message = ''"
                    />
                    <span>{{ field.suffix }}</span>
                    <p
                      v-if="isFieldChanged(field)"
                      :id="field.id + '-comparison'"
                      class="advanced-field-comparison"
                    >
                      <span>Guardado: {{ baseline[field.id] }} {{ field.unit }}</span>
                      <SvgIcon name="arrow-right" />
                      <span class="advanced-new-value"
                        >Nuevo: {{ draft[field.id] === "" ? "Sin valor" : draft[field.id] }}
                        {{ draft[field.id] === "" ? "" : field.unit }}</span
                      >
                    </p>
                    <p
                      v-if="!isFactoryValue(field)"
                      :id="field.id + '-factory'"
                      class="advanced-factory-hint"
                    >
                      De fábrica: {{ field.default }} {{ field.unit }}
                    </p>
                    <p v-if="errors[field.id]" :id="field.id + '-error'" class="advanced-error">
                      {{ errors[field.id] }}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  class="advanced-reset-group"
                  :disabled="!editable || !ready || groupStates[group.id].factory"
                  :title="
                    'Restablecer ' + groupPresentation[group.id].title + ' a valores de fábrica'
                  "
                  :aria-label="
                    'Restablecer ' + groupPresentation[group.id].title + ' a valores de fábrica'
                  "
                  @click="resetGroup(group)"
                >
                  <SvgIcon name="limits-reset" />
                </button>
              </div>
            </article>
          </div>
          <div class="advanced-info-trigger">
            <button ref="informationButton" type="button" popovertarget="advanced-information">
              <SvgIcon name="detail-info" />
              Información sobre otros ajustes
            </button>
          </div>
          <section
            id="advanced-information"
            ref="informationPanel"
            popover
            class="advanced-elsewhere"
            aria-labelledby="elsewhere-title"
            :style="informationPosition"
            @beforetoggle="positionInformation"
          >
            <header class="advanced-info-heading">
              <h2 id="elsewhere-title">Lo que no se configura acá</h2>
              <button
                type="button"
                popovertarget="advanced-information"
                popovertargetaction="hide"
                aria-label="Cerrar información"
              >
                <SvgIcon name="close" />
              </button>
            </header>
            <div class="advanced-elsewhere-grid">
              <article>
                <h3>La puerta y su polaridad</h3>
                <p>
                  Es por vehículo: cada rampla tiene el sensor donde se lo pusieron y está en la
                  sección Sensores de su ficha.
                </p>
              </article>
              <article>
                <h3>Los rangos de temperatura</h3>
                <p>
                  Son por sonda, también en la ficha. Un rango por vehículo dejaría una de las dos
                  sondas siempre fuera.
                </p>
              </article>
              <article>
                <h3>Velocidad máxima y consumo con el motor detenido</h3>
                <p>
                  Los decide el cliente, y están en
                  <RouterLink to="/configuracion/limites">Límites</RouterLink>.
                </p>
              </article>
            </div>
            <p class="advanced-provenance">
              Mediciones de la referencia original; no son cálculos de esta flota. Guardado local ·
              Aplicacion al procesamiento de eventos pendiente.
            </p>
          </section>
        </div>
      </div>
      <p class="sr-only" role="status">{{ message }}</p>
      <dialog
        ref="changesDialog"
        class="advanced-changes-dialog"
        aria-labelledby="changes-dialog-title"
        @cancel="reviewedDraft = null"
      >
        <header class="advanced-dialog-heading">
          <div class="advanced-dialog-title-group">
            <span class="advanced-dialog-icon"><SvgIcon name="limits-save" /></span>
            <div>
              <h2 id="changes-dialog-title">Revisar cambios</h2>
              <p>
                Ajustes avanzados
                <span>· Confirmación de guardado</span>
              </p>
            </div>
          </div>
          <button type="button" aria-label="Cerrar" @click="closeChangesDialog">
            <SvgIcon name="close" />
          </button>
        </header>
        <div class="advanced-dialog-content">
          <p class="advanced-dialog-note">
            {{ reviewChanges.length }} parámetros modificados. Guardado local; aplicación al
            procesamiento de eventos pendiente.
          </p>
          <div class="advanced-changes-table-wrap">
            <table class="advanced-changes-table">
              <thead>
                <tr>
                  <th>Parámetro</th>
                  <th>Guardado</th>
                  <th>Nuevo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="change in reviewChanges" :key="change.fieldId">
                  <th scope="row">{{ changeLabel(change.fieldId) }}</th>
                  <td>{{ change.before }} {{ fieldById[change.fieldId].unit }}</td>
                  <td class="advanced-new-value">
                    {{ change.after }} {{ fieldById[change.fieldId].unit }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <footer class="advanced-dialog-footer">
          <button type="button" @click="closeChangesDialog">Volver a editar</button>
          <button
            type="button"
            class="advanced-confirm-save"
            :disabled="!editable || !ready || Boolean(error)"
            @click="save"
          >
            Confirmar guardado
          </button>
        </footer>
      </dialog>
    </form>
  </section>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue"
import { onBeforeRouteLeave } from "vue-router"
import SvgIcon from "../components/icons/SvgIcon.vue"
import { appendAuditLog } from "../services/audit/useAuditService.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"
import { readStorageValue, writeStorageValue } from "../services/storage/browserStorage.js"
import {
  ADVANCED_GROUPS,
  ADVANCED_FIELDS,
  ADVANCED_STORAGE_KEY,
  advancedDefaults,
  readAdvancedConfiguration,
  saveAdvancedConfiguration,
  sameAdvancedConfiguration,
  validateAdvancedConfiguration,
  advancedChanges,
  syncAdvancedAudit,
} from "../utils/layout/advancedConfiguration.js"

const { isPlatformAdmin, currentUser } = useAuthSession()
const editable = computed(() => isPlatformAdmin.value)
const draft = ref(advancedDefaults())
const baseline = ref(advancedDefaults())
const ready = ref(false)
const error = ref("")
const message = ref("")
const attempted = ref(false)
const changesDialog = ref(null)
const reviewedDraft = ref(null)
const auditWarning = ref("")
const closeChangesDialog = () => {
  reviewedDraft.value = null
  changesDialog.value?.close()
}
const fieldById = Object.fromEntries(ADVANCED_FIELDS.map((field) => [field.id, field]))
const reviewChanges = computed(() =>
  reviewedDraft.value ? advancedChanges(baseline.value, reviewedDraft.value) : [],
)
const changeLabel = (fieldId) => {
  const group = ADVANCED_GROUPS.find((item) => item.fields.some((field) => field.id === fieldId))
  return `${groupPresentation[group.id].title} · ${fieldById[fieldId].label}`
}
const syncAudit = () => {
  if (!editable.value || !ready.value) return
  try {
    syncAdvancedAudit({
      read: readStorageValue,
      write: writeStorageValue,
      recordAudit: (entry) => appendAuditLog(entry, { requirePersistence: true }),
    })
    auditWarning.value = ""
  } catch (cause) {
    auditWarning.value = `Registro en Auditoría pendiente: ${cause.message}`
  }
}
const reviewSave = () => {
  if (!editable.value || !ready.value || !dirty.value || error.value) return
  attempted.value = true
  if (Object.keys(errors.value).length) return
  reviewedDraft.value = { ...draft.value }
  changesDialog.value.showModal()
}
const informationButton = ref(null)
const informationPanel = ref(null)
const informationPosition = ref({})
const positionInformation = (event) => {
  if (event.newState !== "open" || !informationButton.value) return
  const rect = informationButton.value.getBoundingClientRect()
  const width = Math.min(440, window.innerWidth - 32)
  const below = window.innerHeight - rect.bottom
  const openBelow = below >= Math.min(400, rect.top)
  informationPosition.value = {
    width: `${width}px`,
    left: `${Math.max(16, Math.min(rect.left, window.innerWidth - width - 16))}px`,
    top: openBelow ? `${rect.bottom + 8}px` : "auto",
    bottom: openBelow ? "auto" : `${window.innerHeight - rect.top + 8}px`,
    maxHeight: `${Math.max(80, (openBelow ? below : rect.top) - 24)}px`,
  }
}
const closeInformation = () => {
  if (informationPanel.value?.matches(":popover-open")) informationPanel.value.hidePopover()
}
const dirty = computed(() => !sameAdvancedConfiguration(draft.value, baseline.value))
const errors = computed(() => (attempted.value ? validateAdvancedConfiguration(draft.value) : {}))
const defaultCount = computed(
  () =>
    ADVANCED_FIELDS.filter(
      (field) => draft.value[field.id] !== "" && Number(draft.value[field.id]) === field.default,
    ).length,
)
const groupPresentation = {
  temperature: {
    title: "Excursión de temperatura",
    description:
      "Una excursión termina cuando la temperatura vuelve dentro del rango con margen de sobra, en ambos sentidos.",
  },
  fuelLoad: {
    title: "Subida de nivel (carga)",
    description:
      "Se detecta una carga cuando el nivel sube rápidamente en un tiempo determinado. Con el vehículo detenido y sin avanzar.",
  },
  fuelDrop: {
    title: "Bajada de nivel (sospechosa)",
    description:
      "Tolera el ruido del GPS —hasta 3 km/h y 50 m— porque acá el error caro es el otro: una caída perdida es un robo que no se avisa.",
  },
  ignition: {
    title: "Ignición mal conectada",
    description:
      "Un equipo que pasa casi todo su tiempo de motor en ralentí y casi no se mueve puede tener la ignición mal conectada.",
  },
}
const isFactoryValue = (field) =>
  draft.value[field.id] !== "" &&
  draft.value[field.id] !== null &&
  draft.value[field.id] !== undefined &&
  Number(draft.value[field.id]) === field.default
const groupStates = computed(() =>
  Object.fromEntries(
    ADVANCED_GROUPS.map((group) => {
      const factory = group.fields.every(isFactoryValue)
      const changed = group.fields.some(
        (field) => draft.value[field.id] !== baseline.value[field.id],
      )
      const kind = !ready.value ? "unavailable" : changed ? "dirty" : factory ? "factory" : "custom"
      const label = {
        unavailable: "No disponible",
        dirty: "Sin guardar",
        factory: "Valor de fábrica",
        custom: "Personalizado",
      }[kind]
      return [group.id, { factory, kind, label }]
    }),
  ),
)
const resetGroup = (group) => {
  if (!editable.value || !ready.value) return
  for (const field of group.fields) draft.value[field.id] = field.default
  message.value = ""
}
const isFieldChanged = (field) => draft.value[field.id] !== baseline.value[field.id]
const load = () => {
  try {
    const values = readAdvancedConfiguration(readStorageValue)
    draft.value = { ...values }
    baseline.value = { ...values }
    ready.value = true
    error.value = ""
    message.value = ""
    attempted.value = false
    syncAudit()
  } catch (cause) {
    ready.value = false
    error.value = cause.message
  }
}
const confirmDiscard = () =>
  !dirty.value || window.confirm("Hay cambios sin guardar. Quieres descartarlos?")
const reload = () => {
  if (confirmDiscard()) load()
}
const discard = () => {
  if (!editable.value || !ready.value || !dirty.value) return
  load()
  if (ready.value) message.value = "Cambios descartados."
}
const reset = () => {
  if (!editable.value || !ready.value) return
  draft.value = advancedDefaults()
  attempted.value = false
  message.value = ""
}
const save = () => {
  if (!editable.value || !ready.value || !dirty.value || error.value || !reviewedDraft.value) return
  if (!sameAdvancedConfiguration(draft.value, reviewedDraft.value)) {
    closeChangesDialog()
    return
  }
  attempted.value = true
  if (Object.keys(errors.value).length) return
  try {
    const values = saveAdvancedConfiguration({
      read: readStorageValue,
      write: writeStorageValue,
      draft: reviewedDraft.value,
      expected: baseline.value,
      canEdit: () => editable.value,
      actor: {
        id: currentUser.value?.id,
        name: currentUser.value?.name || currentUser.value?.username || currentUser.value?.email,
      },
    })
    baseline.value = { ...values }
    draft.value = { ...values }
    message.value = "Cambios guardados."
    syncAudit()
  } catch (cause) {
    error.value = cause.message
  }
  closeChangesDialog()
}
const onStorage = (event) => {
  if (event.key !== ADVANCED_STORAGE_KEY && event.key !== null) return
  if (changesDialog.value?.open) closeChangesDialog()
  if (dirty.value) error.value = "Los ajustes cambiaron en otra ventana. Recarga antes de guardar."
  else load()
}
const onUnload = (event) => {
  if (dirty.value) {
    event.preventDefault()
    event.returnValue = ""
  }
}
onBeforeRouteLeave(confirmDiscard)
onMounted(() => {
  load()
  window.addEventListener("storage", onStorage)
  window.addEventListener("beforeunload", onUnload)
  window.addEventListener("resize", closeInformation)
})
onUnmounted(() => {
  window.removeEventListener("storage", onStorage)
  window.removeEventListener("beforeunload", onUnload)
  window.removeEventListener("resize", closeInformation)
})
</script>

<style scoped>
.advanced-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #f4f7fb;
  color: #102372;
}
.advanced-form {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}
.advanced-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 20px 20px;
}
.advanced-content {
  position: relative;
  width: 100%;
  min-height: 0;
  height: auto;
  display: flex;
  flex-direction: column;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: white;
}
.advanced-introduction {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 14px 20px;
  margin-bottom: 0;
  border-bottom: 1px solid #e6ebf2;
  background: #fafbfc;
  border-radius: 8px 8px 0 0;
}
.advanced-introduction h2 {
  margin: 0 0 3px;
  font-size: 15px;
  line-height: 1.3;
  font-weight: 750;
}
.advanced-introduction p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}
.advanced-defaults-status {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 6px;
  background: #eef2f8;
  color: #102372;
  font-size: 11px;
}
.advanced-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-auto-rows: auto;
  flex: none;
  min-width: 0;
  min-height: min-content;
  gap: 0;
  align-items: stretch;
}
.advanced-setting {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(460px, 48%);
  align-items: center;
  gap: 20px;
  min-width: 0;
  padding: 18px 20px;
  border: 0;
  border-bottom: 1px solid #edf1f5;
  border-radius: 0;
  background: white;
}
.advanced-setting:focus-within {
  background: #f8faff;
}
.advanced-setting-info {
  min-width: 0;
}
.advanced-setting-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-height: 22px;
  margin-bottom: 4px;
}
.advanced-setting h2 {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
  font-weight: 750;
}
.advanced-setting-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: 6px;
}
.advanced-icon-temperature {
  background: #fff0ef;
  color: #bf4540;
}
.advanced-icon-fuelLoad {
  background: #eaf6ef;
  color: #287b50;
}
.advanced-icon-fuelDrop {
  background: #fff5df;
  color: #946313;
}
.advanced-icon-ignition {
  background: #edf0f4;
  color: #526174;
}
.advanced-setting-state {
  padding: 3px 8px;
  border-radius: 4px;
  background: #f0f2f5;
  color: #596574;
  font-size: 11px;
  line-height: 1.4;
  white-space: nowrap;
}
.advanced-state-dirty {
  background: #fff1df;
  color: #975600;
}
.advanced-state-custom {
  background: #eaf6ef;
  color: #287b50;
}
.advanced-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px;
  align-items: center;
  gap: 14px;
  border-left: 0;
  padding-left: 0;
  min-width: 0;
}
.advanced-reset-group {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid #dce5f3;
  border-radius: 6px;
  color: #49658f;
  background: white;
  cursor: pointer;
}
.advanced-reset-group:not(:disabled):hover {
  color: #0653cf;
  background: #f2f6fc;
}
.advanced-factory-hint {
  grid-column: 1 / -1;
  margin: 0;
  color: #677587;
  font-size: 11px;
  line-height: 1.4;
}
.advanced-field-comparison {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  grid-column: 1 / -1;
  margin: 0;
  color: #677587;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.advanced-field-comparison :deep(svg) {
  width: 12px;
  height: 12px;
}
.advanced-new-value {
  color: #975600;
  font-weight: 600;
}
.advanced-description {
  max-width: 680px;
  margin: 0 0 6px;
  font-size: 13px;
  line-height: 1.45;
  color: #344465;
}
.advanced-measurement {
  font-size: 12px;
  color: #0653cf;
}
.advanced-measurement summary {
  width: fit-content;
  cursor: pointer;
  padding: 4px 0;
}
.advanced-measurement[open] p {
  margin-top: 6px;
  padding: 8px 12px;
  border-left: 2px solid #b8cdea;
  color: #49658f;
}
.advanced-measurement p {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}
.advanced-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  justify-content: start;
  align-items: start;
  gap: 16px 24px;
  min-width: 0;
}
.advanced-field-row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 8px 12px;
  align-items: center;
  color: #202b3b;
  font-size: 14px;
}
.advanced-field-row > label,
.advanced-field-row > span {
  overflow-wrap: anywhere;
}
.advanced-field-row > label {
  grid-column: 1 / -1;
  font-weight: 600;
}
.advanced-field-row > span {
  color: #586574;
  font-size: 13px;
}
.advanced-field-row input {
  width: 100%;
  min-width: 0;
  height: 38px;
  box-sizing: border-box;
  padding: 0 8px;
  border: 1px solid #ccd8eb;
  border-radius: 6px;
  background: #fff;
  color: #102060;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
}
.advanced-field-row input::-webkit-inner-spin-button {
  opacity: 1;
}
input:focus-visible,
button:focus-visible,
summary:focus-visible,
a:focus-visible {
  outline: 2px solid #ff6600;
  outline-offset: 2px;
}
input:disabled,
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.advanced-info-trigger {
  margin-top: 0;
  padding: 8px 20px;
  flex-shrink: 0;
}
.advanced-elsewhere {
  inset: auto;
  margin: 0;
  width: min(440px, calc(100% - 32px));
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  padding: 18px;
  border: 1px solid #dce5f3;
  border-radius: 8px;
  background: #fbfcff;
  box-shadow: 0 8px 30px rgb(16 35 114 / 0.16);
}
.advanced-info-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}
.advanced-info-heading h2 {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 750;
}
.advanced-info-trigger button,
.advanced-info-heading button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #dce5f3;
  border-radius: 6px;
  background: white;
  color: #0065ff;
}
.advanced-info-trigger :deep(svg),
.advanced-info-heading :deep(svg) {
  width: 18px;
  height: 18px;
}
.advanced-info-trigger button {
  width: auto;
  height: auto;
  min-height: 36px;
  gap: 8px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: #49658f;
  font-size: 14px;
  cursor: pointer;
}
.advanced-info-trigger button:hover {
  color: #0653cf;
  text-decoration: underline;
}
.advanced-elsewhere-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}
.advanced-elsewhere article {
  min-width: 0;
  border-bottom: 1px solid #e4eaf3;
  padding: 0 0 14px;
}
.advanced-elsewhere article:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}
.advanced-elsewhere h3 {
  margin: 0 0 3px;
  font-size: 13px;
  line-height: 1.4;
  font-weight: 750;
}
.advanced-elsewhere p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #5f7396;
}
.advanced-elsewhere a {
  color: #0065ff;
  text-decoration: underline;
}
.advanced-provenance {
  grid-column: 1 / -1;
  margin: 16px 0 0;
  color: #7b8da8;
  font-size: 10px;
  line-height: 1.5;
}
.advanced-module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  flex-shrink: 0;
  gap: 12px 24px;
  padding: 16px 20px;
  border-bottom: 0;
  background: transparent;
}
.advanced-module-heading,
.advanced-header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}
.advanced-module-heading h1 {
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
  font-weight: 750;
}
.advanced-scope {
  padding: 4px 8px;
  border-radius: 4px;
  background: #eef2f7;
  color: #526174;
  font-size: 10px;
  font-weight: 600;
}
.advanced-save-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding: 5px 12px;
  margin: 0 4px 0 0;
  border: 0;
  border-radius: 999px;
  background: #e8f4ed;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  color: #357052;
}
.advanced-status-dot {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: currentColor;
}
.advanced-save-status.is-dirty {
  border-color: #f0dfbc;
  background: #fff7e9;
  color: #975600;
}
.advanced-save-status.is-unavailable {
  border-color: #e0e5eb;
  background: #f3f5f7;
  color: #667383;
}
.advanced-save-status.is-error {
  border-color: #f0d3d3;
  background: #fff1f0;
  color: #b42335;
}
.advanced-header-error {
  margin: 0;
  padding: 8px 18px;
  background: #fff1f0;
  color: #b42335;
  font-size: 12px;
}
.advanced-header-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  background: white;
  color: #102372;
  font-size: 12px;
  font-weight: 700;
}
.advanced-header-actions :deep(svg) {
  width: 16px;
  height: 16px;
}
.advanced-header-actions .advanced-save {
  background: #ff6600;
  border-color: #ff6600;
  color: white;
}
.advanced-error {
  color: #b42335;
  font-size: 11px;
}
.advanced-audit-warning {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 18px;
  font-size: 12px;
  color: #975600;
  background: #fff7e9;
}
.advanced-audit-warning button {
  padding: 6px 10px;
  border: 1px solid #efd8b5;
  border-radius: 6px;
  background: white;
  color: #975600;
  font-weight: 600;
  cursor: pointer;
}
.advanced-changes-dialog {
  width: min(760px, calc(100vw - 32px));
  height: min(600px, calc(100dvh - 32px));
  max-height: calc(100dvh - 32px);
  overflow: hidden;
  margin: auto;
  padding: 0;
  border: 1px solid #dce4f1;
  border-radius: 8px;
  background: white;
  color: #102372;
  box-shadow: 0 24px 80px rgb(10 20 45 / 0.28);
}
.advanced-changes-dialog[open] {
  display: flex;
  flex-direction: column;
}
.advanced-changes-dialog::backdrop {
  background: rgb(15 25 45 / 0.48);
}
.advanced-dialog-heading,
.advanced-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  flex-shrink: 0;
}
.advanced-dialog-heading {
  border-bottom: 2px solid #ff6600;
  background: white;
}
.advanced-dialog-title-group {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.advanced-dialog-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 6px;
  background: #102372;
  color: white;
}
.advanced-dialog-heading h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.3;
  font-weight: 750;
}
.advanced-dialog-title-group p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #5c6e91;
}
.advanced-dialog-heading button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 1px solid #d6dfef;
  border-radius: 6px;
  color: #102372;
  background: white;
  cursor: pointer;
}
.advanced-dialog-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
  scrollbar-gutter: stable;
}
.advanced-changes-table-wrap {
  overflow-x: auto;
}
.advanced-changes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
  background: white;
}
.advanced-changes-table th,
.advanced-changes-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #e2e7f0;
  vertical-align: middle;
}
.advanced-changes-table thead {
  background: #edf2fa;
  color: #5c6e91;
}
.advanced-changes-table tbody th {
  width: 56%;
  font-weight: 600;
}
.advanced-dialog-note {
  margin: 0 0 16px;
  color: #5c6e91;
  font-size: 12px;
  line-height: 1.5;
}
.advanced-dialog-footer {
  border-top: 1px solid #dce4f1;
  padding: 14px 24px;
  justify-content: flex-end;
  flex-wrap: wrap;
  background: #fafbfe;
}
.advanced-dialog-footer button {
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid #cbd6e9;
  border-radius: 6px;
  background: white;
  color: #102372;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.advanced-dialog-footer button:not(:disabled):hover {
  background: #edf2fa;
}
.advanced-dialog-footer .advanced-confirm-save {
  background: #ff6600;
  border-color: #ff6600;
  color: white;
}
.advanced-dialog-footer .advanced-confirm-save:not(:disabled):hover {
  background: #e65c00;
}
.advanced-field-row .advanced-error {
  grid-column: 1 / -1;
  margin: 0;
}
@media (max-width: 600px) {
  .advanced-dialog-heading {
    padding: 16px 12px;
    gap: 8px;
  }
  .advanced-dialog-title-group {
    gap: 8px;
  }
  .advanced-dialog-icon {
    width: 32px;
    height: 32px;
  }
  .advanced-dialog-heading h2 {
    font-size: 18px;
  }
  .advanced-dialog-title-group p {
    font-size: 11px;
  }
  .advanced-dialog-content {
    padding: 16px 12px;
  }
  .advanced-changes-table th,
  .advanced-changes-table td {
    padding: 10px 6px;
  }
  .advanced-dialog-footer {
    padding: 12px;
    gap: 8px;
  }
}
@media (max-width: 999px) {
  .advanced-content {
    min-height: 0;
    height: auto;
  }
  .advanced-editor {
    grid-template-rows: none;
  }
  .advanced-setting {
    grid-template-columns: minmax(0, 1fr);
  }
  .advanced-controls {
    border-left: 0;
    border-top: 1px solid #dce5f3;
    padding: 16px 0 0;
  }
}
@media (max-width: 767px) {
  .advanced-introduction {
    flex-wrap: wrap;
    padding: 16px;
  }
  .advanced-introduction h2 {
    font-size: 15px;
  }
  .advanced-module-heading h1 {
    font-size: 18px;
  }
  .advanced-scroll {
    padding: 14px 12px;
  }
  .advanced-setting {
    padding: 18px;
    gap: 18px;
  }
  .advanced-fields {
    grid-template-columns: minmax(0, 1fr);
  }
  .advanced-field-row {
    grid-template-columns: 88px minmax(0, 1fr);
  }
  .advanced-elsewhere,
  .advanced-elsewhere-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  .advanced-elsewhere article {
    border-left: 0;
    padding-left: 0;
  }
  .advanced-module-header {
    padding: 12px;
  }
  .advanced-header-actions {
    width: 100%;
  }
  .advanced-save-status {
    max-width: 100%;
  }
}
</style>
