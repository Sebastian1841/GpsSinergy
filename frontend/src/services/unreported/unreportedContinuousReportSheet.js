import {
  consultationSituations,
  consultationDecisions,
  currentConsultations,
  consultationFollowUpText,
} from "../../utils/unreported/unreportedFlow.js"
import {
  completedInterruptions,
  consultationsForInterruption,
  interruptionDiagnosis,
  interruptionDurationLabel,
} from "../../utils/unreported/unreportedHistory.js"

const colors = { navy: "FF102372", muted: "FF526B94", border: "FFE2E8F0", orange: "FFFF6600" }
const headers = [
  "Equipo",
  "Empresa",
  "Tiempo sin reportar",
  "Último reporte",
  "Diagnóstico GPS",
  "Evidencia GPS",
  "Última llamada",
  "Situación",
  "Decisión",
  "Observaciones",
]
const formatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Santiago",
})
const partsFor = (value) => {
  if (!value || !Number.isFinite(Date.parse(value))) return null
  return Object.fromEntries(
    formatter.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  )
}
const dateAndTime = (value, { shortYear = false, separator = "\n" } = {}) => {
  const parts = partsFor(value)
  return parts
    ? `${parts.day}-${parts.month}-${shortYear ? parts.year.slice(-2) : parts.year}${separator}${parts.hour}:${parts.minute}`
    : "Sin registro"
}
const displayLastReport = (row) => {
  if (row.lastSeenAt) return dateAndTime(row.lastSeenAt)
  const text = String(row.lastReport || "Sin registro")
  return /^\d{4}-\d{2}-\d{2}T/.test(text) ? dateAndTime(text) : text.replace(/,\s*/, "\n")
}
const label = (options, value) => options.find((option) => option.value === value)?.label || "—"
const latestCall = (row) =>
  currentConsultations(row).reduce(
    (latest, call) => {
      const timestamp = Date.parse(call.createdAt)
      const previous = Date.parse(latest?.createdAt)
      return !latest ||
        (Number.isFinite(timestamp) && (!Number.isFinite(previous) || timestamp >= previous)) ||
        (!Number.isFinite(timestamp) && !Number.isFinite(previous))
        ? call
        : latest
    },
    row.mode === "active" ? null : row.lastConsultation || null,
  )
const pattern = (color) => ({ type: "pattern", pattern: "solid", fgColor: { argb: color } })
const cellText = (value) =>
  value?.richText ? value.richText.map((run) => run.text).join("") : String(value ?? "")

export const addUnreportedContinuousReportSheet = (
  workbook,
  rows,
  {
    history = false,
    observedAt,
    reportWidthPx = 1800,
    filterDescription = "Todas las empresas",
  } = {},
  brand = "",
) => {
  const sheet = workbook.addWorksheet("Reporte", {
    properties: { tabColor: { argb: colors.navy } },
  })
  const reportRows = history
    ? rows.flatMap((equipment) =>
        completedInterruptions(equipment).map((episode) => ({ equipment, episode })),
      )
    : rows.map((equipment) => ({ equipment }))
  const reportHeaders = history
    ? [
        "Dejó de reportar",
        "Volvió a reportar",
        "Duración",
        "Diagnóstico GPS",
        "Evidencia GPS",
        "Llamadas del caso",
        "Situación",
        "Decisión",
        "Observaciones",
      ]
    : headers
  const weights = history
    ? [11, 11, 9, 13, 14, 14, 10, 11, 16]
    : [16, 12, 10, 10, 13, 14, 13, 10, 11, 14]
  const minimums = history
    ? [18, 18, 15, 23, 24, 24, 18, 20, 26]
    : [24, 19, 15, 17, 23, 24, 23, 18, 20, 26]
  const target =
    Number.isFinite(Number(reportWidthPx)) && Number(reportWidthPx) > 0
      ? Math.max(1800, Number(reportWidthPx))
      : 1800
  const gutterWidth = 3
  const gutterPixels = 2 * (gutterWidth * 7 + 5)
  const budget = Math.max(210, (target / 0.85 - gutterPixels - weights.length * 5) / 7)
  const total = weights.reduce((sum, value) => sum + value, 0)
  const widths = weights.map(
    (weight, index) => Math.round(Math.max(minimums[index], (budget * weight) / total) * 100) / 100,
  )
  sheet.columns = [gutterWidth, ...widths, gutterWidth].map((width) => ({ width }))
  const lastColumn = reportHeaders.length + 1
  const lastLetter = sheet.getColumn(lastColumn).letter
  const gutterLetter = sheet.getColumn(lastColumn + 1).letter
  sheet.properties.defaultRowHeight = 18
  sheet.views = [{ showGridLines: false, state: "frozen", ySplit: history ? 5 : 6, zoomScale: 85 }]
  sheet.mergeCells("B1:B2")
  const logoAspect = 2800 / 900
  const logoBoxWidth = sheet.getColumn(2).width * 7 + 5
  const headerHeight = Math.max(52, Math.min(72, ((logoBoxWidth - 12) / logoAspect + 8) * 0.75))
  sheet.getRow(1).height = Math.ceil(headerHeight * 0.54)
  sheet.getRow(2).height = Math.ceil(headerHeight * 0.46)
  const logoBoxHeight = ((sheet.getRow(1).height + sheet.getRow(2).height) * 4) / 3
  if (brand) {
    const image = workbook.addImage({ base64: brand, extension: "png" })
    const height = Math.min(logoBoxHeight - 8, (logoBoxWidth - 12) / logoAspect) * 0.85
    const width = height * logoAspect
    sheet.addImage(image, {
      tl: {
        col: 1 + (logoBoxWidth - width) / (2 * logoBoxWidth),
        row: (logoBoxHeight - height) / ((2 * sheet.getRow(1).height * 4) / 3),
      },
      ext: { width, height },
      editAs: "oneCell",
    })
  } else {
    sheet.getCell("B1").value = "SINERGY GROUP"
    sheet.getCell("B1").font = {
      name: "Calibri",
      size: 13,
      bold: true,
      color: { argb: colors.navy },
    }
    sheet.getCell("B1").alignment = { vertical: "middle" }
  }
  sheet.mergeCells(`C1:${lastLetter}1`)
  sheet.getCell("C1").value = history
    ? "HISTORIAL DE DESCONEXIONES"
    : "REPORTE DE EQUIPOS SIN REPORTAR"
  sheet.getCell("C1").font = { name: "Calibri", size: 17, bold: true, color: { argb: colors.navy } }
  sheet.getCell("C1").alignment = { vertical: "middle", wrapText: true }
  sheet.mergeCells(`C2:${lastLetter}2`)
  sheet.getCell("C2").value = history
    ? "Informe de desconexiones y consultas"
    : "Informe de conectividad y consultas"
  sheet.mergeCells("B3:F3")
  sheet.getCell("B3").value =
    `${rows.length} equipos${history ? ` · ${reportRows.length} desconexiones terminadas` : ""} · ${filterDescription}`
  sheet.mergeCells(`G3:${lastLetter}3`)
  sheet.getCell("G3").value =
    `Generado: ${dateAndTime(observedAt || new Date().toISOString(), { separator: " · " })}`
  for (const address of ["C2", "B3", "G3"]) {
    const cell = sheet.getCell(address)
    cell.font = { name: "Calibri", size: 12, color: { argb: colors.muted } }
    cell.alignment = {
      vertical: "middle",
      wrapText: true,
      horizontal: address === "G3" ? "right" : "left",
    }
  }
  sheet.getRow(3).height = 28
  sheet.getRow(4).height = 5
  sheet.getRow(5).height = 5
  for (let column = 2; column <= lastColumn; column++)
    sheet.getCell(4, column).border = {
      bottom: {
        style: "thin",
        color: { argb: column === lastColumn ? colors.orange : colors.navy },
      },
    }
  const writeHeading = (number) => {
    const heading = sheet.getRow(number)
    heading.values = [undefined, ...reportHeaders]
    heading.height = 38
    for (let column = 2; column <= lastColumn; column++) {
      const cell = heading.getCell(column)
      cell.fill = pattern(colors.navy)
      cell.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FFFFFFFF" } }
      cell.alignment = { vertical: "middle", wrapText: true, indent: 1 }
    }
  }
  if (!history) writeHeading(6)
  let line = history ? 6 : 7
  let previousEquipment = null
  reportRows.forEach(({ equipment, episode }, index) => {
    if (history && equipment !== previousEquipment) {
      if (previousEquipment) sheet.getRow(line++).height = 16
      sheet.mergeCells(line, 2, line, lastColumn)
      const band = sheet.getCell(line, 2)
      band.value = `${equipment.name || "Equipo"} | IMEI: ${equipment.imei || "—"} | ${equipment.company || "—"} | ${completedInterruptions(equipment).length} desconexiones terminadas`
      band.font = { name: "Calibri", size: 12, bold: true, color: { argb: colors.navy } }
      band.fill = pattern("FFDCE7F4")
      band.alignment = { vertical: "middle", wrapText: true, indent: 1 }
      band.border = { top: { style: "thin", color: { argb: colors.orange } } }
      const capacity = widths.reduce((sum, width) => sum + width - 3, 0)
      sheet.getRow(line++).height = Math.max(38, Math.ceil(band.value.length / capacity) * 18 + 16)
      writeHeading(line++)
      previousEquipment = equipment
    }
    const calls = history ? consultationsForInterruption(equipment, episode) : []
    const call = history ? calls.at(-1) : latestCall(equipment)
    const identity = {
      richText: [
        {
          text: String(equipment.name || "Equipo"),
          font: { name: "Calibri", size: 12, bold: true, color: { argb: colors.navy } },
        },
        {
          text: `\nIMEI: ${equipment.imei || "—"}`,
          font: { name: "Calibri", size: 11, color: { argb: colors.muted } },
        },
      ],
    }
    const historicalDiagnosis = history ? interruptionDiagnosis(episode) : null
    const diagnosis =
      historicalDiagnosis?.reason ||
      equipment.disconnectionReason ||
      equipment.diagnosis?.reason ||
      "Diagnóstico no registrado"
    const evidence =
      historicalDiagnosis?.evidence ||
      equipment.diagnosticEvidence ||
      equipment.diagnosis?.evidence ||
      "Sin datos registrados"
    const callValues = history
      ? [
          calls.length
            ? calls
                .map(
                  (item, number) =>
                    `${number + 1}. ${dateAndTime(item.createdAt, { shortYear: true, separator: " · " })}\n${item.author || "—"}`,
                )
                .join("\n\n")
            : "Sin llamada registrada",
          calls.length
            ? calls
                .map(
                  (item, number) =>
                    `${number + 1}. ${label(consultationSituations, item.situation)}`,
                )
                .join("\n\n")
            : "—",
          calls.length
            ? calls
                .map(
                  (item, number) => `${number + 1}. ${label(consultationDecisions, item.decision)}`,
                )
                .join("\n\n")
            : "—",
          calls.length
            ? calls
                .map(
                  (item, number) =>
                    `${number + 1}. ${[item.observation, consultationFollowUpText(item)].filter(Boolean).join("\n") || "Sin observacion"}`,
                )
                .join("\n\n")
            : "—",
        ]
      : [
          call
            ? `${dateAndTime(call.createdAt, { shortYear: true, separator: " · " })}\n${call.author || "—"}`
            : "Sin llamada registrada",
          call ? label(consultationSituations, call.situation) : "—",
          call ? label(consultationDecisions, call.decision) : "—",
          [call?.observation, consultationFollowUpText(call)].filter(Boolean).join("\n") || "—",
        ]
    const values = [
      ...(!history ? [identity, String(equipment.company || "—")] : []),
      ...(history
        ? [
            episode.kind === "first_report"
              ? "Sin reporte previo"
              : dateAndTime(episode.lastReportAt),
            dateAndTime(episode.recoveredAt),
            interruptionDurationLabel(episode, observedAt),
          ]
        : [String(equipment.duration || "Sin registro"), displayLastReport(equipment)]),
      diagnosis,
      String(evidence).replaceAll(" · ", "\n"),
      ...callValues,
    ]
    const row = sheet.getRow(line++)
    row.values = [undefined, ...values]
    row.height = Math.min(
      409,
      Math.max(
        44,
        ...values.map(
          (value, column) =>
            cellText(value)
              .split("\n")
              .reduce(
                (sum, line) =>
                  sum +
                  Math.max(
                    1,
                    Math.ceil(line.length / Math.max(8, ((widths[column] - 3) * 11) / 12)),
                  ),
                0,
              ) *
              15 +
            10,
        ),
      ),
    )
    const diagnosisColumn = history ? 5 : 6
    for (let column = 2; column <= lastColumn; column++) {
      const cell = row.getCell(column)
      cell.font = {
        name: "Calibri",
        size: 12,
        bold: column === 4,
        color: {
          argb:
            column === diagnosisColumn + 1 || (column === diagnosisColumn + 2 && !call)
              ? colors.muted
              : colors.navy,
        },
      }
      cell.alignment = { vertical: "middle", wrapText: true, indent: 1 }
      cell.fill = pattern(index % 2 ? "FFFAFBFD" : "FFFFFFFF")
      cell.border = { bottom: { style: "thin", color: { argb: colors.border } } }
    }
    row.getCell(2).numFmt = "@"
    const normalized = String(diagnosis)
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
    if (normalized === "alimentacion desconectada") {
      row.getCell(diagnosisColumn).fill = pattern("FFFFF4EA")
      row.getCell(diagnosisColumn).font = { name: "Calibri", size: 12, color: { argb: "FF9B4A08" } }
    } else if (normalized === "sim ausente") {
      row.getCell(diagnosisColumn).fill = pattern("FFF0F5FC")
    }
  })
  if (history && !reportRows.length) {
    sheet.mergeCells(`B6:${lastLetter}6`)
    sheet.getCell("B6").value = "Sin desconexiones terminadas para exportar"
  }
  const lastRow = Math.max(6, line - 1)
  if (!history) sheet.autoFilter = `B6:${lastLetter}${lastRow}`
  sheet.pageSetup = {
    horizontalCentered: true,
    orientation: "landscape",
    paperSize: 8,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: history ? "1:5" : "1:6",
    printArea: `A1:${gutterLetter}${lastRow}`,
    margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 },
  }
  sheet.headerFooter.oddFooter = "&LSinergy Group&RPagina &P de &N"
  sheet.orderNo = 0
  workbook.views = [{ activeTab: 0 }]
  return sheet
}
