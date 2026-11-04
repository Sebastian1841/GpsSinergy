export const ATTENTION_ACTIONS = [
  { id: "reviewing", label: "La estoy viendo", resolved: false },
  { id: "called-driver", label: "Llame al conductor", resolved: false },
  { id: "confirmed", label: "Era real", resolved: true },
  { id: "false-alarm", label: "Falsa alarma", resolved: true },
]

export const getAttentionTargets = ({ groups, selectedAlarmId, mode, selectedGroupKeys = [] }) => {
  const current = groups.find((group) => group.id === selectedAlarmId)
  if (!current) return []
  if (mode === "bulk" && !selectedGroupKeys.includes(current.groupKey)) return []
  const selected =
    mode === "bulk"
      ? groups.filter((group) => selectedGroupKeys.includes(group.groupKey))
      : [current]
  return selected
    .flatMap((group) => group.groupMembers)
    .filter((alarm) => alarm.status !== "resolved")
}

export const attentionTargetSignature = (targets) =>
  JSON.stringify(targets.map((alarm) => alarm.id).sort())

export const buildAttentionUpdate = (alarm, { action, note = "", actor, at }) => {
  const choice = ATTENTION_ACTIONS.find((item) => item.id === action)
  if (!choice || !actor || !at || alarm.status === "resolved") return null
  const previous = alarm.metadata?.attention || {}
  const entry = {
    action,
    label: choice.label,
    actor,
    at,
    note: String(note).trim().slice(0, 2000),
    status: choice.resolved ? "resolved" : "open",
  }
  const history = Array.isArray(alarm.metadata?.attentionHistory)
    ? [...alarm.metadata.attentionHistory]
    : []
  if (!history.length && previous.startedAt)
    history.push({
      ...previous,
      action: "legacy",
      actor: previous.startedBy,
      at: previous.startedAt,
    })
  history.push(entry)
  return {
    status: entry.status,
    resolvedAt: choice.resolved ? at : null,
    resolvedBy: choice.resolved ? actor : null,
    metadata: {
      ...alarm.metadata,
      attentionHistory: history,
      attention: {
        ...entry,
        startedAt: previous.startedAt || at,
        startedBy: previous.startedBy || actor,
        completedAt: choice.resolved ? at : null,
        completedBy: choice.resolved ? actor : null,
      },
    },
  }
}
