import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"

import { useFloatingModal } from "../../ui/useFloatingModal.js"
import {
  buildTerminalRow,
  createInitialTerminalLogs,
  createTerminalLocalId,
  createTerminalLog,
  getTerminalEventBadgeClass,
  getTerminalStateBadgeClass,
  isTerminalTelemetryLog,
  updateTerminalLogPayload,
} from "../../../utils/activos/fleetTerminalRows.js"

const MAX_TELEMETRY_LOGS = 5
const MAX_COMMAND_LOGS = 50
const HISTORY_SYNC_DELAY_MS = 250

export function useFleetTerminalModal({ props, emit }) {
  const activeTerminalModule = ref("telemetry")
  const terminalTableRef = ref(null)
  const commandPanelRef = ref(null)
  const terminalCommand = ref("")
  const terminalLogs = ref([])
  const isSending = ref(false)

  let historySyncTimer = null

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

  /*
   * terminalLogs ya está limitado, por lo que estas operaciones
   * trabajan con un máximo aproximado de 55 registros.
   */
  const terminalRows = computed(() => {
    return terminalLogs.value.slice().reverse().map(buildTerminalRow)
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

  const isTelemetryLog = (log) => {
    return isTerminalTelemetryLog(log)
  }

  /*
   * Conserva físicamente:
   * - Las últimas 5 telemetrías.
   * - Los últimos 50 registros relacionados con comandos.
   *
   * Esto evita que terminalLogs crezca indefinidamente.
   */
  const limitTerminalLogs = (logs = []) => {
    if (!Array.isArray(logs)) return []

    const limitedLogs = []
    let telemetryCount = 0
    let commandCount = 0

    for (let index = logs.length - 1; index >= 0; index -= 1) {
      const log = logs[index]

      if (!log) continue

      if (isTelemetryLog(log)) {
        if (telemetryCount >= MAX_TELEMETRY_LOGS) continue

        telemetryCount += 1
      } else {
        if (commandCount >= MAX_COMMAND_LOGS) continue

        commandCount += 1
      }

      limitedLogs.unshift(log)
    }

    return limitedLogs
  }

  /*
   * Solo entrega los últimos 5 elementos al constructor.
   * Así createInitialTerminalLogs no procesa miles de registros.
   *
   * Este código asume que el historial se agrega al final del arreglo.
   */
  const getRecentHistory = () => {
    if (!Array.isArray(props.history)) return []

    return props.history.slice(-MAX_TELEMETRY_LOGS)
  }

  const getCurrentCommandLogs = () => {
    return terminalLogs.value.filter((log) => {
      return !isTelemetryLog(log)
    })
  }

  const scrollActiveModuleToTop = async () => {
    await nextTick()

    if (activeTerminalModule.value === "telemetry" && terminalTableRef.value) {
      terminalTableRef.value.scrollTop = 0
      return
    }

    if (activeTerminalModule.value === "commands" && commandPanelRef.value) {
      commandPanelRef.value.scrollTop = 0
    }
  }

  const focusInput = async () => {
    await nextTick()

    document.querySelector("[data-terminal-input]")?.focus()
  }

  /*
   * Reconstruye únicamente las últimas 5 telemetrías.
   *
   * preserveCommands evita borrar el historial de comandos cuando
   * llega una nueva actualización de telemetría.
   */
  const setInitialHistory = ({ preserveCommands = false, focus = false, scroll = false } = {}) => {
    const currentCommandLogs = preserveCommands ? getCurrentCommandLogs() : []

    const initialLogs = createInitialTerminalLogs({
      history: getRecentHistory(),
      simulateHistory: props.simulateHistory,
      activo: props.activo,
    })

    const telemetryLogs = initialLogs.filter((log) => {
      return isTelemetryLog(log)
    })

    terminalLogs.value = limitTerminalLogs([...telemetryLogs, ...currentCommandLogs])

    if (scroll) {
      scrollActiveModuleToTop()
    }

    if (focus) {
      focusInput()
    }
  }

  /*
   * Agrupa actualizaciones rápidas del historial.
   * Si llegan muchos pulsos seguidos, solo procesa el último.
   */
  const scheduleHistorySync = () => {
    if (historySyncTimer !== null) {
      window.clearTimeout(historySyncTimer)
    }

    historySyncTimer = window.setTimeout(() => {
      historySyncTimer = null

      if (!props.modelValue || !props.activo) return

      setInitialHistory({
        preserveCommands: true,
        focus: false,
        scroll: false,
      })
    }, HISTORY_SYNC_DELAY_MS)
  }

  const addLog = async (payload) => {
    const newLog = createTerminalLog(payload)

    terminalLogs.value = limitTerminalLogs([...terminalLogs.value, newLog])

    if (activeTerminalModule.value === "commands") {
      await scrollActiveModuleToTop()
    }
  }

  const updateLog = async (id, payload) => {
    terminalLogs.value = limitTerminalLogs(
      terminalLogs.value.map((log) => {
        if (log.id !== id) return log

        return updateTerminalLogPayload({
          log,
          payload,
        })
      }),
    )

    if (activeTerminalModule.value === "commands") {
      await scrollActiveModuleToTop()
    }
  }

  const closeModal = () => {
    stopInteraction()

    if (historySyncTimer !== null) {
      window.clearTimeout(historySyncTimer)
      historySyncTimer = null
    }

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

        if (historySyncTimer !== null) {
          window.clearTimeout(historySyncTimer)
          historySyncTimer = null
        }

        window.removeEventListener("resize", keepFrameInsideViewport)

        return
      }

      activeTerminalModule.value = "telemetry"
      terminalCommand.value = ""
      isSending.value = false

      await nextTick()

      resetFrame()

      setInitialHistory({
        preserveCommands: false,
        focus: true,
        scroll: true,
      })

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
      if (!props.modelValue || !props.activo) return

      scheduleHistorySync()
    },
  )

  onBeforeUnmount(() => {
    stopInteraction()

    if (historySyncTimer !== null) {
      window.clearTimeout(historySyncTimer)
      historySyncTimer = null
    }

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
