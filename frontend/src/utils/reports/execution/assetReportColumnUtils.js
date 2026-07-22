import { FLEET_TELEMETRY_COLUMNS } from "../../activos/fleetTelemetryColumns.js"

const BASE_ASSET_REPORT_COLUMN_LABELS = {
  fecha: "Fecha",
  timestamp: "Hora",
  patente: "Patente",
  vehiculo: "Activo",
  assetDisplayName: "Activo",
  assetPatente: "Patente",
  assetDeviceId: "Dispositivo",
  deviceId: "Dispositivo",
  empresa: "Empresa",
  conductor: "Conductor",
  estado: "Estado",
  status: "Estado",
  ignition: "Encendido",
  ignicion: "Encendido",
  contacto: "Encendido",
  ultimoDato: "Ultimo dato",
  velocidad: "Velocidad",
  speed: "Velocidad",
  dateLabel: "Fecha",
  odometro: "Odometro",
  horometro: "Horometro",
  geocerca: "Geocerca",
  evento: "Evento",
  event: "Evento",
  duracion: "Duracion",
  speedLimit: "Limite",
  speedingDelta: "Sobre limite",
  speeding: "Exceso",
  combustible: "Combustible",
  alerta: "Alerta",
  address: "Direccion",
  lastPosition: "Direccion",
  accumulatedDistanceKm: "Km acum.",
  tripStart: "Inicio",
  tripEnd: "Fin",
  tripDuration: "Duracion",
  tripOrigin: "Origen",
  tripDestination: "Destino",
  tripDistanceKm: "Km",
  tripMaxSpeed: "Vel. max",
  tripStops: "Paradas",
  tripEvents: "Eventos",
}

const FLEET_REPORT_COLUMN_LABELS = Object.fromEntries(
  FLEET_TELEMETRY_COLUMNS.map((column) => [column.key, column.label]),
)

export const ASSET_REPORT_COLUMN_LABELS = {
  ...FLEET_REPORT_COLUMN_LABELS,
  ...BASE_ASSET_REPORT_COLUMN_LABELS,
  datosUlt: "Ult. reporte",
  horometroTotal: "Horometro",
  horometroDiario: "Hor. diario",
  gpsSatellites: "Satelites",
  gpsSignal: "Senal GPS",
  canRpm: "RPM",
  canEngineTemp: "Temp. motor",
  canBatteryVoltage: "Voltaje",
  canEngineLoad: "Carga motor",
  canSummary: "Resumen CAN",
  canThrottle: "Acelerador",
  canFuelRate: "Cons. L/h",
  canFuelUsed: "Comb. usado",
  canOilPressure: "Pres. aceite",
  canAdBlueLevel: "AdBlue",
  canDtcCount: "DTC",
  digitalInput1: "Entrada digital 1",
  digitalInput2: "Entrada digital 2",
}

export const REPORT_REALTIME_COLUMN_KEYS = [
  "velocidad",
  "combustible",
  "ignition",
  "gpsSatellites",
  "gpsSignal",
  "gpsFix",
  "lat",
  "lng",
  "coordinates",
  "address",
  "odometro",
  "horometroTotal",
  "horometroDiario",
  "canRpm",
  "canEngineTemp",
  "canBatteryVoltage",
  "canEngineLoad",
  "canSummary",
  "canThrottle",
  "canFuelRate",
  "canFuelUsed",
  "canOilPressure",
  "canAdBlueLevel",
  "canDtcCount",
  "digitalInput1",
  "digitalInput2",
  "trackerModelLabel",
  "imei",
  "protocol",
  "fechaIngreso",
]

export const REPORT_AUTO_COLUMN_KEYS = ["deviceId", ...REPORT_REALTIME_COLUMN_KEYS]

export const DEFAULT_ASSET_REPORT_COLUMNS = [
  "fecha",
  "patente",
  "vehiculo",
  "deviceId",
  "conductor",
  "estado",
  "ultimoDato",
  ...REPORT_REALTIME_COLUMN_KEYS,
]

const REQUIRED_ASSET_REPORT_COLUMNS = ["fecha"]
const REPORT_COLUMN_ALIASES = {
  lastPosition: "address",
}
const IDLE_REPORT_REQUIRED_COLUMNS = ["fecha", "timestamp", "patente", "duracion"]
const IDLE_REPORT_OPTIONAL_COLUMNS = new Set(["address"])
const ROUTE_HISTORY_REPORT_COLUMNS = [
  "fecha",
  "patente",
  "vehiculo",
  "tripStart",
  "tripEnd",
  "tripDuration",
  "tripOrigin",
  "tripDestination",
  "tripDistanceKm",
  "tripMaxSpeed",
  "tripStops",
  "tripEvents",
]
const GEOFENCE_REPORT_REQUIRED_COLUMNS = [
  "fecha",
  "timestamp",
  "patente",
  "vehiculo",
  "geocerca",
  "evento",
  "duracion",
]

export const SESSION_AGGREGATED_EVENT_RULE_IDS = new Set(["idle", "geofence"])

export const normalizeReportId = (value) => String(value ?? "").trim()

export const normalizeTemplateRuleIds = (template = {}) => {
  const ruleIds = Array.isArray(template.eventRuleIds)
    ? template.eventRuleIds
    : template.eventRuleId
      ? [template.eventRuleId]
      : []

  return ruleIds.map(normalizeReportId).filter(Boolean)
}

export const isIdleReportTemplate = (template = {}) => {
  const reportTypeId = normalizeReportId(template.reportTypeId)
  const ruleIds = normalizeTemplateRuleIds(template)

  if (reportTypeId === "route-history") return false

  return (
    reportTypeId === "idle-time" ||
    reportTypeId === "stops" ||
    (ruleIds.includes("idle") && !ruleIds.includes("movement"))
  )
}

export const isGeofenceReportTemplate = (template = {}) => {
  const reportTypeId = normalizeReportId(template.reportTypeId)
  const ruleIds = normalizeTemplateRuleIds(template)

  return reportTypeId === "geofences" || ruleIds.includes("geofence")
}

const isRouteHistoryReportTemplate = (template = {}) => {
  return normalizeReportId(template.reportTypeId) === "route-history"
}

const resolveTemplateColumns = (template = {}) => {
  const templateColumns = template?.columns?.length
    ? template.columns
    : DEFAULT_ASSET_REPORT_COLUMNS

  if (isRouteHistoryReportTemplate(template)) {
    return template?.columns?.length ? templateColumns : ROUTE_HISTORY_REPORT_COLUMNS
  }

  if (isGeofenceReportTemplate(template)) {
    return GEOFENCE_REPORT_REQUIRED_COLUMNS
  }

  if (isIdleReportTemplate(template)) {
    const optionalColumns = templateColumns
      .map((columnKey) => REPORT_COLUMN_ALIASES[columnKey] || columnKey)
      .filter((columnKey) => IDLE_REPORT_OPTIONAL_COLUMNS.has(columnKey))

    return [...IDLE_REPORT_REQUIRED_COLUMNS, ...optionalColumns]
  }

  return templateColumns
}

export const createReportColumns = (template) => {
  const templateColumns = resolveTemplateColumns(template)
  return Array.from(
    new Set(
      [...REQUIRED_ASSET_REPORT_COLUMNS, ...templateColumns].map(
        (columnKey) => REPORT_COLUMN_ALIASES[columnKey] || columnKey,
      ),
    ),
  )
    .filter((columnKey) => ASSET_REPORT_COLUMN_LABELS[columnKey])
    .map((columnKey) => ({
      key: columnKey,
      label: ASSET_REPORT_COLUMN_LABELS[columnKey],
    }))
}
