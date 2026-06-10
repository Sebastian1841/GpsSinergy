import {
  createLog,
  createSimulatedHistory,
  decorateLog,
  normalizeHistoryLog,
} from "../terminalUtils.js"

export const createTerminalLocalId = () => {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const normalizeTerminalLog = (log = {}) => {
  const normalizedLog = normalizeHistoryLog(log)

  return {
    ...normalizedLog,
    payload: log.payload ?? normalizedLog.payload ?? null,
  }
}

export const createInitialTerminalLogs = ({ history = [], simulateHistory = true, activo }) => {
  const logs = history.map(normalizeTerminalLog)

  if (logs.length || !simulateHistory) {
    return logs
  }

  return createSimulatedHistory(activo).map(normalizeTerminalLog)
}

export const createTerminalLog = (payload) => {
  return normalizeTerminalLog(createLog(payload))
}

export const updateTerminalLogPayload = ({ log, payload }) => {
  const decoratedLog = decorateLog({
    ...log,
    ...payload,
  })

  return normalizeTerminalLog({
    ...decoratedLog,
    payload: payload.payload ?? log.payload ?? decoratedLog.payload ?? null,
  })
}

const getLogMessage = (log = {}) => {
  return String(log.message ?? log.response ?? log.result ?? log.data ?? "")
}

const parsePulseMessage = (message = "") => {
  if (!String(message).toUpperCase().startsWith("PULSE")) return {}

  const cleanMessage = String(message).replace(/^PULSE\s*/i, "")
  const [estadoPart, speedPart, coordinatePart] = cleanMessage
    .split(/\s*(?:\u00b7|\u00c2\u00b7)\s*/)
    .map((part) => {
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

export const buildTerminalRow = (log = {}) => {
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

export const getTerminalStateBadgeClass = (estado) => {
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

export const getTerminalEventBadgeClass = (row = {}) => {
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
