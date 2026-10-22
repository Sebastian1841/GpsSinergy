import test from "node:test"
import assert from "node:assert/strict"
import { createDriverLicenseWorkbook } from "./driverLicenseExcelExport.js"

test("driver Excel preserves filtered inputs, current licenses and archived photos metadata", async () => {
  const rows = [
    {
      name: "Conductor prueba",
      rut: "12.345.678-9",
      phone: "+56 9 1234 5678",
      classes: ["B", "A4"],
      expiresAt: "2026-10-20",
      photos: { front: { storageId: "local-image" } },
      history: [
        {
          classes: ["B"],
          expiresAt: "2023-10-20",
          renewedAt: "2023-10-18T12:00:00Z",
          renewedBy: "Cliente",
          photos: { back: { storageId: "old-image" } },
        },
      ],
    },
  ]
  const original = JSON.stringify(rows)
  const workbook = await createDriverLicenseWorkbook(rows, {
    companyName: "Empresa",
    today: "2026-10-21",
    filters: "Vencidos",
  })
  assert.equal(workbook.worksheets.length, 2)
  const sheet = workbook.getWorksheet("Conductores")
  assert.equal(sheet.getCell("B7").value, "Conductor prueba")
  assert.equal(sheet.getCell("E7").value, "B, A4")
  assert.equal(sheet.getCell("G7").value, "Vencida")
  assert.equal(sheet.getCell("H7").value, "Adjunta")
  assert.equal(sheet.getCell("I7").value, "Sin foto")
  assert.equal(sheet.rowCount, 7)
  assert.equal(sheet.getImages().length, 1)
  const history = workbook.getWorksheet("Licencias anteriores")
  assert.equal(history.getCell("E7").value, "20-10-2023")
  assert.equal(history.getCell("G7").value, "Cliente")
  assert.equal(history.getCell("I7").value, "Adjunta")
  for (const report of [sheet, history]) {
    assert.equal(report.getColumn("A").width, report.getColumn("J").width)
    assert.equal(report.views[0].zoomScale, 85)
    assert.equal(report.views[0].ySplit, 6)
    assert.equal(report.getCell("B6").fill.fgColor.argb, "FF102372")
    assert.equal(report.getCell("I4").border.bottom.color.argb, "FFFF6600")
    assert.equal(report.getCell("C1").font.size, 17)
    assert.equal(report.getCell("B7").font.size, 12)
    assert.equal(report.pageSetup.margins.left, report.pageSetup.margins.right)
    assert.equal(report.headerFooter.oddFooter, "&LSinergy Group&RPagina &P de &N")
  }
  assert.ok((await workbook.xlsx.writeBuffer()).byteLength > 0)
  assert.equal(JSON.stringify(rows), original)
})

test("driver Excel writes a valid empty history and exports more than one UI page", async () => {
  const rows = Array.from({ length: 24 }, (_, index) => ({
    name: `Conductor ${index}`,
    rut: String(index),
    classes: ["B"],
    expiresAt: "2027-01-01",
    history: [],
  }))
  const workbook = await createDriverLicenseWorkbook(rows, { today: "2026-10-21", brandImage: "" })
  assert.equal(workbook.getWorksheet("Conductores").getCell("B30").value, "Conductor 23")
  assert.equal(workbook.getWorksheet("Licencias anteriores").getCell("B7").value, null)
  assert.ok((await workbook.xlsx.writeBuffer()).byteLength > 0)
})

test("report columns adapt to export viewport while preserving equal narrow gutters", async () => {
  const narrow = await createDriverLicenseWorkbook([], { brandImage: "", reportWidthPx: 1400 })
  const wide = await createDriverLicenseWorkbook([], { brandImage: "", reportWidthPx: 1900 })
  for (const name of ["Conductores", "Licencias anteriores"]) {
    const sheet = wide.getWorksheet(name)
    assert.ok(sheet.getColumn("B").width > narrow.getWorksheet(name).getColumn("B").width)
    assert.equal(sheet.getColumn("A").width, 3)
    assert.equal(sheet.getColumn("J").width, 3)
    const pixels = sheet.columns.reduce((sum, column) => sum + column.width * 7 + 5, 0) * 0.85
    assert.ok(Math.abs(pixels - 1900) < 2)
  }
})
