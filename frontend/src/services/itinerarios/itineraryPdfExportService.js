import {
  REPORT_BRAND,
  getReportBrandImageDataUrl,
} from "../../utils/reports/export/reportBranding.js"
import { asText } from "./itineraryExportFormatUtils.js"
import {
  getAssetTableColumns,
  getChronologicalReportRows,
  getCustomMetricItems,
  getDetailCellValue,
  getDetailColumns,
  getSortedReportAssets,
  getSortedReportRows,
} from "./itineraryExportModel.js"

const PDF_COLORS = {
  navy: [16, 35, 114],
  orange: [255, 102, 0],
  blue: [37, 99, 235],
  teal: [20, 184, 166],
  white: [255, 255, 255],
  slate: [100, 116, 139],
  light: [248, 250, 252],
  border: [216, 222, 232],
  text: [23, 32, 51],
}

const PDF_DETAIL_TABLE_WIDTH = 273

const getColumnWidthValue = (column = {}) => {
  const width = Number(String(column.pdfWidth || column.width || "").replace(/[^\d.]/g, ""))

  return Number.isFinite(width) && width > 0 ? width : 18
}

const getPdfAssetColumnStyles = (assetColumns = [], tableWidth = PDF_DETAIL_TABLE_WIDTH) => {
  const weights = assetColumns.map((column) => Math.max(1, Number(column.weight) || 1))
  const totalWeight = weights.reduce((total, weight) => total + weight, 0) || 1

  return Object.fromEntries(
    assetColumns.map((column, index) => {
      const style = {
        cellWidth: Number(((weights[index] / totalWeight) * tableWidth).toFixed(2)),
      }

      if (column.style === "primary") {
        style.fontStyle = "bold"
      }

      if (["badge", "code", "center"].includes(column.style)) {
        style.halign = "center"
      }

      if (column.style === "badge") {
        style.fontStyle = "bold"
      }

      return [index, style]
    }),
  )
}

const getPdfDetailColumns = (report = {}) => {
  return Array.isArray(report.pdfDetailColumns) && report.pdfDetailColumns.length
    ? report.pdfDetailColumns
    : getDetailColumns(report)
}

const getPdfDetailColumnStyles = (columns = [], tableWidth = PDF_DETAIL_TABLE_WIDTH) => {
  const rawWidths = columns.map(getColumnWidthValue)
  const totalWidth = rawWidths.reduce((total, width) => total + width, 0) || 1

  return Object.fromEntries(
    columns.map((column, index) => {
      const width = (rawWidths[index] / totalWidth) * tableWidth
      const align = column.align === "right" || column.align === "center" ? column.align : "left"

      return [
        index,
        {
          cellWidth: Number(width.toFixed(2)),
          halign: align,
        },
      ]
    }),
  )
}

const getPdfDetailFontSize = (columnCount) => {
  if (columnCount > 18) return 4.8
  if (columnCount > 14) return 5.5
  if (columnCount > 10) return 6.2

  return 7
}

const getPdfDetailCellPadding = (columnCount) => {
  if (columnCount > 18) return 0.8
  if (columnCount > 14) return 1
  if (columnCount > 10) return 1.2

  return 1.7
}

const setPdfOpacity = (doc, opacity) => {
  if (typeof doc.setGState !== "function" || typeof doc.GState !== "function") return

  doc.setGState(new doc.GState({ opacity }))
}

const addPdfBrand = ({ doc, image, x, y, width, height }) => {
  if (!image) return

  try {
    doc.addImage(image, "PNG", x, y, width, height, undefined, "FAST")
  } catch {
    // No se genera ningún logo alternativo.
  }
}

const addPdfHeader = (doc, report, title = "Reporte de itinerario", brandImage = "") => {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...PDF_COLORS.navy)
  doc.rect(0, 0, pageWidth, 28, "F")

  doc.setFillColor(...PDF_COLORS.orange)
  doc.rect(0, 28, pageWidth, 1.5, "F")

  addPdfBrand({
    doc,
    image: brandImage,
    x: 10,
    y: 4.5,
    width: 44,
    height: 15.5,
  })

  doc.setDrawColor(...PDF_COLORS.white)
  doc.setLineWidth(0.2)
  setPdfOpacity(doc, 0.22)
  doc.line(63, 6, 63, 22)
  setPdfOpacity(doc, 1)

  doc.setTextColor(...PDF_COLORS.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text(title, 68, 11)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(226, 232, 240)
  doc.text(asText(report.title, "Exportacion operativa"), 68, 18)

  doc.setTextColor(...PDF_COLORS.orange)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)
  doc.text("PERIODO", pageWidth - 12, 6.5, {
    align: "right",
  })

  doc.setTextColor(...PDF_COLORS.white)
  doc.setFontSize(8)
  doc.text(`${asText(report.fromDate)} a ${asText(report.toDate)}`, pageWidth - 12, 11.5, {
    align: "right",
  })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(203, 213, 225)
  doc.text(`Generado: ${asText(report.generatedAt)}`, pageWidth - 12, 18.5, {
    align: "right",
  })
}

const addPdfFooter = (doc, report) => {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber)
    doc.setDrawColor(...PDF_COLORS.border)
    doc.line(12, pageHeight - 9, pageWidth - 12, pageHeight - 9)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...PDF_COLORS.slate)
    doc.text(asText(report.selectedAssetsSummary, "Activos"), 12, pageHeight - 4.5)
    doc.text(`Pagina ${pageNumber} de ${pageCount}`, pageWidth - 12, pageHeight - 4.5, {
      align: "right",
    })
  }
}

const addPdfMetricCard = ({ doc, x, y, width, label, value, accent }) => {
  doc.setFillColor(...PDF_COLORS.white)
  doc.setDrawColor(...PDF_COLORS.border)
  doc.roundedRect(x, y, width, 20, 2, 2, "FD")

  doc.setFillColor(...accent)
  doc.roundedRect(x, y, 2.2, 20, 1, 1, "F")

  doc.setFillColor(...PDF_COLORS.light)
  doc.roundedRect(x + 4.5, y + 3, width - 7, 5.5, 1, 1, "F")

  doc.setTextColor(...PDF_COLORS.slate)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.8)
  doc.text(label.toUpperCase(), x + 6, y + 6.8)

  doc.setTextColor(...PDF_COLORS.text)
  doc.setFontSize(13.5)
  doc.text(asText(value, "0"), x + 6, y + 15)
}

const addPdfChart = ({ doc, image, x, y, width, height, title }) => {
  doc.setFillColor(251, 253, 255)
  doc.setDrawColor(...PDF_COLORS.border)
  doc.roundedRect(x, y, width, height, 2, 2, "FD")
  doc.setTextColor(...PDF_COLORS.navy)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.text(title, x + 4, y + 6)

  if (image) {
    const imageProperties = doc.getImageProperties(image)
    const availableWidth = width - 6
    const availableHeight = height - 12
    const imageRatio = imageProperties.width / imageProperties.height
    let imageWidth = availableWidth
    let imageHeight = imageWidth / imageRatio

    if (imageHeight > availableHeight) {
      imageHeight = availableHeight
      imageWidth = imageHeight * imageRatio
    }

    const imageX = x + 3 + (availableWidth - imageWidth) / 2
    const imageY = y + 9 + (availableHeight - imageHeight) / 2

    doc.addImage(image, "PNG", imageX, imageY, imageWidth, imageHeight, undefined, "FAST")
    return
  }

  doc.setTextColor(...PDF_COLORS.slate)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text("Grafico no disponible", x + width / 2, y + height / 2, {
    align: "center",
  })
}

const getPdfMetrics = (report) => {
  const customMetrics = getCustomMetricItems({
    report,
    colorSet: PDF_COLORS,
  })

  if (customMetrics) return customMetrics

  const summary = report.summary || {}

  return [
    ["Distancia total", summary.distanceLabel || "0 km", PDF_COLORS.navy],
    ["En movimiento", summary.movingLabel || "0 min", PDF_COLORS.teal],
    ["Tiempo detenido", summary.stoppedLabel || "0 min", PDF_COLORS.orange],
    ["Velocidad promedio", summary.averageSpeedLabel || "0 km/h", PDF_COLORS.blue],
  ]
}

const getReportDashboardSummary = (report) => {
  const rowsCount = Array.isArray(report.rows) ? report.rows.length : 0
  const chartCount = report.charts?.enabled === false ? 0 : report.charts?.items?.length || 0
  const rowsLabel = report.rowsLabel || "registros"
  const reportType = asText(
    report.headerTitle || report.title || report.detailTitle,
    "Reporte operativo",
  )
  const chartLabel =
    chartCount === 1 ? "1 grafico configurado" : `${chartCount} graficos configurados`

  return `Resumen del informe: ${reportType}. Consolida ${rowsCount} ${rowsLabel} GPS, metricas operativas, ${chartLabel} y detalle exportable por activo.`
}

const addPdfSummaryPanel = ({ doc, report, x, y, width }) => {
  doc.setFillColor(...PDF_COLORS.light)
  doc.setDrawColor(...PDF_COLORS.border)
  doc.roundedRect(x, y, width, 14, 1.5, 1.5, "FD")

  doc.setFillColor(...PDF_COLORS.orange)
  doc.roundedRect(x, y, 2.2, 14, 1, 1, "F")

  doc.setTextColor(...PDF_COLORS.orange)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.2)
  doc.text("RESUMEN", x + 5.5, y + 5.1)

  doc.setTextColor(...PDF_COLORS.text)
  doc.setFontSize(7.6)
  doc.setFont("helvetica", "normal")

  const summaryText = getReportDashboardSummary(report)
  const summaryLines = doc.splitTextToSize(summaryText, width - 39).slice(0, 2)

  doc.text(summaryLines, x + 25, y + 5.1)
}

const addPdfRouteMap = ({ doc, report, x, y, width, height }) => {
  const image = report.routeMap?.image

  if (!image) return false

  doc.setDrawColor(...PDF_COLORS.border)
  doc.setFillColor(...PDF_COLORS.white)
  doc.roundedRect(x, y, width, height, 2, 2, "FD")

  doc.setTextColor(...PDF_COLORS.navy)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text(report.routeMap?.title || "Mapa de viajes", x + 4, y + 6)

  try {
    const imageProperties = doc.getImageProperties(image)
    const imageRatio = imageProperties.width / imageProperties.height
    const availableWidth = width - 8
    const availableHeight = height - 13
    let imageWidth = availableWidth
    let imageHeight = imageWidth / imageRatio

    if (imageHeight > availableHeight) {
      imageHeight = availableHeight
      imageWidth = imageHeight * imageRatio
    }

    doc.addImage(
      image,
      "PNG",
      x + 4 + (availableWidth - imageWidth) / 2,
      y + 9 + (availableHeight - imageHeight) / 2,
      imageWidth,
      imageHeight,
      undefined,
      "FAST",
    )
    return true
  } catch {
    doc.setTextColor(...PDF_COLORS.slate)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text("Mapa no disponible", x + width / 2, y + height / 2, {
      align: "center",
    })
    return false
  }
}

const STOPS_PDF_LAYOUT_ID = "stops-operational"
const STOPS_REPORT_TYPE_ID = "stops"
const LEGACY_PDF_LAYOUT_ID = "legacy-landscape"

const isStopsPdfReport = (report = {}) => {
  return report.pdfLayout === STOPS_PDF_LAYOUT_ID || report.reportTypeId === STOPS_REPORT_TYPE_ID
}

const getStopsPdfText = (...values) => {
  return values.map((value) => asText(value, "")).find((value) => value && value !== "-") || "-"
}

const getStopsPdfOptionalText = (...values) => {
  return values.map((value) => asText(value, "")).find((value) => value && value !== "-") || ""
}

const getStopsPdfVehicleLabel = (report = {}) => {
  const assets = Array.isArray(report.assets) ? report.assets : []

  if (assets.length === 1) {
    const asset = assets[0]
    const name = getStopsPdfText(asset.name, asset.patent, "Activo")
    const patent = getStopsPdfOptionalText(asset.patent)

    return patent && patent !== name ? `${name} - ${patent}` : name
  }

  return assets.length ? `${assets.length} activos incluidos` : "Sin activos"
}

const getStopsPdfRangeLabel = (report = {}) => {
  const fromDate = asText(report.fromDate)
  const toDate = asText(report.toDate)

  return fromDate === toDate ? fromDate : `${fromDate} a ${toDate}`
}

const getStopsPdfTimeRangeLabel = (rows = []) => {
  const firstRow = rows[0] || {}
  const lastRow = rows.at(-1) || {}
  const firstTime = getStopsPdfText(firstRow.time, firstRow.values?.time)
  const lastTime = getStopsPdfText(lastRow.endTime, lastRow.values?.endTime, lastRow.time)

  if (firstTime === "-" && lastTime === "-") return "-"
  if (firstTime === lastTime) return firstTime

  return `${firstTime} - ${lastTime}`
}

const getStopsPdfAddressLabel = (row = {}, fallback = "-") => {
  return getStopsPdfText(row.address, row.values?.address, row.values?.direccion, fallback)
}

const getOperationalPdfTitle = (report = {}) => {
  if (isStopsPdfReport(report)) return "INFORME DE DETENCIONES"

  return asText(report.headerTitle || report.title || "Reporte operativo", "Reporte operativo")
    .toUpperCase()
    .replace(/\s+/g, " ")
}

const getOperationalPdfAssetsLabel = (report = {}) => {
  return getStopsPdfOptionalText(report.selectedAssetsSummary) || getStopsPdfVehicleLabel(report)
}

const getOperationalPdfGeneralRows = ({ report, rows }) => {
  if (isStopsPdfReport(report)) {
    const firstRow = rows[0] || {}
    const lastRow = rows.at(-1) || {}

    return [
      ["Vehiculo", getStopsPdfVehicleLabel(report)],
      ["Rango consultado", getStopsPdfRangeLabel(report)],
      ["Periodo analizado", getStopsPdfTimeRangeLabel(rows)],
      ["Primera detencion", getStopsPdfAddressLabel(firstRow, "Sin ubicacion")],
      ["Ultima detencion", getStopsPdfAddressLabel(lastRow, "Sin ubicacion")],
    ]
  }

  return [
    ["Reporte", asText(report.headerTitle || report.title, "Reporte operativo")],
    ["Activos", getOperationalPdfAssetsLabel(report)],
    ["Rango consultado", getStopsPdfRangeLabel(report)],
    ["Registros", `${rows.length} ${asText(report.rowsLabel, "registros")}`],
    ["Generado", asText(report.generatedAt)],
  ]
}

const addStopsPdfHeader = ({ doc, report, brandImage }) => {
  const pageWidth = doc.internal.pageSize.getWidth()

  addPdfBrand({
    doc,
    image: brandImage,
    x: pageWidth / 2 - 34,
    y: 14,
    width: 68,
    height: 24,
  })

  doc.setTextColor(...PDF_COLORS.slate)
  doc.setFont("helvetica", "italic")
  doc.setFontSize(7)
  doc.text(REPORT_BRAND.tagline || "Monitoreo GPS y Telemetria IoT", pageWidth / 2, 44, {
    align: "center",
  })

  doc.setDrawColor(...PDF_COLORS.orange)
  doc.setLineWidth(0.7)
  doc.line(16, 49, pageWidth - 16, 49)

  doc.setTextColor(...PDF_COLORS.navy)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text(getOperationalPdfTitle(report), pageWidth / 2, 59, {
    align: "center",
  })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...PDF_COLORS.text)
  doc.text(
    `${getOperationalPdfAssetsLabel(report)}  |  ${getStopsPdfRangeLabel(report)}`,
    pageWidth / 2,
    65,
    {
      align: "center",
    },
  )
}

const addStopsPdfSectionTitle = ({ doc, title, x, y, width }) => {
  doc.setTextColor(...PDF_COLORS.navy)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9.2)
  doc.text(title, x, y)
  doc.setDrawColor(...PDF_COLORS.orange)
  doc.setLineWidth(0.55)
  doc.line(x, y + 3.2, x + width, y + 3.2)
}

const getPdfColumnLimitNotice = (report = {}) => {
  const hiddenColumnCount = Number(report.hiddenPdfColumnCount || 0)

  if (!Number.isFinite(hiddenColumnCount) || hiddenColumnCount <= 0) return ""

  const hiddenColumnLabels = Array.isArray(report.hiddenPdfColumnLabels)
    ? report.hiddenPdfColumnLabels.filter(Boolean)
    : []
  const previewLabels = hiddenColumnLabels.slice(0, 3).join(", ")
  const suffix =
    previewLabels && hiddenColumnLabels.length > 3
      ? ` (${previewLabels}, ...)`
      : previewLabels
        ? ` (${previewLabels})`
        : ""

  return `PDF compacto: la tabla principal muestra las primeras columnas y ${hiddenColumnCount} columnas adicionales se agregan en Detalle adicional${suffix}. Excel conserva el detalle completo en hojas auxiliares.`
}

const addPdfColumnLimitNotice = ({ doc, report, x, y, width }) => {
  const notice = getPdfColumnLimitNotice(report)

  if (!notice) return y

  doc.setTextColor(...PDF_COLORS.slate)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)

  const lines =
    typeof doc.splitTextToSize === "function" ? doc.splitTextToSize(notice, width) : [notice]

  doc.text(lines, x, y)

  return y + lines.length * 3.5 + 2
}

const getHiddenPdfDetailColumns = (report = {}) => {
  const columns = Array.isArray(report.hiddenPdfDetailColumns) ? report.hiddenPdfDetailColumns : []
  const hasDataColumns = columns.some((column) => column?.key && column.key !== "index")

  return hasDataColumns ? columns : []
}

const addPdfAdditionalDetailTable = ({ doc, autoTable, report, rows, x, y, width }) => {
  const columns = getHiddenPdfDetailColumns(report)

  if (!columns.length || !rows.length) return y

  const pageHeight = doc.internal.pageSize.getHeight()
  let sectionY = y

  if (sectionY > pageHeight - 48) {
    doc.addPage()
    sectionY = 18
  }

  const detailColumnCount = columns.length
  const detailFontSize = Math.max(5.2, getPdfDetailFontSize(detailColumnCount) - 0.4)

  addStopsPdfSectionTitle({
    doc,
    title: "Detalle adicional",
    x,
    y: sectionY,
    width,
  })

  autoTable(doc, {
    startY: sectionY + 7,
    margin: { left: x, right: x, top: 14, bottom: 14 },
    tableWidth: width,
    showHead: "everyPage",
    rowPageBreak: "avoid",
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => {
      return columns.map((column) => getDetailCellValue(row, column))
    }),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: detailFontSize,
      cellPadding: getPdfDetailCellPadding(detailColumnCount),
      overflow: "linebreak",
      textColor: PDF_COLORS.text,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.15,
      minCellHeight: 8,
      valign: "middle",
    },
    headStyles: {
      fillColor: PDF_COLORS.navy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: detailFontSize,
      halign: "center",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.light,
    },
    columnStyles: getPdfDetailColumnStyles(columns, width),
  })

  return doc.lastAutoTable?.finalY || sectionY + 30
}

const addStopsPdfGeneralTable = ({ doc, autoTable, report, rows, x, y, width }) => {
  addStopsPdfSectionTitle({
    doc,
    title: "Datos generales",
    x,
    y,
    width,
  })

  autoTable(doc, {
    startY: y + 7,
    margin: { left: x, right: x, bottom: 14 },
    tableWidth: width,
    body: getOperationalPdfGeneralRows({ report, rows }),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 7.6,
      cellPadding: 2.4,
      textColor: PDF_COLORS.text,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.18,
      valign: "middle",
    },
    columnStyles: {
      0: {
        cellWidth: 43,
        fontStyle: "bold",
        textColor: PDF_COLORS.navy,
        fillColor: [248, 250, 252],
      },
      1: {
        cellWidth: width - 43,
      },
    },
    alternateRowStyles: {
      fillColor: [250, 251, 253],
    },
  })

  return doc.lastAutoTable?.finalY || y + 43
}

const addStopsPdfMetricCards = ({ doc, report, x, y, width }) => {
  const metrics = getPdfMetrics(report)
  const gap = 0
  const cardWidth = width / metrics.length
  const cardHeight = 20

  addStopsPdfSectionTitle({
    doc,
    title: "Resumen del periodo",
    x,
    y,
    width,
  })

  metrics.forEach(([label, value, accent], index) => {
    const cardX = x + index * (cardWidth + gap)
    const cardFill = index % 2 === 0 ? [255, 255, 255] : PDF_COLORS.light

    doc.setFillColor(...cardFill)
    doc.setDrawColor(...PDF_COLORS.border)
    doc.rect(cardX, y + 7, cardWidth, cardHeight, "FD")

    doc.setTextColor(...accent)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text(asText(value, "0"), cardX + cardWidth / 2, y + 16.5, {
      align: "center",
    })

    doc.setTextColor(...PDF_COLORS.text)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6.8)
    doc.text(label, cardX + cardWidth / 2, y + 24.4, {
      align: "center",
    })
  })

  return y + 7 + cardHeight
}

const addStopsPdfRouteMap = ({ doc, report, x, y, width }) => {
  addStopsPdfSectionTitle({
    doc,
    title: "Mapa de la ruta",
    x,
    y,
    width,
  })

  const mapHeight = 88
  const image = report.routeMap?.image

  doc.setDrawColor(...PDF_COLORS.border)
  doc.setFillColor(...PDF_COLORS.white)
  doc.roundedRect(x, y + 7, width, mapHeight, 1.5, 1.5, "FD")

  if (!image) {
    doc.setDrawColor(...PDF_COLORS.border)
    doc.setFillColor(...PDF_COLORS.light)
    doc.roundedRect(x, y + 7, width, mapHeight, 1.5, 1.5, "FD")
    doc.setTextColor(...PDF_COLORS.slate)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text("No hay imagen de mapa disponible para este reporte.", x + width / 2, y + 52, {
      align: "center",
    })

    return y + 7 + mapHeight
  }

  try {
    const imageProperties = doc.getImageProperties(image)
    const imageRatio = imageProperties.width / imageProperties.height
    const availableWidth = width - 10
    const availableHeight = mapHeight - 8
    let imageWidth = availableWidth
    let imageHeight = imageWidth / imageRatio

    if (imageHeight > availableHeight) {
      imageHeight = availableHeight
      imageWidth = imageHeight * imageRatio
    }

    doc.addImage(
      image,
      "PNG",
      x + 5 + (availableWidth - imageWidth) / 2,
      y + 11 + (availableHeight - imageHeight) / 2,
      imageWidth,
      imageHeight,
      undefined,
      "FAST",
    )
  } catch {
    doc.setTextColor(...PDF_COLORS.slate)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text("Mapa no disponible", x + width / 2, y + 52, {
      align: "center",
    })
  }

  return y + 7 + mapHeight
}

const addOperationalPdfAssetsTable = ({ doc, autoTable, report, assets, x, y, width }) => {
  if (isStopsPdfReport(report) || !assets.length) return y

  const assetColumns = getAssetTableColumns(report)

  addStopsPdfSectionTitle({
    doc,
    title: "Activos incluidos",
    x,
    y,
    width,
  })

  autoTable(doc, {
    startY: y + 7,
    margin: { left: x, right: x, top: 14, bottom: 14 },
    tableWidth: width,
    showHead: "everyPage",
    rowPageBreak: "avoid",
    head: [assetColumns.map((column) => column.label)],
    body: assets.map((asset) => assetColumns.map((column) => asset[column.key] ?? "-")),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 7,
      cellPadding: 1.8,
      overflow: "linebreak",
      textColor: PDF_COLORS.text,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.15,
      minCellHeight: 7.5,
      valign: "middle",
    },
    headStyles: {
      fillColor: PDF_COLORS.navy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 6.8,
      halign: "center",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.light,
    },
    columnStyles: getPdfAssetColumnStyles(assetColumns, width),
  })

  return doc.lastAutoTable?.finalY || y + 32
}

const getStopsPdfDetailColumns = (report = {}) => {
  if (!isStopsPdfReport(report)) return getPdfDetailColumns(report)

  const multipleAssets = (Array.isArray(report.assets) ? report.assets.length : 0) > 1

  return [
    { key: "index", label: "N", width: 10, align: "center" },
    ...(multipleAssets ? [{ key: "asset", label: "Activo", width: 27 }] : []),
    { key: "time", label: "Hora inicio", width: 21, align: "center" },
    { key: "endTime", label: "Hora termino", width: 23, align: "center" },
    { key: "duration", label: "Duracion", width: 23, align: "center" },
    { key: "address", label: "Ubicacion", width: multipleAssets ? 74 : 101 },
  ]
}

const addStopsPdfDetailTable = ({ doc, autoTable, report, rows, x, y, width }) => {
  const columns = getStopsPdfDetailColumns(report)
  const detailColumnCount = columns.length
  const detailFontSize = Math.max(5.4, getPdfDetailFontSize(detailColumnCount) - 0.2)

  addStopsPdfSectionTitle({
    doc,
    title: report.detailTitle || "Detalle de detenciones",
    x,
    y,
    width,
  })

  const tableStartY = addPdfColumnLimitNotice({
    doc,
    report,
    x,
    y: y + 7,
    width,
  })

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: x, right: x, top: 14, bottom: 14 },
    tableWidth: width,
    showHead: "everyPage",
    rowPageBreak: "avoid",
    head: [columns.map((column) => column.label)],
    body: rows.map((row, index) => {
      return columns.map((column) => {
        if (column.key === "index") return index + 1
        if (column.key === "address") return getStopsPdfAddressLabel(row, "-")

        return getDetailCellValue(row, column)
      })
    }),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: detailFontSize,
      cellPadding: getPdfDetailCellPadding(detailColumnCount),
      overflow: "linebreak",
      textColor: PDF_COLORS.text,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.15,
      minCellHeight: 8,
      valign: "middle",
    },
    headStyles: {
      fillColor: PDF_COLORS.navy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: detailFontSize,
      halign: "center",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.light,
    },
    columnStyles: getPdfDetailColumnStyles(columns, width),
  })

  const detailEndY = doc.lastAutoTable?.finalY || tableStartY + 30

  return addPdfAdditionalDetailTable({
    doc,
    autoTable,
    report,
    rows,
    x,
    y: detailEndY + 10,
    width,
  })
}

const exportStopsPdfReport = ({ jsPDF, autoTable, report, brandImage }) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentX = 16
  const contentWidth = pageWidth - contentX * 2
  const sortedRows = getChronologicalReportRows(report.rows)
  const sortedAssets = getSortedReportAssets(report.assets)

  addStopsPdfHeader({
    doc,
    report,
    brandImage,
  })

  const generalEndY = addStopsPdfGeneralTable({
    doc,
    autoTable,
    report,
    rows: sortedRows,
    x: contentX,
    y: 78,
    width: contentWidth,
  })

  const metricsEndY = addStopsPdfMetricCards({
    doc,
    report,
    x: contentX,
    y: generalEndY + 9,
    width: contentWidth,
  })

  let contentEndY = metricsEndY

  if (report.routeMap?.image || isStopsPdfReport(report)) {
    contentEndY = addStopsPdfRouteMap({
      doc,
      report,
      x: contentX,
      y: contentEndY + 12,
      width: contentWidth,
    })
  }

  if (!isStopsPdfReport(report) && sortedAssets.length) {
    const assetsStartY = contentEndY + 12

    if (assetsStartY > 222) {
      doc.addPage()
      contentEndY = addOperationalPdfAssetsTable({
        doc,
        autoTable,
        report,
        assets: sortedAssets,
        x: contentX,
        y: 18,
        width: contentWidth,
      })
    } else {
      contentEndY = addOperationalPdfAssetsTable({
        doc,
        autoTable,
        report,
        assets: sortedAssets,
        x: contentX,
        y: assetsStartY,
        width: contentWidth,
      })
    }
  }

  let detailStartY = contentEndY + 12

  if (detailStartY > 238) {
    doc.addPage()
    detailStartY = 18
  }

  addStopsPdfDetailTable({
    doc,
    autoTable,
    report,
    rows: sortedRows,
    x: contentX,
    y: detailStartY,
    width: contentWidth,
  })

  addPdfFooter(doc, report)
  doc.save(`${report.filename}.pdf`)
}

export const exportItineraryPdfReport = async (report) => {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
  const brandImage = await getReportBrandImageDataUrl()

  if (report.pdfLayout !== LEGACY_PDF_LAYOUT_ID) {
    exportStopsPdfReport({
      jsPDF,
      autoTable,
      report,
      brandImage,
    })
    return
  }

  const assetColumns = getAssetTableColumns(report)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - 24
  const cardGap = 4
  const cardWidth = (contentWidth - cardGap * 3) / 4
  const metricsY = 51
  const metricCardHeight = 20
  const noChartsContentStartY = metricsY + metricCardHeight + 9
  const routeMapHeight = report.routeMap?.image ? 126 : 0
  const sortedAssets = getSortedReportAssets(report.assets)
  const sortedRows = getSortedReportRows(report.rows)

  addPdfHeader(doc, report, report.headerTitle || "Reporte de itinerario", brandImage)

  addPdfSummaryPanel({
    doc,
    report,
    x: 12,
    y: 34,
    width: contentWidth,
  })

  getPdfMetrics(report).forEach(([label, value, accent], index) => {
    addPdfMetricCard({
      doc,
      x: 12 + index * (cardWidth + cardGap),
      y: metricsY,
      width: cardWidth,
      label,
      value,
      accent,
    })
  })

  const chartItems = report.charts?.items || []
  const chartsEnabled = report.charts?.enabled !== false && chartItems.length > 0
  let assetsStartY = noChartsContentStartY

  if (report.routeMap?.image) {
    const addedRouteMap = addPdfRouteMap({
      doc,
      report,
      x: 12,
      y: noChartsContentStartY,
      width: contentWidth,
      height: routeMapHeight,
    })

    if (addedRouteMap) {
      assetsStartY = noChartsContentStartY + routeMapHeight + 9
    }
  }

  if (chartsEnabled) {
    if (report.routeMap?.image) {
      doc.addPage()
    }

    const chartGap = 5
    const columnCount = chartItems.length === 1 ? 1 : 2
    const rowCount = Math.ceil(chartItems.length / columnCount)
    const chartWidth = (contentWidth - chartGap * (columnCount - 1)) / columnCount
    const chartHeight = (123 - chartGap * (rowCount - 1)) / rowCount

    chartItems.forEach((chart, index) => {
      const column = index % columnCount
      const row = Math.floor(index / columnCount)

      addPdfChart({
        doc,
        image: chart.image,
        x: 12 + column * (chartWidth + chartGap),
        y: 72 + row * (chartHeight + chartGap),
        width: chartWidth,
        height: chartHeight,
        title: chart.label || `Grafico ${index + 1}`,
      })
    })

    doc.addPage()
  }

  let assetsTitleY = chartsEnabled ? 14 : assetsStartY

  if (!chartsEnabled && assetsTitleY > 175) {
    doc.addPage()
    assetsTitleY = 14
  }

  doc.setTextColor(...PDF_COLORS.navy)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("Activos incluidos", 12, assetsTitleY)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...PDF_COLORS.slate)
  doc.setFontSize(8)
  doc.text(`${report.assets.length} activos exportados`, 12, assetsTitleY + 6)

  autoTable(doc, {
    startY: assetsTitleY + 11,
    margin: { left: 12, right: 12, bottom: 14 },
    tableWidth: PDF_DETAIL_TABLE_WIDTH,
    head: [assetColumns.map((column) => column.label)],
    body: sortedAssets.map((asset) => assetColumns.map((column) => asset[column.key] ?? "-")),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 2.7,
      textColor: PDF_COLORS.text,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.2,
      minCellHeight: 10,
      valign: "middle",
    },
    headStyles: {
      fillColor: PDF_COLORS.navy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.light,
    },
    columnStyles: getPdfAssetColumnStyles(assetColumns),
    didParseCell: (data) => {
      if (data.section !== "body") return
      const column = assetColumns[data.column.index]

      if (column?.style === "badge") {
        data.cell.styles.fillColor = [255, 247, 237]
        data.cell.styles.textColor = PDF_COLORS.orange
      }

      if (column?.style === "code") {
        data.cell.styles.textColor = PDF_COLORS.slate
      }
    },
  })

  let detailStartY = (doc.lastAutoTable?.finalY || assetsTitleY + 11) + 10

  if (detailStartY > 160) {
    doc.addPage()
    detailStartY = 18
  }

  const detailColumns = getPdfDetailColumns(report)
  const detailColumnCount = detailColumns.length
  const detailFontSize = getPdfDetailFontSize(detailColumnCount)
  let detailTableStartY = detailStartY

  doc.setTextColor(...PDF_COLORS.navy)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(report.detailTitle || "Detalle GPS", 12, detailStartY - 3)

  const detailNoticeEndY = addPdfColumnLimitNotice({
    doc,
    report,
    x: 12,
    y: detailStartY + 3,
    width: contentWidth,
  })

  if (detailNoticeEndY > detailStartY + 3) {
    detailTableStartY = detailNoticeEndY
  }

  autoTable(doc, {
    startY: detailTableStartY,
    margin: { left: 12, right: 12, top: 14, bottom: 14 },
    tableWidth: PDF_DETAIL_TABLE_WIDTH,
    showHead: "everyPage",
    rowPageBreak: "avoid",
    head: [detailColumns.map((column) => column.label)],
    body: sortedRows.map((row) => {
      return detailColumns.map((column) => getDetailCellValue(row, column))
    }),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: detailFontSize,
      cellPadding: getPdfDetailCellPadding(detailColumnCount),
      overflow: "linebreak",
      textColor: PDF_COLORS.text,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.15,
      valign: "middle",
      minCellHeight: 8,
    },
    headStyles: {
      fillColor: PDF_COLORS.navy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: detailFontSize,
      halign: "center",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.light,
    },
    columnStyles: getPdfDetailColumnStyles(detailColumns),
  })

  addPdfAdditionalDetailTable({
    doc,
    autoTable,
    report,
    rows: sortedRows,
    x: 12,
    y: (doc.lastAutoTable?.finalY || detailTableStartY + 30) + 10,
    width: PDF_DETAIL_TABLE_WIDTH,
  })

  addPdfFooter(doc, report)
  doc.save(`${report.filename}.pdf`)
}
