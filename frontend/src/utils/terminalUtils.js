const LOG_TEXT_CLASS = {
  server: "text-slate-700",
  report: "text-emerald-700",
  client: "text-[#102372]",
  error: "text-red-600",
  pending: "text-[#FF6600]",
}

const LOG_BADGE_CLASS = {
  server: "bg-slate-100 text-slate-700",
  report: "bg-emerald-50 text-emerald-700",
  client: "bg-[#eef3ff] text-[#102372]",
  error: "bg-red-50 text-red-600",
  pending: "bg-orange-50 text-[#FF6600]",
}

const REPORT_ITEM_CLASS = {
  orange: "border-[#FF6600]/20 bg-[#fff7ed] text-[#FF6600]",
  blue: "border-[#102372]/15 bg-[#eef3ff] text-[#102372]",
  red: "border-red-100 bg-red-50 text-red-600",
  green: "border-emerald-100 bg-emerald-50 text-emerald-700",
}

const GPS_GATE_ORDER = [
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

const cleanValue = (value) => {
  if (value === null || value === undefined) return ""

  const stringValue = String(value).trim()

  return !stringValue || stringValue === "-" ? "" : stringValue
}

const formatValue = (value, fallback = "-") => {
  return value === null || value === undefined || value === "" ? fallback : value
}

const parseGpsGateMessage = (message = "") => {
  const pairs = {}
  const regex = /\(([^=()]+)=([^()]*)\)/g
  const rawMessage = String(message)

  let match = regex.exec(rawMessage)

  while (match) {
    const key = match[1]?.trim()
    const value = cleanValue(match[2])

    if (key && value) {
      pairs[key] = value
    }

    match = regex.exec(rawMessage)
  }

  return pairs
}

const getVariableTone = (key, value) => {
  if (key === "CommandResult") return value === "OK" ? "green" : "red"
  if (key === "GpsValid") return value === "True" ? "green" : "red"
  if (key === "Status") return "green"

  if (key === "Ignition" || key === "Fuel" || key === "BatteryVoltage" || key === "InputVoltage") {
    return "orange"
  }

  return "blue"
}

const getReportItems = (type, message) => {
  const rawMessage = String(message)

  if (type !== "report" || !rawMessage.includes("(") || !rawMessage.includes("=")) {
    return []
  }

  const data = parseGpsGateMessage(rawMessage)

  const keys = [
    ...GPS_GATE_ORDER.filter((key) => data[key]),
    ...Object.keys(data).filter((key) => !GPS_GATE_ORDER.includes(key)),
  ]

  return keys.map((key) => {
    const tone = getVariableTone(key, data[key])

    return {
      label: key,
      value: data[key],
      className: REPORT_ITEM_CLASS[tone] || REPORT_ITEM_CLASS.blue,
    }
  })
}

export const decorateLog = (log) => {
  return {
    ...log,
    textClass: LOG_TEXT_CLASS[log.type] || LOG_TEXT_CLASS.server,
    badgeClass: LOG_BADGE_CLASS[log.type] || LOG_BADGE_CLASS.server,
    reportItems: getReportItems(log.type, log.message),
  }
}

export const createLog = ({
  id = createId(),
  type = "server",
  source = "Server",
  message = "",
  time = getTime(),
  date = getDate(),
} = {}) => {
  return decorateLog({
    id,
    type,
    source,
    message,
    time,
    date,
  })
}

export const normalizeHistoryLog = (log = {}) => {
  const type = log.type || log.kind || "report"

  return createLog({
    id: log.id || createId(),
    type,
    source:
      log.source ||
      (type === "client"
        ? "Client"
        : type === "server"
          ? "Server"
          : type === "error"
            ? "Error"
            : "Report"),
    message: String(log.message ?? log.raw ?? log.response ?? log.report ?? log.data ?? ""),
    time: log.time || getTime(),
    date: log.date || getDate(),
  })
}

const buildGpsGateReportMessage = (activo = {}) => {
  return [
    "(GpsValid=True)",
    `(Latitude=${formatValue(activo.lat)})`,
    `(Longitude=${formatValue(activo.lng)})`,
    `(Speed=${formatValue(activo.speed || activo.velocidad, "0")})`,
    "(Heading=-)",
    "(Altitude=-)",
    `(Ignition=${formatValue(activo.ignicion)})`,
    "(InputVoltage=-)",
    "(BatteryVoltage=-)",
    `(Fuel=${formatValue(activo.combustible || activo.fuel)})`,
    `(TotalOdometer=${formatValue(activo.odometro || activo.odometer)})`,
    `(DriverID=${formatValue(activo.ibutton)})`,
    `(Address=${formatValue(activo.direccion || activo.ubicacion)})`,
  ].join(" ")
}

export const createSimulatedHistory = (activo = {}) => {
  const imei = activo.imei || "-"
  const protocol = String(activo.protocol || "teltonika").toUpperCase()

  return [
    createLog({
      type: "server",
      source: "Server",
      message: `${imei} ${protocol} TCP connected`,
    }),
    createLog({
      type: "report",
      source: "Report",
      message: buildGpsGateReportMessage(activo),
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
      message: buildGpsGateReportMessage(activo),
    }),
  ]
}
