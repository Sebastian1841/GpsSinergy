import { normalizeReportText } from "../execution/assetReportExecutionUtils.js"
import {
  buildItineraryCompatibleReport,
  isRouteMapReportTemplate,
} from "../execution/assetReportRenderModelUtils.js"
import { buildReportDataWorksheet, normalizeReportChartData } from "./assetReportExcelUtils.js"
import {
  DEFAULT_REPORT_REVERSE_GEOCODE_EXPORT_LIMIT,
  REPORT_BEHAVIOR_OPTION_IDS,
  getReportBehaviorOptionValue,
  isReportBehaviorOptionEnabled,
} from "../config/reportBehaviorOptions.js"
import {
  REPORT_OUTPUT_OPTION_IDS,
  isReportOutputOptionEnabled,
} from "../config/reportOutputOptions.js"
import {
  buildRouteTripMapImageDataUrl,
  getRouteTripMapRoutes,
} from "../route-map/routeTripMapImageUtils.js"
import { getReportBrandImageDataUrl } from "./reportBranding.js"
import { resolveReverseGeocodedSources } from "../../../services/location/reverseGeocodingService.js"

const ROUTE_HISTORY_MAP_PDF_IMAGE_WIDTH = 1200
const ROUTE_HISTORY_MAP_PDF_IMAGE_HEIGHT = 520
const ROUTE_HISTORY_MAP_EXCEL_IMAGE_WIDTH = 1100
const ROUTE_HISTORY_MAP_EXCEL_IMAGE_HEIGHT = 360
const ROUTE_HISTORY_MAP_IMAGE_CACHE_LIMIT = 6
const routeHistoryMapImageCache = new Map()

export const escapeReportHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

const hasExportAddressColumn = (reportColumns = []) => {
  const columns = Array.isArray(reportColumns) ? reportColumns : []

  return columns.some((column) => {
    return ["address", "lastPosition"].includes(column?.key)
  })
}

const hasExportTripEndpointColumn = (reportColumns = []) => {
  const columns = Array.isArray(reportColumns) ? reportColumns : []

  return columns.some((column) => {
    return ["tripOrigin", "tripDestination"].includes(column?.key)
  })
}

const resolveReportRowsForExport = async (
  reportRows = [],
  {
    resolveAddresses = false,
    resolveTripEndpoints = false,
    addressResolveLimit = DEFAULT_REPORT_REVERSE_GEOCODE_EXPORT_LIMIT,
  } = {},
) => {
  if (!resolveAddresses && !resolveTripEndpoints) return reportRows

  return resolveReverseGeocodedSources(reportRows, {
    limit: addressResolveLimit,
    resolveAddresses,
    resolveTripEndpoints,
  })
}

const getExportAddressResolveLimit = (template = {}) => {
  const limit = Number(
    getReportBehaviorOptionValue(template, REPORT_BEHAVIOR_OPTION_IDS.reverseGeocodeExportLimit),
  )

  return Number.isFinite(limit) ? limit : DEFAULT_REPORT_REVERSE_GEOCODE_EXPORT_LIMIT
}

const updateHash = (currentHash, value) => {
  const textValue = String(value ?? "")
  let nextHash = currentHash

  for (let index = 0; index < textValue.length; index += 1) {
    nextHash ^= textValue.charCodeAt(index)
    nextHash = Math.imul(nextHash, 16777619)
  }

  return nextHash >>> 0
}

const getRouteHistoryMapImageCacheKey = ({ reportRows = [], width, height }) => {
  const routes = getRouteTripMapRoutes(reportRows)

  if (!routes.length) return ""

  let hash = 2166136261

  hash = updateHash(hash, width)
  hash = updateHash(hash, height)
  hash = updateHash(hash, routes.length)

  routes.forEach((route) => {
    hash = updateHash(hash, route.id)
    hash = updateHash(hash, route.deviceKey)
    hash = updateHash(hash, route.deviceLabel)
    hash = updateHash(hash, route.startAddress)
    hash = updateHash(hash, route.endAddress)
    hash = updateHash(hash, route.color)
    hash = updateHash(hash, route.points.length)

    route.points.forEach((point) => {
      hash = updateHash(hash, Number(point.lat).toFixed(6))
      hash = updateHash(hash, Number(point.lng).toFixed(6))
    })
    ;(route.stopMarkers || []).forEach((marker) => {
      hash = updateHash(hash, marker.label)
      hash = updateHash(hash, marker.address)
      hash = updateHash(hash, Number(marker.lat).toFixed(6))
      hash = updateHash(hash, Number(marker.lng).toFixed(6))
    })
  })

  return `${width}x${height}:${routes.length}:${hash}`
}

const getCachedRouteHistoryMapImage = (cacheKey) => {
  if (!cacheKey || !routeHistoryMapImageCache.has(cacheKey)) return null

  const imageDataUrl = routeHistoryMapImageCache.get(cacheKey)

  routeHistoryMapImageCache.delete(cacheKey)
  routeHistoryMapImageCache.set(cacheKey, imageDataUrl)

  return imageDataUrl
}

const setCachedRouteHistoryMapImage = (cacheKey, imageDataUrl) => {
  if (!cacheKey || !imageDataUrl) return

  routeHistoryMapImageCache.set(cacheKey, imageDataUrl)

  while (routeHistoryMapImageCache.size > ROUTE_HISTORY_MAP_IMAGE_CACHE_LIMIT) {
    const oldestKey = routeHistoryMapImageCache.keys().next().value

    routeHistoryMapImageCache.delete(oldestKey)
  }
}

const createReportFilename = (templateName, extension = "xlsx") => {
  const normalizedName = normalizeReportText(templateName || "reporte")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `${normalizedName || "reporte"}.${extension}`
}

const downloadBlob = (blob, filename) => {
  if (typeof document === "undefined") return

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.click()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

const createRouteHistoryMapImageDataUrl = async ({ template, reportRows, format = "pdf" }) => {
  if (!isRouteMapReportTemplate(template)) return ""

  const optionId =
    format === "excel" ? REPORT_OUTPUT_OPTION_IDS.excelTripMap : REPORT_OUTPUT_OPTION_IDS.pdfTripMap

  if (!isReportOutputOptionEnabled(template, optionId)) return ""

  const width =
    format === "excel" ? ROUTE_HISTORY_MAP_EXCEL_IMAGE_WIDTH : ROUTE_HISTORY_MAP_PDF_IMAGE_WIDTH
  const height =
    format === "excel" ? ROUTE_HISTORY_MAP_EXCEL_IMAGE_HEIGHT : ROUTE_HISTORY_MAP_PDF_IMAGE_HEIGHT
  const cacheKey = getRouteHistoryMapImageCacheKey({
    reportRows,
    width,
    height,
  })
  const cachedImageDataUrl = getCachedRouteHistoryMapImage(cacheKey)

  if (cachedImageDataUrl) return cachedImageDataUrl

  try {
    const imageDataUrl = await buildRouteTripMapImageDataUrl(reportRows, {
      width,
      height,
    })

    setCachedRouteHistoryMapImage(cacheKey, imageDataUrl)

    return imageDataUrl
  } catch {
    return ""
  }
}

export const createAssetReportExcelWorkbook = async ({
  template,
  reportColumns,
  reportRows,
  chartData,
  charts = {},
  dateFrom = "",
  dateTo = "",
}) => {
  const exportReportColumns = Array.isArray(reportColumns) ? reportColumns : []
  const exportReportRows = await resolveReportRowsForExport(reportRows, {
    resolveAddresses:
      hasExportAddressColumn(exportReportColumns) &&
      isReportBehaviorOptionEnabled(template, REPORT_BEHAVIOR_OPTION_IDS.resolveAddresses),
    resolveTripEndpoints:
      hasExportTripEndpointColumn(exportReportColumns) &&
      isReportBehaviorOptionEnabled(template, REPORT_BEHAVIOR_OPTION_IDS.resolveTripEndpoints),
    addressResolveLimit: getExportAddressResolveLimit(template),
  })
  const routeMapImageDataUrl = await createRouteHistoryMapImageDataUrl({
    template,
    reportRows: exportReportRows,
    format: "excel",
  })
  const itineraryReport = buildItineraryCompatibleReport({
    template,
    reportColumns: exportReportColumns,
    reportRows: exportReportRows,
    charts,
    dateFrom,
    dateTo,
    routeMapImageDataUrl,
  })
  const { createItineraryExcelWorkbook, getExcelReportWorksheetLayout } =
    await import("../../../services/itinerarios/itineraryExportService.js")

  const workbook = await createItineraryExcelWorkbook(itineraryReport, chartData)
  workbook.sinergyReportChartStartRow = Math.max(
    0,
    getExcelReportWorksheetLayout(itineraryReport).chartAnchorRow - 1,
  )

  buildReportDataWorksheet(workbook, {
    template,
    reportColumns: exportReportColumns,
    reportRows: exportReportRows,
    generatedAt: itineraryReport.generatedAt,
  })

  return workbook
}

export const createAssetReportExcelBuffer = async ({
  template,
  reportColumns,
  reportRows,
  charts = {},
  dateFrom = "",
  dateTo = "",
}) => {
  const chartData = normalizeReportChartData(charts)
  const workbook = await createAssetReportExcelWorkbook({
    template,
    reportColumns,
    reportRows,
    chartData,
    charts,
    dateFrom,
    dateTo,
  })
  const workbookBuffer = await workbook.xlsx.writeBuffer()

  if (!chartData) return workbookBuffer

  const { injectNativeItineraryCharts } =
    await import("../../../services/itinerarios/nativeExcelCharts.js")

  return injectNativeItineraryCharts({
    workbookBuffer,
    chartData,
    brandImageDataUrl: await getReportBrandImageDataUrl(),
    chartStartRow: workbook.sinergyReportChartStartRow,
  })
}

export const exportAssetReportExcel = async ({
  template,
  reportColumns,
  reportRows,
  charts = {},
  dateFrom = "",
  dateTo = "",
}) => {
  const buffer = await createAssetReportExcelBuffer({
    template,
    reportColumns,
    reportRows,
    charts,
    dateFrom,
    dateTo,
  })
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  downloadBlob(blob, createReportFilename(template?.name, "xlsx"))
}

export const exportAssetReportPdf = async ({
  template,
  reportColumns,
  reportRows,
  dateFrom = "",
  dateTo = "",
  charts = {},
}) => {
  const exportReportColumns = Array.isArray(reportColumns) ? reportColumns : []
  const exportReportRows = await resolveReportRowsForExport(reportRows, {
    resolveAddresses:
      hasExportAddressColumn(exportReportColumns) &&
      isReportBehaviorOptionEnabled(template, REPORT_BEHAVIOR_OPTION_IDS.resolveAddresses),
    resolveTripEndpoints:
      hasExportTripEndpointColumn(exportReportColumns) &&
      isReportBehaviorOptionEnabled(template, REPORT_BEHAVIOR_OPTION_IDS.resolveTripEndpoints),
    addressResolveLimit: getExportAddressResolveLimit(template),
  })
  const routeMapImageDataUrl = await createRouteHistoryMapImageDataUrl({
    template,
    reportRows: exportReportRows,
    format: "pdf",
  })
  const itineraryReport = buildItineraryCompatibleReport({
    template,
    reportColumns: exportReportColumns,
    reportRows: exportReportRows,
    charts,
    dateFrom,
    dateTo,
    routeMapImageDataUrl,
    format: "pdf",
  })
  const { exportItineraryPdfReport } =
    await import("../../../services/itinerarios/itineraryExportService.js")

  await exportItineraryPdfReport(itineraryReport)
}
