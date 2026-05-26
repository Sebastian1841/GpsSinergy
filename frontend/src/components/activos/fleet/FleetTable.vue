<template>
  <div class="min-h-0 min-w-0 flex-1 overflow-hidden bg-white">
    <div class="h-full min-w-0 overflow-auto">
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
            v-for="activo in activos"
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
  </div>
</template>

<script setup>
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
</script>
