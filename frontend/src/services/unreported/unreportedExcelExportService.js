import { downloadBlob } from "../itinerarios/itineraryExportFormatUtils.js"

export const createUnreportedExcelWorkbook = async (rows) => {
  const module = await import("exceljs")
  const ExcelJS = module.default || module
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Equipos sin reporte")
  sheet.columns = [
    { header: "Equipo", key: "name", width: 30 },
    { header: "IMEI", key: "imei", width: 22 },
    { header: "Empresa", key: "company", width: 30 },
    { header: "Estado", key: "status", width: 26 },
    { header: "Sin reportar", key: "duration", width: 20 },
    { header: "Ultimo reporte", key: "lastReport", width: 24 },
    { header: "Al cortarse", key: "power", width: 55 },
    { header: "Ubicacion", key: "location", width: 45 },
  ]
  for (const row of rows) {
    const values = {}
    for (const { key } of sheet.columns) values[key] = String(row[key] ?? "")
    sheet.addRow(values)
  }
  sheet.getColumn("imei").numFmt = "@"
  sheet.views = [{ state: "frozen", ySplit: 1 }]
  sheet.autoFilter = "A1:H1"
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF102372" } }
  })
  return workbook
}

export const exportUnreportedExcel = async (rows) => {
  const workbook = await createUnreportedExcelWorkbook(rows)
  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }), "equipos-sin-reporte.xlsx")
}
