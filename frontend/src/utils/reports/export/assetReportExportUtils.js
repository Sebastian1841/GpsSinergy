import { normalizeReportText } from "../execution/assetReportExecutionUtils.js"
import {
  buildReportDataWorksheet,
  getExcelColumnWidth,
  normalizeReportChartData,
  parseExcelChartNumber,
} from "./assetReportExcelUtils.js"
import {
  DEFAULT_REPORT_REVERSE_GEOCODE_EXPORT_LIMIT,
  REPORT_BEHAVIOR_OPTION_IDS,
  getReportBehaviorOptionValue,
  isReportBehaviorOptionEnabled,
} from "../config/reportBehaviorOptions.js"
import { REPORT_OUTPUT_OPTION_IDS, isReportOutputOptionEnabled } from "../config/reportOutputOptions.js"
import { buildRouteTripMapImageDataUrl, getRouteTripMapRoutes } from "../route-map/routeTripMapImageUtils.js"
import { getReportBrandImageDataUrl } from "./reportBranding.js"
import { resolveReverseGeocodedSources } from "../../../services/location/reverseGeocodingService.js"

const ROUTE_HISTORY_MAP_IMAGE_WIDTH = 1200
const ROUTE_HISTORY_MAP_IMAGE_HEIGHT = 520
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

const asText = (value, fallback = "-") => {
  const text = String(value ?? "").trim()
  return text || fallback
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

const createReportBaseFilename = (templateName) => {
  return createReportFilename(templateName, "").replace(/\.$/, "")
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

const getReportRowValue = (row, key, fallback = "-") => {
  const value = row?.values?.[key]

  if (value !== undefined && value !== null && String(value).trim() !== "") return value

  return fallback
}

const getReportSourceValue = (row, keys = [], fallback = "-") => {
  const sources = [row?.report, row?.generatedEvent?.report, row?.asset]

  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key]

      if (value !== undefined && value !== null && String(value).trim() !== "") return value
    }
  }

  return fallback
}

const splitReportDateTime = (row) => {
  const timestamp = String(row?.timestamp || "").trim()
  const ultimoDato = String(getReportRowValue(row, "ultimoDato", "")).trim()
  const fecha = String(getReportRowValue(row, "fecha", "")).trim()
  const sourceText = ultimoDato || timestamp

  if (/^\d{4}-\d{2}-\d{2}[ T]/.test(sourceText)) {
    const [datePart, timePart = ""] = sourceText.replace("T", " ").split(" ")

    return {
      date: fecha || datePart,
      time: timePart.replace(/\.\d{3}Z?$/, "").replace(/Z$/, "") || "-",
    }
  }

  return {
    date: fecha || timestamp.slice(0, 10) || "-",
    time: sourceText || "-",
  }
}

const normalizeReportStatus = (row) => {
  const statusText = String(
    getReportRowValue(
      row,
      "estado",
      getReportSourceValue(row, ["estado", "status"], row?.asset?.estado || ""),
    ),
  ).toLowerCase()

  if (statusText.includes("mov") || statusText.includes("ruta") || statusText === "moving") {
    return "Movimiento"
  }

  if (statusText.includes("det") || statusText.includes("stop") || statusText === "stopped") {
    return "Detenido"
  }

  if (statusText.includes("offline") || statusText.includes("senal")) {
    return "Offline"
  }

  return asText(getReportRowValue(row, "estado", row?.asset?.estado), "-")
}

const getReportCoordinates = (row) => {
  const lat = getReportRowValue(row, "lat", getReportSourceValue(row, ["lat", "latitude"], ""))
  const lng = getReportRowValue(
    row,
    "lng",
    getReportSourceValue(row, ["lng", "lon", "longitude"], ""),
  )
  const coordinates = String(getReportRowValue(row, "coordinates", "")).split(",")

  return {
    lat: asText(lat, coordinates[0] || "-"),
    lng: asText(lng, coordinates[1] || "-"),
  }
}

const getReportDistanceLabel = (row) => {
  return asText(
    getReportRowValue(
      row,
      "odometro",
      getReportSourceValue(row, ["accumulatedDistanceLabel", "distance", "odometro"], "-"),
    ),
    "-",
  )
}

const getReportAssetKey = (row) => {
  return asText(
    row?.asset?.id ||
      row?.asset?.activoId ||
      row?.asset?.deviceId ||
      row?.values?.deviceId ||
      row?.values?.patente ||
      row?.id,
    "asset",
  )
}

const buildItineraryRowsFromReport = (reportRows = []) => {
  return reportRows.map((row, index) => {
    const { date, time } = splitReportDateTime(row)
    const { lat, lng } = getReportCoordinates(row)
    const itineraryRow = row?.itineraryRow || {}

    return {
      index: index + 1,
      values: {
        index: index + 1,
        ...(row.values || {}),
      },
      asset:
        itineraryRow.assetDisplayName ||
        getReportRowValue(row, "vehiculo", row?.asset?.nombrePantalla || row?.asset?.name),
      patent:
        itineraryRow.assetPatente ||
        getReportRowValue(row, "patente", row?.asset?.patente || row?.asset?.patent),
      deviceId:
        itineraryRow.assetDeviceId ||
        getReportRowValue(row, "deviceId", row?.asset?.deviceId || row?.asset?.imei),
      date: itineraryRow.dateLabel || date,
      time: itineraryRow.timeLabel || time,
      status: normalizeReportStatus(row),
      speed:
        itineraryRow.speedLabel ||
        getReportRowValue(row, "velocidad", getReportSourceValue(row, ["speedLabel", "speed"])),
      event:
        itineraryRow.event ||
        getReportRowValue(row, "evento", getReportSourceValue(row, ["event", "evento"])),
      distance: itineraryRow.accumulatedDistanceLabel || getReportDistanceLabel(row),
      address:
        itineraryRow.address ||
        getReportRowValue(
          row,
          "address",
          getReportRowValue(
            row,
            "lastPosition",
            getReportSourceValue(row, ["address", "direccion"], "-"),
          ),
        ),
      lat: itineraryRow.lat ?? lat,
      lng: itineraryRow.lng ?? lng,
    }
  })
}

const getReportDetailColumns = (reportColumns = []) => {
  return [
    {
      key: "index",
      label: "#",
      width: 8,
    },
    ...reportColumns.map((column) => ({
      key: column.key,
      label: column.label,
      width: getExcelColumnWidth(column),
    })),
  ]
}

const REPORT_ASSET_TABLE_COLUMNS = [
  {
    key: "name",
    label: "Vehiculo",
    weight: 4,
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
    label: "GPS / IMEI",
    weight: 3,
    width: 24,
    style: "code",
  },
  {
    key: "driver",
    label: "Conductor",
    weight: 4,
    width: 28,
    style: "text",
  },
]

const buildItineraryAssetsFromReport = ({ reportRows = [], itineraryRows = [] }) => {
  const assetsByKey = new Map()

  reportRows.forEach((row, index) => {
    const assetKey = getReportAssetKey(row)
    const itineraryRow = itineraryRows[index]
    const currentAsset = assetsByKey.get(assetKey) || {
      name: itineraryRow.asset,
      patent: itineraryRow.patent,
      deviceId: itineraryRow.deviceId,
      driver: getReportRowValue(row, "conductor", row?.asset?.conductor || "Sin conductor"),
      points: 0,
      movingPoints: 0,
      maxDistance: 0,
    }

    currentAsset.points += 1

    if (itineraryRow.status === "Movimiento") {
      currentAsset.movingPoints += 1
    }

    currentAsset.maxDistance = Math.max(
      currentAsset.maxDistance,
      parseExcelChartNumber(itineraryRow.distance),
    )

    assetsByKey.set(assetKey, currentAsset)
  })

  return Array.from(assetsByKey.values()).map(({ maxDistance, ...asset }) => ({
    ...asset,
    distanceLabel: maxDistance ? `${maxDistance.toLocaleString("es-CL")} km` : "-",
  }))
}

const getAverageSpeedLabel = (itineraryRows = []) => {
  const speeds = itineraryRows
    .map((row) => parseExcelChartNumber(row.speed))
    .filter((speed) => Number.isFinite(speed) && speed > 0)

  if (!speeds.length) return "0 km/h"

  const average = speeds.reduce((total, speed) => total + speed, 0) / speeds.length

  return `${average.toLocaleString("es-CL", {
    maximumFractionDigits: 1,
  })} km/h`
}

const getReportDateRange = ({ dateFrom, dateTo, itineraryRows }) => {
  const rowDates = itineraryRows.map((row) => row.date).filter((date) => date && date !== "-")

  return {
    fromDate: dateFrom || rowDates.at(-1) || "-",
    toDate: dateTo || rowDates[0] || "-",
  }
}

const createRouteHistoryMapImageDataUrl = async ({ template, reportRows, format = "pdf" }) => {
  if (String(template?.reportTypeId || "") !== "route-history") return ""

  const optionId =
    format === "excel" ? REPORT_OUTPUT_OPTION_IDS.excelTripMap : REPORT_OUTPUT_OPTION_IDS.pdfTripMap

  if (!isReportOutputOptionEnabled(template, optionId)) return ""

  const width = ROUTE_HISTORY_MAP_IMAGE_WIDTH
  const height = ROUTE_HISTORY_MAP_IMAGE_HEIGHT
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

const buildItineraryCompatibleReport = ({
  template,
  reportColumns,
  reportRows,
  charts = {},
  dateFrom = "",
  dateTo = "",
  routeMapImageDataUrl = "",
}) => {
  const exportReportColumns = Array.isArray(reportColumns) ? reportColumns : []
  const itineraryRows = buildItineraryRowsFromReport(reportRows)
  const assets = buildItineraryAssetsFromReport({ reportRows, itineraryRows })
  const isRouteHistoryReport = String(template?.reportTypeId || "") === "route-history"
  const rowsLabel = isRouteHistoryReport ? "viajes" : "eventos"
  const totalDistanceKm = itineraryRows.reduce((total, row) => {
    const distance = parseExcelChartNumber(row.distance)

    return total + (Number.isFinite(distance) ? distance : 0)
  }, 0)
  const totalDistanceLabel = `${Number(totalDistanceKm.toFixed(1)).toLocaleString("es-CL")} km`
  const moving = itineraryRows.filter((row) => row.status === "Movimiento").length
  const stopped = itineraryRows.filter((row) => row.status === "Detenido").length
  const offline = itineraryRows.filter((row) => row.status === "Offline").length
  const generatedAt = new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date())
  const resolvedRange = getReportDateRange({ dateFrom, dateTo, itineraryRows })

  return {
    filename: createReportBaseFilename(template?.name),
    headerTitle: template?.name || "Reporte de activos",
    title: template?.description || "Exportacion operativa de flota",
    detailTitle: isRouteHistoryReport ? "Detalle de viajes" : "Detalle GPS",
    detailColumns: getReportDetailColumns(exportReportColumns),
    rowsLabel,
    selectedAssetsSummary: isRouteHistoryReport
      ? `${assets.length} activos con viajes`
      : `${assets.length} activos con reglas de evento`,
    generatedAt,
    fromDate: resolvedRange.fromDate,
    toDate: resolvedRange.toDate,
    summary: {
      distanceLabel: isRouteHistoryReport ? totalDistanceLabel : `${itineraryRows.length} eventos`,
      movingLabel: isRouteHistoryReport ? `${itineraryRows.length} viajes` : `${moving} eventos`,
      stoppedLabel: isRouteHistoryReport ? `${assets.length} activos` : `${stopped} eventos`,
      averageSpeedLabel: getAverageSpeedLabel(itineraryRows),
    },
    metrics: isRouteHistoryReport
      ? [
          {
            label: "Viajes",
            value: itineraryRows.length,
            colorKey: "navy",
          },
          {
            label: "Activos",
            value: assets.length,
            colorKey: "teal",
          },
          {
            label: "Km total",
            value: totalDistanceLabel,
            colorKey: "orange",
          },
          {
            label: "Vel. prom.",
            value: getAverageSpeedLabel(itineraryRows),
            colorKey: "blue",
          },
        ]
      : [
          {
            label: "Eventos",
            value: itineraryRows.length,
            colorKey: "navy",
          },
          {
            label: "Movimiento",
            value: moving,
            colorKey: "teal",
          },
          {
            label: "Detenidos",
            value: stopped,
            colorKey: "orange",
          },
          {
            label: "Sin senal",
            value: offline,
            colorKey: "blue",
          },
        ],
    charts,
    routeMap: isRouteHistoryReport
      ? {
          title: "Mapa de viajes",
          image: routeMapImageDataUrl,
        }
      : null,
    assetColumns: REPORT_ASSET_TABLE_COLUMNS,
    assets,
    rows: itineraryRows,
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
  const { createItineraryExcelWorkbook } =
    await import("../../../services/itinerarios/itineraryExportService.js")

  const workbook = await createItineraryExcelWorkbook(itineraryReport, chartData)

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
  })
  const { exportItineraryPdfReport } =
    await import("../../../services/itinerarios/itineraryExportService.js")

  await exportItineraryPdfReport(itineraryReport)
}
