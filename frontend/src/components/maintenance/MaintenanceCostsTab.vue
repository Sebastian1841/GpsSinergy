<template>
  <section
    class="analysis-view"
    :class="analysisSection === 'summary' ? 'is-summary' : 'is-without-order'"
  >
    <div v-if="expandedChart" class="chart-expand-backdrop" @click="closeExpandedChart" />
    <div v-if="analysisSection === 'without-order'" class="filters">
      <input v-model="query" placeholder="Buscar activo, patente o mantencion..." /><select
        v-model="type"
      >
        <option value="all">Todas las mantenciones</option>
        <option v-for="value in maintenanceTypes" :key="value">{{ value }}</option></select
      ><select v-model="asset">
        <option value="all">Todos los activos</option>
        <option v-for="item in maintenanceItems" :key="item.id" :value="item.id">
          {{ item.plate }}
        </option></select
      ><select v-model="noOrderPeriod">
        <option :value="30">Próximos 30 días</option>
        <option :value="60">Próximos 60 días</option>
        <option :value="90">Próximos 90 días</option>
        <option :value="365">Próximo año</option></select
      ><button @click="emit('open-export')">Exportar</button>
    </div>

    <div v-if="analysisSection === 'without-order'" class="kpis no-order-kpis">
      <article
        class="kpi-filter-card"
        role="button"
        tabindex="0"
        @click="noOrder = 'all'"
        @keydown.enter="noOrder = 'all'"
      >
        <small>Total sin OT</small><strong>{{ withoutOrder.length }}</strong>
      </article>
      <article
        v-for="kpi in noOrderKpis"
        :key="kpi.status"
        class="kpi-filter-card"
        role="button"
        tabindex="0"
        :class="{ active: noOrder === kpi.status }"
        @click="noOrder = kpi.status"
        @keydown.enter="noOrder = kpi.status"
      >
        <small>{{ kpi.label }}</small
        ><strong>{{ kpi.count }}</strong>
        <div :class="kpi.className">
          <b>{{ kpi.percent }}%</b><i><em :style="{ width: `${kpi.percent}%` }" /></i>
        </div>
      </article>
    </div>

    <div v-if="analysisSection === 'summary'" class="kpis">
      <article
        class="kpi-filter-card"
        role="button"
        tabindex="0"
        @click="emit('filter-maintenance-status', 'all')"
        @keydown.enter="emit('filter-maintenance-status', 'all')"
      >
        <small>Vehiculos monitoreados</small><strong>{{ visible.length }}</strong
        ><span>100% de la seleccion</span>
      </article>
      <article
        v-for="kpi in summaryStatusKpis"
        :key="kpi.label"
        class="kpi-filter-card"
        role="button"
        tabindex="0"
        @click="emit('filter-maintenance-status', kpi.status)"
        @keydown.enter="emit('filter-maintenance-status', kpi.status)"
      >
        <small>{{ kpi.label }}</small
        ><strong>{{ kpi.count }}</strong>
        <div :class="kpi.className">
          <b>{{ kpi.percent }}%</b><i><em :style="{ width: `${kpi.percent}%` }" /></i>
        </div>
      </article>
    </div>

    <div v-if="analysisSection === 'summary'" class="primary">
      <article class="card" :class="{ 'chart-expanded': expandedChart === 'usage' }">
        <header>
          <div>
            <h2><SvgIcon name="reporte" />Prioridad de mantencion por uso</h2>
            <p>Activos priorizados segun estado y lectura restante del plan.</p>
          </div>
          <div class="chart-header-actions">
            <select
              v-model="usageLimit"
              @change="usageLimit > 5 && !expandedChart && toggleExpandedChart('usage')"
            >
              <option :value="5">Top 5</option>
              <option :value="10">Top 10</option>
            </select>
            <button
              type="button"
              class="expand-chart-button"
              title="Ampliar gráfico"
              @click="toggleExpandedChart('usage')"
            >
              <SvgIcon :name="expandedChart === 'usage' ? 'close' : 'expand'" />
            </button>
          </div>
        </header>
        <div class="usage projection-chart">
          <div
            v-for="row in projectedDueRows"
            :key="row.id"
            class="chart-tooltip chart-filter-target"
            :data-tooltip="`${row.plate} · ${row.maintenance}: ${row.remaining}, ${row.estimate}`"
            role="button"
            tabindex="0"
            @click="emit('filter-maintenance-vehicle', row.plate)"
            @keydown.enter="emit('filter-maintenance-vehicle', row.plate)"
          >
            <strong
              >{{ row.plate }}<small>{{ row.maintenance }}</small></strong
            >
            <span><i :class="row.tone" :style="{ width: `${row.percent}%` }" /></span>
            <b
              >{{ row.remaining }}<small>{{ row.estimate }}</small></b
            >
          </div>
          <p v-if="!projectedDueRows.length">No hay lecturas para proyectar vencimientos.</p>
        </div>
      </article>
      <article class="card" :class="{ 'chart-expanded': expandedChart === 'cost' }">
        <header>
          <div>
            <h2><SvgIcon name="reporte" />Costo de mantencion</h2>
            <p>Costos reales registrados en ordenes finalizadas. {{ monthlyCostComparison }}</p>
          </div>
          <div class="chart-header-actions">
            <select v-model="months">
              <option :value="6">Ultimos 6 meses</option>
              <option :value="12">Ultimos 12 meses</option>
            </select>
            <button
              type="button"
              class="expand-chart-button"
              title="Ampliar gráfico"
              @click="toggleExpandedChart('cost')"
            >
              <SvgIcon :name="expandedChart === 'cost' ? 'close' : 'expand'" />
            </button>
          </div>
        </header>
        <div class="cost-chart">
          <div class="cost-axis">
            <span v-for="tick in costAxisTicks" :key="tick">{{ currency(tick) }}</span>
          </div>
          <div class="cost-plot">
            <div
              v-for="bar in monthlyCosts"
              :key="bar.label"
              class="chart-tooltip chart-filter-target"
              :data-tooltip="`${bar.label}: ${currency(bar.value)}`"
              role="button"
              tabindex="0"
              @click="emit('filter-work-orders', 'finished')"
              @keydown.enter="emit('filter-work-orders', 'finished')"
            >
              <span><i :style="{ height: `${bar.percent}%` }" /></span><b>{{ bar.label }}</b>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-if="analysisSection === 'without-order'" class="no-order-insights">
      <article class="card" :class="{ 'chart-expanded': expandedChart === 'urgency' }">
        <header>
          <div>
            <h2><SvgIcon name="reporte" />Pendientes por urgencia</h2>
            <p>Mantenciones sin OT según su estado.</p>
          </div>
          <button
            type="button"
            class="expand-chart-button"
            title="Ampliar gráfico"
            @click="toggleExpandedChart('urgency')"
          >
            <SvgIcon :name="expandedChart === 'urgency' ? 'close' : 'expand'" />
          </button>
        </header>
        <div class="urgency-chart">
          <div
            class="urgency-donut chart-tooltip chart-filter-target"
            :style="{ background: noOrderUrgencyGradient }"
            :data-tooltip="noOrderUrgencyTooltip"
            role="button"
            tabindex="0"
            @click="noOrder = 'all'"
            @keydown.enter="noOrder = 'all'"
          >
            <span
              ><strong>{{ withoutOrder.length }}</strong
              ><small>Total</small></span
            >
          </div>
          <div class="urgency-legend">
            <div
              v-for="row in noOrderUrgency"
              :key="row.status"
              class="chart-tooltip chart-filter-target"
              :data-tooltip="`${row.label}: ${row.count} (${row.share}%)`"
              role="button"
              tabindex="0"
              @click="noOrder = row.status"
              @keydown.enter="noOrder = row.status"
            >
              <i :style="{ background: row.color }" />
              <span>{{ row.label }}</span
              ><b>{{ row.count }}</b
              ><small>{{ row.share }}%</small>
            </div>
          </div>
        </div>
      </article>
      <article class="card" :class="{ 'chart-expanded': expandedChart === 'types' }">
        <header>
          <div>
            <h2><SvgIcon name="reporte" />Mantenciones sin OT por tipo</h2>
            <p>Muestra dónde se concentra la carga pendiente.</p>
          </div>
          <div class="chart-header-actions">
            <select v-model="noOrderTypeLimit">
              <option :value="5">Top 5</option>
              <option :value="10">Top 10</option>
              <option :value="0">Todos</option>
            </select>
            <button
              type="button"
              class="expand-chart-button"
              title="Ampliar gráfico"
              @click="toggleExpandedChart('types')"
            >
              <SvgIcon :name="expandedChart === 'types' ? 'close' : 'expand'" />
            </button>
          </div>
        </header>
        <div class="type-chart">
          <div
            v-for="row in noOrderByType"
            :key="row.label"
            class="chart-tooltip chart-filter-target"
            :data-tooltip="`${row.label}: ${row.count} mantenciones sin OT`"
            role="button"
            tabindex="0"
            @click="type = row.label"
            @keydown.enter="type = row.label"
          >
            <span :title="row.label">{{ row.label }}</span>
            <i><em :style="{ width: `${row.percent}%` }" /></i>
            <b>{{ row.count }}</b>
          </div>
          <p v-if="!noOrderByType.length">No hay mantenciones pendientes de OT.</p>
        </div>
      </article>
    </div>

    <div v-if="analysisSection === 'summary'" class="secondary">
      <article class="card" :class="{ 'chart-expanded': expandedChart === 'compliance' }">
        <header>
          <div>
            <h2><SvgIcon name="reporte" />Cumplimiento por activo</h2>
            <p>Porcentaje de mantenciones realizadas dentro de la fecha límite.</p>
          </div>
          <div class="chart-header-actions">
            <select
              v-model="complianceLimit"
              @change="complianceLimit > 5 && !expandedChart && toggleExpandedChart('compliance')"
            >
              <option :value="5">Top 5</option>
              <option :value="10">Top 10</option>
            </select>
            <button
              type="button"
              class="expand-chart-button"
              title="Ampliar gráfico"
              @click="toggleExpandedChart('compliance')"
            >
              <SvgIcon :name="expandedChart === 'compliance' ? 'close' : 'expand'" />
            </button>
          </div>
        </header>
        <div class="summary-bars compliance-bars">
          <div
            v-for="row in complianceByAsset"
            :key="row.id"
            class="chart-tooltip chart-filter-target"
            :data-tooltip="`${row.plate}: ${row.onTime} de ${row.total} dentro de fecha limite (${row.percent}%)`"
            role="button"
            tabindex="0"
            @click="emit('filter-maintenance-vehicle', row.plate)"
            @keydown.enter="emit('filter-maintenance-vehicle', row.plate)"
          >
            <span>{{ row.plate }}</span>
            <i><em :class="row.tone" :style="{ width: `${row.percent}%` }" /></i>
            <b
              >{{ row.percent }}%<small>{{ row.onTime }}/{{ row.total }}</small></b
            >
          </div>
          <p v-if="!complianceByAsset.length" class="chart-empty-state">
            No hay OT finalizadas con fecha límite en este período.
          </p>
        </div>
      </article>
      <article class="card" :class="{ 'chart-expanded': expandedChart === 'upcoming' }">
        <header>
          <div>
            <h2><SvgIcon name="maintenance-calendar" />Mantenciones por vencer</h2>
            <p>Cantidad de mantenciones en los próximos 90 días.</p>
          </div>
          <button
            type="button"
            class="expand-chart-button"
            title="Ampliar gráfico"
            @click="toggleExpandedChart('upcoming')"
          >
            <SvgIcon :name="expandedChart === 'upcoming' ? 'close' : 'expand'" />
          </button>
        </header>
        <div class="summary-bars upcoming-bars">
          <div
            v-for="row in upcomingBuckets"
            :key="row.label"
            class="chart-tooltip chart-filter-target"
            :data-tooltip="`${row.label}: ${row.count} mantenciones`"
            role="button"
            tabindex="0"
            @click="emit('filter-maintenance-status', row.status)"
            @keydown.enter="emit('filter-maintenance-status', row.status)"
          >
            <span>{{ row.label }}</span>
            <i><em :style="{ width: `${row.percent}%` }" /></i>
            <b>{{ row.count }}</b>
          </div>
        </div>
      </article>
      <article
        class="card cost-composition-card"
        :class="{ 'chart-expanded': expandedChart === 'composition' }"
      >
        <header>
          <div>
            <h2><SvgIcon name="reporte" />Composición del costo</h2>
            <p>Distribución del gasto en órdenes finalizadas.</p>
          </div>
          <button
            type="button"
            class="expand-chart-button"
            title="Ampliar gráfico"
            @click="toggleExpandedChart('composition')"
          >
            <SvgIcon :name="expandedChart === 'composition' ? 'close' : 'expand'" />
          </button>
        </header>
        <div class="cost-composition">
          <div
            v-if="activeCostCategoryCount > 1"
            class="cost-donut chart-filter-target"
            role="button"
            tabindex="0"
            @click="emit('filter-work-orders', 'finished')"
            @keydown.enter="emit('filter-work-orders', 'finished')"
          >
            <svg
              class="cost-donut-segments"
              viewBox="0 0 100 100"
              aria-label="Composicion del costo"
            >
              <circle
                v-for="row in costComposition"
                :key="row.label"
                cx="50"
                cy="50"
                r="40"
                pathLength="100"
                fill="none"
                :stroke="row.color"
                stroke-width="20"
                :stroke-dasharray="`${row.percent} ${100 - row.percent}`"
                :stroke-dashoffset="-row.offset"
              >
                <title>{{ row.label }}: {{ row.percent }}% · {{ currency(row.value) }}</title>
              </circle>
            </svg>
            <span
              ><strong>{{ currency(totalCompositionCost) }}</strong
              ><small>Total</small></span
            >
          </div>
          <div v-else class="single-cost-summary">
            <strong>{{ currency(totalCompositionCost) }}</strong>
            <span>{{ primaryCostCategory.label }}</span>
            <small>Unica categoria con costos registrados</small>
          </div>
          <div class="cost-legend">
            <div
              v-for="row in costComposition"
              :key="row.label"
              class="chart-filter-target"
              role="button"
              tabindex="0"
              @click="emit('filter-work-orders', 'finished')"
              @keydown.enter="emit('filter-work-orders', 'finished')"
            >
              <i :style="{ background: row.color }" />
              <span>
                <b
                  class="chart-tooltip cost-percent-tooltip"
                  :data-tooltip="`${row.label}: ${row.percent}% · ${currency(row.value)}`"
                  >{{ row.percent }}%</b
                >
                <strong>{{ row.label }}</strong>
                <small>{{ currency(row.value) }}</small>
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>

    <article v-if="analysisSection === 'summary'" class="card cost-ranking-card">
      <header>
        <div>
          <h2><SvgIcon name="reporte" />Activos con mayor costo de mantencion</h2>
          <p>Top de activos segun costo acumulado en el periodo.</p>
        </div>
        <select v-model="costRankingLimit">
          <option :value="5">Top 5</option>
          <option :value="10">Top 10</option>
        </select>
      </header>
      <div class="cost-ranking-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Activo</th>
              <th>Nombre</th>
              <th>Costo total</th>
              <th>N° de OT</th>
              <th>Ultima mantencion</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in costlyAssets" :key="row.id">
              <td>{{ index + 1 }}</td>
              <td>
                <strong>{{ row.plate }}</strong>
              </td>
              <td>{{ row.name }}</td>
              <td>
                <strong>{{ currency(row.cost) }}</strong>
              </td>
              <td>{{ row.orders }}</td>
              <td>{{ row.lastMaintenance }}</td>
              <td>
                <span class="state" :class="row.status">{{ stateLabel(row.status) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <article v-if="analysisSection === 'without-order'" class="card table-card">
      <header>
        <div>
          <h2><SvgIcon name="maintenance-calendar" />Mantenciones sin OT</h2>
          <p>{{ withoutOrder.length }} mantenciones actualmente sin una orden asociada.</p>
        </div>
        <nav>
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
              <th>Activo</th>
              <th>Mantencion</th>
              <th>Criterio</th>
              <th>Ultima lectura</th>
              <th>Proximo vencimiento</th>
              <th>Dias/Km restantes</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in noOrderRows" :key="item.id">
              <td>
                <b>{{ item.plate }}</b>
              </td>
              <td>{{ item.nextJob }}</td>
              <td>{{ criterion(item) }}</td>
              <td>{{ item.odometerLabel || "-" }}</td>
              <td>{{ item.nextDateLabel || item.intervalLabel }}</td>
              <td>{{ maintenanceRemainingLabel(item) }}</td>
              <td>
                <span :class="['state', item.status]">{{
                  item.statusLabel || stateLabel(item.status)
                }}</span>
              </td>
              <td>
                <button
                  @click="
                    emit('create-work-order', item.vehicleId || item.assetId, item.id, item.nextJob)
                  "
                >
                  Crear OT
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer>
        <span>Mostrando {{ noOrderRows.length }} de {{ filteredNoOrder.length }}</span
        ><select v-model="pageSize">
          <option :value="5">5 por pagina</option>
          <option :value="10">10 por pagina</option>
        </select>
      </footer>
    </article>
  </section>
</template>

<script setup>
import { computed, ref } from "vue"

import SvgIcon from "../icons/SvgIcon.vue"
import { buildFleetOrderIndex, findFleetOpenOrder } from "./fleetOrderIndex.js"
import { aggregateMaintenanceAnalysisPeriod, buildMaintenanceAnalysisIndex, maintenanceAnalysisMonthKey } from "../../utils/maintenance/maintenanceAnalysisData.js"
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
  usageLimit = ref(5),
  complianceLimit = ref(5),
  costRankingLimit = ref(5),
  expandedChart = ref(""),
  noOrderPeriod = ref(90),
  noOrderTypeLimit = ref(5),
  noOrder = ref("all"),
  pageSize = ref(5)
const analysisSection = computed(() => props.section)
const closeExpandedChart = () => {
  if (expandedChart.value === "usage") usageLimit.value = 5
  if (expandedChart.value === "compliance") complianceLimit.value = 5
  expandedChart.value = ""
}
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
  { value: "unconfigured", label: "Sin configurar" },
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
  visible.value.flatMap((vehicle) =>
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
  ),
)
const percentage = (n) => (visible.value.length ? Math.round((n / visible.value.length) * 100) : 0)
const statusKpis = computed(() =>
  [
    {
      label: "Al dia",
      status: "current",
      statuses: ["current"],
      className: "green",
    },
    {
      label: "Vencidas",
      status: "overdue",
      statuses: ["overdue"],
      className: "orange",
    },
    { label: "Proximas", status: "due", statuses: ["due"], className: "blue" },
    {
      label: "Sin configurar",
      status: "unconfigured",
      statuses: ["unconfigured"],
      className: "gray",
    },
  ].map((k) => {
    const count = visible.value.filter((i) => k.statuses.includes(i.status)).length
    return { ...k, count, percent: percentage(count) }
  }),
)
const summaryStatusKpis = computed(() =>
  ["current", "due", "overdue"].map((status) =>
    statusKpis.value.find((kpi) => kpi.status === status),
  ),
)
const projectedDueRows = computed(() => {
  const rows = visible.value
    .map((i) => {
      const remaining = maintenanceRemainingLabel(i)
      const overdueDays = Number(String(remaining).match(/\d+/)?.[0]) || 0
      const risk =
        i.status === "overdue"
          ? Math.min(100, 62 + overdueDays)
          : { due: 72, current: 34, unconfigured: 16 }[i.status] || 25
      return {
        ...i,
        maintenance: i.nextJob || i.type || "Mantencion",
        remaining,
        estimate:
          i.status === "overdue"
            ? "Atencion inmediata"
            : i.status === "unconfigured"
              ? "Configurar para proyectar"
              : i.nextDateLabel || i.nextDueLabel || "Segun lectura del plan",
        percent: risk,
        tone:
          i.status === "overdue"
            ? "critical"
            : i.status === "due"
              ? "warning"
              : i.status === "current"
                ? "good"
                : "neutral",
      }
    })
    .sort((a, b) => b.percent - a.percent)
    .slice(0, usageLimit.value)
  return rows
})
const analysisOrderIndex = computed(() => buildMaintenanceAnalysisIndex(props.workOrders))
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
    now = new Date(),
    rows = Array.from({ length: months.value }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (months.value - index - 1), 1),
        value = analysisOrderIndex.value.monthlyCosts.get(maintenanceAnalysisMonthKey(date)) || 0
      return { label: names[date.getMonth()], value }
    }),
    max = Math.max(...rows.map((r) => r.value), 1)
  return rows.map((r) => ({ ...r, percent: r.value ? Math.max(8, (r.value / max) * 100) : 2 }))
})
const costAxisTicks = computed(() => {
  const maximum = Math.max(...monthlyCosts.value.map((row) => row.value), 0)
  const ceiling = Math.max(1000000, Math.ceil(maximum / 1000000) * 1000000)
  return [ceiling, ceiling * 0.75, ceiling * 0.5, ceiling * 0.25, 0]
})
const monthlyCostComparison = computed(() => {
  const current = monthlyCosts.value.at(-1)?.value || 0
  const previous = monthlyCosts.value.at(-2)?.value || 0
  if (!previous && !current) return "Sin costos en el periodo."
  if (!previous) return "Primer mes con costos registrados."
  const variation = Math.round(((current - previous) / previous) * 100)
  return `${variation >= 0 ? "+" : ""}${variation}% respecto al mes anterior.`
})
const periodStart = computed(() => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setMonth(start.getMonth() - months.value + 1, 1)
  return start
})
const periodAnalysis = computed(() =>
  aggregateMaintenanceAnalysisPeriod(analysisOrderIndex.value, periodStart.value),
)
const complianceByAsset = computed(() =>
  visible.value
    .map((item) => {
      const summary = periodAnalysis.value.vehicles.get(String(item.id))
      const total = summary?.measurable || 0
      const onTime = summary?.onTime || 0
      const percent = total
        ? Math.round((onTime / total) * 100)
        : 0
      return {
        id: item.id,
        plate: item.plate,
        percent,
        onTime,
        total,
        tone: percent >= 75 ? "good" : percent >= 50 ? "warning" : "critical",
      }
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.percent - a.percent || b.total - a.total)
    .slice(0, complianceLimit.value),
)
const upcomingBuckets = computed(() => {
  const definitions = [
    { label: "Vencidas", status: "overdue", min: null, max: null },
    { label: "0 - 15 días", status: "due", min: 0, max: 15 },
    { label: "16 - 30 días", status: "due", min: 16, max: 30 },
    { label: "31 - 60 días", status: "due", min: 31, max: 60 },
    { label: "61 - 90 días", status: "due", min: 61, max: 90 },
  ]
  const remainingDays = visiblePlans.value
    .filter((item) => item.status === "due")
    .map((item) => Number(maintenanceRemainingLabel(item).match(/\d+/)?.[0]))
    .filter(Number.isFinite)
  const rows = definitions.map((definition) => ({
    ...definition,
    count:
      definition.status === "overdue"
        ? visiblePlans.value.filter((item) => item.status === "overdue").length
        : remainingDays.filter((value) => value >= definition.min && value <= definition.max)
            .length,
  }))
  const maximum = Math.max(...rows.map((row) => row.count), 1)
  return rows.map((row) => ({ ...row, percent: (row.count / maximum) * 100 }))
})
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
  return rows.map((row, index) => {
    const percent = total ? Math.round((row.value / total) * 100) : index === 0 ? 100 : 0
    const result = { ...row, percent, offset }
    offset += percent
    return result
  })
})
const totalCompositionCost = computed(() =>
  costComposition.value.reduce((sum, row) => sum + row.value, 0),
)
const costlyAssets = computed(() =>
  visible.value
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
    .filter((item) => item.orders)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, costRankingLimit.value),
)
const activeCostCategoryCount = computed(
  () => costComposition.value.filter((row) => row.value > 0).length,
)
const primaryCostCategory = computed(
  () => costComposition.value.find((row) => row.value > 0) || costComposition.value[0],
)
const criterion = (i) =>
  norm(i.readingSourceLabel).includes("hora")
    ? "Horas de motor"
    : norm(i.readingSourceLabel).includes("odo")
      ? "Odometro"
      : "Tiempo"
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
    visiblePlans.value.filter((item) => {
      if (hasOrder(item)) return false
      if (criterion(item) !== "Tiempo" || item.status === "overdue") return true
      const remaining = Number(maintenanceRemainingLabel(item).match(/\d+/)?.[0])
      return !Number.isFinite(remaining) || remaining <= noOrderPeriod.value
    }),
  ),
  noOrderKpis = computed(() =>
    [
      { status: "overdue", label: "Vencidas", className: "red" },
      { status: "due", label: "Próximas", className: "orange" },
      { status: "unconfigured", label: "Sin configurar", className: "gray" },
    ].map((definition) => {
      const count = withoutOrder.value.filter((item) => item.status === definition.status).length
      return {
        ...definition,
        count,
        percent: withoutOrder.value.length
          ? Math.round((count / withoutOrder.value.length) * 100)
          : 0,
      }
    }),
  ),
  noOrderUrgency = computed(() =>
    [
      { status: "overdue", label: "Vencidas", color: "#ef233c" },
      { status: "due", label: "Próximas", color: "#ff6b16" },
      { status: "current", label: "Al día", color: "#0aa778" },
      { status: "unconfigured", label: "Sin configurar", color: "#8d99ae" },
    ].map((definition) => {
      const count = withoutOrder.value.filter((item) => item.status === definition.status).length
      return {
        ...definition,
        count,
        share: withoutOrder.value.length
          ? Math.round((count / withoutOrder.value.length) * 100)
          : 0,
      }
    }),
  ),
  noOrderUrgencyGradient = computed(() => {
    let start = 0
    const rows = noOrderUrgency.value.filter((row) => row.share)
    if (!rows.length) return "conic-gradient(#e5eaf2 0 100%)"
    return `conic-gradient(${rows
      .map((row) => {
        const end = start + row.share
        const segment = `${row.color} ${start}% ${end}%`
        start = end
        return segment
      })
      .join(", ")})`
  }),
  noOrderUrgencyTooltip = computed(() =>
    noOrderUrgency.value.map((row) => `${row.label}: ${row.count} (${row.share}%)`).join(" · "),
  ),
  noOrderByType = computed(() => {
    const counts = withoutOrder.value.reduce((result, item) => {
        const label = item.nextJob || item.type || "Sin tipo"
        result.set(label, (result.get(label) || 0) + 1)
        return result
      }, new Map()),
      rows = [...counts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
      visibleRows = noOrderTypeLimit.value ? rows.slice(0, noOrderTypeLimit.value) : rows,
      maximum = Math.max(...visibleRows.map((row) => row.count), 1)

    return visibleRows.map((row) => ({ ...row, percent: (row.count / maximum) * 100 }))
  }),
  filteredNoOrder = computed(() =>
    withoutOrder.value.filter((i) => noOrder.value === "all" || i.status === noOrder.value),
  ),
  noOrderRows = computed(() => filteredNoOrder.value.slice(0, pageSize.value)),
  noOrderFilterCount = (status) =>
    status === "all"
      ? withoutOrder.value.length
      : withoutOrder.value.filter((item) => item.status === status).length,
  stateLabel = (status) =>
    ({ overdue: "Vencida", due: "Próxima", current: "Al día", unconfigured: "Sin configurar" })[
      status
    ] || "Sin estado"
</script>

<style scoped>
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
  grid-template-rows: auto minmax(270px, auto) minmax(220px, auto) auto;
}
.analysis-view.is-without-order {
  grid-template-rows: auto auto minmax(250px, auto) minmax(300px, 1fr);
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
  height: 100%;
  min-height: 0;
  overflow: visible;
  padding: 16px;
}
.primary > .card > header {
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
  transform-origin: 50% 50%;
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
  height: calc(100% - 42px);
  min-height: 220px;
  margin-top: 8px;
}
.cost-axis {
  display: grid;
  grid-template-rows: repeat(5, 1fr);
  padding-bottom: 25px;
  color: #345284;
  font-size: 11px;
  text-align: right;
}
.cost-axis span {
  transform: translateY(-5px);
  padding-right: 8px;
}
.cost-plot {
  display: flex;
  height: 100%;
  align-items: flex-end;
  justify-content: space-around;
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
  min-height: 2px;
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
</style>
