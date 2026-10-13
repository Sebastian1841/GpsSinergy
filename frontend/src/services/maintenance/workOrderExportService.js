import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

import {
  REPORT_BRAND,
  getReportBrandImageDataUrl,
} from "../../utils/reports/export/reportBranding.js"

const valueOrFallback = (value, fallback = "Sin registro") => value || fallback
const formatDateTime = (value) => {
  if (!value) return "Sin registro"
  if (/^\d{2}[/-]\d{2}[/-]\d{4}/.test(value)) return value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-CL")
}

export const exportWorkOrderPdf = async (order, getStatusLabel) => {
  if (!order || order.status !== "finished") return false

  const document = new jsPDF({ format: "a4", unit: "mm" })
  const navy = [16, 35, 114]
  const orange = [255, 102, 0]
  const lightBlue = [245, 247, 251]
  const muted = [100, 116, 139]
  const brandImage = await getReportBrandImageDataUrl().catch(() => "")
  const orderId = valueOrFallback(order.id || order.orderId, "OT")
  const auditRows = (order.audit || []).map((event, index) => [
    index + 1,
    valueOrFallback(event.action),
    formatDateTime(event.at),
    valueOrFallback(event.user),
    valueOrFallback(event.detail, "Estado actualizado"),
  ])
  const tableStyles = {
    cellPadding: 2.4,
    fontSize: 8,
    lineColor: [205, 214, 226],
    lineWidth: 0.25,
    textColor: navy,
  }
  const addSectionTitle = (title, y) => {
    document.setFont("helvetica", "bold")
    document.setFontSize(9)
    document.setTextColor(...navy)
    document.text(title, 14, y)
    document.setDrawColor(...orange)
    document.setLineWidth(0.55)
    document.line(14, y + 3, 196, y + 3)
  }

  if (brandImage) document.addImage(brandImage, "PNG", 72, 7, 66, 21, undefined, "FAST")
  document.setFont("helvetica", "italic")
  document.setFontSize(5.5)
  document.setTextColor(...navy)
  document.text("Monitoreo GPS y Telemetria IoT", 105, 31, { align: "center" })
  document.setDrawColor(...orange)
  document.setLineWidth(0.75)
  document.line(14, 37, 196, 37)
  document.setFont("helvetica", "bold")
  document.setFontSize(14)
  document.text("INFORME DE ORDEN DE TRABAJO", 105, 47, { align: "center" })
  document.setFont("helvetica", "normal")
  document.setFontSize(7)
  document.text(
    `${orderId} - ${valueOrFallback(order.plate)} - ${valueOrFallback(order.job)}`,
    105,
    53,
    {
      align: "center",
    },
  )

  addSectionTitle("Datos generales", 64)
  autoTable(document, {
    startY: 69,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: tableStyles,
    alternateRowStyles: { fillColor: lightBlue },
    columnStyles: { 0: { cellWidth: 44, fontStyle: "bold" } },
    body: [
      ["OT", orderId],
      ["Activo", valueOrFallback(order.plate)],
      ["Tipo de mantencion", valueOrFallback(order.job)],
      ["Prioridad", valueOrFallback(order.priority)],
      ["Estado", getStatusLabel(order.status)],
      ["OT cerrada el", formatDateTime(order.closedAt || order.scheduledDate)],
    ],
  })

  const detailsY = document.lastAutoTable.finalY + 10
  addSectionTitle("Informacion general", detailsY)
  autoTable(document, {
    startY: detailsY + 5,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: tableStyles,
    alternateRowStyles: { fillColor: lightBlue },
    columnStyles: { 0: { cellWidth: 44, fontStyle: "bold" } },
    body: [
      ["Responsable", valueOrFallback(order.owner)],
      ["Taller", valueOrFallback(order.workshop)],
      ["Fecha planificada", formatDateTime(order.plannedStartDate)],
      ["Fecha límite de ejecución", formatDateTime(order.scheduledDate)],
      ["Lectura inicial", valueOrFallback(order.openingReading)],
      ["Descripcion", valueOrFallback(order.description)],
    ],
  })

  const costsY = document.lastAutoTable.finalY + 10
  addSectionTitle("Costos de la orden", costsY)
  autoTable(document, {
    startY: costsY + 5,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { ...tableStyles, halign: "center" },
    headStyles: { fillColor: navy, fontStyle: "bold", textColor: 255 },
    head: [["Mano de obra", "Repuestos", "Otros costos", "Total estimado"]],
    body: [
      [
        valueOrFallback(order.laborCost, "$ 0"),
        valueOrFallback(order.partsCost, "$ 0"),
        valueOrFallback(order.otherCost, "$ 0"),
        valueOrFallback(order.actualCost || order.estimatedCost, "$ 0"),
      ],
    ],
  })

  const closureY = document.lastAutoTable.finalY + 10
  addSectionTitle("Detalle de cierre", closureY)
  autoTable(document, {
    startY: closureY + 5,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: tableStyles,
    alternateRowStyles: { fillColor: lightBlue },
    columnStyles: { 0: { cellWidth: 44, fontStyle: "bold" } },
    body: [
      ["Resultado", valueOrFallback(order.workPerformed)],
      ["Cerrada por", valueOrFallback(order.closedBy || order.owner)],
      ["Fecha y hora", formatDateTime(order.closedAt || order.scheduledDate)],
      ["Lectura final", valueOrFallback(order.closingReading)],
      [
        "Documentos adjuntos",
        order.evidence?.length
          ? order.evidence.map((file) => file.name).join(", ")
          : "Sin documentos adjuntos",
      ],
      [
        "Observacion",
        valueOrFallback(order.observations, "Cierre completado sin observaciones adicionales."),
      ],
    ],
  })

  if (auditRows.length) {
    const estimatedAuditHeight = 13 + auditRows.length * 7
    let auditY = document.lastAutoTable.finalY + 10
    if (auditY + estimatedAuditHeight > 278) {
      document.addPage()
      auditY = 18
    }
    addSectionTitle("Trazabilidad de la orden", auditY)
    autoTable(document, {
      startY: auditY + 5,
      theme: "grid",
      margin: { left: 14, right: 14, bottom: 16 },
      styles: tableStyles,
      alternateRowStyles: { fillColor: lightBlue },
      headStyles: { fillColor: navy, fontStyle: "bold", textColor: 255 },
      head: [["#", "Proceso", "Fecha y hora", "Usuario", "Detalle"]],
      body: auditRows,
      columnStyles: { 0: { cellWidth: 9, halign: "center" } },
    })
  }

  const pageCount = document.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    document.setPage(page)
    document.setFont("helvetica", "normal")
    document.setFontSize(6.5)
    document.setTextColor(...muted)
    document.text(`${REPORT_BRAND.name} - ${orderId} - Pagina ${page} de ${pageCount}`, 196, 292, {
      align: "right",
    })
  }

  const filename = String(orderId).replace(/[^a-z0-9_-]/gi, "-")
  document.save(`informe-orden-trabajo-${filename}.pdf`)
  return true
}
