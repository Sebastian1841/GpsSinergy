const number = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 })
const voltage = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? `${number.format(value)} V`
    : "Sin informacion"

export function describeUnreportedEvidence(telemetry = {}) {
  const data = telemetry || {}
  const timestamp = typeof data.reportedAt === "string" ? Date.parse(data.reportedAt) : NaN
  return {
    reportedAt: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null,
    fields: [
      { label: "Alimentacion externa", value: voltage(data.externalVoltage) },
      { label: "Bateria interna", value: voltage(data.internalVoltage) },
    ],
  }
}
