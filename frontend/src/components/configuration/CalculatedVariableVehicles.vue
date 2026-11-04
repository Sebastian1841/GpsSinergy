<template>
  <section class="vehicle-assignment">
    <header class="assignment-mode">
      <label><input v-model="mode" type="radio" value="list" />Por lista de vehículos</label>
      <label><input v-model="mode" type="radio" value="model" />Por modelo</label>
      <small v-if="mode === 'model'">Selecciona los vehículos actuales del modelo; no incluye incorporaciones futuras.</small>
      <small v-else>La selección se guarda por vehículo.</small>
    </header>
    <div class="assignment-filters">
      <button v-for="filter in filters" :key="filter.id" type="button" :aria-pressed="activeFilter === filter.id" @click="activeFilter = activeFilter === filter.id ? '' : filter.id">{{ filter.label }}<small>{{ rows.filter(filter.matches).length }}</small></button>
      <label class="assignment-search"><SvgIcon name="search" /><input v-model="search" type="search" placeholder="Buscar vehículo o modelo..." aria-label="Buscar vehículos de la variable" /></label>
    </div>
    <div v-if="mode === 'model'" class="assignment-models"><label>Modelo<select v-model="model"><option value="">Elegir modelo</option><option v-for="item in models" :key="item" :value="item">{{ item }}</option></select></label><button type="button" :disabled="!model" @click="selectRows(rows.filter(row => row.model === model))">Seleccionar modelo</button></div>
    <div class="assignment-summary"><strong>{{ selected.length }} vehículos elegidos <small>de {{ rows.length }} disponibles</small></strong><button type="button" @click="selectRows(rows.filter(row => row.compatible))">Añadir compatibles ({{ rows.filter(row => row.compatible).length }})</button><button type="button" @click="selectRows(filtered)">Los {{ filtered.length }} de la lista</button><button type="button" :disabled="!selected.length" @click="selected = []">Ninguno</button></div>
    <div class="assignment-table"><table><thead><tr><th>VEHÍCULO</th><th>MODELO</th><th>SEÑALES DISPONIBLES</th><th>DEL SCRIPT</th></tr></thead><tbody><tr v-for="row in pageRows" :key="row.id" :class="{ selected: selected.includes(row.id) }"><td><label><input v-model="selected" type="checkbox" :value="row.id" /><strong>{{ row.label }}</strong></label></td><td>{{ row.model }}</td><td><span v-for="tag in row.tags" :key="tag">{{ tag }}</span><small v-if="!row.tags.length">Sin señales de estas categorías</small></td><td>{{ row.available }} / {{ signalKeys.length }}</td></tr><tr v-if="!filtered.length"><td colspan="4">No hay vehículos que coincidan.</td></tr></tbody></table></div>
    <footer><small>Compatibilidad basada en datos disponibles, no en una prueba de ejecución.</small><nav aria-label="Paginación de vehículos"><button type="button" :disabled="page === 1" aria-label="Vehículos anteriores" @click="page--"><SvgIcon name="chevron-left" /></button><span>{{ page }} / {{ pages }}</span><button type="button" :disabled="page === pages" aria-label="Vehículos siguientes" @click="page++"><SvgIcon name="chevron-right" /></button></nav></footer>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
import { calculatedSignalValue, hasCalculatedFuelLevel } from "../../utils/layout/calculatedVariableSignals.js"
import { calculatedVariableCompatibility } from "../../utils/layout/calculatedVariableCompatibility.js"
const selected = defineModel({ type: Array, required: true })
const props = defineProps({ assets: { type: Array, default: () => [] }, signalKeys: { type: Array, default: () => [] }, profileKeys: { type: Array, default: () => [] } })
const mode = ref("list"), model = ref(""), search = ref(""), activeFilter = ref(""), page = ref(1)
const has = (asset, key) => calculatedSignalValue(asset, key) != null
const categories = [
  { id: "can", label: "Con CAN", tag: "CAN", matches: asset => Object.keys(asset).some(key => /^can[A-Z]/.test(key) && has(asset, key)) },
  { id: "temperature", label: "Con temperatura", tag: "TEMP", matches: asset => ["canEngineTemp", "temperature", "temperature1", "temperature2"].some(key => has(asset, key)) },
  { id: "digital", label: "Con entradas digitales", tag: "DIGITAL", matches: asset => ["digitalInput1", "digitalInput2"].some(key => has(asset, key)) },
  { id: "fuel", label: "Con nivel de combustible", tag: "NIVEL", matches: hasCalculatedFuelLevel },
]
const rows = computed(() => props.assets.map(asset => ({ id: String(asset.id), label: asset.patente || asset.plate || asset.nombrePantalla || asset.imei || String(asset.id), model: asset.trackerModelLabel || asset.trackerModel || "Sin modelo", ...calculatedVariableCompatibility(asset, props.signalKeys, props.profileKeys), tags: categories.filter(category => category.matches(asset)).map(category => category.tag), asset })))
const filters = [{ id: "compatible", label: "Compatibles con este script", matches: row => row.compatible }, ...categories.map(category => ({ ...category, matches: row => category.matches(row.asset) }))]
const normalize = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
const models = computed(() => [...new Set(rows.value.map(row => row.model))].sort())
const filtered = computed(() => rows.value.filter(row => (!activeFilter.value || filters.find(filter => filter.id === activeFilter.value).matches(row)) && normalize(`${row.label} ${row.model} ${row.asset.imei || ''}`).includes(normalize(search.value)) && (mode.value !== "model" || !model.value || row.model === model.value)))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 20)))
const pageRows = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20))
watch([search, activeFilter, mode, model], () => { page.value = 1 })
watch(pages, value => { page.value = Math.min(page.value, value) })
const selectRows = items => { selected.value = [...new Set([...selected.value, ...items.map(row => row.id)])] }
</script>

<style scoped>
.vehicle-assignment{display:flex;flex-direction:column;min-height:0;flex:1;background:white;border:1px solid #d5deed;border-radius:7px;color:#102372;font-size:12px;overflow:hidden}
.assignment-mode,.assignment-filters,.assignment-summary,.assignment-models{display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding:12px 14px;border-bottom:1px solid #e5ebf4;flex-shrink:0}
.assignment-mode label,td label{display:flex;align-items:center;gap:6px;font-weight:600}.assignment-mode small,footer>small{color:#647a9e;font-size:10px}
button,select{border:1px solid #ccd8eb;border-radius:5px;background:white;color:#102372;padding:7px 9px;font:inherit;cursor:pointer}button{display:inline-flex;align-items:center;gap:7px;font-size:10px;font-weight:600}button small{padding:2px 4px;background:#edf2f8;border-radius:3px}button[aria-pressed=true]{border-color:#ff6600;background:#fff3e9;color:#a34200}
.assignment-search{display:flex;align-items:center;gap:6px;border:1px solid #ccd8eb;border-radius:5px;padding:0 8px;margin-left:auto;min-width:0}.assignment-search input{height:30px;border:0;min-width:0;background:transparent;color:#102372;font:inherit}.assignment-summary{background:#f7f9fd}.assignment-summary strong{margin-right:auto}.assignment-summary strong small{margin-left:6px;color:#647a9e;font-weight:400;font-size:10px}.assignment-summary button:first-of-type{background:#142574;color:white;border-color:#142574}
.assignment-models label{display:flex;align-items:center;gap:8px}.assignment-table{flex:1;min-height:0;overflow:auto}table{width:100%;border-collapse:collapse;text-align:left}th{position:sticky;top:0;background:white;color:#7c94ba;font-size:9px;font-weight:600;padding:10px 14px}td{padding:12px 14px;border-top:1px solid #edf2f8;font-size:11px}td:last-child,th:last-child{text-align:right}tr.selected{background:#f4f7ff}td span{display:inline-block;padding:3px 5px;margin:2px;background:#edf2ff;border-radius:3px;font-size:9px}td small{color:#7c94ba;font-size:10px}footer{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 14px;border-top:1px solid #e5ebf4}nav{display:flex;align-items:center;gap:12px}input{accent-color:#0666e8}button:disabled{opacity:.45;cursor:not-allowed}:deep(.svg-icon-wrapper){width:14px;height:14px}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #ff6600;outline-offset:2px}
@media(max-width:760px){.vehicle-assignment{min-height:420px}.assignment-search{margin-left:0;width:100%}.assignment-search input{width:100%}th,td{padding:9px 7px}td strong{overflow-wrap:anywhere}footer{flex-wrap:wrap}.assignment-summary strong{width:100%}}
</style>
