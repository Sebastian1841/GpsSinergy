import test from "node:test"
import assert from "node:assert/strict"
import { createDriverLicensePdf } from "./driverLicensePdfExport.js"

test("driver PDF includes current and historical licenses and the report context", async () => {
  const rows = [
    {
      name: "Conductor prueba",
      rut: "12.345.678-9",
      classes: ["B"],
      expiresAt: "2026-10-20",
      history: [
        {
          classes: ["A4"],
          expiresAt: "2023-10-20",
          renewedAt: "2023-10-18T12:00:00Z",
          renewedBy: "Cliente",
          photos: { front: { storageId: "local-only" } },
        },
      ],
    },
  ]
  const original = JSON.stringify(rows)
  const document = await createDriverLicensePdf(rows, {
    companyName: "Empresa prueba",
    today: "2026-10-22",
    filters: "Vencidos",
    brandImage: "",
  })
  const pdf = document.output()
  assert.ok(pdf.startsWith("%PDF"))
  for (const text of [
    "REPORTE DE CONDUCTORES Y LICENCIAS",
    "HISTORIAL DE LICENCIAS",
    "Conductor prueba",
    "Empresa prueba",
    "Vencidos",
    "Vencida",
    "Cliente",
    "Adjunta",
    "20-10-2023",
    "Pagina 2 de 2",
  ])
    assert.ok(pdf.includes(text), text)
  assert.equal(document.getNumberOfPages(), 2)
  assert.ok(!pdf.includes("local-only"))
  assert.equal(JSON.stringify(rows), original)
})

test("driver PDF paginates the complete filtered set and repeats headers and footer", async () => {
  const rows = Array.from({ length: 80 }, (_, index) => ({
    name: `Conductor ${index}`,
    rut: String(index),
    classes: ["B"],
    expiresAt: "2027-01-01",
    history: [],
  }))
  const document = await createDriverLicensePdf(rows, { today: "2026-10-22" })
  const pdf = document.output()
  assert.ok(document.getNumberOfPages() > 2)
  assert.ok(pdf.includes("Conductor 79"))
  assert.ok(pdf.includes("Sin licencias anteriores para estos conductores"))
  assert.ok((pdf.match(/REPORTE DE CONDUCTORES Y LICENCIAS/g) || []).length > 1)
  assert.ok(pdf.includes(`Pagina ${document.getNumberOfPages()} de ${document.getNumberOfPages()}`))
})
