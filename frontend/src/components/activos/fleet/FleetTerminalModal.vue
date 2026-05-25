<template>
  <Teleport to="body">
    <div
      v-if="modelValue && activo"
      class="fixed inset-0 z-[2147483646] flex items-center justify-center bg-[#07111f]/55 p-4 backdrop-blur-[2px]"
      @click.self="closeModal"
    >
      <section
        class="relative flex flex-col overflow-hidden rounded-2xl bg-[#102372] shadow-[0_28px_80px_rgba(2,6,23,0.45)] ring-1 ring-[#FF6600]/30"
        :class="isResizing ? 'select-none' : ''"
        :style="consoleModalStyle"
      >
        <!-- Console header -->
        <header class="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#102372] px-4 text-white">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FF6600] ring-1 ring-white/10">
              <svg
                viewBox="0 0 24 24"
                class="h-5 w-5"
                fill="none"
                aria-hidden="true"
              >
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

              <p class="mt-0.5 truncate text-[11px] font-semibold text-white/60">
                {{ deviceName }} · {{ activo.protocol || "TCP" }} · {{ terminalLogs.length }} registros
              </p>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="hidden h-8 cursor-pointer rounded-lg border border-white/10 bg-white/10 px-3 text-[10px] font-black uppercase tracking-[0.1em] text-white/70 transition hover:border-[#FF6600]/40 hover:text-white sm:inline-flex sm:items-center"
              @click="resetConsoleSize"
            >
              Reset tamaño
            </button>

            <span
              class="hidden rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] sm:inline-flex"
              :class="isSending
                ? 'bg-[#FF6600]/15 text-[#FFB077]'
                : 'bg-emerald-400/15 text-emerald-300'"
            >
              {{ isSending ? "Enviando" : "Online" }}
            </span>

            <button
              type="button"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-xl font-black leading-none text-white/60 transition hover:bg-red-500/20 hover:text-red-200"
              @click="closeModal"
            >
              ×
            </button>
          </div>
        </header>

        <!-- Console body -->
        <main class="flex min-h-0 flex-1 flex-col bg-[#e9eef6] p-2.5">
          <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#cbd5e1] bg-white shadow-sm">
            <!-- Top bar -->
            <div class="flex h-10 shrink-0 items-center justify-between border-b border-[#d8dee8] bg-[#f8fafc] px-3">
              <div class="flex min-w-0 items-center gap-2">
                <span class="h-2.5 w-2.5 rounded-full bg-red-400"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>

                <span class="ml-2 truncate font-mono text-[11px] font-black text-[#102372]">
                  {{ deviceName }}
                </span>
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <span class="rounded-full bg-[#eef3ff] px-2.5 py-1 font-mono text-[10px] font-black text-[#102372]">
                  TCP
                </span>

                <span class="rounded-full bg-[#fff7ed] px-2.5 py-1 font-mono text-[10px] font-black text-[#FF6600]">
                  {{ terminalLogs.length }} logs
                </span>
              </div>
            </div>

            <!-- History compacto con variables originales -->
            <div
              ref="terminalBodyRef"
              class="min-h-0 flex-1 overflow-auto bg-[#fbfcfe] font-mono text-[11px]"
              @click="focusInput"
            >
              <div
                v-if="!terminalLogs.length"
                class="flex h-full min-h-[280px] items-center justify-center"
              >
                <div class="rounded-xl border border-dashed border-[#cbd5e1] bg-white px-6 py-6 text-center">
                  <p class="text-sm font-black text-[#102372]">
                    Consola sin actividad
                  </p>

                  <p class="mt-1 text-xs font-semibold text-slate-500">
                    Escribe un comando para iniciar la comunicación con el rastreador.
                  </p>
                </div>
              </div>

              <div
                v-else
                class="min-w-[900px]"
              >
                <div class="sticky top-0 z-10 grid grid-cols-[72px_76px_70px_minmax(0,1fr)] border-b border-[#d8dee8] bg-[#eef3ff] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#102372]">
                  <span>Hora</span>
                  <span>Fecha</span>
                  <span>Tipo</span>
                  <span>Dato recibido</span>
                </div>

                <div
                  v-for="log in terminalLogs"
                  :key="log.id"
                  class="grid grid-cols-[72px_76px_70px_minmax(0,1fr)] border-b border-[#edf1f5] px-3 py-1.5 leading-[17px] transition hover:bg-white"
                >
                  <span class="font-bold text-slate-500">
                    {{ log.time }}
                  </span>

                  <span class="font-semibold text-slate-400">
                    {{ log.date }}
                  </span>

                  <span
                    class="w-fit rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.04em]"
                    :class="logBadgeClass(log.type)"
                  >
                    {{ log.source }}
                  </span>

                  <div class="min-w-0">
                    <template v-if="isGpsGateReport(log)">
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="item in getGpsGateReportItems(log.message)"
                          :key="`${item.label}-${item.value}`"
                          class="inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-black leading-4"
                          :class="item.tone === 'orange'
                            ? 'border-[#FF6600]/20 bg-[#fff7ed] text-[#FF6600]'
                            : item.tone === 'blue'
                              ? 'border-[#102372]/15 bg-[#eef3ff] text-[#102372]'
                              : item.tone === 'red'
                                ? 'border-red-100 bg-red-50 text-red-600'
                                : 'border-emerald-100 bg-emerald-50 text-emerald-700'"
                        >
                          <span class="opacity-70">{{ item.label }}:</span>
                          <span class="truncate">{{ item.value }}</span>
                        </span>
                      </div>
                    </template>

                    <template v-else>
                      <span
                        class="whitespace-pre-wrap break-words font-semibold"
                        :class="logTextClass(log.type)"
                      >
                        <span
                          v-if="log.type === 'client'"
                          class="mr-1 font-black text-[#FF6600]"
                        >
                          &gt;
                        </span>

                        {{ log.message }}
                      </span>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Command input -->
            <form
              class="shrink-0 border-t border-[#d8dee8] bg-white px-3 py-3"
              @submit.prevent="sendTerminalCommand"
            >
              <div class="flex flex-col gap-2 md:flex-row md:items-center">
                <div class="relative min-w-0 flex-1">
                  <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-black text-[#FF6600]">
                    &gt;
                  </span>

                  <input
                    ref="commandInputRef"
                    v-model="terminalCommand"
                    type="text"
                    class="h-10 w-full rounded-lg border border-[#cbd5e1] bg-[#fbfcfe] pl-7 pr-3 font-mono text-xs font-bold text-[#102372] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Escribe un comando..."
                    :disabled="isSending"
                  />
                </div>

                <button
                  type="submit"
                  class="h-10 shrink-0 cursor-pointer rounded-lg border border-[#FF6600] bg-[#FF6600] px-5 text-xs font-black text-white transition hover:bg-[#e85d00] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
                  :disabled="isSending || !terminalCommand.trim()"
                >
                  {{ isSending ? "Enviando" : "Enviar" }}
                </button>
              </div>
            </form>
          </div>
        </main>

        <!-- Resize handles -->
        <div
          class="absolute bottom-3 right-0 top-14 w-2 cursor-ew-resize transition hover:bg-[#FF6600]/25"
          title="Ajustar ancho"
          @pointerdown.stop="startConsoleResize($event, 'x')"
        ></div>

        <div
          class="absolute bottom-0 left-3 right-8 h-2 cursor-ns-resize transition hover:bg-[#FF6600]/25"
          title="Ajustar alto"
          @pointerdown.stop="startConsoleResize($event, 'y')"
        ></div>

        <button
          type="button"
          class="absolute bottom-1.5 right-1.5 flex h-6 w-6 cursor-nwse-resize items-center justify-center rounded-md bg-[#FF6600] text-white shadow-lg transition hover:bg-[#e85d00]"
          title="Redimensionar consola"
          @pointerdown.stop="startConsoleResize($event, 'xy')"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-3.5 w-3.5"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 16h8V8M16 16 8 8"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"

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

  // TEMPORAL: solo para demo. Después quitar esta prop y createSimulatedHistory().
  simulateHistory: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  "update:modelValue",
  "send-command",
])

const DEFAULT_CONSOLE_WIDTH = 1080
const DEFAULT_CONSOLE_HEIGHT = 640
const MIN_CONSOLE_WIDTH = 720
const MIN_CONSOLE_HEIGHT = 430
const VIEWPORT_MARGIN = 24

const consoleSize = ref({
  width: DEFAULT_CONSOLE_WIDTH,
  height: DEFAULT_CONSOLE_HEIGHT,
})

const terminalCommand = ref("")
const terminalLogs = ref([])
const terminalBodyRef = ref(null)
const commandInputRef = ref(null)
const isSending = ref(false)
const isResizing = ref(false)

let resizeSession = null

const deviceName = computed(() => {
  return props.activo?.vehiculo || props.activo?.name || "activo"
})

const consoleModalStyle = computed(() => {
  return {
    width: `${consoleSize.value.width}px`,
    height: `${consoleSize.value.height}px`,
    minWidth: `min(${MIN_CONSOLE_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN}px))`,
    minHeight: `min(${MIN_CONSOLE_HEIGHT}px, calc(100vh - ${VIEWPORT_MARGIN}px))`,
    maxWidth: `calc(100vw - ${VIEWPORT_MARGIN}px)`,
    maxHeight: `calc(100vh - ${VIEWPORT_MARGIN}px)`,
  }
})

const getResizeLimits = () => {
  return {
    maxWidth: Math.max(MIN_CONSOLE_WIDTH, window.innerWidth - VIEWPORT_MARGIN),
    maxHeight: Math.max(MIN_CONSOLE_HEIGHT, window.innerHeight - VIEWPORT_MARGIN),
  }
}

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max)
}

const resetConsoleSize = () => {
  const limits = getResizeLimits()

  consoleSize.value = {
    width: clamp(DEFAULT_CONSOLE_WIDTH, MIN_CONSOLE_WIDTH, limits.maxWidth),
    height: clamp(DEFAULT_CONSOLE_HEIGHT, MIN_CONSOLE_HEIGHT, limits.maxHeight),
  }
}

const startConsoleResize = (event, direction) => {
  const limits = getResizeLimits()

  resizeSession = {
    direction,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: clamp(consoleSize.value.width, MIN_CONSOLE_WIDTH, limits.maxWidth),
    startHeight: clamp(consoleSize.value.height, MIN_CONSOLE_HEIGHT, limits.maxHeight),
  }

  isResizing.value = true

  document.body.style.cursor =
    direction === "x"
      ? "ew-resize"
      : direction === "y"
        ? "ns-resize"
        : "nwse-resize"

  document.body.style.userSelect = "none"

  window.addEventListener("pointermove", handleConsoleResize)
  window.addEventListener("pointerup", stopConsoleResize)

  event.preventDefault()
}

const handleConsoleResize = (event) => {
  if (!resizeSession) return

  const limits = getResizeLimits()
  const nextSize = {
    ...consoleSize.value,
  }

  if (resizeSession.direction.includes("x")) {
    const nextWidth = resizeSession.startWidth + (event.clientX - resizeSession.startX)

    nextSize.width = clamp(nextWidth, MIN_CONSOLE_WIDTH, limits.maxWidth)
  }

  if (resizeSession.direction.includes("y")) {
    const nextHeight = resizeSession.startHeight + (event.clientY - resizeSession.startY)

    nextSize.height = clamp(nextHeight, MIN_CONSOLE_HEIGHT, limits.maxHeight)
  }

  consoleSize.value = nextSize
}

const stopConsoleResize = () => {
  resizeSession = null
  isResizing.value = false

  document.body.style.cursor = ""
  document.body.style.userSelect = ""

  window.removeEventListener("pointermove", handleConsoleResize)
  window.removeEventListener("pointerup", stopConsoleResize)
}

const getTime = () => {
  return new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

const getDate = () => {
  return new Date().toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const createId = () => {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const logTextClass = (type) => {
  const classes = {
    server: "text-slate-700",
    report: "text-emerald-700",
    client: "text-[#102372]",
    error: "text-red-600",
    pending: "text-[#FF6600]",
  }

  return classes[type] || "text-slate-700"
}

const logBadgeClass = (type) => {
  const classes = {
    server: "bg-slate-100 text-slate-700",
    report: "bg-emerald-50 text-emerald-700",
    client: "bg-[#eef3ff] text-[#102372]",
    error: "bg-red-50 text-red-600",
    pending: "bg-orange-50 text-[#FF6600]",
  }

  return classes[type] || "bg-slate-100 text-slate-700"
}

const createLog = ({
  id = createId(),
  type = "server",
  source = "Server",
  message = "",
  time = getTime(),
  date = getDate(),
} = {}) => {
  return {
    id,
    type,
    source,
    message,
    time,
    date,
  }
}

const normalizeHistoryLog = (log = {}) => {
  const type = log.type || log.kind || "report"

  return createLog({
    id: log.id || createId(),
    type,
    source:
      log.source ||
      (
        type === "client"
          ? "Client"
          : type === "server"
            ? "Server"
            : type === "error"
              ? "Error"
              : "Report"
      ),
    message: String(
      log.message ??
      log.raw ??
      log.response ??
      log.report ??
      log.data ??
      "",
    ),
    time: log.time || getTime(),
    date: log.date || getDate(),
  })
}

const formatGpsGateValue = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback

  return value
}

const parseGpsGateMessage = (message = "") => {
  const pairs = {}
  const pattern = /\(([^=()]+)=([^()]*)\)/g

  let match = pattern.exec(String(message))

  while (match) {
    const key = match[1]?.trim()
    const value = match[2]?.trim()

    if (key) {
      pairs[key] = value || "-"
    }

    match = pattern.exec(String(message))
  }

  return pairs
}

const isGpsGateReport = (log = {}) => {
  return (
    log.type === "report" &&
    String(log.message || "").includes("(") &&
    String(log.message || "").includes("=")
  )
}

const cleanGpsValue = (value) => {
  if (value === null || value === undefined) return ""

  const stringValue = String(value).trim()

  if (!stringValue || stringValue === "-") return ""

  return stringValue
}

const getGpsGateVariableTone = (key, value) => {
  if (key === "CommandResult") {
    return value === "OK" ? "green" : "red"
  }

  if (key === "GpsValid") {
    return value === "True" ? "green" : "red"
  }

  if (
    key === "Latitude" ||
    key === "Longitude" ||
    key === "Speed" ||
    key === "Heading" ||
    key === "Altitude" ||
    key === "TotalOdometer" ||
    key === "DriverID" ||
    key === "Address" ||
    key === "Message"
  ) {
    return "blue"
  }

  if (
    key === "Ignition" ||
    key === "Fuel" ||
    key === "BatteryVoltage" ||
    key === "InputVoltage"
  ) {
    return "orange"
  }

  if (key === "Status") {
    return "green"
  }

  return "blue"
}

const getGpsGateReportItems = (message = "") => {
  const data = parseGpsGateMessage(message)

  const preferredOrder = [
    "CommandResult",
    "Status",
    "Message",
    "GpsValid",
    "Latitude",
    "Longitude",
    "Speed",
    "Heading",
    "Altitude",
    "Ignition",
    "InputVoltage",
    "BatteryVoltage",
    "Fuel",
    "TotalOdometer",
    "DriverID",
    "Address",
  ]

  const orderedKeys = [
    ...preferredOrder.filter((key) => cleanGpsValue(data[key])),
    ...Object.keys(data).filter((key) => {
      return !preferredOrder.includes(key) && cleanGpsValue(data[key])
    }),
  ]

  return orderedKeys.map((key) => {
    return {
      label: key,
      value: cleanGpsValue(data[key]),
      tone: getGpsGateVariableTone(key, data[key]),
    }
  })
}

const buildGpsGateReportMessage = () => {
  const lat = formatGpsGateValue(props.activo?.lat)
  const lng = formatGpsGateValue(props.activo?.lng)
  const speed = formatGpsGateValue(props.activo?.speed || props.activo?.velocidad, "0")
  const ignition = formatGpsGateValue(props.activo?.ignicion)
  const fuel = formatGpsGateValue(props.activo?.combustible || props.activo?.fuel)
  const odometer = formatGpsGateValue(props.activo?.odometro || props.activo?.odometer)
  const ibutton = formatGpsGateValue(props.activo?.ibutton)
  const address = formatGpsGateValue(props.activo?.direccion || props.activo?.ubicacion)

  return [
    "(GpsValid=True)",
    `(Latitude=${lat})`,
    `(Longitude=${lng})`,
    `(Speed=${speed})`,
    "(Heading=-)",
    "(Altitude=-)",
    `(Ignition=${ignition})`,
    "(InputVoltage=-)",
    "(BatteryVoltage=-)",
    `(Fuel=${fuel})`,
    `(TotalOdometer=${odometer})`,
    `(DriverID=${ibutton})`,
    `(Address=${address})`,
  ].join(" ")
}

const createSimulatedHistory = () => {
  const imei = props.activo?.imei || "-"
  const protocol = props.activo?.protocol || "teltonika"

  return [
    createLog({
      type: "server",
      source: "Server",
      message: `${imei} ${String(protocol).toUpperCase()} TCP connected`,
    }),
    createLog({
      type: "report",
      source: "Report",
      message: buildGpsGateReportMessage(),
    }),
    createLog({
      type: "client",
      source: "Client",
      message: "status",
    }),
    createLog({
      type: "server",
      source: "Server",
      message: `${imei} command queued by server`,
    }),
    createLog({
      type: "report",
      source: "Report",
      message: "(CommandResult=OK) (Status=Online) (Message=Tracker accepted command)",
    }),
    createLog({
      type: "client",
      source: "Client",
      message: "getgps",
    }),
    createLog({
      type: "report",
      source: "Report",
      message: buildGpsGateReportMessage(),
    }),
  ]
}

const scrollToBottom = async () => {
  await nextTick()

  if (!terminalBodyRef.value) return

  terminalBodyRef.value.scrollTop = terminalBodyRef.value.scrollHeight
}

const focusInput = async () => {
  await nextTick()
  commandInputRef.value?.focus()
}

const setInitialHistory = async () => {
  const historyLogs = props.history.map(normalizeHistoryLog)

  terminalLogs.value = historyLogs.length || !props.simulateHistory
    ? historyLogs
    : createSimulatedHistory()

  await scrollToBottom()
  await focusInput()
}

const addLog = async (payload) => {
  terminalLogs.value = [
    ...terminalLogs.value,
    createLog(payload),
  ]

  await scrollToBottom()
}

const updateLog = async (id, payload) => {
  terminalLogs.value = terminalLogs.value.map((log) => {
    if (log.id !== id) return log

    return {
      ...log,
      ...payload,
      time: getTime(),
      date: getDate(),
    }
  })

  await scrollToBottom()
}

const closeModal = () => {
  stopConsoleResize()
  emit("update:modelValue", false)
}

const finishCommand = async ({
  pendingId,
  ok = true,
  message = "",
} = {}) => {
  isSending.value = false

  await updateLog(pendingId, {
    type: ok ? "report" : "error",
    source: ok ? "Report" : "Error",
    message: message || (
      ok
        ? "(CommandResult=OK) (Message=Command sent successfully)"
        : "(CommandResult=FAILED) (Message=Command could not be sent)"
    ),
  })

  await focusInput()
}

const sendTerminalCommand = async () => {
  const command = terminalCommand.value.trim()

  if (!command || !props.activo || isSending.value) return

  const pendingId = createId()

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
  () => {
    if (props.modelValue && props.activo) {
      terminalCommand.value = ""
      isSending.value = false
      setInitialHistory()
      resetConsoleSize()
    }
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
  {
    deep: true,
  },
)

onBeforeUnmount(() => {
  stopConsoleResize()
})
</script>