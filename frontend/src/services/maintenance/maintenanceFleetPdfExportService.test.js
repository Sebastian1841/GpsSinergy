import assert from "node:assert/strict"
import test from "node:test"
import { createMaintenanceFleetPdf } from "./maintenanceFleetPdfExportService.js"

test("fleet PDF includes every vehicle and all plans across multiple pages", async () => {
  const plans = Array.from({ length: 60 }, (_, index) => ({
    name: `PLAN-${index}`, criterion: "Tiempo", interval: "12 meses", lastReading: "Sin ejecuciones",
    nextDue: "20/08/2026", remaining: "3 dias", status: index % 2 ? "Al dia" : "Proxima", order: "Sin OT", orderStatus: "-",
  }))
  const document = await createMaintenanceFleetPdf([
    { plate: "JSFG-74", name: "Camion", company: "Forestal", plans },
    { plate: "FLRB-22", plans: [] },
  ], { company: "Forestal" })
  const output = document.output()
  assert.ok(document.getNumberOfPages() >= 3)
  assert.ok(output.includes("JSFG-74"))
  assert.ok(output.includes("FLRB-22"))
  for (let index = 0; index < 60; index += 1) assert.ok(output.includes(`PLAN-${index}`))
  assert.ok(output.includes("Sin planes activos configurados"))
})

test("PDF places small vehicle blocks consecutively on a single page", async () => {
  const document = await createMaintenanceFleetPdf([
    { plate: "JSFG-74", plans: [{ name: "Permiso", status: "Al dia" }] },
    { plate: "FLRB-22", plans: [{ name: "Frenos", status: "Vencida" }] },
    { plate: "MDFR-09", plans: [] },
  ])
  assert.equal(document.getNumberOfPages(), 1)
  for (const plate of ["JSFG-74", "FLRB-22", "MDFR-09"]) assert.ok(document.output().includes(plate))
})
