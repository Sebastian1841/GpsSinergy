import assert from "node:assert/strict"
import test from "node:test"
import { createUnreportedExcelWorkbook } from "./unreportedExcelExportService.js"

test("unreported Excel exports all supplied rows in order with text IMEIs and safe literal values", async () => {
  const rows = Array.from({ length: 25 }, (_, index) => ({
    name: index === 0 ? "=1+1" : `Equipo ${index}`,
    imei: "001234567890123", company: "Empresa", status: "Sin conexion",
    duration: "14 horas", lastReport: "Sin reporte", power: "Sin datos", location: "Norte",
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
})
