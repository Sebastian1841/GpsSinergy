import { getSourceDateOnly, getSourceTimestamp, isDateInsideRange } from "./assetReportDateUtils.js"

export const getAssetStateLabel = (state) => {
  const labels = {
    moving: "En movimiento",
    idle: "Ruta",
    stopped: "Detenido",
    offline: "Sin senal",
  }

  return labels[state] || state || "-"
}

export const getValueFromReportOrAsset = ({ report, asset, reportKeys = [], assetKeys = [] }) => {
  for (const key of reportKeys) {
    const value = report?.[key]

    if (value !== undefined && value !== null && value !== "") return value
  }

  for (const key of assetKeys) {
    const value = asset?.[key]

    if (value !== undefined && value !== null && value !== "") return value
  }

  return null
}

export const formatSpeed = (value) => {
  if (value === null || value === undefined || value === "") return "0 km/h"

  const text = String(value)

  if (text.toLowerCase().includes("km/h")) return text

  return `${text} km/h`
}

export const formatSignedSpeed = (value) => {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) return "-"

  const formattedValue = Number(numericValue.toFixed(1)).toLocaleString("es-CL")

  return `${numericValue > 0 ? "+" : ""}${formattedValue} km/h`
}

export const parseReportNumber = (value, fallback = null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback

  const match = String(value ?? "").match(/-?\d[\d.,]*/)

  if (!match) return fallback

  const rawNumber = match[0]
  const hasComma = rawNumber.includes(",")
  const hasDot = rawNumber.includes(".")
  const normalizedNumber =
    hasComma && hasDot
      ? rawNumber.replace(/\./g, "").replace(",", ".")
      : hasComma
        ? rawNumber.replace(",", ".")
        : hasDot && (rawNumber.split(".").length > 2 || rawNumber.split(".").at(-1)?.length === 3)
          ? rawNumber.replace(/\./g, "")
          : rawNumber
  const parsedValue = Number(normalizedNumber)

  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

const getRuleSpeedThreshold = (rule = {}, { includeDefault = true } = {}) => {
  const speedCondition = (rule?.conditions || []).find((condition) => {
    return (
      String(condition?.field || "") === "speed" &&
      ["greaterThan", "greaterThanOrEqual"].includes(String(condition?.operator || ""))
    )
  })

  const threshold = parseReportNumber(speedCondition?.value, null)

  if (threshold === null) return null
  if (!includeDefault && threshold === 80) return null

  return threshold
}

export const getEffectiveSpeedLimitValue = ({ asset = {}, report = {}, rule = null }) => {
  const values = [
    asset.speedLimit,
    asset.limiteVelocidad,
    asset.velocidadLimite,
    getRuleSpeedThreshold(rule, { includeDefault: false }),
    report.speedLimit,
    report.limiteVelocidad,
    report.velocidadLimite,
    getRuleSpeedThreshold(rule),
  ]

  return values.find((value) => {
    return value !== undefined && value !== null && value !== ""
  })
}

export const formatDistanceLabel = (distanceKm) => {
  const safeDistance = Number.isFinite(Number(distanceKm)) ? Number(distanceKm) : 0

  return `${Number(safeDistance.toFixed(1)).toLocaleString("es-CL")} km`
}

export const formatDurationLabel = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.round(Number(milliseconds || 0) / 1000))

  if (!totalSeconds) return "-"

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours} h ${minutes} min`
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes} min ${seconds} seg` : `${minutes} min`
  }

  return `${seconds} seg`
}

const formatDurationMagnitudeLabel = (value, unit = "seconds") => {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || numericValue <= 0) return ""

  if (unit === "milliseconds") return formatDurationLabel(numericValue)
  if (unit === "minutes") return formatDurationLabel(numericValue * 60 * 1000)

  return formatDurationLabel(numericValue * 1000)
}

export const getExistingDurationLabel = (source = {}) => {
  const textDuration =
    source.duracion ||
    source.durationLabel ||
    source.tiempoDuracion ||
    source.tiempo ||
    source.idleDurationLabel ||
    source.ralentiDurationLabel ||
    ""

  if (typeof textDuration === "string" && textDuration.trim()) {
    return textDuration.trim()
  }

  const secondsDuration =
    source.durationSeconds ||
    source.duracionSeconds ||
    source.duracionSegundos ||
    source.idleDurationSeconds ||
    source.ralentiDurationSeconds

  const secondsLabel = formatDurationMagnitudeLabel(secondsDuration, "seconds")

  if (secondsLabel) return secondsLabel

  const minutesDuration =
    source.durationMinutes ||
    source.duracionMinutes ||
    source.duracionMinutos ||
    source.idleDurationMinutes ||
    source.ralentiDurationMinutes

  const minutesLabel = formatDurationMagnitudeLabel(minutesDuration, "minutes")

  if (minutesLabel) return minutesLabel

  const millisecondsDuration =
    source.durationMs ||
    source.duracionMs ||
    source.durationMilliseconds ||
    source.duracionMilliseconds ||
    source.idleDurationMs ||
    source.ralentiDurationMs

  const millisecondsLabel = formatDurationMagnitudeLabel(millisecondsDuration, "milliseconds")

  if (millisecondsLabel) return millisecondsLabel

  if (typeof source.duration === "number") {
    const durationAsMilliseconds =
      source.duration > 86400 ? source.duration : source.duration * 1000

    return formatDurationMagnitudeLabel(durationAsMilliseconds, "milliseconds")
  }

  if (typeof source.duration === "string" && source.duration.trim()) {
    return source.duration.trim()
  }

  return ""
}

export const buildReportTimeline = ({ sourceReports = [], asset = {}, referenceDate }) => {
  return sourceReports
    .map((report, reportIndex) => {
      const timestamp = getSourceTimestamp({
        source: report,
        fallbackSource: asset,
        referenceDate,
      })

      return {
        report,
        reportIndex,
        timestamp,
        dateOnly: getSourceDateOnly({
          source: report,
          fallbackSource: asset,
          referenceDate,
        }),
      }
    })
    .sort((firstItem, secondItem) => {
      return firstItem.timestamp.getTime() - secondItem.timestamp.getTime()
    })
}

export const getReportDurationLabel = ({ report = {}, reportIndex, reportTimeline = [] }) => {
  const existingDuration = getExistingDurationLabel(report)

  if (existingDuration && existingDuration !== "-") return existingDuration

  const timelineIndex = reportTimeline.findIndex((item) => item.reportIndex === reportIndex)
  const currentItem = reportTimeline[timelineIndex]

  if (!currentItem) return "-"

  const nextItem = reportTimeline.slice(timelineIndex + 1).find((item) => {
    return item.timestamp.getTime() > currentItem.timestamp.getTime()
  })

  if (!nextItem) return "-"

  return formatDurationLabel(nextItem.timestamp.getTime() - currentItem.timestamp.getTime())
}

export const getTimelineDurationLabel = ({ startItem, endItem }) => {
  if (!startItem || !endItem) return "-"

  return formatDurationLabel(endItem.timestamp.getTime() - startItem.timestamp.getTime())
}

export const isTimelineItemInsideRange = ({ item, dateFrom, dateTo }) => {
  return isDateInsideRange({
    date: item.timestamp,
    dateOnly: item.dateOnly,
    fromDate: dateFrom,
    toDate: dateTo,
  })
}

export const getCoordinateValue = (value) => {
  const coordinate = parseReportNumber(value)

  return Number.isFinite(coordinate) ? coordinate : null
}

export const haversineDistanceKm = (pointA, pointB) => {
  if (!pointA || !pointB) return 0

  const latA = getCoordinateValue(pointA.lat)
  const lngA = getCoordinateValue(pointA.lng)
  const latB = getCoordinateValue(pointB.lat)
  const lngB = getCoordinateValue(pointB.lng)

  if (latA === null || lngA === null || latB === null || lngB === null) return 0

  const earthRadiusKm = 6371
  const toRadians = (value) => (value * Math.PI) / 180
  const deltaLat = toRadians(latB - latA)
  const deltaLng = toRadians(lngB - lngA)
  const firstLat = toRadians(latA)
  const secondLat = toRadians(latB)
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLng / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}
