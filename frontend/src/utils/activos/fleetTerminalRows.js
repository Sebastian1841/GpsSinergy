import {
  createLog,
  createSimulatedHistory,
  decorateLog,
  normalizeHistoryLog,
} from "../terminalUtils.js"
import { FLEET_TELEMETRY_COLUMNS, getCellValue } from "./fleetTelemetryColumns.js"

const TERMINAL_TELEMETRY_DETAIL_KEYS = [
  "combustible",
  "ignition",
  "gpsSatellites",
  "gpsSignal",
  "gpsFix",
  "odometro",
  "horometroTotal",
  "horometroDiario",
  "canRpm",
  "canEngineTemp",
  "canBatteryVoltage",
  "canEngineLoad",
  "canThrottle",
  "canFuelRate",
  "canFuelUsed",
  "canOilPressure",
  "canAdBlueLevel",
  "canDtcCount",
  "digitalInput1",
  "digitalInput2",
]

const TELEMETRY_DETAIL_ORDER = [
  ["encendido", "ignicion", "ignition", "contacto"],
  ["fix gps", "gps fix"],
  ["satelites", "satelite", "satellites"],
  ["senal gps", "gps signal"],
  ["rpm"],
  ["carga motor", "engine load"],
  ["temp motor", "temperatura motor", "engine temperature"],
  ["acelerador", "throttle"],
  ["pres aceite", "presion aceite", "oil pressure"],
  ["voltaje", "voltage"],
  ["dtc"],
  ["comb usado", "combustible usado", "fuel used"],
  ["cons l/h", "consumo l/h", "fuel consumption"],
  ["adblue"],
  ["entrada 1", "digital input 1", "input1"],
  ["entrada 2", "digital input 2", "input2"],
  ["comb.", "combustible", "fuel"],
  ["odometro", "odometer"],
  ["horometro", "hourmeter"],
  ["hor diario", "hor. diario", "horas diarias"],
]

const terminalTelemetryDetailColumns = TERMINAL_TELEMETRY_DETAIL_KEYS.map((key) => {
  return FLEET_TELEMETRY_COLUMNS.find((column) => column.key === key)
}).filter(Boolean)

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

const normalizeTelemetryText = (value) => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const hasTelemetryValue = (value) => {
  if (value === null || value === undefined) return false

  const normalizedValue = normalizeTelemetryText(value)

  return !["", "-", "--", "n/a", "na", "null", "undefined", "sin dato"].includes(normalizedValue)
}

const getTelemetryDetailOrder = (detail) => {
  const searchableText = normalizeTelemetryText(`${detail?.key || ""} ${detail?.label || ""}`)

  const orderIndex = TELEMETRY_DETAIL_ORDER.findIndex((terms) => {
    return terms.some((term) => {
      return searchableText.includes(normalizeTelemetryText(term))
    })
  })

  return orderIndex >= 0 ? orderIndex : TELEMETRY_DETAIL_ORDER.length
}

const orderTelemetryDetails = (details = []) => {
  return details
    .filter((detail) => {
      return detail && hasTelemetryValue(detail.value)
    })
    .map((detail, index) => ({
      ...detail,
      originalIndex: index,
    }))
    .sort((firstDetail, secondDetail) => {
      const firstOrder = getTelemetryDetailOrder(firstDetail)
      const secondOrder = getTelemetryDetailOrder(secondDetail)

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder
      }

      return firstDetail.originalIndex - secondDetail.originalIndex
    })
    .map(({ originalIndex: _originalIndex, ...detail }) => detail)
}

const getTerminalLogContext = (log = {}) => {
  const payload = log.payload || {}
  const telemetryPayload = {
    ...(payload.activo || {}),
    ...payload,
  }
  const message = getLogMessage(log)
  const parsedPulse = parsePulseMessage(message)

  const hasTelemetryPayload =
    getPayloadValue(telemetryPayload, ["lat", "latitude"]) !== "" ||
    getPayloadValue(telemetryPayload, ["lng", "lon", "longitude"]) !== "" ||
    getPayloadValue(telemetryPayload, ["estado", "status"]) !== "" ||
    getPayloadValue(telemetryPayload, ["velocidad", "speed"]) !== ""

  const isTelemetry =
    hasTelemetryPayload ||
    String(log.source || "")
      .toLowerCase()
      .includes("rx") ||
    String(message || "")
      .toUpperCase()
      .startsWith("PULSE")

  return {
    telemetryPayload,
    message,
    parsedPulse,
    isTelemetry,
  }
}

export const isTerminalTelemetryLog = (log = {}) => {
  return getTerminalLogContext(log).isTelemetry
}

export const buildTerminalRow = (log = {}) => {
  const { telemetryPayload, message, parsedPulse, isTelemetry } = getTerminalLogContext(log)

  const estado =
    getPayloadValue(telemetryPayload, ["estado", "status"]) ||
    parsedPulse.estado ||
    (log.type === "error" ? "error" : log.type === "pending" ? "pending" : "-")

  const velocidad =
    getPayloadValue(telemetryPayload, ["velocidad", "speed"]) || parsedPulse.velocidad
  const lat = getPayloadValue(telemetryPayload, ["lat", "latitude"]) || parsedPulse.lat
  const lng = getPayloadValue(telemetryPayload, ["lng", "lon", "longitude"]) || parsedPulse.lng
  const telemetryDetails = isTelemetry
    ? orderTelemetryDetails(
        terminalTelemetryDetailColumns.map((column) => ({
          key: column.key,
          label: column.label,
          value: getCellValue(telemetryPayload, column),
        })),
      )
    : []

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
    telemetryDetails,
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
