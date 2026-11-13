<template>
  <section
    class="analysis-view"
    :class="analysisSection === 'summary' ? 'is-summary' : 'is-without-order'"
  >
    <div v-if="expandedChart" class="chart-expand-backdrop" @click="closeExpandedChart" />
    <template v-if="analysisSection === 'summary'">
      <MaintenanceAnalysisPreviewControl v-if="canPreviewAnalysis" v-model="analysisDemoEnabled" />
      <div class="analysis-summary-grid" :class="{ 'is-empty': !hasMonthlyCosts && !activeCostCategoryCount }">
      <dl class="analysis-metrics" aria-label="Resultados de OT finalizadas en el periodo">
        <div><dt>Costo total registrado</dt><dd>{{ completedOrderCount ? currency(completedOrderStatistics.actualCost) : 'Sin datos' }}</dd><small>{{ completedOrderCount ? 'En OT finalizadas del periodo' : 'Sin OT finalizadas en el periodo' }}</small></div>
        <div><dt>OT finalizadas</dt><dd>{{ completedOrderCount }}</dd><small>{{ periodLabel }}</small></div>
        <div><dt>Cumplimiento de plazo</dt><dd>{{ measurableOrderCount ? completedOrderStatistics.onTimeRate + '%' : 'Sin datos' }}</dd><small>{{ measurableOrderCount ? onTimeOrderCount + ' de ' + measurableOrderCount + ' OT con fecha limite' : 'Sin OT finalizadas con fecha limite' }}</small></div>
      </dl>
        <article class="card analysis-monthly-card" :class="{ 'chart-expanded': expandedChart === 'cost' }">
          <header><div><h2><SvgIcon name="reporte" />Costo mensual</h2><p>{{ hasMonthlyCosts ? monthlyCostComparison : periodLabel }}</p></div><button v-if="hasMonthlyCosts" type="button" class="expand-chart-button" title="Ampliar grafico" @click="toggleExpandedChart('cost')"><SvgIcon :name="expandedChart === 'cost' ? 'close' : 'expand'" /></button></header>
          <div v-if="hasMonthlyCosts" class="cost-chart">
            <div class="cost-axis"><span v-for="tick in costAxisTicks" :key="tick">{{ compactCost(tick) }}</span></div>
            <div class="cost-plot" :class="{ 'is-dense': monthlyCosts.length > 6 }"><div v-for="(bar, index) in monthlyCosts" :key="bar.label" class="chart-tooltip" :class="{ 'is-current-month': index === monthlyCosts.length - 1 }" tabindex="0" :aria-label="bar.label + ': ' + currency(bar.value)" :data-tooltip="bar.label + ': ' + currency(bar.value)"><span><i :style="{ height: bar.percent + '%' }"><em v-if="bar.value" class="cost-bar-value">{{ compactCost(bar.value) }}</em></i></span><b>{{ bar.label }}</b></div></div>
          </div>
          <p v-else class="analysis-empty" role="status">Sin costos registrados en este periodo.</p>
        </article>
        <article class="card cost-composition-card" :class="{ 'chart-expanded': expandedChart === 'composition' }">
          <header><div><h2><SvgIcon name="reporte" />Composicion del costo</h2><p>Gasto desglosado en OT finalizadas</p></div><button v-if="activeCostCategoryCount" type="button" class="expand-chart-button" title="Ampliar grafico" @click="toggleExpandedChart('composition')"><SvgIcon :name="expandedChart === 'composition' ? 'close' : 'expand'" /></button></header>
          <div v-if="activeCostCategoryCount" class="cost-composition">
            <div v-if="activeCostCategoryCount > 1" class="cost-donut">
              <svg class="cost-donut-segments" viewBox="0 0 100 100" aria-label="Composicion del costo"><circle v-for="row in costComposition" :key="row.label" cx="50" cy="50" r="40" fill="none" :stroke="row.color" stroke-width="20" :stroke-dasharray="`${row.percent * Math.PI * 0.8} ${Math.PI * 80}`" :stroke-dashoffset="-row.offset * Math.PI * 0.8"><title>{{ row.label }}: {{ formatDecimalNumber(row.percent) }}% · {{ currency(row.value) }}</title></circle></svg>
              <span><strong>{{ currency(totalCompositionCost) }}</strong><small>Total desglosado</small></span>
            </div>
            <div v-else class="single-cost-summary"><strong>{{ currency(totalCompositionCost) }}</strong><span>{{ primaryCostCategory.label }}</span></div>
            <div class="cost-legend"><div v-for="row in nonzeroCostComposition" :key="row.label"><i :style="{ background: row.color }" /><span><b>{{ formatDecimalNumber(row.percent) }}%</b><strong>{{ row.label }}</strong><small>{{ currency(row.value) }}</small></span></div></div>
          </div>
          <p v-else class="analysis-empty" role="status">Sin desglose de costos registrado en este periodo.</p>
        </article>
      </div>
      <article class="card cost-ranking-card">
        <header><div><h2><SvgIcon name="reporte" />Activos con mayor costo</h2><p>{{ periodLabel }}</p></div><select v-if="costlyAssets.length" v-model="costRankingLimit" aria-label="Cantidad de activos del ranking"><option :value="5">Top 5</option><option :value="10">Top 10</option></select></header>
        <div class="cost-ranking-wrap"><table><thead><tr><th>#</th><th>Activo</th><th>Nombre</th><th>Costo registrado</th><th>OT finalizadas</th><th>Ultimo cierre</th></tr></thead><tbody>
          <tr v-for="(row, index) in costlyAssets" :key="row.id"><td>{{ index + 1 }}</td><td><strong>{{ row.plate }}</strong></td><td>{{ row.name }}</td><td><strong>{{ currency(row.cost) }}</strong></td><td>{{ row.orders }}</td><td>{{ row.lastMaintenance }}</td></tr>
          <tr v-if="!costlyAssets.length"><td colspan="6" class="analysis-ranking-empty">Sin costos registrados por activo en este periodo.</td></tr>
        </tbody></table></div>
      </article>
    </template>

    <article v-if="analysisSection === 'without-order'" class="card table-card pending-table-only">
      <header>
        <div class="pending-table-heading">
          <h2><SvgIcon class="pending-title-icon" name="maintenance-calendar" />Planes sin OT <span class="pending-title-count">{{ withoutOrder.length }}</span></h2>
        </div>
    <div class="filters pending-table-filters">
      <input v-model="query" placeholder="Buscar activo, patente o mantencion..." /><select
        v-model="type"
      >
        <option value="all">Todas las mantenciones</option>
        <option v-for="value in maintenanceTypes" :key="value">{{ value }}</option></select
      ><select v-model="asset">
        <option value="all">Todos los activos</option>
        <option v-for="item in maintenanceItems" :key="item.id" :value="item.id">
          {{ item.plate }}
        </option></select>
    </div>
        <nav class="pending-table-statuses" aria-label="Estado del plan">
          <button
            v-for="option in noOrderOptions"
            :key="option.value"
            :class="{ active: noOrder === option.value }"
            @click="noOrder = option.value"
          >
            {{ option.label }} <span>{{ noOrderFilterCount(option.value) }}</span>
          </button>
        </nav>
      </header>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Activo / Mantencion</th>
              <th>Criterio</th>
              <th>Lectura actual</th>
              <th>Proximo vencimiento</th>
              <th>Restante</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in noOrderRows" :key="item.id" :class="['pending-plan-row', item.status]">
              <td>
                <b>{{ item.plate }}</b>
                <span class="pending-plan-name">{{ item.nextJob }}</span>
              </td>
              <td>{{ criterion(item) }}</td>
              <td>{{ criterion(item) === 'Tiempo' ? '-' : item.actualLabel || '-' }}</td>
              <td>{{ pendingPlanDueLabel(item) }}</td>
              <td class="pending-plan-remaining">{{ maintenanceRemainingLabel(item) }}</td>
              <td>
                <span :class="['state', item.status]">{{
                  item.statusLabel || stateLabel(item.status)
                }}</span>
              </td>
              <td>
                <button
                  v-if="['due', 'overdue'].includes(item.status)"
                  title="Crear OT"
                  :class="{ 'pending-create-urgent': ['overdue', 'due'].includes(item.status) }"
                  @click="
                    emit('create-work-order', item.vehicleId || item.assetId, item.id, item.nextJob)
                  "
                >
                  Crear OT
                </button>
                <span v-else class="pending-plan-no-action">-</span>
              </td>
            </tr>
            <tr v-if="!noOrderRows.length"><td colspan="7" class="no-order-empty">No hay planes sin OT con los filtros seleccionados.</td></tr>
          </tbody>
        </table>
      </div>
      <footer>
        <span>Mostrando {{ noOrderPagination.start }}-{{ noOrderPagination.end }} de {{ noOrderPagination.total }} planes</span>
        <div v-if="filteredNoOrder.length > 10" class="no-order-pagination">
        <template v-if="noOrderPageCount > 1">
        <button type="button" title="Pagina anterior" aria-label="Pagina anterior" :disabled="noOrderPage === 1" @click="noOrderPage--"><SvgIcon name="chevron-left" /></button>
        <button v-for="page in noOrderPageButtons" :key="page" type="button" :class="{ active: noOrderPage === page }" :aria-label="`Pagina ${page}`" :aria-current="noOrderPage === page ? 'page' : undefined" @click="noOrderPage = page">{{ page }}</button>
        <button type="button" title="Pagina siguiente" aria-label="Pagina siguiente" :disabled="noOrderPage >= noOrderPageCount" @click="noOrderPage++"><SvgIcon name="chevron-right" /></button>
        </template>
        <select v-model="pageSize" aria-label="Planes por pagina">
          <option :value="10">10 por pagina</option>
          <option :value="25">25 por pagina</option>
          <option :value="50">50 por pagina</option>
        </select>
        </div>
      </footer>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, onActivated, onDeactivated, onBeforeUnmount, ref, watch } from "vue"

import SvgIcon from "../icons/SvgIcon.vue"
import MaintenanceAnalysisPreviewControl from './MaintenanceAnalysisPreviewControl.vue'
import { buildMaintenanceAnalysisDemo } from '../../utils/maintenance/maintenanceAnalysisDemo.js'
import { maintenanceDay } from '../../utils/maintenance/maintenanceHistoricalReading.js'
import { formatDecimalNumber } from "../../utils/maintenance/maintenanceFormatUtils.js"
import { buildFleetOrderIndex, findFleetOpenOrder } from "./fleetOrderIndex.js"
import { sortFleetPlansByPriority } from './fleetPlanPriority.js'
import { pendingPlanDueLabel } from '../../utils/maintenance/maintenancePendingPlanTable.js'
import { getWorkOrderPage } from './workOrderPagination.js'
import { aggregateMaintenanceAnalysisPeriod, buildMaintenanceAnalysisIndex, maintenanceAnalysisMonthKey, parseMaintenanceAnalysisDate, maintenanceAnalysisCostCeiling } from "../../utils/maintenance/maintenanceAnalysisData.js"
const props = defineProps({
  maintenanceItems: { type: Array, default: () => [] },
  maintenanceTypes: { type: Array, default: () => [] },
  getVehicleMaintenancePlans: { type: Function, default: () => [] },
  workOrders: { type: Array, default: () => [] },
  section: { type: String, default: "summary" },
  periodMonths: { type: Number, default: 6 },
})
const emit = defineEmits([
  "create-work-order",
  "filter-maintenance-status",
  "filter-maintenance-vehicle",
  "filter-work-orders",
  "open-export",
  "update:period-months",
])
const query = ref(""),
  type = ref("all"),
  asset = ref("all"),
  months = computed({
    get: () => props.periodMonths,
    set: (value) => emit("update:period-months", Number(value)),
  }),
  costRankingLimit = ref(5),
  expandedChart = ref(""),
  noOrder = ref("all"),
  pageSize = ref(10),
  noOrderPage = ref(1)
const analysisSection = computed(() => props.section)
const analysisNow = ref(new Date())
const canPreviewAnalysis = import.meta.env.DEV
const analysisDemoEnabled = ref(canPreviewAnalysis)
const analysisDemoActive = computed(() => canPreviewAnalysis && analysisSection.value === 'summary' && analysisDemoEnabled.value)
const analysisDemo = computed(() => analysisDemoActive.value ? buildMaintenanceAnalysisDemo(analysisNow.value) : null)
let analysisClock = null
const stopAnalysisClock = () => { clearInterval(analysisClock); analysisClock = null }
const startAnalysisClock = () => {
  stopAnalysisClock()
  analysisNow.value = new Date()
  analysisClock = setInterval(() => { analysisNow.value = new Date() }, 60000)
}
onMounted(startAnalysisClock)
onActivated(startAnalysisClock)
onDeactivated(stopAnalysisClock)
onBeforeUnmount(stopAnalysisClock)
const closeExpandedChart = () => {
  expandedChart.value = ""
}
onDeactivated(closeExpandedChart)
const toggleExpandedChart = (chart) => {
  if (expandedChart.value === chart) {
    closeExpandedChart()
    return
  }
  expandedChart.value = chart
}
const noOrderOptions = [
  { value: "all", label: "Todas" },
  { value: "due", label: "Proximas" },
  { value: "overdue", label: "Vencidas" },
]
const norm = (v) =>
    String(v || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""),
  currency = (v) => `$ ${Number(v || 0).toLocaleString("es-CL")}`,
  maintenanceRemainingLabel = (item) =>
    item.remainingLabel || item.summaryLabel || item.nextDueLabel || "Sin registro"
const visible = computed(() =>
  props.maintenanceItems.filter(
    (i) =>
      (!query.value ||
        norm(`${i.plate} ${i.assetName} ${i.nextJob}`).includes(norm(query.value))) &&
      (type.value === "all" || i.type === type.value || i.nextJob === type.value) &&
      (asset.value === "all" || i.id === asset.value),
  ),
)
const visiblePlans = computed(() =>
  (analysisSection.value === 'without-order' ? props.maintenanceItems : visible.value).flatMap((vehicle) =>
    props.getVehicleMaintenancePlans(vehicle).map((plan) => ({
      ...plan,
      assetId: vehicle.id,
      vehicleId: plan.vehicleId || vehicle.id,
      plate: plan.plate || vehicle.plate,
      assetName: vehicle.assetName,
      nextJob: plan.name || plan.nextJob || vehicle.nextJob,
      remainingLabel:
        plan.remainingLabel || plan.summaryLabel || vehicle.remainingLabel || vehicle.summaryLabel,
      readingSourceLabel: plan.readingSourceLabel || vehicle.readingSourceLabel,
    })),
  ).filter(plan => analysisSection.value !== 'without-order' || (
    (!query.value || norm(`${plan.plate} ${plan.assetName} ${plan.nextJob}`).includes(norm(query.value))) &&
    (type.value === 'all' || plan.nextJob === type.value || plan.type === type.value) &&
    (asset.value === 'all' || String(plan.vehicleId) === String(asset.value))
  )),
)
const analysisOrderIndex = computed(() => buildMaintenanceAnalysisIndex(analysisDemo.value?.orders || props.workOrders))
const compactCost = (value) => {
  const divisor = Math.abs(value) >= 1000000 ? 1000000 : Math.abs(value) >= 1000 ? 1000 : 1
  const suffix = divisor === 1000000 ? ' M' : divisor === 1000 ? ' mil' : ''
  return `$ ${Number(value / divisor).toLocaleString('es-CL', { maximumFractionDigits: divisor === 1 ? 0 : 2 })}${suffix}`
}
const monthlyCosts = computed(() => {
  const names = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ],
    now = parseMaintenanceAnalysisDate(maintenanceDay(analysisNow.value)),
    rows = Array.from({ length: months.value }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (months.value - index - 1), 1),
        value = periodAnalysis.value.monthlyCosts.get(maintenanceAnalysisMonthKey(date)) || 0
      return { label: names[date.getMonth()], value }
    }),
    max = maintenanceAnalysisCostCeiling(Math.max(...rows.map((r) => r.value), 0))
  return rows.map((r) => ({ ...r, percent: r.value / max * 100 }))
})
const costAxisTicks = computed(() => {
  const maximum = Math.max(...monthlyCosts.value.map((row) => row.value), 0)
  const ceiling = maintenanceAnalysisCostCeiling(maximum)
  return [ceiling, ceiling * 0.75, ceiling * 0.5, ceiling * 0.25, 0]
})
const monthlyCostComparison = computed(() => {
  const current = monthlyCosts.value.at(-1)?.value || 0
  const previous = monthlyCosts.value.at(-2)?.value || 0
  if (!previous && !current) return "Sin costos en el periodo."
  if (!previous) return "Primer mes con costos registrados."
  const variation = Math.round(((current - previous) / previous) * 100)
  return `${variation >= 0 ? "+" : ""}${variation}% del mes en curso respecto al mes anterior completo.`
})
const periodStart = computed(() => {
  const start = parseMaintenanceAnalysisDate(maintenanceDay(analysisNow.value))
  start.setMonth(start.getMonth() - months.value + 1, 1)
  return start
})
const periodAnalysis = computed(() =>
  aggregateMaintenanceAnalysisPeriod(analysisOrderIndex.value, periodStart.value, analysisNow.value),
)
const completedOrderStatistics = computed(() => periodAnalysis.value.statistics)
const completedOrderCount = computed(() => completedOrderStatistics.value.counts.get('finished') || 0)
const measurableOrderCount = computed(() => [...periodAnalysis.value.vehicles.values()].reduce((sum, row) => sum + row.measurable, 0))
const onTimeOrderCount = computed(() => [...periodAnalysis.value.vehicles.values()].reduce((sum, row) => sum + row.onTime, 0))
const periodLabel = computed(() => 'Ultimos ' + months.value + ' meses')
const hasMonthlyCosts = computed(() => monthlyCosts.value.some((row) => row.value > 0))
const costComposition = computed(() => {
  const composition = periodAnalysis.value.composition
  const rows = [
    {
      label: "Mano de obra",
      color: "#0b4cc1",
      value: composition.labor,
    },
    {
      label: "Repuestos",
      color: "#ff6b16",
      value: composition.parts,
    },
    {
      label: "Otros",
      color: "#aebbd0",
      value: composition.other,
    },
  ]
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  let offset = 0
  return rows.map((row) => {
    const percent = total ? row.value / total * 100 : 0
    const result = { ...row, percent, offset }
    offset += percent
    return result
  })
})
const nonzeroCostComposition = computed(() => costComposition.value.filter((row) => row.value > 0))
const totalCompositionCost = computed(() =>
  costComposition.value.reduce((sum, row) => sum + row.value, 0),
)
const costlyAssets = computed(() =>
  (analysisDemo.value?.vehicles || visible.value)
    .map((item) => {
      const summary = periodAnalysis.value.vehicles.get(String(item.id))
      return {
        id: item.id,
        plate: item.plate,
        name: item.assetName || item.vehicleType || "Vehiculo",
        cost: summary?.cost || 0,
        orders: summary?.orders || 0,
        lastMaintenance: summary?.lastClosed?.toLocaleDateString("es-CL") || "Sin registro",
        status: item.status,
      }
    })
    .filter((item) => item.orders && item.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, costRankingLimit.value),
)
const activeCostCategoryCount = computed(
  () => costComposition.value.filter((row) => row.value > 0).length,
)
const primaryCostCategory = computed(
  () => [...costComposition.value].sort((a, b) => b.value - a.value)[0],
)
const criterion = (i) => i.readingSourceLabel === 'Horometro'
  ? 'Horometro' : i.readingSourceLabel === 'Odometro' ? 'Odometro' : 'Tiempo'
const pendingOrderIndexOptions = {
  normalizeName: norm,
  planKey: (order) => String(order.maintenancePlanId),
}
const pendingOrderIndex = computed(() => buildFleetOrderIndex(props.workOrders, pendingOrderIndexOptions))
const hasOrder = (item) => Boolean(findFleetOpenOrder(
  pendingOrderIndex.value,
  item.vehicleId || item.assetId || item.id,
  item.id,
  item.nextJob,
  pendingOrderIndexOptions,
))
const withoutOrder = computed(() =>
    visiblePlans.value.filter((item) => ['due', 'overdue'].includes(item.status) && !hasOrder(item)),
  ),
  filteredNoOrder = computed(() =>
    sortFleetPlansByPriority(withoutOrder.value.filter((i) => noOrder.value === "all" || i.status === noOrder.value)),
  ),
  noOrderRows = computed(() => noOrderPagination.value.rows),
  noOrderFilterCount = (status) =>
    status === "all"
      ? withoutOrder.value.length
      : withoutOrder.value.filter((item) => item.status === status).length,
  stateLabel = (status) =>
    ({ overdue: "Vencida", due: "Próxima", current: "Al día", unconfigured: "Sin configurar" })[
      status
    ] || "Sin estado"
const noOrderPagination = computed(() => getWorkOrderPage(filteredNoOrder.value, noOrderPage.value, pageSize.value))
const noOrderPageCount = computed(() => noOrderPagination.value.pageCount)
const noOrderPageButtons = computed(() => {
  const count = Math.min(5, noOrderPageCount.value)
  const start = Math.max(1, Math.min(noOrderPage.value - 2, noOrderPageCount.value - count + 1))
  return Array.from({ length: count }, (_, index) => start + index)
})
watch([query, type, asset, noOrder, pageSize], () => { noOrderPage.value = 1 }, { flush: 'sync' })
watch(noOrderPageCount, (count) => { noOrderPage.value = Math.min(noOrderPage.value, count) }, { flush: 'sync' })
</script>

<style scoped>
.analysis-view.is-without-order { height: 100%; overflow: hidden; }
.analysis-view .pending-table-only { height: 100%; min-height: 0; overflow: hidden; }
.analysis-view .pending-table-only > header,
.analysis-view .pending-table-only > footer { flex-shrink: 0; }
.analysis-view .pending-table-only .table-wrap { min-height: 0; overflow: auto; }
.pending-table-only .table-wrap th { position: sticky; top: 0; z-index: 1; }
.pending-table-only > footer { background: #fff; border-top: 1px solid #e2e8f0; }
.analysis-view .pending-table-only > header { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; align-items: center; }
.pending-table-heading .pending-title-count { margin-left: 8px; padding: 2px 8px; background: #eef4ff; border-radius: 5px; color: #52658c; font-size: 12px; font-weight: 600; }
.pending-table-heading .pending-title-icon { width: 20px; height: 20px; flex: 0 0 20px; font-size: 20px; }
.pending-table-only .table-wrap td button:disabled { cursor: default; opacity: .5; }
.pending-table-only .pending-table-filters { grid-column: 1 / -1; order: initial; display: grid; width: 100%; grid-template-columns: minmax(200px, 1fr) 230px 210px; gap: 10px; }
.pending-table-only .pending-table-filters > * { min-width: 0; height: 40px; font-size: 12px; font-weight: 600; padding: 0 12px; }
.analysis-view .pending-table-only > header > .pending-table-statuses { grid-column: 1 / -1; justify-self: stretch; display: flex; flex-wrap: wrap; gap: 20px; margin: 0; border-bottom: 1px solid #d8e0eb; }
.analysis-view .pending-table-statuses button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 36px; padding: 6px 2px 10px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #52658c; font-size: 12px; font-weight: 600; }
.analysis-view .pending-table-statuses button.active { border-bottom-color: #ff6600; background: transparent; color: #102372; }
.analysis-view .pending-table-statuses button span,
.analysis-view .pending-table-statuses button.active span { min-width: 22px; margin: 0; padding: 2px 6px; border-radius: 5px; background: #eef3fa; color: #52658c; font-size: 11px; }
.analysis-view .pending-table-statuses button.active span { background: #102372; color: #fff; }
.pending-table-statuses button:focus-visible { outline: 2px solid #086cff; outline-offset: 2px; }
.pending-table-only .table-wrap table { min-width: 900px; }
.pending-table-only .table-wrap th { padding: 12px 10px; }
.pending-table-only .table-wrap td { padding: 10px; font-size: 12px; }
.pending-table-only .table-wrap td:first-child { width: 23%; border-left: 3px solid transparent; }
.pending-table-only .table-wrap td:first-child b { font-size: 14px; }
.pending-plan-name { display: block; margin-top: 3px; color: #345284; font-size: 12px; }
.pending-plan-no-action { color: #94a3b8; }
.pending-plan-row.due .pending-plan-remaining { color: #b55500; font-weight: 700; }
.pending-plan-row.overdue .pending-plan-remaining { color: #bd2937; font-weight: 700; }
.pending-table-only .table-wrap td button { min-width: 90px; white-space: nowrap; padding: 8px 12px; color: #fff; border-color: #102372; background: #102372; border-radius: 5px; }
@media (max-width: 1100px) {
  .pending-table-only .pending-table-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pending-table-filters > input { grid-column: 1 / -1; }
}
@media (max-width: 600px) {
  .pending-table-only > header > nav { justify-self: stretch; display: flex; flex-wrap: wrap; }
}
.no-order-pagination { display: flex; align-items: center; gap: 10px; }
.no-order-pagination button { display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid #cfd8e6; border-radius: 5px; }
.no-order-pagination button:disabled { opacity: .4; cursor: not-allowed; }
.no-order-pagination button.active { background: #102372; color: #fff; border-color: #102372; }
.no-order-pagination svg { width: 16px; height: 16px; }
.no-order-empty { text-align: center; padding: 32px !important; color: #52658c; }
.order-period-results { order: 2; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding: 14px 0; border-top: 1px solid #d8e0eb; border-bottom: 1px solid #d8e0eb; }
.order-period-results dt { color: #52658c; font-size: 12px; }
.order-period-results dd { margin: 6px 0 0; color: #102372; font-size: 18px; font-weight: 700; }
@media (max-width: 640px) { .order-period-results { grid-template-columns: 1fr; } }
.analysis-view {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  height: auto;
  min-height: 0;
  overflow: visible;
  color: #102372;
  font-size: 14px;
}
.analysis-view.is-summary {
  grid-template-rows: auto auto auto;
  align-content: start;
}
.analysis-view.is-without-order {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto;
  align-content: start;
}
.filters {
  order: 1;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) 210px 190px 165px 100px;
  gap: 12px;
}
.filters > *,
.card select {
  height: 46px;
  border: 1px solid #cfd8e6;
  border-radius: 5px;
  background: #fff;
  padding: 0 14px;
  color: #102372;
  font-size: 14px;
  font-weight: 800;
}
.filters > button {
  border-color: #102372;
  background: #102372;
  color: #fff;
}
.analysis-sections {
  display: none !important;
  order: 1;
  align-items: center;
  gap: 24px;
  min-height: 32px;
  border-bottom: 1px solid #d8e0eb;
  padding: 0 4px;
}
.kpis {
  order: 2;
}
.primary {
  order: 3;
}
.secondary {
  order: 4;
}
.cost-ranking-card {
  order: 5;
}
.no-order-insights {
  order: 3;
}
.table-card {
  order: 4;
}
.analysis-sections button {
  position: relative;
  height: 32px;
  border: 0;
  background: transparent;
  color: #536783;
  font-size: 12px;
  font-weight: 900;
}
.analysis-sections button.active {
  color: #102372;
}
.analysis-sections button.active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: #ff6600;
  content: "";
}
.analysis-sections button span {
  display: inline-grid;
  min-width: 20px;
  height: 20px;
  place-items: center;
  margin-left: 6px;
  border-radius: 10px;
  background: #eef3fb;
  color: #102372;
  font-size: 10px;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
}
.is-summary .kpis {
  grid-template-columns: repeat(4, minmax(190px, 1fr));
}
.kpis article,
.card {
  border: 1px solid #d8e0eb;
  border-radius: 7px;
  background: #fff;
}
.kpis article {
  min-height: 96px;
  padding: 13px 20px;
}
.kpis article.kpi-filter-card {
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
  cursor: pointer;
}
.kpis article.kpi-filter-card:hover,
.kpis article.kpi-filter-card:focus-visible {
  border-color: #93b4e8;
  outline: none;
  box-shadow: 0 5px 14px rgb(15 35 114 / 9%);
  transform: translateY(-1px);
}
.kpis article.kpi-filter-card.active {
  border-color: #1677ff;
  box-shadow: inset 0 -3px 0 #1677ff;
}
.kpis article:first-child {
  position: relative;
}
.kpis .trend {
  position: absolute;
  top: 39px;
  left: 88px;
  color: #079669;
  font-size: 15px;
  font-weight: 900;
}
.kpis small,
.kpis span {
  display: block;
  color: #536783;
  font-size: 13px;
  font-weight: 700;
}
.kpis strong {
  display: block;
  margin: 3px 0;
  font-size: 28px;
}
.kpis article div {
  display: grid;
  grid-template-columns: 44px 1fr;
  align-items: center;
  gap: 10px;
}
.kpis i {
  height: 12px;
  background: #e5eaf2;
}
.kpis em {
  display: block;
  height: 100%;
  background: #079669;
}
.kpis .orange {
  color: #ff6600;
}
.kpis .orange em {
  background: #ff6600;
}
.kpis .blue {
  color: #1767d3;
}
.kpis .blue em {
  background: #1767d3;
}
.kpis .red {
  color: #ef233c;
}
.kpis .red em {
  background: #ef233c;
}
.kpis .gray {
  color: #64748b;
}
.kpis .gray em {
  background: #94a3b8;
}
.primary {
  display: grid;
  grid-template-columns: minmax(460px, 1fr) minmax(560px, 1fr);
  gap: 14px;
}
.primary > .card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: visible;
  padding: 16px;
}
.primary > .card > header {
  flex-shrink: 0;
  min-height: 48px;
}
.chart-tooltip {
  position: relative;
  cursor: help;
}
.chart-filter-target {
  cursor: pointer;
  border-radius: 4px;
  outline: none;
}
.chart-filter-target:hover,
.chart-filter-target:focus-visible {
  background-color: #f3f7fd;
  box-shadow: 0 0 0 2px rgb(16 35 114 / 12%);
}
.chart-tooltip::after {
  position: absolute;
  z-index: 50;
  left: 50%;
  pointer-events: none;
  opacity: 0;
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}
.chart-tooltip::after {
  bottom: calc(100% + 8px);
  width: max-content;
  max-width: 240px;
  transform: translate(-50%, 4px);
  border-radius: 5px;
  background: #15243a;
  padding: 7px 9px;
  color: #fff;
  content: attr(data-tooltip);
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
  white-space: normal;
  box-shadow: 0 6px 18px rgb(15 23 42 / 24%);
}
.chart-tooltip:hover::after,
.chart-tooltip:focus-visible::after {
  transform: translate(-50%, 0);
  opacity: 1;
}
.secondary {
  display: grid;
  grid-template-columns: 1.08fr 1fr 1.08fr;
  gap: 14px;
}
.cost-ranking-card {
  min-height: 190px;
  padding: 12px 16px;
}
.cost-ranking-card header {
  align-items: center;
}
.cost-ranking-card header select {
  width: 96px;
}
.cost-ranking-wrap {
  margin-top: 8px;
  overflow-x: auto;
}
.cost-ranking-wrap table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
  font-size: 11px;
}
.cost-ranking-wrap th {
  background: #f2f5f9;
  padding: 6px 10px;
  color: #345284;
  text-align: left;
}
.cost-ranking-wrap td {
  border-bottom: 1px solid #e2e8f0;
  padding: 5px 10px;
}
.cost-ranking-wrap .state {
  display: inline-block;
  min-width: 62px;
  padding: 3px 8px;
  text-align: center;
}
.secondary > .card {
  height: 100%;
  min-height: 0;
  padding: 16px;
}
.summary-bars {
  display: grid;
  align-content: center;
  gap: 12px;
  height: calc(100% - 54px);
  margin-top: 8px;
}
.chart-empty-state {
  display: grid;
  min-height: 130px;
  place-items: center;
  color: #607394;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
.summary-bars > div {
  display: grid;
  grid-template-columns: 76px 1fr 38px;
  align-items: center;
  gap: 9px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
}
.summary-bars i {
  height: 25px;
  overflow: hidden;
  background: #e8edf4;
}
.summary-bars em {
  display: block;
  height: 100%;
  background: #2977df;
}
.compliance-bars em.good {
  background: #0aa778;
}
.compliance-bars em.warning {
  background: #ff8a2a;
}
.compliance-bars em.critical {
  background: #ff3d32;
}
.compliance-bars em.neutral,
.projection-chart em.neutral,
.projection-chart i.neutral {
  background: #94a3b8;
}
.summary-bars > div > b small {
  display: block;
  margin-top: 2px;
  color: #607394;
  font-size: 9px;
  font-weight: 700;
}
.cost-composition {
  display: grid;
  height: calc(100% - 54px);
  grid-template-columns: minmax(130px, 0.9fr) minmax(165px, 1.1fr);
  align-items: center;
  gap: 22px;
}
.cost-donut {
  display: grid;
  width: min(175px, 100%);
  aspect-ratio: 1;
  place-items: center;
  justify-self: center;
  border-radius: 50%;
}
.cost-donut-segments {
  width: 100%;
  height: 100%;
  grid-area: 1 / 1;
}
.cost-donut-segments circle {
  transform: rotate(-90deg);
  transform-box: view-box;
  transform-origin: 50px 50px;
  cursor: help;
}
.cost-donut > span {
  z-index: 1;
  display: grid;
  grid-area: 1 / 1;
  place-self: center;
  pointer-events: none;
  text-align: center;
}
.cost-donut strong {
  font-size: 14px;
  line-height: 1.35;
}
.cost-donut small {
  color: #526b94;
  font-size: 10px;
  font-weight: 800;
}
.single-cost-summary {
  display: grid;
  min-height: 145px;
  place-content: center;
  justify-items: center;
  border: 1px solid #d8e0eb;
  background: #f7f9fc;
  padding: 16px;
  text-align: center;
}
.single-cost-summary strong {
  color: #102372;
  font-size: 20px;
}
.single-cost-summary span {
  margin-top: 5px;
  font-size: 12px;
  font-weight: 900;
}
.single-cost-summary small {
  margin-top: 3px;
  color: #607394;
  font-size: 9px;
}
.cost-legend {
  display: grid;
  gap: 14px;
}
.cost-legend > div {
  display: grid;
  grid-template-columns: 12px 1fr;
  align-items: start;
  gap: 10px;
}
.cost-legend > div > i {
  width: 12px;
  height: 12px;
  margin-top: 3px;
  border-radius: 50%;
}
.cost-legend span {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  column-gap: 8px;
  row-gap: 3px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.35;
}
.cost-percent-tooltip {
  width: fit-content;
  cursor: help;
}
.cost-legend small {
  grid-column: 2;
  color: #526b94;
  font-size: 10px;
  line-height: 1.35;
}
.cost-legend span > strong {
  min-width: 0;
  overflow: hidden;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.no-order-insights {
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  gap: 14px;
}
.no-order-insights > .card {
  height: 100%;
  min-height: 0;
  padding: 16px;
}
.urgency-chart {
  display: grid;
  height: calc(100% - 52px);
  grid-template-columns: minmax(140px, 0.8fr) minmax(210px, 1.2fr);
  align-items: center;
  gap: 24px;
}
.urgency-donut {
  display: grid;
  width: min(170px, 100%);
  aspect-ratio: 1;
  place-items: center;
  justify-self: center;
  border-radius: 50%;
}
.urgency-donut::before {
  width: 60%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #fff;
  content: "";
  grid-area: 1 / 1;
}
.urgency-donut > span {
  z-index: 1;
  display: grid;
  grid-area: 1 / 1;
  text-align: center;
}
.urgency-donut strong {
  font-size: 25px;
}
.urgency-donut small {
  font-size: 12px;
  font-weight: 800;
}
.urgency-legend {
  display: grid;
  gap: 14px;
}
.urgency-legend > div {
  display: grid;
  grid-template-columns: 14px 1fr 24px 40px;
  align-items: center;
  gap: 9px;
  font-size: 13px;
}
.urgency-legend i {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}
.urgency-legend b,
.urgency-legend small {
  font-weight: 900;
  text-align: right;
}
.urgency-legend small {
  color: #526b94;
}
.type-chart {
  display: grid;
  min-height: 0;
  align-content: start;
  gap: 7px;
  height: calc(100% - 52px);
  margin-top: 6px;
  overflow-y: auto;
  padding: 6px 6px 10px 0;
  scrollbar-color: #94a3b8 transparent;
  scrollbar-width: thin;
}
.type-chart::-webkit-scrollbar {
  width: 6px;
}
.type-chart::-webkit-scrollbar-thumb {
  border-radius: 6px;
  background: #94a3b8;
}
.type-chart > div {
  display: grid;
  grid-template-columns: minmax(130px, 160px) 1fr 28px;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  font-weight: 800;
}
.type-chart > div > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.type-chart i {
  height: 25px;
  overflow: hidden;
  background: repeating-linear-gradient(
    to right,
    #edf2f8 0,
    #edf2f8 calc(25% - 1px),
    #d8e0eb calc(25% - 1px),
    #d8e0eb 25%
  );
}
.type-chart em {
  display: block;
  height: 100%;
  background: #2779e8;
}
.insight-bars {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}
.insight-bars > div {
  display: grid;
  grid-template-columns: minmax(100px, 150px) 1fr 28px;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  font-weight: 800;
}
.insight-bars > div > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.insight-bars i {
  height: 22px;
  overflow: hidden;
  background: #e5eaf2;
}
.insight-bars em {
  display: block;
  height: 100%;
  background: #3478d4;
}
.urgency-bars em.overdue {
  background: #ef4444;
}
.urgency-bars em.due {
  background: #ff7627;
}
.urgency-bars em.current {
  background: #0a9b75;
}
.urgency-bars em.unconfigured {
  background: #94a3b8;
}
.card {
  padding: 16px;
}
.chart-expand-backdrop {
  position: fixed;
  z-index: 100;
  inset: 0;
  background: rgb(15 29 48 / 58%);
  backdrop-filter: blur(2px);
}
.analysis-view .card.chart-expanded {
  position: fixed;
  z-index: 101;
  inset: 6vh 6vw;
  width: auto;
  height: auto !important;
  max-height: 88vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-shadow: 0 24px 70px rgb(15 29 48 / 28%);
}
.chart-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.expand-chart-button {
  display: inline-grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border: 1px solid #cfd8e6;
  border-radius: 5px;
  background: #fff;
  color: #102372;
}
.expand-chart-button:hover {
  border-color: #1767d3;
  background: #eef4ff;
}
.expand-chart-button :deep(svg) {
  width: 17px;
  height: 17px;
}
.chart-expanded .usage {
  flex: 1;
  align-content: center;
  gap: 14px;
  margin-top: 20px;
}
.chart-expanded .usage div {
  grid-template-columns: 130px minmax(300px, 1fr) 190px;
  gap: 18px;
  font-size: 16px;
}
.chart-expanded .usage span {
  height: 38px;
}
.chart-expanded .summary-bars,
.chart-expanded .type-chart,
.chart-expanded .urgency-chart,
.chart-expanded .cost-composition {
  min-height: 60vh;
}
.chart-expanded > header {
  flex: 0 0 auto;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}
.chart-expanded h2 {
  font-size: 22px;
}
.chart-expanded header p,
.chart-expanded .chart-note {
  font-size: 14px;
}
.chart-expanded .summary-bars {
  flex: 1;
  align-content: center;
  gap: 18px;
  height: auto;
}
.chart-expanded .summary-bars > div {
  grid-template-columns: 130px minmax(300px, 1fr) 60px;
  gap: 18px;
  font-size: 15px;
}
.chart-expanded .summary-bars i {
  height: 40px;
}
.chart-expanded .type-chart {
  flex: 1;
  align-content: center;
  height: auto;
  gap: 14px;
  overflow: visible;
  padding: 20px 0;
}
.chart-expanded .type-chart > div {
  grid-template-columns: minmax(180px, 240px) minmax(360px, 1fr) 50px;
  gap: 18px;
  font-size: 15px;
}
.chart-expanded .type-chart i {
  height: 42px;
}
.chart-expanded .urgency-chart {
  flex: 1;
  height: auto;
  grid-template-columns: minmax(300px, 0.9fr) minmax(380px, 1.1fr);
  gap: 48px;
}
.chart-expanded .urgency-donut {
  width: min(330px, 32vw);
}
.chart-expanded .urgency-donut strong {
  font-size: 36px;
}
.chart-expanded .urgency-legend {
  gap: 22px;
}
.chart-expanded .urgency-legend > div {
  grid-template-columns: 18px 1fr 44px 58px;
  gap: 14px;
  font-size: 16px;
}
.chart-expanded .urgency-legend i {
  width: 18px;
  height: 18px;
}
.chart-expanded .cost-composition {
  flex: 1;
  height: auto;
  grid-template-columns: minmax(320px, 0.9fr) minmax(340px, 1.1fr);
  gap: 50px;
}
.chart-expanded .cost-donut {
  width: min(350px, 34vw);
}
.chart-expanded .cost-donut strong {
  font-size: 24px;
}
.chart-expanded .cost-legend {
  gap: 24px;
}
.chart-expanded .cost-legend > div {
  grid-template-columns: 18px 1fr;
  gap: 14px;
}
.chart-expanded .cost-legend > div > i {
  width: 18px;
  height: 18px;
}
.chart-expanded .cost-legend span {
  grid-template-columns: 60px minmax(0, 1fr);
  column-gap: 14px;
  font-size: 16px;
}
.chart-expanded .cost-legend small {
  font-size: 14px;
}
.chart-expanded .cost-chart {
  flex: 1;
  height: auto;
  min-height: 65vh;
  grid-template-columns: 100px 1fr;
}
.chart-expanded .cost-axis,
.chart-expanded .cost-plot > div {
  font-size: 13px;
}
.card select {
  height: 38px;
}
.card header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.card h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.25;
}
.card h2 svg {
  width: 22px;
  height: 22px;
  color: #1767d3;
}
.card p,
.card header p {
  margin: 3px 0;
  color: #607394;
  font-size: 13px;
  line-height: 1.4;
}
.card nav {
  display: flex;
}
.card nav button {
  height: 38px;
  border: 1px solid #cfd8e6;
  background: #fff;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 900;
}
.card nav button.active {
  background: #102372;
  color: #fff;
}
.usage {
  display: grid;
  align-content: start;
  gap: 8px;
  height: auto;
  margin-top: 12px;
}
.chart-note {
  margin: 6px 0 8px !important;
}
.usage div {
  display: grid;
  grid-template-columns: 96px 1fr 150px;
  align-items: center;
  gap: 10px;
  min-height: 33px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.3;
}
.projection-chart div > strong,
.projection-chart div > b {
  display: grid;
  gap: 2px;
}
.projection-chart div > strong small,
.projection-chart div > b small {
  overflow: hidden;
  color: #607394;
  font-size: 9px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.projection-chart i.good {
  background: #0aa778;
}
.projection-chart i.warning {
  background: #ff8a2a;
}
.projection-chart i.critical {
  background: #ef233c;
}
.usage span {
  height: 22px;
  background: #edf1f6;
}
.usage i {
  display: block;
  height: 100%;
  background: #3478d4;
}
.cost-chart {
  display: grid;
  grid-template-columns: 72px 1fr;
  height: auto;
  min-height: 0;
  flex: 1;
  margin-top: 8px;
}
.cost-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 25px;
  color: #345284;
  font-size: 11px;
  text-align: right;
}
.cost-axis span {
  line-height: 0;
  padding-right: 8px;
}
.cost-plot {
  position: relative;
  display: flex;
  height: 100%;
  align-items: flex-end;
  justify-content: space-around;
}
.cost-plot::before {
  content: '';
  position: absolute;
  inset: 0 0 25px;
  pointer-events: none;
  border-bottom: 1px solid #9fb0c7;
  background: repeating-linear-gradient(
    to bottom,
    #dce4ef 0,
    #dce4ef 1px,
    transparent 1px,
    transparent 25%
  );
}
.cost-plot > div {
  display: grid;
  width: 13%;
  height: 100%;
  grid-template-rows: 1fr 25px;
  align-items: end;
  color: #345284;
  font-size: 12px;
  text-align: center;
}
.cost-plot > div > span {
  display: flex;
  height: 100%;
  align-items: flex-end;
  justify-content: center;
}
.cost-plot i {
  width: 76%;
  min-height: 0;
  background: #ff7627;
}
.due-list {
  display: grid;
  min-height: 0;
  height: calc(100% - 34px);
  place-content: center;
  gap: 8px;
}
.due-empty {
  display: grid !important;
  grid-template-columns: 1fr !important;
  justify-items: center;
  gap: 8px !important;
  color: #345284;
}
.due-empty svg {
  width: 52px;
  height: 52px;
  border-radius: 7px;
  background: #eef3fb;
  padding: 8px;
}
.due-list div {
  display: grid;
  grid-template-columns: 60px 1fr auto;
  gap: 8px;
  font-size: 10px;
}
.coverage {
  display: grid;
  gap: 8px;
  margin-top: 7px;
}
.coverage > div {
  display: grid;
  grid-template-columns: 112px 1fr;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  font-weight: 800;
}
.coverage > div > i {
  position: relative;
  height: 38px;
  background: #e5eaf2;
}
.coverage em {
  display: block;
  height: 100%;
  background: #0a9b75;
}
.coverage b {
  position: absolute;
  left: 8px;
  top: 11px;
}
.legend {
  text-align: center;
  margin-top: 7px;
  color: #0a9b75;
  font-size: 11px;
}
.legend span {
  color: #aab5c4;
}
.criteria {
  display: flex;
  height: 46px;
  margin-top: 10px;
}
.criteria span {
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 16px;
  font-weight: 900;
}
.criteria-list {
  display: grid;
  gap: 4px;
  margin-top: 7px;
}
.criteria-list div {
  display: flex;
  justify-content: space-between;
  border: 1px solid #e2e8f0;
  padding: 9px;
  font-size: 12px;
  font-weight: 700;
}
.table-card header nav {
  margin-left: auto;
}
.table-card header nav button span {
  min-width: 22px;
  margin-left: 5px;
  border-radius: 12px;
  background: #edf2f8;
  padding: 2px 6px;
  color: #526b94;
}
.table-card header nav button.active span {
  background: rgb(255 255 255 / 18%);
  color: #fff;
}
.table-card {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 16px;
}
.table-card .table-wrap {
  min-height: 0;
  flex: 1;
}
.table-wrap {
  margin-top: 10px;
  overflow: auto;
}
.table-wrap table {
  width: 100%;
  min-width: 1000px;
  border-collapse: collapse;
  font-size: 11px;
}
.table-wrap th {
  background: #f2f5f9;
  padding: 7px;
  text-align: left;
  color: #233b6b;
  font-weight: 900;
}
.table-wrap td {
  border-top: 1px solid #e2e8f0;
  padding: 7px;
}
.table-wrap td button {
  border: 1px solid #cfd8e6;
  border-radius: 4px;
  padding: 4px 10px;
  font-weight: 900;
}
.state {
  border-radius: 4px;
  padding: 4px 10px;
  font-weight: 900;
}
.state.overdue {
  background: #fee2e2;
  color: #dc2626;
}
.state.upcoming {
  background: #ffedd5;
  color: #d85a00;
}
.state.due {
  background: #ffedd5;
  color: #d85a00;
}
.state.on-track {
  background: #dff6eb;
  color: #07845e;
}
.state.current {
  background: #dff6eb;
  color: #07845e;
}
.state.unconfigured {
  background: #e2e8f0;
  color: #475569;
}
.table-card > footer {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #607394;
  font-size: 10px;
}
.table-card > footer select {
  height: 28px;
  border: 1px solid #cfd8e6;
}
@media (max-width: 1100px) {
  .analysis-view {
    height: auto;
    overflow: visible;
  }
  .analysis-view.is-summary,
  .analysis-view.is-without-order {
    grid-template-rows: auto;
  }
  .filters,
  .kpis {
    grid-template-columns: 1fr 1fr;
  }
  .is-summary .kpis {
    grid-template-columns: 1fr 1fr;
  }
  .primary,
  .secondary,
  .no-order-insights {
    grid-template-columns: 1fr;
  }
  .usage {
    height: auto;
    min-height: 220px;
  }
  .cost-chart {
    height: 280px;
    flex: 0 0 280px;
  }
  .table-card,
  .table-card .table-wrap {
    min-height: auto;
  }
  .analysis-view .card.chart-expanded {
    inset: 3vh 3vw;
    max-height: 94vh;
  }
  .chart-expanded .usage div,
  .chart-expanded .summary-bars > div,
  .chart-expanded .type-chart > div {
    grid-template-columns: 110px minmax(180px, 1fr) 90px;
  }
  .chart-expanded .urgency-chart,
  .chart-expanded .cost-composition {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .chart-expanded .urgency-donut,
  .chart-expanded .cost-donut {
    width: min(260px, 70vw);
  }
}
@media (max-width: 650px) {
  .filters,
  .kpis {
    grid-template-columns: 1fr;
  }
  .is-summary .kpis {
    grid-template-columns: 1fr;
  }
}
.analysis-metrics { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: repeat(3, minmax(0, 1fr)); gap: 12px; min-height: 350px; min-width: 0; margin: 0; }
.analysis-metrics > div { display: flex; flex-direction: column; justify-content: center; gap: 6px; min-width: 0; padding: 12px 14px; border: 1px solid #d8e0eb; border-radius: 7px; background: #fff; }
.analysis-metrics dt { margin: 0; color: #52658c; font-size: 13px; line-height: 1.35; }
.analysis-metrics dd { margin: 0; font-size: 26px; line-height: 1.2; font-weight: 700; color: #102372; overflow-wrap: anywhere; }
.analysis-metrics small { display: block; color: #63748e; font-size: 12px; line-height: 1.35; overflow-wrap: anywhere; }
.analysis-summary-grid { display: grid; grid-template-columns: minmax(210px, 0.65fr) minmax(0, 1.45fr) minmax(0, 1.15fr); gap: 14px; }
.analysis-summary-grid > .card { display: flex; flex-direction: column; min-width: 0; min-height: 350px; height: 100%; padding: 18px; }
.analysis-summary-grid > .card > header { flex-shrink: 0; margin-bottom: 12px; padding-bottom: 16px; border-bottom: 1px solid #edf0f5; align-items: flex-start; }
.analysis-summary-grid > .card h2 { font-size: 18px; font-weight: 700; }
.analysis-summary-grid > .card header p { margin-top: 7px; font-size: 12px; color: #63748e; }
.analysis-summary-grid .expand-chart-button { width: 30px; height: 30px; padding: 6px; border-color: transparent; background: #f2f5f9; }
.analysis-summary-grid .cost-composition { height: auto; flex: 1; min-width: 0; }
.analysis-summary-grid .single-cost-summary { border: 0; background: transparent; }
.analysis-monthly-card { container-type: inline-size; }
.analysis-summary-grid .cost-chart { margin-top: 22px; grid-template-columns: 62px minmax(0, 1fr); }
.analysis-summary-grid .cost-axis { color: #63748e; }
.analysis-summary-grid .cost-plot > div { width: 100%; min-width: 0; }
.analysis-summary-grid .cost-plot i { position: relative; display: block; width: 66%; max-width: 64px; border-radius: 5px 5px 0 0; background: #ff7627; transition: background 150ms ease; }
.analysis-summary-grid .cost-plot::before { border-bottom-color: #d8e0eb; background: repeating-linear-gradient(to bottom, #edf0f5 0, #edf0f5 1px, transparent 1px, transparent 25%); }
.analysis-summary-grid .cost-plot .is-current-month i { background: #102372; }
.analysis-summary-grid .cost-plot .is-current-month > b { color: #102372; font-weight: 700; }
.analysis-summary-grid .cost-plot .is-current-month:hover i,
.analysis-summary-grid .cost-plot .is-current-month:focus-visible i { background: #1767d3; }
.cost-bar-value { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 11px; font-style: normal; font-weight: 700; line-height: 1.2; color: #233b6b; }
.analysis-summary-grid .cost-plot > div:hover i,
.analysis-summary-grid .cost-plot > div:focus-visible i { background: #d85a00; }
.cost-plot > div:focus-visible { outline: 2px solid #1767d3; outline-offset: 2px; border-radius: 3px; }
.analysis-summary-grid .cost-plot > div > b { align-self: center; font-weight: 500; }
.analysis-summary-grid .cost-composition { grid-template-columns: minmax(170px, 1fr) minmax(180px, 1fr); gap: 24px; }
.analysis-summary-grid .cost-donut { width: min(190px, 100%); }
.analysis-summary-grid .cost-donut strong { font-size: 15px; font-variant-numeric: tabular-nums; }
.analysis-summary-grid .cost-donut small { margin-top: 4px; font-size: 11px; font-weight: 500; }
.analysis-summary-grid .cost-legend { gap: 0; }
.analysis-summary-grid .cost-legend > div { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
.analysis-summary-grid .cost-legend > div:last-child { border-bottom: 0; }
.analysis-summary-grid .cost-legend span { grid-template-columns: minmax(0, 1fr) auto; gap: 6px 12px; font-size: 13px; font-weight: 600; }
.analysis-summary-grid .cost-legend span > b { grid-column: 2; grid-row: 1; align-self: start; padding: 3px 6px; border-radius: 4px; background: #f2f5f9; color: #52658c; font-size: 12px; font-weight: 600; }
.analysis-summary-grid .cost-legend span > strong { grid-column: 1; grid-row: 1; white-space: normal; overflow: visible; font-weight: 600; }
.analysis-summary-grid .cost-legend small { grid-column: 1 / -1; font-size: 14px; font-weight: 600; color: #233b6b; font-variant-numeric: tabular-nums; }
@container (max-width: 540px) {
  .cost-plot.is-dense .cost-bar-value { display: none; }
  .cost-bar-value { font-size: 10px; }
}
@container (max-width: 400px) {
  .cost-bar-value { display: none; }
}
.analysis-empty { display: grid; flex: 1; place-content: center; margin: 0 !important; padding: 24px; text-align: center; color: #63748e; font-size: 13px; }
.analysis-ranking-empty { padding: 28px 12px !important; text-align: center; color: #63748e; }
.analysis-summary-grid > .card.chart-expanded { height: auto; }
.analysis-summary-grid.is-empty > .card { min-height: 360px; }
.is-summary .cost-ranking-card { min-height: 0; }
@media (max-width: 1100px) {
  .analysis-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .analysis-metrics { grid-column: 1 / -1; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: auto; min-height: 0; height: auto; }
}
@media (max-width: 900px) {
  .analysis-summary-grid { grid-template-columns: minmax(0, 1fr); }
  .analysis-summary-grid > .card { height: auto; min-height: 320px; }
  .analysis-summary-grid .cost-chart { flex: 0 0 240px; height: 240px; }
}
@media (max-width: 600px) {
  .analysis-metrics { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .analysis-metrics dd { font-size: 22px; }
  .analysis-summary-grid .cost-composition { grid-template-columns: minmax(0, 1fr); gap: 16px; padding-top: 12px; }
  .analysis-summary-grid .cost-legend { width: 100%; }
}
</style>
