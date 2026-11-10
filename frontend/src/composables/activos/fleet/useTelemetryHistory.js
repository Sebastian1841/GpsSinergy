import { parseNumberFromLabel } from "../../../utils/numberUtils.js"
import { readMaintenanceHours } from '../../../utils/maintenance/maintenanceTelemetryReading.js'
import {
  formatTelemetryTime,
  getTelemetryTimestamp,
  normalizeTelemetryReports,
} from "../../../utils/telemetryUtils.js"
import {
  appendReportEventsFromTelemetryReports,
  clearReportEventsForSourceKeys,
  clearGeneratedReportEvents,
  getReportEventSourceKeyForReport,
} from "../../reports/useGeneratedReportEvents.js"

export const TELEMETRY_HISTORY_MAX_REPORTS_PER_ASSET = 1200

const telemetryReportsByAssetId = new Map()
const telemetryReportKeysByAssetId = new Map()
const telemetryCanonicalAssetIdByAlias = new Map()
const telemetryIdentityByAssetKey = new Map()

const normalizeId = (value) => {
  return String(value ?? "").trim()
}

const normalizeIdentity = (value) => {
  const identity = normalizeId(value)
  return ["", "-", "--", "null", "undefined", "n/a", "sin patente", "sin dato"].includes(
    identity.toLowerCase(),
  )
    ? ""
    : identity
}

const getAssetIdentity = (source = {}) => {
  if (typeof source !== "object" || source === null) {
    return { aliases: [["any", normalizeIdentity(source)]].filter(([, value]) => value) }
  }
  const aliases = [
    ["id", [source.assetId, source.activoId, source.id].map(normalizeIdentity).find(Boolean)],
    ["device", [source.deviceId, source.device_id].map(normalizeIdentity).find(Boolean)],
    ["imei", source.imei],
    ["plate", [source.patente, source.patent].map(normalizeIdentity).find(Boolean)],
  ]
    .map(([type, value]) => [type, normalizeIdentity(value)])
    .filter(([, value]) => value)
  return {
    aliases,
    companyId: normalizeIdentity(source.companyId),
    applicationId: normalizeIdentity(source.applicationId),
  }
}

const aliasKey = ([type, value]) => JSON.stringify([type, value])
const identityKey = (identity) =>
  JSON.stringify([identity.applicationId || "", identity.companyId || "", ...identity.aliases[0]])
const matchesScope = (identity, owner) =>
  (!identity.companyId || identity.companyId === owner.companyId) &&
  (!identity.applicationId || identity.applicationId === owner.applicationId)

const findAssetKeys = (identity) => {
  // An explicit asset ID must never fall back to a plate or device belonging to another asset.
  const aliases =
    identity.aliases[0]?.[0] === "id" ? identity.aliases.slice(0, 1) : identity.aliases
  const candidates = new Set()
  for (const alias of aliases) {
    const keys =
      alias[0] === "any"
        ? ["id", "device", "imei", "plate"].map((type) => aliasKey([type, alias[1]]))
        : [aliasKey(alias)]
    for (const key of keys) {
      for (const assetKey of telemetryCanonicalAssetIdByAlias.get(key) || []) {
        if (matchesScope(identity, telemetryIdentityByAssetKey.get(assetKey)))
          candidates.add(assetKey)
      }
    }
  }
  return candidates.size === 1 ? [...candidates] : []
}

const registerAssetAliases = (assetKey, identity) => {
  const aliases = [...new Map(identity.aliases.map((alias) => [aliasKey(alias), alias])).values()]
  telemetryIdentityByAssetKey.set(assetKey, { ...identity, aliases })
  for (const alias of identity.aliases) {
    const key = aliasKey(alias)
    const owners = telemetryCanonicalAssetIdByAlias.get(key) || new Set()
    owners.add(assetKey)
    telemetryCanonicalAssetIdByAlias.set(key, owners)
  }
}

const getPrimaryAssetId = ({ activo = {}, update = {} }) =>
  getAssetIdentity({ ...activo, ...update }).aliases[0]?.[1] || ""

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
    recordedMaintenanceReadings: {
      odometer: update.odometer ?? update.odometro ?? null,
      hourMeterHours: readMaintenanceHours(update),
    },

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
    const identity = getAssetIdentity({
      ...activo,
      ...rawUpdate,
      assetId:
        activo.id ?? activo.assetId ?? rawUpdate.assetId ?? rawUpdate.activoId ?? rawUpdate.id,
    })
    if (!identity.aliases.length) return
    const assetKey =
      identity.aliases[0][0] === "id"
        ? identityKey(identity)
        : findAssetKeys(identity)[0] || identityKey(identity)
    const canonicalAssetId =
      telemetryIdentityByAssetKey.get(assetKey)?.aliases[0][1] || identity.aliases[0][1]

    const update = {
      ...rawUpdate,
      id: canonicalAssetId,
      assetId: canonicalAssetId,
    }

    const nextReport = buildTelemetryHistoryPoint(activo, update)

    if (!nextReport) return

    registerAssetAliases(assetKey, {
      ...identity,
      companyId: telemetryIdentityByAssetKey.get(assetKey)?.companyId || identity.companyId,
      applicationId:
        telemetryIdentityByAssetKey.get(assetKey)?.applicationId || identity.applicationId,
      aliases: [...(telemetryIdentityByAssetKey.get(assetKey)?.aliases || []), ...identity.aliases],
    })

    const reportWasAppended = appendReportForAssetKey({
      assetKey,
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
  const canonicalAssetIds = findAssetKeys(getAssetIdentity(asset))
  const reports = canonicalAssetIds.flatMap((assetKey) => {
    return telemetryReportsByAssetId.get(assetKey) || []
  })

  return mergeTelemetryReports(reports)
}

export const getTelemetryReportsCountForAsset = (asset) => {
  return getReportsForAsset(asset).length
}

export const clearReportsForAsset = (asset) => {
  const canonicalAssetIds = new Set(findAssetKeys(getAssetIdentity(asset)))

  canonicalAssetIds.forEach((assetKey) => {
    clearReportEventsForSourceKeys(
      (telemetryReportsByAssetId.get(assetKey) || []).map(getReportEventSourceKeyForReport),
    )
    telemetryReportsByAssetId.delete(assetKey)
    telemetryReportKeysByAssetId.delete(assetKey)
    telemetryIdentityByAssetKey.delete(assetKey)
  })

  telemetryCanonicalAssetIdByAlias.forEach((owners, alias) => {
    canonicalAssetIds.forEach((assetKey) => owners.delete(assetKey))
    if (!owners.size) telemetryCanonicalAssetIdByAlias.delete(alias)
  })
}

export const clearTelemetryHistory = () => {
  telemetryReportsByAssetId.clear()
  telemetryReportKeysByAssetId.clear()
  telemetryCanonicalAssetIdByAlias.clear()
  telemetryIdentityByAssetKey.clear()
  clearGeneratedReportEvents()
}
