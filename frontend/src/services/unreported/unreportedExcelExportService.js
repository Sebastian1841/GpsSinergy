import { downloadBlob } from "../itinerarios/itineraryExportFormatUtils.js"
import { getReportBrandImageDataUrl } from "../../utils/reports/export/reportBranding.js"
import { addUnreportedReportSheet } from "./unreportedReportSheet.js"
import {
  consultationSituations,
  consultationDecisions,
  consultationFollowUpText,
} from "../../utils/unreported/unreportedFlow.js"

import {
  consultationsForInterruption,
  interruptionDurationLabel,
  interruptionDiagnosis,
  completedInterruptions,
  interruptionSummary,
} from "../../utils/unreported/unreportedHistory.js"

const dateFormat = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Santiago",
})
const formatDate = (value) => {
  const date = new Date(value)
  return value && Number.isFinite(date.getTime()) ? dateFormat.format(date) : "Sin fecha"
}
const formatCall = (call) =>
  `${formatDate(call.createdAt)} · ${call.author}: ${consultationSituations.find((option) => option.value === call.situation)?.label || "Sin confirmar"} · ${consultationDecisions.find((option) => option.value === call.decision)?.label || "Pendiente de confirmar"}${call.observation ? " · " + call.observation : ""}`

const fullDateFormat = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Santiago",
})
const fullDate = (value) =>
  value && Number.isFinite(Date.parse(value))
    ? fullDateFormat.format(new Date(value))
    : "Sin registro"
const durationLabel = (milliseconds) => {
  if (!Number.isFinite(milliseconds)) return "Sin registro"
  const hours = Math.floor(milliseconds / 3600000)
  return hours >= 24
    ? `${Math.floor(hours / 24)} dias ${hours % 24} h`
    : hours
      ? `${hours} h`
      : "Menos de 1 h"
}

export const prepareUnreportedExcelRows = (rows, { history = false } = {}) =>
  rows.map((row) => {
    const summary = history ? null : interruptionSummary(row)
    const lastRecoveryAt = row.lastRecoveryAt || summary?.lastRecoveryAt
    return {
      ...row,
      interruptions: history ? completedInterruptions(row) : row.interruptions,
      interruptionCount: history
        ? completedInterruptions(row).length
        : (row.interruptionCount ?? summary.interruptionCount),
      status: history && !row.archived && row.mode !== "active" ? "Reportando" : row.status,
      lastReport: row.lastReport || "Sin dato actual",
      lastRecoveryAt: lastRecoveryAt ? fullDate(lastRecoveryAt) : "Aun sin recuperacion",
      recoveredAt: row.recoveredAt ? fullDate(row.recoveredAt) : "",
      followUpAt: row.lastConsultation ? fullDate(row.lastConsultation.createdAt) : "",
      followUpBy: row.lastConsultation?.author || "",
      interruption: durationLabel(row.outageDurationMs),
      disconnectionReason: row.diagnosis?.reason || "Diagnostico actual no registrado",
      diagnosticEvidence: row.diagnosis?.evidence || "Sin datos de diagnostico actual",
    }
  })

export const createUnreportedExcelWorkbook = async (
  rows,
  {
    history = false,
    observedAt = new Date().toISOString(),
    reportWidthPx = 1800,
    filterDescription,
    brandImage,
  } = {},
) => {
  const module = await import("exceljs")
  const ExcelJS = module.default || module
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Sinergy Group"
  workbook.title = history ? "Historial de desconexiones" : "Equipos sin reportar"
  const sheet = workbook.addWorksheet(history ? "Resumen de equipos" : "Equipos sin reporte")
  sheet.columns = history
    ? [
        { header: "Equipo", key: "name", width: 30 },
        { header: "IMEI", key: "imei", width: 22 },
        { header: "Empresa", key: "company", width: 30 },
        { header: "Estado actual", key: "status", width: 24 },
        { header: "Ultimo reporte", key: "lastReport", width: 24 },
        { header: "Interrupciones registradas", key: "interruptionCount", width: 24 },
        { header: "Ultima recuperacion", key: "lastRecoveryAt", width: 24 },
        { header: "Consultas a la empresa", key: "consultations", width: 70 },
      ]
    : [
        { header: "Equipo", key: "name", width: 30 },
        { header: "IMEI", key: "imei", width: 22 },
        { header: "Empresa", key: "company", width: 30 },
        { header: "Estado", key: "status", width: 26 },
        { header: "Sin reportar", key: "duration", width: 20 },
        { header: "Ultimo reporte", key: "lastReport", width: 24 },
        { header: "Al cortarse", key: "power", width: 55 },
        { header: "Ubicacion", key: "location", width: 45 },
        { header: "Recuperado", key: "recoveredAt", width: 24 },
        { header: "Duracion interrupcion", key: "interruption", width: 24 },
        { header: "Fecha ultima consulta", key: "followUpAt", width: 26 },
        { header: "Decision de revision", key: "followUpLabel", width: 28 },
        { header: "Consultado por", key: "followUpBy", width: 28 },
        { header: "Motivo observado", key: "disconnectionReason", width: 45 },
        { header: "Evidencia del ultimo dato", key: "diagnosticEvidence", width: 50 },
        { header: "Consultas a la empresa", key: "consultations", width: 70 },
      ]
  for (const row of rows) {
    const values = {}
    for (const { key } of sheet.columns) values[key] = String(row[key] ?? "")
    values.consultations = (row.consultations || [])
      .map((call) => [formatCall(call), consultationFollowUpText(call)].filter(Boolean).join("\n"))
      .join("\n")
    if (history) values.interruptionCount = row.interruptionCount ?? row.interruptions?.length ?? 0
    sheet.addRow(values)
  }
  sheet.getColumn("imei").numFmt = "@"
  sheet.views = [{ state: "frozen", ySplit: 1 }]
  sheet.autoFilter = history ? "A1:H1" : "A1:P1"
  sheet.getColumn("consultations").alignment = { wrapText: true, vertical: "top" }
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF102372" } }
  })
  if (history || rows.some((row) => row.interruptions?.length)) {
    const detail = workbook.addWorksheet("Historial de reportes")
    detail.columns = [
      { header: "Equipo", key: "name", width: 30 },
      { header: "IMEI", key: "imei", width: 22 },
      { header: "Empresa", key: "company", width: 30 },
      { header: "Ultimo reporte antes del corte", key: "lastReportAt", width: 30 },
      { header: "Volvio a reportar", key: "recoveredAt", width: 24 },
      { header: "Tiempo sin reportar", key: "duration", width: 24 },
      { header: "Estado de interrupcion", key: "status", width: 24 },
      { header: "Consultas de esta interrupcion", key: "consultations", width: 70 },
      { header: "Diagnostico GPS de esta interrupcion", key: "reason", width: 40 },
      { header: "Datos GPS de esta interrupcion", key: "evidence", width: 55 },
    ]
    for (const row of rows) {
      for (const item of row.interruptions || []) {
        const diagnosis = interruptionDiagnosis(item)
        detail.addRow({
          name: String(row.name || ""),
          imei: String(row.imei || ""),
          company: String(row.company || ""),
          lastReportAt:
            item.kind === "first_report" ? "Sin reporte previo" : formatDate(item.lastReportAt),
          recoveredAt: item.recoveredAt ? formatDate(item.recoveredAt) : "Aun sin recuperar",
          duration: interruptionDurationLabel(item, observedAt),
          status: item.recoveredAt ? "Recuperado" : "Sin recuperar",
          consultations: consultationsForInterruption(row, item)
            .map((call) =>
              [formatCall(call), consultationFollowUpText(call)].filter(Boolean).join("\n"),
            )
            .join("\n"),
          reason: diagnosis.reason,
          evidence: diagnosis.evidence,
        })
      }
    }
    detail.getColumn("imei").numFmt = "@"
    detail.getColumn("consultations").alignment = { wrapText: true, vertical: "top" }
    detail.views = [{ state: "frozen", ySplit: 1 }]
    detail.autoFilter = "A1:J1"
    detail.getColumn("reason").alignment = { wrapText: true, vertical: "top" }
    detail.getColumn("evidence").alignment = { wrapText: true, vertical: "top" }
    detail.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF102372" } }
    })
  }
  for (const dataSheet of workbook.worksheets) {
    dataSheet.views = [{ state: "frozen", ySplit: 1, showGridLines: false, zoomScale: 85 }]
    dataSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.height = 30
        return
      }
      row.height = Math.min(
        409,
        Math.max(
          26,
          ...row.values.slice(1).map(
            (value, index) =>
              String(value ?? "")
                .split("\n")
                .reduce(
                  (sum, line) =>
                    sum +
                    Math.max(
                      1,
                      Math.ceil(
                        line.length / Math.max(8, dataSheet.getColumn(index + 1).width - 2),
                      ),
                    ),
                  0,
                ) *
                12 +
              10,
          ),
        ),
      )
      row.eachCell((cell) => {
        cell.font = { name: "Calibri", size: 9, color: { argb: "FF102372" } }
        cell.alignment = { vertical: "top", wrapText: true, indent: 1 }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rowNumber % 2 ? "FFF7F9FC" : "FFFFFFFF" },
        }
        cell.border = { bottom: { style: "thin", color: { argb: "FFD8E0EB" } } }
      })
    })
  }
  const brand = brandImage ?? (await getReportBrandImageDataUrl().catch(() => ""))
  addUnreportedReportSheet(
    workbook,
    rows,
    { history, observedAt, reportWidthPx, filterDescription },
    brand,
  )
  return workbook
}

export const exportUnreportedExcel = async (rows, options = {}) => {
  const workbook = await createUnreportedExcelWorkbook(rows, options)
  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    options.history ? "historial-de-equipos.xlsx" : "equipos-sin-reporte.xlsx",
  )
}
