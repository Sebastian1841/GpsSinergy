const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

export const alarmDay = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "unknown" : dayFormatter.format(date)
}

export const isHistoricalAlarm = (alarm) => alarm.metadata?.historical === true

export const alarmAttentionState = (alarm) => {
  if (alarm.groupMembers?.length) {
    const states = new Set(alarm.groupMembers.map(alarmAttentionState))
    return states.size === 1 ? [...states][0] : "mixed"
  }
  if (alarm.status === "resolved") return "attended"
  return alarm.metadata?.attention?.startedAt ? "in-progress" : "unattended"
}

export const alarmAttentionLabel = (alarm) => {
  const labels = { unattended: "Sin iniciar", "in-progress": "En curso", attended: "Atendida" }
  if (alarmAttentionState(alarm) !== "mixed") return labels[alarmAttentionState(alarm)]
  const counts = { unattended: 0, "in-progress": 0, attended: 0 }
  for (const member of alarm.groupMembers) counts[alarmAttentionState(member)]++
  return [
    counts.unattended ? `${counts.unattended} sin iniciar` : "",
    counts["in-progress"] ? `${counts["in-progress"]} en curso` : "",
    counts.attended ? `${counts.attended} ${counts.attended === 1 ? "atendida" : "atendidas"}` : "",
  ]
    .filter(Boolean)
    .join(" · ")
}

export const matchesInboxTab = (alarm, tab) => {
  if (tab === "historical") return isHistoricalAlarm(alarm)
  if (isHistoricalAlarm(alarm)) return false
  if (tab === "pending") return alarm.status !== "resolved"
  if (tab === "unattended") return alarmAttentionState(alarm) === "unattended"
  if (tab === "in-progress") return alarmAttentionState(alarm) === "in-progress"
  if (tab === "attended") return alarm.status === "resolved"
  return true
}

export const groupInboxAlarms = (rows = []) => {
  const groups = new Map()
  for (const alarm of rows) {
    // Rules without an id cannot safely be merged just because their titles match.
    const key = JSON.stringify([
      alarm.companyId,
      alarm.assetId,
      alarm.ruleId || alarm.id,
      alarmDay(alarm.createdAt),
    ])
    let group = groups.get(key)
    if (!group) {
      group = { ...alarm, groupKey: key, groupMembers: [] }
      groups.set(key, group)
    }
    group.groupMembers.push(alarm)
  }
  return [...groups.values()].map((group) => ({
    ...group,
    status: group.groupMembers.every((alarm) => alarm.status === "resolved") ? "resolved" : "open",
  }))
}

export const buildInboxSummary = (rows = [], now = Date.now()) => {
  const current = rows.filter((alarm) => !isHistoricalAlarm(alarm))
  const pending = current.filter((alarm) => alarm.status !== "resolved")
  const dates = pending.map((alarm) => Date.parse(alarm.createdAt)).filter(Number.isFinite)
  return {
    unattended: pending.filter((alarm) => alarmAttentionState(alarm) === "unattended").length,
    inProgress: pending.filter((alarm) => alarmAttentionState(alarm) === "in-progress").length,
    today: current.filter((alarm) => alarmDay(alarm.createdAt) === alarmDay(now)).length,
    oldestMinutes: dates.length
      ? Math.max(0, Math.floor((now - Math.min(...dates)) / 60000))
      : null,
    overdue: pending.filter((alarm) => {
      const due = Date.parse(alarm.metadata?.dueAt)
      return Number.isFinite(due) && due < now
    }).length,
  }
}
