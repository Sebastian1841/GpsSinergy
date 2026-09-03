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
  geofenceEntryTime: "Hora entrada",
  geofenceExitTime: "Hora salida",
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
export const PDF_REPORT_VISIBLE_DATA_COLUMN_LIMIT = 6
const REPORT_COLUMN_ALIASES = {
  lastPosition: "address",
}
const IDLE_REPORT_REQUIRED_COLUMNS = ["fecha", "timestamp", "patente", "duracion"]
const STOPS_REPORT_REQUIRED_COLUMNS = [
  "fecha",
  "timestamp",
  "patente",
  "duracion",
  "address",
  "lat",
  "lng",
]
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
  "geofenceEntryTime",
  "geofenceExitTime",
  "evento",
  "duracion",
]

export const SESSION_AGGREGATED_EVENT_RULE_IDS = new Set(["idle", "geofence", "stops"])

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
  if (reportTypeId === "stops") return false

  return reportTypeId === "idle-time" || (ruleIds.includes("idle") && !ruleIds.includes("movement"))
}

export const isStopsReportTemplate = (template = {}) => {
  const reportTypeId = normalizeReportId(template.reportTypeId)

  return reportTypeId === "stops"
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
  const hasTemplateColumns = Boolean(template?.columns?.length)
  const selectedTemplateColumns = hasTemplateColumns ? template.columns : []
  const templateColumns = hasTemplateColumns
    ? selectedTemplateColumns
    : DEFAULT_ASSET_REPORT_COLUMNS

  if (isRouteHistoryReportTemplate(template)) {
    return template?.columns?.length ? templateColumns : ROUTE_HISTORY_REPORT_COLUMNS
  }

  if (isGeofenceReportTemplate(template)) {
    return [...GEOFENCE_REPORT_REQUIRED_COLUMNS, ...selectedTemplateColumns]
  }

  if (isStopsReportTemplate(template)) {
    return [...STOPS_REPORT_REQUIRED_COLUMNS, ...selectedTemplateColumns]
  }

  if (isIdleReportTemplate(template)) {
    return [...IDLE_REPORT_REQUIRED_COLUMNS, ...selectedTemplateColumns]
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

export const getPdfVisibleReportColumns = (reportColumns = []) => {
  if (!Array.isArray(reportColumns)) return []

  return reportColumns.slice(0, PDF_REPORT_VISIBLE_DATA_COLUMN_LIMIT)
}

export const getPdfHiddenReportColumns = (reportColumns = []) => {
  if (!Array.isArray(reportColumns)) return []

  return reportColumns.slice(PDF_REPORT_VISIBLE_DATA_COLUMN_LIMIT)
}
