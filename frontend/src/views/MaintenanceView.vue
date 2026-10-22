<template>
  <section class="maintenance-view h-full min-h-0 bg-[#f4f7fb] text-slate-900">
    <div class="flex h-full min-h-0 flex-col">
      <nav class="maintenance-module-nav" aria-label="Vistas de mantenciones">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
          @pointerenter="prepareMaintenanceTab(tab.id)"
          @focus="prepareMaintenanceTab(tab.id)"
        >
          {{ tab.label }}
        </button>
        <div v-if="activeTab === 'overview'" class="maintenance-module-actions">
          <span>{{ maintenanceItems.length }} vehiculos</span>
          <button type="button" @click="openFleetExport">Exportar</button>
          <button type="button" @click="openMaintenanceModal('maintenance-type')">
            Tipos de mantención
          </button>
          <button type="button" class="primary" @click="openMaintenanceModal('maintenance')">
            + Nuevo plan de mantención
          </button>
        </div>
        <div v-else-if="activeTab === 'costs'" class="maintenance-module-actions analysis-actions">
          <select v-model="analysisPeriod" aria-label="Periodo de analisis">
            <option :value="6">Ultimos 6 meses</option>
            <option :value="12">Ultimos 12 meses</option>
          </select>
          <button type="button" class="primary" @click="openMaintenanceModal('export')">
            Exportar
          </button>
        </div>
      </nav>

      <header
        v-if="activeTab !== 'overview' && activeTab !== 'costs' && activeTab !== 'drivers'"
        class="shrink-0 border-b border-[#d8e0eb] bg-white px-4 py-3 sm:px-5"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div v-if="activeTab === 'orders'" class="maintenance-analysis-sections">
            <button
              type="button"
              :class="{ active: orderSection === 'work-orders' }"
              @click="orderSection = 'work-orders'"
            >
              Órdenes de trabajo
            </button>
            <button
              type="button"
              :class="{ active: orderSection === 'without-order' }"
              @click="orderSection = 'without-order'"
            >
              Pendientes de OT
            </button>
          </div>
          <div v-else class="flex items-center gap-2 text-[12px] font-black">
            <span class="text-[#102372]">Mantenciones</span><span class="text-slate-300">/</span
            ><span class="text-slate-500">{{ activeCompanyLabel }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="mr-2 text-[10px] font-bold text-slate-500"
              >{{ maintenanceItems.length }} vehiculos</span
            >
            <button
              type="button"
              class="maintenance-header-button"
              @click="openMaintenanceModal('maintenance')"
            >
              + Nuevo plan de mantención
            </button>
            <button
              type="button"
              class="maintenance-header-button"
              @click="openMaintenanceModal('maintenance-type')"
            >
              Tipos de mantención
            </button>
            <button
              type="button"
              class="maintenance-header-button is-primary"
              @click="openCreateWorkOrder()"
            >
              Nueva OT
            </button>
          </div>
        </div>

        <div
          v-if="maintenanceFeedbackMessage"
          class="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700"
        >
          {{ maintenanceFeedbackMessage }}
          <button
            v-if="closedPlanRenewal"
            type="button"
            class="ml-3 rounded border border-emerald-700 px-3 py-1"
            @click="openRenewMaintenance(closedPlanRenewal.vehicleId, closedPlanRenewal.planId)"
          >
            Renovar ahora
          </button>
        </div>

        <div
          v-if="activeTab === 'calendar' || activeTab === 'history'"
          class="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5"
        >
          <button
            v-for="metric in currentSummaryMetrics"
            :key="metric.key"
            type="button"
            class="rounded-lg border bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#ff6600]/45"
            :class="
              metric.filter && selectedStatus === metric.filter
                ? 'border-[#ff6600]'
                : 'border-[#dfe5ed]'
            "
            @click="applyMetricFilter(metric.filter)"
          >
            <span class="flex items-center justify-between gap-3">
              <span class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                {{ metric.label }}
              </span>
              <span class="h-2 w-2 rounded-full" :class="metric.dotClass"></span>
            </span>

            <span class="mt-2 block text-[24px] font-black leading-none text-[#102372]">
              {{ metric.value }}
            </span>

            <span class="mt-1 block text-[11px] font-bold text-slate-500">
              {{ metric.detail }}
            </span>
          </button>
        </div>

        <div
          v-if="activeTab === 'calendar' || activeTab === 'history'"
          class="mt-4 grid gap-2 xl:grid-cols-[minmax(260px,420px)_160px_180px_190px_auto]"
        >
          <label class="group relative min-w-0">
            <span
              class="pointer-events-none absolute left-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md bg-[#eef3ff] text-[#102372] transition group-focus-within:bg-[#102372] group-focus-within:text-white"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </span>

            <input
              v-model="searchTerm"
              type="search"
              placeholder="Buscar por patente, vehiculo, OT o taller..."
              class="h-10 w-full rounded-lg border border-[#cfd8e6] bg-white pl-11 pr-3 text-[12px] font-bold text-[#172033] shadow-sm outline-none transition placeholder:text-slate-400 hover:border-[#b9c5d6] focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
            />
          </label>

          <label class="maintenance-select">
            <span>Estado</span>
            <select v-model="selectedStatus">
              <option value="all">Todos</option>
              <option v-for="filter in statusFilters" :key="filter.value" :value="filter.value">
                {{ filter.label }}
              </option>
            </select>
          </label>

          <label class="maintenance-select">
            <span>Tipo</span>
            <select v-model="selectedType">
              <option value="all">Todos</option>
              <option v-for="type in maintenanceTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </label>

          <label class="maintenance-select">
            <span>Taller / proveedor</span>
            <select v-model="selectedWorkshop">
              <option value="all">Todos</option>
              <option v-for="workshop in workshopOptions" :key="workshop" :value="workshop">
                {{ workshop }}
              </option>
            </select>
          </label>

          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dfe5ed] bg-white px-3 text-[11px] font-black text-slate-500 shadow-sm transition hover:border-[#102372]/25 hover:text-[#102372]"
            @click="clearFilters"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M4 12a8 8 0 0 1 13.66-5.66M20 12a8 8 0 0 1-13.66 5.66M8 5H4V1M16 19h4v4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Limpiar filtros
          </button>
        </div>
      </header>

      <main
        ref="maintenanceMain"
        class="min-h-0 flex-1"
        :class="
          activeTab === 'overview'
            ? 'overflow-hidden p-0'
            : [
                'overflow-y-auto px-4 py-4 sm:px-6',
                {
                  'maintenance-drivers-main': activeTab === 'drivers',
                  'maintenance-analysis-main': activeTab === 'costs',
                  'maintenance-work-orders-main':
                    activeTab === 'orders' && orderSection === 'work-orders',
                },
              ]
        "
      >
        <KeepAlive :max="1">
          <MaintenanceDriversTab
            v-if="activeTab === 'drivers'"
            :key="String(route.params.empresaId || '')"
            :company-id="String(route.params.empresaId || '')"
            :company-name="activeCompanyLabel"
          />
        </KeepAlive>
        <KeepAlive :key="String(route.params.empresaId || '')" :max="6">
        <MaintenanceOverviewTab
          ref="fleetTable"
          :get-order-status-label="getOrderStatusLabel"
          v-if="activeTab === 'overview'"
          :filtered-maintenance-items="filteredMaintenanceItems"
          :get-status-class="getStatusClass"
          :get-status-icon-class="getStatusIconClass"
          :get-status-label="getStatusLabel"
          :get-status-text-class="getStatusTextClass"
          :get-summary-metric-card-class="getSummaryMetricCardClass"
          :get-summary-metric-icon="getSummaryMetricIcon"
          :get-vehicle-maintenance-plans="getVehicleMaintenancePlans"
          :has-hour-meter-data="hasHourMeterData"
          :maintenance-items="maintenanceItems"
          :maintenance-summary-metrics="maintenanceSummaryMetrics"
          :maintenance-types="maintenanceTypes"
          :active-company-label="activeCompanyLabel"
          :open-order-count="visibleWorkOrders.length"
          :work-orders="workOrders"
          :overview-maintenance-items="overviewMaintenanceItems"
          :search-term="searchTerm"
          :selected-status="selectedStatus"
          :selected-type="selectedType"
          :selected-workshop="selectedWorkshop"
          :status-filters="statusFilters"
          :workshop-options="workshopOptions"
          @apply-metric-filter="applyMetricFilter"
          @clear-filters="clearFilters"
          @configure-maintenance="configureVehicleMaintenance"
          @create-work-order="openCreateWorkOrder"
          @open-orders="activeTab = 'orders'"
          @open-vehicle-costs="openVehicleCosts"
          @open-vehicle-maintenance-plans="openVehicleMaintenancePlans"
          @open-work-order="openOrderInTable"
          @renew-maintenance="openRenewMaintenance"
          @update:search-term="searchTerm = $event"
          @update:selected-status="selectedStatus = $event"
          @update:selected-type="selectedType = $event"
          @update:selected-workshop="selectedWorkshop = $event"
        />

        <MaintenanceWorkOrdersTab
          v-else-if="activeTab === 'orders' && orderSection === 'work-orders'"
          :filtered-work-orders="filteredWorkOrders"
          :get-order-status-class="getOrderStatusClass"
          :get-order-status-icon="getOrderStatusIcon"
          :get-order-status-icon-class="getOrderStatusIconClass"
          :get-order-status-label="getOrderStatusLabel"
          :get-order-summary-metric-class="getOrderSummaryMetricClass"
          :get-priority-class="getPriorityClass"
          :get-task-status-class="getTaskStatusClass"
          :order-priority-options="orderPriorityOptions"
          :order-search-term="orderSearchTerm"
          :order-status-filters="orderStatusFilters"
          :order-summary-metrics="orderSummaryMetrics"
          :selected-order="selectedOrder"
          :focused-order-id="focusedOrderId"
          :selected-order-details="selectedOrderDetails"
          :selected-order-priority="selectedOrderPriority"
          :selected-order-status="selectedOrderStatus"
          :selected-order-task-rows="selectedOrderTaskRows"
          :selected-order-vehicle="selectedOrderVehicle"
          :selected-order-workshop="selectedOrderWorkshop"
          :visible-work-orders="visibleWorkOrders"
          :work-order-workshop-options="workOrderWorkshopOptions"
          @apply-order-metric-filter="applyOrderMetricFilter"
          @clear-order-filters="clearOrderFilters"
          @open-maintenance-modal="openMaintenanceModal"
          @open-order-cost="openWorkOrderCostModal"
          @open-work-order-action-modal="openWorkOrderActionModal"
          @open-work-order-vehicle-maintenance-plans="openWorkOrderVehicleMaintenancePlans"
          @select-work-order="selectWorkOrder"
          @update:order-search-term="orderSearchTerm = $event"
          @update:selected-order-priority="selectedOrderPriority = $event"
          @update:selected-order-status="selectedOrderStatus = $event"
          @update:selected-order-workshop="selectedOrderWorkshop = $event"
        />

        <MaintenanceCostsTab
          v-else-if="activeTab === 'orders' && orderSection === 'without-order'"
          key="without-order"
          :maintenance-items="maintenanceItems"
          :maintenance-types="maintenanceTypes"
          :get-vehicle-maintenance-plans="getVehicleMaintenancePlans"
          :work-orders="workOrders"
          section="without-order"
          @create-work-order="openCreateWorkOrder"
          @filter-maintenance-status="openFleetWithStatus"
          @filter-maintenance-vehicle="openFleetWithVehicle"
          @filter-work-orders="openOrdersWithStatus"
          @open-export="openMaintenanceModal('export')"
        />

        <MaintenanceCalendarTab
          v-else-if="activeTab === 'calendar'"
          :calendar-days="calendarDays"
          :get-order-status-class="getOrderStatusClass"
          :upcoming-orders="upcomingOrders"
          :week-days="weekDays"
        />

        <MaintenanceHistoryTab
          v-else-if="activeTab === 'history'"
          :lifecycle-steps="lifecycleSteps"
          :maintenance-history="maintenanceHistory"
          :selected-vehicle="selectedVehicle"
          @open-costs="activeTab = 'costs'"
          @open-orders="activeTab = 'orders'"
          @open-export="openMaintenanceModal('export')"
        />

        <MaintenanceCostsTab
          v-else-if="activeTab === 'costs'"
          key="analysis"
          :maintenance-items="maintenanceItems"
          :maintenance-types="maintenanceTypes"
          :get-vehicle-maintenance-plans="getVehicleMaintenancePlans"
          :period-months="analysisPeriod"
          :work-orders="workOrders"
          section="summary"
          @create-work-order="openCreateWorkOrder"
          @filter-maintenance-status="openFleetWithStatus"
          @filter-maintenance-vehicle="openFleetWithVehicle"
          @filter-work-orders="openOrdersWithStatus"
          @open-export="openMaintenanceModal('export')"
          @update:period-months="analysisPeriod = $event"
        />
        </KeepAlive>
      </main>
    </div>

    <MaintenanceFleetExportModal
      v-if="fleetExportRows"
      :rows="fleetExportRows"
      :initial-ids="fleetExportInitialIds"
      :busy="isExportingFleet"
      :error="fleetExportError"
      @close="closeFleetExport"
      @export="exportFleet"
    />
    <MaintenanceActionModal
      v-if="activeMaintenanceModal"
      :key="`${activeMaintenanceModal}-${selectedVehicle?.id || 'none'}`"
      :get-maintenance-plan-details="getMaintenancePlanDetails"
      :get-maintenance-plan-pill-class="getMaintenancePlanPillClass"
      :get-maintenance-plan-status-class="getMaintenancePlanStatusClass"
      :get-maintenance-plan-status-message="getMaintenancePlanStatusMessage"
      :get-order-status-label="getOrderStatusLabel"
      :get-status-label="getStatusLabel"
      :get-summary-metric-icon="getSummaryMetricIcon"
      :is-base-maintenance-plan="isBaseMaintenancePlan"
      :is-maintenance-template-used="isMaintenanceTemplateUsed"
      :maintenance-items="maintenanceItems"
      :maintenance-reading-sources="maintenanceReadingSources"
      :maintenance-type-criterion-options="maintenanceTypeCriterionOptions"
      :maintenance-types="maintenanceTypes"
      :modal-action-message="modalActionMessage"
      :maintenance-type-origins="maintenanceTypeOrigins"
      :maintenance-type-reading-sources="maintenanceTypeReadingSources"
      :modal-description="modalDescription"
      :modal-draft="modalDraft"
      :modal-kicker="modalKicker"
      :modal-primary-action="modalPrimaryAction"
      :modal-title="modalTitle"
      :modal-type="activeMaintenanceModal"
      :modal-vehicle-maintenance-plans="modalVehicleMaintenancePlans"
      :order-priority-options="orderPriorityOptions"
      :order-status-filters="orderStatusFilters"
      :selected-vehicle="selectedVehicle"
      :selected-vehicle-maintenance-plans="selectedVehicleMaintenancePlans"
      :status-filters="statusFilters"
      :work-orders="workOrders"
      :cleanup-evidence="cleanupMaintenanceEvidence"
      @close="closeMaintenanceModal"
      @create-work-order-from-maintenance-plan="
        (plan) => openCreateWorkOrder(plan.vehicleId || selectedVehicle.id, plan.id, plan.name)
      "
      @delete-maintenance-type="deleteMaintenanceType"
      @open-delete-maintenance-plan="openDeleteMaintenancePlan"
      @open-edit-maintenance-plan="openEditMaintenancePlan"
      @open-maintenance-modal="openMaintenanceModal"
      @open-order-in-table="openOrderInTable"
      @edit-before-renewal="editBeforeRenewal"
      @renew-maintenance="openRenewMaintenance"
      @submit="submitMaintenanceModal"
      @sync-maintenance-type-draft="syncMaintenanceTypeDraft"
      @sync-maintenance-vehicle-draft="syncMaintenanceVehicleDraft"
      @sync-order-maintenance-plan-draft="syncOrderMaintenancePlanDraft"
      @sync-order-vehicle-draft="syncOrderVehicleDraft"
      @update-maintenance-type="updateMaintenanceType"
    />
  </section>
</template>

<script setup>
import { defineAsyncComponent, nextTick, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

import MaintenanceTabLoading from "../components/maintenance/MaintenanceTabLoading.vue"
import MaintenanceOverviewTab from "../components/maintenance/MaintenanceFleetTab.vue"
import MaintenanceDriversTab from "../components/maintenance/MaintenanceDriversTab.vue"
import MaintenanceWorkOrdersTab from "../components/maintenance/MaintenanceWorkOrdersTab.vue"
import MaintenanceCostsTab from "../components/maintenance/MaintenanceCostsTab.vue"
import { useMaintenanceModule } from "../composables/maintenance/useMaintenanceModule.js"
import "../components/maintenance/maintenance.css"
import { useAccessService } from "../services/access/useAccessService.js"

const loadMaintenanceActionModal = () =>
  import("../components/maintenance/MaintenanceActionModal.vue")

const MaintenanceActionModal = defineAsyncComponent(loadMaintenanceActionModal)
const maintenanceTabLoaders = {
  history: () => import("../components/maintenance/MaintenanceHistoryTab.vue"),
  calendar: () => import("../components/maintenance/MaintenanceCalendarTab.vue"),
}
const asyncMaintenanceTab = (loader) =>
  defineAsyncComponent({ loader, loadingComponent: MaintenanceTabLoading, delay: 100 })
const MaintenanceHistoryTab = asyncMaintenanceTab(maintenanceTabLoaders.history)
const MaintenanceCalendarTab = asyncMaintenanceTab(maintenanceTabLoaders.calendar)
const prepareMaintenanceTab = (id) => {
  if (maintenanceTabLoaders[id]) void maintenanceTabLoaders[id]().catch(() => {})
}
const MaintenanceFleetExportModal = defineAsyncComponent(
  () => import("../components/maintenance/MaintenanceFleetExportModal.vue"),
)

const route = useRoute()
const router = useRouter()
const orderSection = ref("work-orders")
const focusedOrderId = ref("")
const maintenanceMain = ref(null)
const analysisPeriod = ref(6)
const fleetTable = ref(null)
const fleetExportRows = ref(null)
const fleetExportInitialIds = ref([])
const openFleetExport = () => {
  fleetExportError.value = ""
  fleetExportInitialIds.value = (fleetTable.value?.getExportRows() || []).map((row) => row.id)
  fleetExportRows.value = fleetTable.value?.getExportRows(true) || []
}
const closeFleetExport = () => {
  if (!isExportingFleet.value) fleetExportRows.value = null
}
const isExportingFleet = ref(false)
const fleetExportError = ref("")
const exportFleet = async ({ format, rows }) => {
  if (isExportingFleet.value) return
  fleetExportError.value = ""
  if (!rows?.length) {
    fleetExportError.value = "No hay vehiculos para exportar."
    return
  }
  isExportingFleet.value = true
  try {
    const context = {
      company: activeCompanyLabel.value,
      reportWidthPx: Math.max(
        1000,
        Math.min(2560, (window.screen?.availWidth || window.innerWidth) - 24),
      ),
    }
    if (format === "pdf") {
      const { exportMaintenanceFleetPdf } =
        await import("../services/maintenance/maintenanceFleetPdfExportService.js")
      await exportMaintenanceFleetPdf(rows, context)
    } else {
      const { exportMaintenanceFleetExcel } =
        await import("../services/maintenance/maintenanceFleetExportService.js")
      await exportMaintenanceFleetExcel(rows, context)
    }
    fleetExportRows.value = null
  } catch {
    fleetExportError.value = "No fue posible exportar la flota. Intenta nuevamente."
  } finally {
    isExportingFleet.value = false
  }
}
const { assets, companies } = useAccessService()

const {
  activeTab,
  activeCompanyLabel,
  activeMaintenanceModal,
  applyMetricFilter,
  applyOrderMetricFilter,
  calendarDays,
  clearFilters,
  clearOrderFilters,
  closeMaintenanceModal,
  cleanupMaintenanceEvidence,
  maintenanceTypeOrigins,
  maintenanceTypeReadingSources,
  createWorkOrderFromMaintenancePlan,
  deleteMaintenanceType,
  currentSummaryMetrics,
  filteredMaintenanceItems,
  filteredWorkOrders,
  getMaintenancePlanDetails,
  getMaintenancePlanPillClass,
  getMaintenancePlanStatusClass,
  getMaintenancePlanStatusMessage,
  getOrderStatusClass,
  getOrderStatusIcon,
  getOrderStatusIconClass,
  getOrderStatusLabel,
  getOrderSummaryMetricClass,
  getPriorityClass,
  getStatusClass,
  getStatusIconClass,
  getStatusLabel,
  getStatusTextClass,
  getSummaryMetricCardClass,
  getSummaryMetricIcon,
  getVehicleMaintenancePlans,
  getTaskStatusClass,
  hasHourMeterData,
  isBaseMaintenancePlan,
  isMaintenanceTemplateUsed,
  lifecycleSteps,
  maintenanceFeedbackMessage,
  closedPlanRenewal,
  maintenanceHistory,
  maintenanceItems,
  maintenanceReadingSources,
  maintenanceSummaryMetrics,
  maintenanceTypeCriterionOptions,
  maintenanceTypes,
  modalActionMessage,
  modalDescription,
  modalDraft,
  modalKicker,
  modalPrimaryAction,
  modalTitle,
  modalVehicleMaintenancePlans,
  openDeleteMaintenancePlan,
  openCreateWorkOrder,
  openEditMaintenancePlan,
  openMaintenanceModal,
  openRenewMaintenance,
  openWorkOrderCostModal,
  openVehicleCosts,
  openVehicleMaintenancePlans,
  openWorkOrderActionModal,
  openWorkOrderVehicleMaintenancePlans,
  editBeforeRenewal,
  orderPriorityOptions,
  orderSearchTerm,
  orderStatusFilters,
  orderSummaryMetrics,
  overviewMaintenanceItems,
  searchTerm,
  selectWorkOrder,
  selectedOrder,
  selectedOrderDetails,
  selectedOrderPriority,
  selectedOrderStatus,
  selectedOrderTaskRows,
  selectedOrderVehicle,
  selectedOrderWorkshop,
  selectedStatus,
  selectedType,
  selectedVehicle,
  selectedVehicleMaintenancePlans,
  selectedWorkshop,
  statusFilters,
  submitMaintenanceModal,
  updateMaintenanceType,
  syncMaintenanceTypeDraft,
  syncMaintenanceVehicleDraft,
  syncOrderMaintenancePlanDraft,
  syncOrderVehicleDraft,
  tabs,
  upcomingOrders,
  visibleWorkOrders,
  workOrders,
  weekDays,
  workOrderWorkshopOptions,
  workshopOptions,
} = useMaintenanceModule({
  assets,
  companies,
  route,
})

const configureVehicleMaintenance = (vehicleId) => {
  openVehicleMaintenancePlans(vehicleId)
  openMaintenanceModal("maintenance", "maintenance-detail")
}

const openOrderInTable = async (orderId) => {
  closeMaintenanceModal()
  clearOrderFilters()
  selectWorkOrder(orderId)
  focusedOrderId.value = orderId
  orderSection.value = "work-orders"
  activeTab.value = "orders"
  await nextTick()
  maintenanceMain.value?.scrollTo({ top: 0 })
}

const openFleetWithStatus = (status) => {
  selectedStatus.value = status
  activeTab.value = "overview"
}

const openFleetWithVehicle = (plate) => {
  clearFilters()
  searchTerm.value = plate
  activeTab.value = "overview"
}

const openOrdersWithStatus = (status) => {
  clearOrderFilters()
  selectedOrderStatus.value = status
  orderSection.value = "work-orders"
  activeTab.value = "orders"
}

watch(maintenanceFeedbackMessage, (message, _previousMessage, onCleanup) => {
  if (!message) return

  const timeout = setTimeout(() => {
    maintenanceFeedbackMessage.value = ""
  }, 6000)

  onCleanup(() => clearTimeout(timeout))
})

watch(orderSection, async () => {
  await nextTick()
  maintenanceMain.value?.scrollTo({ top: 0 })
})
watch(
  () => route.query.tab,
  (value) => {
    if (tabs.some((tab) => tab.id === value)) activeTab.value = value
  },
  { immediate: true },
)
watch(activeTab, (value) => {
  if (route.query.tab !== value) void router.replace({ query: { ...route.query, tab: value } })
})
</script>

<style scoped>
.maintenance-drivers-main {
  padding-bottom: 12px;
  overflow: hidden;
}
@media (max-width: 600px) {
  .maintenance-drivers-main {
    overflow-y: auto;
  }
}
.maintenance-view :deep(button:not(:disabled)),
.maintenance-view :deep(select:not(:disabled)),
.maintenance-view :deep([role="button"]:not([aria-disabled="true"])) {
  cursor: pointer;
}

.maintenance-view :deep(button:disabled),
.maintenance-view :deep(select:disabled),
.maintenance-view :deep([aria-disabled="true"]) {
  cursor: not-allowed;
}

.maintenance-module-nav {
  display: flex;
  min-height: 64px;
  align-items: flex-end;
  gap: 0.25rem;
  border-bottom: 1px solid #d8e0eb;
  background: #f7f9fc;
  padding: 0 1.5rem;
}
.maintenance-module-actions {
  display: flex;
  height: 100%;
  align-items: center;
  gap: 0.55rem;
  margin-left: auto;
}
.maintenance-module-actions span {
  margin-right: 0.35rem;
  color: #526b94;
  font-size: 11px;
  font-weight: 700;
}
.maintenance-module-nav .maintenance-module-actions button {
  min-width: auto;
  height: 34px;
  border: 1px solid #cfd8e6;
  border-radius: 7px;
  background: #fff;
  padding: 0 0.85rem;
  color: #102372;
  white-space: nowrap;
}
.maintenance-module-nav .maintenance-module-actions button.primary {
  border-color: #ff6600;
  background: #ff6600;
  color: #fff;
}
.maintenance-module-nav .analysis-actions select {
  width: 180px;
  height: 34px;
  border: 1px solid #cfd8e6;
  border-radius: 7px;
  background: #fff;
  padding: 0 12px;
  color: #102372;
  font-size: 12px;
  font-weight: 800;
}
.maintenance-module-nav .analysis-actions button.primary {
  min-width: 126px;
  border-color: #102372;
  background: #102372;
}
.maintenance-module-nav button {
  min-width: 112px;
  height: 44px;
  border-bottom: 2px solid transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}
.maintenance-module-nav button:hover {
  color: #102372;
}
.maintenance-module-nav button.active {
  border-bottom-color: #ff6600;
  color: #102372;
}
.maintenance-header-button {
  display: inline-flex;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border: 1px solid #cfd8e6;
  border-radius: 0.4rem;
  background: #fff;
  padding: 0 0.8rem;
  color: #102372;
  font-size: 0.68rem;
  font-weight: 900;
  white-space: nowrap;
}
.maintenance-header-button.is-primary {
  border-color: #ff6600;
  background: #ff6600;
  color: #fff;
}
.maintenance-analysis-sections {
  display: flex;
  align-items: center;
  align-self: stretch;
  gap: 24px;
}
.maintenance-analysis-sections button {
  position: relative;
  height: 100%;
  border: 0;
  background: transparent;
  color: #536783;
  font-size: 12px;
  font-weight: 900;
}
.maintenance-analysis-sections button.active {
  color: #102372;
}
.maintenance-analysis-sections button.active::after {
  position: absolute;
  right: 0;
  bottom: -13px;
  left: 0;
  height: 2px;
  background: #ff6600;
  content: "";
}

@media (min-width: 761px) {
  .maintenance-work-orders-main {
    overflow-y: hidden !important;
  }
}

@media (max-width: 1100px) {
  .maintenance-module-nav {
    min-height: 0;
    flex-wrap: wrap;
    align-items: center;
    padding: 0 1rem;
  }

  .maintenance-module-nav > button {
    height: 48px;
  }

  .maintenance-module-actions {
    width: 100%;
    height: auto;
    justify-content: flex-end;
    margin-left: 0;
    border-top: 1px solid #e5eaf1;
    padding: 8px 0;
  }
}

@media (max-width: 640px) {
  .maintenance-module-nav {
    padding: 0 0.75rem;
  }

  .maintenance-module-nav > button {
    min-width: 0;
    flex: 1 1 0;
  }

  .maintenance-module-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .maintenance-module-actions span {
    grid-column: 1 / -1;
    margin: 0;
  }

  .maintenance-module-nav .maintenance-module-actions button {
    width: 100%;
    padding: 0 0.55rem;
  }

  .maintenance-module-actions .primary {
    grid-column: 1 / -1;
  }
}
</style>
