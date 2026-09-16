import { normalizeId } from "../idUtils.js"

export const ALARM_STATUS_OPTIONS = [
  { id: "open", label: "Activa" },
  { id: "resolved", label: "Resuelta" },
]

export const ALARM_SEVERITY_OPTIONS = [
  { id: "critical", label: "Critica" },
  { id: "high", label: "Alta" },
  { id: "medium", label: "Media" },
  { id: "low", label: "Baja" },
]

export const ALARM_TYPE_OPTIONS = [
  { id: "speeding", label: "Exceso de velocidad" },
  { id: "geofence", label: "Geocerca" },
  { id: "no_signal", label: "Sin senal" },
  { id: "stop_time", label: "Detencion prolongada" },
  { id: "ignition", label: "Encendido" },
  { id: "fuel", label: "Combustible" },
  { id: "battery", label: "Bateria" },
]

const STATUS_ORDER = {
  open: 0,
  resolved: 1,
}

const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const STATUS_LABELS = new Map(ALARM_STATUS_OPTIONS.map((option) => [option.id, option.label]))
const SEVERITY_LABELS = new Map(ALARM_SEVERITY_OPTIONS.map((option) => [option.id, option.label]))
const TYPE_LABELS = new Map(ALARM_TYPE_OPTIONS.map((option) => [option.id, option.label]))

const normalizeText = (value) => {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

const parseDateTime = (value) => {
  const time = Date.parse(value)

  return Number.isFinite(time) ? time : 0
}

const getStartOfDayTime = (value) => {
  if (!value) return null

  const time = Date.parse(`${value}T00:00:00`)

  return Number.isFinite(time) ? time : null
}

const getEndOfDayTime = (value) => {
  if (!value) return null

  const time = Date.parse(`${value}T23:59:59.999`)

  return Number.isFinite(time) ? time : null
}

const getAssetName = (asset = {}) => {
  return asset.vehiculo || asset.nombrePantalla || asset.name || asset.nombre || "Activo"
}

const getAssetPlate = (asset = {}) => {
  return asset.patente || asset.patent || asset.plate || asset.ppu || asset.matricula || "-"
}

const getCompanyName = (company = {}, fallback = "") => {
  return company.name || company.shortName || fallback || "Empresa"
}

const normalizeAlarmStatus = (status) => {
  return normalizeId(status) === "resolved" ? "resolved" : "open"
}

export const getAlarmStatusLabel = (status) => {
  return STATUS_LABELS.get(normalizeAlarmStatus(status)) || "Sin estado"
}

export const getAlarmSeverityLabel = (severity) => {
  return SEVERITY_LABELS.get(normalizeId(severity)) || "Sin prioridad"
}

export const getAlarmTypeLabel = (type) => {
  return TYPE_LABELS.get(normalizeId(type)) || "Operacion"
}

export const getAlarmTriggerReason = (alarm = {}) => {
  const type = normalizeId(alarm.type || "operation")
  const metadata = alarm.metadata && typeof alarm.metadata === "object" ? alarm.metadata : {}

  if (type === "speeding") {
    const speed = metadata.speed || metadata.registeredSpeed || metadata.value
    const limit = metadata.limit || metadata.threshold

    if (speed && limit) return `Velocidad registrada ${speed} sobre limite ${limit}.`
    if (speed) return `Velocidad registrada ${speed}.`
  }

  if (type === "battery") {
    const voltage = metadata.voltage || metadata.battery || metadata.value
    const threshold = metadata.threshold || metadata.limit

    if (voltage && threshold) return `Bateria ${voltage} bajo umbral ${threshold}.`
    if (voltage) return `Bateria reportada ${voltage}.`
  }

  if (type === "no_signal") {
    const offlineMinutes = metadata.offlineMinutes || metadata.duration || metadata.value
    const lastReport = metadata.lastReport

    if (offlineMinutes && lastReport) {
      return `Sin reporte por ${offlineMinutes}; ultimo dato ${lastReport}.`
    }

    if (offlineMinutes) return `Sin reporte por ${offlineMinutes}.`
  }

  if (type === "stop_time") {
    const stoppedTime = metadata.stoppedTime || metadata.duration || metadata.value
    const threshold = metadata.threshold || metadata.limit

    if (stoppedTime && threshold) return `Detenido ${stoppedTime} sobre umbral ${threshold}.`
    if (stoppedTime) return `Detenido por ${stoppedTime}.`
  }

  if (type === "geofence") {
    const event = metadata.event || metadata.action
    const geofence = metadata.geofence || metadata.zone || metadata.location

    if (event && geofence) return `${event} de geocerca ${geofence}.`
    if (geofence) return `Evento en geocerca ${geofence}.`
  }

  if (type === "fuel") {
    const variation = metadata.variation || metadata.value
    const period = metadata.period || metadata.window

    if (variation && period) return `Variacion ${variation} en ${period}.`
    if (variation) return `Variacion de combustible ${variation}.`
  }

  if (type === "ignition") {
    const ignitionAt = metadata.ignitionAt || metadata.time
    const schedule = metadata.schedule || metadata.allowedSchedule

    if (ignitionAt && schedule) return `Encendido a las ${ignitionAt} fuera de ${schedule}.`
    if (ignitionAt) return `Encendido a las ${ignitionAt}.`
  }

  return alarm.description || getAlarmTypeLabel(type)
}

export const buildAlarmRows = ({ alarms = [], assets = [], companies = [] } = {}) => {
  const assetsById = new Map(assets.map((asset) => [normalizeId(asset.id), asset]))
  const companiesById = new Map(companies.map((company) => [normalizeId(company.id), company]))

  return alarms
    .map((alarm) => {
      const assetId = normalizeId(alarm.assetId)
      const asset = assetsById.get(assetId) || null
      const companyId = normalizeId(asset?.companyId || alarm.companyId)
      const company = companiesById.get(companyId) || null
      const status = normalizeAlarmStatus(alarm.status)
      const severity = normalizeId(alarm.severity || "medium")
      const type = normalizeId(alarm.type || "operation")
      const createdTime = parseDateTime(alarm.createdAt)

      return {
        ...alarm,
        id: normalizeId(alarm.id),
        assetId,
        companyId,
        status,
        severity,
        type,
        asset,
        company,
        assetName: asset ? getAssetName(asset) : alarm.assetName || "Activo no disponible",
        assetPlate: asset ? getAssetPlate(asset) : alarm.assetPlate || "-",
        companyName: getCompanyName(company, alarm.companyName),
        statusLabel: getAlarmStatusLabel(status),
        severityLabel: getAlarmSeverityLabel(severity),
        typeLabel: getAlarmTypeLabel(type),
        triggerReason: getAlarmTriggerReason({
          ...alarm,
          type,
        }),
        createdTime,
      }
    })
    .filter((alarm) => alarm.id && alarm.assetId)
}

export const getAuthorizedAlarmRows = ({
  alarms = [],
  visibleAssets = [],
  companies = [],
  companyId = "",
} = {}) => {
  const normalizedCompanyId = normalizeId(companyId)
  const authorizedAssets = visibleAssets.filter((asset) => {
    return !normalizedCompanyId || normalizeId(asset.companyId) === normalizedCompanyId
  })
  const authorizedAssetIds = new Set(authorizedAssets.map((asset) => normalizeId(asset.id)))
  const authorizedAlarms = alarms.filter((alarm) => {
    return authorizedAssetIds.has(normalizeId(alarm.assetId))
  })

  return buildAlarmRows({
    alarms: authorizedAlarms,
    assets: authorizedAssets,
    companies,
  })
}

export const filterAlarmRows = ({
  rows = [],
  searchTerm = "",
  selectedStatus = "all",
  selectedSeverity = "all",
  selectedType = "all",
  selectedAssetId = "all",
  dateFrom = "",
  dateTo = "",
} = {}) => {
  const normalizedSearch = normalizeText(searchTerm)
  const normalizedStatus = normalizeId(selectedStatus || "all")
  const normalizedSeverity = normalizeId(selectedSeverity || "all")
  const normalizedType = normalizeId(selectedType || "all")
  const normalizedAssetId = normalizeId(selectedAssetId || "all")
  const startTime = getStartOfDayTime(dateFrom)
  const endTime = getEndOfDayTime(dateTo)

  return rows.filter((alarm) => {
    if (normalizedStatus === "active" && alarm.status === "resolved") return false
    if (
      normalizedStatus !== "all" &&
      normalizedStatus !== "active" &&
      alarm.status !== normalizedStatus
    ) {
      return false
    }
    if (normalizedSeverity !== "all" && alarm.severity !== normalizedSeverity) return false
    if (normalizedType !== "all" && alarm.type !== normalizedType) return false
    if (normalizedAssetId !== "all" && alarm.assetId !== normalizedAssetId) return false
    if (startTime !== null && alarm.createdTime < startTime) return false
    if (endTime !== null && alarm.createdTime > endTime) return false

    if (!normalizedSearch) return true

    const searchValues = [
      alarm.title,
      alarm.description,
      alarm.assetName,
      alarm.assetPlate,
      alarm.companyName,
      alarm.typeLabel,
      alarm.severityLabel,
      alarm.statusLabel,
      alarm.triggerReason,
    ]

    return searchValues.some((value) => normalizeText(value).includes(normalizedSearch))
  })
}

export const sortAlarmRows = (rows = []) => {
  return [...rows].sort((left, right) => {
    const statusDelta = (STATUS_ORDER[left.status] ?? 9) - (STATUS_ORDER[right.status] ?? 9)

    if (statusDelta) return statusDelta

    const severityDelta =
      (SEVERITY_ORDER[left.severity] ?? 9) - (SEVERITY_ORDER[right.severity] ?? 9)

    if (severityDelta) return severityDelta

    return right.createdTime - left.createdTime
  })
}

export const buildAlarmSummary = (rows = []) => {
  let active = 0
  let open = 0
  let critical = 0
  let resolved = 0

  rows.forEach((alarm) => {
    const isResolved = alarm.status === "resolved"

    if (!isResolved) active += 1
    if (alarm.status === "open") open += 1
    if (isResolved) resolved += 1
    if (!isResolved && alarm.severity === "critical") critical += 1
  })

  return {
    total: rows.length,
    active,
    open,
    critical,
    resolved,
  }
}
