import { interruptionDiagnosis } from "./unreportedHistory.js"

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" })
const timestamp = (value) => {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}
const valueFor = (row, key) => {
  switch (key) {
    case "historyTotal":
      return row.completedCount
    case "historyLatest":
      return timestamp(row.lastRecoveryAt)
    case "equipment":
      return `${row.name || ""} ${row.company || ""}`
    case "status":
      return row.status
    case "review":
      return row.followUpLabel
    case "silence":
      return row.elapsedHours
    case "report":
      return timestamp(row.lastSeenAt)
    case "consultation":
      return timestamp(row.lastConsultation?.createdAt)
    case "historyCount":
      return timestamp(row.episode?.lastReportAt)
    case "historyRecovery":
      return timestamp(row.episode?.recoveredAt)
    case "historyDuration": {
      const start = timestamp(row.episode?.lastReportAt),
        end = timestamp(row.episode?.recoveredAt)
      return start === null || end === null ? null : end - start
    }
    case "historyReason":
      return interruptionDiagnosis(row.episode || {}).reason
    default:
      return null
  }
}
export const compareUnreportedColumn = (a, b, key, direction = "asc") => {
  const left = valueFor(a, key),
    right = valueFor(b, key)
  const absent = (value) =>
    value == null || value === "" || (typeof value === "number" && !Number.isFinite(value))
  if (absent(left) || absent(right)) return Number(absent(left)) - Number(absent(right))
  const comparison =
    typeof left === "number" && typeof right === "number"
      ? left - right
      : collator.compare(String(left), String(right))
  return comparison * (direction === "desc" ? -1 : 1)
}
