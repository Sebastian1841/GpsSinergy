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
import { computed, onBeforeUnmount, ref, watch } from "vue"
import ColumnVisibilityMenu from "../../ui/ColumnVisibilityMenu.vue"
import { useFleetColumns } from "../../../composables/activos/fleet/useFleetColumns"

const HEAVY_ITINERARY_ROWS_THRESHOLD = 5000

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

const textCollator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
})

const itineraryColumns = [
  {
    key: "timestamp",
    label: "Hora",
    width: "104px",
    locked: true,
  },
  {
    key: "status",
    label: "Estado",
    width: "118px",
  },
  {
    key: "speed",
    label: "Vel.",
    width: "92px",
    align: "right",
  },
  {
    key: "address",
    label: "Direccion",
    width: "260px",
  },
  {
    key: "accumulatedDistanceKm",
    label: "Km acum.",
    width: "110px",
    align: "right",
  },
  {
    key: "assetDisplayName",
    label: "Activo",
    width: "150px",
    defaultVisible: false,
  },
  {
    key: "assetPatente",
    label: "Patente",
    width: "115px",
    defaultVisible: false,
  },
  {
    key: "assetDeviceId",
    label: "Dispositivo",
    width: "130px",
    defaultVisible: false,
  },
  {
    key: "dateLabel",
    label: "Fecha",
    width: "115px",
    defaultVisible: false,
  },
  {
    key: "event",
    label: "Evento",
    width: "150px",
    defaultVisible: false,
  },
  {
    key: "lat",
    label: "Latitud",
    width: "110px",
    align: "right",
    defaultVisible: false,
  },
  {
    key: "lng",
    label: "Longitud",
    width: "110px",
    align: "right",
    defaultVisible: false,
  },
]

const showColumns = ref(false)
const sortColumnKey = ref("timestamp")
const sortDirection = ref("desc")
const draggedColumnKey = ref("")
const currentPage = ref(1)
const pageSize = ref(50)

let resizeState = null

const pageSizeOptions = [25, 50, 100, 200]

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

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
  columns: itineraryColumns,
  normalizeText,
})

const columnsByKey = computed(() => {
  return new Map(
    itineraryColumns.map((column) => {
      return [column.key, column]
    }),
  )
})

const statusOrder = {
  moving: 1,
  stopped: 2,
  idle: 3,
  offline: 4,
}

const statusLabels = {
  moving: "Movimiento",
  stopped: "Detenido",
  idle: "Espera",
  offline: "Offline",
}

const hasCustomSort = computed(() => {
  return sortColumnKey.value !== "timestamp" || sortDirection.value !== "desc"
})

const hasHeavyItinerary = computed(() => {
  return props.rows.length > HEAVY_ITINERARY_ROWS_THRESHOLD
})

const totalItems = computed(() => {
  return props.rows.length
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(totalItems.value / pageSize.value))
})

const paginationStart = computed(() => {
  if (!totalItems.value) return 0

  return (currentPage.value - 1) * pageSize.value + 1
})

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * pageSize.value, totalItems.value)
})

const parseSortableNumber = (value) => {
  if (value === null || value === undefined) return null

  const match = String(value)
    .replace(",", ".")
    .match(/-?\d+(\.\d+)?/)

  if (!match) return null

  const parsedValue = Number(match[0])

  return Number.isFinite(parsedValue) ? parsedValue : null
}

const parseSortableDate = (value) => {
  const timestamp = new Date(value || 0).getTime()

  return Number.isNaN(timestamp) ? null : timestamp
}

const formatCoordinate = (value) => {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return "-"

  return numberValue.toFixed(6)
}

const statusLabel = (status) => {
  return statusLabels[status] || "Sin estado"
}

const getSortableValue = (row, columnKey) => {
  if (columnKey === "timestamp" || columnKey === "dateLabel") {
    return parseSortableDate(row.timestamp || row.date || row.fecha)
  }

  if (columnKey === "status") {
    return statusOrder[row.status] || 99
  }

  if (columnKey === "speed") {
    return parseSortableNumber(row.speed ?? row.speedLabel)
  }

  if (columnKey === "accumulatedDistanceKm") {
    return parseSortableNumber(row.accumulatedDistanceKm ?? row.accumulatedDistanceLabel)
  }

  if (columnKey === "lat" || columnKey === "lng") {
    return parseSortableNumber(row[columnKey])
  }

  return normalizeText(getCellValue(row, columnsByKey.value.get(columnKey) || { key: columnKey }))
}

const compareValues = (valueA, valueB) => {
  const emptyA = valueA === null || valueA === undefined || valueA === ""
  const emptyB = valueB === null || valueB === undefined || valueB === ""

  if (emptyA && emptyB) return 0
  if (emptyA) return 1
  if (emptyB) return -1

  if (typeof valueA === "number" && typeof valueB === "number") {
    return valueA - valueB
  }

  return textCollator.compare(String(valueA), String(valueB))
}

const toggleSort = (columnKey) => {
  if (sortColumnKey.value !== columnKey) {
    sortColumnKey.value = columnKey
    sortDirection.value = "asc"
    currentPage.value = 1
    return
  }

  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
  currentPage.value = 1
}

const resetSort = () => {
  sortColumnKey.value = "timestamp"
  sortDirection.value = "desc"
  currentPage.value = 1
}

const getSortIcon = (columnKey) => {
  if (sortColumnKey.value !== columnKey) return "-"

  return sortDirection.value === "asc" ? "^" : "v"
}

const formatTimeFromTimestamp = (timestamp) => {
  const date = new Date(timestamp || 0)

  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const getRowTimeLabel = (row) => {
  return row.timeLabel || formatTimeFromTimestamp(row.timestamp || row.date || row.fecha)
}

const getRowKey = (row, index) => {
  return [row.id, row.assetId, row.timestamp, row.lat, row.lng, row.speed, index]
    .map((value) => String(value ?? ""))
    .join("-")
}

const getCellValue = (row, column) => {
  if (column.key === "timestamp") return getRowTimeLabel(row)
  if (column.key === "status") return statusLabel(row.status)
  if (column.key === "speed") return row.speedLabel || `${row.speed || 0} km/h`
  if (column.key === "address") return row.address || "Sin direccion"
  if (column.key === "accumulatedDistanceKm") return row.accumulatedDistanceLabel || "0,0 km"
  if (column.key === "dateLabel") return row.dateLabel || "-"
  if (column.key === "assetDisplayName") {
    return row.assetDisplayName || row.assetPatente || getRouteAssetDisplayName()
  }

  if (column.key === "assetPatente") {
    return row.assetPatente || getRouteAssetPatente()
  }

  if (column.key === "assetDeviceId") {
    return row.assetDeviceId || getRouteAssetDeviceId()
  }

  if (column.key === "event") return row.event || "Reporte GPS"
  if (column.key === "lat" || column.key === "lng") return formatCoordinate(row[column.key])

  return row[column.key] ?? "-"
}

const getCellTitle = (row, column) => {
  if (column.key === "address") {
    return [row.address || "Sin direccion", row.event || "Reporte GPS"].join(" - ")
  }

  return getCellValue(row, column)
}

const getCellClass = (row, column) => {
  return [
    column.align === "right" ? "text-right" : "text-left",
    selectedPointIdString.value === String(row.id) && column.key === visibleColumns.value[0]?.key
      ? "shadow-[inset_3px_0_0_#FF6600]"
      : "",
  ]
}

const selectedPointIdString = computed(() => {
  if (props.selectedPointId === null || props.selectedPointId === undefined) return ""

  return String(props.selectedPointId)
})

const routeAsset = computed(() => {
  return props.route?.asset || null
})

const getRouteAssetDisplayName = () => {
  return (
    routeAsset.value?.displayName ||
    routeAsset.value?.vehiculo ||
    routeAsset.value?.patente ||
    routeAsset.value?.name ||
    "-"
  )
}

const getRouteAssetPatente = () => {
  return routeAsset.value?.patente || routeAsset.value?.patent || routeAsset.value?.vehiculo || "-"
}

const getRouteAssetDeviceId = () => {
  return (
    routeAsset.value?.deviceId || routeAsset.value?.imei || routeAsset.value?.identificador || "-"
  )
}

const isTimestampSort = computed(() => {
  return sortColumnKey.value === "timestamp"
})

const customSortedRowIndexes = computed(() => {
  if (isTimestampSort.value) return []

  const directionMultiplier = sortDirection.value === "asc" ? 1 : -1
  const columnKey = sortColumnKey.value
  const sortValues = props.rows.map((row) => getSortableValue(row, columnKey))
  const rowIndexes = props.rows.map((_, index) => index)

  rowIndexes.sort((indexA, indexB) => {
    const result = compareValues(sortValues[indexA], sortValues[indexB])

    if (result !== 0) {
      return result * directionMultiplier
    }

    return indexA - indexB
  })

  return rowIndexes
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value

  if (isTimestampSort.value) {
    if (sortDirection.value === "asc") {
      return props.rows.slice(start, end)
    }

    const sourceLength = props.rows.length
    const reversedStart = Math.max(sourceLength - end, 0)
    const reversedEnd = Math.max(sourceLength - start, 0)

    return props.rows.slice(reversedStart, reversedEnd).reverse()
  }

  return customSortedRowIndexes.value.slice(start, end).map((index) => props.rows[index])
})

const clampCurrentPage = () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }

  if (currentPage.value < 1) {
    currentPage.value = 1
  }
}

const goToPreviousPage = () => {
  currentPage.value = Math.max(1, currentPage.value - 1)
}

const goToNextPage = () => {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1)
}

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

watch(
  () => props.rows,
  () => {
    currentPage.value = 1
  },
)

watch([pageSize, totalItems], () => {
  clampCurrentPage()
})

onBeforeUnmount(() => {
  stopColumnResize()
})
</script>
