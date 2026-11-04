<template>
  <div class="variable-test-layout">
    <section class="variable-manual-panel" aria-labelledby="variable-manual-title">
      <h2 id="variable-manual-title">Con valores escritos a mano</h2>
      <p>Entradas separadas por origen. Vacío entra como «no llegó».</p>
      <div class="variable-manual-fields"><h3>Señales del equipo · var</h3><label v-for="key in orderedSignalKeys" :key="key"><code>{{ key }}</code><input v-model="manualValues[key]" type="text" :aria-label="`Valor manual de ${key}`" placeholder="vacío = no llegó" /></label><p v-if="!signalKeys.length">El script no referencia señales con <code>var["señal"]</code>.</p></div>
      <div v-if="profileKeys.length" class="variable-manual-fields variable-profile-fields"><h3>Campos de la ficha · ficha</h3><label v-for="key in orderedProfileKeys" :key="key"><code>{{ key }}</code><input v-model="manualProfileValues[key]" type="text" :aria-label="`Valor manual de ficha ${key}`" placeholder="vacío = no llegó" /><small>{{ profileValueLabel(key) }}</small></label></div>
      <section class="variable-manual-result" aria-label="Resultado manual"><strong>Resultado</strong><p>Sin ejecutar</p><small>{{ suppliedCount }} de {{ signalKeys.length + profileKeys.length }} entradas con valor · pasos: —</small></section>
      <p class="variable-execution-note">La ejecución requiere conectar el servicio de cálculo del backend. No se generó un resultado.</p>
    </section>

    <section class="variable-readings-panel" aria-labelledby="variable-readings-title">
      <header><div><h2 id="variable-readings-title">Sobre lecturas disponibles</h2><p>Muestra también las filas con «sin dato»: permiten revisar las entradas ausentes.</p></div><label>VEHÍCULO<select v-model="assetId" aria-label="Vehículo de prueba"><option v-for="asset in assets" :key="asset.id" :value="String(asset.id)">{{ asset.imei || asset.patente || asset.id }}</option></select></label><button type="button" title="Actualizar lecturas" aria-label="Actualizar lecturas" @click="refresh"><SvgIcon name="limits-reset" /></button></header>
      <p v-if="loadError" class="variable-readings-error" role="alert">{{ loadError }}</p>
      <section v-if="profileKeys.length" class="variable-profile-context" aria-label="Ficha del vehículo de prueba"><strong>Ficha del vehículo · valores actuales, fijos para las lecturas</strong><dl><div v-for="key in orderedProfileKeys" :key="key"><dt><code>ficha["{{ key }}"]</code></dt><dd>{{ profileValueLabel(key) }}</dd></div></dl></section>
      <div class="variable-readings-table-wrap">
        <table class="variable-readings-table"><thead><tr><th scope="col">CUÁNDO</th><th scope="col">LO QUE USÓ</th><th scope="col">DIO</th><th scope="col">PASOS</th></tr></thead><tbody>
          <tr v-for="reading in pageRows" :key="reading.id"><td>{{ date(reading.timestamp) }}</td><td><div v-if="reading.inputs.length" class="variable-input-badges" :style="{ '--input-columns': Math.max(1, Math.min(reading.inputs.length, 3)) }"><code v-for="input in reading.inputs" :key="input.key" :class="{ missing: input.missing }">{{ input.key }}={{ formatVariableInput(input) }}</code></div><span v-else>Sin señales referenciadas</span></td><td class="variable-result-pending">Sin ejecutar</td><td>—</td></tr>
          <tr v-if="!pageRows.length"><td colspan="4" class="variable-readings-empty">{{ loading ? 'Cargando lecturas...' : 'No hay lecturas disponibles para este vehículo.' }}</td></tr>
        </tbody></table>
      </div>
      <footer><span>{{ readings.length }} {{ readings.length === 1 ? 'lectura disponible' : 'lecturas disponibles' }}{{ readings.some(row => row.localSnapshot) ? ' · Última lectura del catálogo local' : ' · Historial local de telemetría' }} · Resultados pendientes del backend.</span><nav v-if="pages > 1" aria-label="Páginas de lecturas"><button type="button" :disabled="page === 1" aria-label="Lecturas anteriores" @click="page--"><SvgIcon name="chevron-left" /></button><span>{{ page }} / {{ pages }}</span><button type="button" :disabled="page === pages" aria-label="Lecturas siguientes" @click="page++"><SvgIcon name="chevron-right" /></button></nav></footer>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, shallowRef, watch, onBeforeUnmount } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
import { calculatedVariableReadings, formatVariableInput, variableTestInputs } from "../../utils/layout/calculatedVariableReadings.js"
import { calculatedProfileValue } from "../../utils/layout/calculatedVariableInputs.js"
import { createVariableTestState } from "../../utils/layout/calculatedVariableTestState.js"
const assetId = defineModel("assetId", { type: String, default: "" })
const testInputs = defineModel("inputs", { type: Object, default: createVariableTestState })
const props = defineProps({ assets: { type: Array, default: () => [] }, signalKeys: { type: Array, default: () => [] }, profileKeys: { type: Array, default: () => [] } })
const orderedSignalKeys = computed(() => [...props.signalKeys].sort())
const orderedProfileKeys = computed(() => [...props.profileKeys].sort())
const selectedAsset = computed(() => props.assets.find(asset => String(asset.id) === assetId.value))
const manualValues = computed(() => testInputs.value.signals), reports = shallowRef([]), loading = ref(false), loadError = ref("")
const manualProfileValues = computed(() => testInputs.value.profile)
const suppliedCount = computed(() => Object.keys(variableTestInputs(props.signalKeys, manualValues.value)).length + Object.keys(variableTestInputs(props.profileKeys, manualProfileValues.value)).length)
const profileValueLabel = key => {
  const value = calculatedProfileValue(selectedAsset.value, key)
  if (value == null) return "Sin dato disponible en la ficha"
  return formatVariableInput({ value, missing: false })
}
watch([() => selectedAsset.value?.id, () => JSON.stringify(props.profileKeys.map(key => [key, calculatedProfileValue(selectedAsset.value, key)]))], () => {
  const currentAssetId = String(selectedAsset.value?.id || "")
  const sameAsset = testInputs.value.profileAssetId === currentAssetId
  const values = Object.create(null)
  for (const key of props.profileKeys) {
    if (sameAsset && Object.hasOwn(manualProfileValues.value, key)) values[key] = manualProfileValues.value[key]
    else {
      const value = calculatedProfileValue(selectedAsset.value, key)
      if (value != null) values[key] = formatVariableInput({ value, missing: false })
    }
  }
  testInputs.value = { ...testInputs.value, profile: values, profileAssetId: currentAssetId }
}, { immediate: true })
let request = 0
const refresh = async () => {
  const token = ++request
  loading.value = true
  loadError.value = ""
  reports.value = []
  try {
    const { getReportsForAsset } = await import("../../composables/activos/fleet/useTelemetryHistory.js")
    if (request !== token) return
    reports.value = selectedAsset.value ? getReportsForAsset(selectedAsset.value).slice(-500) : []
  } catch {
    if (request === token) loadError.value = "No se pudo cargar el historial. Reintenta la lectura."
  } finally { if (request === token) loading.value = false }
}
watch(selectedAsset, () => { page.value = 1; refresh() })
const readings = computed(() => loading.value ? [] : calculatedVariableReadings(selectedAsset.value, reports.value, orderedSignalKeys.value))
const page = ref(1)
watch(() => props.signalKeys, () => {
  page.value = 1
}, { immediate: true })
const pages = computed(() => Math.max(1, Math.ceil(readings.value.length / 25)))
const pageRows = computed(() => readings.value.slice((page.value - 1) * 25, page.value * 25))
watch(pages, pages => { page.value = Math.min(page.value, pages) })
const date = value => {
  if (!value) return "Sin fecha"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Santiago" }).format(parsed)
}
refresh()
onBeforeUnmount(() => { request++ })
</script>

<style scoped>
.variable-test-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 12px; height: 100%; min-height: 0; color: #102372; font-size: 12px; }
.variable-manual-panel, .variable-readings-panel { min-width: 0; min-height: 0; border: 1px solid #d5deed; border-radius: 7px; background: white; box-shadow: 0 1px 2px #10237212; }
.variable-manual-panel { padding: 16px; overflow: auto; }
.variable-test-layout h2 { margin: 0; font-size: 14px; font-weight: 800; color: #00165c; }
.variable-manual-panel > p { margin: 8px 0 0; color: #647a9e; font-size: 11px; line-height: 1.6; }
.variable-manual-fields { display: grid; gap: 20px; margin-top: 24px; }
.variable-manual-fields label { display: grid; gap: 8px; }
.variable-manual-fields h3 { margin: 0; font-size: 11px; font-weight: 700; color: #526585; }
.variable-profile-fields { padding-top: 16px; border-top: 1px solid #dce4ef; }
.variable-profile-fields small { font-size: 10px; color: #647a9e; overflow-wrap: anywhere; }
.variable-profile-context { flex-shrink: 0; margin-bottom: 12px; padding: 10px 12px; background: #f8faff; border: 1px solid #dce4ef; border-radius: 5px; font-size: 11px; }
.variable-profile-context dl { display: grid; gap: 6px; margin: 8px 0 0; }
.variable-profile-context dl > div { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.variable-profile-context dt, .variable-profile-context dd { margin: 0; overflow-wrap: anywhere; }
.variable-manual-fields code { color: #526585; font-family: inherit; font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }
.variable-manual-fields input { width: 100%; height: 36px; box-sizing: border-box; padding: 0 10px; border: 1px solid #ccd8eb; border-radius: 5px; background: #f8faff; color: #102372; font: inherit; }
.variable-manual-result { margin-top: 14px; padding: 12px; border: 1px solid #ccd8eb; border-radius: 5px; background: #f8faff; }
.variable-manual-result > strong { font-size: 13px; color: #00165c; font-weight: 800; }
.variable-manual-result p { margin: 8px 0; padding-top: 8px; border-top: 1px solid #dce4ef; color: #647a9e; }
.variable-manual-result small { font-size: 11px; color: #526585; line-height: 1.5; }
.variable-manual-panel .variable-execution-note { margin-top: 16px; font-size: 11px; color: #526585; }
.variable-readings-panel { display: flex; flex-direction: column; padding: 16px; }
.variable-readings-panel > header { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 12px; flex-shrink: 0; margin-bottom: 14px; }
.variable-readings-panel > header > div { flex: 1; min-width: 220px; }
.variable-readings-panel header p { margin: 8px 0 0; font-size: 11px; color: #647a9e; }
.variable-readings-panel header label { display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 700; color: #526585; }
.variable-readings-panel select { max-width: 210px; height: 36px; padding: 0 10px; border: 1px solid #ccd8eb; border-radius: 5px; background: #f8faff; color: #102372; font: inherit; font-size: 12px; }
.variable-test-layout button { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid #ccd8eb; border-radius: 5px; background: white; color: #526585; cursor: pointer; }
.variable-readings-table-wrap { flex: 1; min-height: 0; overflow: auto; }
.variable-readings-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.variable-readings-table th { position: sticky; top: 0; z-index: 1; height: 30px; box-sizing: border-box; padding: 7px 10px; background: #f0f3fc; color: #526585; font-size: 10px; font-weight: 800; text-align: left; }
.variable-readings-table th:first-child { width: 29%; }
.variable-readings-table th:nth-child(2) { width: 39%; }
.variable-readings-table th:last-child { width: 7%; text-align: right; }
.variable-readings-table td { height: 30px; box-sizing: border-box; padding: 4px 10px; border-top: 1px solid #dce4f3; font-size: 12px; vertical-align: middle; overflow-wrap: anywhere; color: #102372; }
.variable-readings-table td:last-child { text-align: right; }
.variable-input-badges { display: grid; grid-template-columns: repeat(var(--input-columns), minmax(0, 1fr)); gap: 6px 8px; max-width: calc(var(--input-columns) * 140px); align-items: center; }
.variable-readings-table td code { display: block; width: 100%; min-width: 0; box-sizing: border-box; padding: 2px 8px; margin: 0; border-radius: 12px; background: #e6eaff; color: #101c69; font: 700 12px/16px system-ui, sans-serif; text-align: center; overflow-wrap: anywhere; }
.variable-readings-table td code.missing { background: #fff0de; color: #e65a00; }
.variable-result-pending { font-style: italic; }
.variable-readings-table td.variable-readings-empty { padding: 36px 10px; text-align: center; }
.variable-readings-panel > footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; flex-shrink: 0; padding-top: 12px; margin-top: 12px; border-top: 1px solid #dce4f3; font-size: 11px; color: #526585; }
.variable-readings-panel nav { display: flex; align-items: center; gap: 8px; }
.variable-readings-error { padding: 10px; color: #a31f32; background: #fff0f1; }
.variable-test-layout :deep(.svg-icon-wrapper) { width: 15px; height: 15px; }
input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid #ff6600; outline-offset: 2px; }
button:disabled { opacity: .45; cursor: not-allowed; }
select:disabled { opacity: 1; }
@media(max-width:760px) { .variable-readings-table th, .variable-readings-table td { padding-left: 5px; padding-right: 5px; } .variable-readings-table td { font-size: 10px; } .variable-input-badges { gap: 4px; } .variable-readings-table td code { padding: 3px 4px; font-size: 10px; } }
@media (max-width: 1000px) { .variable-test-layout { grid-template-columns: 220px minmax(0, 1fr); } .variable-readings-panel > header > div { min-width: 0; flex-basis: 100%; } }
@media (max-width: 760px) { .variable-test-layout { grid-template-columns: 1fr; height: auto; } .variable-manual-panel { overflow: visible; } .variable-readings-panel { min-height: 380px; } .variable-readings-table-wrap { max-height: 420px; } .variable-readings-table th:first-child { width: 27%; } .variable-readings-table th:nth-child(2) { width: 40%; } }
</style>
