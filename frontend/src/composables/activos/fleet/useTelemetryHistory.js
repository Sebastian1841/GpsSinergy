import { parseNumberFromLabel } from "../../../utils/numberUtils.js"
import {
  formatTelemetryTime,
  getTelemetryTimestamp,
  normalizeTelemetryReports,
} from "../../../utils/telemetryUtils.js"

const TELEMETRY_REPORTS_LIMIT = 500

const telemetryReportsByAssetId = new Map()

const normalizeId = (value) => {
  return String(value ?? "")
}

const isValidNumber = (value) => {
  return Number.isFinite(Number(value))
}

const formatSpeedLabel = (value) => {
  const numberValue = parseNumberFromLabel(value, null)

  if (!isValidNumber(numberValue)) return "-"

  return `${Number(numberValue).toFixed(1)} km/h`
}

const isValidCoordinate = (value) => {
  return Number.isFinite(Number(value))
}

const getTelemetryReportKey = (report = {}) => {
  return [report.assetId, report.timestamp, report.lat, report.lng, report.speed]
    .map((value) => String(value ?? ""))
    .join("|")
}

const buildTelemetryHistoryPoint = (activo = {}, update = {}) => {
  const assetId = normalizeId(update.assetId ?? update.id ?? activo.id)

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

  const lat = update.lat ?? activo.lat
  const lng = update.lng ?? activo.lng

  if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) return null

  const cleanTimestamp = String(timestamp).replace(/\D/g, "")

  return {
    id: `${assetId}-telemetry-${cleanTimestamp}`,
    assetId,
    timestamp,

    lat: Number(lat),
    lng: Number(lng),

    speed: speedValue ?? 0,
    velocidad: update.velocidad || formatSpeedLabel(speedValue ?? 0),
    velocidad_kmh: speedValue ?? 0,
    speedLabel: update.speedLabel || update.velocidad || formatSpeedLabel(speedValue ?? 0),

    estado: update.estado || update.status || activo.estado,

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

    event: update.event || "Reporte GPS",

    odometer: update.odometer || update.odometro || activo.odometer || activo.odometro || null,
    odometro: update.odometro || update.odometer || activo.odometro || activo.odometer || null,

    patente: update.patente || activo.patente || null,
    vehiculo: update.vehiculo || activo.vehiculo || activo.name || null,
    driver: update.driver || activo.driver || null,

    isLiveTelemetry: update.isLiveTelemetry ?? true,
    isCurrentLocation: update.isCurrentLocation ?? true,
  }
}

export const appendTelemetryReports = (batch = []) => {
  if (!Array.isArray(batch) || !batch.length) return []

  const appendedReports = []

  batch.forEach((rawUpdate) => {
    const activo = rawUpdate?.activo || {}
    const update = {
      ...rawUpdate,
      id: normalizeId(rawUpdate?.assetId ?? rawUpdate?.id ?? activo?.id),
      assetId: normalizeId(rawUpdate?.assetId ?? rawUpdate?.id ?? activo?.id),
    }

    const assetId = normalizeId(update.assetId || update.id)

    if (!assetId) return

    const nextReport = buildTelemetryHistoryPoint(activo, update)

    if (!nextReport) return

    const currentReports = normalizeTelemetryReports(telemetryReportsByAssetId.get(assetId) || [])

    const nextReportKey = getTelemetryReportKey(nextReport)

    const alreadyExists = currentReports.some((report) => {
      return getTelemetryReportKey(report) === nextReportKey
    })

    if (alreadyExists) return

    const nextReports = [...currentReports, nextReport].slice(-TELEMETRY_REPORTS_LIMIT)

    telemetryReportsByAssetId.set(assetId, nextReports)
    appendedReports.push(nextReport)
  })

  return appendedReports
}

export const getReportsForAsset = (assetId) => {
  const normalizedId = normalizeId(assetId)

  if (!normalizedId) return []

  return normalizeTelemetryReports(telemetryReportsByAssetId.get(normalizedId) || [])
}

export const clearReportsForAsset = (assetId) => {
  const normalizedId = normalizeId(assetId)

  if (!normalizedId) return

  telemetryReportsByAssetId.delete(normalizedId)
}

export const clearTelemetryHistory = () => {
  telemetryReportsByAssetId.clear()
}
