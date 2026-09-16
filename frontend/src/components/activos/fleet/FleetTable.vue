<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
    <div class="min-h-0 min-w-0 flex-1 overflow-auto">
      <table class="w-max min-w-full border-collapse text-[11px] text-[#172033]">
        <colgroup>
          <col
            v-for="column in visibleColumns"
            :key="column.key"
            :style="{ width: column.width || '110px' }"
          />
        </colgroup>

        <thead class="sticky top-0 z-20 bg-[#102372]">
          <tr class="h-[34px] border-b border-[#0c1b59]">
            <th
              v-for="column in visibleColumns"
              :key="column.key"
              draggable="true"
              class="group relative whitespace-nowrap px-2 text-[10px] font-black uppercase tracking-[0.03em] text-white"
              :class="column.align === 'right' ? 'text-right' : 'text-left'"
              @dragstart="handleColumnDragStart($event, column.key)"
              @dragover.prevent
              @drop="handleColumnDrop(column.key)"
              @dragend="handleColumnDragEnd"
            >
              <button
                type="button"
                draggable="true"
                class="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md px-1 py-1 text-white/90 transition hover:bg-white/10 hover:text-white"
                :class="[
                  column.align === 'right' ? 'justify-end' : 'justify-start',
                  sortColumnKey === column.key ? 'text-white' : '',
                ]"
                :title="`Ordenar por ${column.label}`"
                @click="$emit('toggle-sort', column.key)"
                @contextmenu.stop.prevent
                @dragstart.stop="handleColumnDragStart($event, column.key)"
                @dragover.prevent
                @drop.stop="handleColumnDrop(column.key)"
                @dragend.stop="handleColumnDragEnd"
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
            v-for="row in paginatedTableRows"
            :key="row.key"
            :data-activo-id="row.id"
            class="h-[32px] cursor-context-menu border-b border-[#edf1f5] transition hover:bg-[#f6f8fb]"
            :class="row.isSelected ? 'bg-[#fff7ed]' : 'bg-white'"
            @click.left="$emit('select', row.activo)"
            @contextmenu.prevent.stop="
              $emit('open-context-menu', { event: $event, activo: row.activo })
            "
          >
            <td
              v-for="cell in row.cells"
              :key="cell.column.key"
              class="max-w-[190px] truncate px-2"
              :class="[
                cell.column.align === 'right' ? 'text-right' : 'text-left',
                row.isSelected && cell.column.key === firstVisibleColumnKey
                  ? 'shadow-[inset_3px_0_0_#FF6600]'
                  : '',
              ]"
              :title="cell.value"
            >
              <template v-if="cell.column.key === 'estado'">
                <span
                  class="inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-black"
                  :class="statusChipClass(row.activo.estado)"
                >
                  <span
                    class="h-1.5 w-1.5 shrink-0 rounded-full"
                    :class="statusDotClass(row.activo.estado)"
                  ></span>

                  <span class="truncate">
                    {{ statusLabel(row.activo.estado) }}
                  </span>
                </span>
              </template>

              <template v-else-if="cell.column.key === 'vehiculo'">
                <span class="block truncate font-black text-[#102372]">
                  {{ cell.value }}
                </span>
              </template>

              <template v-else-if="cell.column.key === 'trackerModelLabel'">
                <span class="block truncate font-bold text-slate-700">
                  {{ cell.value }}
                </span>
              </template>

              <template v-else-if="cell.column.key === 'imei'">
                <span class="block truncate font-mono text-[10px] font-bold text-slate-600">
                  {{ cell.value }}
                </span>
              </template>

              <template v-else-if="cell.column.key === 'protocol'">
                <span
                  class="inline-flex rounded-md bg-[#eef3ff] px-1.5 py-0.5 text-[10px] font-black uppercase text-[#102372]"
                >
                  {{ cell.value }}
                </span>
              </template>

              <template v-else-if="numericDetailColumnKeys.has(cell.column.key)">
                <span class="font-bold text-slate-700">
                  {{ cell.value }}
                </span>
              </template>

              <template v-else>
                <span class="block truncate font-semibold text-slate-600">
                  {{ cell.value }}
                </span>
              </template>
            </td>
          </tr>

          <tr v-if="!activos.length">
            <td
              :colspan="visibleColumns.length || 1"
              class="px-4 py-8 text-center text-xs font-semibold text-slate-500"
            >
              No se encontraron activos.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer
      v-if="activos.length"
      class="@container shrink-0 border-t border-[#d8dee8] bg-[#f8fafc] px-2 py-2"
    >
      <div class="flex items-center gap-2 @max-[360px]:flex-wrap">
        <!-- RESUMEN -->
        <div class="flex min-w-0 flex-1 items-center gap-1 whitespace-nowrap">
          <span class="text-[11px] font-black text-[#102372]">
            {{ paginationStart }}–{{ paginationEnd }}
          </span>

          <span class="text-[9px] font-semibold text-slate-400"> de </span>

          <span class="text-[11px] font-black text-[#102372]">
            {{ totalItems }}
          </span>

          <span class="text-[9px] font-semibold text-slate-500"> activos </span>

          <span
            v-if="shouldResolveAddresses"
            class="ml-1 min-w-0 truncate text-[9px] font-medium text-slate-400 @max-[520px]:hidden"
          >
            {{ reverseGeocodingAttribution }}
          </span>
        </div>

        <!-- FILAS -->
        <label class="flex shrink-0 items-center gap-1.5">
          <span class="text-[9px] font-bold text-slate-500"> Filas </span>

          <select
            v-model.number="pageSize"
            class="h-8 w-[58px] cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372] outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
          >
            <option v-for="option in pageSizeOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </label>

        <!-- PAGINACIÓN -->
        <div
          class="flex shrink-0 items-center gap-1 @max-[360px]:w-full @max-[360px]:justify-center"
        >
          <button
            type="button"
            :disabled="currentPage <= 1"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#d8dee8] bg-white text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600] disabled:cursor-not-allowed disabled:text-slate-300"
            @click="goToPreviousPage"
          >
            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none">
              <path
                d="M12.5 15 7.5 10l5-5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <div
            class="flex h-8 min-w-[58px] shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372]"
          >
            {{ currentPage }} / {{ totalPages }}
          </div>

          <button
            type="button"
            :disabled="currentPage >= totalPages"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#d8dee8] bg-white text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600] disabled:cursor-not-allowed disabled:text-slate-300"
            @click="goToNextPage"
          >
            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none">
              <path
                d="m7.5 5 5 5-5 5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useReverseGeocodedRows } from "../../../composables/location/useReverseGeocodedRows.js"
import { withGeofenceLocationAddress } from "../../../utils/activos/geofenceMembershipUtils.js"

const props = defineProps({
  activos: {
    type: Array,
    default: () => [],
  },
  visibleColumns: {
    type: Array,
    default: () => [],
  },
  selectedId: {
    type: [Number, String],
    default: null,
  },
  firstVisibleColumnKey: {
    type: String,
    default: "",
  },
  sortColumnKey: {
    type: String,
    default: "",
  },
  getSortIcon: {
    type: Function,
    required: true,
  },
  getCellValue: {
    type: Function,
    required: true,
  },
  geofences: {
    type: Array,
    default: () => [],
  },
  useGeofenceLocationAddress: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  "select",
  "toggle-sort",
  "open-context-menu",
  "resize-column",
  "move-column",
])

const pageSizeOptions = [25, 50, 100, 200]
const currentPage = ref(1)
const pageSize = ref(50)
const draggedColumnKey = ref("")

let resizeState = null

const numericDetailColumnKeys = new Set([
  "velocidad",
  "gpsSignal",
  "gpsSatellites",
  "lat",
  "lng",
  "combustible",
  "canRpm",
  "canEngineTemp",
  "canBatteryVoltage",
  "canEngineLoad",
  "canThrottle",
  "canFuelRate",
  "canFuelUsed",
  "canOilPressure",
  "canAdBlueLevel",
  "canDtcCount",
  "horometroDiario",
  "horometroTotal",
  "odometro",
])

const selectedIdString = computed(() => {
  if (props.selectedId === null || props.selectedId === undefined) return ""

  return String(props.selectedId)
})

const totalItems = computed(() => {
  return props.activos.length
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

const paginatedActivos = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value

  return props.activos.slice(start, end)
})

const paginatedActivosWithGeofenceLocations = computed(() => {
  if (
    !shouldResolveAddresses.value ||
    !props.geofences.length ||
    !props.useGeofenceLocationAddress
  ) {
    return paginatedActivos.value
  }

  return paginatedActivos.value.map((activo) => {
    return withGeofenceLocationAddress(activo, props.geofences, {
      replaceAddress: true,
    })
  })
})

const shouldResolveAddresses = computed(() => {
  return props.visibleColumns.some((column) => column.key === "lastPosition")
})

const { rowsWithResolvedAddresses: paginatedActivosWithAddresses, reverseGeocodingAttribution } =
  useReverseGeocodedRows(paginatedActivosWithGeofenceLocations, {
    enabled: shouldResolveAddresses,
  })

const statusLabel = (estado) => {
  const labels = {
    moving: "Ruta",
    idle: "Espera",
    stopped: "Detenido",
    offline: "Offline",
  }

  return labels[estado] || "Sin estado"
}

const statusDotClass = (estado) => {
  const classes = {
    moving: "bg-emerald-500",
    idle: "bg-sky-500",
    stopped: "bg-[#ff6600]",
    offline: "bg-slate-400",
  }

  return classes[estado] || "bg-slate-400"
}

const statusChipClass = (estado) => {
  const classes = {
    moving: "bg-emerald-50 text-emerald-700",
    idle: "bg-sky-50 text-sky-700",
    stopped: "bg-[#fff3eb] text-[#ff6600]",
    offline: "bg-slate-100 text-slate-500",
  }

  return classes[estado] || "bg-slate-100 text-slate-500"
}

const resolveCellValue = (activo, column) => {
  if (column.key === "estado") {
    return statusLabel(activo.estado)
  }

  if (column.key === "vehiculo") {
    return activo.vehiculo || "-"
  }

  return props.getCellValue(activo, column)
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

  emit("move-column", draggedColumnKey.value, targetColumnKey)
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

  emit("resize-column", resizeState.columnKey, nextWidth)
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

const paginatedTableRows = computed(() => {
  const rowKeyOccurrences = new Map()

  return paginatedActivosWithAddresses.value.map((activo, index) => {
    const activoId =
      activo.id === null || activo.id === undefined || activo.id === "" ? "" : String(activo.id)
    const baseRowKey = [
      activoId || "asset",
      activo.imei ||
        activo.deviceId ||
        activo.patente ||
        activo.patent ||
        paginationStart.value + index,
    ]
      .map((value) => String(value ?? ""))
      .join("::")
    const occurrence = rowKeyOccurrences.get(baseRowKey) || 0

    rowKeyOccurrences.set(baseRowKey, occurrence + 1)

    return {
      id: activoId,
      key: occurrence ? `${baseRowKey}::${occurrence}` : baseRowKey,
      activo,
      isSelected: selectedIdString.value === activoId,
      cells: props.visibleColumns.map((column) => {
        return {
          column,
          value: resolveCellValue(activo, column),
        }
      }),
    }
  })
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

const goToSelectedActivoPage = () => {
  if (!selectedIdString.value) return

  const selectedIndex = props.activos.findIndex((activo) => {
    return String(activo.id) === selectedIdString.value
  })

  if (selectedIndex < 0) return

  currentPage.value = Math.floor(selectedIndex / pageSize.value) + 1
}

watch(
  [pageSize, () => props.activos.length],
  () => {
    clampCurrentPage()
  },
  {
    immediate: true,
  },
)

watch(
  () => props.selectedId,
  () => {
    goToSelectedActivoPage()
  },
)

onBeforeUnmount(() => {
  stopColumnResize()
})
</script>
