<template>
  <div v-if="!totalItems" class="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
    <div
      class="flex min-h-[230px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center"
    >
      <div
        class="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-[#102372] text-[17px] font-black text-white"
      >
        G
      </div>

      <p class="text-[13px] font-black text-slate-800">
        {{ emptyTitle }}
      </p>

      <p class="mt-1 max-w-[430px] text-[11px] font-semibold leading-relaxed text-slate-500">
        {{ emptyDescription }}
      </p>

      <button
        v-if="hasActiveFilters"
        type="button"
        class="mt-4 cursor-pointer rounded-lg bg-[#102372] px-4 py-2 text-[11px] font-black text-white transition hover:bg-[#0b1a58]"
        @pointerdown.stop
        @click.stop="$emit('clear-filters')"
      >
        Quitar filtros
      </button>
    </div>
  </div>

  <div v-else class="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
    <div class="overflow-hidden rounded-xl border border-slate-200">
      <div
        class="hidden grid-cols-[1.2fr_0.8fr_0.8fr_0.55fr_0.55fr] gap-3 border-b border-slate-200 bg-[#102372] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 md:grid"
      >
        <button
          v-for="column in columns"
          :key="column.key"
          type="button"
          class="flex cursor-pointer items-center gap-1 text-left transition hover:text-white"
          @click.stop="$emit('toggle-sort', column.key)"
        >
          {{ column.label }}
          <span class="text-[9px]">{{ getSortIcon(column.key) }}</span>
        </button>
      </div>

      <div
        v-for="row in paginatedRows"
        :key="row.key"
        class="grid gap-2 border-b border-slate-100 bg-white px-4 py-3 last:border-b-0 hover:bg-slate-50 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.55fr_0.55fr] md:items-center"
      >
        <div class="min-w-0">
          <p class="truncate text-[12px] font-black text-slate-900">
            {{ row.event.patent || row.event.vehicle || "Sin patente" }}
          </p>

          <p class="truncate text-[10px] font-semibold text-slate-500">
            {{ row.event.vehicle || "Vehiculo" }} / {{ row.event.driver || "Sin conductor" }}
          </p>
        </div>

        <div>
          <span
            class="inline-flex rounded-md px-2 py-1 text-[10px] font-black"
            :class="getGeofenceHistoryEventClass(row.event.eventType)"
          >
            {{ row.event.eventLabel || row.eventLabel }}
          </span>
        </div>

        <p class="text-[11px] font-bold text-slate-600">
          {{ row.displayDate }}
        </p>

        <p class="text-[11px] font-bold text-slate-600">{{ row.event.speed ?? "-" }} km/h</p>

        <p class="text-[11px] font-bold text-slate-600">
          {{ row.event.duration || "-" }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getGeofenceHistoryEventClass } from "../../../../utils/activos/geofenceHistoryUtils.js"

const columns = [
  {
    key: "vehicle",
    label: "Vehiculo",
  },
  {
    key: "event",
    label: "Evento",
  },
  {
    key: "date",
    label: "Fecha",
  },
  {
    key: "speed",
    label: "Velocidad",
  },
  {
    key: "duration",
    label: "Tiempo",
  },
]

defineProps({
  totalItems: {
    type: Number,
    default: 0,
  },
  paginatedRows: {
    type: Array,
    default: () => [],
  },
  emptyTitle: {
    type: String,
    required: true,
  },
  emptyDescription: {
    type: String,
    required: true,
  },
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
  getSortIcon: {
    type: Function,
    required: true,
  },
})

defineEmits(["clear-filters", "toggle-sort"])
</script>
