import { getReportBrandImageDataUrl } from "../../utils/reports/export/reportBranding.js"
import { downloadBlob } from "../itinerarios/itineraryExportFormatUtils.js"
import { parseMaintenanceOrderCost } from "../../utils/maintenance/maintenanceOrderSummary.js"

const headers = ["OT", "Mantencion", "Fecha de cierre", "Lectura de cierre", "Criterio", "Responsable", "Taller", "Costo estimado", "Costo real", "Fecha limite de ejecucion"]
const reportDate = (value, time = false) => {
  if (!value) return "Sin registro"
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.split("-").reverse().join("-")
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const date = new Date(text)
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}), timeZone: "America/Santiago" }).format(date)
  }
  return text
}
const values = order => [order.id, order.job, reportDate(order.closedAt, true), order.closingReading, order.readingSourceLabel === "Fecha/Hora" ? "Tiempo" : order.readingSourceLabel, order.closedBy || order.owner, order.workshop, parseMaintenanceOrderCost(order.estimatedCost), parseMaintenanceOrderCost(order.actualCost), reportDate(order.scheduledDate)]
const generatedAt = () => new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" }).format(new Date())

export const createMaintenanceHistoryWorkbook = async (orders, vehicle, context = {}) => {
  const module = await import("exceljs")
  const ExcelJS = module.default || module
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Sinergy Group"
  const sheet = workbook.addWorksheet("Historial")
  const widths = [32, 34, 24, 20, 16, 23, 23, 19, 19, 25]
  const zoom = 85
  const targetWidth = Number(context.reportWidthPx) > 0 ? Number(context.reportWidthPx) : 1800
  const scale = Math.max(.8, ((targetWidth * 1.02 / (zoom / 100)) - 52 - widths.length * 5) / (widths.reduce((sum, width) => sum + width, 0) * 7))
  sheet.columns = [3, ...widths.map(width => Math.round(width * scale * 100) / 100), 3].map(width => ({ width }))
  sheet.properties.defaultRowHeight = 18
  sheet.views = [{ showGridLines: false, state: "frozen", ySplit: 9, zoomScale: 85 }]
  sheet.mergeCells("B1:B3")
  sheet.getCell("B1").border = { right: { style: "thin", color: { argb: "FFD8E0EB" } } }
  const brand = await getReportBrandImageDataUrl().catch(() => "")
  if (brand) {
    const imageId = workbook.addImage({ base64: brand, extension: "png" })
    sheet.addImage(imageId, { tl: { col: 1.15, row: .3 }, ext: { width: 160, height: 51 } })
  }
  sheet.mergeCells("C1:K2")
  sheet.getCell("C1").value = "HISTORIAL DE MANTENCIONES DEL VEHICULO"
  sheet.getCell("C1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF102372" } }
  sheet.getCell("C1").alignment = { vertical: "middle", indent: 1, wrapText: true }
  sheet.mergeCells("C3:E3")
  sheet.getCell("C3").value = "Informe de ejecuciones"
  sheet.getCell("C3").border = { right: { style: "thin", color: { argb: "FFD8E0EB" } } }
  sheet.mergeCells("F3:K3")
  sheet.getCell("F3").value = `Generado: ${generatedAt()}`
  for (const address of ["C3", "F3"]) {
    sheet.getCell(address).font = { name: "Calibri", size: 9, color: { argb: "FF526B94" } }
    sheet.getCell(address).alignment = { vertical: "middle", indent: 1 }
  }
  for (let row = 1; row <= 3; row += 1) sheet.getRow(row).height = row === 3 ? 20 : 18
  for (const row of [4, 5, 8]) sheet.getRow(row).height = 6
  for (let column = 2; column <= 11; column += 1) sheet.getCell(4, column).border = { bottom: { style: "medium", color: { argb: column > 9 ? "FFFF6600" : "FF102372" } } }
  sheet.mergeCells("B6:K6")
  sheet.getCell("B6").value = `${vehicle.plate || "-"} | ${vehicle.assetName || vehicle.name || "Vehiculo"} | ${vehicle.companyName || "-"}`
  sheet.getCell("B6").font = { size: 11, bold: true, color: { argb: "FF102372" } }
  sheet.getCell("B6").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCE7F4" } }
  sheet.getCell("B6").alignment = { vertical: "middle", indent: 1 }
  sheet.getCell("B6").border = { top: { style: "medium", color: { argb: "FFFF6600" } } }
  sheet.getRow(6).height = 28
  sheet.mergeCells("B7:K7")
  sheet.getCell("B7").value = `${orders.length} ejecuciones finalizadas | Costo real total: $ ${orders.reduce((sum, order) => sum + parseMaintenanceOrderCost(order.actualCost), 0).toLocaleString("es-CL")}`
  sheet.getCell("B7").font = { name: "Calibri", size: 9, color: { argb: "FF526B94" } }
  sheet.getCell("B7").alignment = { vertical: "middle", indent: 1 }
  sheet.getRow(7).height = 22
  sheet.getRow(9).values = [undefined, ...headers]
  sheet.getRow(9).height = 28
  sheet.getRow(9).eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF102372" } }
    cell.font = { size: 9, bold: true, color: { argb: "FFFFFFFF" } }
    cell.alignment = { wrapText: true, vertical: "middle", horizontal: "left", indent: 1 }
  })
  orders.forEach((order, index) => {
    const row = sheet.getRow(index + 10)
    row.values = [undefined, ...values(order).map(value => value ?? "Sin registro")]
    row.height = 26
    row.eachCell(cell => {
      cell.font = { name: "Calibri", size: 9, color: { argb: "FF102372" } }
      cell.alignment = { wrapText: true, vertical: "middle", horizontal: "left", indent: 1 }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index % 2 ? "FFF7F9FC" : "FFFFFFFF" } }
      cell.border = { bottom: { style: "thin", color: { argb: "FFD8E0EB" } } }
    })
    for (const column of [9, 10]) row.getCell(column).alignment = { vertical: "middle", horizontal: "right", indent: 1 }
  })
  sheet.getColumn(9).numFmt = '"$" #,##0'
  sheet.getColumn(10).numFmt = '"$" #,##0'
  sheet.autoFilter = "B9:K9"
  sheet.pageSetup = { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:9", printArea: `A1:L${Math.max(10, orders.length + 9)}` }
  sheet.headerFooter.oddFooter = "&LSinergy Group&RPagina &P de &N"
  for (let column = 13; column <= 16384; column += 1) sheet.getColumn(column).hidden = true
  return workbook
}

export const createMaintenanceHistoryPdf = async (orders, vehicle) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
  const document = new jsPDF({ orientation: "landscape" })
  const brand = await getReportBrandImageDataUrl().catch(() => "")
  const generated = generatedAt()
  autoTable(document, {
    startY: 43, margin: { top: 43, bottom: 17, left: 14, right: 14 }, theme: "grid",
    head: [headers], body: orders.map(order => values(order).map((value, index) => index === 7 || index === 8 ? `$ ${value.toLocaleString("es-CL")}` : String(value ?? "Sin registro"))),
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [16, 35, 114], overflow: "linebreak" },
    headStyles: { fillColor: [16, 35, 114], textColor: [255, 255, 255], fontStyle: "bold" }, showHead: "everyPage",
    alternateRowStyles: { fillColor: [247, 249, 252] }, rowPageBreak: "avoid",
    willDrawPage: () => {
      if (brand) document.addImage(brand, "PNG", 14, 7, 38, 12, undefined, "FAST")
      document.setFontSize(13)
      document.setFont("helvetica", "bold")
      document.setTextColor(16, 35, 114)
      document.text("HISTORIAL DE MANTENCIONES DEL VEHICULO", 63, 13)
      document.setFontSize(8)
      document.setFont("helvetica", "normal")
      document.text(`Generado: ${generated}`, 63, 21)
      document.setDrawColor(255, 102, 0)
      document.line(14, 28, 283, 28)
      document.text(document.splitTextToSize(`${vehicle.plate || "-"} | ${vehicle.assetName || vehicle.name || "Vehiculo"} | ${orders.length} ejecuciones | Costo real: $ ${orders.reduce((sum, order) => sum + parseMaintenanceOrderCost(order.actualCost), 0).toLocaleString("es-CL")}`, 269), 14, 35)
    },
  })
  const pages = document.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    document.setPage(page)
    document.setFontSize(8)
    document.text(`Sinergy Group | Pagina ${page} de ${pages}`, 283, 204, { align: "right" })
  }
  return document
}

export const exportMaintenanceHistory = async (orders, vehicle, format, context = {}) => {
  const filename = `historial-${String(vehicle.plate || "vehiculo").replace(/[^a-z0-9-]/gi, "_")}`
  if (format === "pdf") {
    const document = await createMaintenanceHistoryPdf(orders, vehicle)
    document.save(`${filename}.pdf`)
  } else {
    const workbook = await createMaintenanceHistoryWorkbook(orders, vehicle, context)
    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${filename}.xlsx`)
  }
}
