<template>
  <section class="space-y-2">
    <section class="rounded-lg border border-[#d8dee8] bg-white p-3">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#FF6600]">
            Resumen del día
          </p>

          <h3 class="mt-0.5 truncate text-[13px] font-black text-[#102372]">
            {{ selectedAssetsSummary }}
          </h3>

          <p class="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
            Datos calculados con los mismos filtros del itinerario
          </p>
        </div>

        <span class="shrink-0 rounded-md bg-[#102372]/10 px-2 py-1 text-[10px] font-black text-[#102372]">
          {{ rangeLabel }}
        </span>
      </div>
    </section>

    <section class="grid grid-cols-2 gap-2">
      <article class="rounded-lg border border-[#d8dee8] bg-white p-3">
        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
          Dispositivos
        </p>

        <p class="mt-1 text-[16px] font-black text-[#102372]">
          {{ deviceCount }}
        </p>
      </article>

      <article class="rounded-lg border border-[#d8dee8] bg-white p-3">
        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
          Registros GPS
        </p>

        <p class="mt-1 text-[16px] font-black text-[#102372]">
          {{ rows.length }}
        </p>
      </article>

      <article class="rounded-lg border border-[#d8dee8] bg-white p-3">
        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
          Distancia
        </p>

        <p class="mt-1 truncate text-[16px] font-black text-[#102372]">
          {{ distanceLabel }}
        </p>
      </article>

      <article class="rounded-lg border border-[#d8dee8] bg-white p-3">
        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
          Movimiento
        </p>

        <p class="mt-1 truncate text-[16px] font-black text-[#102372]">
          {{ movingLabel }}
        </p>
      </article>
    </section>

    <section class="rounded-lg border border-[#d8dee8] bg-white p-3">
      <div class="mb-2 flex items-center justify-between gap-2">
        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
          Actividad del día
        </p>

        <span class="rounded-md bg-[#FF6600]/10 px-2 py-0.5 text-[10px] font-black text-[#FF6600]">
          {{ activityStatus }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div class="rounded-lg bg-[#f8fafc] px-3 py-2">
          <p class="text-[10px] font-bold text-slate-500">
            Primer registro
          </p>

          <p class="mt-0.5 truncate text-[11px] font-black text-[#102372]">
            {{ firstRecordLabel }}
          </p>
        </div>

        <div class="rounded-lg bg-[#f8fafc] px-3 py-2">
          <p class="text-[10px] font-bold text-slate-500">
            Último registro
          </p>

          <p class="mt-0.5 truncate text-[11px] font-black text-[#102372]">
            {{ lastRecordLabel }}
          </p>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  summary: {
    type: Object,
    default: () => ({}),
  },
  rows: {
    type: Array,
    default: () => [],
  },
  selectedAssets: {
    type: Array,
    default: () => [],
  },
  selectedAssetsSummary: {
    type: String,
    default: "Seleccionar dispositivos",
  },
  rangeLabel: {
    type: String,
    default: "Hoy",
  },
})

const deviceCount = computed(() => {
  return props.selectedAssets.length || props.summary.assetsCount || 1
})

const distanceLabel = computed(() => {
  return (
    props.summary.distanceLabel ||
    props.summary.distance ||
    props.summary.totalDistance ||
    "-"
  )
})

const movingLabel = computed(() => {
  return (
    props.summary.movingLabel ||
    props.summary.durationLabel ||
    props.summary.totalMovingTime ||
    "-"
  )
})

const activityStatus = computed(() => {
  if (!props.rows.length) return "Sin actividad"
  return "Con actividad"
})

const getRowDate = (row) => {
  return row.timestamp || row.date || row.fecha || row.time || row.hora || null
}

const formatTime = (value) => {
  if (!value) return "-"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const sortedRows = computed(() => {
  return [...props.rows].sort((a, b) => {
    const dateA = new Date(getRowDate(a) || 0).getTime()
    const dateB = new Date(getRowDate(b) || 0).getTime()

    return dateA - dateB
  })
})

const firstRecordLabel = computed(() => {
  return formatTime(getRowDate(sortedRows.value[0]))
})

const lastRecordLabel = computed(() => {
  return formatTime(getRowDate(sortedRows.value[sortedRows.value.length - 1]))
})
</script>