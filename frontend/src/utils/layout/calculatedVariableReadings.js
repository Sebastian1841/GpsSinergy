export function variableTestInputs(keys, values) {
  const ownKeys = new Set(Object.keys(values))
  return Object.fromEntries(keys.filter(key => ownKeys.has(key) && String(values[key] ?? "").trim() !== "")
    .map(key => [key, values[key]]))
}

export function calculatedVariableReadings(asset, reports = [], keys = []) {
  const source = reports.length ? reports : asset ? [{ ...asset, timestamp: asset.reportedAt || asset.lastReportAt || asset.datosUlt, localSnapshot: true }] : []
  return source.slice(-500).map((report, index) => ({
    id: `${report.id || asset?.id || "reading"}:${report.timestamp || index}:${index}`,
    timestamp: report.timestamp || report.reportedAt || report.lastReportAt || "",
    localSnapshot: Boolean(report.localSnapshot),
    inputs: keys.map(key => ({ key, value: calculatedSignalValue(report, key), missing: calculatedSignalValue(report, key) == null })),
  }))
}

export const formatVariableInput = ({ value, missing }) => {
  if (missing) return "sin dato"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}
import { calculatedSignalValue } from "./calculatedVariableSignals.js"

