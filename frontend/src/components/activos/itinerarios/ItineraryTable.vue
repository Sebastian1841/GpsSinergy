<template>
  <section
    class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-sm"
  >
    <div class="flex items-center justify-between gap-2 border-b border-[#edf0f5] px-3 py-2.5">
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

      <div class="flex shrink-0 items-center gap-1.5">
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

    <div v-else class="min-h-0 max-h-[420px] overflow-auto">
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
            v-for="(row, rowIndex) in paginatedRows"
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
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from "vue"
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
