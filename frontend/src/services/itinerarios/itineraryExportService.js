import {
  REPORT_BRAND,
  getReportBrandImageDataUrl,
} from "../../utils/reports/export/reportBranding.js"
import {
  asText,
  compactExcelTimeLabel,
  compareSortText,
  downloadBlob,
  getExcelColumnName,
  getExcelColumnNumber,
  normalizeSortText,
  parseExcelChartNumber,
} from "./itineraryExportFormatUtils.js"

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

const EXCEL_COLORS = {
  navy: "FF102372",
  orange: "FFFF6600",
  blue: "FF2563EB",
  teal: "FF14B8A6",
  red: "FFEF4444",
  yellow: "FFEAB308",
  light: "FFF8FAFC",
  paleBlue: "FFEFF6FF",
  paleOrange: "FFFFF7ED",
  border: "FFD8DEE8",
  text: "FF172033",
  muted: "FF64748B",
  white: "FFFFFFFF",
}

const EMUS_PER_PIXEL = 9525
const EXCEL_DEFAULT_COLUMN_WIDTH = 8.43
const EXCEL_BRAND_IMAGE_SIZE = {
  width: 220,
  height: 62,
}
const EXCEL_ROUTE_MAP_ASPECT_RATIO = 360 / 1100
const EXCEL_REPORT_TARGET_VIEWPORT_WIDTH = 1870
const EXCEL_REPORT_MIN_VIEW_ZOOM = 60
const EXCEL_REPORT_MAX_VIEW_ZOOM = 110
const EXCEL_DETAIL_VIEW_ZOOM = 80
const DASHBOARD_TABLE_COLUMN_COUNT = 13
const EXCEL_REPORT_START_COLUMN = 2
const EXCEL_REPORT_LEFT_GUTTER_WIDTH = 4
const EXCEL_GENERAL_SECTION_ROW = 6
const EXCEL_SUMMARY_SECTION_ROW = 10
const EXCEL_CONTENT_START_ROW = 14
const EXCEL_MAP_ROW_HEIGHT = 18
const EXCEL_MAP_BLOCK_ROW_COUNT = 27
const EXCEL_CHART_BLOCK_ROW_COUNT = 22
const EXCEL_STACKED_CHART_BLOCK_ROW_COUNT = 39

const ASSET_TABLE_COLUMNS = [
  {
    key: "name",
    label: "Activo",
    weight: 3,
    width: 30,
    style: "primary",
  },
  {
    key: "patent",
    label: "Patente",
    weight: 2,
    width: 18,
    style: "badge",
  },
  {
    key: "deviceId",
    label: "Dispositivo",
    weight: 3,
    width: 24,
    style: "code",
  },
  {
    key: "driver",
    label: "Conductor",
    weight: 3,
    width: 28,
    style: "text",
  },
  {
    key: "points",
    label: "Puntos",
    weight: 1,
    width: 12,
    style: "center",
  },
  {
    key: "movingPoints",
    label: "En ruta",
    weight: 1,
    width: 14,
    style: "center",
  },
  {
    key: "distanceLabel",
    label: "Distancia",
    weight: 2,
    width: 16,
    style: "center",
  },
]

const ASSET_TABLE_COLUMN_DEFAULTS = new Map(
  ASSET_TABLE_COLUMNS.map((column) => [column.key, column]),
)

const normalizeAssetTableColumn = (column = {}) => {
  const baseColumn = ASSET_TABLE_COLUMN_DEFAULTS.get(column.key) || {}

  return {
    ...baseColumn,
    ...column,
    key: asText(column.key || baseColumn.key, "name"),
    label: asText(column.label || baseColumn.label, "Columna"),
    weight: Math.max(1, Number(column.weight ?? baseColumn.weight) || 1),
    width: Math.max(10, Number(column.width ?? baseColumn.width) || 14),
    style: asText(column.style || baseColumn.style, "text"),
  }
}

const getAssetTableColumns = (report = {}) => {
  if (Array.isArray(report.assetColumns) && report.assetColumns.length) {
    return report.assetColumns.map(normalizeAssetTableColumn)
  }

  return ASSET_TABLE_COLUMNS
}

const DEFAULT_DETAIL_COLUMNS = [
  { key: "index", label: "#", width: 8 },
  { key: "asset", label: "Activo", width: 27 },
  { key: "patent", label: "Patente", width: 16 },
  { key: "deviceId", label: "Dispositivo", width: 22 },
  { key: "date", label: "Fecha", width: 14 },
  { key: "time", label: "Hora", width: 13 },
  { key: "status", label: "Estado", width: 16 },
  { key: "speed", label: "Velocidad", width: 14 },
  { key: "event", label: "Evento", width: 21 },
  { key: "distance", label: "Km acumulado", width: 16 },
  { key: "address", label: "Direccion", width: 45 },
  { key: "lat", label: "Latitud", width: 17 },
  { key: "lng", label: "Longitud", width: 17 },
]

const getDetailColumns = (report = {}) => {
  return Array.isArray(report.detailColumns) && report.detailColumns.length
    ? report.detailColumns
    : DEFAULT_DETAIL_COLUMNS
}

const PDF_DETAIL_TABLE_WIDTH = 273

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

const getDetailCellValue = (reportRow, column) => {
  const value = reportRow?.values?.[column.key] ?? reportRow?.[column.key]

  return value ?? "-"
}

const getReportRowDeviceId = (row = {}) => {
  return normalizeSortText(
    row.deviceId ||
      row.values?.deviceId ||
      row.values?.dispositivo ||
      row.values?.imei ||
      row.assetDeviceId ||
      row.asset?.deviceId ||
      row.asset?.imei,
  )
}

const getReportAssetDeviceId = (asset = {}) => {
  return normalizeSortText(asset.deviceId || asset.imei || asset.values?.deviceId)
}

const getSortedReportRows = (rows = []) => {
  return [...rows]
    .map((row, index) => ({ row, index }))
    .sort((firstItem, secondItem) => {
      const deviceComparison = compareSortText(
        getReportRowDeviceId(firstItem.row),
        getReportRowDeviceId(secondItem.row),
      )

      return deviceComparison || firstItem.index - secondItem.index
    })
    .map(({ row }) => row)
}

const getReportRowTimestampMs = (row = {}) => {
  const date = new Date(row.timestamp || row.values?.timestamp || row.values?.ultimoDato || "")
  const time = date.getTime()

  return Number.isNaN(time) ? null : time
}

const getChronologicalReportRows = (rows = []) => {
  return [...rows]
    .map((row, index) => ({ row, index, timestamp: getReportRowTimestampMs(row) }))
    .sort((firstItem, secondItem) => {
      if (firstItem.timestamp !== null && secondItem.timestamp !== null) {
        return firstItem.timestamp - secondItem.timestamp
      }

      if (firstItem.timestamp !== null) return -1
      if (secondItem.timestamp !== null) return 1

      return firstItem.index - secondItem.index
    })
    .map(({ row }) => row)
}

const getSortedReportAssets = (assets = []) => {
  return [...assets].sort((firstAsset, secondAsset) => {
    const deviceComparison = compareSortText(
      getReportAssetDeviceId(firstAsset),
      getReportAssetDeviceId(secondAsset),
    )

    return deviceComparison || compareSortText(firstAsset.name, secondAsset.name)
  })
}

const getColumnWidthValue = (column = {}) => {
  const width = Number(String(column.pdfWidth || column.width || "").replace(/[^\d.]/g, ""))

  return Number.isFinite(width) && width > 0 ? width : 18
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

const metricColorKeys = ["navy", "teal", "orange", "blue"]

const getCustomMetricItems = ({ report, colorSet }) => {
  if (!Array.isArray(report.metrics) || !report.metrics.length) return null

  return report.metrics.slice(0, 4).map((metric, index) => {
    const colorKey = metric.colorKey || metricColorKeys[index] || "navy"

    return [
      asText(metric.label, `Metrica ${index + 1}`),
      asText(metric.value, "0"),
      colorSet[colorKey] || colorSet.navy,
    ]
  })
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

const applyExcelBorder = (cell) => {
  cell.border = {
    top: { style: "thin", color: { argb: EXCEL_COLORS.border } },
    left: { style: "thin", color: { argb: EXCEL_COLORS.border } },
    bottom: { style: "thin", color: { argb: EXCEL_COLORS.border } },
    right: { style: "thin", color: { argb: EXCEL_COLORS.border } },
  }
}

const styleExcelHeaderRow = (row) => {
  row.height = 24
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.navy },
    }
    cell.font = {
      color: { argb: EXCEL_COLORS.white },
      bold: true,
      size: 10,
    }
    cell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: true,
    }
    applyExcelBorder(cell)
  })
}

const styleExcelDataRows = (worksheet, startRow, endRow) => {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    row.height = 22

    row.eachCell((cell) => {
      if (rowNumber % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: EXCEL_COLORS.light },
        }
      }
      cell.font = {
        color: { argb: EXCEL_COLORS.text },
        size: 10,
      }
      cell.alignment = {
        vertical: "middle",
        wrapText: true,
      }
      applyExcelBorder(cell)
    })
  }
}

const styleExcelAssetRows = (
  worksheet,
  startRow,
  endRow,
  { columns = ASSET_TABLE_COLUMNS, ranges = [] } = {},
) => {
  styleExcelDataRows(worksheet, startRow, endRow)

  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)

    row.height = 23

    columns.forEach((column, columnIndex) => {
      const targetColumn = ranges[columnIndex]?.[0] || columnIndex + 1
      const cell = row.getCell(targetColumn)

      if (column.style === "primary") {
        cell.font = {
          color: { argb: EXCEL_COLORS.navy },
          bold: true,
          size: 10,
        }
        return
      }

      if (column.style === "badge") {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: EXCEL_COLORS.paleOrange },
        }
        cell.font = {
          color: { argb: EXCEL_COLORS.orange },
          bold: true,
          size: 10,
        }
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
        }
        return
      }

      if (column.style === "code") {
        cell.font = {
          color: { argb: EXCEL_COLORS.muted },
          bold: true,
          size: 9,
          name: "Consolas",
        }
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
        }
      }
    })
  }
}

const getDistributedColumnRanges = (
  columns = [],
  totalColumns = DASHBOARD_TABLE_COLUMN_COUNT,
  startColumn = 1,
) => {
  const columnCount = columns.length

  if (!columnCount) return []

  const normalizedTotal = Math.max(columnCount, Math.trunc(Number(totalColumns) || columnCount))
  const normalizedStartColumn = Math.max(1, Math.trunc(Number(startColumn) || 1))
  const weights = columns.map((column) => Math.max(1, Number(column.weight) || 1))
  const totalWeight = weights.reduce((total, weight) => total + weight, 0) || 1
  const exactSpans = weights.map((weight) => (weight / totalWeight) * normalizedTotal)
  const spans = exactSpans.map((span) => Math.max(1, Math.floor(span)))

  while (spans.reduce((total, span) => total + span, 0) > normalizedTotal) {
    const largestIndex = spans.reduce((largestSpanIndex, span, index) => {
      if (span <= 1) return largestSpanIndex
      return span > spans[largestSpanIndex] ? index : largestSpanIndex
    }, 0)

    spans[largestIndex] -= 1
  }

  while (spans.reduce((total, span) => total + span, 0) < normalizedTotal) {
    const nextIndex = exactSpans.reduce((bestIndex, exactSpan, index) => {
      const currentRemainder = exactSpan - spans[index]
      const bestRemainder = exactSpans[bestIndex] - spans[bestIndex]

      if (currentRemainder === bestRemainder) {
        return weights[index] > weights[bestIndex] ? index : bestIndex
      }

      return currentRemainder > bestRemainder ? index : bestIndex
    }, 0)

    spans[nextIndex] += 1
  }

  let currentColumn = normalizedStartColumn

  return spans.map((span) => {
    const startColumn = currentColumn
    const endColumn = currentColumn + span - 1

    currentColumn = endColumn + 1

    return [startColumn, endColumn]
  })
}

const getAssetTableRanges = (
  columns = ASSET_TABLE_COLUMNS,
  totalColumns = DASHBOARD_TABLE_COLUMN_COUNT,
  startColumn = 1,
) => {
  return getDistributedColumnRanges(columns, totalColumns, startColumn)
}

const mergeAssetTableColumns = (worksheet, rowNumber, ranges = getAssetTableRanges()) => {
  ranges.forEach(([startColumn, endColumn]) => {
    if (startColumn < endColumn) {
      worksheet.mergeCells(rowNumber, startColumn, rowNumber, endColumn)
    }
  })
}

const writeMergedTableRow = (worksheet, rowNumber, columns, ranges, source) => {
  mergeAssetTableColumns(worksheet, rowNumber, ranges)

  columns.forEach((column, columnIndex) => {
    const [startColumn] = ranges[columnIndex] || [columnIndex + 1]
    const value = typeof source === "function" ? source(column, columnIndex) : source?.[column.key]

    worksheet.getCell(rowNumber, startColumn).value = value ?? ""
  })
}

const addExcelTitle = (
  worksheet,
  title,
  subtitle,
  lastColumn,
  { reserveBrandSpace = false, generatedAt = "", summary = "" } = {},
) => {
  const lastColumnNumber = getExcelColumnNumber(lastColumn)
  const hasBrandBlock = reserveBrandSpace && lastColumnNumber >= 6
  const titleStartColumn = hasBrandBlock ? 3 : 1

  for (let rowNumber = 1; rowNumber <= 2; rowNumber += 1) {
    for (let columnNumber = 1; columnNumber <= lastColumnNumber; columnNumber += 1) {
      worksheet.getCell(rowNumber, columnNumber).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: EXCEL_COLORS.white },
      }
    }
  }

  for (let columnNumber = 1; columnNumber <= lastColumnNumber; columnNumber += 1) {
    worksheet.getCell(3, columnNumber).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.white },
    }
  }

  worksheet.mergeCells(1, titleStartColumn, 2, lastColumnNumber)
  const titleCell = worksheet.getCell(1, titleStartColumn)

  titleCell.value = title
  titleCell.font = {
    color: { argb: EXCEL_COLORS.navy },
    bold: true,
    size: 21,
  }
  titleCell.alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 1,
  }
  titleCell.border = {
    left: {
      style: "thick",
      color: { argb: EXCEL_COLORS.orange },
    },
  }

  worksheet.getRow(1).height = 30
  worksheet.getRow(2).height = 18

  worksheet.mergeCells(3, titleStartColumn, 3, lastColumnNumber)
  const subtitleCell = worksheet.getCell(3, titleStartColumn)

  subtitleCell.value = generatedAt ? `${subtitle} | Generado: ${generatedAt}` : subtitle
  subtitleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_COLORS.white },
  }
  subtitleCell.font = {
    color: { argb: EXCEL_COLORS.navy },
    bold: true,
    size: 10,
  }
  subtitleCell.alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 1,
  }
  subtitleCell.border = {
    bottom: {
      style: "medium",
      color: { argb: EXCEL_COLORS.orange },
    },
  }

  if (hasBrandBlock) {
    worksheet.mergeCells(3, 1, 3, titleStartColumn - 1)

    const brandCell = worksheet.getCell(3, 1)

    brandCell.value = REPORT_BRAND.name.toUpperCase()
    brandCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.white },
    }
    brandCell.font = {
      color: { argb: EXCEL_COLORS.orange },
      bold: true,
      size: 8,
    }
    brandCell.alignment = {
      vertical: "middle",
      horizontal: "center",
    }
    brandCell.border = {
      bottom: {
        style: "medium",
        color: { argb: EXCEL_COLORS.orange },
      },
    }
  }

  worksheet.getRow(3).height = 23

  if (summary) {
    worksheet.mergeCells(4, 1, 4, lastColumnNumber)

    const summaryCell = worksheet.getCell(4, 1)

    summaryCell.value = summary
    summaryCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.white },
    }
    summaryCell.font = {
      color: { argb: EXCEL_COLORS.muted },
      bold: true,
      size: 9,
    }
    summaryCell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    }
    summaryCell.border = {
      bottom: {
        style: "thin",
        color: { argb: EXCEL_COLORS.border },
      },
    }
    worksheet.getRow(4).height = 20
    return
  }

  worksheet.getRow(4).height = 9
}

const addExcelPreviewReportTitle = (
  worksheet,
  title,
  subtitle,
  lastColumn,
  { generatedAt = "", startColumn = 1 } = {},
) => {
  const lastColumnNumber = getExcelColumnNumber(lastColumn)
  const startColumnNumber = Math.min(
    lastColumnNumber,
    Math.max(1, Math.trunc(Number(startColumn) || 1)),
  )

  for (let rowNumber = 1; rowNumber <= 5; rowNumber += 1) {
    for (let columnNumber = 1; columnNumber <= lastColumnNumber; columnNumber += 1) {
      worksheet.getCell(rowNumber, columnNumber).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: EXCEL_COLORS.white },
      }
    }
  }

  worksheet.mergeCells(3, startColumnNumber, 3, lastColumnNumber)
  const taglineCell = worksheet.getCell(3, startColumnNumber)

  taglineCell.value = REPORT_BRAND.tagline || "Monitoreo GPS y Telemetria IoT"
  taglineCell.font = {
    color: { argb: EXCEL_COLORS.muted },
    italic: true,
    size: 9,
  }
  taglineCell.alignment = {
    vertical: "middle",
    horizontal: "center",
  }
  taglineCell.border = {
    bottom: {
      style: "medium",
      color: { argb: EXCEL_COLORS.orange },
    },
  }

  worksheet.mergeCells(4, startColumnNumber, 4, lastColumnNumber)
  const titleCell = worksheet.getCell(4, startColumnNumber)

  titleCell.value = asText(title, "Reporte operativo").toUpperCase()
  titleCell.font = {
    color: { argb: EXCEL_COLORS.navy },
    bold: true,
    size: 20,
  }
  titleCell.alignment = {
    vertical: "middle",
    horizontal: "center",
  }

  worksheet.mergeCells(5, startColumnNumber, 5, lastColumnNumber)
  const subtitleCell = worksheet.getCell(5, startColumnNumber)

  subtitleCell.value = generatedAt ? `${subtitle} | Generado: ${generatedAt}` : subtitle
  subtitleCell.font = {
    color: { argb: EXCEL_COLORS.muted },
    bold: true,
    size: 10,
  }
  subtitleCell.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  }

  worksheet.getRow(1).height = 35
  worksheet.getRow(2).height = 28
  worksheet.getRow(3).height = 20
  worksheet.getRow(4).height = 26
  worksheet.getRow(5).height = 21
}

const getExcelColumnPixelWidth = (width = EXCEL_DEFAULT_COLUMN_WIDTH) => {
  const normalizedWidth = Number(width)
  const safeWidth = Number.isFinite(normalizedWidth)
    ? Math.max(0, normalizedWidth)
    : EXCEL_DEFAULT_COLUMN_WIDTH

  return Math.max(16, Math.floor(safeWidth * 7 + 5))
}

const createExcelWorksheetView = ({
  frozen = false,
  showRowColHeaders = true,
  ySplit = 0,
  zoomScale = EXCEL_DETAIL_VIEW_ZOOM,
} = {}) => {
  const view = {
    showGridLines: false,
    showRowColHeaders,
    zoomScale,
    zoomScaleNormal: zoomScale,
  }

  if (frozen) {
    view.state = "frozen"
    view.ySplit = ySplit
  }

  return view
}

const clampExcelZoom = (zoomScale) => {
  const normalizedZoom = Math.round(Number(zoomScale) || EXCEL_DETAIL_VIEW_ZOOM)

  return Math.min(
    EXCEL_REPORT_MAX_VIEW_ZOOM,
    Math.max(EXCEL_REPORT_MIN_VIEW_ZOOM, normalizedZoom),
  )
}

const getWorksheetColumnPixelWidths = (
  worksheet,
  columnCount,
  startColumn = 1,
) => {
  const configuredColumnCount = worksheet.columns?.length || 0
  const normalizedStartColumn = Math.max(1, Math.trunc(Number(startColumn) || 1))
  const fallbackColumnCount = Math.max(
    1,
    configuredColumnCount - normalizedStartColumn + 1,
    DASHBOARD_TABLE_COLUMN_COUNT,
  )
  const normalizedColumnCount =
    columnCount == null
      ? fallbackColumnCount
      : Math.max(0, Math.trunc(Number(columnCount) || 0))

  if (normalizedColumnCount <= 0) return []

  const requiredColumnCount = normalizedStartColumn + normalizedColumnCount - 1

  return Array.from({ length: requiredColumnCount }, (_, columnIndex) => {
    return getExcelColumnPixelWidth(
      worksheet.columns?.[columnIndex]?.width || EXCEL_DEFAULT_COLUMN_WIDTH,
    )
  }).slice(normalizedStartColumn - 1, requiredColumnCount)
}

const getWorksheetPixelWidth = (
  worksheet,
  columnCount,
  startColumn = 1,
) => {
  return getWorksheetColumnPixelWidths(worksheet, columnCount, startColumn).reduce(
    (total, width) => total + width,
    0,
  )
}

const getExcelReportViewZoom = (worksheet, columnCount, startColumn = 1) => {
  const contentWidth = getWorksheetPixelWidth(worksheet, columnCount, startColumn)

  if (!contentWidth) return EXCEL_REPORT_MAX_VIEW_ZOOM

  return clampExcelZoom((EXCEL_REPORT_TARGET_VIEWPORT_WIDTH / contentWidth) * 100)
}

const getExcelRowHeightEmus = (worksheet, zeroBasedRowIndex) => {
  const rowHeight = worksheet.getRow(zeroBasedRowIndex + 1)?.height || 15

  return Math.max(1, Math.round(rowHeight * 12700))
}

const getExcelImageBottomRight = (
  worksheet,
  {
    columnCount,
    height,
    nativeRow,
    rowOffsetPixels = 0,
    startColumn = 1,
  },
) => {
  let rowIndex = nativeRow
  let remainingHeight = Math.round((height + rowOffsetPixels) * EMUS_PER_PIXEL)

  while (remainingHeight >= getExcelRowHeightEmus(worksheet, rowIndex)) {
    remainingHeight -= getExcelRowHeightEmus(worksheet, rowIndex)
    rowIndex += 1
  }

  return {
    nativeCol: Math.max(1, Math.trunc(Number(startColumn) || 1)) + columnCount - 1,
    nativeColOff: 0,
    nativeRow: rowIndex,
    nativeRowOff: remainingHeight,
  }
}

const getCenteredExcelImageTopLeft = (
  worksheet,
  {
    width,
    nativeRow = 0,
    rowOffsetPixels = 0,
    columnCount = worksheet.columns?.length || DASHBOARD_TABLE_COLUMN_COUNT,
    startColumn = 1,
  } = {},
) => {
  const imageWidth = Math.max(0, Number(width) || 0)
  const normalizedStartColumn = Math.max(1, Math.trunc(Number(startColumn) || 1))
  const columnPixelWidths = getWorksheetColumnPixelWidths(
    worksheet,
    normalizedStartColumn + columnCount - 1,
    1,
  )
  const leadingWidth = getWorksheetPixelWidth(worksheet, normalizedStartColumn - 1, 1)
  const contentWidth = getWorksheetPixelWidth(worksheet, columnCount, normalizedStartColumn)
  let remainingLeft = leadingWidth + Math.max(0, (contentWidth - imageWidth) / 2)

  for (let columnIndex = 0; columnIndex < columnPixelWidths.length; columnIndex += 1) {
    const columnWidth = columnPixelWidths[columnIndex]

    if (remainingLeft <= columnWidth) {
      return {
        nativeCol: columnIndex,
        nativeColOff: Math.round(remainingLeft * EMUS_PER_PIXEL),
        nativeRow,
        nativeRowOff: Math.round(rowOffsetPixels * EMUS_PER_PIXEL),
      }
    }

    remainingLeft -= columnWidth
  }

  return {
    nativeCol: 0,
    nativeColOff: 0,
    nativeRow,
    nativeRowOff: Math.round(rowOffsetPixels * EMUS_PER_PIXEL),
  }
}

const getCenteredExcelBrandImageTopLeft = (
  worksheet,
  { columnCount = worksheet.columns?.length || DASHBOARD_TABLE_COLUMN_COUNT, startColumn = 1 } = {},
) => {
  return getCenteredExcelImageTopLeft(worksheet, {
    width: EXCEL_BRAND_IMAGE_SIZE.width,
    nativeRow: 0,
    rowOffsetPixels: 4,
    columnCount,
    startColumn,
  })
}

const getExcelRouteMapImageSize = (worksheet, columnCount, startColumn = 1) => {
  const width = Math.max(1, getWorksheetPixelWidth(worksheet, columnCount, startColumn))

  return {
    width,
    height: Math.round(width * EXCEL_ROUTE_MAP_ASPECT_RATIO),
  }
}

const addExcelBrandImage = async (
  workbook,
  worksheet,
  { columnCount = worksheet.columns?.length || DASHBOARD_TABLE_COLUMN_COUNT, startColumn = 1 } = {},
) => {
  const brandImageDataUrl = await getReportBrandImageDataUrl()

  if (!brandImageDataUrl || typeof workbook.addImage !== "function") return

  const imageId = workbook.addImage({
    base64: brandImageDataUrl,
    extension: "png",
  })

  worksheet.addImage(imageId, {
    tl: getCenteredExcelBrandImageTopLeft(worksheet, {
      columnCount,
      startColumn,
    }),
    ext: EXCEL_BRAND_IMAGE_SIZE,
  })
}

const buildDetailWorksheet = (workbook, report) => {
  const detailColumns = getDetailColumns(report)
  const lastColumn = getExcelColumnName(detailColumns.length)
  const sortedRows = getSortedReportRows(report.rows)
  const sheet = workbook.addWorksheet("Detalle GPS", {
    views: [createExcelWorksheetView({ frozen: true, ySplit: 5 })],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    },
  })
  sheet.columns = detailColumns.map((column) => ({
    key: column.key,
    width: column.width || 14,
  }))
  addExcelTitle(
    sheet,
    report.detailTitle || "Detalle GPS",
    `${asText(report.selectedAssetsSummary)} | ${asText(report.fromDate)} a ${asText(report.toDate)} | ${report.rows.length} ${report.rowsLabel || "puntos"}`,
    lastColumn,
    {
      generatedAt: asText(report.generatedAt, ""),
    },
  )

  const headerRow = sheet.getRow(5)
  headerRow.values = detailColumns.map((column) => column.label)
  styleExcelHeaderRow(headerRow)

  sortedRows.forEach((reportRow) => {
    sheet.addRow(detailColumns.map((column) => getDetailCellValue(reportRow, column)))
  })

  styleExcelDataRows(sheet, 6, 5 + sortedRows.length)
  const statusColumnIndex = detailColumns.findIndex((column) => column.key === "status") + 1

  if (statusColumnIndex > 0) {
    sortedRows.forEach((reportRow, index) => {
      const statusCell = sheet.getRow(6 + index).getCell(statusColumnIndex)
      const isMoving = reportRow.status === "Movimiento"
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isMoving ? "FFCCFBF1" : "FFFFEDD5" },
      }
      statusCell.font = {
        bold: true,
        color: { argb: isMoving ? "FF0F766E" : "FFC2410C" },
        size: 10,
      }
    })
  }

  sheet.autoFilter = `A5:${lastColumn}5`

  return sheet
}

const buildAssetsWorksheet = (workbook, report) => {
  const sortedAssets = getSortedReportAssets(report.assets)
  const assetColumns = getAssetTableColumns(report)
  const lastColumn = getExcelColumnName(assetColumns.length)
  const sheet = workbook.addWorksheet("Activos", {
    views: [createExcelWorksheetView({ frozen: true, ySplit: 5 })],
  })
  sheet.columns = assetColumns.map((column) => ({
    key: column.key,
    width: column.width,
  }))
  addExcelTitle(
    sheet,
    "Activos incluidos",
    `${report.assets.length} activos exportados`,
    lastColumn,
    {
      generatedAt: asText(report.generatedAt, ""),
    },
  )
  const headerRow = sheet.getRow(5)
  headerRow.values = assetColumns.map((column) => column.label)
  styleExcelHeaderRow(headerRow)

  sortedAssets.forEach((asset) => {
    sheet.addRow(assetColumns.map((column) => asset[column.key] ?? "-"))
  })

  styleExcelAssetRows(sheet, 6, 5 + sortedAssets.length, {
    columns: assetColumns,
  })
  sheet.autoFilter = `A5:${lastColumn}5`
  return sheet
}

const addExcelSectionTitle = (
  worksheet,
  rowNumber,
  title,
  columnCount = DASHBOARD_TABLE_COLUMN_COUNT,
  { startColumn = 1 } = {},
) => {
  const startColumnNumber = Math.max(1, Math.trunc(Number(startColumn) || 1))
  const endColumnNumber = startColumnNumber + Math.max(1, columnCount) - 1

  worksheet.mergeCells(rowNumber, startColumnNumber, rowNumber, endColumnNumber)

  const titleCell = worksheet.getCell(rowNumber, startColumnNumber)
  titleCell.value = title
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_COLORS.navy },
  }
  titleCell.font = {
    color: { argb: EXCEL_COLORS.white },
    bold: true,
    size: 12,
  }
  titleCell.alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 1,
  }
  titleCell.border = {
    left: {
      style: "thick",
      color: { argb: EXCEL_COLORS.orange },
    },
    bottom: {
      style: "thin",
      color: { argb: EXCEL_COLORS.border },
    },
  }
  worksheet.getRow(rowNumber).height = 24
}

const addExcelRouteMapImage = (
  workbook,
  worksheet,
  report,
  startRow = 8,
  columnCount = DASHBOARD_TABLE_COLUMN_COUNT,
  { startColumn = 1 } = {},
) => {
  const image = report.routeMap?.image

  if (!image || typeof workbook.addImage !== "function") return false

  addExcelSectionTitle(worksheet, startRow, report.routeMap?.title || "Mapa de viajes", columnCount, {
    startColumn,
  })

  const imageSize = getExcelRouteMapImageSize(worksheet, columnCount, startColumn)
  const rowOffsetPixels = 6
  const imageRows = Math.min(
    EXCEL_MAP_BLOCK_ROW_COUNT - 2,
    Math.max(1, Math.ceil((imageSize.height + rowOffsetPixels) / (EXCEL_MAP_ROW_HEIGHT * 1.333))),
  )

  for (let rowNumber = startRow + 1; rowNumber <= startRow + imageRows; rowNumber += 1) {
    worksheet.getRow(rowNumber).height = EXCEL_MAP_ROW_HEIGHT
  }

  const imageId = workbook.addImage({
    base64: image,
    extension: "png",
  })

  worksheet.addImage(imageId, {
    tl: {
      nativeCol: Math.max(0, Math.trunc(Number(startColumn) || 1) - 1),
      nativeColOff: 0,
      nativeRow: startRow,
      nativeRowOff: Math.round(rowOffsetPixels * EMUS_PER_PIXEL),
    },
    br: getExcelImageBottomRight(worksheet, {
      columnCount,
      height: imageSize.height,
      nativeRow: startRow,
      rowOffsetPixels,
      startColumn,
    }),
    editAs: "oneCell",
  })

  return true
}

const addExcelReportTables = (
  worksheet,
  report,
  startRow,
  columnCount = DASHBOARD_TABLE_COLUMN_COUNT,
  { startColumn = 1 } = {},
) => {
  const startColumnNumber = Math.max(1, Math.trunc(Number(startColumn) || 1))
  const sortedAssets = getSortedReportAssets(report.assets)
  const sortedRows = getSortedReportRows(report.rows)
  const assetColumns = getAssetTableColumns(report)
  const assetTableRanges = getAssetTableRanges(assetColumns, columnCount, startColumnNumber)

  addExcelSectionTitle(worksheet, startRow, "Activos incluidos", columnCount, {
    startColumn: startColumnNumber,
  })

  const assetsHeaderRowNumber = startRow + 1
  const assetsHeaderRow = worksheet.getRow(assetsHeaderRowNumber)
  writeMergedTableRow(
    worksheet,
    assetsHeaderRowNumber,
    assetColumns,
    assetTableRanges,
    (column) => column.label,
  )
  styleExcelHeaderRow(assetsHeaderRow)

  sortedAssets.forEach((asset, index) => {
    const rowNumber = assetsHeaderRowNumber + index + 1

    writeMergedTableRow(worksheet, rowNumber, assetColumns, assetTableRanges, asset)
  })

  const assetsStartRow = assetsHeaderRowNumber + 1
  const assetsEndRow = assetsHeaderRowNumber + sortedAssets.length
  styleExcelAssetRows(worksheet, assetsStartRow, assetsEndRow, {
    columns: assetColumns,
    ranges: assetTableRanges,
  })

  const detailTitleRowNumber = Math.max(assetsEndRow + 2, assetsHeaderRowNumber + 3)
  const detailColumns = getDetailColumns(report)
  const detailColumnCount = detailColumns.length
  const shouldStretchDetailTable =
    detailColumnCount > 0 && detailColumnCount < columnCount
  const detailTableRanges = shouldStretchDetailTable
    ? getDistributedColumnRanges(detailColumns, columnCount, startColumnNumber)
    : getDistributedColumnRanges(detailColumns, detailColumnCount, startColumnNumber)
  const detailLastColumn = getExcelColumnName(
    startColumnNumber + (shouldStretchDetailTable ? columnCount : detailColumnCount) - 1,
  )

  addExcelSectionTitle(
    worksheet,
    detailTitleRowNumber,
    report.detailTitle || "Detalle GPS",
    Math.max(columnCount, detailColumnCount),
    {
      startColumn: startColumnNumber,
    },
  )

  const detailHeaderRowNumber = detailTitleRowNumber + 1
  const detailHeaderRow = worksheet.getRow(detailHeaderRowNumber)
  writeMergedTableRow(
    worksheet,
    detailHeaderRowNumber,
    detailColumns,
    detailTableRanges,
    (column) => {
      return column.label
    },
  )
  styleExcelHeaderRow(detailHeaderRow)

  sortedRows.forEach((reportRow, index) => {
    const rowNumber = detailHeaderRowNumber + index + 1

    writeMergedTableRow(worksheet, rowNumber, detailColumns, detailTableRanges, (column) => {
      return getDetailCellValue(reportRow, column)
    })
  })

  const detailStartRow = detailHeaderRowNumber + 1
  const detailEndRow = detailHeaderRowNumber + sortedRows.length
  styleExcelDataRows(worksheet, detailStartRow, detailEndRow)

  const statusColumnIndex = detailColumns.findIndex((column) => column.key === "status")
  const statusStartColumn = statusColumnIndex >= 0 ? detailTableRanges[statusColumnIndex]?.[0] : 0

  if (statusStartColumn > 0) {
    sortedRows.forEach((reportRow, index) => {
      const statusCell = worksheet.getRow(detailStartRow + index).getCell(statusStartColumn)
      const isMoving = reportRow.status === "Movimiento"

      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isMoving ? "FFCCFBF1" : "FFFFEDD5" },
      }
      statusCell.font = {
        bold: true,
        color: { argb: isMoving ? "FF0F766E" : "FFC2410C" },
        size: 10,
      }
    })
  }

  if (!shouldStretchDetailTable) {
    worksheet.autoFilter = `${getExcelColumnName(
      startColumnNumber,
    )}${detailHeaderRowNumber}:${detailLastColumn}${detailHeaderRowNumber}`
  }

  return Math.max(detailEndRow, detailHeaderRowNumber)
}

const getExcelChartData = (report) => {
  const reportDates = new Set(report.rows.map((row) => asText(row.date, "")).filter(Boolean))
  const fallbackLabels = report.rows.map((row) => {
    const timeLabel = compactExcelTimeLabel(row.time)
    const dateLabel = reportDates.size > 1 ? asText(row.date, "").slice(0, 5) : ""

    return `${dateLabel} ${timeLabel}`.trim() || `Punto ${row.index}`
  })
  const configuredItems = report.charts?.items || []
  const fallbackValues = report.rows.map((row) => parseExcelChartNumber(row.speed))
  const items = configuredItems.map((item, index) => {
    const labels = item.labels?.length ? item.labels : fallbackLabels
    const values = item.values?.length ? item.values : fallbackValues

    return {
      id: asText(item.id, `chart-${index + 1}`),
      type: ["bar", "line", "doughnut"].includes(item.type) ? item.type : "bar",
      key: asText(item.key, "speed"),
      label: asText(item.label, `Grafico ${index + 1}`),
      unit: asText(item.unit, ""),
      decimals: Math.max(0, parseExcelChartNumber(item.decimals)),
      color: item.color || "#2563eb",
      maximum: Number.isFinite(Number(item.maximum)) ? Number(item.maximum) : null,
      labels: labels.map((label) => asText(label)),
      values: values.map((value) => parseExcelChartNumber(value)),
      colors: (item.colors || []).map((color) => color || "#64748b"),
    }
  })

  return {
    items,
  }
}

const buildChartDataWorksheet = (workbook, chartData) => {
  const sheet = workbook.addWorksheet("DatosGraficos")
  sheet.state = "veryHidden"
  sheet.columns = Array.from({ length: chartData.items.length * 2 }, () => ({ width: 22 }))
  sheet.addRow(chartData.items.flatMap((item) => ["Categoria", item.label]))

  const rowCount = Math.max(0, ...chartData.items.map((item) => item.values.length))

  for (let index = 0; index < rowCount; index += 1) {
    sheet.addRow(
      chartData.items.flatMap((item) => [item.labels[index] ?? "", item.values[index] ?? null]),
    )
  }

  return sheet
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

const getExcelReportPeriodLabel = (report) => {
  const fromDate = asText(report.fromDate, "")
  const toDate = asText(report.toDate, "")

  if (fromDate && toDate && fromDate !== toDate) return `${fromDate} a ${toDate}`
  if (fromDate || toDate) return fromDate || toDate

  return "Sin periodo"
}

const getExcelGeneralDetailItems = (report) => {
  const assetCount = Array.isArray(report.assets) ? report.assets.length : 0

  return [
    [
      "Reporte",
      asText(report.headerTitle || report.title || report.detailTitle, "Reporte operativo"),
    ],
    ["Periodo", getExcelReportPeriodLabel(report)],
    ["Activos", asText(report.selectedAssetsSummary, `${assetCount} activos`)],
    ["Generado", asText(report.generatedAt, "-")],
  ]
}

const getExcelDashboardCardRanges = (
  columnCount = DASHBOARD_TABLE_COLUMN_COUNT,
  startColumn = 1,
) => {
  return getDistributedColumnRanges(
    [
      { weight: 1 },
      { weight: 1 },
      { weight: 1 },
      { weight: 1 },
    ],
    columnCount,
    startColumn,
  )
}

const addExcelInfoCards = (
  worksheet,
  items,
  startRow,
  {
    columnCount = DASHBOARD_TABLE_COLUMN_COUNT,
    startColumn = 1,
    valueColor = EXCEL_COLORS.navy,
  } = {},
) => {
  const cardRanges = getExcelDashboardCardRanges(columnCount, startColumn)

  items.slice(0, cardRanges.length).forEach(([label, value], index) => {
    const [startColumn, endColumn] = cardRanges[index]

    worksheet.mergeCells(startRow, startColumn, startRow, endColumn)
    worksheet.mergeCells(startRow + 1, startColumn, startRow + 1, endColumn)

    const labelCell = worksheet.getCell(startRow, startColumn)
    const valueCell = worksheet.getCell(startRow + 1, startColumn)

    labelCell.value = label
    labelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.white },
    }
    labelCell.font = {
      color: { argb: EXCEL_COLORS.muted },
      bold: true,
      size: 9,
    }
    labelCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    }

    valueCell.value = value
    valueCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.light },
    }
    valueCell.font = {
      color: { argb: valueColor },
      bold: true,
      size: 12,
    }
    valueCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    }

    applyExcelBorder(labelCell)
    applyExcelBorder(valueCell)
  })

  worksheet.getRow(startRow).height = 20
  worksheet.getRow(startRow + 1).height = 31
}

const addExcelGeneralDetails = (
  worksheet,
  report,
  startRow,
  columnCount,
  { startColumn = 1 } = {},
) => {
  addExcelSectionTitle(worksheet, startRow, "Datos generales", columnCount, { startColumn })
  addExcelInfoCards(worksheet, getExcelGeneralDetailItems(report), startRow + 1, {
    columnCount,
    startColumn,
    valueColor: EXCEL_COLORS.navy,
  })

  worksheet.getRow(startRow + 3).height = 9
}

const getExcelMetricItems = (report) => {
  return (
    getCustomMetricItems({
      report,
      colorSet: EXCEL_COLORS,
    }) || [
      ["Distancia total", report.summary?.distanceLabel || "0 km", EXCEL_COLORS.navy],
      ["En movimiento", report.summary?.movingLabel || "0 min", EXCEL_COLORS.teal],
      ["Tiempo detenido", report.summary?.stoppedLabel || "0 min", EXCEL_COLORS.orange],
      ["Velocidad promedio", report.summary?.averageSpeedLabel || "0 km/h", EXCEL_COLORS.blue],
    ]
  )
}

const addExcelSummaryMetrics = (
  worksheet,
  report,
  startRow,
  columnCount,
  { startColumn = 1 } = {},
) => {
  const metrics = getExcelMetricItems(report)
  const metricRanges = getExcelDashboardCardRanges(columnCount, startColumn)

  addExcelSectionTitle(worksheet, startRow, "Resumen del periodo", columnCount, { startColumn })

  metrics.slice(0, metricRanges.length).forEach(([label, value, color], index) => {
    const [startColumn, endColumn] = metricRanges[index]

    worksheet.mergeCells(startRow + 1, startColumn, startRow + 1, endColumn)
    worksheet.mergeCells(startRow + 2, startColumn, startRow + 2, endColumn)

    const labelCell = worksheet.getCell(startRow + 1, startColumn)
    const valueCell = worksheet.getCell(startRow + 2, startColumn)

    labelCell.value = label
    labelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: color },
    }
    labelCell.font = { color: { argb: EXCEL_COLORS.white }, bold: true, size: 10 }
    labelCell.alignment = { horizontal: "center", vertical: "middle" }

    valueCell.value = value
    valueCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.paleBlue },
    }
    valueCell.font = { color: { argb: color }, bold: true, size: 15 }
    valueCell.alignment = { horizontal: "center", vertical: "middle" }

    applyExcelBorder(labelCell)
    applyExcelBorder(valueCell)
  })

  worksheet.getRow(startRow + 1).height = 22
  worksheet.getRow(startRow + 2).height = 28
  worksheet.getRow(startRow + 3).height = 9
}

export const getExcelReportWorksheetLayout = (report) => {
  const chartCount = report.charts?.items?.length || 0
  const chartsEnabled = report.charts?.enabled !== false && chartCount > 0
  const hasRouteMap = Boolean(report.routeMap?.image)
  let cursorRow = EXCEL_CONTENT_START_ROW
  const mapStartRow = hasRouteMap ? cursorRow : 0

  if (hasRouteMap) {
    cursorRow += EXCEL_MAP_BLOCK_ROW_COUNT
  }

  const chartSectionRow = chartsEnabled ? cursorRow : 0
  const chartAnchorRow = chartsEnabled ? chartSectionRow + 1 : 0

  if (chartsEnabled) {
    cursorRow += chartCount > 2 ? EXCEL_STACKED_CHART_BLOCK_ROW_COUNT : EXCEL_CHART_BLOCK_ROW_COUNT
  }

  return {
    chartCount,
    chartsEnabled,
    hasRouteMap,
    mapStartRow,
    chartSectionRow,
    chartAnchorRow,
    tablesStartRow: cursorRow,
  }
}

const prepareExcelChartArea = (
  worksheet,
  layout,
  columnCount,
  { startColumn = 1 } = {},
) => {
  if (!layout.chartsEnabled) return

  addExcelSectionTitle(worksheet, layout.chartSectionRow, "Graficos recomendados", columnCount, {
    startColumn,
  })

  for (
    let rowNumber = layout.chartAnchorRow;
    rowNumber <= layout.chartAnchorRow + 18;
    rowNumber += 1
  ) {
    worksheet.getRow(rowNumber).height = 16
  }

  if (layout.chartCount > 2) {
    for (
      let rowNumber = layout.chartAnchorRow + 20;
      rowNumber <= layout.chartAnchorRow + 36;
      rowNumber += 1
    ) {
      worksheet.getRow(rowNumber).height = 15
    }
  }
}

const buildChartsWorksheet = async (workbook, report) => {
  const detailColumns = getDetailColumns(report)
  const layout = getExcelReportWorksheetLayout(report)
  const sheet = workbook.addWorksheet("Reporte", {
    views: [createExcelWorksheetView({ zoomScale: EXCEL_REPORT_MAX_VIEW_ZOOM })],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
    },
  })
  const defaultDashboardColumns = [
    { width: 8 },
    { width: 27 },
    { width: 16 },
    { width: 22 },
    { width: 14 },
    { width: 13 },
    { width: 16 },
    { width: 14 },
    { width: 21 },
    { width: 16 },
    { width: 45 },
    { width: 17 },
    { width: 17 },
  ]
  const dashboardColumnCount = Math.max(
    DASHBOARD_TABLE_COLUMN_COUNT,
    defaultDashboardColumns.length,
    detailColumns.length,
  )
  const reportStartColumn = EXCEL_REPORT_START_COLUMN
  const reportSheetColumnCount = reportStartColumn + dashboardColumnCount - 1
  const dashboardLastColumn = getExcelColumnName(reportSheetColumnCount)

  sheet.columns = Array.from({ length: reportSheetColumnCount }, (_, index) => {
    if (index < reportStartColumn - 1) {
      return { width: EXCEL_REPORT_LEFT_GUTTER_WIDTH }
    }

    const contentIndex = index - (reportStartColumn - 1)

    return defaultDashboardColumns[contentIndex] || { width: detailColumns[contentIndex]?.width || 14 }
  })
  sheet.views = [
    createExcelWorksheetView({
      showRowColHeaders: false,
      zoomScale: getExcelReportViewZoom(sheet, dashboardColumnCount, reportStartColumn),
    }),
  ]
  addExcelPreviewReportTitle(
    sheet,
    report.headerTitle || "Reporte de itinerario",
    `${asText(report.selectedAssetsSummary)} | ${asText(report.fromDate)} a ${asText(report.toDate)}`,
    dashboardLastColumn,
    {
      generatedAt: asText(report.generatedAt, ""),
      startColumn: reportStartColumn,
    },
  )

  if (!layout.chartsEnabled) {
    await addExcelBrandImage(workbook, sheet, {
      columnCount: dashboardColumnCount,
      startColumn: reportStartColumn,
    })
  }

  addExcelGeneralDetails(sheet, report, EXCEL_GENERAL_SECTION_ROW, dashboardColumnCount, {
    startColumn: reportStartColumn,
  })
  addExcelSummaryMetrics(sheet, report, EXCEL_SUMMARY_SECTION_ROW, dashboardColumnCount, {
    startColumn: reportStartColumn,
  })

  if (layout.hasRouteMap) {
    addExcelRouteMapImage(workbook, sheet, report, layout.mapStartRow, dashboardColumnCount, {
      startColumn: reportStartColumn,
    })
  }

  prepareExcelChartArea(sheet, layout, dashboardColumnCount, {
    startColumn: reportStartColumn,
  })

  const tablesEndRow = addExcelReportTables(
    sheet,
    report,
    layout.tablesStartRow,
    dashboardColumnCount,
    {
      startColumn: reportStartColumn,
    },
  )

  sheet.pageSetup.printTitlesRow = "1:5"
  sheet.pageSetup.printArea = `${getExcelColumnName(
    reportStartColumn,
  )}1:${dashboardLastColumn}${Math.max(tablesEndRow, layout.tablesStartRow)}`

  return sheet
}

export const createItineraryExcelWorkbook = async (
  report,
  chartData = report.charts?.enabled === false || !report.charts?.items?.length
    ? null
    : getExcelChartData(report),
) => {
  const excelModule = await import("exceljs")
  const ExcelJS = excelModule.default || excelModule
  const workbook = new ExcelJS.Workbook()

  workbook.creator = REPORT_BRAND.name
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.subject = report.headerTitle || "Reporte de itinerario"

  workbook.views = [{ activeTab: 0 }]

  await buildChartsWorksheet(workbook, report)
  buildDetailWorksheet(workbook, report)
  buildAssetsWorksheet(workbook, report)
  if (chartData) {
    buildChartDataWorksheet(workbook, chartData)
  }

  return workbook
}

export const createItineraryExcelBuffer = async (report) => {
  const chartsEnabled = report.charts?.enabled !== false && report.charts?.items?.length > 0
  const chartData = chartsEnabled ? getExcelChartData(report) : null
  const workbook = await createItineraryExcelWorkbook(report, chartData)
  const workbookBuffer = await workbook.xlsx.writeBuffer()

  if (!chartsEnabled) return workbookBuffer

  const { injectNativeItineraryCharts } = await import("./nativeExcelCharts.js")

  return injectNativeItineraryCharts({
    workbookBuffer,
    chartData,
    brandImageDataUrl: await getReportBrandImageDataUrl(),
    chartStartRow: getExcelReportWorksheetLayout(report).chartAnchorRow - 1,
  })
}

export const exportItineraryExcelWorkbook = async (report) => {
  const buffer = await createItineraryExcelBuffer(report)
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  downloadBlob(blob, `${report.filename}.xlsx`)
}
