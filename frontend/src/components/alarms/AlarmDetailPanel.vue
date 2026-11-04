<template>
  <aside class="flex min-h-0 flex-col rounded-lg border border-[#dfe6f0] bg-white p-3 shadow-sm">
    <template v-if="alarm">
      <header class="shrink-0">
        <div class="flex items-start justify-between gap-4">
          <span
            class="inline-flex min-h-7 min-w-0 items-center gap-2 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase"
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
        <AlarmAttentionForm
          v-if="canManage && attentionCount && attending"
          :key="alarm.id + ':' + attentionCount"
          :count="attentionCount"
          @save="$emit('attend-alarm', { id: alarm.id, ...$event })"
          @cancel="$emit('cancel-attention')"
        />
        <details v-if="alarm.metadata?.attentionHistory?.length" class="text-[12px] text-[#49658f]">
          <summary class="cursor-pointer font-semibold">
            Historial de atencion ({{ alarm.metadata.attentionHistory.length }})
          </summary>
          <ol class="mt-2 space-y-2">
            <li
              v-for="(entry, index) in alarm.metadata.attentionHistory"
              :key="index"
              class="border-l-2 border-[#d8e0eb] pl-2"
            >
              <p class="font-semibold">
                {{ entry.label || "Atencion registrada" }} · {{ entry.actor || entry.startedBy }}
              </p>
              <p>{{ formatDateTime(entry.at || entry.startedAt) }}</p>
              <p v-if="entry.note" class="whitespace-pre-wrap">{{ entry.note }}</p>
            </li>
          </ol>
        </details>
        <div
          v-if="alarm.groupMembers?.length > 1"
          class="rounded-md bg-[#eef3ff] px-3 py-2 text-[12px] text-[#102372]"
        >
          {{ alarm.groupMembers.length }} episodios del mismo vehiculo, regla y dia
          <ul class="mt-2 max-h-36 space-y-2 overflow-y-auto">
            <li
              v-for="episode in alarm.groupMembers"
              :key="episode.id"
              class="border-t border-[#d8e0eb] pt-2"
            >
              <span class="font-semibold">{{ formatDateTime(episode.createdAt) }}</span>
              <p>{{ episode.triggerReason || episode.description }}</p>
              <p class="text-[#5f7396]">{{ alarmAttentionLabel(episode) }}</p>
            </li>
          </ul>
        </div>
        <div v-if="!attending" class="alarm-information space-y-3">
          <article v-if="alarm.metadata?.attention" class="text-[12px] text-[#49658f]">
            <p>
              En atencion por {{ alarm.metadata.attention.startedBy }} ·
              {{ formatDateTime(alarm.metadata.attention.startedAt) }}
            </p>
            <p v-if="alarm.metadata.attention.note" class="mt-2 whitespace-pre-wrap">
              {{ alarm.metadata.attention.note }}
            </p>
            <p v-if="alarm.resolvedBy" class="mt-2">
              Atendida por {{ alarm.resolvedBy }} · {{ formatDateTime(alarm.resolvedAt) }}
            </p>
          </article>
          <article v-for="field in informationFields" :key="field.label" class="alarm-detail-row">
            <span class="alarm-detail-icon"><SvgIcon :name="field.icon" /></span>
            <span class="min-w-0">
              <span class="alarm-detail-label">{{ field.label }}</span>
              <span class="alarm-detail-value">{{ field.value }}</span>
            </span>
          </article>
        </div>
      </main>

      <footer
        v-if="canManage && !attending && (attentionCount || alarm.status === 'resolved')"
        class="mt-3 shrink-0 border-t border-[#dfe6f0] pt-3"
      >
        <div class="grid gap-2">
          <button
            v-if="attentionCount && !attending"
            type="button"
            class="alarm-detail-action-primary"
            @click="$emit('begin-attention')"
          >
            Atender
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
import AlarmAttentionForm from "./AlarmAttentionForm.vue"

import SvgIcon from "../icons/SvgIcon.vue"
import { alarmAttentionState, alarmAttentionLabel } from "../../utils/alarms/alarmInbox.js"

const props = defineProps({
  attending: { type: Boolean, default: false },
  attentionCount: { type: Number, default: 0 },
  alarm: {
    type: Object,
    default: null,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
})

defineEmits(["close", "attend-alarm", "reopen-alarm", "begin-attention", "cancel-attention"])

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "numeric",
  minute: "2-digit",
})

const isResolved = computed(() => alarmAttentionState(props.alarm || {}) === "attended")
const isMixed = computed(() => alarmAttentionState(props.alarm || {}) === "mixed")
const statusLabel = computed(() => alarmAttentionLabel(props.alarm || {}))
const statusChipClass = computed(() =>
  isResolved.value
    ? "bg-emerald-50 text-emerald-700"
    : isMixed.value
      ? "bg-amber-50 text-amber-800"
      : "bg-red-50 text-red-700",
)
const statusDotClass = computed(() =>
  isResolved.value ? "bg-[#16a34a]" : isMixed.value ? "bg-[#d97706]" : "bg-[#ef1b23]",
)

const informationFields = computed(() => {
  const alarm = props.alarm
  if (!alarm) return []
  const metadata = alarm.metadata || {}
  let description = alarm.description || "Sin descripcion disponible."
  if (alarm.type === "speeding" && metadata.speed && metadata.limit)
    description += ` Se registro ${metadata.speed} sobre un limite de ${metadata.limit}.`
  if (alarm.type === "battery" && metadata.voltage)
    description += ` Voltaje reportado: ${metadata.voltage}.`
  if (alarm.type === "no_signal" && metadata.offlineMinutes)
    description += ` Tiempo sin reporte: ${metadata.offlineMinutes}.`
  const icons = {
    speeding: "alarm-speeding",
    battery: "alarm-low-battery",
    no_signal: "alarm-no-signal",
    geofence: "alarm-geofence-exit",
    fuel: "alarm-fuel-variation",
    stop_time: "alarm-long-stop",
    ignition: "alarm-after-hours",
  }
  return [
    { label: "Empresa", value: alarm.companyName, icon: "empresas" },
    { label: "Fecha y hora", value: formatDateTime(alarm.createdAt), icon: "alarm-after-hours" },
    {
      label: "Ubicacion",
      value:
        metadata.address ||
        metadata.location ||
        metadata.geofence ||
        metadata.route ||
        metadata.zone ||
        "Ubicacion no disponible",
      icon: "mapa",
    },
    ...(alarm.triggerReason
      ? [{ label: "Motivo", value: alarm.triggerReason, icon: icons[alarm.type] || "alertas" }]
      : []),
    { label: "Descripcion", value: description, icon: "detail-info" },
  ]
})

const formatDateTime = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return dateTimeFormatter.format(date)
}
</script>

<style scoped>
.alarm-detail-row {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}
.alarm-detail-icon {
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  color: #315078;
}
.alarm-detail-icon :deep(svg) {
  width: 18px;
  height: 18px;
}
.alarm-detail-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #5f7396;
}
.alarm-detail-value {
  display: block;
  margin-top: 2px;
  font-size: 13px;
  font-weight: 750;
  line-height: 20px;
  color: #102372;
  overflow-wrap: anywhere;
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
.alarm-detail-action-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
