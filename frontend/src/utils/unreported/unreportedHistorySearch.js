import { completedInterruptions } from "./unreportedHistory.js"

const indexedConsultations = (row) => {
  let linked, legacy
  return (episode) => {
    if (!linked) {
      linked = new Map()
      legacy = []
      for (const call of row.consultations || []) {
        const id = call.interruptionId
        if (id) {
          if (!linked.has(id)) linked.set(id, [])
          linked.get(id).push(call)
        } else {
          const timestamp = Date.parse(call.createdAt)
          if (Number.isFinite(timestamp)) legacy.push({ call, timestamp })
        }
      }
      legacy.sort((a, b) => a.timestamp - b.timestamp)
    }
    const calls = linked.get(episode.id) || []
    if (!legacy.length) return calls
    const start = Date.parse(episode.lastReportAt),
      end = Date.parse(episode.recoveredAt)
    if (!Number.isFinite(start) || !Number.isFinite(end)) return calls
    let low = 0,
      high = legacy.length
    while (low < high) {
      const middle = (low + high) >>> 1
      if (legacy[middle].timestamp < start) low = middle + 1
      else high = middle
    }
    const result = [...calls]
    for (let index = low; index < legacy.length && legacy[index].timestamp <= end; index++)
      result.push(legacy[index].call)
    return result
  }
}

const matchesEpisodeFilters = (episode, filters, getCalls) => {
  const minimum = { "1d": 1, "3d": 3, "7d": 7, "15d": 15 }[filters.duration]
  const duration =
    typeof episode.durationMs === "number"
      ? episode.durationMs
      : episode.lastReportAt && episode.recoveredAt
        ? Date.parse(episode.recoveredAt) - Date.parse(episode.lastReportAt)
        : NaN
  if (minimum && !(Number.isFinite(duration) && duration > minimum * 86400000)) return false
  if (
    (!filters.situation || filters.situation === "all") &&
    (!filters.review || filters.review === "all")
  )
    return true
  const calls = getCalls(episode)
  if (filters.situation === "none" && calls.length) return false
  if (
    filters.situation &&
    !["all", "none"].includes(filters.situation) &&
    !calls.some((call) => call.situation === filters.situation)
  )
    return false
  const reviewed = calls.some((call) => call.decision === "field_review")
  if (filters.review === "yes" && !reviewed) return false
  if (filters.review === "no" && (!calls.length || reviewed)) return false
  return true
}

const calendar = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})
const day = (value) => {
  const date = new Date(value)
  if (!value || !Number.isFinite(date.getTime())) return ""
  const parts = Object.fromEntries(
    calendar.formatToParts(date).map((part) => [part.type, part.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}
const matchesEpisodeDate = (episode, from, to) => {
  const startedAt = episode.kind === "first_report" ? episode.recoveredAt : episode.lastReportAt
  if (!Number.isFinite(Date.parse(startedAt))) return false
  if (!from && !to) return true
  const date = day(startedAt)
  return (!from || date >= from) && (!to || date <= to)
}

export const filterHistoryEquipment = (rows, search = "", company = "all") => {
  const query = String(search).trim().toLocaleLowerCase("es")
  return rows.filter(
    (row) =>
      (company === "all" || row.company === company) &&
      (!query ||
        [row.name, row.imei, row.company].some((value) =>
          String(value ?? "")
            .toLocaleLowerCase("es")
            .includes(query),
        )),
  )
}

export const countHistoryEquipment = (rows, from = "", to = "", filters = {}) => {
  if (from && to && from > to) return 0
  return rows.reduce((count, row) => {
    const getCalls = indexedConsultations(row)
    return (
      count +
      Number(
        (row.interruptions || []).some(
          (episode) =>
            episode.recoveredAt &&
            matchesEpisodeDate(episode, from, to) &&
            matchesEpisodeFilters(episode, filters, getCalls),
        ),
      )
    )
  }, 0)
}

const selectedConsultations = (row, episodes) => {
  const ids = new Set(episodes.map((episode) => episode.id))
  const windows = episodes.map((episode) => [
    Date.parse(episode.lastReportAt),
    Date.parse(episode.recoveredAt),
  ])
  return (row.consultations || []).filter((call) => {
    const id = call.interruptionId
    if (id) return ids.has(id)
    const timestamp = Date.parse(call.createdAt)
    return (
      Number.isFinite(timestamp) &&
      windows.some(([start, end]) => timestamp >= start && timestamp <= end)
    )
  })
}

export const groupHistoryEquipment = (rows, from = "", to = "", filters = {}) => {
  if (from && to && from > to) return []
  return rows.flatMap((row) => {
    const getCalls = indexedConsultations(row)
    const all = completedInterruptions(row)
    const episodes = all
      .filter(
        (episode) =>
          matchesEpisodeDate(episode, from, to) &&
          matchesEpisodeFilters(episode, filters, getCalls),
      )
      .sort(
        (a, b) =>
          Date.parse(b.lastReportAt || b.recoveredAt) - Date.parse(a.lastReportAt || a.recoveredAt),
      )
    return episodes.length
      ? [
          {
            ...row,
            interruptions: episodes,
            consultations: selectedConsultations(row, episodes),
            completedCount: episodes.length,
            totalCompletedCount: all.length,
            latestDisconnectionAt: episodes[0].lastReportAt || episodes[0].recoveredAt,
            lastRecoveryAt: episodes.reduce(
              (latest, item) =>
                !latest || Date.parse(item.recoveredAt) > Date.parse(latest)
                  ? item.recoveredAt
                  : latest,
              null,
            ),
          },
        ]
      : []
  })
}
