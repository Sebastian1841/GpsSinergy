import assert from "node:assert/strict"
import test from "node:test"
import { createUnreportedExcelWorkbook } from "./unreportedExcelExportService.js"

test("unreported Excel exports all supplied rows in order with text IMEIs and safe literal values", async () => {
  const rows = Array.from({ length: 25 }, (_, index) => ({
    name: index === 0 ? "=1+1" : `Equipo ${index}`,
    imei: "001234567890123",
    company: "Empresa",
    status: "Sin conexion",
    duration: "14 horas",
    lastReport: "Sin reporte",
    power: "Sin datos",
    location: "Norte",
    recoveredAt: "13-10-2026 12:00",
    interruption: "14 horas",
    faultAt: "12-10-2026 12:00",
    fault: "Antena danada",
    faultBy: "Operador",
    notes: [{ id: "n1", text: "Esta en taller", author: "Operador", createdAt: "2026-10-14T15:00:00Z" }],
  }))
  const workbook = await createUnreportedExcelWorkbook(rows)
  const buffer = await workbook.xlsx.writeBuffer()
  const module = await import("exceljs")
  const ExcelJS = module.default || module
  const reloaded = new ExcelJS.Workbook()
  await reloaded.xlsx.load(buffer)
  const sheet = reloaded.getWorksheet("Equipos sin reporte")
  assert.equal(sheet.rowCount, 26)
  assert.equal(sheet.getCell("A2").value, "=1+1")
  assert.equal(sheet.getCell("B2").value, "001234567890123")
  assert.equal(sheet.getCell("A26").value, "Equipo 24")
  assert.equal(sheet.getCell("C2").value, "Empresa")
  assert.equal(sheet.getCell("H2").value, "Norte")
  assert.equal(sheet.getCell("I2").value, "13-10-2026 12:00")
  assert.equal(sheet.getCell("J2").value, "14 horas")
  assert.equal(sheet.getCell("L2").value, "Antena danada")
  assert.equal(sheet.getCell("L1").value, "Falla registrada")
  assert.equal(sheet.getCell("K2").value, "12-10-2026 12:00")
  assert.equal(sheet.getCell("M2").value, "Operador")
  assert.match(sheet.getCell("P2").value, /Operador: Esta en taller/)
  assert.equal(sheet.getCell("P1").value, "Notas del equipo")
})
