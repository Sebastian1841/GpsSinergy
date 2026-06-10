import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"

import { useFloatingModal } from "../../ui/useFloatingModal.js"
import {
  buildTerminalRow,
  createInitialTerminalLogs,
  createTerminalLocalId,
  createTerminalLog,
  getTerminalEventBadgeClass,
  getTerminalStateBadgeClass,
  updateTerminalLogPayload,
} from "../../../utils/activos/fleetTerminalRows.js"

export function useFleetTerminalModal({ props, emit }) {
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

  const setInitialHistory = async () => {
    terminalLogs.value = createInitialTerminalLogs({
      history: props.history,
      simulateHistory: props.simulateHistory,
      activo: props.activo,
    })

    await refreshTerminalView()
    await focusInput()
  }

  const addLog = async (payload) => {
    terminalLogs.value = [...terminalLogs.value, createTerminalLog(payload)]

    await refreshTerminalView()
  }

  const updateLog = async (id, payload) => {
    terminalLogs.value = terminalLogs.value.map((log) => {
      if (log.id !== id) return log

      return updateTerminalLogPayload({
        log,
        payload,
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

    const pendingId = createTerminalLocalId()

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

  return {
    activeTerminalModule,
    terminalTableRef,
    commandPanelRef,
    terminalCommand,
    terminalLogs,
    isSending,

    modalRef,
    modalFrameStyle,
    isInteracting,
    resetFrame,
    startDrag,
    startResize,

    deviceName,
    telemetryRows,
    commandRows,
    telemetryRowCount,

    focusInput,
    closeModal,
    sendTerminalCommand,
    getStateBadgeClass: getTerminalStateBadgeClass,
    getEventBadgeClass: getTerminalEventBadgeClass,
  }
}
