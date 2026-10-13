import { downloadBlob } from "../itinerarios/itineraryExportFormatUtils.js"
import { getReportBrandImageDataUrl } from "../../utils/reports/export/reportBranding.js"
import { addMaintenanceFleetReportSheet } from "./maintenanceFleetReportSheet.js"

export const createMaintenanceFleetWorkbook = async (rows, context = {}) => {
  const module = await import("exceljs")
  const ExcelJS = module.default || module
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Sinergy Group"
  workbook.title = "Flota y mantenciones activas"
  workbook.subject = context.company || "Flota"
  const summary = workbook.addWorksheet("Resumen")
  summary.columns = Array.from({ length: 6 }, () => ({ width: 20 }))
  summary.views = [{ showGridLines: false }]
  summary.mergeCells("A1:D2")
  summary.getCell("A1").value = "FLOTA Y MANTENCIONES ACTIVAS"
  summary.getCell("A1").font = { name: "Calibri", size: 20, bold: true, color: { argb: "FF102372" } }
  summary.getCell("A1").alignment = { vertical: "middle", wrapText: true }
  summary.getRow(1).height = 26
  summary.getRow(2).height = 24
  const brand = await getReportBrandImageDataUrl().catch(() => "")
  const report = addMaintenanceFleetReportSheet(workbook, rows, context, brand)
  report.orderNo = 0
  workbook.views = [{ activeTab: 0 }]
  if (brand) {
    const imageId = workbook.addImage({ base64: brand, extension: "png" })
    summary.addImage(imageId, { tl: { col: 4, row: 0 }, ext: { width: 180, height: 57 } })
  }
  summary.mergeCells("A3:F3")
  summary.getCell("A3").value = context.company || "Todas las empresas"
  summary.getCell("A3").font = { size: 12, bold: true, color: { argb: "FF526B94" } }
  summary.mergeCells("A4:F4")
  summary.getCell("A4").value = `Generado: ${new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" }).format(new Date())}`
  const allPlans = rows.flatMap(row => row.plans)
  const counts = new Map()
  for (const plan of allPlans) counts.set(plan.status || "Sin estado", (counts.get(plan.status || "Sin estado") || 0) + 1)
  const metrics = [rows.length, allPlans.length, allPlans.filter(plan => plan.order && plan.order !== "Sin OT").length]
  for (let index = 0; index < 3; index += 1) {
    const from = index * 2 + 1
    summary.mergeCells(6, from, 6, from + 1)
    summary.mergeCells(7, from, 8, from + 1)
    const label = summary.getCell(6, from)
    label.value = ["VEHICULOS", "PLANES ACTIVOS", "PLANES CON OT"][index]
    label.font = { size: 10, bold: true, color: { argb: "FF526B94" } }
    const value = summary.getCell(7, from)
    value.value = metrics[index]
    value.font = { size: 26, bold: true, color: { argb: "FF102372" } }
    for (const cell of [label, value]) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDF3F9" } }
      cell.alignment = { vertical: "middle", horizontal: "center" }
    }
  }
  summary.getRow(7).height = 26
  summary.getRow(8).height = 24
  summary.mergeCells("A10:F10")
  summary.getCell("A10").value = "DISTRIBUCION DE PLANES POR ESTADO"
  summary.getCell("A10").font = { bold: true, color: { argb: "FF102372" } }
  let summaryRow = 12
  for (const [status, count] of counts) {
    summary.mergeCells(summaryRow, 1, summaryRow, 4)
    summary.getCell(summaryRow, 1).value = status
    summary.getCell(summaryRow, 5).value = count
    summary.getCell(summaryRow, 6).value = allPlans.length ? count / allPlans.length : 0
    summary.getCell(summaryRow, 6).numFmt = "0%"
    summary.getRow(summaryRow).height = 26
    summaryRow += 1
  }
  const vehicles = workbook.addWorksheet("Vehiculos")
  vehicles.columns = [
    { header: "Patente", key: "plate", width: 18 },
    { header: "Nombre", key: "name", width: 32 },
    { header: "Empresa", key: "company", width: 32 },
    { header: "Lectura actual (km)", key: "odometer", width: 24 },
    { header: "Planes", key: "count", width: 12 },
    { header: "Horometro actual", key: "hourMeter", width: 24 },
  ]
  const plans = workbook.addWorksheet("Planes")
  plans.columns = [
    { header: "Patente", key: "plate", width: 18 },
    { header: "Mantencion", key: "name", width: 36 },
    { header: "Criterio", key: "criterion", width: 20 },
    { header: "Ultima lectura", key: "lastReading", width: 24 },
    { header: "Proximo vencimiento", key: "nextDue", width: 30 },
    { header: "Restante", key: "remaining", width: 30 },
    { header: "Estado", key: "status", width: 22 },
    { header: "OT actual", key: "order", width: 18 },
    { header: "Intervalo", key: "interval", width: 24 },
    { header: "Estado OT", key: "orderStatus", width: 24 },
    { header: "Empresa", key: "company", width: 32 },
    { header: "Vehiculo", key: "vehicle", width: 32 },
    { header: "Alerta", key: "alert", width: 26 },
    { header: "Lectura actual", key: "currentReading", width: 26 },
  ]
  for (const row of rows) {
    vehicles.addRow({ plate: String(row.plate ?? ""), name: String(row.name ?? ""),
      company: String(row.company ?? ""), odometer: Number(row.odometer) || 0, count: row.plans.length,
      hourMeter: String(row.hourMeter ?? "-") })
    for (const plan of row.plans) {
      const values = { plate: String(row.plate ?? ""), company: String(row.company ?? ""), vehicle: String(row.name ?? "") }
      for (const { key } of plans.columns) {
        if (!["plate", "company", "vehicle"].includes(key)) values[key] = String(plan[key] ?? "")
      }
      plans.addRow(values)
    }
  }
  for (const sheet of [vehicles, plans]) {
    sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 1, showGridLines: false }]
    sheet.properties.defaultRowHeight = 30
    sheet.properties.tabColor = { argb: sheet === vehicles ? "FF102372" : "FFFF6600" }
    const headers = sheet.columns.map(column => column.header)
    const data = []
    sheet.eachRow((row, index) => { if (index > 1) data.push(row.values.slice(1)) })
    sheet.addTable({ name: sheet === vehicles ? "FleetVehicles" : "FleetPlans", ref: "A1", headerRow: true,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: headers.map(name => ({ name, filterButton: true })), rows: data })
    sheet.eachRow((row, index) => {
      row.height = index === 1 ? 34 : 38
      row.eachCell(cell => {
        cell.font = { name: "Calibri", size: 11, color: { argb: "FF102372" }, bold: index > 1 && cell.col === 1 }
        cell.alignment = { vertical: "middle", wrapText: true }
      })
    })
    if (sheet === vehicles) sheet.getColumn("odometer").numFmt = "#,##0"
    if (sheet === plans) {
      sheet.getColumn("status").eachCell((cell, index) => {
        if (index === 1) return
        const status = String(cell.value).toLowerCase()
        const color = status.includes("venc") ? "FFD90036" : status.includes("prox") ? "FFB85A00" : status.includes("dia") ? "FF008460" : "FF526B94"
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: color } }
      })
    }
    sheet.pageSetup = { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:1" }
    sheet.headerFooter.oddFooter = "&LSinergy Group&RPagina &P de &N"
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF102372" } }
    })
  }
  return workbook
}

export const exportMaintenanceFleetExcel = async (rows, context) => {
  const workbook = await createMaintenanceFleetWorkbook(rows, context)
  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "flota-mantenciones.xlsx")
}
