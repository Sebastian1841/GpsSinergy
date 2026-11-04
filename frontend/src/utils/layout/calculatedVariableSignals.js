export const calculatedSignalGroups = [
  { label: "GPS Y MOVIMIENTO", signals: [
    ["altitude", "Altitud", "m"], ["lag_s", "Atraso del paquete", "s"],
    ["gnss_pdop", "Dilución de posición (PDOP)", ""], ["gnss_hdop", "Dilución horizontal (HDOP)", ""],
    ["movement", "En movimiento", ""], ["gnss_status", "Estado del GPS", ""],
    ["lat_e7", "Latitud", "grados × 1e-7"], ["lon_e7", "Longitud", "grados × 1e-7"],
    ["odometer_m", "Odómetro", "m"], ["gps_valid", "Posición válida", ""],
    ["angle", "Rumbo", "grados"], ["sats", "Satélites vistos", ""], ["speed", "Velocidad", "km/h"],
  ] },
  { label: "MOTOR Y CAN", signals: [
    ["ignition", "Encendido", ""], ["engineHours", "Horas de motor", "h"],
    ["canRpm", "RPM del motor", "rpm"], ["canEngineTemp", "Temperatura de motor", "°C"],
    ["canBatteryVoltage", "Voltaje de batería", "V"], ["canEngineLoad", "Carga de motor", "%"],
    ["canThrottle", "Acelerador", "%"], ["canFuelRate", "Consumo instantáneo", "L/h"],
    ["canFuelUsed", "Combustible consumido", "L"], ["canOilPressure", "Presión de aceite", ""],
    ["canAdBlueLevel", "Nivel de AdBlue", "%"], ["canDtcCount", "Códigos de falla", ""],
  ] },
  { label: "ENTRADAS Y COMBUSTIBLE", signals: [
    ["digitalInput1", "Entrada digital 1", ""], ["digitalInput2", "Entrada digital 2", ""],
    ["fuelPercent", "Nivel de combustible", "%"],
  ] },
]

export function calculatedSignalValue(reading, key) {
  if (!reading) return undefined
  if (Object.hasOwn(reading, key)) return reading[key]
  const aliases = { sats: "gpsSatellites", lat_e7: "lat", lon_e7: "lng", odometer_m: "odometer" }
  const source = aliases[key]
  if (!source || !Object.hasOwn(reading, source) || reading[source] == null) return undefined
  const value = reading[source]
  if (key === "sats") return value
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined
  return key === "odometer_m" ? value * 1000 : Math.round(value * 1e7)
}

export function hasCalculatedFuelLevel(asset) {
  return ["fuelPercent", "fuelLevel", "canFuelLevel", "fuelLevelPercent"]
    .some(key => calculatedSignalValue(asset, key) != null)
}

export function calculatedSignalReadings(asset, reports = [], now = Date.now()) {
  const start = now - 30 * 86400000
  const source = reports.length ? reports : asset ? [{ ...asset, timestamp: asset.reportedAt || asset.lastReportAt || asset.datosUlt }] : []
  return source.filter(reading => {
    const time = Date.parse(reading.timestamp || reading.reportedAt || reading.lastReportAt || "")
    return Number.isFinite(time) && time >= start && time <= now
  }).sort((a, b) => Date.parse(a.timestamp || a.reportedAt || a.lastReportAt) - Date.parse(b.timestamp || b.reportedAt || b.lastReportAt)).slice(-500)
}
