import test from "node:test"
import assert from "node:assert/strict"
import { createMaintenanceHistoryWorkbook, createMaintenanceHistoryPdf } from "./maintenanceHistoryExportService.js"

test("history workbook preserves selected executions and numeric costs", async () => {
  const workbook = await createMaintenanceHistoryWorkbook([{ id: "OT-1", job: "Frenos", actualCost: 100, estimatedCost: 200, closedAt: "2026-10-08T14:35:05.875Z", scheduledDate: "2026-09-30" }], { plate: "ABC123" })
  const buffer = await workbook.xlsx.writeBuffer()
  const loaded = new workbook.constructor()
  await loaded.xlsx.load(buffer)
  const sheet = loaded.getWorksheet("Historial")
  assert.equal(sheet.getCell("B10").value, "OT-1")
  assert.equal(sheet.getCell("J10").value, 100)
  assert.equal(sheet.getColumn(1).width, sheet.getColumn(12).width)
  assert.equal(sheet.getCell("K10").value, "30-09-2026")
  assert.ok(!sheet.getCell("D10").value.includes("T14:"))
  assert.equal(sheet.getCell("C1").value, "HISTORIAL DE MANTENCIONES DEL VEHICULO")
  assert.match(sheet.getCell("F3").value, /^Generado: /)
  assert.equal(sheet.getCell("C3").value, "Informe de ejecuciones")
  assert.equal(sheet.getCell("B1").master.address, "B1")
  const wide = await createMaintenanceHistoryWorkbook([], { plate: "ABC123" }, { reportWidthPx: 2400 })
  assert.ok(wide.getWorksheet("Historial").getColumn(3).width > sheet.getColumn(3).width)
})

test("history PDF paginates long execution lists", async () => {
  const orders = Array.from({ length: 80 }, (_, index) => ({ id: `OT-${index}`, job: "Frenos", actualCost: index }))
  const document = await createMaintenanceHistoryPdf(orders, { plate: "ABC123" })
  assert.ok(document.getNumberOfPages() > 1)
  assert.ok(document.output().includes("OT-79"))
  assert.equal(document.lastAutoTable.settings.showHead, "everyPage")
  assert.deepEqual(document.lastAutoTable.head[0].cells[0].styles.textColor, [255, 255, 255])
  assert.deepEqual(document.lastAutoTable.head[0].cells[0].styles.fillColor, [16, 35, 114])
  assert.equal(document.lastAutoTable.head[0].cells[0].text[0], "OT")
})
