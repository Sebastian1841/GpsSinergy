import { getReportBrandImageDataUrl } from "../../utils/reports/export/reportBranding.js"
import {
  driverToday,
  licenseDateLabel,
  licenseState,
} from "../../utils/maintenance/driverLicenseUtils.js"

export async function createDriverLicensePdf(
  rows,
  { companyName = "", today = driverToday(), filters = "Todos los conductores", brandImage } = {},
) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ])
  const document = new jsPDF({ orientation: "landscape", format: "a4" })
  document.setProperties({ title: "Conductores y licencias", author: "Sinergy Group" })
  const brand = brandImage === undefined ? await getReportBrandImageDataUrl() : brandImage
  const navy = [16, 35, 114],
    muted = [82, 107, 148]
  const context = document.splitTextToSize(
    `${companyName} | ${rows.length} conductores | ${filters}`,
    269,
  )
  const tableTop = Math.max(42, 34 + context.length * 4 + 4)
  const header = (section) => {
    if (brand) document.addImage(brand, "PNG", 14, 7, 38, 12, undefined, "FAST")
    document.setTextColor(...navy)
    document.setFont("helvetica", "bold")
    document.setFontSize(13)
    document.text(section, 63, 13)
    document.setFont("helvetica", "normal")
    document.setFontSize(8)
    document.setTextColor(...muted)
    document.text(`Conductores y licencias | Generado: ${licenseDateLabel(today)}`, 63, 21)
    document.setDrawColor(...navy)
    document.setLineWidth(0.6)
    document.line(14, 28, 256, 28)
    document.setDrawColor(255, 102, 0)
    document.line(256, 28, 283, 28)
    document.setFontSize(8)
    document.text(context, 14, 34)
  }
  const table = (title, headers, body) =>
    autoTable(document, {
      startY: tableTop,
      margin: { top: tableTop, bottom: 18, left: 14, right: 14 },
      head: [headers],
      body: body.length
        ? body
        : [
            [
              {
                content: "Sin licencias anteriores para estos conductores",
                colSpan: headers.length,
              },
            ],
          ],
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2.5,
        overflow: "linebreak",
        textColor: navy,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 251, 253] },
      columnStyles: { 0: { cellWidth: 48, fontStyle: "bold" }, 1: { cellWidth: 28 } },
      rowPageBreak: "avoid",
      showHead: "everyPage",
      willDrawPage: () => header(title),
    })
  table(
    "REPORTE DE CONDUCTORES Y LICENCIAS",
    [
      "Conductor",
      "RUT",
      "Telefono",
      "Clases",
      "Vencimiento",
      "Estado",
      "Foto frente",
      "Foto reverso",
    ],
    rows.map((row) => [
      row.name,
      row.rut,
      row.phone || "No registrado",
      row.classes.join(", "),
      licenseDateLabel(row.expiresAt),
      licenseState(row.expiresAt, today).label,
      row.photos?.front ? "Adjunta" : "Sin foto",
      row.photos?.back ? "Adjunta" : "Sin foto",
    ]),
  )
  document.addPage()
  table(
    "HISTORIAL DE LICENCIAS",
    [
      "Conductor",
      "RUT",
      "Clases anteriores",
      "Vencimiento anterior",
      "Renovada el",
      "Registrado por",
      "Foto frente",
      "Foto reverso",
    ],
    rows.flatMap((row) =>
      [...(row.history || [])]
        .reverse()
        .map((entry) => [
          row.name,
          row.rut,
          entry.classes.join(", "),
          licenseDateLabel(entry.expiresAt),
          licenseDateLabel(driverToday(entry.renewedAt)),
          entry.renewedBy || "No registrado",
          entry.photos?.front ? "Adjunta" : "Sin foto",
          entry.photos?.back ? "Adjunta" : "Sin foto",
        ]),
    ),
  )
  const pages = document.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    document.setPage(page)
    document.setFont("helvetica", "normal")
    document.setFontSize(8)
    document.setTextColor(...muted)
    document.setDrawColor(226, 232, 240)
    document.setLineWidth(0.2)
    document.line(14, 199, 283, 199)
    document.text("Sinergy Group | Conductores y licencias", 14, 204)
    document.text(`Pagina ${page} de ${pages}`, 283, 204, { align: "right" })
  }
  return document
}

export async function exportDriverLicensesPdf(rows, options = {}) {
  const document = await createDriverLicensePdf(rows, options)
  if (options.shouldDownload && !options.shouldDownload()) return
  document.save(`conductores-licencias-${options.today || driverToday()}.pdf`)
}
