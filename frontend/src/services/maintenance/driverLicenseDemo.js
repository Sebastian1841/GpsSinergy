import { driverToday } from "../../utils/maintenance/driverLicenseUtils.js"
import { formatCompanyRut } from "../../utils/companies/companyRut.js"
import {
  saveMaintenanceEvidenceFile,
  deleteMaintenanceEvidence,
} from "./maintenanceEvidenceStorage.js"

const examples = [
  ["Juan Sebastian Rivas", ["A4"], 180, "notified"],
  ["Carlos Perez", ["A2", "B"], 95, "processing"],
  ["Mario Fernandez", ["B"], 120, ""],
  ["Andres Lopez", ["A4"], 240, ""],
  ["Diego Castro", ["A5"], 12, "appointment"],
  ["Ricardo Vargas", ["B"], 25, "notified"],
  ["Tomas Medina", ["A4"], -10, "not_contacted"],
  ["Javier Gutierrez", ["B"], -23, "processing"],
  ["Claudia Morales", ["A3", "B"], 60, ""],
  ["Paula Soto", ["B", "C"], 7, "appointment"],
  ["Luis Rojas", ["A5"], -3, "notified"],
  ["Ana Fuentes", ["B"], 365, ""],
  ["Pedro Silva", ["A4", "D"], 1, "not_contacted"],
  ["Daniela Torres", ["B"], 85, ""],
  ["Felipe Munoz", ["A2"], -35, "appointment"],
]

// Stable synthetic RUTs make repeated loads additive without replacing user records.
export async function seedDriverLicenseDemo(store, today = driverToday(), isCurrent = () => true) {
  const date = (days) => new Date(Date.parse(today) + days * 86400000).toISOString().slice(0, 10)
  const existing = new Set(store.records.value.map((row) => row.rut))
  for (const [index, [name, classes, days, result]] of examples.entries()) {
    if (!isCurrent()) return
    const rut = formatCompanyRut(`${90000001 + index}K`)
    if (existing.has(rut)) continue
    const row = await store.save({
      name: `${name} (DEMO)`,
      rut,
      classes,
      expiresAt: date(days),
      phone: "",
    })
    if (result && isCurrent())
      await store.addManagement(row.id, {
        result,
        appointmentDate: result === "appointment" ? date(5 + index) : "",
        observation:
          "Gestion ficticia para visualizar el modulo. No corresponde a una persona real.",
      })
    existing.add(rut)
  }
  const demoRuts = new Set(examples.map((_row, index) => formatCompanyRut(`${90000001 + index}K`)))
  if (!isCurrent()) return
  await store.seedDemoHistory(
    store.records.value.filter((row) => demoRuts.has(row.rut)).map((row) => row.id),
  )
}

export async function seedDriverHistoryPhotos(store, isCurrent = () => true) {
  const row = store.records.value.find(
    (item) => item.rut === "90.000.015-K" && item.name.endsWith(" (DEMO)"),
  )
  const entry = row?.history.findLast((item) => item.renewedBy === "Datos de demostracion")
  if (!entry) return
  const uploaded = []
  const photos = {}
  try {
    for (const [side, label] of [
      ["front", "FRENTE"],
      ["back", "REVERSO"],
    ]) {
      if (entry.photos?.[side]) continue
      if (!isCurrent()) return
      const canvas = document.createElement("canvas")
      canvas.width = 1000
      canvas.height = 620
      const context = canvas.getContext("2d")
      if (!context) throw new Error("No se pudo crear la imagen de ejemplo.")
      context.fillStyle = "#f1f5fa"
      context.fillRect(0, 0, 1000, 620)
      context.fillStyle = "#102372"
      context.fillRect(0, 0, 1000, 112)
      context.font = "bold 32px Arial"
      context.fillStyle = "#ffffff"
      context.fillText(`LICENCIA DE EJEMPLO - ${label}`, 40, 70)
      context.fillStyle = "#102372"
      context.font = "bold 34px Arial"
      context.fillText("Felipe Munoz (DEMO)", 40, 190)
      context.font = "26px Arial"
      context.fillText(`Clases: ${entry.classes.join(", ")}`, 40, 255)
      context.fillText(
        `Vencimiento anterior: ${entry.expiresAt.split("-").reverse().join("-")}`,
        40,
        310,
      )
      context.fillText(
        side === "front" ? "Fotografia de prueba del frente" : "Fotografia de prueba del reverso",
        40,
        390,
      )
      context.fillStyle = "#ff6600"
      context.fillRect(0, 480, 1000, 140)
      context.fillStyle = "#ffffff"
      context.font = "bold 32px Arial"
      context.fillText("DEMOSTRACION - SIN VALIDEZ", 40, 545)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"))
      if (!blob) throw new Error("No se pudo crear la imagen de ejemplo.")
      const photo = await saveMaintenanceEvidenceFile(
        new File([blob], `licencia-demo-${side}.png`, { type: "image/png" }),
      )
      photos[side] = photo
      uploaded.push(photo.storageId)
    }
    if (!isCurrent() || !uploaded.length) return
    await store.addDemoHistoryPhotos(row.id, entry.id, photos)
    uploaded.length = 0
  } finally {
    await Promise.allSettled(uploaded.map(deleteMaintenanceEvidence))
  }
}
