<template>
  <section class="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3">
    <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      <button
        v-for="metric in maintenanceSummaryMetrics"
        :key="metric.key"
        type="button"
        class="maintenance-summary-card"
        :class="getSummaryMetricCardClass(metric)"
        @click="applyMetricFilter(metric.filter)"
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

        <span class="maintenance-summary-icon" :class="getStatusIconClass(metric.key)">
          <SvgIcon :name="getSummaryMetricIcon(metric.key)" />
        </span>
      </button>
    </div>

    <section class="rounded-xl border border-[#dfe5ed] bg-white p-2 shadow-sm">
      <div class="grid gap-2 xl:grid-cols-[minmax(260px,1fr)_150px_170px_190px_auto_auto]">
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
            v-model="searchModel"
            type="search"
            placeholder="Buscar por patente o vehiculo..."
            class="h-9 w-full rounded-lg border border-[#cfd8e6] bg-white pl-11 pr-3 text-[12px] font-bold text-[#172033] outline-none transition placeholder:text-slate-400 hover:border-[#b9c5d6] focus:border-[#102372] focus:ring-2 focus:ring-[#102372]/10"
          />
        </label>

        <label class="maintenance-select">
          <span>Estado</span>
          <select v-model="selectedStatusModel">
            <option value="all">Todos</option>
            <option v-for="filter in statusFilters" :key="filter.value" :value="filter.value">
              {{ filter.label }}
            </option>
          </select>
        </label>

        <label class="maintenance-select">
          <span>Mantencion</span>
          <select v-model="selectedTypeModel">
            <option value="all">Todos</option>
            <option v-for="type in maintenanceTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </label>

        <label class="maintenance-select">
          <span>Taller</span>
          <select v-model="selectedWorkshopModel">
            <option value="all">Todos</option>
            <option v-for="workshop in workshopOptions" :key="workshop" :value="workshop">
              {{ workshop }}
            </option>
          </select>
        </label>

        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#dfe5ed] bg-white px-3 text-[11px] font-black text-slate-600 transition hover:border-[#ff6600]/35 hover:text-[#ff6600]"
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

        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#102372] px-4 text-[11px] font-black text-white shadow-sm transition hover:bg-[#0b1f55]"
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
      </div>
    </section>

    <article
      class="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-xl border border-[#dfe5ed] bg-white shadow-sm"
    >
      <div class="min-h-0 overflow-auto">
        <table class="w-full min-w-[1040px] text-left">
          <thead
            class="bg-[#f8fafc] text-[10px] font-black uppercase tracking-[0.08em] text-slate-400"
          >
            <tr>
              <th class="w-[74px] px-4 py-3 text-center">Estado</th>
              <th class="px-4 py-3">Vehiculo / patente</th>
              <th class="px-4 py-3">Odometro actual</th>
              <th v-if="hasHourMeterData" class="px-4 py-3">Horometro actual</th>
              <th class="px-4 py-3 text-center">Mantenciones activas</th>
              <th class="px-4 py-3">Proxima mantencion</th>
              <th class="px-4 py-3">Estado actual</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-[#edf1f5]">
            <tr v-if="!filteredMaintenanceItems.length">
              <td
                class="px-4 py-8 text-center text-[12px] font-bold text-slate-500"
                :colspan="hasHourMeterData ? 8 : 7"
              >
                No hay vehiculos para los filtros seleccionados.
              </td>
            </tr>

            <tr
              v-for="item in overviewMaintenanceItems"
              :key="item.id"
              class="text-[12px] transition hover:bg-[#f8fafc]"
            >
              <td class="px-4 py-2.5">
                <span
                  class="maintenance-table-status-icon"
                  :class="getStatusIconClass(item.status)"
                >
                  <SvgIcon :name="getSummaryMetricIcon(item.status)" />
                </span>
              </td>

              <td class="px-4 py-2.5">
                <button type="button" class="text-left" @click="selectVehicle(item.id)">
                  <span class="block font-black text-[#102372]">{{ item.plate }}</span>
                  <span class="mt-0.5 block text-[11px] font-bold text-slate-500">
                    {{ item.assetName }}
                  </span>
                </button>
              </td>

              <td class="px-4 py-2.5 font-bold text-slate-600">{{ item.odometerLabel }}</td>
              <td v-if="hasHourMeterData" class="px-4 py-2.5 font-bold text-slate-600">
                {{ item.hourMeterLabel }}
              </td>
              <td class="px-4 py-2.5 text-center">
                <span
                  class="inline-flex min-w-7 items-center justify-center rounded-md bg-[#eef3ff] px-2.5 py-1 text-[10px] font-black text-[#102372]"
                >
                  {{ item.activeMaintenanceCount }}
                </span>
              </td>
              <td class="px-4 py-2.5">
                <span class="block font-black text-slate-700">{{ item.nextJob }}</span>
                <span
                  class="mt-0.5 block text-[11px] font-bold"
                  :class="getStatusTextClass(item.status)"
                >
                  {{ item.nextDueLabel }}
                </span>
                <span class="mt-0.5 block text-[10px] font-bold text-slate-400">
                  {{ item.readingSourceLabel }} · {{ item.intervalLabel }}
                </span>
              </td>
              <td class="px-4 py-2.5">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-black"
                  :class="getStatusClass(item.status)"
                >
                  {{ getStatusLabel(item.status) }}
                </span>
              </td>
              <td class="px-4 py-2.5">
                <div class="flex justify-end gap-1.5">
                  <button
                    class="maintenance-icon-button"
                    type="button"
                    :aria-label="`Ver mantenciones de ${item.plate}`"
                    title="Ver mantenciones del vehiculo"
                    @click="openVehicleMaintenancePlans(item.id)"
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
                    @click="openVehicleCosts(item.id)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M12 3v18M17 7.5A4 4 0 0 0 12.5 6H11a3 3 0 0 0 0 6h2a3 3 0 0 1 0 6h-1.5A4 4 0 0 1 7 16.5"
                        stroke="currentColor"
                        stroke-width="2"
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
          Mostrando 1 a {{ overviewMaintenanceItems.length }} de
          {{ maintenanceItems.length }} vehiculos
        </span>

        <div class="flex items-center justify-end gap-1.5">
          <button class="maintenance-page-button" type="button">«</button>
          <button class="maintenance-page-button is-active" type="button">1</button>
          <button class="maintenance-page-button" type="button">2</button>
          <button class="maintenance-page-button" type="button">»</button>
        </div>
      </footer>
    </article>
  </section>
</template>

<script setup>
import { computed } from "vue"

import SvgIcon from "../icons/SvgIcon.vue"

const props = defineProps({
  filteredMaintenanceItems: { type: Array, default: () => [] },
  getStatusClass: { type: Function, required: true },
  getStatusIconClass: { type: Function, required: true },
  getStatusLabel: { type: Function, required: true },
  getStatusTextClass: { type: Function, required: true },
  getSummaryMetricCardClass: { type: Function, required: true },
  getSummaryMetricIcon: { type: Function, required: true },
  hasHourMeterData: { type: Boolean, default: false },
  maintenanceItems: { type: Array, default: () => [] },
  maintenanceSummaryMetrics: { type: Array, default: () => [] },
  maintenanceTypes: { type: Array, default: () => [] },
  overviewMaintenanceItems: { type: Array, default: () => [] },
  searchTerm: { type: String, default: "" },
  selectedStatus: { type: String, default: "all" },
  selectedType: { type: String, default: "all" },
  selectedWorkshop: { type: String, default: "all" },
  statusFilters: { type: Array, default: () => [] },
  workshopOptions: { type: Array, default: () => [] },
})

const emit = defineEmits([
  "apply-metric-filter",
  "clear-filters",
  "open-vehicle-costs",
  "open-vehicle-maintenance-plans",
  "select-vehicle",
  "update:search-term",
  "update:selected-status",
  "update:selected-type",
  "update:selected-workshop",
])

const searchModel = computed({
  get: () => props.searchTerm,
  set: (value) => emit("update:search-term", value),
})

const selectedStatusModel = computed({
  get: () => props.selectedStatus,
  set: (value) => emit("update:selected-status", value),
})

const selectedTypeModel = computed({
  get: () => props.selectedType,
  set: (value) => emit("update:selected-type", value),
})

const selectedWorkshopModel = computed({
  get: () => props.selectedWorkshop,
  set: (value) => emit("update:selected-workshop", value),
})

const applyMetricFilter = (filter) => emit("apply-metric-filter", filter)
const clearFilters = () => emit("clear-filters")
const openVehicleCosts = (vehicleId) => emit("open-vehicle-costs", vehicleId)
const openVehicleMaintenancePlans = (vehicleId) => emit("open-vehicle-maintenance-plans", vehicleId)
const selectVehicle = (vehicleId) => emit("select-vehicle", vehicleId)
</script>
