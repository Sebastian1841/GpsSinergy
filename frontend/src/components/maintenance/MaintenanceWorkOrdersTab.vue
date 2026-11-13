<template>
  <section class="orders-view" :class="{ 'is-table-expanded': isTableExpanded }">
    <div class="orders-metrics">
      <article v-for="metric in summaryMetrics" :key="metric.label">
        <small>{{ metric.label }}</small
        ><strong>{{ metric.value }}</strong
        >
      </article>
    </div>

    <div class="orders-toolbar">
    <div class="orders-filters" :class="{ 'is-history': isHistory }">
      <nav class="orders-sections" aria-label="Consulta de ordenes">
        <button type="button" :class="{ active: !isHistory }" :aria-pressed="!isHistory" @click="selectOrderList('open')">Ordenes abiertas <span class="order-count">{{ orderStatistics.openCount }}</span></button>
        <button type="button" :class="{ active: isHistory }" :aria-pressed="isHistory" @click="selectOrderList('finished')">Historial</button>
      </nav>
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
      <label v-if="isHistory"><span>Fecha de cierre desde</span><input v-model="deadlineFrom" type="date" :max="deadlineTo || undefined" :aria-invalid="invalidDeadlineRange" /></label>
      <label v-if="isHistory"><span>Hasta</span><input v-model="deadlineTo" type="date" :min="deadlineFrom || undefined" :aria-invalid="invalidDeadlineRange" /></label>
      <button type="button" class="clear" @click="clearLocalFilters">Limpiar</button>
      <p v-if="isHistory && invalidDeadlineRange" class="orders-date-error" role="alert">La fecha final debe ser igual o posterior a la inicial.</p>
    </div>

    <div class="orders-controls">
      <nav v-if="!isHistory" aria-label="Estados de ordenes">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="{ active: activeList === tab.id }"
          @click="selectOrderList(tab.id)"
        >
          {{ tab.label }} <span class="order-count">{{ tab.count }}</span>
        </button>
      </nav>
      <div class="orders-table-tools">
      <button
        ref="expandTableButton"
        type="button"
        class="expand-table-button"
        :aria-pressed="isTableExpanded"
        :title="isTableExpanded ? 'Volver a la vista normal' : 'Ver tabla a pantalla completa'"
        @click="toggleTableExpanded"
      >
        <SvgIcon :name="isTableExpanded ? 'close' : 'expand'" />
        {{ isTableExpanded ? 'Salir de pantalla completa' : 'Ampliar tabla' }}
      </button>
      </div>
    </div>
    </div>

    <div ref="ordersTableWrap" class="orders-table-wrap">
      <table>
        <thead>
          <tr>
            <th>OT</th>
            <th>Activo</th>
            <th>Mantencion</th>
            <th>Responsable</th>
            <th>{{ isHistory ? 'Fecha de cierre' : 'Fecha limite de ejecucion' }}</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Costo real</th>
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
              <strong>{{ order.plate }}</strong>
            </td>
            <td class="maintenance-copy">
              <strong>{{ order.job }}</strong>
            </td>
            <td>
              <strong>{{ order.owner }}</strong
              ><small>{{ order.workshop }}</small>
            </td>
            <td>
              <span v-if="isHistory">{{ formatClosedDate(order.closedAt) }}</span>
              <span v-else>{{ order.scheduledDate || "Sin fecha" }}</span>
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
              <span class="priority" :class="getPriorityClass(order.priority)">{{ order.priority }}</span>
            </td>
            <td>
              <strong>{{ order.actualCost || '$ 0' }}</strong>
            </td>
            <td>
              <div class="row-actions">
                <button
                  type="button"
                  @click.stop.prevent="openWorkOrderActionModal(order.id, 'order-detail')"
                >
                  Ver OT
                </button>
                <button
                  v-if="getWorkOrderNextAction(order.status)"
                  type="button"
                  class="order-next-action"
                  @click="runNextOrderAction(order)"
                >{{ getWorkOrderNextAction(order.status).label }}</button>
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
          >Mostrando {{ pagination.start }} a {{ pagination.end }} de {{ pagination.total }} ordenes</span
        >
        <div>
          Filas por pagina
          <select v-model="pageSize" aria-label="Filas por pagina">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option></select
          >
          <button type="button" aria-label="Pagina anterior" :disabled="pagination.page === 1" @click="currentPage = pagination.page - 1"><SvgIcon name="chevron-left" /></button>
          <b aria-live="polite">{{ pagination.page }} / {{ pagination.pageCount }}</b>
          <button type="button" aria-label="Pagina siguiente" :disabled="pagination.page === pagination.pageCount" @click="currentPage = pagination.page + 1"><SvgIcon name="chevron-right" /></button>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { parseMaintenanceOrderDate as parseOrderDate, summarizeMaintenanceOrders } from "../../utils/maintenance/maintenanceOrderSummary.js"
import { computed, nextTick, onActivated, onDeactivated, onBeforeUnmount, onMounted, ref, watch } from "vue"
import SvgIcon from "../icons/SvgIcon.vue"
import { getWorkOrderNextAction } from "./workOrderNextAction.js"
import { matchesWorkOrderList } from "./workOrderList.js"
import { getWorkOrderPage } from "./workOrderPagination.js"

const props = defineProps({
  filteredWorkOrders: { type: Array, default: () => [] },
  workOrders: { type: Array, default: () => [] },
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
  "open-work-order-action-modal",
  "select-work-order",
  "update:order-search-term",
  "update:selected-order-status",
])
const activeList = ref("open")
const isHistory = computed(() => activeList.value === "finished")
const selectOrderList = (list) => {
  activeList.value = list
  emit("update:selected-order-status", "all")
}
watch(() => props.selectedOrderStatus, (status) => {
  if (status !== "all") activeList.value = status
}, { immediate: true })
const selectedAsset = ref("all")
const deadlineFrom = ref("")
const deadlineTo = ref("")
const invalidDeadlineRange = computed(() => Boolean(deadlineFrom.value && deadlineTo.value && deadlineFrom.value > deadlineTo.value))
const pendingSearch = ref(props.orderSearchTerm)
const pageSize = ref(10)
const currentPage = ref(1)
const pendingFocusOrderId = ref("")
const ordersTableWrap = ref(null)
const isTableExpanded = ref(false)
const expandTableButton = ref(null)
const toggleTableExpanded = async () => {
  const position = { top: ordersTableWrap.value?.scrollTop || 0, left: ordersTableWrap.value?.scrollLeft || 0 }
  isTableExpanded.value = !isTableExpanded.value
  await nextTick()
  if (ordersTableWrap.value) {
    ordersTableWrap.value.scrollTop = position.top
    ordersTableWrap.value.scrollLeft = position.left
  }
  expandTableButton.value?.focus({ preventScroll: true })
}
const closeExpandedTable = (event) => {
  if (event.key !== "Escape" || !isTableExpanded.value || event.defaultPrevented || event.target.closest?.('[aria-modal="true"]')) return
  event.preventDefault()
  void toggleTableExpanded()
}
onMounted(() => document.addEventListener("keydown", closeExpandedTable))
onActivated(() => document.addEventListener("keydown", closeExpandedTable))
onDeactivated(() => {
  document.removeEventListener("keydown", closeExpandedTable)
  isTableExpanded.value = false
})
onBeforeUnmount(() => document.removeEventListener("keydown", closeExpandedTable))
const assetOptions = computed(() => [
  ...new Set(props.filteredWorkOrders.map(({ plate }) => plate)),
])
const matchesDeadlineFilter = (order) => {
  if (!isHistory.value) return true
  if (!deadlineFrom.value && !deadlineTo.value) return true
  if (invalidDeadlineRange.value) return false
  const deadline = parseOrderDate(order.closedAt)
  if (!deadline) return false
  deadline.setHours(0, 0, 0, 0)
  const from = parseOrderDate(deadlineFrom.value)
  const to = parseOrderDate(deadlineTo.value)
  if (from) from.setHours(0, 0, 0, 0)
  if (to) to.setHours(23, 59, 59, 999)
  return (!from || deadline >= from) && (!to || deadline <= to)
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
  { id: "open", label: "Todas", count: countStatus(["scheduled", "waiting", "in-progress"]) },
  { id: "scheduled", label: "Por iniciar", count: countStatus(["scheduled"]) },
  { id: "in-progress", label: "En ejecucion", count: countStatus(["in-progress"]) },
  { id: "waiting", label: "En espera", count: countStatus(["waiting"]) },
])
const tabFilteredOrders = computed(() =>
  assetFilteredOrders.value.filter(
    (order) => matchesWorkOrderList(order.status, activeList.value),
  ),
)
const pagination = computed(() => getWorkOrderPage(tabFilteredOrders.value, currentPage.value, pageSize.value))
const displayedOrders = computed(() => pagination.value.rows)
watch([activeList, selectedAsset, deadlineFrom, deadlineTo, pendingSearch, pageSize], () => { currentPage.value = 1 })
watch(() => pagination.value.pageCount, () => { currentPage.value = pagination.value.page })
watch(currentPage, () => {
  if (ordersTableWrap.value) ordersTableWrap.value.scrollTop = 0
}, { flush: "sync" })
const summaryMetrics = computed(() => [
  {
    label: "OT abiertas",
    value: orderStatistics.value.openCount,
  },
  {
    label: "OT vencidas",
    value: orderStatistics.value.overdueCount,
  },
  {
    label: "En ejecucion",
    value: countStatus(["in-progress"]),
  },
  {
    label: "En espera",
    value: countStatus(["waiting"]),
  },
])
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
  deadlineFrom.value = ""
  deadlineTo.value = ""
  if (!isHistory.value) activeList.value = "open"
  emit("update:order-search-term", "")
  emit("update:selected-order-status", "all")
}
const openWorkOrderActionModal = (orderId, modalType, status = "") =>
  emit("open-work-order-action-modal", orderId, modalType, status)
const runNextOrderAction = (order) => {
  const action = getWorkOrderNextAction(order.status)
  if (action) openWorkOrderActionModal(order.id, action.modal, action.status)
}
const formatCreatedDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-CL") : "17/08/2026"
const formatClosedDate = (value) => parseOrderDate(value)?.toLocaleDateString("es-CL") || "Sin cierre registrado"
watch(pendingSearch, (value) => emit("update:order-search-term", value))
watch(
  () => props.focusedOrderId,
  async (orderId) => {
    if (!orderId) return

    clearLocalFilters()
    await nextTick()
    const target = props.workOrders.find((order) => String(order.id) === String(orderId)) || props.filteredWorkOrders.find((order) => String(order.id) === String(orderId))
    if (target) activeList.value = target.status === 'finished' ? 'finished' : 'open'
    pendingFocusOrderId.value = String(orderId)
  },
  { immediate: true },
)
watch([tabFilteredOrders, pendingFocusOrderId], async () => {
  const id = pendingFocusOrderId.value
  if (!id) return
  const index = tabFilteredOrders.value.findIndex((order) => String(order.id) === id)
  if (index < 0) return
  currentPage.value = Math.floor(index / Number(pageSize.value)) + 1
  await nextTick()
  if (pendingFocusOrderId.value !== id) return
  const row = [...(ordersTableWrap.value?.querySelectorAll('[data-order-id]') || [])].find((element) => element.dataset.orderId === id)
  row?.scrollIntoView({ block: 'nearest' })
  pendingFocusOrderId.value = ""
}, { flush: "post" })
watch(
  () => props.workOrders.map((order) => order.id),
  (current, previous) => {
    if (current.some((id) => !previous.includes(id))) {
      selectedAsset.value = "all"
      activeList.value = "open"
      currentPage.value = 1
    }
  },
)
</script>

<style scoped>
.orders-view .orders-table-wrap footer button { display: inline-flex; align-items: center; justify-content: center; width: 32px; padding: 0; }
.orders-table-wrap footer button :deep(svg) { width: 16px; height: 16px; }
.orders-table-wrap footer button:disabled { opacity: 0.4; cursor: not-allowed; }
.orders-table-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.orders-controls .expand-table-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; flex-shrink: 0; }
.expand-table-button :deep(svg) { width: 16px; height: 16px; }
.orders-view.is-table-expanded {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100dvh;
  min-height: 0;
  padding: 16px;
  background: #f4f7fb;
  overflow: hidden;
}
.is-table-expanded .orders-metrics, .is-table-expanded .orders-filters { display: none; }
.is-table-expanded .orders-toolbar { display: contents; }
.is-table-expanded .orders-table-wrap { height: auto; min-height: 0; }
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
.orders-toolbar { border: 1px solid #d8e0eb; border-radius: 8px; background: #fff; min-width: 0; }
.order-count { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 20px; margin-left: 5px; padding: 0 5px; border-radius: 4px; background: #eef4ff; color: #345284; font-size: 11px; }
.orders-filters {
  display: grid;
  grid-template-columns: minmax(260px, 1.5fr) minmax(160px, .7fr) auto;
  align-items: end;
  gap: 10px;
  background: #fff;
  padding: 14px;
}
.orders-filters.is-history { grid-template-columns: minmax(260px, 1.5fr) minmax(160px, .7fr) repeat(2, minmax(150px, .5fr)) auto; }
.orders-sections { grid-column: 1 / -1; display: flex; gap: 20px; border-bottom: 1px solid #d8e0eb; margin-bottom: 4px; }
.orders-filters .orders-sections button { border: 0; border-radius: 0; padding: 0 4px; background: transparent; cursor: pointer; }
.orders-filters .orders-sections button.active { border-bottom: 2px solid #ff6600; }
.orders-date-error { grid-column: 1 / -1; margin: 0; color: #b42318; font-size: 12px; }
.orders-filters input[aria-invalid="true"] { border-color: #b42318; }
.orders-filters label {
  min-width: 0;
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
  min-width: 0;
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
  padding: 0 14px 8px;
}
.orders-controls nav { display: flex; align-items: center; gap: 6px; padding: 0; }
.orders-controls nav button { white-space: nowrap; cursor: pointer; }
.orders-table-tools { margin-left: auto; }
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
  border-bottom: 2px solid #ff6600;
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
.row-actions .order-next-action { min-width: 120px; white-space: nowrap; border-color: #c8d7f5; background: #eef4ff; font-weight: 700; }
.row-actions .order-next-action:hover { background: #e1ebff; }
.row-actions select {
  min-width: 118px;
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
    grid-template-rows: auto auto minmax(0, 1fr);
  }
  .orders-table-wrap {
    height: auto;
    min-height: 0;
  }
}
@media (max-width: 1200px) {
  .orders-filters, .orders-filters.is-history {
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
  .orders-filters, .orders-filters.is-history {
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
