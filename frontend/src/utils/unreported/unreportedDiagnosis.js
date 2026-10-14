export const parseUnreportedPower = (text) => {
  const value = String(text || "")
  const read = (expression) => {
    const match = value.match(expression)
    return match ? Number(match[1].replace(",", ".")) : null
  }
  return {
    externalVoltage: read(/Alim\.\s*([+-]?\d+(?:[.,]\d+)?)\s*V/i),
    internalVoltage: read(/Bat\.\s*([+-]?\d+(?:[.,]\d+)?)\s*V/i),
  }
}
const voltage = (value) =>
  `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(value)} V`
const validVoltage = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0
const simStates = new Map([
  ["absent", { reason: "SIM ausente", value: "no detectada" }],
  ["error", { reason: "Error de SIM", value: "error reportado" }],
  ["pin_required", { reason: "SIM bloqueada (PIN)", value: "PIN requerido" }],
])
export const describeUnreportedDiagnosis = ({
  mode,
  lastReportAt,
  sensorReportedAt,
  externalVoltage,
  internalVoltage,
  previousExternalVoltage,
  operationReason,
  simStatus,
  mobileRegistered,
  mobileRegistration,
  mobileSignalDbm,
  gpsFixValid,
  gpsFix,
  satellites,
}) => {
  const power = []
  if (validVoltage(externalVoltage))
    power.push(
      `Externa: ${validVoltage(previousExternalVoltage) ? voltage(previousExternalVoltage) + " -> " : ""}${voltage(externalVoltage)}`,
    )
  if (validVoltage(internalVoltage)) power.push(`Interna: ${voltage(internalVoltage)}`)
  const reportTime = Date.parse(lastReportAt),
    readingTime = Date.parse(sensorReportedAt)
  const fresh =
    Number.isFinite(reportTime) && Number.isFinite(readingTime) && reportTime === readingTime
  const invalidFix = typeof gpsFixValid === "boolean" ? !gpsFixValid : gpsFix === "Sin fix"
  const knownSatellites = Number.isInteger(satellites) && satellites >= 0
  const position = invalidFix
    ? `GPS: sin posicion valida${knownSatellites ? " · " + satellites + " sat." : ""}`
    : knownSatellites
      ? `GPS: ${satellites} sat.`
      : ""
  const sim = simStates.get(simStatus)
  const simReason = sim?.reason
  const networkUnavailable =
    typeof mobileRegistered === "boolean"
      ? !mobileRegistered
      : ["not_registered", "denied", "searching"].includes(mobileRegistration)
  const signal =
    typeof mobileSignalDbm === "number" && Number.isFinite(mobileSignalDbm)
      ? ` · ${mobileSignalDbm} dBm`
      : ""
  const network = networkUnavailable
    ? `Red movil: ${mobileRegistration === "denied" ? "registro rechazado" : mobileRegistration === "searching" ? "buscando red" : "sin registro"}${signal}`
    : mobileRegistered === true || mobileRegistration === "registered"
      ? `Red movil: registrada${signal}`
      : signal
        ? `Senal movil: ${mobileSignalDbm} dBm`
        : ""
  const connection = [
    ...(simReason ? [`SIM: ${sim.value}`] : simStatus === "ready" ? ["SIM: lista"] : []),
    ...(network ? [network] : []),
  ].join(" · ")
  const observed =
    [
      ...power,
      ...(simReason ? [simReason] : []),
      ...(network ? [network] : []),
      ...(position ? [position] : []),
    ].join(" · ") || "Sin datos de diagnostico"
  if (mode === "inactive")
    return { reason: "Fuera de operacion", evidence: operationReason || "Sin motivo" }
  if (mode === "recovered" || mode === "reporting")
    return {
      reason: mode === "recovered" ? "Reporte retomado" : "Reportando",
      evidence: fresh ? observed : `Datos anteriores: ${observed}`,
    }
  if (!lastReportAt) return { reason: "Nunca reporto", evidence: "Sin datos" }
  if (!fresh)
    return {
      reason: "Sin comunicacion",
      evidence: connection
        ? `Datos anteriores: ${connection} · Causa no determinada`
        : "Sin datos de conexion · Causa no determinada",
    }
  if (externalVoltage === 0) return { reason: "Alimentacion desconectada", evidence: observed }
  if (simReason) return { reason: simReason, evidence: connection }
  if (networkUnavailable) return { reason: "Sin registro en red movil", evidence: connection }
  // Invalid positioning does not explain why packets stopped arriving.
  return {
    reason: "Sin comunicacion",
    evidence: `${connection || "Sin datos de conexion"} · Causa no determinada`,
  }
}
