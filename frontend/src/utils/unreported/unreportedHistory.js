import { describeUnreportedDiagnosis } from "./unreportedDiagnosis.js"

const time = (value) => (value ? Date.parse(value) : NaN)

const recordFirstReport = (record, reportAt) => {
  const id = `first-report-${reportAt}`
  return {
    ...record,
    interruptions: [
      ...(record.interruptions || []),
      {
        id,
        kind: "first_report",
        lastReportAt: null,
        recoveredAt: reportAt,
        durationMs: null,
      },
    ],
    consultations: (record.consultations || []).map((call) =>
      !call.interruptionId && time(call.createdAt) <= time(reportAt)
        ? { ...call, interruptionId: id }
        : call,
    ),
  }
}

export const completedInterruptions = (record) =>
  (record.interruptions || []).filter((episode) => episode.recoveredAt)

export const captureInterruptionTelemetry = (record) => {
  const open = record.interruptions?.find((item) => !item.recoveredAt)
  if (!open || open.telemetry || time(record.telemetry?.reportedAt) !== time(open.lastReportAt))
    return record
  return {
    ...record,
    interruptions: record.interruptions.map((item) =>
      item.id === open.id ? { ...item, telemetry: { ...record.telemetry } } : item,
    ),
  }
}

export const interruptionDiagnosis = (item) =>
  item.demo
    ? {
        reason: "Desconexion simulada",
        evidence: "Caso de demostracion; no confirma una falla real del GPS.",
      }
    : item.kind === "first_report"
      ? {
          reason: "Primer reporte recibido",
          evidence:
            "El equipo no tenia reportes previos; no se conoce el inicio de la falta de reporte.",
        }
      : item.telemetry
        ? describeUnreportedDiagnosis({
            ...item.telemetry,
            mode: "active",
            lastReportAt: item.lastReportAt,
            sensorReportedAt: item.telemetry.reportedAt,
          })
        : {
            reason: "Diagnostico no registrado",
            evidence: "No se guardaron datos GPS de esta interrupcion",
          }

export const ensureInterruptionHistory = (record, observedAt, thresholdMs) => {
  let next = record
  if (!record.historyInitialized || !Array.isArray(record.interruptions)) {
    const interruptions = Array.isArray(record.interruptions) ? record.interruptions : []
    const recovered = time(record.recoveredAt)
    const duration = record.outageDurationMs
    const start = new Date(recovered - duration)
    const legacy =
      Number.isFinite(recovered) &&
      Number.isFinite(start.getTime()) &&
      Number.isFinite(duration) &&
      duration > thresholdMs &&
      !interruptions.some((item) => item.recoveredAt === record.recoveredAt)
        ? [
            {
              id: `legacy-${record.recoveredAt}`,
              lastReportAt: start.toISOString(),
              recoveredAt: record.recoveredAt,
              durationMs: duration,
              detectedAt: null,
            },
          ]
        : []
    next = { ...record, historyInitialized: true, interruptions: [...legacy, ...interruptions] }
  }
  if (
    record.historyInitialized === true &&
    record.mode === "recovered" &&
    record.outageDurationMs === null &&
    Number.isFinite(time(record.recoveredAt)) &&
    next.interruptions.length === 0
  ) {
    next = recordFirstReport(next, record.recoveredAt)
  }
  const last = time(next.lastSeenAt)
  if (
    next.mode === "active" &&
    Number.isFinite(last) &&
    (next.demoDisconnected || time(observedAt) - last > thresholdMs) &&
    !next.interruptions.some((item) => !item.recoveredAt)
  ) {
    next = {
      ...next,
      interruptions: [
        ...next.interruptions,
        {
          id: `outage-${next.lastSeenAt}`,
          lastReportAt: next.lastSeenAt,
          detectedAt: observedAt,
          recoveredAt: null,
          durationMs: null,
          ...(next.demoDisconnected ? { demo: true } : {}),
        },
      ],
    }
  }
  return captureInterruptionTelemetry(next)
}

export const closeInterruption = (record, reportAt, thresholdMs = 0, observedAt = reportAt) => {
  const open = record.interruptions?.find((item) => !item.recoveredAt)
  if (
    !open &&
    record.mode === "active" &&
    !record.lastSeenAt &&
    Number.isFinite(time(reportAt)) &&
    time(observedAt) - time(reportAt) <= thresholdMs
  ) {
    return recordFirstReport(record, reportAt)
  }
  if (!open || !Number.isFinite(time(reportAt)) || time(reportAt) <= time(open.lastReportAt))
    return record
  // A late packet can correct the last known report without proving another outage.
  if (!open.demo && time(reportAt) - time(open.lastReportAt) <= thresholdMs) {
    const stillSilent = time(observedAt) - time(reportAt) > thresholdMs
    return {
      ...record,
      interruptions: stillSilent
        ? record.interruptions.map((item) =>
            item.id === open.id ? { ...item, lastReportAt: reportAt, telemetry: null } : item,
          )
        : record.interruptions.filter((item) => item.id !== open.id),
    }
  }
  return {
    ...record,
    interruptions: record.interruptions.map((item) =>
      item.id === open.id
        ? {
            ...item,
            recoveredAt: reportAt,
            durationMs: time(reportAt) - time(item.lastReportAt),
          }
        : item,
    ),
  }
}

export const interruptionSummary = (record) => {
  const interruptions = Array.isArray(record.interruptions) ? record.interruptions : []
  let lastRecoveryAt = null
  for (const item of interruptions) {
    if (item.recoveredAt && (!lastRecoveryAt || time(item.recoveredAt) > time(lastRecoveryAt)))
      lastRecoveryAt = item.recoveredAt
  }
  return {
    interruptionCount: interruptions.length,
    lastRecoveryAt,
  }
}

export const consultationsForInterruption = (record, interruption) =>
  (record.consultations || []).filter((call) =>
    call.interruptionId
      ? call.interruptionId === interruption.id
      : time(call.createdAt) >= time(interruption.lastReportAt) &&
        (!interruption.recoveredAt || time(call.createdAt) <= time(interruption.recoveredAt)),
  )

export const knownEquipmentWithHistory = (source, records) => {
  const rows = new Map(source.map((row) => [JSON.stringify([row.company, String(row.imei)]), row]))
  for (const [key, record] of Object.entries(records)) {
    if (rows.has(key)) continue
    if (!record || typeof record !== "object") continue
    let identity
    try {
      identity = JSON.parse(key)
    } catch {
      continue
    }
    if (!Array.isArray(identity) || identity.length !== 2 || !identity[0] || !identity[1]) continue
    const [company, imei] = identity
    const metadata = record.equipment || {}
    rows.set(key, {
      name: metadata.name || String(imei),
      company: String(company),
      imei: String(imei),
      lastReport: record.lastSeenAt,
      location: metadata.location || "Sin posicion conocida",
      archived: true,
    })
  }
  return [...rows.values()]
}

export const compareEquipmentHistory = (a, b) =>
  (time(b.lastRecoveryAt) || 0) - (time(a.lastRecoveryAt) || 0) ||
  b.interruptionCount - a.interruptionCount ||
  String(a.name || "").localeCompare(String(b.name || ""), "es")

export const interruptionDurationLabel = (item, observedAt) => {
  if (item.kind === "first_report") return "Inicio desconocido"
  const end = item.recoveredAt || observedAt
  const duration = time(end) - time(item.lastReportAt)
  if (!Number.isFinite(duration) || duration < 0) return "Sin registro"
  const hours = Math.floor(duration / 3600000)
  return hours >= 24
    ? `${Math.floor(hours / 24)} dias ${hours % 24} h`
    : hours
      ? `${hours} h`
      : "Menos de 1 h"
}
