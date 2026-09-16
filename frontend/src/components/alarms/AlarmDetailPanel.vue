<template>
  <aside class="flex min-h-0 flex-col rounded-lg border border-[#dfe6f0] bg-white p-3 shadow-sm">
    <template v-if="alarm">
      <header class="shrink-0">
        <div class="flex items-start justify-between gap-4">
          <span
            class="inline-flex h-7 items-center gap-2 rounded-lg px-2.5 text-[10px] font-black uppercase"
            :class="statusChipClass"
          >
            <span class="h-2 w-2 rounded-full" :class="statusDotClass"></span>
            {{ statusLabel }}
          </span>

          <button
            type="button"
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#5f7396] transition hover:bg-[#eef3ff] hover:text-[#ff6600]"
            aria-label="Cerrar detalle de alerta"
            @click="$emit('close')"
          >
            <SvgIcon name="close" class="h-4 w-4" />
          </button>
        </div>

        <h2 class="mt-4 text-[20px] font-black leading-tight text-[#102372]">
          {{ alarm.title }}
        </h2>

        <p class="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          <span class="font-black text-[#49658f]">{{ alarm.assetPlate }}</span>
          <span class="h-4 w-px bg-[#cfd8e6]"></span>
          <span class="font-semibold text-[#49658f]">{{ alarm.assetName }}</span>
        </p>
      </header>

      <div class="my-3 h-px shrink-0 bg-[#dfe6f0]"></div>

      <main class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <article class="alarm-detail-row">
          <span class="alarm-detail-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 21V7l8-4 8 4v14M8 21v-8h8v8M8 10h.01M12 10h.01M16 10h.01"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="min-w-0">
            <span class="alarm-detail-label">Empresa</span>
            <span class="alarm-detail-value">{{ alarm.companyName }}</span>
          </span>
        </article>

        <article class="alarm-detail-row">
          <span class="alarm-detail-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          </span>
          <span class="min-w-0">
            <span class="alarm-detail-label">Fecha y hora</span>
            <span class="alarm-detail-value">{{ formatDateTime(alarm.createdAt) }}</span>
          </span>
        </article>

        <article class="alarm-detail-row">
          <span class="alarm-detail-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                cx="12"
                cy="10"
                r="2.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="min-w-0">
            <span class="alarm-detail-label">Ubicacion</span>
            <span class="alarm-detail-value">{{ locationText }}</span>
          </span>
        </article>

        <article v-if="triggerReason" class="alarm-detail-row">
          <span class="alarm-detail-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3v10M12 17h.01M5.5 21h13L12 3 5.5 21z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="min-w-0">
            <span class="alarm-detail-label">Motivo</span>
            <span class="alarm-detail-value leading-5">{{ triggerReason }}</span>
          </span>
        </article>

        <article class="alarm-detail-row">
          <span class="alarm-detail-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 3h7l3 3v15H7V3z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M14 3v4h4M10 12h5M10 16h5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="min-w-0">
            <span class="alarm-detail-label">Descripcion</span>
            <span class="alarm-detail-value leading-5">{{ detailDescription }}</span>
          </span>
        </article>
      </main>

      <footer class="mt-3 shrink-0 border-t border-[#dfe6f0] pt-3">
        <button
          type="button"
          class="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#102372] bg-white px-4 text-[12px] font-black text-[#102372] transition hover:border-[#ff6600] hover:text-[#ff6600]"
          @click="$emit('view-asset', alarm)"
        >
          <SvgIcon name="mapa" class="h-4 w-4" />
          Ver recorrido
        </button>

        <div v-if="canManage" class="mt-3 grid gap-2">
          <button
            v-if="alarm.status !== 'resolved'"
            type="button"
            class="alarm-detail-action-primary"
            @click="$emit('resolve-alarm', alarm.id)"
          >
            Resolver
          </button>

          <button
            v-if="alarm.status === 'resolved'"
            type="button"
            class="alarm-detail-action"
            @click="$emit('reopen-alarm', alarm.id)"
          >
            Reabrir
          </button>
        </div>
      </footer>
    </template>

    <div
      v-else
      class="flex min-h-[22rem] flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[#cfd8e6] bg-[#f8fafc] px-5 text-center"
    >
      <p class="text-[15px] font-black text-[#102372]">Selecciona una alerta</p>
      <p class="mt-1 max-w-sm text-[11px] font-semibold leading-5 text-slate-500">
        El detalle operativo aparecera aqui para revisar empresa, activo, ubicacion y acciones
        disponibles.
      </p>
    </div>
  </aside>
</template>

<script setup>
import { computed } from "vue"

import SvgIcon from "../icons/SvgIcon.vue"

const props = defineProps({
  alarm: {
    type: Object,
    default: null,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
})

defineEmits(["close", "resolve-alarm", "reopen-alarm", "view-asset"])

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "numeric",
  minute: "2-digit",
})

const isResolved = computed(() => props.alarm?.status === "resolved")
const statusLabel = computed(() => (isResolved.value ? "Resuelta" : "Activa"))
const statusChipClass = computed(() =>
  isResolved.value ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
)
const statusDotClass = computed(() => (isResolved.value ? "bg-[#16a34a]" : "bg-[#ef1b23]"))

const locationText = computed(() => {
  const metadata = props.alarm?.metadata || {}

  return (
    metadata.address ||
    metadata.location ||
    metadata.geofence ||
    metadata.route ||
    metadata.zone ||
    "Ubicacion no disponible"
  )
})

const detailDescription = computed(() => {
  const alarm = props.alarm
  const metadata = alarm?.metadata || {}

  if (!alarm) return ""

  if (alarm.type === "speeding" && metadata.speed && metadata.limit) {
    return `${alarm.description} Se registro ${metadata.speed} sobre un limite de ${metadata.limit}.`
  }

  if (alarm.type === "battery" && metadata.voltage) {
    return `${alarm.description} Voltaje reportado: ${metadata.voltage}.`
  }

  if (alarm.type === "no_signal" && metadata.offlineMinutes) {
    return `${alarm.description} Tiempo sin reporte: ${metadata.offlineMinutes}.`
  }

  return alarm.description || "Sin descripcion disponible."
})

const triggerReason = computed(() => props.alarm?.triggerReason || "")

const formatDateTime = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return dateTimeFormatter.format(date)
}
</script>

<style scoped>
.alarm-detail-row {
  display: grid;
  grid-template-columns: 1.625rem minmax(0, 1fr);
  gap: 0.625rem;
  align-items: start;
}

.alarm-detail-icon {
  display: inline-flex;
  width: 1.625rem;
  height: 1.625rem;
  align-items: center;
  justify-content: center;
  color: #315078;
}

.alarm-detail-icon svg {
  width: 1.125rem;
  height: 1.125rem;
}

.alarm-detail-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #5f7396;
}

.alarm-detail-value {
  display: block;
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  font-weight: 750;
  color: #102372;
}

.alarm-detail-action,
.alarm-detail-action-primary {
  display: inline-flex;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  padding: 0 1rem;
  font-size: 0.75rem;
  font-weight: 900;
  transition:
    border-color 120ms ease,
    color 120ms ease,
    background-color 120ms ease;
}

.alarm-detail-action {
  border: 1px solid #cfd8e6;
  background: #ffffff;
  color: #102372;
}

.alarm-detail-action:hover {
  border-color: #ff6600;
  color: #ff6600;
}

.alarm-detail-action-primary {
  border: 1px solid #ff6600;
  background: #ff6600;
  color: #ffffff;
}

.alarm-detail-action-primary:hover {
  background: #e65c00;
}
</style>
