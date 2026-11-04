<template>
  <section class="limits-page" aria-label="Límites">
    <div class="limits-workspace">
      <div class="limits-modes" role="tablist" aria-label="Tipo de límite">
        <button
          v-for="mode in modes"
          :id="'tab-' + mode.id"
          :key="mode.id"
          type="button"
          role="tab"
          :aria-selected="activeMode === mode.id"
          aria-controls="limits-panel"
          :class="{ active: activeMode === mode.id }"
          @click="activeMode = mode.id"
        >
          {{ mode.title }}
        </button>
      </div>
      <div id="limits-panel" role="tabpanel" :aria-labelledby="'tab-' + activeMode">
        <div v-if="activeMode === 'idle'" class="limits-price">
          <SvgIcon name="volumen" />
          <span>Precio del combustible por litro</span>
          <div><strong>{{ currency(lastFuelPrice?.price ?? 1548) }}</strong><span> / litro</span></div>
          <small>{{ lastFuelPrice
            ? 'Para estimar el costo del ralentí. Último precio usado: ' + lastFuelPrice.date + '. Se cambia al generar el informe.'
            : 'Ejemplo para estimar el costo del ralentí. No se aplica a los informes; ingresa el precio al generarlos.' }}</small>
        </div>
        <div class="limits-editor-layout">
          <nav class="limits-type-list" aria-label="Tipos de vehículo">
            <div class="limits-list-heading"><span>Tipos de vehículo</span><span>Vehículos</span><span>{{ activeMode === 'speed' ? 'Límite (km/h)' : 'Consumo (L/h)' }}</span></div>
            <button v-for="type in rows" :key="type.id" type="button" class="limits-type-option" :class="{ selected: selectedType.id === type.id }" :aria-pressed="selectedType.id === type.id" @click="selectedId = type.id">
              <span class="limits-type-name"><img v-if="imageFor(type)" :src="imageFor(type)" :class="{ 'limits-bus-image': type.id === 'bus' }" alt="" /><strong>{{ type.label }}</strong></span>
              <span>{{ counts[type.id] || 0 }}</span>
              <span class="limits-list-value"><strong>{{ effectiveValue(activeMode, type) }}</strong><small>{{ unit }}</small></span>
              <span aria-hidden="true">›</span>
            </button>
          </nav>
          <div class="limits-detail">
            <header class="limits-detail-heading">
              <img v-if="imageFor(selectedType)" :src="imageFor(selectedType)" :class="{ 'limits-bus-image': selectedType.id === 'bus' }" alt="" />
              <div><h2>{{ selectedType.label }}</h2><p>{{ counts[selectedType.id] || 0 }} vehículos</p></div>
            </header>
            <div class="limits-detail-fields">
              <div class="limits-value-field">
                <label for="limits-selected-value">{{ activeMode === 'speed' ? 'Límite de velocidad (km/h)' : 'Consumo con el motor detenido (L/h)' }}</label>
                <div class="limits-input-group"><input
                  id="limits-selected-value"
                  :key="`${scope}:${activeMode}:${selectedType.id}:${revision}`"
                  type="number"
                  :min="activeMode === 'speed' ? 1 : 0"
                  :max="activeMode === 'speed' ? 300 : 100"
                  :step="activeMode === 'speed' ? 1 : 0.01"
                  :value="effectiveValue(activeMode, selectedType)"
                  :disabled="!editable || !ready"
                  :data-scope="scope"
                  @input="updatePreview($event)"
                  @change="commit(activeMode, selectedType, $event)"
                /><span>{{ unit }}</span></div>
              </div>
            </div>
            <section v-if="activeMode === 'speed'" class="limits-threshold-preview" aria-label="Vista previa del umbral">
              <header><h3>Vista previa del umbral</h3><span>Exceso sobre {{ previewLimit }} km/h</span></header>
              <div class="limits-threshold-track" aria-hidden="true"><span></span><span></span><span></span></div>
              <div class="limits-threshold-examples">
                <div><strong>{{ Math.max(0, previewLimit - 10) }} <small>km/h</small></strong><span>Dentro del límite</span></div>
                <div><strong>{{ previewLimit }} <small>km/h</small></strong><span>En el límite</span></div>
                <div><strong>{{ previewLimit + 10 }} <small>km/h</small></strong><span>Exceso de 10 km/h</span></div>
              </div>
              <p><SvgIcon name="detail-info" />La alerta puede depender de otras condiciones configuradas en el backend.</p>
            </section>
            <dl class="limits-detail-summary limits-original-summary">
              <div><SvgIcon name="vehiculos" /><dt>Total de vehículos</dt><dd>{{ counts[selectedType.id] || 0 }}</dd></div>
              <div><SvgIcon name="limits-save" /><dt>{{ activeMode === 'speed' ? 'Límite guardado' : 'Consumo guardado' }}</dt><dd>{{ savedValue(activeMode, selectedType) }} {{ unit }}</dd></div>
              <div><SvgIcon name="limits-reset" /><dt>Valor original</dt><dd>{{ originalValue(activeMode, selectedType) }} {{ unit }}</dd></div>
            </dl>
            <div class="limits-type-explanation">
              <SvgIcon name="detail-info" />
              <div><strong>{{ activeMode === 'speed' ? 'Cómo se aplica este límite' : 'Cómo se calcula el consumo' }}</strong>
                <p>{{ activeMode === 'speed'
                  ? 'El límite corresponde a los vehículos del tipo seleccionado. Circular a la misma velocidad del límite no constituye un exceso; superarlo sí. El valor guardado es la última configuración registrada, mientras que el valor original es la referencia de base.'
                  : 'El consumo configurado indica los litros estimados por cada hora con el motor detenido. Los informes utilizan este valor junto al tiempo en ralentí; el costo depende del precio del combustible indicado al generar el informe.' }}</p>
              </div>
            </div>
          </div>
        </div>


      </div>
      <footer class="limits-actions">
        <p v-if="error" class="limits-error" role="alert">{{ error }}</p>
        <p v-else role="status">{{ savedMessage || (dirty ? "Cambios sin guardar" : "") }}</p>
        <button class="limits-discard" type="button" :disabled="!editable || !ready || !dirty" title="Descarta los cambios de ambas pestañas y vuelve a lo último guardado" @click="discard"><SvgIcon name="limits-reset" />Descartar cambios</button>
        <button type="button" :disabled="!editable || !ready" @click="reset">
          <SvgIcon name="limits-reset" />Restablecer valores
        </button>
        <button
          type="button"
          class="limits-save"
          :disabled="!editable || !ready || !dirty"
          @click="save"
        >
          <SvgIcon name="limits-save" />Guardar cambios
        </button>
      </footer>
    </div>
  </section>
</template>
<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue"
import { useRoute, onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router"
import SvgIcon from "../components/icons/SvgIcon.vue"
import { getAssetImageMarkerVariant } from "../composables/activos/map/assetMarkers/assetMarkerIcons.js"
import {
  readLastFuelPrice,
  fuelPriceStorageKey,
} from "../utils/reports/execution/reportLimitsContext.js"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { readStorageValue, writeStorageValue } from "../services/storage/browserStorage.js"
import {
  LIMIT_TYPES,
  IDLE_TYPE_ORDER,
  limitAssetType,
  readLimitsConfiguration,
  saveLimitsConfiguration,
  sameLimits,
} from "../utils/layout/limitsConfiguration.js"

const route = useRoute()
const { isPlatformAdmin, visibleAssets, canAccessCompany, canAccessFunction } = useAccessControl()
const companyId = computed(() => String(route.params.empresaId || ""))
const scope = computed(() => companyId.value || "platform")
const activeMode = ref("speed")
const modes = [
  { id: "speed", title: "Límites de velocidad" },
  { id: "idle", title: "Consumo con el motor detenido" },
]
const editable = computed(
  () =>
    isPlatformAdmin.value ||
    (companyId.value &&
      canAccessCompany(companyId.value) &&
      canAccessFunction("configuration-limits", companyId.value, "edit")),
)
const fleet = computed(() =>
  visibleAssets.value.filter(
    (asset) => !companyId.value || String(asset.companyId) === companyId.value,
  ),
)
const counts = computed(() => {
  const result = {}
  for (const asset of fleet.value) {
    const type = limitAssetType(asset)
    if (type) result[type] = (result[type] || 0) + 1
  }
  return result
})
const speedTypes = LIMIT_TYPES
const idleTypes = computed(() =>
  IDLE_TYPE_ORDER.filter((id) => id !== "motorcycle").map((id) =>
    LIMIT_TYPES.find((type) => type.id === id),
  ),
)
const overrides = ref({ speed: {}, idle: {} })
const draft = ref({ speed: {}, idle: {} })
const dirty = computed(() => !sameLimits(overrides.value, draft.value))
const platform = ref({ speed: {}, idle: {} })
const error = ref("")
const savedMessage = ref("")
const revision = ref(0)
const ready = ref(false)
const lastFuelPrice = ref(null)
const currency = (value) =>
  `$${value.toLocaleString("es-CL", { useGrouping: false, maximumFractionDigits: 2 })}`
const load = () => {
  ready.value = false
  error.value = ""
  savedMessage.value = ""
  lastFuelPrice.value = companyId.value
    ? readLastFuelPrice(readStorageValue, companyId.value)
    : null
  overrides.value = { speed: {}, idle: {} }
  platform.value = { speed: {}, idle: {} }
  try {
    platform.value = readLimitsConfiguration(readStorageValue)
    overrides.value = companyId.value
      ? readLimitsConfiguration(readStorageValue, companyId.value)
      : platform.value
    draft.value = structuredClone(
      overrides.value ? JSON.parse(JSON.stringify(overrides.value)) : { speed: {}, idle: {} },
    )
    ready.value = true
  } catch {
    error.value =
      "No se pudieron leer los límites guardados. No se sobrescribirán los datos existentes."
  }
  revision.value++
}

const effectiveValue = (kind, type) =>
  draft.value[kind][type.id] ??
  (companyId.value ? platform.value[kind][type.id] : undefined) ??
  type[kind]
const savedValue = (kind, type) =>
  overrides.value[kind][type.id] ??
  (companyId.value ? platform.value[kind][type.id] : undefined) ?? type[kind]
const originalValue = (kind, type) =>
  (companyId.value ? platform.value[kind][type.id] : undefined) ?? type[kind]
const rows = computed(() => (activeMode.value === "speed" ? speedTypes : idleTypes.value))
const selectedId = ref("bus")
const selectedType = computed(() => rows.value.find(type => type.id === selectedId.value) || rows.value[0])
const unit = computed(() => activeMode.value === "speed" ? "km/h" : "L/h")
const previewInput = ref(null)
const previewLimit = computed(() => previewInput.value ?? effectiveValue("speed", selectedType.value))
const updatePreview = (event) => {
  if (!editable.value || !ready.value || activeMode.value !== "speed") return
  previewInput.value = event.target.value && event.target.validity.valid ? Number(event.target.value) : null
}
watch([scope, activeMode, selectedId, revision], () => { previewInput.value = null })
const discard = () => {
  if (!editable.value || !ready.value || !dirty.value) return
  load()
  if (ready.value) savedMessage.value = "Cambios descartados. Se muestran los valores guardados."
}
const imageFor = (type) => getAssetImageMarkerVariant({ assetType: type.id })?.url
const commit = (kind, type, event) => {
  previewInput.value = null
  if (!editable.value || !ready.value || event.target.dataset.scope !== scope.value) return
  savedMessage.value = ""
  if (!event.target.validity.valid) {
    error.value =
      kind === "speed"
        ? "Ingresa una velocidad entera entre 1 y 300 km/h."
        : "Ingresa un consumo entre 0 y 100 L/h."
    event.target.value = effectiveValue(kind, type)
    return
  }
  if (event.target.value === "") delete draft.value[kind][type.id]
  else draft.value[kind][type.id] = Number(event.target.value)
  event.target.value = effectiveValue(kind, type)
  error.value = ""
}
const reset = () => {
  draft.value[activeMode.value] = {}
  revision.value++
  error.value = ""
  savedMessage.value = "Valores restablecidos. Guarda para aplicar."
}
const save = () => {
  try {
    const next = saveLimitsConfiguration({
      read: readStorageValue,
      write: writeStorageValue,
      companyId: companyId.value,
      draft: draft.value,
      expected: overrides.value,
      canEdit: () => Boolean(ready.value && editable.value),
    })
    overrides.value = next
    draft.value = JSON.parse(JSON.stringify(next))
    if (!companyId.value) platform.value = next
    error.value = ""
    savedMessage.value = "Cambios guardados."
  } catch (cause) {
    error.value = cause.message
    savedMessage.value = ""
  }
}
const hasUnsavedChanges = () => {
  if (dirty.value) return true
  const input = document.getElementById("limits-selected-value")
  if (!ready.value || !editable.value || !input || input.dataset.scope !== scope.value) return false
  // A reload can happen before the focused number field emits change.
  return input.value === "" || Number(input.value) !== effectiveValue(activeMode.value, selectedType.value)
}
const protectUnload = (event) => {
  if (!hasUnsavedChanges()) return
  event.preventDefault()
  event.returnValue = ""
}
const confirmLeave = () =>
  !hasUnsavedChanges() || window.confirm("Hay cambios sin guardar. ¿Quieres salir sin guardarlos?")
onBeforeRouteLeave(confirmLeave)
onBeforeRouteUpdate((to, from) => to.params.empresaId === from.params.empresaId || confirmLeave())
watch(companyId, load, { immediate: true })
const sync = (event) => {
  if (
    event.key === null ||
    event.key?.startsWith("sinergy-configuration-limits-v1:") ||
    event.key === fuelPriceStorageKey(companyId.value)
  )
    if (dirty.value)
      error.value = "La configuración cambió en otra ventana. Recarga antes de guardar."
    else load()
}
onMounted(() => {
  window.addEventListener("storage", sync)
  window.addEventListener("beforeunload", protectUnload)
})
onBeforeUnmount(() => {
  window.removeEventListener("storage", sync)
  window.removeEventListener("beforeunload", protectUnload)
})
</script>

<style scoped>
.limits-origin, .limits-original { background: #edf2f8; color: #526585; }
.limits-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding: 12px;
  background: #f5f7fb;
  color: #00165c;
  overflow: auto;
}
.limits-workspace {
  width: 100%;
  min-width: 0;
  padding: 14px;
  border: 1px solid #d5deed;
  border-radius: 8px;
  background: white;
}
.limits-modes {
  display: flex;
  gap: 0;
  margin-bottom: 12px;
  border-bottom: 1px solid #d5deed;
}
.limits-modes button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 8px 24px;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.limits-modes button.active {
  border-bottom-color: #ff6600;
  color: #102372;
}
.limits-modes button:hover {
  color: #102372;
}
.limits-modes :deep(.svg-icon-wrapper) {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
}
.limits-info {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  margin-top: 12px;
  margin-bottom: 0;
  flex-shrink: 0;
  border: 1px solid #cfe2ff;
  border-radius: 8px;
  background: #eef6ff;
  font-size: 14px;
  line-height: 1.5;
}
.limits-info :deep(.svg-icon-wrapper) {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  color: #0072d9;
}
.limits-info p {
  margin: 0;
}
.limits-table-scroll {
  min-width: 0;
  border: 1px solid #e2e9f3;
  border-radius: 8px;
}
.limits-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 14px;
}
.limits-table thead {
  background: #edf2f8;
  color: #4c638c;
  font-size: 12px;
}
.limits-table th,
.limits-table td {
  padding: 6px 16px;
  overflow-wrap: anywhere;
  text-align: left;
}
.limits-table thead th {
  height: 40px;
}
.limits-table th:first-child {
  width: 26%;
}
.limits-table th:nth-child(2) {
  width: 13%;
}
.limits-table th:nth-child(3) {
  width: 23%;
}
.limits-table th:nth-child(4) {
  width: 10%;
}
.limits-table tbody tr {
  height: 46px;
  border-top: 1px solid #e1e7f1;
}
.limits-table td {
  color: #5673a5;
}
.limits-vehicle {
  display: flex;
  align-items: center;
  gap: 14px;
}
.limits-vehicle img {
  width: 54px;
  height: 40px;
  flex-shrink: 0;
  object-fit: contain;
}
.limits-vehicle :deep(.svg-icon-wrapper) {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}
.limits-page img.limits-bus-image {
  transform: scale(1.4);
  transform-origin: center;
}
.limits-table input {
  width: min(100%, 208px);
  min-width: 0;
  height: 34px;
  padding: 6px 12px;
  border: 1px solid #d2dced;
  border-radius: 8px;
  background: white;
  color: #00165c;
  font: inherit;
  text-align: right;
}
.limits-table input::-webkit-inner-spin-button {
  opacity: 1;
}
button:focus-visible,
input:focus-visible,
a:focus-visible {
  outline: 2px solid #ff6600;
  outline-offset: 2px;
}
.limits-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
.limits-actions p {
  flex: 1;
  margin: 0;
  color: #50688f;
  font-size: 13px;
}
.limits-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 40px;
  padding: 8px 18px;
  border: 1px solid #bdcbe0;
  border-radius: 8px;
  background: white;
  color: #50617f;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.limits-actions button.limits-save {
  background: #ff6600;
  border-color: #ff6600;
  color: white;
}
button:disabled,
input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.limits-actions p.limits-error,
.limits-warning {
  color: #c52335;
}
@media (min-width: 901px) and (min-height: 650px) {
  .limits-workspace {
    display: flex;
    flex: 1;
    flex-direction: column;
  }
  #limits-panel {
    display: flex;
    flex: 1;
    flex-direction: column;
  }
  .limits-table-scroll,
  .limits-table,
  .limits-table tbody {
    display: flex;
    flex: 1;
    flex-direction: column;
  }
  .limits-table thead {
    flex-shrink: 0;
  }
  .limits-table tr {
    display: grid;
    grid-template-columns: 26% 13% 23% 10% 28%;
    align-items: center;
  }
  .limits-table tbody tr {
    flex: 1;
    min-height: 46px;
    height: auto;
  }
  .limits-table th:nth-child(n) {
    width: auto;
  }
  .limits-table thead th {
    display: flex;
    align-items: center;
  }
}
@media (max-width: 900px) {
  .limits-page {
    padding: 12px;
  }
  .limits-workspace {
    padding: 12px;
  }
  .limits-modes button {
    font-size: 14px;
    padding: 10px 12px;
    gap: 12px;
  }
  .limits-table {
    font-size: 12px;
  }
  .limits-table th,
  .limits-table td {
    padding: 6px 8px;
  }
  .limits-vehicle {
    gap: 6px;
  }
  .limits-actions {
    flex-wrap: wrap;
  }
  .limits-actions p {
    flex-basis: 100%;
  }
}
@media (max-width: 500px) {
  .limits-vehicle img {
    width: 44px;
    height: 34px;
  }
  .limits-table thead {
    font-size: 10px;
  }
  .limits-table th,
  .limits-table td {
    padding: 6px 3px;
  }
  .limits-vehicle {
    flex-direction: column;
    align-items: flex-start;
  }
  .limits-table input {
    padding: 4px;
  }
  .limits-modes {
    grid-template-columns: 1fr;
    margin-bottom: 14px;
  }
  .limits-modes button {
    min-height: 50px;
  }
  .limits-info {
    padding: 12px;
    gap: 10px;
    font-size: 13px;
  }
  .limits-actions button {
    flex: 1;
    padding: 10px;
    font-size: 12px;
  }
}

.limits-price {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
  flex-shrink: 0;
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid #e2e9f3;
  border-radius: 6px;
  background: #f8fafc;
  color: #526585;
  font-size: 12px;
  line-height: 1.5;
}
.limits-price > span { font-weight: 600; }
.limits-price strong { color: #102372; font-size: 16px; font-weight: 800; }
.limits-price small { flex: 1 1 340px; color: #64748b; font-size: 12px; }

.limits-editor-layout { display: grid; grid-template-columns: minmax(320px, 35%) minmax(0, 1fr); gap: 18px; flex: 1; }
.limits-type-list { min-width: 0; background: #f6f8fb; padding: 8px; border-radius: 6px; display: flex; flex-direction: column; }
.limits-list-heading, .limits-type-option { display: grid; grid-template-columns: minmax(0, 1fr) 65px 65px 12px; gap: 8px; align-items: center; }
.limits-list-heading { padding: 12px 10px; color: #526585; font-size: 12px; }
.limits-type-option { flex: 1; width: 100%; min-height: 64px; border: 1px solid transparent; border-bottom-color: #e2e9f3; padding: 10px; background: white; color: #00165c; text-align: left; cursor: pointer; font: inherit; font-size: 13px; }
.limits-type-option.selected { border-color: #cfe2ff; border-left: 4px solid #1682ff; background: #eaf3ff; border-radius: 5px; }
.limits-type-name { display: flex; align-items: center; gap: 12px; min-width: 0; overflow-wrap: anywhere; }
.limits-type-name img { width: 66px; height: 46px; object-fit: contain; }
.limits-list-value strong { font-size: 18px; }
.limits-list-value small { display: block; color: #526585; margin-top: 3px; font-size: 11px; }
.limits-detail { min-width: 0; padding: 20px; border: 1px solid #d8dee8; border-radius: 6px; background: white; }
.limits-detail-heading { display: flex; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 24px; }
.limits-detail-heading > img { width: 110px; height: 80px; object-fit: contain; }
.limits-detail-heading > div { flex: 1; }
.limits-detail h2 { margin: 0; font-size: 20px; font-weight: 750; }
.limits-detail-heading p { margin: 8px 0 0; color: #526585; font-size: 13px; }
.limits-detail-fields { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; padding: 24px 0; border-top: 1px solid #e2e9f3; }
.limits-value-field label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; }
.limits-input-group { display: flex; align-items: center; gap: 14px; }
.limits-input-group input { width: 100%; max-width: 280px; min-width: 0; height: 38px; box-sizing: border-box; border: 1px solid #cfd8e6; border-radius: 6px; color: #102372; background: white; padding: 6px 12px; font-size: 17px; font-weight: 700; }
.limits-input-group > span { flex-shrink: 0; font-size: 13px; }
.limits-workspace { padding: 16px; }
.limits-editor-layout { grid-template-columns: minmax(350px, 34.5%) minmax(0, 1fr); gap: 16px; }
.limits-list-heading, .limits-type-option { grid-template-columns: minmax(0, 1fr) 20% 19% 12px; }
.limits-type-list { padding: 8px; }
.limits-list-heading { min-height: 36px; padding: 4px 14px; }
.limits-type-option { min-height: 78px; padding: 12px 14px; }
.limits-type-name img { width: 84px; height: 60px; }
.limits-type-name { gap: 16px; }
.limits-detail { padding: 24px 18px; }
.limits-detail-heading { min-height: 56px; margin: 0 0 16px; }
.limits-detail-heading > img { width: 80px; height: 56px; }
.limits-detail-fields { background: transparent; border: 0; border-top: 1px solid #edf1f5; border-radius: 0; padding: 18px 0; grid-template-columns: minmax(0, 1fr); gap: 16px; }
.limits-input-group > span { display: flex; align-items: center; justify-content: center; min-width: 42px; height: 38px; color: #526585; }
.limits-detail-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 16px 0; margin: 12px 0 0; background: transparent; border: 0; border-top: 1px solid #edf1f5; border-bottom: 1px solid #edf1f5; border-radius: 0; }
.limits-detail-summary > div { display: grid; grid-template-columns: 32px minmax(0, 1fr); align-content: start; gap: 8px 12px; padding: 8px 16px; border-right: 1px solid #d5deed; overflow-wrap: anywhere; }
.limits-detail-summary > div:last-child { border-right: 0; }
.limits-detail-summary :deep(.svg-icon-wrapper) { grid-row: span 2; width: 22px; height: 22px; color: #526585; }
.limits-detail-summary dt { font-size: 12px; color: #526585; }
.limits-detail-summary dd { margin: 0; font-size: 14px; font-weight: 600; color: #102372; }
.limits-actions { padding: 2px 4px 14px; }
.limits-actions button { min-height: 38px; }
@media (min-width: 1001px) and (min-height: 650px) { .limits-type-option { min-height: 78px; } }
@media (max-width: 1200px) { .limits-detail-fields { gap: 18px; padding: 20px; grid-template-columns: minmax(0, 1fr); } .limits-type-name img { width: 54px; } .limits-detail-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 0; } .limits-detail-summary > div:nth-child(2) { border-right: 0; } }
@media (max-width: 1000px) { .limits-editor-layout { grid-template-columns: minmax(280px, 40%) minmax(0, 1fr); } .limits-detail { padding: 16px; } .limits-detail-fields { grid-template-columns: 1fr; } .limits-detail-state { border-left: 0; padding-left: 0; } .limits-type-name img { width: 44px; } }
@media (max-width: 650px) { .limits-editor-layout { grid-template-columns: 1fr; } .limits-detail-heading > img { width: 75px; height: 60px; } }
.limits-detail-summary dd { overflow-wrap: anywhere; white-space: pre-wrap; }
.limits-editor-layout { flex: 0 0 auto; align-items: stretch; }
.limits-type-option { min-height: 66px; }
.limits-workspace, #limits-panel { flex: 0 0 auto; }
.limits-workspace { min-height: 0; }

.limits-threshold-preview { margin-top: 18px; padding: 20px 0; border-top: 1px solid #d5deed; }
.limits-threshold-preview header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.limits-threshold-preview h3 { margin: 0; font-size: 15px; }
.limits-threshold-preview header > span { color: #526585; font-size: 12px; }
.limits-threshold-track { display: grid; grid-template-columns: repeat(3, 1fr); height: 8px; gap: 3px; border-radius: 4px; overflow: hidden; }
.limits-threshold-track span:nth-child(1) { background: #20966b; }
.limits-threshold-track span:nth-child(2) { background: #e4aa23; }
.limits-threshold-track span:nth-child(3) { background: #ff6600; }
.limits-threshold-examples { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 16px 0; }
.limits-threshold-examples > div { display: flex; flex-direction: column; gap: 8px; }
.limits-threshold-examples strong { font-size: 18px; }
.limits-threshold-examples small { font-size: 12px; font-weight: 400; }
.limits-threshold-examples span { font-size: 12px; color: #526585; }
.limits-threshold-examples > div:last-child strong { color: #ad4700; }
.limits-threshold-preview > p { display: flex; align-items: flex-start; gap: 10px; margin: 18px 0 0; color: #526585; font-size: 12px; line-height: 1.5; }
@media (max-width: 500px) { .limits-threshold-examples strong { font-size: 18px; } }
.limits-original-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.limits-original-summary > div:nth-child(2) { border-right: 1px solid #d5deed; }
@media (max-width: 650px) { .limits-original-summary { grid-template-columns: 1fr; } .limits-original-summary > div { border-right: 0; } .limits-original-summary > div:nth-child(2) { border-right: 0; } }
@media (min-width: 1001px) and (min-height: 600px) {
  .limits-page { display: flex; padding: 10px 12px; box-sizing: border-box; }
  .limits-workspace { flex: 1; min-height: 0; min-width: 0; padding: 12px 16px; }
  .limits-modes { flex-shrink: 0; margin-bottom: 10px; }
  .limits-modes button { min-height: 38px; padding: 8px 24px; }
  #limits-panel { flex: 1; min-height: 0; }
  .limits-editor-layout { flex: 1; min-height: 0; }
  .limits-type-list { min-height: 0; }
  .limits-list-heading { flex: 0 0 30px; min-height: 0; padding: 0 12px; }
  .limits-type-option { flex: 1 1 0; min-height: 0; padding: 3px 12px; box-sizing: border-box; }
  .limits-type-name { gap: 12px; }
  .limits-type-name img { width: 64px; height: clamp(26px, 4.7vh, 46px); }
  .limits-list-value strong { font-size: 16px; }
  .limits-list-value small { margin-top: 1px; font-size: 10px; }
  .limits-detail { padding: 16px 18px; min-height: 0; }
  .limits-detail-heading { min-height: 48px; margin: 0 0 14px; }
  .limits-detail-heading > img { width: 76px; height: 52px; }
  .limits-detail h2 { font-size: 20px; }
  .limits-detail-heading p { margin-top: 4px; }
  .limits-detail-fields { padding: 16px 0; }
  .limits-value-field label { margin-bottom: 8px; }
  .limits-input-group input, .limits-input-group > span { height: 38px; }
  .limits-input-group input { font-size: 17px; }
  .limits-threshold-preview { margin-top: 14px; padding: 14px 0; }
  .limits-threshold-preview header { margin-bottom: 14px; }
  .limits-threshold-examples { margin: 12px 0; }
  .limits-threshold-preview > p { margin-top: 12px; }
  .limits-detail-summary { padding: 14px 0; margin-top: 8px; }
  .limits-detail-summary > div { padding: 6px 12px; }
  .limits-actions { flex-shrink: 0; margin-top: 10px; padding: 0; }
  .limits-actions button { min-height: 38px; padding: 8px 16px; }
  .limits-price { padding: 6px 10px; margin-bottom: 8px; }
}
@media (min-width: 1001px) and (min-height: 600px) and (max-height: 750px) {
  .limits-detail-heading { min-height: 44px; margin-bottom: 8px; }
  .limits-detail-heading > img { height: 46px; width: 76px; }
  .limits-detail-fields { padding: 12px 0; }
  .limits-threshold-preview { padding: 10px 0; margin-top: 10px; }
  .limits-threshold-preview header { margin-bottom: 10px; }
  .limits-threshold-examples { margin: 10px 0; }
  .limits-threshold-examples strong { font-size: 18px; }
  .limits-detail-summary { padding: 10px 6px; }
}
.limits-type-explanation { display: flex; align-items: flex-start; gap: 12px; margin-top: 22px; padding: 0 8px; color: #526585; font-size: 12px; line-height: 1.6; }
.limits-type-explanation strong { color: #102372; font-size: 13px; }
.limits-type-explanation p { margin: 6px 0 0; max-width: 95ch; }
@media (min-width: 1001px) and (min-height: 600px) and (max-height: 750px) { .limits-type-explanation { margin-top: 12px; font-size: 11px; line-height: 1.4; } }
</style>
