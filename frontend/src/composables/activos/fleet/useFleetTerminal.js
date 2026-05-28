import { computed, ref } from "vue"

const MAX_TERMINAL_HISTORY_PER_ACTIVO = 200

export function useFleetTerminal() {
  const showTerminalModal = ref(false)
  const terminalActivo = ref(null)
  const terminalHistoryByActivo = ref({})

  const getCurrentTimeLabel = () => {
    return new Date().toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  const getCurrentDateLabel = () => {
    return new Date().toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const createLocalId = () => {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const getTerminalHistoryKey = (activo) => {
    return String(activo?.id || activo?.imei || "unknown")
  }

  const getTelemetryPulseKey = (pulse) => {
    return String(pulse?.id || pulse?.activoId || pulse?.imei || "unknown")
  }

  const terminalHistory = computed(() => {
    if (!terminalActivo.value) return []

    const key = getTerminalHistoryKey(terminalActivo.value)

    return terminalHistoryByActivo.value[key] || []
  })

  const createTerminalHistoryLog = ({
    type = "server",
    source = "Server",
    message = "",
    time = getCurrentTimeLabel(),
    date = getCurrentDateLabel(),
    payload = null,
  } = {}) => {
    return {
      id: createLocalId(),
      type,
      source,
      message,
      time,
      date,
      payload,
    }
  }

  const normalizeTerminalHistoryLog = (log = {}) => {
    const type = log.type || (log.ok === false ? "error" : "report")

    return {
      id: log.id || createLocalId(),
      type,
      source:
        log.source ||
        (type === "client"
          ? "Client"
          : type === "error"
            ? "Error"
            : type === "server"
              ? "Server"
              : "Report"),
      message: String(log.message ?? log.response ?? log.result ?? log.data ?? ""),
      time: log.time || getCurrentTimeLabel(),
      date: log.date || getCurrentDateLabel(),
      payload: log.payload || null,
    }
  }

  const appendTerminalHistory = (activo, logs = []) => {
    if (!activo || !logs.length) return

    const key = getTerminalHistoryKey(activo)
    const currentHistory = terminalHistoryByActivo.value[key] || []
    const nextHistory = [...currentHistory, ...logs.map(normalizeTerminalHistoryLog)].slice(
      -MAX_TERMINAL_HISTORY_PER_ACTIVO,
    )

    terminalHistoryByActivo.value = {
      ...terminalHistoryByActivo.value,
      [key]: nextHistory,
    }
  }

  const removeTerminalHistory = (activo) => {
    if (!activo) return

    const key = getTerminalHistoryKey(activo)

    const { [key]: _removedTerminalHistory, ...nextTerminalHistory } = terminalHistoryByActivo.value

    terminalHistoryByActivo.value = nextTerminalHistory
  }

  const formatPulseSpeed = (pulse) => {
    const speed = pulse?.velocidad ?? pulse?.speed

    if (speed === null || speed === undefined || speed === "") return "-"

    const numberSpeed = Number(speed)

    if (!Number.isFinite(numberSpeed)) return String(speed)

    return `${numberSpeed.toFixed(1)} km/h`
  }

  const formatPulseCoordinate = (value) => {
    const numberValue = Number(value)

    if (!Number.isFinite(numberValue)) return "-"

    return numberValue.toFixed(6)
  }

  const createTelemetryPulseLog = (pulse = {}) => {
    const timestamp = pulse.timestamp || pulse.updatedAt || new Date().toISOString()
    const date = new Date(timestamp)
    const time = Number.isNaN(date.getTime())
      ? getCurrentTimeLabel()
      : date.toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })

    const dateLabel = Number.isNaN(date.getTime())
      ? getCurrentDateLabel()
      : date.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })

    const estado = pulse.estado || pulse.status || "sin estado"
    const velocidad = formatPulseSpeed(pulse)
    const lat = formatPulseCoordinate(pulse.lat)
    const lng = formatPulseCoordinate(pulse.lng)

    return createTerminalHistoryLog({
      type: "report",
      source: "RX Pulse",
      time,
      date: dateLabel,
      message: `PULSE ${estado} · ${velocidad} · ${lat}, ${lng}`,
      payload: pulse,
    })
  }

  const appendTelemetryPulses = (batch = []) => {
    if (!showTerminalModal.value || !terminalActivo.value) return
    if (!Array.isArray(batch) || !batch.length) return

    const activeTerminalKey = getTerminalHistoryKey(terminalActivo.value)

    const pulseLogs = batch
      .filter((pulse) => {
        return getTelemetryPulseKey(pulse) === activeTerminalKey
      })
      .map(createTelemetryPulseLog)

    if (!pulseLogs.length) return

    appendTerminalHistory(terminalActivo.value, pulseLogs)
  }

  const openTerminalModal = (activo) => {
    if (!activo) return

    terminalActivo.value = activo
    showTerminalModal.value = true
  }

  const closeTerminalModal = () => {
    showTerminalModal.value = false
    terminalActivo.value = null
  }

  const handleTerminalCommand = async ({ activo, command, channel, done }) => {
    if (!activo || !command) return

    const commandLog = createTerminalHistoryLog({
      type: "client",
      source: "Client",
      message: command,
    })

    try {
      const terminalEndpoint = import.meta.env.VITE_GPSGATE_TERMINAL_ENDPOINT || ""

      if (!terminalEndpoint) {
        const message = `Endpoint de terminal no configurado. Canal: ${channel || "internet"} | IMEI: ${activo.imei || "-"} | Comando: ${command}`

        done?.({
          ok: false,
          message,
        })

        appendTerminalHistory(activo, [
          commandLog,
          createTerminalHistoryLog({
            type: "error",
            source: "Error",
            message,
          }),
        ])

        return
      }

      const response = await fetch(terminalEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activoId: activo.id,
          imei: activo.imei,
          command,
          channel: channel || "internet",
        }),
      })

      const contentType = response.headers.get("content-type") || ""
      const data = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : {
            message: await response.text().catch(() => ""),
          }

      const backendHistory = Array.isArray(data.history)
        ? data.history.map(normalizeTerminalHistoryLog)
        : []

      const message =
        data.message ||
        data.response ||
        data.result ||
        (response.ok ? "Comando enviado correctamente." : "No se pudo enviar el comando.")

      done?.({
        ok: response.ok,
        message,
      })

      appendTerminalHistory(activo, [
        commandLog,
        ...(backendHistory.length
          ? backendHistory
          : [
              createTerminalHistoryLog({
                type: response.ok ? "report" : "error",
                source: response.ok ? "Report" : "Error",
                message,
              }),
            ]),
      ])
    } catch (error) {
      const message = error?.message || "Error al enviar comando."

      done?.({
        ok: false,
        message,
      })

      appendTerminalHistory(activo, [
        commandLog,
        createTerminalHistoryLog({
          type: "error",
          source: "Error",
          message,
        }),
      ])
    }
  }

  return {
    showTerminalModal,
    terminalActivo,
    terminalHistory,
    openTerminalModal,
    closeTerminalModal,
    handleTerminalCommand,
    removeTerminalHistory,
    appendTelemetryPulses,
  }
}