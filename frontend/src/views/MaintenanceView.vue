<template>
  <section class="h-full min-h-0 bg-[#f4f7fb] text-slate-900">
    <div class="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <header class="shrink-0 border-b border-[#d8e0eb] bg-white px-4 py-3 sm:px-5">
        <div class="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff6600]">
              Mantenciones
            </p>

            <h1 class="text-[22px] font-black leading-tight text-[#102372] sm:text-[24px]">
              Mantenciones
            </h1>

            <p class="mt-0.5 max-w-3xl text-[11px] font-bold leading-4 text-slate-500">
              Control y seguimiento de mantenciones por vehiculo para {{ activeCompanyLabel }}.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#cfd8e6] bg-white px-3 text-[11px] font-black text-[#102372] shadow-sm transition hover:border-[#102372]/35 hover:bg-[#eef3ff]"
              @click="activeTab = 'history'"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M5 5v14h14M8 15l3-3 3 2 4-6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Ver historial
            </button>

            <button
              type="button"
              class="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-[#e65c00]"
              @click="openMaintenanceModal('maintenance')"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  stroke-width="2.3"
                  stroke-linecap="round"
                />
              </svg>
              Crear mantencion
            </button>

            <button
              type="button"
              class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#ff6600]/35 bg-white px-3 text-[11px] font-black text-[#ff6600] shadow-sm transition hover:bg-[#fff7ed]"
              @click="openMaintenanceModal('maintenance-type')"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M12 5v14M5 12h14M6 6h12M6 18h12"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Nuevo tipo
            </button>
          </div>
        </div>

        <nav class="mt-3 flex gap-1 overflow-x-auto border-b border-[#edf1f5]">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="shrink-0 border-b-2 px-3 py-1.5 text-[11px] font-black transition"
            :class="
              activeTab === tab.id
                ? 'border-[#ff6600] text-[#102372]'
                : 'border-transparent text-slate-500 hover:text-[#102372]'
            "
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>

        <div
          v-if="maintenanceFeedbackMessage"
          class="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700"
        >
          {{ maintenanceFeedbackMessage }}
        </div>

        <div
          v-if="activeTab !== 'overview' && activeTab !== 'orders'"
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
          v-if="activeTab !== 'overview' && activeTab !== 'orders'"
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
        class="min-h-0"
        :class="
          activeTab === 'overview'
            ? 'overflow-hidden px-3 py-3 sm:px-4'
            : 'overflow-y-auto px-4 py-4 sm:px-6'
        "
      >
        <MaintenanceOverviewTab
          v-if="activeTab === 'overview'"
          :filtered-maintenance-items="filteredMaintenanceItems"
          :get-status-class="getStatusClass"
          :get-status-icon-class="getStatusIconClass"
          :get-status-label="getStatusLabel"
          :get-status-text-class="getStatusTextClass"
          :get-summary-metric-card-class="getSummaryMetricCardClass"
          :get-summary-metric-icon="getSummaryMetricIcon"
          :has-hour-meter-data="hasHourMeterData"
          :maintenance-items="maintenanceItems"
          :maintenance-summary-metrics="maintenanceSummaryMetrics"
          :maintenance-types="maintenanceTypes"
          :overview-maintenance-items="overviewMaintenanceItems"
          :search-term="searchTerm"
          :selected-status="selectedStatus"
          :selected-type="selectedType"
          :selected-workshop="selectedWorkshop"
          :status-filters="statusFilters"
          :workshop-options="workshopOptions"
          @apply-metric-filter="applyMetricFilter"
          @clear-filters="clearFilters"
          @open-vehicle-costs="openVehicleCosts"
          @open-vehicle-maintenance-plans="openVehicleMaintenancePlans"
          @select-vehicle="selectVehicle"
          @update:search-term="searchTerm = $event"
          @update:selected-status="selectedStatus = $event"
          @update:selected-type="selectedType = $event"
          @update:selected-workshop="selectedWorkshop = $event"
        />

        <MaintenanceWorkOrdersTab
          v-else-if="activeTab === 'orders'"
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
          @open-work-order-action-modal="openWorkOrderActionModal"
          @open-work-order-vehicle-maintenance-plans="openWorkOrderVehicleMaintenancePlans"
          @select-work-order="selectWorkOrder"
          @update:order-search-term="orderSearchTerm = $event"
          @update:selected-order-priority="selectedOrderPriority = $event"
          @update:selected-order-status="selectedOrderStatus = $event"
          @update:selected-order-workshop="selectedOrderWorkshop = $event"
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
          v-else
          :cost-form-fields="costFormFields"
          :cost-summary="costSummary"
          :display-cost-rows="displayCostRows"
          :selected-vehicle="selectedVehicle"
          @open-cost-modal="openMaintenanceModal('cost')"
          @open-costs="activeTab = 'costs'"
          @open-orders="activeTab = 'orders'"
          @open-export="openMaintenanceModal('export')"
        />
      </main>
    </div>

    <MaintenanceActionModal
      v-if="activeMaintenanceModal"
      :get-maintenance-plan-details="getMaintenancePlanDetails"
      :get-maintenance-plan-pill-class="getMaintenancePlanPillClass"
      :get-maintenance-plan-status-class="getMaintenancePlanStatusClass"
      :get-maintenance-plan-status-message="getMaintenancePlanStatusMessage"
      :get-status-label="getStatusLabel"
      :get-summary-metric-icon="getSummaryMetricIcon"
      :is-base-maintenance-plan="isBaseMaintenancePlan"
      :is-maintenance-template-used="isMaintenanceTemplateUsed"
      :maintenance-items="maintenanceItems"
      :maintenance-reading-sources="maintenanceReadingSources"
      :maintenance-type-criterion-options="maintenanceTypeCriterionOptions"
      :maintenance-types="maintenanceTypes"
      :modal-action-message="modalActionMessage"
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
      @close="closeMaintenanceModal"
      @create-work-order-from-maintenance-plan="createWorkOrderFromMaintenancePlan"
      @open-delete-maintenance-plan="openDeleteMaintenancePlan"
      @open-edit-maintenance-plan="openEditMaintenancePlan"
      @open-maintenance-modal="openMaintenanceModal"
      @submit="submitMaintenanceModal"
      @sync-maintenance-type-draft="syncMaintenanceTypeDraft"
      @sync-maintenance-vehicle-draft="syncMaintenanceVehicleDraft"
      @sync-order-maintenance-plan-draft="syncOrderMaintenancePlanDraft"
      @sync-order-vehicle-draft="syncOrderVehicleDraft"
    />
  </section>
</template>

<script setup>
import { defineAsyncComponent, onMounted } from "vue"
import { useRoute } from "vue-router"

import MaintenanceCalendarTab from "../components/maintenance/MaintenanceCalendarTab.vue"
import MaintenanceCostsTab from "../components/maintenance/MaintenanceCostsTab.vue"
import MaintenanceHistoryTab from "../components/maintenance/MaintenanceHistoryTab.vue"
import MaintenanceOverviewTab from "../components/maintenance/MaintenanceOverviewTab.vue"
import MaintenanceWorkOrdersTab from "../components/maintenance/MaintenanceWorkOrdersTab.vue"
import { useMaintenanceModule } from "../composables/maintenance/useMaintenanceModule.js"
import { preloadWhenIdle } from "../composables/ui/useIdlePreload.js"
import "../components/maintenance/maintenance.css"
import { useAccessService } from "../services/access/useAccessService.js"

const loadMaintenanceActionModal = () =>
  import("../components/maintenance/MaintenanceActionModal.vue")

const MaintenanceActionModal = defineAsyncComponent(loadMaintenanceActionModal)

const route = useRoute()
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
  costFormFields,
  costSummary,
  createWorkOrderFromMaintenancePlan,
  currentSummaryMetrics,
  displayCostRows,
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
  getTaskStatusClass,
  hasHourMeterData,
  isBaseMaintenancePlan,
  isMaintenanceTemplateUsed,
  lifecycleSteps,
  maintenanceFeedbackMessage,
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
  openEditMaintenancePlan,
  openMaintenanceModal,
  openVehicleCosts,
  openVehicleMaintenancePlans,
  openWorkOrderActionModal,
  openWorkOrderVehicleMaintenancePlans,
  orderPriorityOptions,
  orderSearchTerm,
  orderStatusFilters,
  orderSummaryMetrics,
  overviewMaintenanceItems,
  searchTerm,
  selectVehicle,
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
  syncMaintenanceTypeDraft,
  syncMaintenanceVehicleDraft,
  syncOrderMaintenancePlanDraft,
  syncOrderVehicleDraft,
  tabs,
  upcomingOrders,
  visibleWorkOrders,
  weekDays,
  workOrderWorkshopOptions,
  workshopOptions,
} = useMaintenanceModule({
  assets,
  companies,
  route,
})

onMounted(() => {
  preloadWhenIdle([loadMaintenanceActionModal])
})
</script>
