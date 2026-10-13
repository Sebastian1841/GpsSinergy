<template>
  <section class="orders-view">
    <div class="orders-metrics">
      <article v-for="metric in summaryMetrics" :key="metric.label">
        <small>{{ metric.label }}</small
        ><strong>{{ metric.value }}</strong
        ><span>{{ metric.detail }}</span>
      </article>
    </div>

    <div class="orders-filters" :class="{ 'has-custom-range': deadlineFilter === 'custom' }">
      <input
        v-model="pendingSearch"
        type="search"
        placeholder="Buscar OT, activo, mantencion o descripcion..."
      />
      <label
        ><span>Activos</span
        ><select v-model="selectedAsset">
          <option value="all">Todos los activos</option>
          <option v-for="asset in assetOptions" :key="asset" :value="asset">{{ asset }}</option>
        </select></label
      >
      <label
        ><span>Fecha límite de ejecución</span
        ><select v-model="deadlineFilter">
          <option value="all">Todas las fechas límite</option>
          <option value="overdue">Vencidas</option>
          <option value="today">Vencen hoy</option>
          <option value="next-7">Próximos 7 días</option>
          <option value="next-30">Próximos 30 días</option>
          <option value="none">Sin fecha límite de ejecución</option>
          <option value="custom">Rango personalizado</option>
        </select></label
      >
      <label v-if="deadlineFilter === 'custom'"
        ><span>Desde</span><input v-model="deadlineFrom" type="date"
      /></label>
      <label v-if="deadlineFilter === 'custom'"
        ><span>Hasta</span><input v-model="deadlineTo" type="date"
      /></label>
      <button type="button" class="clear" @click="clearLocalFilters">Limpiar</button>
    </div>

    <div class="orders-controls">
      <nav aria-label="Estados de ordenes">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="{ active: activeList === tab.id }"
          @click="activeList = tab.id"
        >
          {{ tab.label }} ({{ tab.count }})
        </button>
      </nav>
    </div>

    <div ref="ordersTableWrap" class="orders-table-wrap">
      <table>
        <thead>
          <tr>
            <th>OT</th>
            <th>Activo</th>
            <th>Mantencion</th>
            <th>Responsable</th>
            <th>Fecha límite de ejecución</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Costos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in displayedOrders"
            :key="order.id"
            :data-order-id="order.id"
            :class="{ 'is-focused': order.id === focusedOrderId }"
          >
            <td>
              <strong>{{ order.id }}</strong
              ><small>Creada {{ formatCreatedDate(order.createdAt) }}</small>
            </td>
            <td>
              <strong>{{ order.plate }}</strong
              ><small>{{ order.type }}</small>
            </td>
            <td class="maintenance-copy">
              <strong>{{ order.job }}</strong>
            </td>
            <td>
              <strong>{{ order.owner }}</strong
              ><small>{{ order.workshop }}</small>
            </td>
            <td>
              <span>{{ order.scheduledDate || "Sin fecha" }}</span>
              <small class="deadline-indicator" :class="getDeadlineStatus(order).className">
                {{ getDeadlineStatus(order).label }}
              </small>
            </td>
            <td>
              <span class="status" :class="getOrderStatusClass(order.status)">{{
                getOrderStatusLabel(order.status)
              }}</span>
            </td>
            <td>
              <span class="priority" :class="getPriorityClass(order.priority)">{{
                order.priority
              }}</span>
            </td>
            <td>
              <strong>Estimado: {{ order.estimatedCost }}</strong
              ><small>Real: {{ order.actualCost }}</small
              ><small>{{ getCostDeviation(order) }}</small>
            </td>
            <td>
              <div class="row-actions">
                <button
                  type="button"
                  @click.stop.prevent="openWorkOrderActionModal(order.id, 'order-detail')"
                >
                  Ver OT
                </button>
                <select
                  v-if="!['finished', 'cancelled'].includes(order.status)"
                  :value="order.status"
                  @change="changeOrderStatus(order, $event.target.value)"
                >
                  <option value="scheduled">Programada</option>
                  <option value="in-progress">En proceso</option>
                  <option value="waiting">En espera</option>
                  <option value="finished">Cerrada</option></select
                ><button
                  v-if="!['finished', 'cancelled'].includes(order.status)"
                  type="button"
                  class="more-actions-button"
                  title="Mas acciones"
                  :aria-expanded="activeActionMenu === order.id"
                  @click.stop="toggleActionMenu(order.id)"
                >
                  ⋮
                </button>
                <div
                  v-if="activeActionMenu === order.id"
                  class="order-secondary-actions"
                  @click.stop
                >
                  <button type="button" @click="openCostFromMenu(order.id)">Agregar costos</button>
                  <button type="button" class="cancel" @click="cancelFromMenu(order.id)">
                    Cancelar OT
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!displayedOrders.length" class="orders-empty">
        <strong>No hay ordenes para los filtros seleccionados</strong
        ><span>Prueba cambiando el estado, activo o fecha.</span>
      </div>
      <footer>
        <span
          >Mostrando {{ displayedOrders.length }} de {{ assetFilteredOrders.length }} ordenes</span
        >
        <div>
          Filas por pagina
          <select v-model="pageSize">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option></select
          ><button type="button" disabled>‹</button><b>1</b
          ><button type="button" disabled>›</button>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { parseMaintenanceOrderCost as parseCost, parseMaintenanceOrderDate as parseOrderDate, summarizeMaintenanceOrders } from "../../utils/maintenance/maintenanceOrderSummary.js"
import { formatDecimalNumber, formatNumber } from "../../utils/maintenance/maintenanceFormatUtils.js"
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"

const props = defineProps({
  filteredWorkOrders: { type: Array, default: () => [] },
  focusedOrderId: { type: String, default: "" },
  getOrderStatusClass: { type: Function, required: true },
  getOrderStatusLabel: { type: Function, required: true },
  getPriorityClass: { type: Function, required: true },
  orderSearchTerm: { type: String, default: "" },
  orderStatusFilters: { type: Array, default: () => [] },
  selectedOrderStatus: { type: String, default: "all" },
})
const emit = defineEmits([
  "open-maintenance-modal",
  "open-order-cost",
  "open-work-order-action-modal",
  "select-work-order",
  "update:order-search-term",
  "update:selected-order-status",
])
const activeList = ref("all")
const selectedAsset = ref("all")
const deadlineFilter = ref("all")
const deadlineFrom = ref("")
const deadlineTo = ref("")
const pendingSearch = ref(props.orderSearchTerm)
const pageSize = ref(10)
const ordersTableWrap = ref(null)
const activeActionMenu = ref(null)
const toggleActionMenu = (orderId) => {
  activeActionMenu.value = activeActionMenu.value === orderId ? null : orderId
}
const openCostFromMenu = (orderId) => {
  activeActionMenu.value = null
  emit("open-order-cost", orderId)
}
const cancelFromMenu = (orderId) => {
  activeActionMenu.value = null
  openWorkOrderActionModal(orderId, "cancel-order")
}
const closeActionMenu = (event) => {
  if (!event.target.closest?.(".row-actions")) activeActionMenu.value = null
}
onMounted(() => document.addEventListener("pointerdown", closeActionMenu))
onBeforeUnmount(() => document.removeEventListener("pointerdown", closeActionMenu))
const assetOptions = computed(() => [
  ...new Set(props.filteredWorkOrders.map(({ plate }) => plate)),
])
const isOpenOrder = (order) => ["scheduled", "waiting", "in-progress"].includes(order.status)
const matchesDeadlineFilter = (order) => {
  if (deadlineFilter.value === "all") return true
  const deadline = parseOrderDate(order.scheduledDate)
  if (deadlineFilter.value === "none") return !deadline
  if (!deadline) return false

  deadline.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (deadlineFilter.value === "overdue") return isOpenOrder(order) && deadline < today
  if (deadlineFilter.value === "today")
    return isOpenOrder(order) && deadline.getTime() === today.getTime()
  if (["next-7", "next-30"].includes(deadlineFilter.value)) {
    const days = deadlineFilter.value === "next-7" ? 7 : 30
    const limit = new Date(today)
    limit.setDate(limit.getDate() + days)
    return isOpenOrder(order) && deadline >= today && deadline <= limit
  }
  if (deadlineFilter.value === "custom") {
    const from = parseOrderDate(deadlineFrom.value)
    const to = parseOrderDate(deadlineTo.value)
    if (from) from.setHours(0, 0, 0, 0)
    if (to) to.setHours(23, 59, 59, 999)
    return (!from || deadline >= from) && (!to || deadline <= to)
  }
  return true
}
const assetFilteredOrders = computed(() =>
  props.filteredWorkOrders.filter(
    (order) =>
      (selectedAsset.value === "all" || order.plate === selectedAsset.value) &&
      matchesDeadlineFilter(order),
  ),
)
const orderStatistics = computed(() => summarizeMaintenanceOrders(assetFilteredOrders.value))
const countStatus = (statuses) => statuses.reduce((sum, status) => sum + (orderStatistics.value.counts.get(status) || 0), 0)
const tabs = computed(() => [
  { id: "all", label: "Todas", count: assetFilteredOrders.value.length },
  { id: "scheduled", label: "Programadas", count: countStatus(["scheduled"]) },
  { id: "waiting", label: "En espera", count: countStatus(["waiting"]) },
  { id: "in-progress", label: "En ejecucion", count: countStatus(["in-progress"]) },
  { id: "closed", label: "Cerradas", count: countStatus(["finished", "cancelled"]) },
])
const tabFilteredOrders = computed(() =>
  assetFilteredOrders.value.filter(
    (order) =>
      activeList.value === "all" ||
      (activeList.value === "closed"
        ? ["finished", "cancelled"].includes(order.status)
        : order.status === activeList.value),
  ),
)
const displayedOrders = computed(() => tabFilteredOrders.value.slice(0, pageSize.value))
const estimatedCost = computed(() => orderStatistics.value.estimatedCost)
const actualCost = computed(() => orderStatistics.value.actualCost)
const averageClosingDays = computed(() => orderStatistics.value.averageClosingDays)
const onTimeRate = computed(() => orderStatistics.value.onTimeRate)
const costDifferenceDetail = computed(() => {
  if (!estimatedCost.value) return "Sin presupuesto estimado"
  const difference = actualCost.value - estimatedCost.value
  const percentage = Math.round((Math.abs(difference) / estimatedCost.value) * 100)
  if (!difference) return "Igual al presupuesto"
  return `${percentage}% ${difference > 0 ? "sobre" : "bajo"} presupuesto`
})
const summaryMetrics = computed(() => [
  {
    label: "OT abiertas",
    value: orderStatistics.value.openCount,
    detail: `${orderStatistics.value.openCount} activas`,
  },
  {
    label: "OT vencidas",
    value: orderStatistics.value.overdueCount,
    detail: orderStatistics.value.overdueCount ? "Requieren atencion" : "Sin atrasos",
  },
  {
    label: "En ejecucion",
    value: countStatus(["in-progress"]),
    detail: `${countStatus(["in-progress"])} en taller`,
  },
  {
    label: "Tiempo promedio",
    value:
      averageClosingDays.value === null
        ? "-"
        : `${formatDecimalNumber(averageClosingDays.value)} dias`,
    detail: "Para cerrar una OT",
  },
  {
    label: "Cumplimiento",
    value: onTimeRate.value === null ? "-" : `${onTimeRate.value}%`,
    detail: "Dentro de fecha límite",
  },
  {
    label: "Costo real",
    value: `$ ${formatNumber(actualCost.value)}`,
    detail: costDifferenceDetail.value,
  },
])
const getCostDeviation = (order) => {
  const estimated = parseCost(order.estimatedCost)
  const actual = parseCost(order.actualCost)
  if (!estimated) return "Sin presupuesto"
  const difference = actual - estimated
  if (!difference) return "Sin desviacion"
  const percentage = Math.round((Math.abs(difference) / estimated) * 100)
  return `${percentage}% ${difference > 0 ? "sobre" : "bajo"} presupuesto`
}
const getDeadlineStatus = (order) => {
  const deadline = parseOrderDate(order.scheduledDate)
  if (!deadline) return { label: "Sin fecha límite de ejecución", className: "is-neutral" }

  deadline.setHours(0, 0, 0, 0)
  const comparisonDate = ["finished", "cancelled"].includes(order.status)
    ? parseOrderDate(order.closedAt || order.cancelledAt)
    : new Date()
  if (!comparisonDate) return { label: "Sin cierre registrado", className: "is-neutral" }

  comparisonDate.setHours(0, 0, 0, 0)
  const differenceInDays = Math.round((deadline - comparisonDate) / 86400000)

  if (order.status === "cancelled") {
    return { label: "Orden cancelada", className: "is-neutral" }
  }
  if (order.status === "finished") {
    if (differenceInDays < 0) {
      const days = Math.abs(differenceInDays)
      return {
        label: `Cerrada con ${days} ${days === 1 ? "dia" : "dias"} de atraso`,
        className: "is-overdue",
      }
    }
    return { label: "Cerrada dentro de fecha límite", className: "is-on-time" }
  }
  if (differenceInDays < 0) {
    const days = Math.abs(differenceInDays)
    return {
      label: `Vencida hace ${days} ${days === 1 ? "dia" : "dias"}`,
      className: "is-overdue",
    }
  }
  if (differenceInDays === 0) return { label: "Vence hoy", className: "is-today" }
  return {
    label: `${differenceInDays} ${differenceInDays === 1 ? "dia restante" : "dias restantes"}`,
    className: differenceInDays <= 7 ? "is-upcoming" : "is-on-time",
  }
}
const clearLocalFilters = () => {
  pendingSearch.value = ""
  selectedAsset.value = "all"
  deadlineFilter.value = "all"
  deadlineFrom.value = ""
  deadlineTo.value = ""
  activeList.value = "all"
  emit("update:order-search-term", "")
  emit("update:selected-order-status", "all")
}
const openWorkOrderActionModal = (orderId, modalType, status = "") =>
  emit("open-work-order-action-modal", orderId, modalType, status)
const changeOrderStatus = (order, status) =>
  openWorkOrderActionModal(
    order.id,
    status === "finished"
      ? "close-order"
      : ["in-progress", "waiting"].includes(status)
        ? "assign-order"
        : "reprogram-order",
    status,
  )
const formatCreatedDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-CL") : "17/08/2026"
watch(pendingSearch, (value) => emit("update:order-search-term", value))
watch(
  () => props.focusedOrderId,
  async (orderId) => {
    if (!orderId) return

    clearLocalFilters()
    pageSize.value = 50
    await nextTick()

    const selectedRow = [
      ...(ordersTableWrap.value?.querySelectorAll("[data-order-id]") || []),
    ].find((row) => row.dataset.orderId === orderId)
    selectedRow?.scrollIntoView({ behavior: "smooth", block: "center" })
  },
  { immediate: true },
)
watch(
  () => props.filteredWorkOrders.length,
  (current, previous) => {
    if (current > previous) {
      selectedAsset.value = "all"
      activeList.value = "all"
    }
  },
)
</script>

<style scoped>
.orders-view {
  display: grid;
  align-content: start;
  grid-auto-rows: max-content;
  gap: 16px;
  min-height: 100%;
  color: #102372;
}
.orders-metrics {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}
.orders-metrics article {
  display: grid;
  min-height: 76px;
  place-content: center;
  border: 1px solid #d8e0eb;
  border-radius: 7px;
  background: #fff;
  text-align: center;
}
.orders-metrics small {
  font-size: 12px;
  color: #536783;
}
.orders-metrics strong {
  margin-top: 4px;
  font-size: 20px;
  font-weight: 900;
}
.orders-metrics span {
  margin-top: 3px;
  font-size: 11px;
  color: #536783;
}
.orders-filters {
  display: grid;
  grid-template-columns: minmax(260px, 1.5fr) 0.7fr 0.9fr auto;
  align-items: end;
  gap: 10px;
  border: 1px solid #d8e0eb;
  border-radius: 8px;
  background: #fff;
  padding: 14px;
}
.orders-filters.has-custom-range {
  grid-template-columns: minmax(240px, 1.3fr) 0.65fr 0.75fr 0.75fr 0.75fr auto;
}
.orders-filters label {
  display: grid;
  gap: 5px;
}
.orders-filters label span {
  font-size: 12px;
  font-weight: 800;
}
.orders-filters input,
.orders-filters select,
.orders-filters button {
  height: 40px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  background: #fff;
  padding: 0 12px;
  color: #102372;
  font-size: 13px;
  font-weight: 800;
}
.orders-filters .clear {
  border-color: transparent;
}
.orders-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.orders-controls nav,
.orders-controls button {
  height: 36px;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 0 14px;
  color: #345284;
  font-size: 12px;
  font-weight: 900;
}
.orders-controls button.active {
  border-color: #cfd8e6;
  background: #eef4ff;
  color: #102372;
}
.orders-controls nav button.active {
  border-color: transparent;
  border-bottom-color: #102372;
  border-radius: 0;
  background: transparent;
}
.orders-table-wrap {
  height: clamp(300px, calc(100vh - 480px), 450px);
  border: 1px solid #d8e0eb;
  border-radius: 8px;
  background: #fff;
  overflow: auto;
  overscroll-behavior: contain;
}
.orders-table-wrap table {
  width: 100%;
  min-width: 1280px;
  border-collapse: collapse;
}
.orders-table-wrap th {
  position: sticky;
  z-index: 4;
  top: 0;
  height: 42px;
  background: #f3f6fa;
  padding: 0 14px;
  color: #345284;
  font-size: 11px;
  text-align: left;
  text-transform: uppercase;
}
.orders-table-wrap td {
  height: 82px;
  border-top: 1px solid #e2e8f0;
  padding: 12px 14px;
  vertical-align: middle;
  font-size: 12px;
}
.orders-table-wrap td + td,
.orders-table-wrap th + th {
  border-left: 1px solid #e2e8f0;
}
.orders-table-wrap tr.is-focused td {
  border-top-color: #8db6f2;
  border-bottom: 1px solid #8db6f2;
  background: #eef5ff;
}
.orders-table-wrap tr.is-focused td:first-child {
  box-shadow: inset 4px 0 0 #1677ff;
}
.orders-table-wrap td strong,
.orders-table-wrap td small {
  display: block;
}
.orders-table-wrap td .deadline-indicator {
  font-weight: 800;
}
.deadline-indicator.is-overdue {
  color: #dc2626;
}
.deadline-indicator.is-today,
.deadline-indicator.is-upcoming {
  color: #c25100;
}
.deadline-indicator.is-on-time {
  color: #07845e;
}
.deadline-indicator.is-neutral {
  color: #64748b;
}
.orders-table-wrap td strong {
  font-size: 13px;
  font-weight: 900;
}
.orders-table-wrap td small {
  margin-top: 5px;
  color: #536783;
  font-size: 11px;
  line-height: 1.4;
}
.maintenance-copy {
  max-width: 230px;
}
.status,
.priority {
  display: inline-block;
  border-radius: 6px;
  padding: 7px 12px;
  font-size: 11px;
  font-weight: 900;
}
.row-actions {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
}
.row-actions button,
.row-actions select {
  height: 34px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  background: #fff;
  padding: 0 10px;
  color: #102372;
  font-size: 11px;
  font-weight: 900;
}
.row-actions button:first-child {
  white-space: nowrap;
}
.row-actions select {
  min-width: 118px;
}
.row-actions .cancel {
  border-color: #fecaca;
  color: #dc2626;
}
.row-actions .more-actions-button {
  width: 34px;
  padding: 0;
  font-size: 20px;
  line-height: 1;
}
.order-secondary-actions {
  position: absolute;
  z-index: 30;
  top: calc(100% + 5px);
  right: 0;
  display: grid;
  width: 150px;
  gap: 3px;
  border: 1px solid #d8e0eb;
  border-radius: 7px;
  background: #fff;
  padding: 5px;
  box-shadow: 0 10px 24px rgb(15 35 90 / 16%);
}
.row-actions .order-secondary-actions button {
  width: 100%;
  justify-content: flex-start;
  border: 0;
  text-align: left;
}
.row-actions .order-secondary-actions button:hover {
  background: #f3f6fb;
}
.orders-empty {
  display: grid;
  min-height: 220px;
  place-content: center;
  text-align: center;
  color: #64748b;
}
.orders-empty strong {
  font-size: 14px;
}
.orders-empty span {
  margin-top: 6px;
  font-size: 12px;
}
.orders-table-wrap footer {
  position: sticky;
  z-index: 4;
  bottom: 0;
  display: flex;
  min-height: 54px;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  padding: 8px 14px;
  color: #536783;
  font-size: 12px;
}
.orders-table-wrap footer div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.orders-table-wrap footer select,
.orders-table-wrap footer button,
.orders-table-wrap footer b {
  height: 32px;
  border: 1px solid #cfd8e6;
  border-radius: 6px;
  background: #fff;
  padding: 0 10px;
}
.orders-table-wrap footer b {
  display: grid;
  place-items: center;
  background: #102372;
  color: #fff;
}
@media (min-width: 761px) {
  .orders-view {
    height: 100%;
    min-height: 0;
    grid-template-rows: auto auto auto minmax(0, 1fr);
  }
  .orders-table-wrap {
    height: auto;
    min-height: 0;
  }
}
@media (max-width: 1200px) {
  .orders-filters,
  .orders-filters.has-custom-range {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 760px) {
  .orders-table-wrap {
    height: min(440px, 55vh);
  }
  .orders-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  .orders-filters,
  .orders-filters.has-custom-range {
    grid-template-columns: 1fr;
  }
  .orders-controls {
    align-items: flex-start;
    flex-direction: column;
    overflow: auto;
  }
  .orders-controls nav {
    min-width: max-content;
  }
}
</style>
