import { getReportBrandImageDataUrl } from "../../utils/reports/export/reportBranding.js"

export const createMaintenanceFleetPdf = async (rows, context = {}) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
  const document = new jsPDF({ orientation: "landscape", format: "a4" })
  const navy = [16, 35, 114]
  const brand = await getReportBrandImageDataUrl().catch(() => "")
  const generated = new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" }).format(new Date())
  const planCount = rows.reduce((sum, row) => sum + row.plans.length, 0)
  const drawnPages = new Set()
  const header = () => {
    const page = document.getCurrentPageInfo().pageNumber
    if (drawnPages.has(page)) return
    drawnPages.add(page)
    if (brand) document.addImage(brand, "PNG", 14, 7, 38, 12, undefined, "FAST")
    document.setDrawColor(218, 226, 236)
    document.setLineWidth(.2)
    document.line(57, 7, 57, 24)
    document.setTextColor(...navy)
    document.setFont("helvetica", "bold")
    document.setFontSize(13)
    document.text("REPORTE DE VEHICULOS Y MANTENCIONES", 63, 13)
    document.setFont("helvetica", "normal")
    document.setFontSize(8)
    document.setTextColor(82, 107, 148)
    document.text(`Informe de mantenciones | Generado: ${generated}`, 63, 21)
    document.setDrawColor(...navy)
    document.setLineWidth(.6)
    document.line(14, 28, 256, 28)
    document.setDrawColor(255, 102, 0)
    document.line(256, 28, 283, 28)
    document.setFontSize(7.5)
    document.text(document.splitTextToSize(`${context.company || "Todas las empresas"} | ${rows.length} vehiculos seleccionados | ${planCount} planes activos`, 269), 14, 34)
  }
  header()
  let nextY = 41
  for (const row of rows) {
    if (nextY > 158) {
      document.addPage()
      nextY = 41
    }
    const bandStyle = { fillColor: [220, 231, 244], textColor: navy, fontStyle: "bold", fontSize: 8, cellPadding: 3 }
    const bandCell = (content, colSpan) => ({ content, colSpan, styles: bandStyle })
    const startPage = document.getCurrentPageInfo().pageNumber
    autoTable(document, {
      startY: nextY, margin: { top: 41, bottom: 18, left: 14, right: 14 }, theme: "grid",
      head: [[
        bandCell(`${row.plate || "Sin patente"} | ${row.name || "Vehiculo"}`, 3),
        bandCell(`Empresa: ${row.company || "-"}`, 3),
        bandCell(`Odometro: ${Number(row.odometer || 0).toLocaleString("es-CL")} km | Horometro: ${row.hourMeter || "-"}`, 3),
        bandCell(`${row.plans.length} planes activos`, 2),
      ], ["Mantencion", "Criterio", "Intervalo", "Alerta", "Ultima lectura", "Lectura actual", "Proximo vencimiento", "Restante", "Estado plan", "OT actual", "Estado OT"]],
      body: row.plans.length ? row.plans.map(plan => [plan.name, plan.criterion, plan.interval, plan.alert, plan.lastReading, plan.currentReading, plan.nextDue, plan.remaining, plan.status, plan.order, plan.orderStatus].map(value => String(value ?? "-"))) : [[{ content: "Sin planes activos configurados", colSpan: 11 }]],
      styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak", textColor: navy, lineColor: [218, 226, 236], lineWidth: .1 },
      columnStyles: { 0: { cellWidth: 40, fontStyle: "bold" }, 1: { cellWidth: 18 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 }, 4: { cellWidth: 24 }, 5: { cellWidth: 24 }, 6: { cellWidth: 28 }, 7: { cellWidth: 28 }, 8: { cellWidth: 25 }, 9: { cellWidth: 20 }, 10: { cellWidth: 22 } },
      headStyles: { fillColor: navy }, alternateRowStyles: { fillColor: [247, 249, 252] },
      rowPageBreak: "avoid", showHead: "everyPage", willDrawPage: header,
      didDrawPage: data => {
        document.setDrawColor(255, 102, 0)
        document.setLineWidth(.5)
        const top = document.getCurrentPageInfo().pageNumber === startPage ? nextY : data.settings.margin.top
        document.line(14, top, 283, top)
      },
      didParseCell: data => {
        if (data.section !== "body" || data.column.index !== 8) return
        const status = String(data.cell.raw).toLowerCase()
        data.cell.styles.fontStyle = "bold"
        if (status.includes("venc")) {
          data.cell.styles.textColor = [217, 0, 54]
          data.cell.styles.fillColor = [255, 237, 241]
        } else if (status.includes("prox")) {
          data.cell.styles.textColor = [184, 90, 0]
          data.cell.styles.fillColor = [255, 245, 223]
        } else if (status.includes("dia")) {
          data.cell.styles.textColor = [0, 132, 96]
          data.cell.styles.fillColor = [234, 248, 242]
        }
      },
    })
    const bottom = document.lastAutoTable.finalY
    document.setDrawColor(...navy)
    document.setLineWidth(.2)
    document.line(14, bottom, 283, bottom)
    nextY = bottom + 6
  }
  const count = document.getNumberOfPages()
  for (let page = 1; page <= count; page += 1) {
    document.setPage(page)
    document.setFontSize(8)
    document.setFont("helvetica", "normal")
    document.setTextColor(82, 107, 148)
    document.setDrawColor(218, 226, 236)
    document.setLineWidth(.2)
    document.line(14, 199, 283, 199)
    document.text("Sinergy Group | Reporte de mantenciones", 14, 204)
    document.text(`Pagina ${page} de ${count}`, 283, 204, { align: "right" })
  }
  return document
}

export const exportMaintenanceFleetPdf = async (rows, context) => {
  const document = await createMaintenanceFleetPdf(rows, context)
  document.save("flota-mantenciones.pdf")
}
