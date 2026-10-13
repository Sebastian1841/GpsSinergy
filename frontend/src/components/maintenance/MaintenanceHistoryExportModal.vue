<template>
  <Teleport to="body">
    <dialog ref="dialog" aria-labelledby="history-export-title" @cancel.prevent="close" @click="backdrop">
      <header><h2 id="history-export-title">Exportar historial - {{ vehicle.plate }}</h2><button aria-label="Cerrar" title="Cerrar" :disabled="busy" @click="close"><SvgIcon name="close" class="h-5 w-5" /></button></header>
      <section>
        <div class="filters">
          <label>Buscar<input v-model="search" type="search" :disabled="busy" /></label>
          <label>Mantencion<select v-model="type" :disabled="busy"><option value="all">Todas</option><option v-for="item in options.types" :key="item">{{ item }}</option></select></label>
          <label>Taller<select v-model="workshop" :disabled="busy"><option value="">Todos</option><option v-for="item in options.workshops" :key="item">{{ item }}</option></select></label>
          <label>Cierre desde<input v-model="from" type="date" :disabled="busy" /></label>
          <label>Cierre hasta<input v-model="to" type="date" :disabled="busy" /></label>
        </div>
        <div class="summary"><strong>{{ selected.length }} ejecuciones seleccionadas · {{ money(total) }}</strong><button :disabled="busy" @click="clear">Limpiar filtros</button></div>
        <div class="table-scroll"><table>
          <thead><tr><th><input type="checkbox" aria-label="Seleccionar ejecuciones filtradas" :checked="allSelected" :disabled="busy || !filtered.length" @change="toggleAll" /></th><th>OT</th><th>Mantencion</th><th>Cierre</th><th>Responsable / taller</th><th>Costo real</th></tr></thead>
          <tbody><tr v-for="order in filtered" :key="order.id"><td><input type="checkbox" :aria-label="`Seleccionar ${order.id}`" :checked="selectedIds.has(order.id)" :disabled="busy" @change="toggle(order.id)" /></td><td>{{ order.id }}</td><td>{{ order.job }}</td><td>{{ order.closedAt || 'Sin registro' }}</td><td>{{ order.closedBy || order.owner || 'Sin registro' }}<small>{{ order.workshop }}</small></td><td>{{ money(parseMaintenanceOrderCost(order.actualCost)) }}</td></tr><tr v-if="!filtered.length"><td colspan="6">No hay ejecuciones que coincidan con los filtros.</td></tr></tbody>
        </table></div>
        <p v-if="error" role="alert">{{ error }}</p>
      </section>
      <footer><label>Formato<select v-model="format" :disabled="busy"><option value="excel">Excel (.xlsx)</option><option value="pdf">PDF</option></select></label><button :disabled="busy" @click="close">Cancelar</button><button class="primary" :disabled="busy || !selected.length || (from && to && from > to)" @click="download">{{ busy ? 'Generando...' : 'Descargar' }}</button></footer>
    </dialog>
  </Teleport>
</template>

<script setup>
import { onMounted, ref } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
import { useHistoryExportSelection } from "../../composables/maintenance/useHistoryExportSelection.js"
import { parseMaintenanceOrderCost } from "../../utils/maintenance/maintenanceOrderSummary.js"
const props = defineProps({ orders: { type: Array, required: true }, vehicle: { type: Object, required: true }, initialFilters: { type: Object, default: () => ({}) } })
const emit = defineEmits(["close"])
const { search, type, from, to, workshop, selectedIds, options, filtered, selected, total, allSelected, toggle, toggleAll, clear } = useHistoryExportSelection(props.orders, props.initialFilters)
const dialog = ref(null)
const busy = ref(false)
const error = ref("")
const format = ref("excel")
const money = value => `$ ${Number(value).toLocaleString("es-CL")}`
const close = () => { if (!busy.value) emit("close") }
const backdrop = event => { if (event.target === dialog.value) { const rect = dialog.value.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close() } }
onMounted(() => dialog.value.showModal())
const download = async () => {
  if (busy.value || !selected.value.length) return
  busy.value = true
  error.value = ""
  try { const { exportMaintenanceHistory } = await import("../../services/maintenance/maintenanceHistoryExportService.js"); await exportMaintenanceHistory(selected.value, props.vehicle, format.value); emit("close") }
  catch { error.value = "No se pudo generar el archivo. Intenta nuevamente." }
  finally { busy.value = false }
}
</script>

<style scoped>
dialog{width:min(1120px,calc(100vw - 32px));max-height:calc(100dvh - 32px);padding:0;border:1px solid #d8e0eb;border-radius:8px;color:#102372;background:#fff}dialog::backdrop{background:#15202d99}header,footer{display:flex;align-items:center;gap:12px;padding:16px 20px}header{justify-content:space-between;border-bottom:1px solid #d8e0eb}h2{font-size:19px;margin:0}section{padding:16px 20px;overflow:auto;max-height:calc(100dvh - 200px)}.filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:600}input:not([type=checkbox]),select,button{border:1px solid #ccd8ef;border-radius:4px;padding:8px;background:white;color:#102372;min-width:0}button{cursor:pointer}button:disabled{opacity:.5;cursor:default}.summary{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:16px 0;font-size:13px}.table-scroll{max-height:340px;overflow:auto;border:1px solid #d8e0eb}table{border-collapse:collapse;width:100%;font-size:12px}th,td{text-align:left;padding:10px;border-bottom:1px solid #d8e0eb}th{position:sticky;top:0;background:#eef3f9}small{display:block;color:#65748d;margin-top:4px}footer{justify-content:flex-end;border-top:1px solid #d8e0eb}.primary{background:#102372;color:white}p[role=alert]{color:#bc1238}@media(max-width:640px){.filters{grid-template-columns:repeat(2,minmax(0,1fr))}header,footer,section{padding:12px}table{min-width:650px}.summary{align-items:flex-start}footer{flex-wrap:wrap}h2{font-size:16px}}
</style>
