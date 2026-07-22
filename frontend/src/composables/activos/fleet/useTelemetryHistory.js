import { parseNumberFromLabel } from "../../../utils/numberUtils.js"
import {
  formatTelemetryTime,
  getTelemetryTimestamp,
  normalizeTelemetryReports,
} from "../../../utils/telemetryUtils.js"
import {
  appendReportEventsFromTelemetryReports,
  clearReportEventsForSourceKeys,
  clearGeneratedReportEvents,
  clearReportEventsForAsset,
  getReportEventSourceKeyForReport,
} from "../../reports/useGeneratedReportEvents.js"

export const TELEMETRY_HISTORY_MAX_REPORTS_PER_ASSET = 1200

const telemetryReportsByAssetId = new Map()
const telemetryReportKeysByAssetId = new Map()
const telemetryCanonicalAssetIdByAlias = new Map()

const normalizeId = (value) => {
  return String(value ?? "").trim()
}

const normalizeIdentityList = (values = []) => {
  return Array.from(
    new Set(
      values
        .map(normalizeId)
        .filter(Boolean)
        .filter((value) => value !== "null" && value !== "undefined"),
    ),
  )
}

const getAssetIdentityValues = (source = {}) => {
  if (typeof source !== "object" || source === null) {
    return normalizeIdentityList([source])
  }

  return normalizeIdentityList([
    source.id,
    source.assetId,
    source.activoId,
    source.deviceId,
    source.device_id,
    source.imei,
    source.patente,
    source.patent,
  ])
}

const getTelemetryIdentityValues = ({ activo = {}, update = {} }) => {
  return normalizeIdentityList([
    update.id,
    update.assetId,
    update.activoId,
    update.deviceId,
    update.device_id,
    update.imei,
    update.patente,
    update.patent,
    ...getAssetIdentityValues(activo),
  ])
}

const getPrimaryAssetId = ({ activo = {}, update = {} }) => {
  return getTelemetryIdentityValues({ activo, update })[0] || ""
}

const resolveCanonicalAssetId = (identityValues = []) => {
  return (
    identityValues
      .map((identity) => telemetryCanonicalAssetIdByAlias.get(identity))
      .find(Boolean) ||
    identityValues[0] ||
    ""
  )
}

const registerAssetAliases = ({ canonicalAssetId, identityValues = [] }) => {
  if (!canonicalAssetId) return

  identityValues.forEach((identity) => {
    telemetryCanonicalAssetIdByAlias.set(identity, canonicalAssetId)
  })
}

const isValidNumber = (value) => {
  return Number.isFinite(Number(value))
}

const formatSpeedLabel = (value) => {
  const numberValue = parseNumberFromLabel(value, null)

  if (!isValidNumber(numberValue)) return "-"

  return `${Number(numberValue).toFixed(1)} km/h`
}

const normalizeTelemetryBoolean = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "boolean") return value

  const numberValue = Number(value)

  if (Number.isFinite(numberValue)) return numberValue > 0

  const normalizedValue = String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (
    ["true", "on", "si", "yes", "active", "activo", "activa", "encendido", "encendida"].includes(
      normalizedValue,
    )
  ) {
    return true
  }

  if (
    ["false", "off", "no", "inactive", "inactivo", "inactiva", "apagado", "apagada"].includes(
      normalizedValue,
    )
  ) {
    return false
  }

  return fallback
}

const isValidCoordinate = (value) => {
  return Number.isFinite(Number(value))
}

const getTelemetryReportKey = (report = {}) => {
  return [report.assetId, report.timestamp, report.lat, report.lng, report.speed]
    .map((value) => String(value ?? ""))
    .join("|")
}

const getReportTimestampValue = (report = {}) => {
  const timestampValue = new Date(report.timestamp || 0).getTime()

  return Number.isFinite(timestampValue) ? timestampValue : 0
}

const sortReportsByTimestamp = (reports = []) => {
  return [...reports].sort((firstReport, secondReport) => {
    return getReportTimestampValue(firstReport) - getReportTimestampValue(secondReport)
  })
}

const mergeTelemetryReports = (reports = []) => {
  const reportsByKey = new Map()

  normalizeTelemetryReports(reports).forEach((report) => {
    reportsByKey.set(getTelemetryReportKey(report), report)
  })

  return sortReportsByTimestamp(Array.from(reportsByKey.values()))
}

const buildTelemetryHistoryPoint = (activo = {}, update = {}) => {
  const assetId = getPrimaryAssetId({ activo, update })

  if (!assetId) return null

  const timestamp = getTelemetryTimestamp(update)
  const speedValue = parseNumberFromLabel(
    update.speed ??
      update.velocidad_kmh ??
      update.velocidad ??
      activo.speed ??
      activo.velocidad ??
      0,
    null,
  )

  const lat = update.lat ?? update.latitude ?? activo.lat ?? activo.latitude
  const lng =
    update.lng ?? update.lon ?? update.longitude ?? activo.lng ?? activo.lon ?? activo.longitude

  if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) return null

  const cleanTimestamp = String(timestamp).replace(/\D/g, "")
  const ignitionValue = normalizeTelemetryBoolean(
    update.ignition ?? update.ignicion ?? update.contacto,
    normalizeTelemetryBoolean(activo.ignition ?? activo.ignicion ?? activo.contacto),
  )

  return {
    id: update.reportId || update.telemetryId || `${assetId}-telemetry-${cleanTimestamp}`,
    assetId,
    timestamp,

    lat: Number(lat),
    lng: Number(lng),

    speed: speedValue ?? 0,
    velocidad: update.velocidad || formatSpeedLabel(speedValue ?? 0),
    velocidad_kmh: speedValue ?? 0,
    speedLabel: update.speedLabel || update.velocidad || formatSpeedLabel(speedValue ?? 0),
    speedLimit:
      update.speedLimit ?? update.limiteVelocidad ?? update.velocidadLimite ?? activo.speedLimit,
    limiteVelocidad:
      update.limiteVelocidad ??
      update.speedLimit ??
      update.velocidadLimite ??
      activo.limiteVelocidad,
    velocidadLimite:
      update.velocidadLimite ??
      update.speedLimit ??
      update.limiteVelocidad ??
      activo.velocidadLimite,
    speeding: update.speeding ?? update.isSpeeding ?? update.enExcesoVelocidad ?? null,
    isSpeeding: update.isSpeeding ?? update.speeding ?? update.enExcesoVelocidad ?? null,
    enExcesoVelocidad: update.enExcesoVelocidad ?? update.speeding ?? update.isSpeeding ?? null,
    speedingDelta: update.speedingDelta ?? update.speedOverLimit ?? update.excesoVelocidad ?? null,
    speedOverLimit: update.speedOverLimit ?? update.speedingDelta ?? update.excesoVelocidad ?? null,
    excesoVelocidad:
      update.excesoVelocidad ?? update.speedingDelta ?? update.speedOverLimit ?? null,

    estado: update.estado || update.status || activo.estado || activo.status || "offline",
    status: update.status || update.estado || activo.status || activo.estado || "offline",

    timeLabel: update.timeLabel || update.datosUlt || formatTelemetryTime(timestamp),
    datosUlt: update.datosUlt || update.timeLabel || formatTelemetryTime(timestamp),

    address:
      update.address ||
      update.direccion ||
      activo.address ||
      activo.direccion ||
      "Ubicacion actual",
    direccion:
      update.direccion ||
      update.address ||
      activo.direccion ||
      activo.address ||
      "Ubicacion actual",

    event: update.event || update.evento || "Reporte GPS",
    evento: update.evento || update.event || "Reporte GPS",

    odometer: update.odometer || update.odometro || activo.odometer || activo.odometro || null,
    odometro: update.odometro || update.odometer || activo.odometro || activo.odometer || null,

    horometro: update.horometro || activo.horometro || null,
    horometroTotal: update.horometroTotal || activo.horometroTotal || null,
    engineHours:
      update.engineHours ??
      update.horometroTotal ??
      activo.engineHours ??
      activo.horometroTotal ??
      null,
    engineHoursDaily:
      update.engineHoursDaily ??
      update.horometroDiario ??
      activo.engineHoursDaily ??
      activo.horometroDiario ??
      null,

    combustible: update.combustible || activo.combustible || null,
    fuelPercent: update.fuelPercent ?? update.combustibleNivel ?? activo.fuelPercent ?? null,
    combustibleNivel:
      update.combustibleNivel ?? update.fuelPercent ?? activo.combustibleNivel ?? null,
    geocerca: update.geocerca || activo.geocerca || null,
    alerta: update.alerta || update.choque || activo.alerta || activo.choque || null,
    choque: update.choque || activo.choque || null,
    ignition: ignitionValue,
    ignicion: ignitionValue,
    contacto: ignitionValue,
    digitalInput1:
      update.digitalInput1 ?? update.input1 ?? update.di1 ?? activo.digitalInput1 ?? null,
    digitalInput2:
      update.digitalInput2 ?? update.input2 ?? update.di2 ?? activo.digitalInput2 ?? null,
    input1: update.input1 ?? update.digitalInput1 ?? update.di1 ?? activo.input1 ?? null,
    input2: update.input2 ?? update.digitalInput2 ?? update.di2 ?? activo.input2 ?? null,

    gpsSignal: update.gpsSignal ?? activo.gpsSignal ?? null,
    gpsSignalLabel: update.gpsSignalLabel ?? activo.gpsSignalLabel ?? null,
    gpsSatellites:
      update.gpsSatellites ??
      update.satellites ??
      update.satelites ??
      activo.gpsSatellites ??
      activo.satellites ??
      activo.satelites ??
      null,
    satellites:
      update.satellites ??
      update.gpsSatellites ??
      update.satelites ??
      activo.satellites ??
      activo.gpsSatellites ??
      activo.satelites ??
      null,
    gpsFix: update.gpsFix ?? activo.gpsFix ?? null,

    canStatus: update.canStatus ?? activo.canStatus ?? null,
    canSummary: update.canSummary ?? activo.canSummary ?? null,
    canRpm: update.canRpm ?? update.rpm ?? activo.canRpm ?? null,
    canEngineTemp: update.canEngineTemp ?? update.temperaturaMotor ?? activo.canEngineTemp ?? null,
    canBatteryVoltage:
      update.canBatteryVoltage ??
      update.batteryVoltage ??
      update.voltajeBateria ??
      activo.canBatteryVoltage ??
      null,
    canEngineLoad: update.canEngineLoad ?? update.engineLoad ?? activo.canEngineLoad ?? null,
    canThrottle: update.canThrottle ?? update.throttle ?? activo.canThrottle ?? null,
    canFuelRate: update.canFuelRate ?? update.fuelRate ?? activo.canFuelRate ?? null,
    canFuelUsed: update.canFuelUsed ?? update.fuelUsed ?? activo.canFuelUsed ?? null,
    canOilPressure: update.canOilPressure ?? update.oilPressure ?? activo.canOilPressure ?? null,
    canAdBlueLevel: update.canAdBlueLevel ?? update.adBlueLevel ?? activo.canAdBlueLevel ?? null,
    canDtcCount: update.canDtcCount ?? activo.canDtcCount ?? null,

    patente: update.patente || update.patent || activo.patente || activo.patent || null,
    patent: update.patent || update.patente || activo.patent || activo.patente || null,
    vehiculo:
      update.vehiculo ||
      update.nombrePantalla ||
      activo.vehiculo ||
      activo.nombrePantalla ||
      activo.name ||
      null,
    nombrePantalla:
      update.nombrePantalla ||
      update.vehiculo ||
      activo.nombrePantalla ||
      activo.vehiculo ||
      activo.name ||
      null,

    driver: update.driver || update.conductor || activo.driver || activo.conductor || null,
    conductor: update.conductor || update.driver || activo.conductor || activo.driver || null,

    companyId: update.companyId || activo.companyId || null,
    applicationId: update.applicationId || activo.applicationId || null,
    sucursalId: update.sucursalId ?? update.groupId ?? update.tagId ?? activo.sucursalId ?? null,
    groupId: update.groupId ?? update.sucursalId ?? activo.groupId ?? activo.sucursalId ?? null,
    tagId: update.tagId ?? activo.tagId ?? null,

    isLiveTelemetry: update.isLiveTelemetry ?? true,
    isCurrentLocation: update.isCurrentLocation ?? true,
  }
}

const getReportKeysForAsset = (assetKey) => {
  const cachedReportKeys = telemetryReportKeysByAssetId.get(assetKey)

  if (cachedReportKeys) return cachedReportKeys

  const reportKeys = new Set(
    (telemetryReportsByAssetId.get(assetKey) || []).map((report) => {
      return getTelemetryReportKey(report)
    }),
  )

  telemetryReportKeysByAssetId.set(assetKey, reportKeys)

  return reportKeys
}

const findReportInsertIndex = (reports = [], report = {}) => {
  const reportTimestamp = getReportTimestampValue(report)
  let startIndex = 0
  let endIndex = reports.length

  while (startIndex < endIndex) {
    const middleIndex = Math.floor((startIndex + endIndex) / 2)
    const middleTimestamp = getReportTimestampValue(reports[middleIndex])

    if (middleTimestamp <= reportTimestamp) {
      startIndex = middleIndex + 1
    } else {
      endIndex = middleIndex
    }
  }

  return startIndex
}

const trimReportsForAssetKey = ({ reports = [], reportKeys }) => {
  const overflow = reports.length - TELEMETRY_HISTORY_MAX_REPORTS_PER_ASSET

  if (overflow <= 0) return

  const removedReports = reports.splice(0, overflow)

  removedReports.forEach((report) => {
    reportKeys.delete(getTelemetryReportKey(report))
  })

  clearReportEventsForSourceKeys(removedReports.map(getReportEventSourceKeyForReport))
}

const appendReportForAssetKey = ({ assetKey, report }) => {
  const currentReports = telemetryReportsByAssetId.get(assetKey) || []
  const reportKeys = getReportKeysForAsset(assetKey)
  const nextReportKey = getTelemetryReportKey(report)

  if (reportKeys.has(nextReportKey)) return false

  const lastReport = currentReports[currentReports.length - 1]
  const shouldAppendAtEnd =
    !lastReport || getReportTimestampValue(lastReport) <= getReportTimestampValue(report)

  if (shouldAppendAtEnd) {
    currentReports.push(report)
  } else {
    const insertIndex = findReportInsertIndex(currentReports, report)
    currentReports.splice(insertIndex, 0, report)
  }

  reportKeys.add(nextReportKey)
  trimReportsForAssetKey({
    reports: currentReports,
    reportKeys,
  })

  telemetryReportsByAssetId.set(assetKey, currentReports)

  return true
}

export const appendTelemetryReports = (batch = []) => {
  if (!Array.isArray(batch) || !batch.length) return []

  const appendedReports = []

  batch.forEach((rawUpdate) => {
    const activo = rawUpdate?.activo || {}
    const identityValues = getTelemetryIdentityValues({
      activo,
      update: rawUpdate,
    })

    if (!identityValues.length) return

    const canonicalAssetId = resolveCanonicalAssetId(identityValues)

    registerAssetAliases({
      canonicalAssetId,
      identityValues,
    })

    const update = {
      ...rawUpdate,
      id: canonicalAssetId,
      assetId: canonicalAssetId,
    }

    const nextReport = buildTelemetryHistoryPoint(activo, update)

    if (!nextReport) return

    const reportWasAppended = appendReportForAssetKey({
      assetKey: canonicalAssetId,
      report: nextReport,
    })

    if (reportWasAppended) {
      appendedReports.push(nextReport)
    }
  })

  appendReportEventsFromTelemetryReports(appendedReports)

  return appendedReports
}

export const getReportsForAsset = (asset) => {
  const identityValues = getAssetIdentityValues(asset)

  if (!identityValues.length) return []

  const canonicalAssetIds = Array.from(
    new Set(
      identityValues.map((identity) => {
        return telemetryCanonicalAssetIdByAlias.get(identity) || identity
      }),
    ),
  )
  const reports = canonicalAssetIds.flatMap((assetKey) => {
    return telemetryReportsByAssetId.get(assetKey) || []
  })

  return mergeTelemetryReports(reports)
}

export const getTelemetryReportsCountForAsset = (asset) => {
  return getReportsForAsset(asset).length
}

export const clearReportsForAsset = (asset) => {
  const identityValues = getAssetIdentityValues(asset)
  const canonicalAssetIds = new Set(
    identityValues.map((identity) => {
      return telemetryCanonicalAssetIdByAlias.get(identity) || identity
    }),
  )

  canonicalAssetIds.forEach((assetKey) => {
    telemetryReportsByAssetId.delete(assetKey)
    telemetryReportKeysByAssetId.delete(assetKey)
  })

  telemetryCanonicalAssetIdByAlias.forEach((canonicalAssetId, alias) => {
    if (canonicalAssetIds.has(canonicalAssetId) || identityValues.includes(alias)) {
      telemetryCanonicalAssetIdByAlias.delete(alias)
    }
  })

  clearReportEventsForAsset(asset)
}

export const clearTelemetryHistory = () => {
  telemetryReportsByAssetId.clear()
  telemetryReportKeysByAssetId.clear()
  telemetryCanonicalAssetIdByAlias.clear()
  clearGeneratedReportEvents()
}
