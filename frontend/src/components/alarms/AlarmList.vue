<template>
  <section
    class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#dfe6f0] bg-white shadow-sm"
  >
    <div
      class="hidden h-9 shrink-0 items-center border-b border-[#e5ebf3] bg-[#f8fbff] px-3 text-[10px] font-black uppercase tracking-[0.08em] text-[#5f7396] md:grid md:grid-cols-[30px_minmax(220px,1fr)_minmax(170px,0.5fr)_minmax(220px,0.75fr)_145px]"
    >
      <span></span>
      <span>Alerta</span>
      <span>Empresa</span>
      <span>Ubicacion</span>
      <span>Fecha</span>
    </div>

    <div class="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
      <button
        v-for="alarm in rows"
        :key="alarm.id"
        type="button"
        class="grid w-full min-w-0 items-center gap-2.5 rounded-lg border bg-white px-3 py-2 text-left transition hover:border-[#9eb3d1] hover:bg-[#f8fbff] md:grid-cols-[30px_minmax(220px,1fr)_minmax(170px,0.5fr)_minmax(220px,0.75fr)_145px]"
        :class="
          selectedAlarmId === alarm.id
            ? 'border-[#102372] bg-[#f7faff] ring-1 ring-[#102372]/15'
            : 'border-[#e1e8f2]'
        "
        @click="$emit('select-alarm', alarm.id)"
      >
        <span class="flex items-center justify-start md:justify-center">
          <span
            class="h-3.5 w-3.5 rounded-full shadow-[0_0_0_3px_rgb(255_255_255)]"
            :class="getAlarmToneClass(alarm)"
          ></span>
        </span>

        <span class="min-w-0">
          <span class="block truncate text-[13px] font-black leading-5 text-[#102372]">
            {{ alarm.title }}
          </span>
          <span class="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
            <span class="font-black text-[#102372]">{{ alarm.assetPlate }}</span>
            <span class="h-3.5 w-px bg-[#cfd8e6]"></span>
            <span class="min-w-0 truncate font-semibold text-[#49658f]">
              {{ alarm.assetName }}
            </span>
          </span>
        </span>

        <span class="min-w-0 truncate text-[12px] font-bold text-[#234572]">
          {{ alarm.companyName }}
        </span>

        <span class="hidden min-w-0 truncate text-[11px] font-semibold text-[#5f7396] md:block">
          {{ getLocationText(alarm) }}
        </span>

        <span class="flex items-center gap-2 text-[11px] font-semibold text-[#49658f]">
          <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0 text-[#102372]" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12 7v5l3 2"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="min-w-0 truncate">{{ formatRelativeDateTime(alarm.createdAt) }}</span>
        </span>
      </button>

      <div
        v-if="!rows.length"
        class="flex min-h-[16rem] flex-col items-center justify-center rounded-lg border border-dashed border-[#cfd8e6] bg-[#f8fafc] px-4 text-center"
      >
        <p class="text-[14px] font-black text-[#102372]">Sin alertas activadas para mostrar</p>
        <p class="mt-1 max-w-md text-[11px] font-semibold text-slate-500">
          Ajusta los filtros o revisa el alcance de activos del usuario.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  selectedAlarmId: {
    type: String,
    default: "",
  },
})

defineEmits(["select-alarm"])

const DAY_IN_MS = 24 * 60 * 60 * 1000

const timeFormatter = new Intl.DateTimeFormat("es-CL", {
  hour: "numeric",
  minute: "2-digit",
})

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
})

const getStartOfDay = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

const getAlarmToneClass = (alarm) => {
  return alarm.status === "resolved" ? "bg-[#16a34a]" : "bg-[#ef1b23]"
}

const getLocationText = (alarm) => {
  const metadata = alarm?.metadata || {}

  return (
    metadata.address ||
    metadata.location ||
    metadata.geofence ||
    metadata.route ||
    metadata.zone ||
    "-"
  )
}

const formatRelativeDateTime = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  const today = new Date()
  const daysDelta = Math.round((getStartOfDay(today) - getStartOfDay(date)) / DAY_IN_MS)
  const timeLabel = timeFormatter.format(date)

  if (daysDelta === 0) return `Hoy, ${timeLabel}`
  if (daysDelta === 1) return `Ayer, ${timeLabel}`

  return `${dateFormatter.format(date)}, ${timeLabel}`
}
</script>
