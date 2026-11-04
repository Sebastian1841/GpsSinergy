<template>
  <form class="calculated-editor" @submit.prevent="requestSave">
    <nav class="calculated-steps" aria-label="Pasos de la variable">
      <button v-for="(label, index) in ['Script', 'Probar', 'A qué vehículos']" :key="label" type="button" :aria-current="step === index + 1 ? 'step' : undefined" @click="step = index + 1"><span>{{ index + 1 }}</span>{{ label }}<small>{{ index === 0 ? `${usedKeys.length} SEÑALES` : index === 1 ? testStatus.badge : `${draft.assetIds.length} ELEGIDOS` }}</small></button>
    </nav>
    <div v-if="error" class="calculated-error" role="alert">{{ error }}</div>
    <div v-if="step === 2" class="calculated-test-status" :class="`test-status-${testStatus.state}`" role="status"><strong>{{ testStatus.label }}</strong><span v-if="lastTest">Última ejecución: {{ date(lastTest.testedAt) }}{{ lastTest.assetId ? ` · Equipo: ${lastTest.assetId}` : '' }}</span><span v-if="testStatus.state === 'failed' && lastTest?.error">{{ lastTest.error }}</span><span v-if="!executionAvailable">Motor pendiente de conexión. Abrir este paso no registra una prueba.</span></div>
    <div class="calculated-editor-body" :class="{ 'calculated-testing-layout': step !== 1 }">
      <div class="calculated-workspace">
        <template v-if="step === 1">
          <div class="calculated-fields">
            <label>NOMBRE INTERNO *<input v-model="draft.key" required maxlength="64" pattern="[a-z][a-z0-9_]*" placeholder="estado_vehiculo" /></label>
            <label>CÓMO SE LLAMA PARA EL CLIENTE *<input v-model="draft.label" required maxlength="100" placeholder="Estado del vehículo" /></label>
            <label>UNIDAD<input v-model="draft.unit" maxlength="24" placeholder="Sin unidad" /></label>
          </div>
          <div v-if="draft.key && !outputInfo.matches" class="calculated-output-warning" role="status">
            <div><strong>La salida no coincide con el nombre interno.</strong><p v-if="outputInfo.keys.length">El script escribe en {{ outputInfo.keys.map(key => `out["${key}"]`).join(', ') }}, pero esta variable se llama <code>{{ draft.key }}</code>.</p><p v-else>No se identificó una asignación de salida con nombre fijo. Se espera <code>out["{{ draft.key }}"] = ...</code>.</p><small v-if="outputInfo.dynamic">Hay accesos dinámicos a out; revisa las salidas manualmente.</small><small v-else-if="outputInfo.keys.length > 1">Hay varias salidas. Revisa cuál corresponde a esta variable.</small></div>
            <button v-if="outputInfo.canRename" type="button" @click="renameOutput">Actualizar salida al nuevo nombre</button>
          </div>
          <label class="calculated-display"><input v-model="draft.showInDetail" type="checkbox" /><span><strong>Mostrar en el detalle del vehículo</strong><small>Aparece en el detalle cuando el backend entrega un valor calculado. Desmarcar no pausa la definición.</small></span></label>
          <div class="calculated-templates"><span>PLANTILLAS</span><button v-for="template in templates" :key="template.label" type="button" @click="insert(template.code)"><SvgIcon name="plus" />{{ template.label }}</button></div>
          <div class="calculated-code" :class="{ expanded }" @keydown.esc="expanded = false">
            <header><span><i></i>{{ draft.key || 'nueva_variable' }}.script</span><div><small>{{ lineCount }} líneas</small><button type="button" :aria-label="expanded ? 'Reducir editor' : 'Expandir editor'" :title="expanded ? 'Reducir editor' : 'Expandir editor'" @click="expanded = !expanded"><SvgIcon name="expand" />{{ expanded ? 'Reducir' : 'Expandir' }}</button></div></header>
            <div class="calculated-code-surface"><pre ref="gutter" aria-hidden="true">{{ lineNumbers }}</pre><div class="calculated-highlight-editor"><pre ref="highlight" class="calculated-highlight" aria-hidden="true"><span v-for="(token, index) in scriptTokens" :key="index" :class="`syntax-${token.type}`">{{ token.text }}</span></pre><textarea ref="scriptInput" v-model="draft.script" required maxlength="20000" aria-label="Script de la variable" spellcheck="false" wrap="off" @scroll="syncLines" @keydown.tab="indent"></textarea></div></div>
          </div>
          <div class="calculated-live"><span>EN VIVO</span><small>Sin ejecutar · pasos: —</small><span v-if="missingKeys.length" class="missing-signals">{{ missingKeys.length }} señales sin dato en este equipo</span></div>
          <details class="calculated-help">
            <summary>Lo que se puede usar · 9 funciones, 3 entradas y los topes</summary>
            <div class="calculated-language-reference" aria-label="Sintaxis del motor original"><code v-for="entry in languageReference" :key="entry">{{ entry }}</code></div>
            <p>Un dato que no llegó da «sin dato» y no cero; para que una condición dé «sin dato» se escribe <code>else None</code>. Un texto no se puede repetir con <code>*</code>. Topes: 2000 pasos, 64 vueltas por <code>for</code>, 4096 caracteres y 256 elementos. Los campos de la ficha —<code>ficha_capacidad_estanque_l</code>— son fijos para todo el período y <strong>se leen al calcular.</strong></p>
          </details>
        </template>
        <KeepAlive>
          <CalculatedVariableTest v-if="step === 2" v-model:asset-id="signalAssetId" v-model:inputs="testInputs" :assets="assets" :signal-keys="usedKeys" :profile-keys="scriptInputs.profile" />
          <CalculatedVariableVehicles v-else-if="step === 3" v-model="draft.assetIds" :assets="assets" :signal-keys="usedKeys" :profile-keys="scriptInputs.profile" />
        </KeepAlive>
      </div>
      <aside v-if="step === 1" class="calculated-signals" aria-label="Variables disponibles">
        <header><h2>Variables disponibles</h2><span>ÚLTIMOS 30 DÍAS</span></header>
        <div class="calculated-signals-tools"><label>VEHÍCULO<select v-model="signalAssetId" aria-label="Vehículo de las señales"><option v-for="asset in assets" :key="asset.id" :value="String(asset.id)">{{ asset.imei || asset.patente || asset.id }} — {{ asset.trackerModelLabel || asset.name }}</option></select></label><label class="calculated-search"><SvgIcon name="search" /><input v-model="signalSearch" type="search" aria-label="Buscar señal" placeholder="Buscar señal..." /></label></div>
        <div class="calculated-signal-list"><template v-for="group in signalGroups" :key="group.label"><h3>{{ group.label }} · {{ group.signals.length }}</h3><button v-for="signal in group.signals" :key="signal.key" type="button" :title="`Insertar var[&quot;${signal.key}&quot;] en el script`" @click="insertSignal(signal.key)"><span><strong>{{ signal.label }}</strong><code>var["{{ signal.key }}"]</code></span><span><strong>{{ formatSignal(signal) }}</strong><small>{{ signal.available ? `lectura: ${date(signal.timestamp)}` : 'sin dato disponible' }}</small></span></button></template><p v-if="!signalGroups.length">No hay señales que coincidan.</p></div>
        <footer>{{ signalsError || (signalLoading ? 'Cargando lecturas...' : `Sobre ${signalReadings.length} lecturas locales, hasta 500 en los últimos 30 días.`) }}</footer>
      </aside>
    </div>
    <footer class="calculated-editor-footer"><div><small>SE APLICA A</small><strong>{{ draft.assetIds.length }} vehículos</strong><span>Guardar requiere una prueba sin errores del script actual.{{ !executionAvailable ? ' Motor pendiente de conexión.' : '' }}</span></div><button type="button" @click="emit('cancel')">Cancelar</button><button type="button" @click="step = 2">Probar script</button><button class="calculated-save" type="submit" :disabled="!canSave" :title="canSave ? 'Guardar configuración' : 'Requiere una prueba exitosa del script actual y el motor conectado'">Guardar</button></footer>
  </form>
</template>

<script setup>
import { computed, ref, shallowRef, watch, nextTick, onBeforeUnmount } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
import CalculatedVariableTest from "./CalculatedVariableTest.vue"
import CalculatedVariableVehicles from "./CalculatedVariableVehicles.vue"
import { calculatedVariableTokens } from "../../utils/layout/calculatedVariableSyntax.js"
import { calculatedVariableTemplates } from "../../utils/layout/calculatedVariableTemplates.js"
import { calculatedVariableInputs, calculatedVariableOutputs, renameCalculatedVariableOutput } from "../../utils/layout/calculatedVariableInputs.js"
import { createVariableTestState, reconcileVariableTestState } from "../../utils/layout/calculatedVariableTestState.js"
import { calculatedVariableTestStatus } from "../../utils/layout/calculatedVariableTests.js"
import { calculatedSignalGroups, calculatedSignalValue, calculatedSignalReadings } from "../../utils/layout/calculatedVariableSignals.js"
const draft = defineModel({ type: Object, required: true })
const props = defineProps({ assets: { type: Array, default: () => [] }, canSave: Boolean, error: { type: String, default: "" }, initialStep: { type: Number, default: 1 }, testStatus: { type: Object, default: () => calculatedVariableTestStatus({}, null) }, lastTest: { type: Object, default: null }, executionAvailable: Boolean })
const emit = defineEmits(["save", "cancel"])
const step = ref(1), expanded = ref(false), scriptInput = ref(null), gutter = ref(null), highlight = ref(null)
const requestSave = () => { if (props.canSave) emit("save"); else step.value = 2 }
const scriptTokens = computed(() => calculatedVariableTokens(draft.value.script))
const outputInfo = computed(() => calculatedVariableOutputs(draft.value.script, draft.value.key))
const renameOutput = () => { draft.value.script = renameCalculatedVariableOutput(draft.value.script, draft.value.key) }
const languageReference = ['var["..."]', 'ficha["..."]', 'out["..."] =', "abs()", "interp()", "limpiar()", "max()", "min()", "numero()", "partir()", "promedio()", "round()", "if / elif / else", "for … in …", "None"]
watch(() => props.initialStep, value => { step.value = [1, 2, 3].includes(value) ? value : 1 }, { immediate: true })
const signalSearch = ref(""), signalAssetId = ref("")
const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
watch(() => props.assets, assets => {
  if (!assets.some(asset => String(asset.id) === signalAssetId.value)) signalAssetId.value = String(assets[0]?.id || "")
}, { immediate: true })
const signalAsset = computed(() => props.assets.find(asset => String(asset.id) === signalAssetId.value))
const signalReadings = shallowRef([]), signalLoading = ref(false), signalsError = ref("")
let signalRequest = 0
watch(signalAsset, async asset => {
  const request = ++signalRequest
  signalLoading.value = true
  signalsError.value = ""
  signalReadings.value = []
  try {
    const { getReportsForAsset } = await import("../../composables/activos/fleet/useTelemetryHistory.js")
    if (request !== signalRequest) return
    signalReadings.value = calculatedSignalReadings(asset, asset ? getReportsForAsset(asset) : [])
  } catch { if (request === signalRequest) signalsError.value = "No se pudieron cargar las señales del historial local." }
  finally { if (request === signalRequest) signalLoading.value = false }
}, { immediate: true })
onBeforeUnmount(() => { signalRequest++ })
const signalRows = computed(() => calculatedSignalGroups.flatMap(group => group.signals.map(([key, label, unit]) => {
  const reading = signalReadings.value.findLast(row => calculatedSignalValue(row, key) != null)
  return { key, label, unit, group: group.label, value: calculatedSignalValue(reading, key), available: Boolean(reading), timestamp: reading?.timestamp || reading?.reportedAt || reading?.lastReportAt }
})))
const signalGroups = computed(() => calculatedSignalGroups.map(group => ({ label: group.label, signals: signalRows.value.filter(signal => signal.group === group.label && normalize(`${signal.label} ${signal.key}`).includes(normalize(signalSearch.value))) })).filter(group => group.signals.length))
const scriptInputs = computed(() => calculatedVariableInputs(draft.value.script))
const testInputs = ref(createVariableTestState())
watch(scriptInputs, inputs => { testInputs.value = reconcileVariableTestState(testInputs.value, inputs) })
const usedKeys = computed(() => scriptInputs.value.signals)
const missingKeys = computed(() => usedKeys.value.filter(key => !signalReadings.value.some(reading => calculatedSignalValue(reading, key) != null)))
const lineCount = computed(() => draft.value.script.split("\n").length)
const lineNumbers = computed(() => Array.from({ length: lineCount.value }, (_, index) => index + 1).join("\n"))
const syncLines = () => {
  if (!scriptInput.value) return
  if (gutter.value) gutter.value.scrollTop = scriptInput.value.scrollTop
  if (highlight.value) { highlight.value.scrollTop = scriptInput.value.scrollTop; highlight.value.scrollLeft = scriptInput.value.scrollLeft }
}
const insert = async text => {
  const input = scriptInput.value
  const start = input?.selectionStart ?? draft.value.script.length
  const end = input?.selectionEnd ?? start
  if (draft.value.script.length - (end - start) + text.length > 20000) return
  draft.value.script = draft.value.script.slice(0, start) + text + draft.value.script.slice(end)
  await nextTick()
  scriptInput.value?.focus()
  scriptInput.value?.setSelectionRange(start + text.length, start + text.length)
}
const insertSignal = async key => { step.value = 1; await nextTick(); insert(`var["${key}"]`) }
const indent = event => { if (!event.shiftKey) { event.preventDefault(); insert("    ") } }
const templates = computed(() => calculatedVariableTemplates(draft.value.key))
const formatSignal = signal => {
  if (!signal?.available) return "Sin dato"
  if (typeof signal.value === "boolean") return signal.value ? "sí" : "no"
  return `${signal.value}${signal.unit ? ` ${signal.unit}` : ""}`
}
const date = value => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" }).format(parsed)
}
</script>

<style scoped>
.calculated-editor { display: flex; flex-direction: column; min-height: 0; height: 100%; color: #102372; background: white; font-size: 13px; }
.calculated-editor button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 7px 10px; border: 1px solid #ccd8eb; border-radius: 5px; background: white; color: #102372; font: inherit; cursor: pointer; }
.calculated-steps { display: flex; gap: 12px; flex-shrink: 0; background: white; border-bottom: 1px solid #d5deed; padding: 0 18px; }
.calculated-steps button { min-height: 50px; padding: 10px 18px; border: 0; border-radius: 0; border-bottom: 2px solid transparent; color: #647491; font-size: 14px; font-weight: 700; }
.calculated-steps button[aria-current=step] { border-bottom-color: #ff6600; color: #102372; }
.calculated-steps button > span { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #edf2f8; font-size: 13px; }
.calculated-steps button[aria-current=step] > span { background: #ff6600; color: white; }
.calculated-steps small { padding: 3px 5px; background: #edf2ff; border-radius: 3px; font-size: 8px; }
.calculated-editor-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, 27%); gap: 18px; flex: 1; min-height: 0; padding: 20px 18px 18px; }
.calculated-workspace { display: flex; flex-direction: column; gap: 14px; min-height: 0; min-width: 0; overflow: auto; }
.calculated-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; flex-shrink: 0; }
.calculated-output-warning { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 12px; border: 1px solid #ffd0a1; border-radius: 5px; background: #fff8ef; color: #8b4500; flex-shrink: 0; font-size: 12px; }
.calculated-output-warning > div { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.calculated-output-warning p { margin: 5px 0 0; line-height: 1.5; }
.calculated-output-warning small { display: block; margin-top: 5px; }
.calculated-output-warning button { font-size: 11px; border-color: #ffd0a1; }
.calculated-fields label, .calculated-signals-tools > label:first-child { display: flex; flex-direction: column; gap: 8px; color: #647491; font-size: 11px; font-weight: 700; }
.calculated-fields input, .calculated-signals select { width: 100%; min-width: 0; box-sizing: border-box; height: 36px; border: 1px solid #ccd8eb; border-radius: 5px; padding: 0 12px; background: white; color: #102372; font: inherit; font-size: 14px; font-weight: 600; }
.calculated-display { display: flex; align-items: flex-start; gap: 10px; padding: 14px 10px; background: white; border-top: 1px solid #e2e9f3; border-bottom: 1px solid #e2e9f3; flex-shrink: 0; font-size: 14px; }
.calculated-display input { margin-top: 2px; }
.calculated-display small { display: block; margin-top: 5px; color: #647491; font-size: 12px; line-height: 1.5; }
.calculated-templates { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; flex-shrink: 0; }
.calculated-templates > span { font-size: 11px; color: #647491; font-weight: 700; margin-right: 12px; }
.calculated-templates button { font-size: 12px; padding: 8px 12px; }
.calculated-code { display: flex; flex-direction: column; flex: 1; min-height: 220px; border: 1px solid #1a2648; border-radius: 7px; overflow: hidden; background: #0e152b; }
.calculated-code > header { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 9px 14px; background: #121b37; color: #d4e4ff; font: 12px Consolas, monospace; }
.calculated-code > header > span { overflow-wrap: anywhere; }
.calculated-code header i { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #ff6600; margin-right: 8px; }
.calculated-code header div { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.calculated-code header button { border: 0; padding: 4px 8px; background: #233157; color: #d4e4ff; font-size: 11px; }
.calculated-code-surface { display: flex; flex: 1; min-height: 0; }
.calculated-highlight-editor { position: relative; flex: 1; min-width: 0; min-height: 0; }
.calculated-code-surface .calculated-highlight { position: absolute; inset: 0; width: auto; margin: 0; padding: 16px 14px; text-align: left; overflow: hidden; background: transparent; color: #e3efff; font: 13px/1.8 Consolas, monospace; white-space: pre; tab-size: 4; pointer-events: none; }
.calculated-highlight .syntax-string { color: #76e5b8; }
.calculated-highlight .syntax-keyword { color: #ffb36b; }
.calculated-highlight .syntax-number { color: #b7a8ff; }
.calculated-highlight .syntax-comment { color: #7d91b5; }
.calculated-highlight .syntax-input { color: #66cafa; }
.calculated-code .calculated-highlight-editor textarea { position: absolute; inset: 0; box-sizing: border-box; height: 100%; color: transparent; caret-color: white; }
.calculated-highlight-editor textarea::selection { background: #4a71a877; color: transparent; }
@media (forced-colors: active) { .calculated-highlight { display: none; } .calculated-code .calculated-highlight-editor textarea { color: CanvasText; } }
.calculated-code-surface pre { flex-shrink: 0; width: 44px; margin: 0; padding: 16px 0; text-align: center; overflow: hidden; color: #829bc4; background: #101930; font: 13px/1.8 Consolas, monospace; user-select: none; }
.calculated-code textarea { flex: 1; width: 100%; min-width: 0; min-height: 0; padding: 16px 14px; resize: none; border: 0; outline: none; background: transparent; color: #e3efff; font: 13px/1.8 Consolas, monospace; tab-size: 4; }
.calculated-code.expanded { position: fixed; inset: 24px; z-index: 5000; box-shadow: 0 0 0 100vmax #14203199; }
.calculated-live { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 8px 10px; border: 1px solid #d5deed; border-radius: 5px; background: white; color: #7c94ba; flex-shrink: 0; font-size: 10px; }
.calculated-live > span:first-child { font-size: 9px; font-weight: 700; }
.calculated-live .missing-signals { color: #a85a00; }
.calculated-help { padding: 9px 12px; border: 1px solid #d5deed; border-radius: 5px; background: white; font-size: 11px; flex-shrink: 0; }
.calculated-help summary { cursor: pointer; font-size: 12px; line-height: 1.5; font-weight: 700; color: #00165c; }
.calculated-language-reference { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
.calculated-language-reference code { padding: 3px 6px; border: 1px solid #dce4ef; border-radius: 5px; background: #f7f9fc; color: #102372; font: 9px/1.4 Consolas, monospace; white-space: nowrap; }
.calculated-help p { margin: 8px 0 0; color: #526585; font-size: 9px; line-height: 1.8; }
.calculated-help p code { color: #526585; font: 9px Consolas, monospace; overflow-wrap: anywhere; }
.calculated-help p strong { font-weight: 700; }
.calculated-signals { display: flex; flex-direction: column; min-height: 0; min-width: 0; border-left: 1px solid #e2e9f3; padding-left: 14px; background: white; }
.calculated-signals > header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 8px 0 12px; border-bottom: 1px solid #e2e9f3; }
.calculated-signals h2 { margin: 0; font-size: 16px; font-weight: 600; }
.calculated-signals > header > span { padding: 4px 7px; background: #edf2ff; border-radius: 4px; font-size: 9px; font-weight: 700; }
.calculated-signals-tools { padding: 12px 0 16px; display: grid; gap: 12px; }
.calculated-search { display: flex; align-items: center; gap: 6px; padding: 0 8px; border: 1px solid #ccd8eb; border-radius: 5px; background: #f9fbfe; color: #7c94ba; }
.calculated-search input { width: 100%; min-width: 0; height: 34px; padding: 0; border: 0; background: transparent; color: #102372; font: inherit; outline: none; }
.calculated-signal-list { flex: 1; min-height: 0; overflow: auto; }
.calculated-signal-list h3 { position: sticky; top: 0; margin: 0; padding: 8px 6px; background: #f4f6f9; font-size: 11px; color: #647491; font-weight: 700; }
.calculated-signal-list button { display: flex; justify-content: space-between; gap: 10px; width: 100%; border: 0; border-bottom: 1px solid #edf2f8; border-radius: 0; padding: 11px 10px; text-align: left; }
.calculated-signal-list button:hover { background: #f5f8ff; }
.calculated-signal-list button > span { min-width: 0; }
.calculated-signal-list button > span:last-child { text-align: right; }
.calculated-signal-list strong { display: block; font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }
.calculated-signal-list code, .calculated-signal-list small { display: block; margin-top: 4px; color: #647a9e; font-size: 11px; overflow-wrap: anywhere; }
.calculated-signals > footer { padding: 12px 0; border-top: 1px solid #e2e9f3; font-size: 11px; line-height: 1.5; color: #647a9e; }
.calculated-editor-footer { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 18px; border-top: 1px solid #e2e9f3; background: white; flex-shrink: 0; }
.calculated-editor-footer > div { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; flex: 1; }
.calculated-editor-footer small { color: #647491; font-size: 10px; font-weight: 700; }
.calculated-editor-footer strong { padding: 8px 12px; border-radius: 5px; background: #edf2ff; font-size: 12px; }
.calculated-editor-footer > div > span { color: #647491; font-size: 11px; }
.calculated-editor .calculated-save { background: #ff6600; border-color: #ff6600; color: white; }
.calculated-editor .calculated-save:disabled { background: #cbd6e5; border-color: #cbd6e5; opacity: 1; }
.calculated-vehicles { padding: 20px; background: white; border: 1px solid #d5deed; border-radius: 6px; min-height: 0; overflow: auto; }
.calculated-vehicles h2 { margin: 0; font-size: 18px; }
.calculated-vehicles header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.calculated-selection-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin: 18px 0 8px; }
.calculated-selection-tools label { display: flex; align-items: center; gap: 8px; }
.calculated-selection-tools > span { flex: 1; }
.calculated-vehicle-rows label { display: grid; grid-template-columns: 18px 1fr 2fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid #edf2f8; overflow-wrap: anywhere; }
.calculated-pages { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 14px; }
.calculated-error { margin: 10px 14px 0; padding: 10px 12px; border: 1px solid #f0b6bf; border-radius: 5px; background: #fff0f1; color: #a31f32; flex-shrink: 0; }
.calculated-test-status { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 16px; margin: 10px 18px 0; padding: 10px 12px; border: 1px solid #d5deed; border-radius: 5px; background: #f8faff; color: #647491; font-size: 11px; flex-shrink: 0; }
.calculated-test-status strong { color: #102372; }
.test-status-stale { background: #fff8ef; border-color: #ffd0a1; }
.test-status-failed { background: #fff0f1; border-color: #f0b6bf; }
.test-status-passed { background: #eefaf4; border-color: #bde4d1; }
.calculated-editor :deep(.svg-icon-wrapper) { width: 14px; height: 14px; flex-shrink: 0; }
input[type=checkbox] { accent-color: #ff6600; }
button:disabled { opacity: .45; cursor: not-allowed; }
button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, summary:focus-visible { outline: 2px solid #ff6600; outline-offset: 2px; }
@media (max-width: 1100px) { .calculated-editor-body { grid-template-columns: minmax(0, 1fr) 280px; } .calculated-fields { grid-template-columns: 1fr 1fr; } .calculated-fields label:last-child { grid-column: 1 / -1; } .calculated-editor-footer > div > span { display: none; } }
@media (max-width: 760px) { .calculated-editor { height: auto; min-height: 100%; } .calculated-editor-body { grid-template-columns: 1fr; } .calculated-workspace { overflow: visible; } .calculated-signals { height: 420px; } .calculated-code { min-height: 320px; } .calculated-fields { grid-template-columns: 1fr; } .calculated-fields label:last-child { grid-column: auto; } .calculated-steps { gap: 0; padding: 0 6px; } .calculated-steps button { flex: 1; flex-wrap: wrap; gap: 5px; padding: 8px 4px; font-size: 11px; } .calculated-steps small { font-size: 7px; } .calculated-editor-footer > div { flex-basis: 100%; } .calculated-editor-footer > button { flex: 1; } .calculated-vehicle-rows label { grid-template-columns: 18px 1fr; } .calculated-vehicle-rows label > span { grid-column: 2; } }
.calculated-editor-body.calculated-testing-layout { grid-template-columns: minmax(0, 1fr); }
.calculated-testing-layout .calculated-workspace { overflow: hidden; }
@media (max-width: 760px) { .calculated-testing-layout .calculated-workspace { overflow: visible; } }
@media (max-width: 760px) { .calculated-editor-body { padding: 14px 12px; } .calculated-signals { border-left: 0; border-top: 1px solid #e2e9f3; padding: 14px 0 0; } .calculated-steps button { font-size: 12px; padding: 10px 6px; } .calculated-display { font-size: 13px; } .calculated-display small { font-size: 11px; } }
@media (min-width: 761px) and (max-height: 950px) { .calculated-editor-body { padding: 12px 18px; } .calculated-workspace { gap: 10px; } .calculated-display { padding: 10px; } .calculated-templates button { padding: 7px 12px; } .calculated-editor-footer { padding: 12px 18px; } }
</style>
