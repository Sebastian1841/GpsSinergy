export const getFirstReportValue = (...values) => {
  return values.find((value) => {
    return value !== undefined && value !== null && String(value).trim() !== ""
  })
}

export const sampleReportRows = (rows, limit) => {
  if (!Array.isArray(rows) || rows.length === 0) return []
  if (rows.length <= limit) return rows
  if (limit <= 1) return [rows[0]]

  const sampledRows = []
  const lastIndex = rows.length - 1
  const step = lastIndex / (limit - 1)

  for (let index = 0; index < limit; index += 1) {
    const sourceIndex = Math.min(lastIndex, Math.round(index * step))

    sampledRows.push(rows[sourceIndex])
  }

  return sampledRows
}

export const mapReportRowToChartRow = (row, index) => {
  const asset = row?.asset || {}
  const report = row?.report || row?.generatedEvent?.report || {}
  const itineraryRow = row?.itineraryRow || {}
  const values = row?.values || {}

  return {
    ...asset,
    ...report,
    ...itineraryRow,
    id: row?.id || `report-chart-row-${index}`,
    timestamp:
      itineraryRow.timestamp ||
      row?.timestamp ||
      report.timestamp ||
      report.reportedAt ||
      report.lastReport,
    dateLabel: itineraryRow.dateLabel || values.fecha || "",
    timeLabel: itineraryRow.timeLabel || values.ultimoDato || "",
    assetDisplayName:
      itineraryRow.assetDisplayName ||
      values.vehiculo ||
      asset.nombrePantalla ||
      asset.vehiculo ||
      asset.name,
    assetPatente: itineraryRow.assetPatente || values.patente || asset.patente || asset.patent,
    event: getFirstReportValue(itineraryRow.event, report.event, report.evento, values.evento),
    address: getFirstReportValue(
      itineraryRow.address,
      report.address,
      report.direccion,
      report.lastPosition,
      values.address,
      values.lastPosition,
    ),
    direccion: getFirstReportValue(
      itineraryRow.direccion,
      report.direccion,
      report.address,
      values.address,
    ),
    lastPosition: getFirstReportValue(
      itineraryRow.lastPosition,
      report.lastPosition,
      report.address,
      report.direccion,
      values.lastPosition,
      values.address,
    ),
    speed: getFirstReportValue(
      itineraryRow.speed,
      report.speed,
      report.velocidad,
      report.velocidad_kmh,
      values.velocidad,
    ),
    speedLabel: getFirstReportValue(itineraryRow.speedLabel, report.speedLabel, values.velocidad),
    speedLimit: getFirstReportValue(
      itineraryRow.speedLimit,
      report.speedLimit,
      report.limiteVelocidad,
      report.velocidadLimite,
      asset.speedLimit,
      values.speedLimit,
    ),
    speedingDelta: getFirstReportValue(
      itineraryRow.speedingDelta,
      report.speedingDelta,
      report.speedOverLimit,
      report.excesoVelocidad,
      asset.speedingDelta,
      values.speedingDelta,
    ),
    durationMinutes: getFirstReportValue(
      itineraryRow.durationMinutes,
      report.durationMinutes,
      report.duration,
      report.duracion,
      values.duracion,
    ),
    duracion: getFirstReportValue(
      itineraryRow.duracion,
      report.duracion,
      report.duration,
      values.duracion,
    ),
    ignition: getFirstReportValue(
      itineraryRow.ignition,
      report.ignition,
      report.ignicion,
      report.contacto,
      asset.ignition,
      values.ignition,
    ),
    ignicion: getFirstReportValue(
      itineraryRow.ignicion,
      report.ignicion,
      report.ignition,
      report.contacto,
      asset.ignicion,
      values.ignicion,
    ),
    contacto: getFirstReportValue(
      itineraryRow.contacto,
      report.contacto,
      report.ignition,
      report.ignicion,
      asset.contacto,
      values.contacto,
    ),
    digitalInput1: getFirstReportValue(
      itineraryRow.digitalInput1,
      report.digitalInput1,
      report.input1,
      report.di1,
      asset.digitalInput1,
      values.digitalInput1,
    ),
    digitalInput2: getFirstReportValue(
      itineraryRow.digitalInput2,
      report.digitalInput2,
      report.input2,
      report.di2,
      asset.digitalInput2,
      values.digitalInput2,
    ),
    odometer: getFirstReportValue(
      itineraryRow.odometer,
      report.odometer,
      report.odometro,
      asset.odometer,
      values.odometro,
    ),
    odometro: getFirstReportValue(
      itineraryRow.odometro,
      report.odometro,
      report.odometer,
      asset.odometro,
      values.odometro,
    ),
    engineHours: getFirstReportValue(
      itineraryRow.engineHours,
      report.engineHours,
      report.horometroTotal,
      report.horometro,
      asset.engineHours,
      values.horometro,
    ),
    horometroTotal: getFirstReportValue(
      itineraryRow.horometroTotal,
      report.horometroTotal,
      report.engineHours,
      report.horometro,
      asset.horometroTotal,
      values.horometro,
    ),
    fuelPercent: getFirstReportValue(
      itineraryRow.fuelPercent,
      report.fuelPercent,
      report.combustibleNivel,
      report.combustible,
      asset.fuelPercent,
      values.combustible,
    ),
    combustible: getFirstReportValue(
      itineraryRow.combustible,
      report.combustible,
      report.fuelPercent,
      report.combustibleNivel,
      asset.combustible,
      values.combustible,
    ),
    gpsSatellites: getFirstReportValue(
      itineraryRow.gpsSatellites,
      report.gpsSatellites,
      report.satellites,
      report.satelites,
    ),
    satellites: getFirstReportValue(
      itineraryRow.satellites,
      report.satellites,
      report.gpsSatellites,
      report.satelites,
    ),
    gpsSignal: getFirstReportValue(itineraryRow.gpsSignal, report.gpsSignal, report.gpsSignalLabel),
    canRpm: getFirstReportValue(itineraryRow.canRpm, report.canRpm, report.rpm),
    canEngineTemp: getFirstReportValue(
      itineraryRow.canEngineTemp,
      report.canEngineTemp,
      report.temperaturaMotor,
    ),
    canBatteryVoltage: getFirstReportValue(
      itineraryRow.canBatteryVoltage,
      report.canBatteryVoltage,
      report.batteryVoltage,
      report.voltajeBateria,
    ),
    canEngineLoad: getFirstReportValue(
      itineraryRow.canEngineLoad,
      report.canEngineLoad,
      report.engineLoad,
    ),
    canThrottle: getFirstReportValue(itineraryRow.canThrottle, report.canThrottle, report.throttle),
    canFuelRate: getFirstReportValue(itineraryRow.canFuelRate, report.canFuelRate, report.fuelRate),
    canFuelUsed: getFirstReportValue(itineraryRow.canFuelUsed, report.canFuelUsed, report.fuelUsed),
    canOilPressure: getFirstReportValue(
      itineraryRow.canOilPressure,
      report.canOilPressure,
      report.oilPressure,
    ),
    canAdBlueLevel: getFirstReportValue(
      itineraryRow.canAdBlueLevel,
      report.canAdBlueLevel,
      report.adBlueLevel,
    ),
  }
}

export const buildReportChartRows = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) return []

  return rows.map(mapReportRowToChartRow)
}
