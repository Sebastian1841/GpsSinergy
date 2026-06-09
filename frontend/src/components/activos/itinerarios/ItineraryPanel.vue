<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden bg-[#f8fafc]">
    <!-- Filtros compartidos -->
    <header class="shrink-0 border-b border-[#d8dee8] bg-white p-2">
      <!-- Menú interno: solo cambia el contenido inferior -->
      <div class="mb-2 grid grid-cols-2 gap-1 rounded-lg border border-[#d8dee8] bg-[#f8fafc] p-1">
        <button
          type="button"
          class="flex h-8 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-[10px] font-black transition"
          :class="
            activePanelView === 'itinerarios'
              ? 'bg-[#102372] text-white shadow-sm'
              : 'text-[#102372] hover:bg-white hover:text-[#FF6600]'
          "
          @click="activePanelView = 'itinerarios'"
        >
          <span class="truncate">Itinerarios</span>

          <span
            class="rounded px-1.5 py-0.5 text-[9px] font-black"
            :class="
              activePanelView === 'itinerarios'
                ? 'bg-white/15 text-white'
                : 'bg-[#102372]/10 text-[#102372]'
            "
          >
            {{ filteredAssets.length }}
          </span>

          <span
            v-if="selectedAssetIds.length"
            class="rounded px-1.5 py-0.5 text-[9px] font-black"
            :class="
              activePanelView === 'itinerarios'
                ? 'bg-[#FF6600] text-white'
                : 'bg-[#FF6600]/10 text-[#FF6600]'
            "
          >
            {{ selectedAssetIds.length }} sel.
          </span>
        </button>

        <button
          type="button"
          class="flex h-8 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-[10px] font-black transition"
          :class="
            activePanelView === 'resumen-dia'
              ? 'bg-[#102372] text-white shadow-sm'
              : 'text-[#102372] hover:bg-white hover:text-[#FF6600]'
          "
          @click="activePanelView = 'resumen-dia'"
        >
          <span class="truncate">Resumen del día</span>

          <span
            v-if="routeResult?.rows?.length"
            class="rounded px-1.5 py-0.5 text-[9px] font-black"
            :class="
              activePanelView === 'resumen-dia'
                ? 'bg-white/15 text-white'
                : 'bg-[#102372]/10 text-[#102372]'
            "
          >
            {{ routeResult.rows.length }}
          </span>
        </button>
      </div>

      <div class="space-y-2">
        <!-- Buscador + selector de dispositivos + acciones -->
        <section class="relative">
          <div class="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] items-center gap-1.5">
            <div
              class="flex h-8 min-w-0 overflow-hidden rounded-lg border border-[#d8dee8] bg-white transition focus-within:border-[#FF6600] focus-within:ring-2 focus-within:ring-[#FF6600]/15"
            >
              <div class="relative min-w-0 flex-1">
                <span
                  class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400"
                >
                  ⌕
                </span>

                <input
                  v-model="searchTerm"
                  type="text"
                  placeholder="Buscar patente, dispositivo o conductor..."
                  class="h-full w-full bg-transparent pl-8 pr-7 text-[11px] font-semibold text-[#172033] outline-none placeholder:text-slate-400"
                  @focus="openDeviceDropdown"
                  @click="openDeviceDropdown"
                  @input="openDeviceDropdown"
                />

                <button
                  v-if="searchTerm"
                  type="button"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-base leading-none text-slate-400 transition hover:text-[#FF6600]"
                  @click="clearSearchTerm"
                >
                  ×
                </button>
              </div>

              <div class="my-1.5 w-px shrink-0 bg-[#edf1f5]"></div>

              <button
                type="button"
                class="flex h-full w-[124px] shrink-0 cursor-pointer items-center justify-between gap-1.5 px-2 text-left transition hover:bg-[#fff7ed]"
                :title="selectedAssetsSummary"
                @click="showDeviceList = !showDeviceList"
              >
                <span
                  class="min-w-0 truncate text-[9.5px] font-black uppercase tracking-[0.06em] text-slate-500"
                >
                  {{ selectedAssetsSummary }}
                </span>

                <span
                  class="shrink-0 text-[11px] font-black text-[#102372] transition"
                  :class="showDeviceList ? 'rotate-180' : ''"
                >
                  ▾
                </span>
              </button>
            </div>

            <button
              type="button"
              class="h-8 shrink-0 cursor-pointer rounded-lg bg-[#102372] px-3 text-[10px] font-black text-white transition hover:bg-[#0c1b59]"
              @click="searchItinerary"
            >
              Buscar
            </button>

            <button
              type="button"
              class="h-8 shrink-0 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#d8dee8] disabled:hover:text-[#102372]"
              :disabled="!canRefreshItinerary"
              @click="refreshItinerary"
            >
              Actualizar
            </button>

            <button
              type="button"
              class="h-8 shrink-0 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#d8dee8] disabled:hover:text-[#102372]"
              :disabled="!canExportItinerary"
              @click="exportItinerary"
            >
              Exportar
            </button>

            <button
              type="button"
              class="h-8 shrink-0 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
              @click="clearResult"
            >
              Limpiar
            </button>
          </div>

          <div
            v-if="showDeviceList"
            class="absolute left-0 right-0 top-[36px] z-30 overflow-hidden rounded-lg border border-[#d8dee8] bg-white shadow-xl"
          >
            <div
              class="flex items-center justify-between gap-2 border-b border-[#edf1f5] bg-[#f8fafc] px-2 py-1.5"
            >
              <p class="truncate text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                Selección de dispositivos
              </p>

              <div class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  class="h-7 cursor-pointer rounded-md px-2 text-[10px] font-black text-[#102372] transition hover:bg-[#102372]/10"
                  @click="selectAllVisibleAssets"
                >
                  Todos
                </button>

                <button
                  type="button"
                  class="h-7 cursor-pointer rounded-md px-2 text-[10px] font-black text-slate-500 transition hover:bg-slate-100 hover:text-[#FF6600]"
                  @click="clearSelectedAssets"
                >
                  Quitar
                </button>
              </div>
            </div>

            <div class="max-h-[180px] overflow-auto">
              <button
                v-for="asset in filteredAssets"
                :key="asset.id"
                type="button"
                class="grid w-full cursor-pointer grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2 border-b border-[#edf1f5] px-2 py-1.5 text-left transition last:border-b-0 hover:bg-[#f8fafc]"
                :class="isAssetSelected(asset.id) ? 'bg-[#fff7ed]' : 'bg-white'"
                @click="toggleAsset(asset)"
              >
                <span
                  class="flex h-4 w-4 items-center justify-center rounded border text-[10px] font-black transition"
                  :class="
                    isAssetSelected(asset.id)
                      ? 'border-[#FF6600] bg-[#FF6600] text-white'
                      : 'border-[#cbd5e1] bg-white text-transparent'
                  "
                >
                  ✓
                </span>

                <span class="min-w-0">
                  <span class="flex min-w-0 items-center gap-1.5">
                    <span
                      class="h-2 w-2 shrink-0 rounded-full"
                      :class="statusDotClass(asset.estado)"
                    ></span>

                    <span class="truncate text-[11px] font-black text-[#102372]">
                      {{ asset.displayName || asset.patente }}
                    </span>
                  </span>

                  <span class="block truncate text-[10px] font-semibold text-slate-500">
                    {{ asset.deviceId }} · {{ asset.conductor || "Sin conductor" }}
                  </span>
                </span>

                <span
                  class="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black ring-1"
                  :class="statusChipClass(asset.estado)"
                >
                  {{ statusLabel(asset.estado) }}
                </span>
              </button>

              <div v-if="!filteredAssets.length" class="px-3 py-4 text-center">
                <p class="text-[11px] font-black text-[#102372]">Sin dispositivos</p>

                <p class="mt-1 text-[10px] font-semibold text-slate-500">No hay coincidencias.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Fechas compartidas -->
        <div class="grid grid-cols-4 gap-1 rounded-lg border border-[#d8dee8] bg-[#f8fafc] p-1">
          <button
            v-for="option in rangeOptions"
            :key="option.value"
            type="button"
            class="cursor-pointer rounded-md px-2 py-1.5 text-[10px] font-black transition"
            :class="
              dateRange === option.value
                ? 'bg-[#102372] text-white shadow-sm'
                : 'text-[#102372] hover:bg-white hover:text-[#FF6600]'
            "
            @click="setDateRange(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div v-if="dateRange === 'custom'" class="grid grid-cols-2 gap-2">
          <input
            v-model="fromDate"
            type="date"
            class="h-8 rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-semibold text-[#172033] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/15"
          />

          <input
            v-model="toDate"
            type="date"
            class="h-8 rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-semibold text-[#172033] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/15"
          />
        </div>

        <div
          v-if="formError"
          class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700"
        >
          {{ formError }}
        </div>
      </div>
    </header>

    <!-- Contenido variable -->
    <main class="min-h-0 flex-1 overflow-auto p-2">
      <div v-if="routeResult && activePanelView === 'itinerarios'" class="space-y-2">
        <ItinerarySummary :summary="routeResult.summary" />

        <div
          v-if="!routeResult.rows.length"
          class="rounded-lg border border-dashed border-[#cbd5e1] bg-white px-3 py-4 text-center"
        >
          <p class="text-[11px] font-black text-[#102372]">Sin puntos GPS para este rango</p>

          <p class="mt-1 text-[10px] font-semibold text-slate-500">
            Cambia la fecha o selecciona otro dispositivo.
          </p>
        </div>

        <ItineraryTable
          v-else
          :rows="routeResult.rows"
          :route="routeResult"
          :selected-point-id="selectedPointId"
          @select-point="selectPoint"
        />
      </div>

      <ItineraryDaySummary
        v-else-if="routeResult && activePanelView === 'resumen-dia'"
        :summary="routeResult.summary"
        :rows="routeResult.rows"
        :selected-assets="selectedAssets"
        :selected-assets-summary="selectedAssetsSummary"
        :range-label="activeRangeLabel"
      />

      <div
        v-else
        class="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-white p-4 text-center"
      >
        <h3 class="text-[12px] font-black text-[#102372]">
          {{ activePanelView === "resumen-dia" ? "Sin resumen cargado" : "Sin recorrido cargado" }}
        </h3>

        <p class="mt-1 max-w-[230px] text-[10px] font-semibold leading-relaxed text-slate-500">
          Los filtros son compartidos. Selecciona dispositivos y presiona buscar.
        </p>

        <button
          type="button"
          class="mt-3 h-8 cursor-pointer rounded-lg bg-[#102372] px-4 text-[10px] font-black text-white transition hover:bg-[#0c1b59]"
          @click="searchItinerary"
        >
          {{ activePanelView === "resumen-dia" ? "Buscar resumen" : "Buscar recorrido" }}
        </button>
      </div>
    </main>
  </section>
</template>

<script setup>
import { computed } from "vue"

import ItineraryDaySummary from "./ItineraryDaySummary.vue"
import ItinerarySummary from "./ItinerarySummary.vue"
import ItineraryTable from "./ItineraryTable.vue"

import { useItineraryAssets } from "../../../composables/activos/itinerarios/useItineraryAssets.js"
import { useItineraryFilters } from "../../../composables/activos/itinerarios/useItineraryFilters.js"
import { useItineraryRoute } from "../../../composables/activos/itinerarios/useItineraryRoute.js"

import {
  addDays,
  buildItineraryResult,
  filterItineraryPoints,
  mockItineraryAssets,
} from "../../../data/mockItineraryData"

const props = defineProps({
  activos: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["route-selected", "point-selected", "clear-route"])

const getLocalDateString = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const latestDate = getLocalDateString()

const rangeOptions = [
  {
    value: "today",
    label: "Hoy",
  },
  {
    value: "yesterday",
    label: "Ayer",
  },
  {
    value: "week",
    label: "7 días",
  },
  {
    value: "custom",
    label: "Fecha",
  },
]

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

const {
  activePanelView,
  searchTerm,
  showDeviceList,
  dateRange,
  fromDate,
  toDate,
  formError,
  activeRangeLabel,

  setDateRange,
  applyDateRange,
  openDeviceDropdown,
  clearSearchTerm,
} = useItineraryFilters({
  latestDate,
  addDays,
  rangeOptions,
})

const {
  selectedAssetIds,
  filteredAssets,
  selectedAssets,
  selectedAssetsSummary,
  primarySelectedAsset,

  toggleAsset,
  isAssetSelected,
  selectAllVisibleAssets,
  clearSelectedAssets,
} = useItineraryAssets({
  props,
  searchTerm,
  formError,
  normalizeText,
  mockItineraryAssets,
})

const {
  routeResult,
  selectedPointId,

  handleGenerateRoute,
  handleRefreshRoute,
  handleSelectPoint,
  handleClearRoute,
} = useItineraryRoute({
  emit,
  latestDate,
  selectedAssetIds,
  filteredAssets,
  selectedAssets,
  primarySelectedAsset,
  showDeviceList,
  fromDate,
  toDate,
  formError,
  applyDateRange,
  filterItineraryPoints,
  buildItineraryResult,
})

const searchItinerary = handleGenerateRoute
const refreshItinerary = handleRefreshRoute
const selectPoint = handleSelectPoint
const clearResult = handleClearRoute

const canRefreshItinerary = computed(() => {
  return Boolean(routeResult.value)
})

const canExportItinerary = computed(() => {
  return Boolean(routeResult.value?.rows?.length)
})

const escapeCsvValue = (value) => {
  const text = String(value ?? "")

  if (!/[",\n\r;]/.test(text)) return text

  return `"${text.replace(/"/g, '""')}"`
}

const getRouteAssetLabel = (row) => {
  return (
    row.assetDisplayName ||
    row.assetPatente ||
    routeResult.value?.asset?.displayName ||
    routeResult.value?.asset?.patente ||
    "-"
  )
}

const buildItineraryCsv = () => {
  const headers = [
    "Activo",
    "Patente",
    "Dispositivo",
    "Fecha",
    "Hora",
    "Estado",
    "Velocidad",
    "Direccion",
    "Evento",
    "Km acumulado",
    "Latitud",
    "Longitud",
  ]

  const rows = (routeResult.value?.rows || []).map((row) => [
    getRouteAssetLabel(row),
    row.assetPatente || routeResult.value?.asset?.patente || "",
    row.assetDeviceId || routeResult.value?.asset?.deviceId || "",
    row.dateLabel || "",
    row.timeLabel || "",
    row.status === "moving" ? "Movimiento" : "Detenido",
    row.speedLabel || row.speed || "",
    row.address || "",
    row.event || "",
    row.accumulatedDistanceLabel || "",
    row.lat ?? "",
    row.lng ?? "",
  ])

  return [headers, ...rows]
    .map((row) => {
      return row.map(escapeCsvValue).join(";")
    })
    .join("\n")
}

const buildExportFilename = () => {
  const assetLabel =
    routeResult.value?.asset?.displayName ||
    routeResult.value?.asset?.patente ||
    routeResult.value?.asset?.id ||
    "itinerario"

  const normalizedAssetLabel = String(assetLabel)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()

  return `itinerario-${normalizedAssetLabel || "activos"}-${fromDate.value}-${toDate.value}.csv`
}

const exportItinerary = () => {
  if (!canExportItinerary.value) return

  const csv = `\uFEFF${buildItineraryCsv()}`
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = buildExportFilename()
  link.click()

  window.URL.revokeObjectURL(url)
}

const statusLabel = (estado) => {
  const labels = {
    moving: "Ruta",
    idle: "Espera",
    stopped: "Alerta",
    offline: "Offline",
  }

  return labels[estado] || "Sin estado"
}

const statusDotClass = (estado) => {
  const classes = {
    moving: "bg-emerald-500",
    idle: "bg-sky-500",
    stopped: "bg-red-500",
    offline: "bg-slate-400",
  }

  return classes[estado] || "bg-slate-400"
}

const statusChipClass = (estado) => {
  const classes = {
    moving: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    idle: "bg-sky-50 text-sky-700 ring-sky-200",
    stopped: "bg-red-50 text-red-700 ring-red-200",
    offline: "bg-slate-100 text-slate-500 ring-slate-200",
  }

  return classes[estado] || "bg-slate-100 text-slate-500 ring-slate-200"
}
</script>
