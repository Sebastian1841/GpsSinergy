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
              class="whitespace-nowrap px-2 text-[10px] font-black uppercase tracking-[0.03em] text-white"
              :class="column.align === 'right' ? 'text-right' : 'text-left'"
            >
              <button
                type="button"
                class="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md px-1 py-1 text-white/90 transition hover:bg-white/10 hover:text-white"
                :class="[
                  column.align === 'right' ? 'justify-end' : 'justify-start',
                  sortColumnKey === column.key ? 'text-white' : '',
                ]"
                :title="`Ordenar por ${column.label}`"
                @click="$emit('toggle-sort', column.key)"
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
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="activo in paginatedActivos"
            :key="activo.id"
            :data-activo-id="String(activo.id)"
            class="h-[32px] cursor-context-menu border-b border-[#edf1f5] transition hover:bg-[#f6f8fb]"
            :class="isSelected(activo) ? 'bg-[#fff7ed]' : 'bg-white'"
            @click.left="$emit('select', activo)"
            @contextmenu.prevent.stop="$emit('open-context-menu', { event: $event, activo })"
          >
            <td
              v-for="column in visibleColumns"
              :key="column.key"
              class="max-w-[190px] truncate px-2"
              :class="[
                column.align === 'right' ? 'text-right' : 'text-left',
                isSelected(activo) && column.key === firstVisibleColumnKey
                  ? 'shadow-[inset_3px_0_0_#FF6600]'
                  : '',
              ]"
              :title="resolveCellValue(activo, column)"
            >
              <template v-if="column.key === 'estado'">
                <span
                  class="inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-black"
                  :class="statusChipClass(activo.estado)"
                >
                  <span
                    class="h-1.5 w-1.5 shrink-0 rounded-full"
                    :class="statusDotClass(activo.estado)"
                  ></span>

                  <span class="truncate">
                    {{ statusLabel(activo.estado) }}
                  </span>
                </span>
              </template>

              <template v-else-if="column.key === 'vehiculo'">
                <span class="block truncate font-black text-[#102372]">
                  {{ activo.vehiculo || "-" }}
                </span>
              </template>

              <template v-else-if="column.key === 'trackerModelLabel'">
                <span class="block truncate font-bold text-slate-700">
                  {{ resolveCellValue(activo, column) }}
                </span>
              </template>

              <template v-else-if="column.key === 'imei'">
                <span class="block truncate font-mono text-[10px] font-bold text-slate-600">
                  {{ resolveCellValue(activo, column) }}
                </span>
              </template>

              <template v-else-if="column.key === 'protocol'">
                <span
                  class="inline-flex rounded-md bg-[#eef3ff] px-1.5 py-0.5 text-[10px] font-black uppercase text-[#102372]"
                >
                  {{ resolveCellValue(activo, column) }}
                </span>
              </template>

              <template
                v-else-if="['horometroDiario', 'horometroTotal', 'odometro'].includes(column.key)"
              >
                <span class="font-bold text-slate-700">
                  {{ resolveCellValue(activo, column) }}
                </span>
              </template>

              <template v-else>
                <span class="block truncate font-semibold text-slate-600">
                  {{ resolveCellValue(activo, column) }}
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
      class="flex shrink-0 flex-col gap-2 border-t border-[#d8dee8] bg-[#f8fafc] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex min-w-0 items-center gap-2">
        <span class="text-[10px] font-black uppercase tracking-[0.12em] text-[#102372]">
          Tabla
        </span>

        <span class="truncate text-[11px] font-bold text-slate-500">
          {{ paginationStart }}-{{ paginationEnd }} de {{ totalItems }} activos
        </span>
      </div>

      <div class="flex items-center justify-between gap-2 sm:justify-end">
        <label class="flex items-center gap-2 text-[11px] font-bold text-slate-500">
          <span class="hidden sm:inline">Filas</span>

          <select
            v-model.number="pageSize"
            class="h-8 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-2 text-[11px] font-black text-[#102372] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
          >
            <option v-for="option in pageSizeOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </label>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="h-8 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#d8dee8] disabled:hover:text-[#102372]"
            :disabled="currentPage <= 1"
            @click="goToPreviousPage"
          >
            Anterior
          </button>

          <span
            class="flex h-8 min-w-[74px] items-center justify-center rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-black text-[#102372]"
          >
            {{ currentPage }} / {{ totalPages }}
          </span>

          <button
            type="button"
            class="h-8 cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#d8dee8] disabled:hover:text-[#102372]"
            :disabled="currentPage >= totalPages"
            @click="goToNextPage"
          >
            Siguiente
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"

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
})

defineEmits(["select", "toggle-sort", "open-context-menu"])

const pageSizeOptions = [25, 50, 100, 200]
const currentPage = ref(1)
const pageSize = ref(50)

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
  if (props.selectedId === null || props.selectedId === undefined) return

  const selectedIndex = props.activos.findIndex((activo) => {
    return String(activo.id) === String(props.selectedId)
  })

  if (selectedIndex < 0) return

  currentPage.value = Math.floor(selectedIndex / pageSize.value) + 1
}

const isSelected = (activo) => {
  if (props.selectedId === null || props.selectedId === undefined) return false

  return String(props.selectedId) === String(activo.id)
}

const resolveCellValue = (activo, column) => {
  return props.getCellValue(activo, column)
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
    moving: "bg-emerald-50 text-emerald-700",
    idle: "bg-sky-50 text-sky-700",
    stopped: "bg-red-50 text-red-700",
    offline: "bg-slate-100 text-slate-500",
  }

  return classes[estado] || "bg-slate-100 text-slate-500"
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
</script>
