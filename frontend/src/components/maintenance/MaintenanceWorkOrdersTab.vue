<template>
  <section class="grid h-full min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-3">
    <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <h2 class="text-[20px] font-black leading-tight text-[#102372]">Ordenes de trabajo</h2>
        <p class="mt-0.5 text-[11px] font-bold text-slate-500">
          Crea, asigna y da seguimiento a las mantenciones programadas de la flota.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#cfd8e6] bg-white px-3 text-[11px] font-black text-[#102372] shadow-sm transition hover:border-[#102372]/35 hover:bg-[#eef3ff]"
          @click="openMaintenanceModal('export')"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Exportar
        </button>

        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-[#e65c00]"
          @click="openMaintenanceModal('order')"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2.3"
              stroke-linecap="round"
            />
          </svg>
          Nueva orden de trabajo
        </button>
      </div>
    </header>

    <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      <button
        v-for="metric in orderSummaryMetrics"
        :key="metric.key"
        type="button"
        class="maintenance-summary-card maintenance-order-metric-card"
        :class="getOrderSummaryMetricClass(metric)"
        @click="applyOrderMetricFilter(metric.filter)"
      >
        <span>
          <span class="block text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
            {{ metric.label }}
          </span>
          <span class="mt-1 block text-[24px] font-black leading-none text-[#102372]">
            {{ metric.value }}
          </span>
          <span class="mt-0.5 block text-[10px] font-bold text-slate-500">
            {{ metric.detail }}
          </span>
        </span>

        <span class="maintenance-summary-icon" :class="getOrderStatusIconClass(metric.key)">
          <SvgIcon :name="getOrderStatusIcon(metric.key)" />
        </span>
      </button>
    </div>

    <section class="rounded-xl border border-[#dfe5ed] bg-white p-2 shadow-sm">
      <div class="grid gap-2 xl:grid-cols-[minmax(280px,1fr)_160px_150px_190px_auto]">
        <label class="group relative min-w-0">
          <span
            class="pointer-events-none absolute left-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md bg-[#f2f5f9] text-slate-500 transition group-focus-within:bg-[#102372] group-focus-within:text-white"
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
            v-model="orderSearchModel"
            type="search"
            placeholder="Buscar por N OT, vehiculo, trabajo o taller..."
            class="h-9 w-full rounded-lg border border-[#cfd8e6] bg-white pl-11 pr-3 text-[12px] font-bold text-[#172033] outline-none transition placeholder:text-slate-400 hover:border-[#b9c5d6] focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
          />
        </label>

        <label class="maintenance-select">
          <span>Estado</span>
          <select v-model="selectedOrderStatusModel">
            <option value="all">Todos</option>
            <option v-for="filter in orderStatusFilters" :key="filter.value" :value="filter.value">
              {{ filter.label }}
            </option>
          </select>
        </label>

        <label class="maintenance-select">
          <span>Prioridad</span>
          <select v-model="selectedOrderPriorityModel">
            <option value="all">Todas</option>
            <option v-for="priority in orderPriorityOptions" :key="priority" :value="priority">
              {{ priority }}
            </option>
          </select>
        </label>

        <label class="maintenance-select">
          <span>Taller</span>
          <select v-model="selectedOrderWorkshopModel">
            <option value="all">Todos</option>
            <option v-for="workshop in workOrderWorkshopOptions" :key="workshop" :value="workshop">
              {{ workshop }}
            </option>
          </select>
        </label>

        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#dfe5ed] bg-white px-3 text-[11px] font-black text-slate-500 transition hover:border-[#102372]/25 hover:text-[#102372]"
          @click="clearOrderFilters"
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
    </section>

    <div class="grid min-h-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <article
        class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-xl border border-[#dfe5ed] bg-white shadow-sm"
      >
        <header class="flex items-center justify-between gap-3 border-b border-[#edf1f5] px-4 py-3">
          <div class="min-w-0">
            <h3 class="text-[14px] font-black text-[#102372]">Ordenes programadas</h3>
            <p class="mt-0.5 text-[11px] font-bold text-slate-500">
              Mostrando {{ visibleWorkOrders.length }} de {{ filteredWorkOrders.length }} ordenes.
            </p>
          </div>

          <span class="rounded-full bg-[#eef3ff] px-2.5 py-1 text-[10px] font-black text-[#102372]">
            Lista
          </span>
        </header>

        <div class="min-h-0 overflow-auto">
          <table class="w-full min-w-[980px] text-left">
            <thead
              class="bg-[#f8fafc] text-[10px] font-black uppercase tracking-[0.08em] text-slate-400"
            >
              <tr>
                <th class="w-[46px] px-4 py-3"></th>
                <th class="px-4 py-3">N OT</th>
                <th class="px-4 py-3">Vehiculo / trabajo</th>
                <th class="px-4 py-3">Taller / responsable</th>
                <th class="px-4 py-3">Fecha programada</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3">Prioridad</th>
                <th class="px-4 py-3 text-right">Costo</th>
                <th class="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-[#edf1f5]">
              <tr v-if="!filteredWorkOrders.length">
                <td class="px-4 py-8 text-center text-[12px] font-bold text-slate-500" colspan="9">
                  No hay ordenes para los filtros seleccionados.
                </td>
              </tr>

              <tr
                v-for="order in visibleWorkOrders"
                :key="order.id"
                class="cursor-pointer text-[12px] transition hover:bg-[#f8fafc]"
                :class="selectedOrder?.id === order.id ? 'bg-[#eef3ff]' : ''"
                @click="selectWorkOrder(order.id)"
              >
                <td class="px-4 py-3">
                  <span
                    class="block h-3.5 w-3.5 rounded-full border-2"
                    :class="
                      selectedOrder?.id === order.id
                        ? 'border-[#102372] bg-[#102372]'
                        : 'border-slate-300 bg-white'
                    "
                  ></span>
                </td>

                <td class="px-4 py-3">
                  <span class="block font-black text-blue-600">{{ order.id }}</span>
                  <span class="mt-0.5 block text-[10px] font-bold text-slate-500">
                    {{ order.type }}
                  </span>
                </td>

                <td class="px-4 py-3">
                  <span class="block font-black text-[#102372]">{{ order.plate }}</span>
                  <span class="mt-0.5 block text-[10px] font-bold text-slate-500">
                    {{ order.job }}
                  </span>
                </td>

                <td class="px-4 py-3">
                  <span class="block font-black text-slate-700">{{ order.workshop }}</span>
                  <span class="mt-0.5 block text-[10px] font-bold text-slate-500">
                    {{ order.owner }}
                  </span>
                </td>

                <td class="px-4 py-3">
                  <span class="block font-bold text-slate-600">{{ order.scheduledDate }}</span>
                  <span class="mt-0.5 block text-[10px] font-bold text-slate-400">
                    {{ order.scheduledTime }}
                  </span>
                </td>

                <td class="px-4 py-3">
                  <span
                    class="inline-flex rounded-md px-2.5 py-1 text-[10px] font-black"
                    :class="getOrderStatusClass(order.status)"
                  >
                    {{ getOrderStatusLabel(order.status) }}
                  </span>
                </td>

                <td class="px-4 py-3">
                  <span
                    class="inline-flex rounded-md px-2.5 py-1 text-[10px] font-black"
                    :class="getPriorityClass(order.priority)"
                  >
                    {{ order.priority }}
                  </span>
                </td>

                <td class="px-4 py-3 text-right font-black text-slate-700">
                  {{ order.estimatedCost }}
                </td>

                <td class="px-4 py-3">
                  <div class="flex justify-end gap-1.5">
                    <button
                      class="maintenance-icon-button"
                      type="button"
                      :aria-label="`Ver mantenciones de ${order.plate}`"
                      title="Ver mantenciones del vehiculo"
                      @click.stop="openWorkOrderVehicleMaintenancePlans(order.id)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                        />
                        <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="2" />
                      </svg>
                    </button>

                    <button
                      class="maintenance-icon-button"
                      type="button"
                      aria-label="Mas acciones"
                      @click.stop="openWorkOrderActionModal(order.id, 'edit-order')"
                    >
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M12 5h.01M12 12h.01M12 19h.01"
                          stroke="currentColor"
                          stroke-width="3"
                          stroke-linecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer
          class="flex flex-col gap-2 border-t border-[#edf1f5] px-4 py-2.5 text-[11px] font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            Mostrando {{ visibleWorkOrders.length ? 1 : 0 }} a {{ visibleWorkOrders.length }} de
            {{ filteredWorkOrders.length }} ordenes
          </span>

          <div class="flex items-center justify-end gap-1.5">
            <button class="maintenance-page-button" type="button">1</button>
            <button class="maintenance-page-button is-active" type="button">2</button>
            <button class="maintenance-page-button" type="button">3</button>
          </div>
        </footer>
      </article>

      <aside
        class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl border border-[#dfe5ed] bg-white shadow-sm"
      >
        <header class="border-b border-[#edf1f5] px-4 py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-[14px] font-black text-[#102372]">Detalle de la orden</h3>
              <p class="mt-0.5 text-[11px] font-bold text-slate-500">
                {{ selectedOrder?.id }}
              </p>
            </div>

            <span
              class="rounded-md px-2 py-1 text-[10px] font-black"
              :class="getOrderStatusClass(selectedOrder?.status)"
            >
              {{ getOrderStatusLabel(selectedOrder?.status) }}
            </span>
          </div>
        </header>

        <div class="min-h-0 overflow-auto p-4">
          <div class="grid grid-cols-[74px_minmax(0,1fr)] gap-3">
            <img
              class="h-16 w-[74px] rounded-lg border border-[#dfe5ed] bg-[#f8fafc] object-contain p-1"
              :src="vehicleBlueTruckImage"
              alt=""
            />

            <div class="min-w-0">
              <p class="truncate text-[15px] font-black text-[#102372]">
                {{ selectedOrder?.plate }}
              </p>
              <p class="mt-0.5 truncate text-[11px] font-bold text-slate-500">
                {{ selectedOrderVehicle.assetName }}
              </p>
              <p class="mt-1 truncate text-[11px] font-bold text-slate-500">
                {{ selectedOrderVehicle.odometerLabel }}
              </p>
            </div>
          </div>

          <section class="mt-4 rounded-lg border border-[#edf1f5] bg-[#f8fafc] p-3">
            <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Trabajo</p>
            <p class="mt-1 text-[13px] font-black text-[#102372]">
              {{ selectedOrder?.job }}
            </p>
            <p class="mt-1 text-[11px] font-bold leading-5 text-slate-500">
              {{ selectedOrder?.description }}
            </p>
          </section>

          <dl class="mt-3 grid grid-cols-2 gap-2">
            <div
              v-for="detail in selectedOrderDetails"
              :key="detail.label"
              class="rounded-lg border border-[#edf1f5] bg-white p-3"
            >
              <dt class="text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
                {{ detail.label }}
              </dt>
              <dd class="mt-1 truncate text-[12px] font-black text-[#102372]">
                {{ detail.value }}
              </dd>
            </div>
          </dl>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              class="h-8 rounded-lg bg-blue-600 text-[11px] font-black text-white"
              type="button"
              @click="openMaintenanceModal('edit-order')"
            >
              Editar
            </button>
            <button
              class="h-8 rounded-lg bg-amber-400 text-[11px] font-black text-[#102372]"
              type="button"
              @click="openMaintenanceModal('reprogram-order')"
            >
              Reprogramar
            </button>
            <button
              class="h-8 rounded-lg bg-emerald-600 text-[11px] font-black text-white"
              type="button"
              @click="openMaintenanceModal('assign-order')"
            >
              Asignar
            </button>
            <button
              class="h-8 rounded-lg bg-rose-600 text-[11px] font-black text-white"
              type="button"
              @click="openMaintenanceModal('cancel-order')"
            >
              Cancelar OT
            </button>
            <button
              class="col-span-2 h-8 rounded-lg bg-[#102372] text-[11px] font-black text-white"
              type="button"
              @click="openMaintenanceModal('close-order')"
            >
              Registrar cierre
            </button>
          </div>

          <section class="mt-4">
            <div class="flex items-center gap-4 border-b border-[#edf1f5]">
              <button
                class="border-b-2 border-[#102372] pb-2 text-[11px] font-black text-[#102372]"
                type="button"
              >
                Tareas
              </button>
              <button class="pb-2 text-[11px] font-black text-slate-500" type="button">
                Comentarios (2)
              </button>
              <button class="pb-2 text-[11px] font-black text-slate-500" type="button">
                Historial
              </button>
            </div>

            <div class="mt-3 space-y-2">
              <div
                v-for="task in selectedOrderTaskRows"
                :key="task.label"
                class="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-[#edf1f5] px-3 py-2"
              >
                <span
                  class="h-3.5 w-3.5 rounded-full border"
                  :class="
                    task.done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'
                  "
                ></span>
                <span class="truncate text-[11px] font-bold text-slate-600">
                  {{ task.label }}
                </span>
                <span
                  class="rounded-md px-2 py-1 text-[9px] font-black"
                  :class="getTaskStatusClass(task.status)"
                >
                  {{ task.status }}
                </span>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue"

import vehicleBlueTruckImage from "../../assets/map/vehicle-blue-truck.png"
import SvgIcon from "../icons/SvgIcon.vue"

const props = defineProps({
  filteredWorkOrders: { type: Array, default: () => [] },
  getOrderStatusClass: { type: Function, required: true },
  getOrderStatusIcon: { type: Function, required: true },
  getOrderStatusIconClass: { type: Function, required: true },
  getOrderStatusLabel: { type: Function, required: true },
  getOrderSummaryMetricClass: { type: Function, required: true },
  getPriorityClass: { type: Function, required: true },
  getTaskStatusClass: { type: Function, required: true },
  orderPriorityOptions: { type: Array, default: () => [] },
  orderSearchTerm: { type: String, default: "" },
  orderStatusFilters: { type: Array, default: () => [] },
  orderSummaryMetrics: { type: Array, default: () => [] },
  selectedOrder: { type: Object, default: null },
  selectedOrderDetails: { type: Array, default: () => [] },
  selectedOrderPriority: { type: String, default: "all" },
  selectedOrderStatus: { type: String, default: "all" },
  selectedOrderTaskRows: { type: Array, default: () => [] },
  selectedOrderVehicle: { type: Object, default: () => ({}) },
  selectedOrderWorkshop: { type: String, default: "all" },
  visibleWorkOrders: { type: Array, default: () => [] },
  workOrderWorkshopOptions: { type: Array, default: () => [] },
})

const emit = defineEmits([
  "apply-order-metric-filter",
  "clear-order-filters",
  "open-maintenance-modal",
  "open-work-order-action-modal",
  "open-work-order-vehicle-maintenance-plans",
  "select-work-order",
  "update:order-search-term",
  "update:selected-order-priority",
  "update:selected-order-status",
  "update:selected-order-workshop",
])

const orderSearchModel = computed({
  get: () => props.orderSearchTerm,
  set: (value) => emit("update:order-search-term", value),
})

const selectedOrderStatusModel = computed({
  get: () => props.selectedOrderStatus,
  set: (value) => emit("update:selected-order-status", value),
})

const selectedOrderPriorityModel = computed({
  get: () => props.selectedOrderPriority,
  set: (value) => emit("update:selected-order-priority", value),
})

const selectedOrderWorkshopModel = computed({
  get: () => props.selectedOrderWorkshop,
  set: (value) => emit("update:selected-order-workshop", value),
})

const applyOrderMetricFilter = (filter) => emit("apply-order-metric-filter", filter)
const clearOrderFilters = () => emit("clear-order-filters")
const openMaintenanceModal = (type) => emit("open-maintenance-modal", type)
const openWorkOrderActionModal = (orderId, modalType) =>
  emit("open-work-order-action-modal", orderId, modalType)
const openWorkOrderVehicleMaintenancePlans = (orderId) =>
  emit("open-work-order-vehicle-maintenance-plans", orderId)
const selectWorkOrder = (orderId) => emit("select-work-order", orderId)
</script>
