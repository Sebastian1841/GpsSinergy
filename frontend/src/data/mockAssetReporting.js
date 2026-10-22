const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "America/Santiago",
})
const displayDate = (value) => {
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  )
  return `${parts.day}-${parts.month}-${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`
}
const legacyDate = (value) => {
  const match = String(value || "").match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (!match) return null
  const calendarDate = new Date(Date.UTC(+match[3], +match[2] - 1, +match[1], 12))
  if (calendarDate.getUTCMonth() !== +match[2] - 1 || calendarDate.getUTCDate() !== +match[1])
    return null
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    timeZoneName: "longOffset",
  })
    .formatToParts(calendarDate)
    .find((part) => part.type === "timeZoneName")
    .value.replace("GMT", "")
  const date = new Date(`${match[3]}-${match[2]}-${match[1]}T00:00:00${offset}`)
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

export const withMockAssetReporting = (asset, referenceAt = new Date()) => {
  if (asset.source !== "mock-database") return asset
  const reportFields = ["timestamp", "lastTelemetryAt", "lastReport", "lastReportAt", "reportedAt"]
  // Existing reports, including an explicitly empty one, belong to the user/stream.
  if (reportFields.some((field) => Object.hasOwn(asset, field)) || asset.telemetry) return asset
  if (
    /^\d{2}-\d{2}-\d{4}[,\s]+\d{2}:\d{2}/.test(String(asset.datosUlt || "")) ||
    /^\d{4}-\d{2}-\d{2}T/.test(String(asset.datosUlt || ""))
  )
    return asset
  const seed = [...String(asset.id || asset.imei || "")].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  )
  const offline = asset.estado === "offline"
  const days = [2, 4, 8, 15, 30][seed % 5]
  const age = offline ? days * 86400000 + (seed % 12) * 3600000 : (1 + (seed % 5)) * 60000
  const reportedAt =
    legacyDate(asset.datosUlt) || new Date(new Date(referenceAt).getTime() - age).toISOString()
  const scenarios = [
    { externalVoltage: 0, internalVoltage: 3.68 },
    { externalVoltage: 12.8, internalVoltage: 3.91 },
    {
      externalVoltage: 24.4,
      internalVoltage: 4.02,
    },
    {},
  ]
  const diagnostic = offline ? scenarios[seed % scenarios.length] : {}
  return {
    ...Object.fromEntries(Object.entries(diagnostic).filter(([key]) => !Object.hasOwn(asset, key))),
    ...asset,
    reportedAt,
    lastReportAt: reportedAt,
    datosUlt: displayDate(reportedAt),
    mockReportSeedVersion: 1,
  }
}
