import { normalizeReportText } from "./assetReportAssetUtils.js"

const padTimePart = (value, size = 2) => {
  return String(value).padStart(size, "0")
}

const formatDateOnly = (date) => {
  return [date.getFullYear(), padTimePart(date.getMonth() + 1), padTimePart(date.getDate())].join(
    "-",
  )
}

export const toDateInputValue = (date) => {
  return formatDateOnly(date)
}

const normalizeYearPart = (value) => {
  const year = String(value || "").trim()

  if (year.length !== 2) return year

  const yearNumber = Number(year)

  return `${yearNumber >= 70 ? "19" : "20"}${year}`
}

const normalizeMeridiemHour = (hour, meridiem) => {
  const normalizedMeridiem = normalizeReportText(meridiem).replace(/\s/g, "")
  const hourNumber = Number(hour)

  if (!normalizedMeridiem) return hourNumber
  if (normalizedMeridiem === "pm" && hourNumber < 12) return hourNumber + 12
  if (normalizedMeridiem === "am" && hourNumber === 12) return 0

  return hourNumber
}

const buildLocalDate = ({
  year,
  month,
  day,
  hour = "0",
  minute = "0",
  second = "0",
  millisecond = "0",
  meridiem = "",
}) => {
  return new Date(
    Number(normalizeYearPart(year)),
    Number(month) - 1,
    Number(day),
    normalizeMeridiemHour(hour, meridiem),
    Number(minute),
    Number(second),
    Number(millisecond),
  )
}

const isTimeOnlyValue = (value) => {
  return /^\d{1,2}:\d{2}(:\d{2})?(\.\d{1,3})?$/.test(String(value || "").trim())
}

const buildDateFromTimeOnly = ({ dateString, timeValue }) => {
  const cleanTime = String(timeValue || "").trim()
  const [hours = "00", minutes = "00", rawSeconds = "00"] = cleanTime.split(":")
  const [seconds = "00", rawMilliseconds = "000"] = String(rawSeconds).split(".")

  return new Date(
    `${dateString}T${padTimePart(hours)}:${padTimePart(minutes)}:${padTimePart(seconds)}.${padTimePart(
      rawMilliseconds,
      3,
    )}`,
  )
}

const parseLocalDateTimeValue = (rawText) => {
  const dateOnlyMatch = rawText.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch

    return buildLocalDate({ year, month, day })
  }

  const localDateTimeMatch = rawText.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(?:\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm))?)?$/i,
  )

  if (!localDateTimeMatch) return null

  const [
    ,
    day,
    month,
    year,
    hour = "0",
    minute = "0",
    second = "0",
    millisecond = "0",
    meridiem = "",
  ] = localDateTimeMatch

  return buildLocalDate({
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond,
    meridiem,
  })
}

const parseDateValue = (value, referenceDate) => {
  if (!value) return null

  if (typeof value === "number") {
    const numericDate = new Date(value < 10000000000 ? value * 1000 : value)

    return Number.isNaN(numericDate.getTime()) ? null : numericDate
  }

  const rawText = String(value).trim()
  const numericValue = Number(rawText)

  if (Number.isFinite(numericValue) && numericValue > 0) {
    const numericDate = new Date(numericValue < 10000000000 ? numericValue * 1000 : numericValue)

    return Number.isNaN(numericDate.getTime()) ? null : numericDate
  }

  if (isTimeOnlyValue(rawText)) {
    const timeOnlyDate = buildDateFromTimeOnly({
      dateString: referenceDate,
      timeValue: rawText,
    })

    return Number.isNaN(timeOnlyDate.getTime()) ? null : timeOnlyDate
  }

  const localDateTime = parseLocalDateTimeValue(rawText)

  if (localDateTime && !Number.isNaN(localDateTime.getTime())) {
    return localDateTime
  }

  const parsedDate = new Date(rawText)

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

export const getCurrentDateOnly = () => {
  const now = new Date()

  return [now.getFullYear(), padTimePart(now.getMonth() + 1), padTimePart(now.getDate())].join("-")
}

const getTimestampCandidates = (source = {}) => {
  return [
    source.timestamp,
    source.lastReport,
    source.reportedAt,
    source.lastReportAt,
    source.fechaHora,
    source.fechaUltimoReporte,
    source.updatedAt,
    source.updated_at,
    source.datosUlt,
    source.timeLabel,
  ]
}

export const getSourceTimestamp = ({ source, fallbackSource, referenceDate }) => {
  const candidates = [...getTimestampCandidates(source), ...getTimestampCandidates(fallbackSource)]

  for (const candidate of candidates) {
    const parsedDate = parseDateValue(candidate, referenceDate)

    if (parsedDate) return parsedDate
  }

  return new Date()
}

export const formatTimestamp = (date) => {
  if (!date || Number.isNaN(date.getTime())) return "-"

  const datePart = [
    date.getFullYear(),
    padTimePart(date.getMonth() + 1),
    padTimePart(date.getDate()),
  ].join("-")

  const timePart = [
    padTimePart(date.getHours()),
    padTimePart(date.getMinutes()),
    padTimePart(date.getSeconds()),
  ].join(":")

  return `${datePart} ${timePart}`
}

const getDateOnlyFromDate = (date) => {
  if (!date || Number.isNaN(date.getTime())) return ""

  return formatDateOnly(date)
}

const getDateOnlyFromValue = ({ value, referenceDate }) => {
  if (!value) return ""

  const rawText = String(value).trim()

  if (isTimeOnlyValue(rawText)) return referenceDate || ""

  const isoDateMatch = rawText.match(/^(\d{4}-\d{2}-\d{2})/)

  if (isoDateMatch) return isoDateMatch[1]

  const localDateTime = parseLocalDateTimeValue(rawText)

  if (localDateTime && !Number.isNaN(localDateTime.getTime())) {
    return getDateOnlyFromDate(localDateTime)
  }

  const parsedDate = parseDateValue(rawText, referenceDate)

  return getDateOnlyFromDate(parsedDate)
}

export const getSourceDateOnly = ({ source, fallbackSource, referenceDate }) => {
  const candidates = [...getTimestampCandidates(source), ...getTimestampCandidates(fallbackSource)]

  for (const candidate of candidates) {
    const dateOnly = getDateOnlyFromValue({ value: candidate, referenceDate })

    if (dateOnly) return dateOnly
  }

  return ""
}

export const isDateInsideRange = ({ date, dateOnly, fromDate, toDate }) => {
  const resolvedDateOnly = dateOnly || getDateOnlyFromDate(date)

  if (!resolvedDateOnly) return false

  if (fromDate && resolvedDateOnly < fromDate) return false
  if (toDate && resolvedDateOnly > toDate) return false

  return true
}
