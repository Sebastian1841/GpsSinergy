const formatTimeLabel = (date) => {
  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export const getTelemetryTimestamp = (update = {}, fallback = new Date().toISOString()) => {
  return (
    update.timestamp ||
    update.lastReport ||
    update.lastReportAt ||
    update.reportedAt ||
    update.updatedAt ||
    update.updated_at ||
    fallback
  )
}

export const formatTelemetryTime = (timestamp, { fallback = "-", fallbackToNow = false } = {}) => {
  if (!timestamp) {
    return fallbackToNow ? formatTimeLabel(new Date()) : fallback
  }

  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return fallbackToNow ? formatTimeLabel(new Date()) : fallback
  }

  return formatTimeLabel(date)
}

export const normalizeTelemetryReports = (reports = []) => {
  if (!Array.isArray(reports)) return []

  return reports.filter((report) => {
    const lat = Number(report?.lat)
    const lng = Number(report?.lng)

    return report?.timestamp && Number.isFinite(lat) && Number.isFinite(lng)
  })
}
