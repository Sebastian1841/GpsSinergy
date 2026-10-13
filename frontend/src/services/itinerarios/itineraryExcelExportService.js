import {
  REPORT_BRAND,
  getReportBrandImageDataUrl,
} from "../../utils/reports/export/reportBranding.js"
import {
  asText,
  compactExcelTimeLabel,
  downloadBlob,
  getExcelColumnName,
  getExcelColumnNumber,
  parseExcelChartNumber,
} from "./itineraryExportFormatUtils.js"

import {
  ASSET_TABLE_COLUMNS,
  getAssetTableColumns,
  getCustomMetricItems,
  getDetailCellValue,
  getDetailColumns,
  getSortedReportAssets,
  getSortedReportRows,
} from "./itineraryExportModel.js"

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

  return Math.min(EXCEL_REPORT_MAX_VIEW_ZOOM, Math.max(EXCEL_REPORT_MIN_VIEW_ZOOM, normalizedZoom))
}

const getWorksheetColumnPixelWidths = (worksheet, columnCount, startColumn = 1) => {
  const configuredColumnCount = worksheet.columns?.length || 0
  const normalizedStartColumn = Math.max(1, Math.trunc(Number(startColumn) || 1))
  const fallbackColumnCount = Math.max(
    1,
    configuredColumnCount - normalizedStartColumn + 1,
    DASHBOARD_TABLE_COLUMN_COUNT,
  )
  const normalizedColumnCount =
    columnCount == null ? fallbackColumnCount : Math.max(0, Math.trunc(Number(columnCount) || 0))

  if (normalizedColumnCount <= 0) return []

  const requiredColumnCount = normalizedStartColumn + normalizedColumnCount - 1

  return Array.from({ length: requiredColumnCount }, (_, columnIndex) => {
    return getExcelColumnPixelWidth(
      worksheet.columns?.[columnIndex]?.width || EXCEL_DEFAULT_COLUMN_WIDTH,
    )
  }).slice(normalizedStartColumn - 1, requiredColumnCount)
}

const getWorksheetPixelWidth = (worksheet, columnCount, startColumn = 1) => {
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
  { columnCount, height, nativeRow, rowOffsetPixels = 0, startColumn = 1 },
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

  addExcelSectionTitle(
    worksheet,
    startRow,
    report.routeMap?.title || "Mapa de viajes",
    columnCount,
    {
      startColumn,
    },
  )

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
  const shouldStretchDetailTable = detailColumnCount > 0 && detailColumnCount < columnCount
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
    [{ weight: 1 }, { weight: 1 }, { weight: 1 }, { weight: 1 }],
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

const prepareExcelChartArea = (worksheet, layout, columnCount, { startColumn = 1 } = {}) => {
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

    return (
      defaultDashboardColumns[contentIndex] || { width: detailColumns[contentIndex]?.width || 14 }
    )
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
