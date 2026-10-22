import { getReportBrandImageDataUrl } from "../../utils/reports/export/reportBranding.js"
import { downloadBlob } from "../itinerarios/itineraryExportFormatUtils.js"
import {
  driverToday,
  licenseDateLabel,
  licenseState,
} from "../../utils/maintenance/driverLicenseUtils.js"

export async function createDriverLicenseWorkbook(
  rows,
  {
    companyName = "",
    today = driverToday(),
    filters = "Todos los conductores",
    brandImage,
    reportWidthPx = 1800,
  } = {},
) {
  const module = await import("exceljs")
  const ExcelJS = module.default || module
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Sinergy Group"
  workbook.title = "Conductores y licencias"
  const brand = brandImage === undefined ? await getReportBrandImageDataUrl() : brandImage
  const addSheet = (name, title, columns, values) => {
    const navy = "FF102372",
      muted = "FF526B94",
      border = "FFE2E8F0"
    const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } })
    const gutter = 3
    const targetWidth = Number.isFinite(reportWidthPx)
      ? Math.max(1200, Math.min(2560, reportWidthPx))
      : 1800
    const budget = (targetWidth / 0.85 - 2 * (gutter * 7 + 5) - columns.length * 5) / 7
    const total = columns.reduce((sum, [, width]) => sum + width, 0)
    const widths = columns.map(
      ([, width]) => Math.round(Math.max(width, (budget * width) / total) * 100) / 100,
    )
    const sheet = workbook.addWorksheet(name, { properties: { tabColor: { argb: navy } } })
    sheet.columns = [gutter, ...widths, gutter].map((width) => ({ width }))
    const lastColumn = columns.length + 1
    const lastLetter = sheet.getColumn(lastColumn).letter
    const gutterLetter = sheet.getColumn(lastColumn + 1).letter
    sheet.properties.defaultRowHeight = 18
    sheet.views = [{ state: "frozen", ySplit: 6, showGridLines: false, zoomScale: 85 }]
    sheet.mergeCells("B1:B2")
    const aspect = 2800 / 900
    const boxWidth = sheet.getColumn(2).width * 7 + 5
    const headerHeight = Math.max(52, Math.min(72, ((boxWidth - 12) / aspect + 8) * 0.75))
    sheet.getRow(1).height = Math.ceil(headerHeight * 0.54)
    sheet.getRow(2).height = Math.ceil(headerHeight * 0.46)
    const boxHeight = ((sheet.getRow(1).height + sheet.getRow(2).height) * 4) / 3
    if (brand) {
      const id = workbook.addImage({ base64: brand, extension: "png" })
      const height = Math.min(boxHeight - 8, (boxWidth - 12) / aspect) * 0.85
      const width = height * aspect
      sheet.addImage(id, {
        tl: {
          col: 1 + (boxWidth - width) / (2 * boxWidth),
          row: (boxHeight - height) / ((2 * sheet.getRow(1).height * 4) / 3),
        },
        ext: { width, height },
        editAs: "oneCell",
      })
    } else {
      sheet.getCell("B1").value = "SINERGY GROUP"
      sheet.getCell("B1").font = { name: "Calibri", size: 13, bold: true, color: { argb: navy } }
    }
    sheet.mergeCells(`C1:${lastLetter}1`)
    sheet.getCell("C1").value = title
    sheet.getCell("C1").font = { name: "Calibri", size: 17, bold: true, color: { argb: navy } }
    sheet.getCell("C1").alignment = { vertical: "middle", wrapText: true }
    sheet.mergeCells(`C2:${lastLetter}2`)
    sheet.getCell("C2").value =
      name === "Conductores"
        ? "Informe de conductores y vigencia de licencias"
        : "Informe de renovaciones por conductor"
    sheet.mergeCells("B3:F3")
    sheet.getCell("B3").value = `${rows.length} conductores · ${companyName} · ${filters}`
    sheet.mergeCells(`G3:${lastLetter}3`)
    sheet.getCell("G3").value = `Generado: ${licenseDateLabel(today)}`
    for (const address of ["C2", "B3", "G3"]) {
      const cell = sheet.getCell(address)
      cell.font = { name: "Calibri", size: 12, color: { argb: muted } }
      cell.alignment = {
        vertical: "middle",
        wrapText: true,
        horizontal: address === "G3" ? "right" : "left",
      }
    }
    sheet.getRow(3).height = Math.max(
      28,
      Math.ceil(
        String(sheet.getCell("B3").value).length /
          widths.slice(0, 5).reduce((sum, width) => sum + width - 3, 0),
      ) *
        16 +
        10,
    )
    sheet.getRow(4).height = 5
    sheet.getRow(5).height = 5
    for (let column = 2; column <= lastColumn; column++)
      sheet.getCell(4, column).border = {
        bottom: { style: "thin", color: { argb: column === lastColumn ? "FFFF6600" : navy } },
      }
    sheet.getRow(6).values = [undefined, ...columns.map(([header]) => header)]
    sheet.getRow(6).height = 38
    for (let column = 2; column <= lastColumn; column++) {
      const cell = sheet.getCell(6, column)
      cell.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = fill(navy)
      cell.alignment = { vertical: "middle", wrapText: true, indent: 1 }
    }
    values.forEach((values, index) => {
      const row = sheet.getRow(index + 7)
      row.values = [undefined, ...values]
      row.height = Math.max(
        42,
        ...values.map(
          (value, column) =>
            Math.ceil(String(value).length / Math.max(8, ((widths[column] - 3) * 11) / 12)) * 15 +
            10,
        ),
      )
      for (let column = 2; column <= lastColumn; column++) {
        const cell = row.getCell(column)
        cell.font = { name: "Calibri", size: 12, bold: column === 2, color: { argb: navy } }
        cell.alignment = { vertical: "middle", wrapText: true, indent: 1 }
        cell.fill = fill(index % 2 ? "FFFAFBFD" : "FFFFFFFF")
        cell.border = { bottom: { style: "thin", color: { argb: border } } }
      }
      row.getCell(3).numFmt = "@"
    })
    const lastRow = Math.max(6, 6 + values.length)
    sheet.autoFilter = `B6:${lastLetter}${lastRow}`
    sheet.pageSetup = {
      horizontalCentered: true,
      orientation: "landscape",
      paperSize: 8,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: "1:6",
      printArea: `A1:${gutterLetter}${lastRow}`,
      margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 },
    }
    sheet.headerFooter.oddFooter = "&LSinergy Group&RPagina &P de &N"
    workbook.views = [{ activeTab: 0 }]
    return sheet
  }
  addSheet(
    "Conductores",
    "REPORTE DE CONDUCTORES Y LICENCIAS",
    [
      ["Conductor", 32],
      ["RUT", 18],
      ["Telefono", 22],
      ["Clases", 15],
      ["Vencimiento", 19],
      ["Estado", 18],
      ["Foto frente", 17],
      ["Foto reverso", 17],
    ],
    rows.map((row) => [
      row.name,
      row.rut,
      row.phone || "No registrado",
      row.classes.join(", "),
      licenseDateLabel(row.expiresAt),
      licenseState(row.expiresAt, today).label,
      row.photos?.front ? "Adjunta" : "Sin foto",
      row.photos?.back ? "Adjunta" : "Sin foto",
    ]),
  )
  addSheet(
    "Licencias anteriores",
    "HISTORIAL DE LICENCIAS",
    [
      ["Conductor", 32],
      ["RUT", 18],
      ["Clases anteriores", 20],
      ["Vencimiento anterior", 22],
      ["Renovada el", 19],
      ["Registrado por", 30],
      ["Foto frente", 17],
      ["Foto reverso", 17],
    ],
    rows.flatMap((row) =>
      [...(row.history || [])]
        .reverse()
        .map((entry) => [
          row.name,
          row.rut,
          entry.classes.join(", "),
          licenseDateLabel(entry.expiresAt),
          licenseDateLabel(driverToday(entry.renewedAt)),
          entry.renewedBy || "No registrado",
          entry.photos?.front ? "Adjunta" : "Sin foto",
          entry.photos?.back ? "Adjunta" : "Sin foto",
        ]),
    ),
  )
  return workbook
}

export async function exportDriverLicenses(rows, options = {}) {
  const workbook = await createDriverLicenseWorkbook(rows, options)
  const buffer = await workbook.xlsx.writeBuffer()
  if (options.shouldDownload && !options.shouldDownload()) return
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `conductores-licencias-${options.today || driverToday()}.xlsx`,
  )
}
