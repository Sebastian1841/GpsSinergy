<template>
  <Teleport to="body">
    <div
      v-if="modelValue && activo"
      class="fixed inset-0 z-[2147483646] bg-slate-950/45"
      @click.self="closeModal"
    >
      <section
        ref="modalRef"
        class="fixed flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_28px_80px_rgba(15,23,42,0.35)] ring-1 ring-[#102372]/15"
        :class="isInteracting ? 'select-none' : ''"
        :style="modalFrameStyle"
      >
        <header
          class="flex h-14 shrink-0 touch-none cursor-move items-center justify-between gap-4 border-b border-[#102372]/10 bg-[#102372] px-4 text-white"
          @pointerdown="startDrag"
          @dblclick="resetFrame"
        >
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FF6600] ring-1 ring-white/15"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
                <path
                  d="m8 9 3 3-3 3M13.5 15h3"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <path
                  d="M4.75 6.75A2 2 0 0 1 6.75 4.75h10.5a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2V6.75Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
              </svg>
            </div>

            <div class="min-w-0">
              <p class="truncate font-mono text-xs font-black text-white">
                remote-session://{{ activo.imei || "tracker" }}
              </p>

              <p class="mt-0.5 truncate text-[11px] font-semibold text-white/65">
                {{ deviceName }} · {{ activo.protocol || "TCP" }} · {{ terminalLogs.length }}
                registros
              </p>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2" data-no-drag>
            <span
              class="hidden rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] sm:inline-flex"
              :class="
                isSending ? 'bg-[#FF6600]/20 text-orange-100' : 'bg-emerald-400/20 text-emerald-100'
              "
            >
              {{ isSending ? "Enviando" : "Online" }}
            </span>

            <button
              type="button"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-xl font-black leading-none text-white/70 transition hover:bg-red-500/20 hover:text-white"
              @pointerdown.stop
              @click="closeModal"
            >
              ×
            </button>
          </div>
        </header>

        <main class="flex min-h-0 flex-1 flex-col bg-[#eef2f7] p-3">
          <div
            class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#d8dee8] bg-white shadow-sm"
          >
            <div
              class="flex shrink-0 flex-col gap-3 border-b border-[#e2e8f0] bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#102372]/10 text-[#102372]"
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M4 7.5h16M4 12h16M4 16.5h10"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                </div>

                <div class="min-w-0">
                  <p class="truncate text-sm font-black text-[#102372]">Terminal del dispositivo</p>

                  <p class="truncate text-[11px] font-semibold text-slate-500">
                    {{ deviceName }} · telemetría y comandos remotos
                  </p>
                </div>
              </div>

              <div
                class="flex shrink-0 items-center rounded-2xl border border-[#d8dee8] bg-[#f8fafc] p-1"
                data-no-drag
              >
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] transition"
                  :class="
                    activeTerminalModule === 'telemetry'
                      ? 'bg-[#102372] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white hover:text-[#102372]'
                  "
                  @click="activeTerminalModule = 'telemetry'"
                >
                  Telemetría
                  <span
                    class="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                    :class="
                      activeTerminalModule === 'telemetry'
                        ? 'bg-white/15 text-white'
                        : 'bg-[#eef3ff] text-[#102372]'
                    "
                  >
                    {{ telemetryRowCount }}
                  </span>
                </button>

                <button
                  type="button"
                  class="flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] transition"
                  :class="
                    activeTerminalModule === 'commands'
                      ? 'bg-[#FF6600] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white hover:text-[#FF6600]'
                  "
                  @click="activeTerminalModule = 'commands'"
                >
                  Comandos
                  <span
                    class="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                    :class="
                      activeTerminalModule === 'commands'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#fff7ed] text-[#FF6600]'
                    "
                  >
                    {{ commandRows.length }}
                  </span>
                </button>
              </div>
            </div>

            <section
              v-if="activeTerminalModule === 'telemetry'"
              ref="terminalTableRef"
              class="min-h-0 flex-1 overflow-auto bg-white"
              @click="focusInput"
            >
              <table
                class="min-w-full border-separate border-spacing-0 text-left font-mono text-[11px]"
              >
                <thead
                  class="sticky top-0 z-10 bg-[#f8fafc] text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 shadow-sm"
                >
                  <tr>
                    <th class="w-[92px] border-b border-[#e2e8f0] px-3 py-2">Hora</th>
                    <th class="w-[104px] border-b border-[#e2e8f0] px-3 py-2">Evento</th>
                    <th class="w-[104px] border-b border-[#e2e8f0] px-3 py-2">Estado</th>
                    <th class="w-[112px] border-b border-[#e2e8f0] px-3 py-2">Velocidad</th>
                    <th class="w-[126px] border-b border-[#e2e8f0] px-3 py-2">Latitud</th>
                    <th class="w-[126px] border-b border-[#e2e8f0] px-3 py-2">Longitud</th>
                    <th class="min-w-[280px] border-b border-[#e2e8f0] px-3 py-2">Detalle</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-if="!telemetryRows.length">
                    <td
                      colspan="7"
                      class="px-4 py-10 text-center text-xs font-semibold text-slate-400"
                    >
                      Sin telemetría recibida para este dispositivo.
                    </td>
                  </tr>

                  <tr
                    v-for="row in telemetryRows"
                    :key="row.id"
                    class="text-slate-700 transition hover:bg-[#f8fafc]"
                  >
                    <td
                      class="border-b border-[#edf2f7] px-3 py-2 align-top font-semibold text-slate-500"
                    >
                      {{ row.time }}
                    </td>

                    <td class="border-b border-[#edf2f7] px-3 py-2 align-top">
                      <span
                        class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em]"
                        :class="getEventBadgeClass(row)"
                      >
                        {{ row.event }}
                      </span>
                    </td>

                    <td class="border-b border-[#edf2f7] px-3 py-2 align-top">
                      <span
                        class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em]"
                        :class="getStateBadgeClass(row.estado)"
                      >
                        {{ row.estadoLabel }}
                      </span>
                    </td>

                    <td
                      class="border-b border-[#edf2f7] px-3 py-2 align-top font-black text-[#102372]"
                    >
                      {{ row.velocidad }}
                    </td>

                    <td class="border-b border-[#edf2f7] px-3 py-2 align-top text-slate-600">
                      {{ row.lat }}
                    </td>

                    <td class="border-b border-[#edf2f7] px-3 py-2 align-top text-slate-600">
                      {{ row.lng }}
                    </td>

                    <td class="border-b border-[#edf2f7] px-3 py-2 align-top text-slate-600">
                      <p class="max-w-[420px] truncate">
                        {{ row.message }}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section
              v-else
              ref="commandPanelRef"
              class="min-h-0 flex-1 overflow-auto bg-[#f8fafc] p-3"
              @click="focusInput"
            >
              <div
                v-if="!commandRows.length"
                class="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 text-center"
              >
                <div>
                  <p class="text-sm font-black text-[#102372]">Sin comandos enviados</p>

                  <p class="mt-1 text-xs font-semibold text-slate-500">
                    Escribe un comando abajo y al enviarlo aparecerá la respuesta en este módulo.
                  </p>
                </div>
              </div>

              <div v-else class="space-y-2">
                <article
                  v-for="row in commandRows"
                  :key="row.id"
                  class="rounded-2xl border border-[#d8dee8] bg-white p-3 shadow-sm"
                  :class="row.type === 'error' ? 'border-red-200 bg-red-50/40' : ''"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex min-w-0 items-center gap-2">
                      <span
                        class="inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.08em]"
                        :class="getEventBadgeClass(row)"
                      >
                        {{ row.event }}
                      </span>

                      <span class="font-mono text-[11px] font-black text-slate-500">
                        {{ row.time }}
                      </span>
                    </div>

                    <span
                      class="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.08em]"
                      :class="getStateBadgeClass(row.estado)"
                    >
                      {{ row.estadoLabel }}
                    </span>
                  </div>

                  <p
                    class="mt-2 break-words font-mono text-xs font-semibold leading-relaxed text-slate-700"
                  >
                    {{ row.message }}
                  </p>
                </article>
              </div>
            </section>

            <div class="shrink-0 border-t border-[#e2e8f0] bg-white px-3 py-3">
              <TerminalInput
                v-model="terminalCommand"
                :is-sending="isSending"
                @submit-command="sendTerminalCommand"
              />
            </div>
          </div>
        </main>

        <div
          class="absolute left-6 right-6 top-0 z-30 h-3 touch-none cursor-ns-resize"
          @pointerdown.stop="startResize($event, 'n')"
        ></div>

        <div
          class="absolute bottom-0 left-6 right-6 z-30 h-3 touch-none cursor-ns-resize"
          @pointerdown.stop="startResize($event, 's')"
        ></div>

        <div
          class="absolute bottom-6 left-0 top-6 z-30 w-3 touch-none cursor-ew-resize"
          @pointerdown.stop="startResize($event, 'w')"
        ></div>

        <div
          class="absolute bottom-6 right-0 top-6 z-30 w-3 touch-none cursor-ew-resize"
          @pointerdown.stop="startResize($event, 'e')"
        ></div>

        <div
          class="absolute left-0 top-0 z-40 h-6 w-6 touch-none cursor-nwse-resize"
          @pointerdown.stop="startResize($event, 'nw')"
        ></div>

        <div
          class="absolute right-0 top-0 z-40 h-6 w-6 touch-none cursor-nesw-resize"
          @pointerdown.stop="startResize($event, 'ne')"
        ></div>

        <div
          class="absolute bottom-0 left-0 z-40 h-6 w-6 touch-none cursor-nesw-resize"
          @pointerdown.stop="startResize($event, 'sw')"
        ></div>

        <div
          class="absolute bottom-0 right-0 z-40 h-6 w-6 touch-none cursor-nwse-resize"
          @pointerdown.stop="startResize($event, 'se')"
        ></div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"

import TerminalInput from "./terminal/TerminalInput.vue"

import {
  createLog,
  createSimulatedHistory,
  decorateLog,
  normalizeHistoryLog,
} from "../../../utils/terminalUtils.js"

import { useFloatingModal } from "../../../composables/ui/useFloatingModal.js"

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  activo: {
    type: Object,
    default: null,
  },
  history: {
    type: Array,
    default: () => [],
  },
  simulateHistory: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(["update:modelValue", "send-command"])

const activeTerminalModule = ref("telemetry")
const terminalTableRef = ref(null)
const commandPanelRef = ref(null)
const terminalCommand = ref("")
const terminalLogs = ref([])
const isSending = ref(false)

const {
  modalRef,
  modalFrameStyle,
  isInteracting,
  resetFrame,
  keepFrameInsideViewport,
  startDrag,
  startResize,
  stopInteraction,
} = useFloatingModal({
  defaultWidth: 1080,
  defaultHeight: 640,
  minWidth: 720,
  minHeight: 430,
  margin: 12,
})

const deviceName = computed(() => {
  return props.activo?.vehiculo || props.activo?.name || "activo"
})

const visibleTerminalLogs = computed(() => {
  return [...terminalLogs.value].reverse()
})

const terminalRows = computed(() => {
  return visibleTerminalLogs.value.map(buildTerminalRow)
})

const telemetryRows = computed(() => {
  return terminalRows.value.filter((row) => row.isTelemetry)
})

const commandRows = computed(() => {
  return terminalRows.value.filter((row) => !row.isTelemetry)
})

const telemetryRowCount = computed(() => {
  return telemetryRows.value.length
})

const normalizeTerminalLog = (log = {}) => {
  const normalizedLog = normalizeHistoryLog(log)

  return {
    ...normalizedLog,
    payload: log.payload ?? normalizedLog.payload ?? null,
  }
}

const refreshTerminalView = async () => {
  await nextTick()

  if (terminalTableRef.value) {
    terminalTableRef.value.scrollTop = 0
  }

  if (commandPanelRef.value) {
    commandPanelRef.value.scrollTop = 0
  }
}

const focusInput = async () => {
  await nextTick()
  document.querySelector("[data-terminal-input]")?.focus()
}

const getLogMessage = (log = {}) => {
  return String(log.message ?? log.response ?? log.result ?? log.data ?? "")
}

const parsePulseMessage = (message = "") => {
  if (!String(message).toUpperCase().startsWith("PULSE")) return {}

  const cleanMessage = String(message).replace(/^PULSE\s*/i, "")
  const [estadoPart, speedPart, coordinatePart] = cleanMessage.split("·").map((part) => {
    return String(part || "").trim()
  })

  const [lat, lng] = String(coordinatePart || "")
    .split(",")
    .map((part) => {
      return String(part || "").trim()
    })

  return {
    estado: estadoPart || "",
    velocidad: speedPart || "",
    lat,
    lng,
  }
}

const getPayloadValue = (payload = {}, keys = []) => {
  const key = keys.find((currentKey) => {
    return (
      payload[currentKey] !== undefined &&
      payload[currentKey] !== null &&
      payload[currentKey] !== ""
    )
  })

  return key ? payload[key] : ""
}

const formatCoordinate = (value) => {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return value || "-"

  return numberValue.toFixed(6)
}

const formatSpeed = (value) => {
  if (value === null || value === undefined || value === "") return "-"

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return String(value)

  return `${numberValue.toFixed(1)} km/h`
}

const getLogEvent = (log = {}, isTelemetry = false) => {
  if (isTelemetry) return "RX Pulse"
  if (log.type === "client") return "TX Cmd"
  if (log.type === "pending") return "Pending"
  if (log.type === "error") return "Error"

  return log.source || "Report"
}

const buildTerminalRow = (log = {}) => {
  const payload = log.payload || {}
  const message = getLogMessage(log)
  const parsedPulse = parsePulseMessage(message)

  const hasTelemetryPayload =
    getPayloadValue(payload, ["lat", "latitude"]) !== "" ||
    getPayloadValue(payload, ["lng", "lon", "longitude"]) !== "" ||
    getPayloadValue(payload, ["estado", "status"]) !== "" ||
    getPayloadValue(payload, ["velocidad", "speed"]) !== ""

  const isTelemetry =
    hasTelemetryPayload ||
    String(log.source || "")
      .toLowerCase()
      .includes("rx") ||
    String(message || "")
      .toUpperCase()
      .startsWith("PULSE")

  const estado =
    getPayloadValue(payload, ["estado", "status"]) ||
    parsedPulse.estado ||
    (log.type === "error" ? "error" : log.type === "pending" ? "pending" : "-")

  const velocidad = getPayloadValue(payload, ["velocidad", "speed"]) || parsedPulse.velocidad
  const lat = getPayloadValue(payload, ["lat", "latitude"]) || parsedPulse.lat
  const lng = getPayloadValue(payload, ["lng", "lon", "longitude"]) || parsedPulse.lng

  return {
    id: log.id,
    time: log.time || "-",
    event: getLogEvent(log, isTelemetry),
    estado,
    estadoLabel: estado || "-",
    velocidad: formatSpeed(velocidad),
    lat: formatCoordinate(lat),
    lng: formatCoordinate(lng),
    message: message || "-",
    type: log.type || "report",
    isTelemetry,
  }
}

const getStateBadgeClass = (estado) => {
  const normalizedEstado = String(estado || "").toLowerCase()

  if (normalizedEstado === "moving") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  if (normalizedEstado === "idle") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  if (normalizedEstado === "stopped") {
    return "border-red-200 bg-red-50 text-red-700"
  }

  if (normalizedEstado === "offline") {
    return "border-slate-200 bg-slate-50 text-slate-600"
  }

  if (normalizedEstado === "error") {
    return "border-red-200 bg-red-50 text-red-700"
  }

  if (normalizedEstado === "pending") {
    return "border-orange-200 bg-orange-50 text-[#FF6600]"
  }

  return "border-slate-200 bg-slate-50 text-slate-600"
}

const getEventBadgeClass = (row = {}) => {
  if (row.isTelemetry) {
    return "border-[#102372]/15 bg-[#eef3ff] text-[#102372]"
  }

  if (row.type === "client") {
    return "border-sky-200 bg-sky-50 text-sky-700"
  }

  if (row.type === "pending") {
    return "border-orange-200 bg-orange-50 text-[#FF6600]"
  }

  if (row.type === "error") {
    return "border-red-200 bg-red-50 text-red-700"
  }

  return "border-slate-200 bg-slate-50 text-slate-600"
}

const setInitialHistory = async () => {
  const logs = props.history.map(normalizeTerminalLog)

  terminalLogs.value =
    logs.length || !props.simulateHistory
      ? logs
      : createSimulatedHistory(props.activo).map(normalizeTerminalLog)

  await refreshTerminalView()
  await focusInput()
}

const addLog = async (payload) => {
  terminalLogs.value = [...terminalLogs.value, normalizeTerminalLog(createLog(payload))]

  await refreshTerminalView()
}

const updateLog = async (id, payload) => {
  terminalLogs.value = terminalLogs.value.map((log) => {
    if (log.id !== id) return log

    const decoratedLog = decorateLog({
      ...log,
      ...payload,
    })

    return normalizeTerminalLog({
      ...decoratedLog,
      payload: payload.payload ?? log.payload ?? decoratedLog.payload ?? null,
    })
  })

  await refreshTerminalView()
}

const closeModal = () => {
  stopInteraction()
  emit("update:modelValue", false)
}

const finishCommand = async ({ pendingId, ok = true, message = "" } = {}) => {
  isSending.value = false
  activeTerminalModule.value = "commands"

  await updateLog(pendingId, {
    type: ok ? "report" : "error",
    source: ok ? "Report" : "Error",
    message:
      message ||
      (ok
        ? "(CommandResult=OK) (Message=Command sent successfully)"
        : "(CommandResult=FAILED) (Message=Command could not be sent)"),
  })

  await focusInput()
}

const sendTerminalCommand = async () => {
  const command = terminalCommand.value.trim()

  if (!command || !props.activo || isSending.value) return

  activeTerminalModule.value = "commands"

  const pendingId = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  await addLog({
    type: "client",
    source: "Client",
    message: command,
  })

  await addLog({
    id: pendingId,
    type: "pending",
    source: "Server",
    message: "Sending command to tracker...",
  })

  terminalCommand.value = ""
  isSending.value = true

  emit("send-command", {
    activo: props.activo,
    command,
    done: ({ ok = true, message = "" } = {}) => {
      finishCommand({
        pendingId,
        ok,
        message,
      })
    },
  })
}

watch(
  () => [props.modelValue, props.activo],
  async () => {
    if (!props.modelValue || !props.activo) {
      stopInteraction()
      window.removeEventListener("resize", keepFrameInsideViewport)
      return
    }

    activeTerminalModule.value = "telemetry"
    terminalCommand.value = ""
    isSending.value = false

    await nextTick()

    resetFrame()
    setInitialHistory()

    window.removeEventListener("resize", keepFrameInsideViewport)
    window.addEventListener("resize", keepFrameInsideViewport)
  },
  {
    immediate: true,
  },
)

watch(
  () => props.history,
  () => {
    if (props.modelValue && props.activo) {
      setInitialHistory()
    }
  },
)

onBeforeUnmount(() => {
  stopInteraction()
  window.removeEventListener("resize", keepFrameInsideViewport)
})
</script>
