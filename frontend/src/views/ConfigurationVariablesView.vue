<template>
  <section class="variables-page" :class="{ 'variables-page-editor': editorOpen }" aria-label="Variables calculadas">
    <header class="variables-toolbar">
      <div class="variables-heading"><button v-if="editorOpen" class="variables-back" type="button" aria-label="Volver a variables calculadas" title="Volver" @click="closeEditor"><SvgIcon name="chevron-left" /></button><span v-else class="variables-heading-icon"><SvgIcon name="variable-code" /></span><div><h1>Variables calculadas <span class="platform-tag">{{ editorOpen ? 'PLAT' : 'PLATAFORMA' }}</span></h1><p>El valor sale de un script sobre lo que el equipo ya manda. El dato crudo no se toca.</p></div></div>
      <div class="variables-tools">
        <label class="variables-search"><SvgIcon name="search" /><input v-model="search" type="search" aria-label="Buscar variable o señal" placeholder="Buscar variable o señal..." /></label>
        <label class="variables-filter"><span>{{ editorOpen ? 'Variable' : 'VARIABLE' }}</span><select ref="variableSelect" v-model="selectedKey" aria-label="Elegir variable" @change="selectVariable"><option value="">— elegir —</option><option v-if="selectedKey && !filteredRows.some(row => row.key === selectedKey)" :value="selectedKey">{{ selectedKey }}</option><option v-for="row in filteredRows" :key="row.id" :value="row.key">{{ row.key }}</option></select></label>
        <button class="variables-clear" type="button" :disabled="!search && !selectedKey" aria-label="Limpiar filtros" title="Limpiar filtros" @click="clearFilters"><SvgIcon name="filter-clear" /></button>
        <button class="variable-primary" type="button" :disabled="!editable || !ready" @click="openEditor()"><SvgIcon name="plus" />Nueva variable</button>
      </div>
    </header>

    <div class="variables-content" :class="{ 'variables-content-editing': editorOpen, 'variables-content-overview': !editorOpen }">
      <CalculatedVariableEditor v-if="editorOpen" :key="editorSession" v-model="draft" :initial-step="editorStep" :assets="visibleAssets" :can-save="canSaveDraft" :test-status="draftTestStatus" :last-test="draftLastTest" :execution-available="executionAvailable" :error="error" @save="save" @cancel="closeEditor" />
      <template v-else>
      <div v-if="error && !editorOpen" class="variables-error" role="alert">{{ error }} <button type="button" @click="reload">Reintentar lectura</button></div>
      <div class="variables-home" :class="{ 'variables-home-single': pageRows.length === 1 }">
      <div class="variables-console-list">
        <article v-for="row in pageRows" :key="row.id" class="variable-console">
          <header class="variable-console-header">
            <span class="variable-row-icon"><SvgIcon name="variable-activity" /></span>
            <div class="variable-title"><code>{{ row.key }}</code><span>{{ row.label }}</span><span class="variable-status" :class="{ paused: !row.active }">{{ row.active ? 'ACTIVA' : 'PAUSADA' }}</span></div>
            <div class="variable-actions">
              <button type="button" :disabled="!editable || !ready" :aria-label="`Editar ${row.key}`" title="Editar variable" @click="openEditor(row)"><SvgIcon name="pencil" /></button>
              <button type="button" :disabled="!editable || !ready" :aria-label="`${row.active ? 'Pausar' : 'Activar'} ${row.key}`" :title="row.active ? 'Pausar variable' : 'Activar variable'" :class="{ 'pause-action': row.active }" @click="toggle(row)"><SvgIcon :name="row.active ? 'variable-pause' : 'variable-play'" /></button>
              <button type="button" :aria-label="`Historial del script de ${row.key}`" title="Historial del script" @click="openHistory(row)"><SvgIcon name="variable-history" /></button>
              <button class="delete-action" type="button" :disabled="!editable || !ready" :aria-label="`Eliminar ${row.key}`" title="Eliminar variable" @click="remove(row)"><SvgIcon name="trash" /></button>
            </div>
          </header>
          <pre class="variable-code"><code>{{ row.script }}</code></pre>
          <div class="variable-metadata"><span>{{ assetCount(row) }} vehículos</span><span>Script v{{ row.versions.at(-1).number }} · {{ row.versions.length }} {{ row.versions.length === 1 ? 'versión guardada' : 'versiones guardadas' }}</span><span>Último cambio de configuración: {{ row.updatedBy }}</span></div>
        </article>
        <p v-if="ready && !filteredRows.length" class="variables-empty">{{ records.length ? 'No hay variables que coincidan con la búsqueda.' : 'No hay variables definidas.' }}</p>
        <nav v-if="pages > 1" class="variables-pagination" aria-label="Páginas de variables"><button type="button" :disabled="page === 1" aria-label="Página anterior" @click="page--"><SvgIcon name="chevron-left" /></button><span>{{ page }} / {{ pages }}</span><button type="button" :disabled="page === pages" aria-label="Página siguiente" @click="page++"><SvgIcon name="chevron-right" /></button></nav>
      </div>
      <aside class="variables-global-summary">
      <h2>Resumen global</h2>
      <div class="variables-metrics" aria-label="Resumen global de variables">
        <div><span>DEFINICIONES</span><strong>{{ ready ? records.length : '—' }}</strong><small>de plataforma</small></div>
        <div><span>ACTIVAS</span><strong class="metric-active">{{ ready ? activeCount : '—' }}</strong><small>habilitadas</small></div>
        <div><span>VEHÍCULOS ALCANZADOS</span><strong>{{ ready ? reachedCount : '—' }}</strong><small>por lista de equipos</small></div>
        <div><span>LEEN LA FICHA</span><strong class="metric-muted">{{ ready ? profileCount : '—' }}</strong><small>{{ profileCount ? 'definiciones' : 'ninguna' }}</small></div>
      </div>
      <section class="variables-recent" aria-labelledby="variables-recent-title">
        <header><h2 id="variables-recent-title">Scripts pendientes de prueba</h2><span>{{ ready ? pendingTestRecords.length : '—' }} {{ pendingTestRecords.length === 1 ? 'pendiente' : 'pendientes' }}</span></header>
        <ul v-if="ready && pendingTestRows.length">
          <li v-for="row in pendingTestRows" :key="row.id">
            <span class="variables-recent-marker" aria-hidden="true"></span>
            <div><strong>{{ row.label }}</strong><code>{{ row.key }}</code><span class="pending-test-status" :class="{ 'pending-test-error': testStatusFor(row).state === 'failed' }">{{ testStatusFor(row).label }}</span></div>
            <button class="pending-test-button" type="button" :disabled="!editable || !ready" :aria-label="`Probar ${row.key}`" @click="openTest(row)"><SvgIcon name="variable-play" />Probar</button>
          </li>
        </ul>
        <p v-else>{{ ready ? records.length ? 'No hay scripts pendientes de prueba.' : 'Todavía no hay variables registradas.' : 'No hay información disponible.' }}</p>
        <p v-if="testRegistryError" class="variables-test-error" role="alert">{{ testRegistryError }} <button type="button" @click="loadTests">Reintentar lectura</button></p>
        <nav v-if="pendingTestPages > 1" class="variables-pagination" aria-label="Páginas de scripts pendientes"><button type="button" :disabled="pendingTestPage === 1" aria-label="Scripts pendientes anteriores" @click="pendingTestPage--"><SvgIcon name="chevron-left" /></button><span>{{ pendingTestPage }} / {{ pendingTestPages }}</span><button type="button" :disabled="pendingTestPage === pendingTestPages" aria-label="Scripts pendientes siguientes" @click="pendingTestPage++"><SvgIcon name="chevron-right" /></button></nav>
      </section>
      </aside>
      </div>
      <footer class="variables-footer"><span role="status">{{ message || 'Guardado local. Ejecución de scripts en backend pendiente de conexión.' }}</span></footer>
      </template>
    </div>

    <Teleport to="body">
      <dialog v-if="historyRow" ref="historyDialog" class="variable-dialog variable-history-dialog" aria-labelledby="variable-history-title" @cancel.prevent="historyRow = null" @click="closeHistoryBackdrop">
        <header><div><small>{{ historyRow.key }} · Versiones de código</small><h2 id="variable-history-title">Historial del script</h2></div><button type="button" aria-label="Cerrar historial" title="Cerrar" @click="historyRow = null"><SvgIcon name="close" /></button></header>
        <div class="variable-dialog-body"><label class="variable-history-select">Versión<select v-model="historyVersion"><option v-for="version in [...historyRow.versions].reverse()" :key="version.number" :value="version.number">Versión {{ version.number }} · {{ version.actor }} · {{ date(version.timestamp) }}</option></select></label><pre class="variable-code"><code>{{ selectedVersion?.script }}</code></pre></div>
        <footer><button type="button" @click="historyRow = null">Cerrar historial</button></footer>
      </dialog>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue"
import { onBeforeRouteLeave } from "vue-router"
import SvgIcon from "../components/icons/SvgIcon.vue"
import CalculatedVariableEditor from "../components/configuration/CalculatedVariableEditor.vue"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"
import { readStorageValue, writeStorageValue } from "../services/storage/browserStorage.js"
import { CALCULATED_VARIABLES_KEY, readCalculatedVariables, saveCalculatedVariables, updateCalculatedVariable } from "../utils/layout/calculatedVariables.js"
import { calculatedVariableInputs } from "../utils/layout/calculatedVariableInputs.js"
import { CALCULATED_VARIABLE_TESTS_KEY, readCalculatedVariableTests, calculatedVariableTestStatus } from "../utils/layout/calculatedVariableTests.js"

const { isPlatformAdmin, visibleAssets } = useAccessControl()
const { currentUser } = useAuthSession()
const editable = computed(() => isPlatformAdmin.value)
const executionAvailable = false
const testResults = ref([]), testRegistryError = ref("")
const loadTests = () => {
  try { testResults.value = readCalculatedVariableTests(readStorageValue); testRegistryError.value = "" }
  catch (cause) { testRegistryError.value = cause.message }
}
const testResultById = computed(() => new Map(testResults.value.map(result => [result.variableId, result])))
const testStatusFor = variable => testRegistryError.value
  ? { state: "unavailable", label: "Estado de prueba no disponible", badge: "SIN REGISTRO", pending: true, canSave: false }
  : calculatedVariableTestStatus(variable, testResultById.value.get(variable.id))
const records = ref([]), ready = ref(false), error = ref(""), message = ref(""), pendingReload = ref(false)
let seedAssets = []
const load = () => {
  try {
    seedAssets = visibleAssets.value.map(asset => ({ id: String(asset.id) }))
    records.value = readCalculatedVariables(readStorageValue, seedAssets)
    ready.value = true
    error.value = ""
    pendingReload.value = false
    loadTests()
  } catch (cause) { ready.value = false; error.value = cause.message }
}
const search = ref(""), selectedKey = ref(""), variableSelect = ref(null)
const assetIdSet = computed(() => new Set(visibleAssets.value.map(asset => String(asset.id))))
const assetCount = row => row.assetIds.filter(id => assetIdSet.value.has(id)).length
const activeCount = computed(() => records.value.filter(row => row.active).length)
const reachedCount = computed(() => new Set(records.value.flatMap(row => row.assetIds).filter(id => assetIdSet.value.has(id))).size)
const profileCount = computed(() => records.value.filter(row => calculatedVariableInputs(row.script).profile.length > 0).length)
const pendingTestPage = ref(1)
const pendingTestRecords = computed(() => records.value.filter(row => testStatusFor(row).pending))
const pendingTestPages = computed(() => Math.max(1, Math.ceil(pendingTestRecords.value.length / 5)))
const pendingTestRows = computed(() => pendingTestRecords.value.slice((pendingTestPage.value - 1) * 5, pendingTestPage.value * 5))
watch(pendingTestPages, count => { pendingTestPage.value = Math.min(pendingTestPage.value, count) })
const normalize = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
const filteredRows = computed(() => {
  const query = normalize(search.value.trim())
  return records.value.filter(row => !query || normalize([row.key, row.label, row.script].join(" ")).includes(query))
})
const page = ref(1)
const pages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / 10)))
const pageRows = computed(() => filteredRows.value.slice((page.value - 1) * 10, page.value * 10))
watch(search, () => { page.value = 1 })
watch(pages, count => { page.value = Math.min(page.value, count) })
watch(records, rows => { if (selectedKey.value && !rows.some(row => row.key === selectedKey.value)) selectedKey.value = "" })

const editorOpen = ref(false), draft = ref({}), baseline = ref("")
const editorStep = ref(1)
const editorSession = ref(0)
const draftLastTest = computed(() => testRegistryError.value ? null : testResultById.value.get(draft.value.id))
const draftTestStatus = computed(() => testStatusFor(draft.value))
const canSaveDraft = computed(() => editable.value && ready.value && executionAvailable && draftTestStatus.value.canSave)
const dirty = computed(() => editorOpen.value && JSON.stringify(draft.value) !== baseline.value)
const confirmDiscard = () => !dirty.value || window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos?")
const closeEditor = () => {
  if (!confirmDiscard()) return
  editorOpen.value = false
  selectedKey.value = ""
  if (pendingReload.value) load()
  else error.value = ""
}
const openEditor = (row = null) => {
  if (!editable.value || !ready.value || !confirmDiscard()) return false
  draft.value = row ? JSON.parse(JSON.stringify(row)) : { id: globalThis.crypto.randomUUID(), key: "", label: "", script: "", readsProfile: false, assetIds: [] }
  draft.value.unit ??= ""
  draft.value.showInDetail ??= true
  baseline.value = JSON.stringify(draft.value)
  editorStep.value = 1
  error.value = ""
  editorSession.value++
  editorOpen.value = true
  selectedKey.value = row?.key || ""
  return true
}
const openTest = row => {
  if (openEditor(row)) {
    editorStep.value = 2
  }
}
const selectVariable = () => {
  const row = records.value.find(item => item.key === selectedKey.value)
  const previousKey = editorOpen.value ? records.value.find(item => item.id === draft.value.id)?.key || "" : ""
  if (row) { if (!openEditor(row)) selectedKey.value = previousKey }
  else if (editorOpen.value) { closeEditor(); if (editorOpen.value) selectedKey.value = previousKey }
  nextTick(() => { if (variableSelect.value) variableSelect.value.value = selectedKey.value })
}
const clearFilters = () => {
  if (!confirmDiscard()) return
  search.value = ""
  selectedKey.value = ""
  editorOpen.value = false
  page.value = 1
  if (pendingReload.value) load()
  else error.value = ""
}
const commit = next => {
  try {
    const saved = saveCalculatedVariables({ read: readStorageValue, write: writeStorageValue, records: next, expected: records.value, assets: seedAssets, canEdit: () => editable.value && ready.value })
    records.value = saved
    error.value = ""
    message.value = "Cambios guardados localmente."
    return true
  } catch (cause) { error.value = cause.message; return false }
}
const actor = () => currentUser.value?.name || currentUser.value?.username || "Administrador de plataforma"
const save = () => {
  if (!editable.value || !ready.value) return
  if (!executionAvailable) { error.value = "No se puede guardar sin una prueba exitosa. Falta conectar el motor de cálculo original."; return }
  if (!draftTestStatus.value.canSave) { error.value = "Prueba esta versión del script sin errores antes de guardar."; return }
  try {
    if (draft.value.assetIds.some(id => !assetIdSet.value.has(id))) throw Error("Hay vehículos que ya no están disponibles. Revisa la selección.")
    const next = updateCalculatedVariable(records.value, draft.value, { actor: actor(), timestamp: new Date().toISOString(), id: draft.value.id || globalThis.crypto.randomUUID() })
    if (commit(next)) { selectedKey.value = ""; editorOpen.value = false }
  } catch (cause) { error.value = cause.message }
}
const toggle = row => {
  if (!editable.value || !ready.value || dirty.value) return
  if (commit(records.value.map(item => item.id === row.id ? { ...item, active: !item.active, updatedBy: actor(), updatedAt: new Date().toISOString() } : item)) && editorOpen.value) {
    draft.value = JSON.parse(JSON.stringify(records.value.find(item => item.id === row.id)))
    draft.value.unit ??= ""
    draft.value.showInDetail ??= true
    baseline.value = JSON.stringify(draft.value)
  }
}
const remove = row => { if (editable.value && ready.value && window.confirm(`¿Eliminar la variable "${row.key}" y sus versiones?`) && commit(records.value.filter(item => item.id !== row.id))) { editorOpen.value = false; selectedKey.value = "" } }
const reload = () => { if (confirmDiscard()) { editorOpen.value = false; selectedKey.value = ""; load() } }
const historyRow = ref(null), historyDialog = ref(null), historyVersion = ref(1)
const selectedVersion = computed(() => historyRow.value?.versions.find(version => version.number === historyVersion.value))
const openHistory = row => { historyRow.value = row; historyVersion.value = row.versions.at(-1).number }
watch(historyRow, async row => { if (row) { await nextTick(); if (!historyDialog.value?.open) historyDialog.value?.showModal() } })
const date = value => new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" }).format(new Date(value))
const outside = event => {
  if (event.target !== event.currentTarget) return false
  const rect = event.currentTarget.getBoundingClientRect()
  return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
}
const closeHistoryBackdrop = event => { if (outside(event)) historyRow.value = null }
const onStorage = event => {
  if (event.key === CALCULATED_VARIABLE_TESTS_KEY) { loadTests(); return }
  if (event.key === null) loadTests()
  if (event.key !== CALCULATED_VARIABLES_KEY && event.key !== null) return
  if (editorOpen.value) {
    pendingReload.value = true
    error.value = "La configuración cambió en otra ventana. Tu edición se conserva; cierra el editor para cargar la versión actual."
  }
  else load()
}
const onUnload = event => { if (dirty.value) { event.preventDefault(); event.returnValue = "" } }
onBeforeRouteLeave(confirmDiscard)
onMounted(() => { load(); window.addEventListener("storage", onStorage); window.addEventListener("beforeunload", onUnload) })
onBeforeUnmount(() => { window.removeEventListener("storage", onStorage); window.removeEventListener("beforeunload", onUnload) })
</script>

<style scoped>
.variables-page { display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 12px; color: #00165c; background: #f5f7fb; box-sizing: border-box; font-size: 12px; }
.variables-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; flex-shrink: 0; padding: 14px 16px; border: 1px solid #d5deed; border-radius: 8px 8px 0 0; background: white; }
.variables-heading { display: flex; align-items: center; gap: 12px; min-width: 0; }
.variables-heading-icon, .variable-row-icon { display: grid; place-items: center; width: 34px; height: 34px; flex-shrink: 0; border-radius: 6px; background: #eef2ff; }
.variables-heading h1 { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 0; font-size: 18px; font-weight: 800; }
.platform-tag { padding: 3px 6px; border-radius: 3px; background: #edf2ff; font-size: 10px; }
.variables-heading p { margin: 5px 0 0; color: #526585; font-size: 12px; line-height: 1.5; }
.variables-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; flex: 1; min-width: 480px; }
.variables-search { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 180px; padding: 0 10px; border: 1px solid #ccd8eb; border-radius: 5px; background: #f9fbfe; color: #8498b8; }
.variables-search input { width: 100%; min-width: 0; height: 36px; padding: 0; border: 0; background: transparent; color: #102372; font: inherit; font-size: 13px; outline: none; }
.variables-page .variables-clear { width: 38px; height: 38px; padding: 8px; flex-shrink: 0; }
.variables-filter { display: flex; align-items: center; gap: 8px; }
.variables-filter > span { font-size: 12px; font-weight: 600; color: #526585; }
.variables-filter select { min-width: 160px; }
.variables-page select, .variable-dialog select { height: 38px; padding: 0 10px; border: 1px solid #ccd8eb; border-radius: 5px; background: #f9fbfe; color: #102372; font: inherit; }
.variables-page button, .variable-dialog button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 32px; padding: 7px 10px; border: 1px solid #ccd8eb; border-radius: 5px; background: white; color: #102372; font: inherit; cursor: pointer; }
.variables-page .variable-primary, .variable-dialog .variable-primary { min-height: 38px; background: #ff6600; border-color: #ff6600; color: white; font-size: 13px; font-weight: 700; }
.variables-content { flex: 1; min-height: 0; overflow: auto; padding: 14px; border: 1px solid #d5deed; border-top: 0; border-radius: 0 0 8px 8px; }
.variables-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
.variables-metrics > div { padding: 14px 16px; border: 1px solid #d5deed; border-radius: 7px; background: white; box-shadow: 0 1px 2px #10237214; }
.variables-metrics span { display: block; color: #8198bd; font-size: 9px; font-weight: 800; }
.variables-metrics strong { display: block; margin: 8px 0 5px; font-size: 24px; line-height: 1; }
.variables-metrics small { font-size: 10px; color: #526585; }
.variables-metrics .metric-active { color: #008a6a; }
.variables-metrics .metric-muted { color: #647a9e; }
.variables-list { display: grid; gap: 12px; }
.variable-row { display: flex; align-items: flex-start; gap: 12px; padding: 14px; border: 1px solid #d5deed; border-radius: 7px; background: white; box-shadow: 0 1px 2px #10237214; }
.variable-row-icon { width: 32px; height: 32px; border: 1px solid #dce4ef; background: #f8faff; }
.variable-main { flex: 1; min-width: 0; }
.variable-title { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 1px 0 8px; }
.variable-title > code { font-weight: 700; font-size: 12px; overflow-wrap: anywhere; }
.variable-title > span:not(.variable-status) { color: #526585; }
.variable-status { padding: 3px 8px; border-radius: 4px; background: #e7faf3; color: #008364; font-size: 9px; font-weight: 800; }
.variable-status.paused { background: #fff1e5; color: #a64c00; }
.variable-code { margin: 0; padding: 14px 16px; border-radius: 6px; background: #0e152b; color: #b8dfff; font-family: Consolas, monospace; font-size: 12px; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; tab-size: 4; }
.variable-metadata { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.variable-metadata span { padding: 3px 6px; border: 1px solid #dce4ef; border-radius: 3px; background: #f8faff; color: #526585; font-size: 10px; }
.variable-actions { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.variable-actions button { width: 30px; height: 30px; min-height: 30px; padding: 6px; }
.variable-actions .pause-action { color: #d43c45; }
.variable-actions .delete-action { border-color: transparent; color: #8b9db9; }
.variables-footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: 14px; color: #8495b1; font-size: 10px; }
.variables-footer nav, .variable-picker-pagination { display: flex; align-items: center; gap: 10px; }
.variables-empty { padding: 40px 12px; text-align: center; color: #647a9e; }
.variables-error { padding: 10px 12px; margin: 0 0 12px; border: 1px solid #f0b6bf; border-radius: 5px; background: #fff0f1; color: #a31f32; line-height: 1.5; }
.variables-page :deep(.svg-icon-wrapper), .variable-dialog :deep(.svg-icon-wrapper) { width: 17px; height: 17px; flex-shrink: 0; }
.variable-dialog { width: min(860px, calc(100vw - 32px)); height: min(820px, calc(100dvh - 32px)); max-width: none; max-height: none; box-sizing: border-box; padding: 0; border: 1px solid #d5deed; border-radius: 8px; color: #102372; font-size: 13px; }
.variable-dialog[open] { display: flex; flex-direction: column; }
.variable-dialog::backdrop { background: #14203199; }
.variable-dialog > header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0; padding: 18px 22px; border-bottom: 1px solid #d5deed; }
.variable-dialog h2 { margin: 4px 0 0; font-size: 20px; }
.variable-dialog header small { font-size: 10px; color: #647a9e; }
.variable-dialog > form { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.variable-dialog-body { flex: 1; min-height: 0; padding: 18px 22px; overflow: auto; }
.variable-form-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.variable-form-fields label, .variable-script-field { display: flex; flex-direction: column; gap: 8px; font-weight: 600; }
.variable-form-fields input { min-width: 0; height: 36px; border: 1px solid #ccd8eb; border-radius: 5px; padding: 0 10px; font: inherit; font-weight: 400; }
.variable-script-field textarea { width: 100%; height: 200px; box-sizing: border-box; resize: vertical; padding: 12px; border: 1px solid #ccd8eb; border-radius: 5px; background: #0e152b; color: #b8dfff; font: 12px/1.7 Consolas, monospace; }
.variable-profile { display: flex; align-items: center; gap: 8px; margin: 14px 0; }
.variable-asset-picker { padding-top: 14px; border-top: 1px solid #d5deed; }
.variable-picker-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.variable-picker-heading h3 { margin: 0; font-size: 14px; }
.variable-picker-heading h3 span { margin-left: 8px; color: #647a9e; font-size: 11px; font-weight: 400; }
.variable-picker-tools { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 12px 0 6px; }
.variable-picker-tools label { display: flex; gap: 8px; align-items: center; }
.variable-asset-rows { max-height: 220px; overflow: auto; }
.variable-asset-rows label { display: grid; grid-template-columns: 18px minmax(100px, 1fr) minmax(0, 2fr); gap: 10px; padding: 10px 0; border-bottom: 1px solid #edf2f8; overflow-wrap: anywhere; }
.variable-asset-rows span { color: #647a9e; }
.variable-picker-pagination { justify-content: flex-end; margin-top: 10px; }
.variable-dialog footer { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 10px; flex-shrink: 0; padding: 14px 22px; border-top: 1px solid #d5deed; }
.variable-dialog footer > span { flex: 1; font-size: 11px; color: #647a9e; }
.variable-history-select { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.variable-history-select select { width: 100%; }
button:disabled { opacity: .45; cursor: not-allowed; }
input[type=checkbox] { accent-color: #ff6600; }
button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid #ff6600; outline-offset: 2px; }
.variables-search:focus-within { border-color: #102372; background: white; outline: none; }
.variables-search input:focus-visible { border: 0; outline: none; box-shadow: none; }
@media (max-width: 1000px) { .variables-toolbar { align-items: flex-start; } .variables-tools { width: 100%; } .variables-search { flex: 1; } .variables-search input { width: 100%; } .variable-row { flex-wrap: wrap; } .variable-main { flex-basis: calc(100% - 48px); } .variable-actions { margin-left: 44px; } }
@media (max-width: 600px) { .variables-page { padding: 8px; } .variables-toolbar { padding: 12px; } .variables-heading p { line-height: 1.5; } .variables-heading h1 { font-size: 14px; } .variables-tools { gap: 8px; } .variables-tools > .variables-search { flex-basis: 100%; } .variables-filter { flex: 1; min-width: 0; } .variables-filter select { min-width: 0; width: 100%; } .variables-content { padding: 10px; } .variables-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } .variables-metrics > div { padding: 12px; } .variable-row { padding: 10px; gap: 8px; } .variable-row-icon { display: none; } .variable-main { flex-basis: 100%; } .variable-actions { margin-left: 0; } .variable-code { font-size: 11px; padding: 12px; } .variable-form-fields { grid-template-columns: 1fr; } .variable-dialog-body, .variable-dialog > header { padding: 16px; } .variable-asset-rows label { grid-template-columns: 18px minmax(0, 1fr); } .variable-asset-rows span { grid-column: 2; } }
.variables-content-editing { padding: 0; overflow: hidden; }
.variables-page-editor { background: white; }
.variables-page-editor .variables-toolbar { border-bottom-color: #e2e8f2; padding: 14px 16px; }
.variables-page-editor .variables-heading h1 { font-size: 18px; }
.variables-page-editor .variables-heading p { font-size: 12px; line-height: 1.5; }
.variables-page-editor .platform-tag { font-size: 10px; padding: 3px 6px; }
.variables-page .variables-back { width: 38px; height: 38px; padding: 9px; border: 0; background: #eef2ff; flex-shrink: 0; }
.variables-page-editor .variables-tools { gap: 12px; }
.variables-page-editor .variables-filter > span { font-size: 12px; font-weight: 600; }
.variables-page-editor .variables-filter select { height: 38px; font-size: 12px; }
.variables-page-editor .variables-search input { height: 36px; font-size: 13px; }
.variables-page-editor .variable-primary { height: 38px; font-size: 13px; }
.variables-page-editor .variables-clear { height: 38px; width: 38px; }
@media(max-width:600px) { .variables-page-editor .variables-toolbar { padding: 14px 12px; } .variables-page-editor .variables-heading h1 { font-size: 17px; } .variables-page-editor .variables-heading p { font-size: 11px; } .variables-page-editor .variables-tools { gap: 8px; } }
@media(max-width:1000px) { .variables-tools { min-width: 0; flex-basis: 100%; } }
.variables-content-overview { display: flex; flex-direction: column; padding: 20px; background: white; }
.variables-content-overview > .variables-footer { flex-shrink: 0; }
.variables-home { display: grid; grid-template-columns: minmax(0, 2.3fr) minmax(300px, 1fr); grid-template-rows: minmax(0, 1fr); gap: 20px; flex: 1; min-height: 380px; padding: 0; background: white; border: 0; border-radius: 0; }
.variables-console-list { min-width: 0; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 22px; }
.variable-console { min-width: 0; }
.variables-home-single .variable-console { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.variables-home-single .variable-console > .variable-code { flex: 1; max-height: none; min-height: 220px; }
.variables-home-single .variable-console-header, .variables-home-single .variable-metadata { flex-shrink: 0; }
.variable-console-header { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; min-height: 54px; box-sizing: border-box; padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid #d5deed; }
.variable-console-header .variable-title { flex: 1; min-width: 0; }
.variable-console-header .variable-actions { margin: 0; }
.variable-console > .variable-code { min-height: 300px; max-height: 520px; overflow: auto; white-space: pre; font-size: 13px; padding: 22px; line-height: 1.9; }
.variable-console + .variable-console { border-top: 1px solid #d5deed; padding-top: 22px; }
.variables-pagination { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
@media(max-width:600px) { .variable-console > .variable-code { min-height: 230px; padding: 14px; font-size: 11px; } .variable-console-header .variable-actions { flex-basis: 100%; justify-content: flex-end; } }
.variable-unselected { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; min-width: 0; background: #f8faff; border: 1px dashed #ccd8eb; border-radius: 6px; }
.variable-unselected-icon { display: grid; place-items: center; width: 52px; height: 52px; background: #edf2ff; border-radius: 8px; color: #647a9e; }
.variable-unselected h2 { margin: 0; font-size: 17px; font-weight: 600; color: #647a9e; }
.variables-global-summary { display: flex; flex-direction: column; min-width: 0; min-height: 0; border-left: 1px solid #d5deed; padding-left: 20px; }
.variables-global-summary h2 { margin: 0 0 16px; color: #526585; font-size: 12px; font-weight: 700; }
.variables-global-summary > h2 { display: flex; align-items: center; min-height: 54px; box-sizing: border-box; padding-bottom: 16px; border-bottom: 1px solid #d5deed; flex-shrink: 0; }
.variables-global-summary .variables-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: auto auto; flex: none; margin-bottom: 0; gap: 10px; }
.variables-global-summary .variables-metrics > div { display: flex; flex-direction: column; justify-content: flex-start; min-width: 0; padding: 12px 14px; }
.variables-global-summary .variables-metrics strong { font-size: 24px; margin: 8px 0 5px; }
.variables-global-summary .variables-metrics span { overflow-wrap: anywhere; line-height: 1.5; }
.variables-recent { display: flex; flex-direction: column; flex: 1; min-height: 0; margin-top: 24px; padding-top: 18px; border-top: 1px solid #d5deed; }
.variables-recent > header, .variables-recent > p { flex-shrink: 0; }
.variables-recent > .variables-pagination { flex-shrink: 0; padding-top: 10px; border-top: 1px solid #e8edf5; background: white; }
.variables-recent > header { display: flex; align-items: baseline; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.variables-recent header h2 { margin: 0; }
.variables-recent header > span, .variables-recent > p { color: #8495b1; font-size: 10px; }
.variables-recent ul { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-gutter: stable; margin: 0; padding: 0; list-style: none; }
.variables-recent li { display: flex; align-items: flex-start; gap: 10px; padding: 16px 0; border-bottom: 1px solid #e8edf5; }
.variables-recent-marker { width: 7px; height: 7px; border-radius: 50%; background: #ff6600; margin-top: 5px; flex-shrink: 0; }
.variables-recent li > div { display: grid; gap: 5px; min-width: 0; flex: 1; }
.variables-recent strong { font-size: 12px; overflow-wrap: anywhere; }
.variables-recent code { color: #647a9e; font-size: 10px; overflow-wrap: anywhere; }
.variables-recent li div > span, .variables-recent time { color: #647a9e; font-size: 10px; overflow-wrap: anywhere; }
.variables-recent li button { width: 30px; height: 30px; padding: 6px; flex-shrink: 0; }
.variables-recent li .pending-test-button { width: auto; padding: 6px 10px; color: #a34200; background: #fff5ed; border-color: #ffd6b8; font-size: 11px; }
.variables-recent li div > .pending-test-status { color: #a66a22; font-size: 10px; }
.variables-recent li div > .pending-test-error { color: #b42335; }
.variables-test-error { color: #b42335; line-height: 1.5; }
@media(max-width: 900px) { .variables-home { grid-template-columns: minmax(0, 1fr); padding: 16px; } .variable-unselected { min-height: 240px; } .variables-global-summary { border-left: 0; padding-left: 0; } }
.variable-row { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; align-items: center; gap: 14px; padding: 20px; }
.variable-main { display: contents; }
.variable-title { margin: 0; min-width: 0; }
.variables-page .variable-open { padding: 0; min-height: 28px; border: 0; background: transparent; font-size: 15px; font-weight: 800; text-align: left; overflow-wrap: anywhere; }
.variables-page .variable-open:hover { text-decoration: underline; }
.variable-title > code { font-family: inherit; font-size: 18px; font-weight: 800; }
.variable-title > span:not(.variable-status) { font-size: 13px; }
.variable-actions { margin: 0; }
.variable-actions button { width: 36px; height: 36px; }
.variable-overview { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); gap: 22px; padding-top: 20px; border-top: 1px solid #d5deed; align-items: stretch; }
.variable-overview > .variable-code { min-width: 0; min-height: 340px; max-height: 520px; overflow: auto; white-space: pre; padding: 22px; font-size: 13px; line-height: 1.9; }
.variable-information { min-width: 0; border-left: 1px solid #d5deed; padding-left: 22px; }
.variable-information h2, .variable-inputs h3 { margin: 0 0 12px; color: #647a9e; font-size: 11px; font-weight: 700; }
.variable-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.variable-facts > div { padding: 14px; background: #f5f8fd; border: 1px solid #dce4ef; border-radius: 6px; }
.variable-facts span, .variable-facts small { display: block; color: #647a9e; font-size: 10px; }
.variable-facts strong { display: block; margin: 8px 0; font-size: 25px; line-height: 1; }
.variable-facts .variable-fact-status { font-size: 20px; color: #a64c00; }
.variable-facts .variable-fact-status.is-active { color: #008364; }
.variable-picker-list { background: white; border: 1px solid #d5deed; border-radius: 7px; padding: 16px; }
.variable-picker-list h2 { margin: 0 0 12px; font-size: 14px; }
.variables-page .variable-picker-list button { width: 100%; display: flex; justify-content: flex-start; gap: 12px; padding: 14px 10px; border: 0; border-top: 1px solid #e2e9f3; border-radius: 0; text-align: left; }
.variable-picker-list button strong, .variable-picker-list button span { overflow-wrap: anywhere; min-width: 0; }
.variable-picker-list button span { color: #647a9e; }
.variable-picker-list button :deep(.svg-icon-wrapper:last-child) { margin-left: auto; }
.variables-page .variable-picker-list button:hover { background: #f5f8fd; }
.variable-information dl { margin: 16px 0; }
.variable-information dl > div { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 12px; padding: 9px 0; border-bottom: 1px solid #e2e9f3; }
.variable-information dt { color: #647a9e; }
.variable-information dd { margin: 0; overflow-wrap: anywhere; }
.variable-information dd small { display: block; margin-top: 4px; color: #647a9e; font-size: 10px; }
.variable-inputs code { display: inline-block; margin: 0 6px 6px 0; padding: 4px 7px; border-radius: 3px; background: #edf2ff; font-size: 11px; overflow-wrap: anywhere; max-width: 100%; box-sizing: border-box; }
.variable-inputs > span { color: #647a9e; font-size: 11px; }
.variable-execution { display: flex; align-items: flex-start; gap: 7px; margin: 12px 0 0; color: #647a9e; font-size: 10px; line-height: 1.5; }
@media (max-width: 1000px) { .variable-overview { grid-template-columns: minmax(0, 1fr); } .variable-information { border-left: 0; border-top: 1px solid #d5deed; padding: 18px 0 0; } .variable-overview > .variable-code { min-height: 220px; max-height: 360px; } }
@media (max-width: 600px) { .variable-row { grid-template-columns: minmax(0, 1fr); padding: 14px; } .variable-title > code { font-size: 16px; } .variable-actions { grid-row: 2; justify-content: flex-end; } .variable-overview { gap: 14px; padding-top: 14px; } .variable-overview > .variable-code { padding: 14px; font-size: 11px; } }
@media (max-width: 760px) { .variables-content-editing { overflow: auto; } }
@media(max-width: 900px) { .variables-home { flex: initial; grid-template-rows: auto; } .variables-console-list { overflow: visible; } .variables-global-summary { padding-left: 0; } .variables-recent { flex: none; } .variables-recent ul { flex: none; max-height: 360px; } .variables-global-summary .variables-metrics { grid-template-rows: auto auto; } .variables-home-single .variable-console > .variable-code { min-height: 260px; max-height: 480px; } }
@media(max-width:600px) {
  .variables-heading h1, .variables-page-editor .variables-heading h1 { font-size: 16px; }
  .variables-heading p, .variables-page-editor .variables-heading p { font-size: 11px; }
  .variables-toolbar, .variables-page-editor .variables-toolbar { padding: 12px; }
  .variables-content-overview { padding: 12px; }
  .variables-home { padding: 0; }
}
</style>
