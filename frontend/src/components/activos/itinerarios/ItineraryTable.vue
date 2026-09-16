<template>
  <section
    class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-sm"
  >
    <div
      class="flex flex-col gap-2 border-b border-[#edf0f5] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex min-w-0 items-center gap-2">
        <p class="shrink-0 text-[11px] font-black text-[#102372]">Eventos del recorrido</p>

        <span class="h-4 w-px shrink-0 bg-[#edf0f5]"></span>

        <p v-if="rows.length" class="min-w-0 truncate text-[10px] font-semibold text-slate-500">
          {{ paginationStart }}-{{ paginationEnd }} de {{ totalItems }} GPS
        </p>

        <p v-else class="min-w-0 truncate text-[10px] font-semibold text-slate-500">
          0 registros GPS
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-1.5 sm:justify-end">
        <label
          v-if="rows.length"
          class="flex h-[36px] shrink-0 items-center gap-1.5 rounded-lg border border-[#d8dee8] bg-white px-2 text-[10px] font-black"
        >
          <span class="text-slate-400">Filas</span>

          <select
            v-model.number="pageSize"
            class="h-full cursor-pointer bg-transparent text-[10px] font-black text-[#102372] outline-none"
          >
            <option v-for="option in pageSizeOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </label>

        <div v-if="rows.length" class="grid h-[36px] grid-cols-[44px_64px_44px]">
          <button
            type="button"
            class="cursor-pointer rounded-l-lg border border-[#d8dee8] bg-white text-[10px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#d8dee8] disabled:hover:text-[#102372]"
            :disabled="currentPage <= 1"
            @click="goToPreviousPage"
          >
            Ant.
          </button>

          <span
            class="flex items-center justify-center border-y border-[#d8dee8] bg-white px-1 text-[10px] font-black text-[#102372]"
          >
            {{ currentPage }}/{{ totalPages }}
          </span>

          <button
            type="button"
            class="cursor-pointer rounded-r-lg border border-[#d8dee8] bg-white text-[10px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#d8dee8] disabled:hover:text-[#102372]"
            :disabled="currentPage >= totalPages"
            @click="goToNextPage"
          >
            Sig.
          </button>
        </div>

        <button
          v-if="hasCustomSort"
          type="button"
          class="h-[36px] shrink-0 cursor-pointer rounded-lg border border-[#FF6600]/30 bg-[#fff7ed] px-2.5 text-[10px] font-black text-[#FF6600] transition hover:border-[#FF6600] hover:bg-white"
          title="Volver a mostrar los ultimos reportes primero"
          @click="resetSort"
        >
          Orden
        </button>

        <ColumnVisibilityMenu
          :is-open="showColumns"
          :visible-columns="visibleColumns"
          :configurable-columns="configurableColumns"
          :filtered-configurable-columns="filteredConfigurableColumns"
          :visible-column-keys="visibleColumnKeys"
          :search="columnSearch"
          title="Columnas de itinerario"
          button-title="Configurar columnas de itinerario"
          @toggle="showColumns = !showColumns"
          @reset="resetColumns"
          @update-search="columnSearch = $event"
          @toggle-column="toggleColumnKey"
        />
      </div>
    </div>

    <div
      v-if="hasHeavyItinerary"
      class="border-b border-[#FF6600]/20 bg-[#fff7ed] px-3 py-2 text-[10px] font-bold text-[#FF6600]"
    >
      Mostrando muchos registros GPS. Usa filtros o un rango de fechas más corto para mejorar el
      rendimiento.
    </div>

    <div
      v-if="!rows.length"
      class="flex min-h-[220px] flex-col items-center justify-center p-6 text-center"
    >
      <p class="text-[13px] font-black text-[#172033]">Sin registros para mostrar</p>

      <p class="mt-1 max-w-[320px] text-[11px] font-semibold text-slate-500">
        Busca una patente o dispositivo y selecciona un rango de fechas.
      </p>
    </div>

    <div v-else class="min-h-0 max-h-[360px] overflow-auto lg:hidden">
      <div class="grid gap-2 p-2">
        <article
          v-for="row in mobileRows"
          :key="row.key"
          role="button"
          tabindex="0"
          class="rounded-lg border bg-white p-3 text-left shadow-sm transition hover:border-[#FF6600]/40 hover:bg-[#fffaf6]"
          :class="
            selectedPointId === row.source.id
              ? 'border-[#FF6600] ring-2 ring-[#FF6600]/10'
              : 'border-[#d8dee8]'
          "
          @click="$emit('select-point', row.source)"
          @keydown.enter.prevent="$emit('select-point', row.source)"
          @keydown.space.prevent="$emit('select-point', row.source)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-[13px] font-black text-[#102372]">
                {{ row.title }}
              </p>

              <p class="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                {{ row.subtitle }}
              </p>
            </div>

            <span
              class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
              :class="getMobileStatusClass(row.source.status)"
            >
              {{ statusLabel(row.source.status) }}
            </span>
          </div>

          <dl class="mt-3 grid grid-cols-2 gap-2 border-t border-[#edf0f5] pt-3">
            <div v-for="cell in row.cells" :key="cell.column.key" class="min-w-0">
              <dt class="truncate text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
                {{ cell.column.label }}
              </dt>

              <dd class="mt-0.5 truncate text-[11px] font-bold text-slate-700" :title="cell.value">
                {{ cell.value }}
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </div>

    <div v-if="rows.length" class="hidden min-h-0 max-h-[420px] overflow-auto lg:block">
      <table class="w-max min-w-full border-collapse text-left text-[11px]">
        <colgroup>
          <col
            v-for="column in visibleColumns"
            :key="column.key"
            :style="{ width: column.width || '110px' }"
          />
        </colgroup>

        <thead class="sticky top-0 z-10 bg-[#102372] text-[10px] uppercase text-white">
          <tr>
            <th
              v-for="column in visibleColumns"
              :key="column.key"
              draggable="true"
              class="group relative border-b border-[#0c1b59] px-3 py-2 font-black"
              :class="column.align === 'right' ? 'text-right' : 'text-left'"
              @dragstart="handleColumnDragStart($event, column.key)"
              @dragover.prevent
              @drop="handleColumnDrop(column.key)"
              @dragend="handleColumnDragEnd"
            >
              <button
                type="button"
                class="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md px-1 py-1 text-white/90 transition hover:bg-white/10 hover:text-white"
                :class="column.align === 'right' ? 'justify-end' : 'justify-start'"
                :title="`Ordenar por ${column.label}`"
                @click="toggleSort(column.key)"
                @contextmenu.stop.prevent
              >
                <span class="truncate">
                  {{ column.label }}
                </span>

                <span
                  class="flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] font-black"
                  :class="
                    sortColumnKey === column.key
                      ? 'border-[#FF6600] bg-[#FF6600] text-white'
                      : 'border-white/30 bg-white/10 text-white/70'
                  "
                >
                  {{ getSortIcon(column.key) }}
                </span>
              </button>

              <span
                class="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-white/0 transition group-hover:bg-[#FF6600]"
                title="Cambiar ancho de columna"
                @mousedown.stop.prevent="startColumnResize($event, column)"
                @dragstart.stop.prevent
              ></span>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, rowIndex) in paginatedRowsWithAddresses"
            :key="getRowKey(row, paginationStart + rowIndex)"
            class="cursor-pointer border-b border-[#edf0f5] transition hover:bg-[#fff7ed]"
            :class="selectedPointId === row.id ? 'bg-[#fff7ed]' : 'bg-white'"
            @click="$emit('select-point', row)"
          >
            <td
              v-for="column in visibleColumns"
              :key="column.key"
              class="max-w-[260px] truncate px-3 py-2"
              :class="getCellClass(row, column)"
              :title="getCellTitle(row, column)"
            >
              <template v-if="column.key === 'timestamp'">
                <span class="whitespace-nowrap font-black text-[#172033]">
                  {{ getRowTimeLabel(row) }}
                </span>
              </template>

              <template v-else-if="column.key === 'status'">
                <span
                  class="inline-flex max-w-full rounded-full px-2 py-0.5 text-[10px] font-black"
                  :class="
                    row.status === 'moving'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-[#fff3eb] text-[#FF6600]'
                  "
                >
                  <span class="truncate">
                    {{ statusLabel(row.status) }}
                  </span>
                </span>
              </template>

              <template v-else-if="column.key === 'address'">
                <p class="line-clamp-1 font-semibold text-slate-600">
                  {{ row.address || "Sin direccion" }}
                </p>

                <p class="mt-0.5 truncate text-[10px] font-bold text-slate-400">
                  {{ row.event || "Reporte GPS" }}
                </p>
              </template>

              <template v-else-if="column.key === 'accumulatedDistanceKm'">
                <span class="whitespace-nowrap font-black text-[#102372]">
                  {{ row.accumulatedDistanceLabel || "0,0 km" }}
                </span>
              </template>

              <template v-else>
                <span class="block truncate font-semibold text-slate-600">
                  {{ getCellValue(row, column) }}
                </span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="rows.length && shouldResolveAddresses"
      class="border-t border-[#edf0f5] bg-[#f8fafc] px-3 py-1.5 text-[9px] font-bold text-slate-400"
    >
      {{ reverseGeocodingAttribution }}
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from "vue"
import { useReverseGeocodedRows } from "../../../composables/location/useReverseGeocodedRows.js"
import ColumnVisibilityMenu from "../../ui/ColumnVisibilityMenu.vue"
import { useFleetColumns } from "../../../composables/activos/fleet/useFleetColumns"
import { useItineraryTableRows } from "../../../composables/activos/itinerarios/useItineraryTableRows.js"
import {
  itineraryTableColumns,
  normalizeItineraryTableText,
} from "../../../utils/activos/itineraryTableColumns.js"

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  selectedPointId: {
    type: [String, Number],
    default: null,
  },
  route: {
    type: Object,
    default: null,
  },
})

defineEmits(["select-point"])

const showColumns = ref(false)
const draggedColumnKey = ref("")

let resizeState = null

const MOBILE_COLUMN_PRIORITY = [
  "speed",
  "accumulatedDistanceKm",
  "address",
  "ignition",
  "gpsSatellites",
  "combustible",
]

const MOBILE_EXCLUDED_COLUMN_KEYS = new Set([
  "timestamp",
  "status",
  "assetDisplayName",
  "assetPatente",
  "assetDeviceId",
])

const {
  columnSearch,
  visibleColumnKeys,
  configurableColumns,
  filteredConfigurableColumns,
  visibleColumns,
  resetColumns,
  setColumnWidth,
  moveColumn,
} = useFleetColumns({
  columns: itineraryTableColumns,
  normalizeText: normalizeItineraryTableText,
})

const columnsByKey = computed(() => {
  return new Map(
    itineraryTableColumns.map((column) => {
      return [column.key, column]
    }),
  )
})

const {
  pageSizeOptions,
  sortColumnKey,
  currentPage,
  pageSize,
  hasCustomSort,
  hasHeavyItinerary,
  totalItems,
  totalPages,
  paginationStart,
  paginationEnd,
  paginatedRows,
  statusLabel,
  toggleSort,
  resetSort,
  getSortIcon,
  getRowKey,
  getRowTimeLabel,
  getCellValue,
  getCellTitle,
  getCellClass,
  goToPreviousPage,
  goToNextPage,
} = useItineraryTableRows({
  rows: computed(() => props.rows),
  route: computed(() => props.route),
  selectedPointId: computed(() => props.selectedPointId),
  visibleColumns,
  columnsByKey,
})

const shouldResolveAddresses = computed(() => {
  return visibleColumns.value.some((column) => column.key === "address")
})

const { rowsWithResolvedAddresses: paginatedRowsWithAddresses, reverseGeocodingAttribution } =
  useReverseGeocodedRows(paginatedRows, {
    enabled: shouldResolveAddresses,
  })

const getMobileStatusClass = (status) => {
  if (status === "moving") return "bg-emerald-50 text-emerald-700"
  if (status === "idle") return "bg-sky-50 text-sky-700"
  if (status === "offline") return "bg-slate-100 text-slate-500"

  return "bg-[#fff3eb] text-[#FF6600]"
}

const buildMobileCells = (row) => {
  const visibleCells = visibleColumns.value
    .filter((column) => !MOBILE_EXCLUDED_COLUMN_KEYS.has(column.key))
    .map((column) => ({
      column,
      value: getCellValue(row, column),
    }))

  const cellsByKey = new Map(visibleCells.map((cell) => [cell.column.key, cell]))
  const priorityCells = MOBILE_COLUMN_PRIORITY.map((key) => cellsByKey.get(key)).filter(Boolean)
  const fallbackCells = visibleCells.filter((cell) => {
    return !MOBILE_COLUMN_PRIORITY.includes(cell.column.key)
  })

  return [...priorityCells, ...fallbackCells].slice(0, 6)
}

const getMobileAssetLabel = (row) => {
  const assetColumn = columnsByKey.value.get("assetDisplayName")
  const plateColumn = columnsByKey.value.get("assetPatente")

  return (
    (assetColumn && getCellValue(row, assetColumn)) ||
    (plateColumn && getCellValue(row, plateColumn)) ||
    "Activo"
  )
}

const getMobileSubtitle = (row) => {
  const dateColumn = columnsByKey.value.get("dateLabel")
  const plateColumn = columnsByKey.value.get("assetPatente")
  const deviceColumn = columnsByKey.value.get("assetDeviceId")
  const subtitleParts = [
    getRowTimeLabel(row),
    dateColumn ? getCellValue(row, dateColumn) : "",
    plateColumn ? getCellValue(row, plateColumn) : "",
    deviceColumn ? getCellValue(row, deviceColumn) : "",
  ].filter((value) => value && value !== "-")

  return subtitleParts.join(" - ") || "Reporte GPS"
}

const mobileRows = computed(() => {
  return paginatedRowsWithAddresses.value.map((row, index) => {
    return {
      key: getRowKey(row, paginationStart.value + index),
      source: row,
      title: getMobileAssetLabel(row),
      subtitle: getMobileSubtitle(row),
      cells: buildMobileCells(row),
    }
  })
})

const toggleColumnKey = (columnKey) => {
  const column = columnsByKey.value.get(columnKey)

  if (!column || column.locked) return

  if (visibleColumnKeys.value.includes(columnKey)) {
    visibleColumnKeys.value = visibleColumnKeys.value.filter((key) => key !== columnKey)
    return
  }

  visibleColumnKeys.value = [...visibleColumnKeys.value, columnKey]
}

const parseColumnWidth = (value, fallback = 110) => {
  const match = String(value || "").match(/-?\d+(\.\d+)?/)
  const parsedValue = match ? Number(match[0]) : fallback

  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

const handleColumnDragStart = (event, columnKey) => {
  draggedColumnKey.value = columnKey
  event.dataTransfer?.setData("text/plain", columnKey)
  event.dataTransfer?.setDragImage?.(event.currentTarget, 8, 8)
}

const handleColumnDrop = (targetColumnKey) => {
  if (!draggedColumnKey.value || draggedColumnKey.value === targetColumnKey) return

  moveColumn(draggedColumnKey.value, targetColumnKey)
  draggedColumnKey.value = ""
}

const handleColumnDragEnd = () => {
  draggedColumnKey.value = ""
}

const stopColumnResize = () => {
  if (!resizeState) return

  window.removeEventListener("mousemove", handleColumnResize)
  window.removeEventListener("mouseup", stopColumnResize)
  resizeState = null
}

const handleColumnResize = (event) => {
  if (!resizeState) return

  const nextWidth = resizeState.startWidth + event.clientX - resizeState.startX

  setColumnWidth(resizeState.columnKey, nextWidth)
}

const startColumnResize = (event, column) => {
  stopColumnResize()

  const headerCell = event.currentTarget.closest("th")

  resizeState = {
    columnKey: column.key,
    startX: event.clientX,
    startWidth: headerCell?.offsetWidth || parseColumnWidth(column.width),
  }

  window.addEventListener("mousemove", handleColumnResize)
  window.addEventListener("mouseup", stopColumnResize)
}

onBeforeUnmount(() => {
  stopColumnResize()
})
</script>
