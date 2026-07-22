import { getAssetHistoryId, getAssetLabel, normalizeReportText } from "./assetReportAssetUtils.js"
import { normalizeReportId } from "./assetReportColumnUtils.js"
import { formatTimestamp, getCurrentDateOnly, getSourceTimestamp } from "./assetReportDateUtils.js"
import { getReportEventSourceKey } from "./assetReportRuleUtils.js"
import {
  formatSignedSpeed,
  formatSpeed,
  getAssetStateLabel,
  getCoordinateValue,
  getEffectiveSpeedLimitValue,
  getExistingDurationLabel,
  getValueFromReportOrAsset,
  parseReportNumber,
} from "./assetReportValueUtils.js"
import {
  FLEET_TELEMETRY_COLUMNS,
  getCellValue as getFleetTelemetryCellValue,
} from "../../activos/fleetTelemetryColumns.js"

const fleetColumnsByKey = new Map(FLEET_TELEMETRY_COLUMNS.map((column) => [column.key, column]))

const buildTelemetrySource = ({ asset = {}, report = {}, timestamp }) => {
  const lat = report.lat ?? report.latitude ?? asset.lat ?? asset.latitude
  const lng =
    report.lng ?? report.lon ?? report.longitude ?? asset.lng ?? asset.lon ?? asset.longitude
  const address =
    report.address ||
    report.direccion ||
    report.lastPosition ||
    asset.address ||
    asset.direccion ||
    asset.lastPosition
  const odometer = report.odometer ?? report.odometro ?? asset.odometer ?? asset.odometro
  const odometro = report.odometro ?? report.odometer ?? asset.odometro ?? asset.odometer
  const engineHours =
    report.engineHours ?? report.horometroTotal ?? report.horometro ?? asset.engineHours
  const engineHoursDaily =
    report.engineHoursDaily ??
    report.horometroDiario ??
    asset.engineHoursDaily ??
    asset.horometroDiario
  const fuelPercent =
    report.fuelPercent ??
    report.combustibleNivel ??
    report.combustible ??
    asset.fuelPercent ??
    asset.combustibleNivel ??
    asset.combustible
  const gpsSatellites =
    report.gpsSatellites ??
    report.satellites ??
    report.satelites ??
    asset.gpsSatellites ??
    asset.satellites ??
    asset.satelites
  const ignition =
    report.ignition ??
    report.ignicion ??
    report.contacto ??
    asset.ignition ??
    asset.ignicion ??
    asset.contacto
  const digitalInput1 =
    report.digitalInput1 ??
    report.input1 ??
    report.di1 ??
    asset.digitalInput1 ??
    asset.input1 ??
    asset.di1
  const digitalInput2 =
    report.digitalInput2 ??
    report.input2 ??
    report.di2 ??
    asset.digitalInput2 ??
    asset.input2 ??
    asset.di2

  return {
    ...asset,
    ...report,
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    address,
    direccion: address,
    lastPosition: address,
    deviceId:
      report.deviceId ||
      report.device_id ||
      report.imei ||
      asset.deviceId ||
      asset.device_id ||
      asset.imei,
    estado: report?.estado || report?.status || asset.estado || asset.status,
    status: report?.status || report?.estado || asset.status || asset.estado,
    ignition,
    ignicion:
      report.ignicion ??
      report.ignition ??
      report.contacto ??
      asset.ignicion ??
      asset.ignition ??
      asset.contacto,
    contacto:
      report.contacto ??
      report.ignition ??
      report.ignicion ??
      asset.contacto ??
      asset.ignition ??
      asset.ignicion,
    digitalInput1,
    digitalInput2,
    input1:
      report.input1 ??
      report.digitalInput1 ??
      report.di1 ??
      asset.input1 ??
      asset.digitalInput1 ??
      asset.di1,
    input2:
      report.input2 ??
      report.digitalInput2 ??
      report.di2 ??
      asset.input2 ??
      asset.digitalInput2 ??
      asset.di2,
    vehiculo: getAssetLabel(asset),
    datosUlt:
      report?.timeLabel ||
      report?.datosUlt ||
      report?.lastReport ||
      report?.reportedAt ||
      formatTimestamp(timestamp),
    velocidad: getValueFromReportOrAsset({
      report,
      asset,
      reportKeys: ["speedLabel", "velocidad", "speed", "velocidad_kmh"],
      assetKeys: ["velocidad", "speed", "velocidad_kmh"],
    }),
    canRpm: report.canRpm ?? report.rpm ?? asset.canRpm ?? asset.rpm,
    canEngineTemp:
      report.canEngineTemp ??
      report.temperaturaMotor ??
      asset.canEngineTemp ??
      asset.temperaturaMotor,
    canBatteryVoltage:
      report.canBatteryVoltage ??
      report.batteryVoltage ??
      report.voltajeBateria ??
      asset.canBatteryVoltage ??
      asset.batteryVoltage ??
      asset.voltajeBateria,
    canEngineLoad:
      report.canEngineLoad ?? report.engineLoad ?? asset.canEngineLoad ?? asset.engineLoad,
    canThrottle: report.canThrottle ?? report.throttle ?? asset.canThrottle ?? asset.throttle,
    canFuelRate: report.canFuelRate ?? report.fuelRate ?? asset.canFuelRate ?? asset.fuelRate,
    canFuelUsed: report.canFuelUsed ?? report.fuelUsed ?? asset.canFuelUsed ?? asset.fuelUsed,
    canOilPressure:
      report.canOilPressure ?? report.oilPressure ?? asset.canOilPressure ?? asset.oilPressure,
    canAdBlueLevel:
      report.canAdBlueLevel ?? report.adBlueLevel ?? asset.canAdBlueLevel ?? asset.adBlueLevel,
    canDtcCount: report.canDtcCount ?? report.dtcCount ?? asset.canDtcCount ?? asset.dtcCount,
    odometer,
    odometro,
    horometro: report.horometro ?? report.horometroTotal ?? asset.horometro,
    horometroTotal:
      report.horometroTotal ?? report.engineHours ?? report.horometro ?? asset.horometroTotal,
    engineHours,
    horometroDiario: report.horometroDiario ?? report.engineHoursDaily ?? asset.horometroDiario,
    engineHoursDaily,
    combustible:
      report.combustible ?? report.fuelPercent ?? report.combustibleNivel ?? asset.combustible,
    fuelPercent,
    combustibleNivel: report.combustibleNivel ?? report.fuelPercent ?? asset.combustibleNivel,
    gpsSignal: report.gpsSignal ?? report.gpsSignalLabel ?? asset.gpsSignal,
    gpsSignalLabel: report.gpsSignalLabel ?? report.gpsSignal ?? asset.gpsSignalLabel,
    gpsSatellites,
    satellites: report.satellites ?? report.gpsSatellites ?? report.satelites ?? asset.satellites,
    gpsFix: report.gpsFix ?? report.fix ?? asset.gpsFix ?? asset.fix,
    trackerModelLabel: report.trackerModelLabel ?? asset.trackerModelLabel,
    imei: report.imei ?? report.deviceId ?? report.device_id ?? asset.imei,
    protocol: report.protocol ?? asset.protocol,
    fechaIngreso: report.fechaIngreso ?? asset.fechaIngreso,
  }
}

const getReportTimeLabel = ({ report = {}, timestamp }) => {
  if (report.timeLabel || report.datosUlt) {
    return report.timeLabel || report.datosUlt
  }

  const formattedTimestamp = formatTimestamp(timestamp)

  return formattedTimestamp.includes(" ") ? formattedTimestamp.split(" ")[1] : formattedTimestamp
}

const getReportDateLabel = (timestamp) => {
  return formatTimestamp(timestamp).split(" ")[0] || "-"
}

const normalizeReportStatusKey = (value) => {
  const normalizedValue = normalizeReportText(value)

  if (normalizedValue.includes("mov") || normalizedValue === "moving") return "moving"
  if (normalizedValue.includes("idle") || normalizedValue.includes("ruta")) return "idle"
  if (normalizedValue.includes("det") || normalizedValue.includes("stop")) return "stopped"
  if (normalizedValue.includes("offline") || normalizedValue.includes("senal")) return "offline"

  return value || "offline"
}

const getColumnValue = ({ asset, report, rule = null, columnKey, companyName, timestamp }) => {
  const telemetrySource = buildTelemetrySource({ asset, report, timestamp })
  const state = getValueFromReportOrAsset({
    report,
    asset,
    reportKeys: ["estado", "status"],
    assetKeys: ["estado", "status"],
  })

  const speed = getValueFromReportOrAsset({
    report,
    asset,
    reportKeys: ["speedLabel", "velocidad", "speed", "velocidad_kmh"],
    assetKeys: ["velocidad", "speed", "velocidad_kmh"],
  })
  const speedNumber = parseReportNumber(speed, null)
  const explicitSpeedLimit = getEffectiveSpeedLimitValue({ asset, report, rule })
  const speedLimitNumber = parseReportNumber(explicitSpeedLimit, 80)
  const explicitSpeedingDelta = getValueFromReportOrAsset({
    report,
    asset,
    reportKeys: ["speedingDelta", "speedOverLimit", "excesoVelocidad"],
    assetKeys: ["speedingDelta", "speedOverLimit", "excesoVelocidad"],
  })
  const speedingDeltaNumber = parseReportNumber(
    explicitSpeedingDelta,
    speedNumber !== null && speedLimitNumber !== null ? speedNumber - speedLimitNumber : null,
  )
  const speedingValue = getValueFromReportOrAsset({
    report,
    asset,
    reportKeys: ["speeding", "isSpeeding", "enExcesoVelocidad"],
    assetKeys: ["speeding", "isSpeeding", "enExcesoVelocidad"],
  })

  const values = {
    fecha: formatTimestamp(timestamp).split(" ")[0] || "-",
    timestamp: getReportTimeLabel({ report, timestamp }),
    patente: asset.patente || asset.patent || "-",
    vehiculo: getAssetLabel(asset),
    assetDisplayName: getAssetLabel(asset),
    assetPatente: asset.patente || asset.patent || "-",
    assetDeviceId:
      report?.deviceId ||
      report?.device_id ||
      report?.imei ||
      asset.deviceId ||
      asset.device_id ||
      asset.imei ||
      "-",
    empresa: companyName || "-",
    conductor: asset.conductor || report?.conductor || report?.driver || "-",
    estado: getAssetStateLabel(state),
    status: getAssetStateLabel(state),
    ignition: getFleetTelemetryCellValue(telemetrySource, { key: "ignition" }),
    ignicion: getFleetTelemetryCellValue(telemetrySource, { key: "ignition" }),
    contacto: getFleetTelemetryCellValue(telemetrySource, { key: "ignition" }),
    ultimoDato:
      report?.timeLabel ||
      report?.datosUlt ||
      report?.lastReport ||
      report?.reportedAt ||
      formatTimestamp(timestamp),
    velocidad:
      getFleetTelemetryCellValue(telemetrySource, { key: "velocidad" }) || formatSpeed(speed),
    speed: getFleetTelemetryCellValue(telemetrySource, { key: "velocidad" }) || formatSpeed(speed),
    dateLabel: formatTimestamp(timestamp).split(" ")[0] || "-",
    deviceId:
      report?.deviceId ||
      report?.device_id ||
      report?.imei ||
      asset.deviceId ||
      asset.device_id ||
      asset.imei ||
      "-",
    odometro: getFleetTelemetryCellValue(telemetrySource, { key: "odometro" }),
    horometro: getFleetTelemetryCellValue(telemetrySource, { key: "horometroTotal" }),
    geocerca: report?.geocerca || asset.geocerca || "-",
    evento: report?.event || report?.evento || asset.evento || asset.choque || "-",
    event: report?.event || report?.evento || asset.evento || asset.choque || "-",
    duracion: report?.duracion || asset.duracion || "-",
    speedLimit: speedLimitNumber !== null ? formatSpeed(speedLimitNumber) : "-",
    speedingDelta: speedingDeltaNumber !== null ? formatSignedSpeed(speedingDeltaNumber) : "-",
    speeding:
      speedingValue === true || String(speedingValue).toLowerCase() === "true"
        ? "Si"
        : speedingDeltaNumber > 0
          ? "Si"
          : "No",
    combustible: getFleetTelemetryCellValue(telemetrySource, { key: "combustible" }),
    alerta: report?.alerta || report?.choque || asset.alerta || asset.choque || "-",
    address:
      telemetrySource.address ||
      telemetrySource.direccion ||
      telemetrySource.lastPosition ||
      "Sin direccion",
    accumulatedDistanceKm: "0,0 km",
  }

  if (columnKey === "datosUlt") return values.ultimoDato

  if (columnKey === "horometroTotal") {
    return getFleetTelemetryCellValue(telemetrySource, { key: "horometroTotal" })
  }

  const fleetColumn = fleetColumnsByKey.get(columnKey)

  if (fleetColumn && !Object.hasOwn(values, columnKey)) {
    return getFleetTelemetryCellValue(telemetrySource, fleetColumn)
  }

  return values[columnKey] ?? "-"
}

const buildItineraryRowFromReport = ({ rowId, asset, report, generatedEvent, timestamp }) => {
  const telemetrySource = buildTelemetrySource({ asset, report, timestamp })
  const rowTimestamp = timestamp?.toISOString?.() || "snapshot"
  const speedValue = parseReportNumber(
    telemetrySource.speed ?? telemetrySource.velocidad_kmh ?? telemetrySource.velocidad,
    0,
  )
  const speedLabel =
    getFleetTelemetryCellValue(telemetrySource, { key: "velocidad" }) || formatSpeed(speedValue)
  const lat = getCoordinateValue(telemetrySource.lat)
  const lng = getCoordinateValue(telemetrySource.lng)
  const eventLabel =
    generatedEvent?.ruleLabel || telemetrySource.event || telemetrySource.evento || "Reporte GPS"

  return {
    ...telemetrySource,
    id: rowId,
    assetId: getAssetHistoryId(asset),
    timestamp: rowTimestamp,
    date: rowTimestamp,
    fecha: rowTimestamp,
    dateLabel: getReportDateLabel(timestamp),
    timeLabel: getReportTimeLabel({ report: telemetrySource, timestamp }),
    status: normalizeReportStatusKey(telemetrySource.status || telemetrySource.estado),
    speed: speedValue,
    speedLabel,
    address: telemetrySource.address || telemetrySource.direccion || "Sin direccion",
    event: eventLabel,
    evento: eventLabel,
    lat,
    lng,
    accumulatedDistanceKm: 0,
    accumulatedDistanceLabel: "0,0 km",
    assetDisplayName: getAssetLabel(asset),
    assetPatente: asset.patente || asset.patent || telemetrySource.patente || "-",
    assetDeviceId:
      telemetrySource.deviceId || telemetrySource.device_id || telemetrySource.imei || "-",
  }
}

export const buildReportRow = ({
  asset,
  report = null,
  generatedEvent = null,
  rule = null,
  index = 0,
  reportColumns,
  companyNameById,
  dateTo,
}) => {
  const sourceReport = generatedEvent?.report || report
  const timestamp = getSourceTimestamp({
    source: generatedEvent || sourceReport,
    fallbackSource: asset,
    referenceDate: dateTo || getCurrentDateOnly(),
  })

  const companyName = companyNameById.get(normalizeReportId(asset.companyId))
  const rowTimestamp = timestamp?.toISOString?.() || "snapshot"

  const rowId = [
    getAssetHistoryId(asset),
    generatedEvent?.id || sourceReport?.id || rowTimestamp,
    index,
  ]
    .map((value) => String(value ?? ""))
    .join("-")

  const values = Object.fromEntries(
    reportColumns.map((column) => [
      column.key,
      getColumnValue({
        asset,
        report: sourceReport,
        rule,
        columnKey: column.key,
        companyName,
        timestamp,
      }),
    ]),
  )
  const itineraryRow = buildItineraryRowFromReport({
    rowId,
    asset,
    report: sourceReport,
    generatedEvent,
    timestamp,
  })

  return {
    ...itineraryRow,
    id: rowId,
    asset: {
      ...asset,
      estado: sourceReport?.estado || sourceReport?.status || asset.estado,
    },
    report: sourceReport,
    generatedEvent,
    timestamp: rowTimestamp,
    values,
    itineraryRow,
  }
}

const buildGeneratedEventFromRule = ({
  asset,
  report,
  rule,
  index,
  referenceDate,
  durationLabel = "",
}) => {
  const timestamp = getSourceTimestamp({
    source: report,
    fallbackSource: asset,
    referenceDate: referenceDate || getCurrentDateOnly(),
  })
  const resolvedDuration = getExistingDurationLabel(report) || durationLabel
  const effectiveSpeedLimit = getEffectiveSpeedLimitValue({ asset, report, rule })
  const speed = parseReportNumber(
    getValueFromReportOrAsset({
      report,
      asset,
      reportKeys: ["speed", "velocidad", "velocidad_kmh", "speedLabel"],
      assetKeys: ["speed", "velocidad", "velocidad_kmh"],
    }),
    null,
  )
  const speedLimit = parseReportNumber(effectiveSpeedLimit, null)
  const calculatedSpeedingDelta = speed !== null && speedLimit !== null ? speed - speedLimit : null
  const enrichedReport = {
    ...report,
    event: rule.label,
    evento: rule.label,
    ...(effectiveSpeedLimit !== undefined &&
    effectiveSpeedLimit !== null &&
    effectiveSpeedLimit !== ""
      ? {
          speedLimit: effectiveSpeedLimit,
          limiteVelocidad: effectiveSpeedLimit,
          velocidadLimite: effectiveSpeedLimit,
        }
      : {}),
    ...(calculatedSpeedingDelta !== null
      ? {
          speedingDelta: calculatedSpeedingDelta,
          speedOverLimit: calculatedSpeedingDelta,
          excesoVelocidad: calculatedSpeedingDelta,
          speeding: calculatedSpeedingDelta > 0,
          isSpeeding: calculatedSpeedingDelta > 0,
          enExcesoVelocidad: calculatedSpeedingDelta > 0,
        }
      : {}),
    ...(resolvedDuration ? { duracion: resolvedDuration, duration: resolvedDuration } : {}),
    alerta: report?.alerta || report?.alert || rule.label,
  }

  return {
    id: [
      getAssetHistoryId(asset),
      rule.id,
      report?.id || report?.timestamp || report?.reportedAt || timestamp.toISOString(),
      index,
    ]
      .map((value) => String(value ?? ""))
      .join("-"),
    ruleId: rule.id,
    ruleLabel: rule.label,
    timestamp: timestamp.toISOString(),
    sourceReportKey: getReportEventSourceKey(report),
    report: enrichedReport,
  }
}

export const buildRuleReportRow = ({
  asset,
  report,
  reportIndex,
  rule,
  ruleIndex,
  referenceDate,
  durationLabel,
  reportColumns,
  companyNameById,
  dateTo,
}) => {
  return buildReportRow({
    asset,
    generatedEvent: buildGeneratedEventFromRule({
      asset,
      report,
      rule,
      index: `${reportIndex}-${ruleIndex}`,
      referenceDate,
      durationLabel,
    }),
    rule,
    index: reportIndex,
    reportColumns,
    companyNameById,
    dateTo,
  })
}
