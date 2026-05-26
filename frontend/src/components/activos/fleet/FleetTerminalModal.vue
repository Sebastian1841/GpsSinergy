<template>
  <Teleport to="body">
    <div
      v-if="modelValue && activo"
      class="fixed inset-0 z-[2147483646] bg-[#07111f]/55"
      @click.self="closeModal"
    >
      <section
        ref="modalRef"
        class="fixed flex flex-col overflow-hidden rounded-2xl bg-[#102372] shadow-[0_28px_80px_rgba(2,6,23,0.45)] ring-1 ring-[#FF6600]/30"
        :class="isInteracting ? 'select-none' : ''"
        :style="modalFrameStyle"
      >
        <header
          class="flex h-14 shrink-0 touch-none cursor-move items-center justify-between gap-4 border-b border-white/10 bg-[#102372] px-4 text-white"
          @pointerdown="startDrag"
          @dblclick="resetFrame"
        >
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

          <div
            class="flex shrink-0 items-center gap-2"
            data-no-drag
          >
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
              @pointerdown.stop
              @click="closeModal"
            >
              ×
            </button>
          </div>
        </header>

        <main class="flex min-h-0 flex-1 flex-col bg-[#e9eef6] p-2.5">
          <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#cbd5e1] bg-white shadow-sm">
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

            <TerminalHistory
              ref="terminalHistoryRef"
              :logs="terminalLogs"
              @focus-input="focusInput"
            />

            <TerminalInput
              v-model="terminalCommand"
              :is-sending="isSending"
              @submit-command="sendTerminalCommand"
            />
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

import TerminalHistory from "./terminal/TerminalHistory.vue"
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

const emit = defineEmits([
  "update:modelValue",
  "send-command",
])

const terminalHistoryRef = ref(null)
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

const scrollToBottom = async () => {
  await nextTick()
  terminalHistoryRef.value?.scrollToBottom()
}

const focusInput = async () => {
  await nextTick()
  document.querySelector("[data-terminal-input]")?.focus()
}

const setInitialHistory = async () => {
  const logs = props.history.map(normalizeHistoryLog)

  terminalLogs.value = logs.length || !props.simulateHistory
    ? logs
    : createSimulatedHistory(props.activo)

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

    return decorateLog({
      ...log,
      ...payload,
    })
  })

  await scrollToBottom()
}

const closeModal = () => {
  stopInteraction()
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
