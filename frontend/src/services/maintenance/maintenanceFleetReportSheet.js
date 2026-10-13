const colors = { navy: "FF102372", muted: "FF526B94", border: "FFD8E0EB", light: "FFEDF3F9", orange: "FFFF6600" }
const statusColors = (status) => {
  const value = String(status || "").toLowerCase()
  if (value.includes("venc")) return { text: "FFD90036", fill: "FFFFEDF1" }
  if (value.includes("prox")) return { text: "FFB85A00", fill: "FFFFF5DF" }
  if (value.includes("dia")) return { text: "FF008460", fill: "FFEAF8F2" }
  return { text: colors.muted, fill: colors.light }
}

export const addMaintenanceFleetReportSheet = (workbook, rows, context, brand) => {
  const sheet = workbook.addWorksheet("Reporte", { properties: { tabColor: { argb: colors.orange } } })
  const widths = [32, 14, 15, 20, 18, 18, 22, 23, 18, 14, 18]
  const zoom = 85
  const requestedWidth = Number(context.reportWidthPx)
  const targetWidth = Number.isFinite(requestedWidth) && requestedWidth > 0 ? requestedWidth : 1800
  // Excel column widths are font-based; approximate pixels at the saved zoom without enlarging text.
  const gutterPixels = (3 * 7 + 5) * 2
  const scale = Math.max(0.8, (((targetWidth * 1.02) / (zoom / 100)) - gutterPixels - widths.length * 5) / (widths.reduce((sum, width) => sum + width, 0) * 7))
  sheet.columns = [3, ...widths.map(width => Math.round(width * scale * 100) / 100)].map(width => ({ width }))
  sheet.properties.defaultRowHeight = 18
  sheet.views = [{ showGridLines: false, state: "frozen", ySplit: 6, zoomScale: zoom }]
  sheet.mergeCells("B1:B3")
  sheet.getCell("B1").border = { right: { style: "thin", color: { argb: colors.border } } }
  if (brand) {
    const imageId = workbook.addImage({ base64: brand, extension: "png" })
    sheet.addImage(imageId, { tl: { col: 1.15, row: 0.3 }, ext: { width: 160, height: 51 } })
  }
  sheet.mergeCells("C1:L2")
  sheet.getCell("C1").value = "REPORTE DE VEHICULOS Y MANTENCIONES"
  sheet.getCell("C1").font = { name: "Calibri", size: 16, bold: true, color: { argb: colors.navy } }
  sheet.getCell("C1").alignment = { vertical: "middle", wrapText: true, indent: 1 }
  sheet.mergeCells("C3:E3")
  sheet.getCell("C3").value = "Informe de mantenciones"
  sheet.getCell("C3").border = { right: { style: "thin", color: { argb: colors.border } } }
  sheet.mergeCells("F3:L3")
  sheet.getCell("F3").value = `Generado: ${new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" }).format(new Date())}`
  for (const address of ["C3", "F3"]) {
    sheet.getCell(address).font = { name: "Calibri", size: 9, color: { argb: colors.muted } }
    sheet.getCell(address).alignment = { vertical: "middle", indent: 1 }
  }
  for (let row = 1; row <= 3; row += 1) sheet.getRow(row).height = row === 3 ? 20 : 18
  sheet.getRow(4).height = 6
  sheet.getRow(5).height = 6
  sheet.getRow(6).height = 18
  sheet.getRow(7).height = 6
  for (let col = 2; col <= 12; col += 1) sheet.getCell(4, col).border = { bottom: { style: "medium", color: { argb: col > 10 ? colors.orange : colors.navy } } }
  sheet.mergeCells("B6:L6")
  sheet.getCell("B6").value = `${context.company || "Todas las empresas"} | ${rows.length} vehiculos seleccionados | ${rows.reduce((sum, row) => sum + row.plans.length, 0)} planes activos`
  sheet.getCell("B6").font = { size: 9, color: { argb: colors.muted } }
  const headers = ["Mantencion", "Criterio", "Intervalo", "Alerta", "Ultima lectura", "Lectura actual", "Proximo vencimiento", "Restante", "Estado del plan", "OT actual", "Estado de OT"]
  let line = 8
  for (const vehicle of rows) {
    if (line > 8) sheet.getRow(line).addPageBreak()
    const bands = [
      [1, 3, `${vehicle.plate || "Sin patente"} | ${vehicle.name || "Vehiculo"}`],
      [4, 6, `Empresa: ${vehicle.company || "-"}`],
      [7, 9, `Odometro: ${Number(vehicle.odometer || 0).toLocaleString("es-CL")} km | Horometro: ${vehicle.hourMeter || "-"}`],
      [10, 11, `${vehicle.plans.length} planes activos`],
    ]
    for (const [start, end, text] of bands) {
      sheet.mergeCells(line, start + 1, line, end + 1)
      const cell = sheet.getCell(line, start + 1)
      cell.value = text
      cell.font = { name: "Calibri", size: start === 1 ? 11 : 10, bold: true, color: { argb: colors.navy } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCE7F4" } }
      cell.border = { top: { style: "medium", color: { argb: colors.orange } } }
      cell.alignment = { vertical: "middle", wrapText: true }
    }
    sheet.getRow(line).height = 30
    line += 1
    const header = sheet.getRow(line++)
    header.values = [undefined, ...headers]
    header.height = 24
    header.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.navy } }
      cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: "FFFFFFFF" } }
      cell.alignment = { vertical: "middle", wrapText: true }
    })
    if (!vehicle.plans.length) {
      sheet.mergeCells(line, 2, line, 12)
      sheet.getCell(line++, 2).value = "Sin planes activos configurados"
    }
    vehicle.plans.forEach((plan, index) => {
      const data = sheet.getRow(line++)
      data.values = [undefined, ...[plan.name, plan.criterion, plan.interval, plan.alert, plan.lastReading, plan.currentReading, plan.nextDue, plan.remaining, plan.status, plan.order, plan.orderStatus].map(value => String(value ?? "-"))]
      data.height = Math.max(22, ...data.values.slice(2).map((value, column) => Math.ceil(String(value).length / ((sheet.getColumn(column + 2).width - 2) * 11 / 9)) * 11 + 6))
      data.eachCell((cell, col) => {
        cell.font = { name: "Calibri", size: 9, bold: col === 2, color: { argb: colors.navy } }
        cell.alignment = { vertical: "middle", wrapText: true }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index % 2 ? "FFF7F9FC" : "FFFFFFFF" } }
        cell.border = { bottom: { style: "thin", color: { argb: colors.border } } }
      })
      const status = statusColors(plan.status)
      data.getCell(10).fill = { type: "pattern", pattern: "solid", fgColor: { argb: status.fill } }
      data.getCell(10).font = { name: "Calibri", size: 9, bold: true, color: { argb: status.text } }
    })
    for (let col = 2; col <= 12; col += 1) {
      sheet.getCell(line - 1, col).border = {
        ...sheet.getCell(line - 1, col).border,
        bottom: { style: "thin", color: { argb: colors.navy } },
      }
    }
    sheet.getRow(line).height = 10
    sheet.getRow(line + 1).height = 8
    line += 2
  }
  sheet.getColumn(13).width = sheet.getColumn(1).width
  sheet.pageSetup = { orientation: "landscape", paperSize: 8, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:6", printArea: `A1:M${line - 1}` }
  sheet.headerFooter.oddFooter = "&LSinergy Group&RPagina &P de &N"
  // Preserve matching left/right gutters before hiding the unused grid.
  for (let column = 14; column <= 16384; column += 1) sheet.getColumn(column).hidden = true
  return sheet
}
