<template>
  <Teleport to="body">
    <dialog ref="dialog" class="fleet-export-dialog" aria-labelledby="fleet-export-title" @cancel.prevent="close" @click="onBackdropClick">
      <header>
        <h2 id="fleet-export-title">Exportar flota y mantenciones</h2>
        <button type="button" title="Cerrar" aria-label="Cerrar" :disabled="busy" @click="close"><SvgIcon name="close" class="h-5 w-5" /></button>
      </header>
      <div class="export-body">
        <div class="export-filters">
          <label class="search">Buscar<input v-model="search" type="search" placeholder="Patente, vehiculo o mantencion" :disabled="busy" /></label>
          <label>Empresa<select v-model="company" :disabled="busy"><option value="">Todas</option><option v-for="value in options.companies" :key="value">{{ value }}</option></select></label>
          <label>Estado del plan<select v-model="status" :disabled="busy"><option value="">Todos</option><option v-for="value in options.statuses" :key="value">{{ value }}</option></select></label>
          <label>Criterio<select v-model="criterion" :disabled="busy"><option value="">Todos</option><option v-for="value in options.criteria" :key="value">{{ value }}</option></select></label>
          <label>OT actual<select v-model="order" :disabled="busy"><option value="">Todas</option><option value="with">Con OT</option><option value="without">Sin OT</option></select></label>
        </div>
        <div class="selection-toolbar">
          <strong>{{ selectedRows.length }} vehiculos seleccionados · {{ planCount }} planes a exportar</strong>
          <button type="button" :disabled="busy" @click="clearFilters">Limpiar filtros</button>
          <button type="button" :disabled="busy || !selectedIds.size" @click="selectedIds = new Set()">Quitar seleccion</button>
        </div>
        <div class="export-table">
          <table>
            <thead><tr><th><input type="checkbox" aria-label="Seleccionar vehiculos filtrados" :checked="allFilteredSelected" :disabled="busy || !filteredRows.length" @change="toggleFiltered" /></th><th>Vehiculo</th><th>Empresa</th><th>Lecturas actuales</th><th>Mantenciones a exportar</th></tr></thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.id">
                <td><input type="checkbox" :aria-label="`Seleccionar ${row.plate}`" :checked="selectedIds.has(row.id)" :disabled="busy" @change="toggle(row.id)" /></td>
                <td><strong>{{ row.plate }}</strong><small>{{ row.name }}</small></td>
                <td>{{ row.company }}</td>
                <td>{{ formatNumber(row.odometer) }} km<small>{{ row.hourMeter }}</small></td>
                <td><strong>{{ row.plans.length }} planes</strong><small>{{ row.plans.map(plan => plan.name).join(', ') || 'Sin planes configurados' }}</small></td>
              </tr>
              <tr v-if="!filteredRows.length"><td colspan="5" class="empty">No hay vehiculos que coincidan con los filtros.</td></tr>
            </tbody>
          </table>
        </div>
        <p v-if="error" role="alert" class="error">{{ error }}</p>
      </div>
      <footer>
        <label>Formato<select v-model="format" :disabled="busy"><option value="excel">Excel (.xlsx)</option><option value="pdf">PDF (.pdf)</option></select></label>
        <button type="button" :disabled="busy" @click="close">Cancelar</button>
        <button type="button" class="primary" :disabled="busy || !selectedRows.length" @click="emit('export', { format, rows: selectedRows })">{{ busy ? 'Generando...' : 'Descargar' }}</button>
      </footer>
    </dialog>
  </Teleport>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
import { useFleetExportSelection } from "../../composables/maintenance/useFleetExportSelection.js"
import { formatNumber } from "../../utils/maintenance/maintenanceFormatUtils.js"
const props = defineProps({ rows: { type: Array, required: true }, initialIds: { type: Array, default: () => [] }, busy: Boolean, error: { type: String, default: "" } })
const emit = defineEmits(["close", "export"])
const dialog = ref(null)
const format = ref("excel")
const { search, company, status, criterion, order, selectedIds, options, filteredRows, selectedRows, planCount, allFilteredSelected, toggle, toggleFiltered, clearFilters } = useFleetExportSelection(props.rows, props.initialIds)
const close = () => { if (!props.busy) emit("close") }
const onBackdropClick = event => {
  if (event.target !== dialog.value) return
  const bounds = dialog.value.getBoundingClientRect()
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
}
onMounted(() => dialog.value.showModal())
onBeforeUnmount(() => dialog.value?.close())
</script>

<style scoped>
.fleet-export-dialog { width: min(1080px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); margin: auto; padding: 0; border: 1px solid #d8e0eb; border-radius: 8px; color: #102372; background: #fff; }
.fleet-export-dialog[open] { display: flex; flex-direction: column; }
.fleet-export-dialog::backdrop { background: rgb(15 23 42 / 55%); }
header, footer { display: flex; align-items: center; gap: 12px; padding: 18px 22px; flex-shrink: 0; background: #f7f9fc; }
header { border-bottom: 1px solid #d8e0eb; justify-content: space-between; }
h2 { margin: 0; font-size: 20px; font-weight: 800; }
.export-body { padding: 20px 22px; overflow: auto; min-height: 0; }
.export-filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.search { grid-column: 1 / -1; }
label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 700; }
input:not([type=checkbox]), select { min-width: 0; height: 36px; padding: 0 10px; border: 1px solid #cfd8e6; border-radius: 6px; background: #fff; color: #102372; font: inherit; }
input[type=checkbox] { width: 16px; height: 16px; accent-color: #102372; cursor: pointer; }
.selection-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 16px 0; font-size: 12px; }
.selection-toolbar strong { margin-right: auto; }
button { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 0 12px; border: 1px solid #cfd8e6; border-radius: 6px; background: #fff; color: #102372; font-size: 12px; font-weight: 700; cursor: pointer; }
button:disabled { opacity: .5; cursor: not-allowed; }
.export-table { max-height: 360px; overflow: auto; border: 1px solid #d8e0eb; border-radius: 6px; }
table { width: 100%; min-width: 700px; border-collapse: collapse; font-size: 12px; }
th { position: sticky; top: 0; z-index: 1; background: #edf3f9; text-align: left; }
td, th { padding: 12px; border-bottom: 1px solid #e5eaf1; vertical-align: top; }
td:last-child { width: 40%; }
small { display: block; margin-top: 4px; font-size: 11px; color: #526b94; overflow-wrap: anywhere; }
.empty { text-align: center; padding: 30px; }
.error { color: #c90036; font-size: 12px; }
footer { border-top: 1px solid #d8e0eb; }
footer label { flex-direction: row; align-items: center; margin-right: auto; }
.primary { background: #ff6600; border-color: #ff6600; color: #fff; }
@media (max-width: 640px) { .export-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } header, footer, .export-body { padding: 14px; } footer { flex-wrap: wrap; } footer label { width: 100%; } h2 { font-size: 18px; } }
</style>
