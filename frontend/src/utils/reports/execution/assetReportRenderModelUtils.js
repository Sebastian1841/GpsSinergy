import { getPdfHiddenReportColumns, getPdfVisibleReportColumns } from "./assetReportColumnUtils.js"
import { normalizeReportText } from "./assetReportAssetUtils.js"
import { getExcelColumnWidth, parseExcelChartNumber } from "../export/assetReportExcelUtils.js"

export const ASSET_REPORT_PREVIEW_FORMAT_IDS = {
  pdf: "pdf",
  excel: "excel",
}

export const ROUTE_HISTORY_REPORT_TYPE_ID = "route-history"
export const STOPS_REPORT_TYPE_ID = "stops"

export const REPORT_ASSET_TABLE_COLUMNS = [
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

const STOPS_DETAIL_COLUMNS = [
  {
    key: "index",
    label: "N",
    width: 8,
    align: "center",
  },
  {
    key: "time",
    label: "Hora inicio",
    width: 16,
    align: "center",
  },
  {
    key: "endTime",
    label: "Hora termino",
    width: 16,
    align: "center",
  },
  {
    key: "duration",
    label: "Duracion",
    width: 16,
    align: "center",
  },
  {
    key: "address",
    label: "Ubicacion",
    width: 58,
  },
  {
    key: "lat",
    label: "Lat.",
    width: 16,
    align: "right",
  },
  {
    key: "lng",
    label: "Long.",
    width: 16,
    align: "right",
  },
]

const metricColorKeys = ["navy", "teal", "orange", "blue"]
const ITINERARY_CELL_KEYS = new Set([
  "asset",
  "patent",
  "deviceId",
  "date",
  "time",
  "endTime",
  "status",
  "speed",
  "event",
  "duration",
  "distance",
  "address",
  "lat",
  "lng",
])

const asText = (value, fallback = "-") => {
  const text = String(value ?? "").trim()
  return text || fallback
}

const firstText = (...values) => {
  return values.map((value) => String(value ?? "").trim()).find((value) => value && value !== "-")
}

const normalizeSortText = (value) => String(value ?? "").trim()

const compareSortText = (firstValue, secondValue) => {
  const firstText = normalizeSortText(firstValue)
  const secondText = normalizeSortText(secondValue)

  if (!firstText && secondText) return 1
  if (firstText && !secondText) return -1

  return firstText.localeCompare(secondText, "es", {
    numeric: true,
    sensitivity: "base",
  })
}

const normalizeReportColumn = (column = {}) => {
  return {
    ...column,
    key: column.key || column.id,
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

export const getReportRowValue = (row, key, fallback = "-") => {
  const value = row?.values?.[key]

  if (value !== undefined && value !== null && String(value).trim() !== "") return value

  return fallback
}

export const getReportSourceValue = (row, keys = [], fallback = "-") => {
  const sources = [row?.report, row?.generatedEvent?.report, row?.asset]

  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key]

      if (value !== undefined && value !== null && String(value).trim() !== "") return value
    }
  }

  return fallback
}

export const getReportRowText = (row = {}, keys = [], fallback = "-") => {
  const sources = [
    row.values,
    row.itineraryRow,
    row.report,
    row.generatedEvent?.report,
    row.asset,
    row,
  ]

  for (const key of keys) {
    for (const source of sources) {
      const value = source?.[key]
      const text = String(value ?? "").trim()

      if (text && text !== "-") return text
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

export const parseReportDurationMinutes = (value) => {
  const text = String(value ?? "")
    .trim()
    .toLowerCase()

  if (!text || text === "-") return null

  const hourMatch = text.match(/(\d+(?:[.,]\d+)?)\s*h/)
  const minuteMatch = text.match(/(\d+(?:[.,]\d+)?)\s*min/)
  const secondMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:seg|s)\b/)
  const colonMatch = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)

  if (colonMatch) {
    const [, hours, minutes, seconds = "0"] = colonMatch

    return Number(hours) * 60 + Number(minutes) + Number(seconds) / 60
  }

  const hours = hourMatch ? Number(hourMatch[1].replace(",", ".")) : 0
  const minutes = minuteMatch ? Number(minuteMatch[1].replace(",", ".")) : 0
  const seconds = secondMatch ? Number(secondMatch[1].replace(",", ".")) : 0
  const totalMinutes = hours * 60 + minutes + seconds / 60

  return Number.isFinite(totalMinutes) && totalMinutes > 0 ? totalMinutes : null
}

export const formatReportDurationMinutes = (minutes) => {
  const totalMinutes = Math.max(0, Math.round(Number(minutes || 0)))
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  if (hours > 0) return `${hours} h ${remainingMinutes} min`

  return `${remainingMinutes} min`
}

const getStopEndTimeLabel = ({ row, startDate, startTime, duration }) => {
  const explicitEndTime = firstText(
    row.values?.endTime,
    row.values?.horaTermino,
    row.report?.endTime,
    row.report?.horaTermino,
    row.report?.horaFin,
    row.report?.endedAt,
  )

  if (explicitEndTime) return explicitEndTime

  const durationMinutes = parseReportDurationMinutes(duration)

  if (durationMinutes === null || !startDate || !startTime || startTime === "-") return "-"

  const startDateTime = new Date(`${startDate}T${startTime}`)

  if (Number.isNaN(startDateTime.getTime())) return "-"

  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000)

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(endDateTime)
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

const getReportAssetKey = (row, index = 0) => {
  return asText(
    row?.asset?.id ||
      row?.asset?.activoId ||
      row?.asset?.deviceId ||
      row?.values?.deviceId ||
      row?.values?.patente ||
      row?.id ||
      `asset-${index}`,
    `asset-${index}`,
  )
}

export const buildItineraryRowsFromReport = (reportRows = []) => {
  return reportRows.map((row, index) => {
    const { date, time } = splitReportDateTime(row)
    const { lat, lng } = getReportCoordinates(row)
    const itineraryRow = row?.itineraryRow || {}
    const duration = getReportRowValue(
      row,
      "duracion",
      getReportSourceValue(
        row,
        [
          "duracion",
          "durationLabel",
          "duration",
          "tiempo",
          "idleDurationLabel",
          "ralentiDurationLabel",
        ],
        "-",
      ),
    )

    return {
      index: index + 1,
      timestamp:
        row?.timestamp ||
        itineraryRow.timestamp ||
        row?.generatedEvent?.timestamp ||
        row?.report?.timestamp ||
        row?.report?.reportedAt ||
        "",
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
      endTime: getStopEndTimeLabel({
        row,
        startDate: date,
        startTime: itineraryRow.timeLabel || time,
        duration,
      }),
      status: normalizeReportStatus(row),
      speed:
        itineraryRow.speedLabel ||
        getReportRowValue(row, "velocidad", getReportSourceValue(row, ["speedLabel", "speed"])),
      event:
        itineraryRow.event ||
        getReportRowValue(row, "evento", getReportSourceValue(row, ["event", "evento"])),
      duration,
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

export const getReportTypeId = (template = {}) => {
  return String(template?.reportTypeId || "").trim()
}

export const isRouteHistoryReportTemplate = (template = {}) => {
  return getReportTypeId(template) === ROUTE_HISTORY_REPORT_TYPE_ID
}

export const isStopsReportTemplate = (template = {}) => {
  return getReportTypeId(template) === STOPS_REPORT_TYPE_ID
}

export const isRouteMapReportTemplate = (template = {}) => {
  return isRouteHistoryReportTemplate(template) || isStopsReportTemplate(template)
}

export const getReportDetailColumns = (reportColumns = []) => {
  return [
    {
      key: "index",
      label: "#",
      width: 8,
    },
    ...reportColumns.map((column) => ({
      key: column.key || column.id,
      label: column.label,
      width: getExcelColumnWidth(column),
    })),
  ]
}

export const buildItineraryAssetsFromReport = ({ reportRows = [], itineraryRows = [] }) => {
  const assetsByKey = new Map()

  reportRows.forEach((row, index) => {
    const assetKey = getReportAssetKey(row, index)
    const itineraryRow = itineraryRows[index]
    const currentAsset = assetsByKey.get(assetKey) || {
      key: assetKey,
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

  return Array.from(assetsByKey.values())
    .map(({ maxDistance, ...asset }) => ({
      ...asset,
      distanceLabel: maxDistance ? `${maxDistance.toLocaleString("es-CL")} km` : "-",
    }))
    .sort((firstAsset, secondAsset) => {
      return (
        compareSortText(firstAsset.deviceId, secondAsset.deviceId) ||
        compareSortText(firstAsset.name, secondAsset.name)
      )
    })
}

export const getAverageSpeedLabel = (itineraryRows = []) => {
  const speeds = itineraryRows
    .map((row) => parseExcelChartNumber(row.speed))
    .filter((speed) => Number.isFinite(speed) && speed > 0)

  if (!speeds.length) return "0 km/h"

  const average = speeds.reduce((total, speed) => total + speed, 0) / speeds.length

  return `${average.toLocaleString("es-CL", {
    maximumFractionDigits: 1,
  })} km/h`
}

export const getReportDateRange = ({ dateFrom, dateTo, itineraryRows }) => {
  const rowDates = itineraryRows.map((row) => row.date).filter((date) => date && date !== "-")

  return {
    fromDate: dateFrom || rowDates.at(-1) || "-",
    toDate: dateTo || rowDates[0] || "-",
  }
}

const getReportDateRangeLabel = ({ fromDate, toDate }) => {
  if (fromDate && toDate && fromDate !== toDate) return `${fromDate} a ${toDate}`

  return fromDate || toDate || "-"
}

const buildReportMetrics = ({
  itineraryRows,
  assets,
  isRouteHistoryReport,
  isStopsReport,
  totalDistanceLabel,
  totalStoppedMinutes,
}) => {
  const moving = itineraryRows.filter((row) => row.status === "Movimiento").length
  const stopped = itineraryRows.filter((row) => row.status === "Detenido").length
  const offline = itineraryRows.filter((row) => row.status === "Offline").length
  const stopLocationCount = new Set(
    itineraryRows.map((row) => String(row.address || "").trim()).filter(Boolean),
  ).size

  if (isRouteHistoryReport) {
    return [
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
  }

  if (isStopsReport) {
    return [
      {
        label: "Detenciones",
        value: itineraryRows.length,
        colorKey: "navy",
      },
      {
        label: "Activos",
        value: assets.length,
        colorKey: "teal",
      },
      {
        label: "Tiempo detenido",
        value: formatReportDurationMinutes(totalStoppedMinutes),
        colorKey: "orange",
      },
      {
        label: "Ubicaciones",
        value: stopLocationCount,
        colorKey: "blue",
      },
    ]
  }

  return [
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
  ]
}

const normalizeMetricColorKeys = (metrics = []) => {
  return metrics.map((metric, index) => ({
    ...metric,
    colorKey: metric.colorKey || metricColorKeys[index] || "navy",
  }))
}

export const getReportRenderCellValue = (row = {}, column = {}, rowIndex = 0) => {
  if (column.key === "index" || column.key === "__rowIndex") return rowIndex + 1

  const value = row.values?.[column.key]
  const text = String(value ?? "").trim()

  if (text) return text

  if (ITINERARY_CELL_KEYS.has(column.key)) {
    const itineraryRow = row.itineraryRow || buildItineraryRowsFromReport([row])[0] || {}
    const itineraryValue = itineraryRow[column.key]
    const itineraryText = String(itineraryValue ?? "").trim()

    if (itineraryText) return itineraryText
  }

  return getReportRowText(row, [column.key])
}

export const buildAssetReportRenderModel = ({
  template,
  reportColumns,
  reportRows,
  charts = {},
  dateFrom = "",
  dateTo = "",
  selectedGroupLabel = "",
  selectedAssetCount = null,
  format = ASSET_REPORT_PREVIEW_FORMAT_IDS.excel,
  previewRows = null,
  routeMapImageDataUrl = "",
  generatedAt = null,
} = {}) => {
  const exportReportColumns = Array.isArray(reportColumns)
    ? reportColumns.map(normalizeReportColumn).filter((column) => column.key)
    : []
  const sourceRows = Array.isArray(reportRows) ? reportRows : []
  const sourcePreviewRows = Array.isArray(previewRows) ? previewRows : sourceRows
  const isPdf = format === ASSET_REPORT_PREVIEW_FORMAT_IDS.pdf
  const isExcel = !isPdf
  const visibleReportColumns = isPdf
    ? getPdfVisibleReportColumns(exportReportColumns)
    : exportReportColumns
  const hiddenPdfColumns = isPdf ? getPdfHiddenReportColumns(exportReportColumns) : []
  const itineraryRows = buildItineraryRowsFromReport(sourceRows)
  const assets = buildItineraryAssetsFromReport({ reportRows: sourceRows, itineraryRows })
  const isRouteHistoryReport = isRouteHistoryReportTemplate(template)
  const isStopsReport = isStopsReportTemplate(template)
  const isRouteMapReport = isRouteMapReportTemplate(template)
  const rowsLabel = isRouteHistoryReport ? "viajes" : isStopsReport ? "detenciones" : "eventos"
  const totalDistanceKm = itineraryRows.reduce((total, row) => {
    const distance = parseExcelChartNumber(row.distance)

    return total + (Number.isFinite(distance) ? distance : 0)
  }, 0)
  const totalDistanceLabel = `${Number(totalDistanceKm.toFixed(1)).toLocaleString("es-CL")} km`
  const totalStoppedMinutes = itineraryRows.reduce((total, row) => {
    return total + (parseReportDurationMinutes(row.duration) || 0)
  }, 0)
  const generatedAtLabel =
    generatedAt ||
    new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date())
  const resolvedRange = getReportDateRange({ dateFrom, dateTo, itineraryRows })
  const rangeLabel = getReportDateRangeLabel(resolvedRange)
  const headerTitle = template?.name || "Reporte de activos"
  const selectedAssetsSummary = isRouteHistoryReport
    ? `${assets.length} activos con viajes`
    : isStopsReport
      ? `${assets.length} activos con detenciones`
      : `${assets.length} activos con reglas de evento`
  const metrics = normalizeMetricColorKeys(
    buildReportMetrics({
      itineraryRows,
      assets,
      isRouteHistoryReport,
      isStopsReport,
      totalDistanceLabel,
      totalStoppedMinutes,
    }),
  )
  const previewColumns = isStopsReport
    ? STOPS_DETAIL_COLUMNS
    : getReportDetailColumns(visibleReportColumns)
  const hiddenPdfDetailColumns = hiddenPdfColumns.length
    ? getReportDetailColumns(hiddenPdfColumns)
    : []
  const rowCountLabel = `${sourcePreviewRows.length} de ${sourceRows.length} filas`

  return {
    format: isPdf ? ASSET_REPORT_PREVIEW_FORMAT_IDS.pdf : ASSET_REPORT_PREVIEW_FORMAT_IDS.excel,
    isPdf,
    isExcel,
    isRouteHistoryReport,
    isStopsReport,
    isRouteMapReport,
    reportTypeId: getReportTypeId(template),
    headerTitle,
    previewTitle: headerTitle,
    title: template?.description || "Exportacion operativa de flota",
    detailTitle: isRouteHistoryReport
      ? "Detalle de viajes"
      : isStopsReport
        ? "Detalle de detenciones"
        : "Detalle GPS",
    subtitle: isPdf
      ? `${headerTitle} - ${rangeLabel} | PDF compacto`
      : `Hoja Reporte - ${selectedAssetsSummary} | ${rangeLabel}`,
    tableLabel: isPdf
      ? hiddenPdfColumns.length
        ? `${rowCountLabel} | PDF compacto`
        : `${rowCountLabel} | PDF`
      : `${rowCountLabel} | Excel completo`,
    footerLabel: isPdf ? "Vista previa PDF" : "Vista previa Excel",
    rowsLabel,
    selectedAssetsSummary,
    generatedAt: generatedAtLabel,
    fromDate: resolvedRange.fromDate,
    toDate: resolvedRange.toDate,
    rangeLabel,
    details: [
      {
        label: "Reporte",
        value: headerTitle,
      },
      {
        label: "Periodo",
        value: rangeLabel,
      },
      {
        label: "Grupo",
        value: selectedGroupLabel || "Todos los grupos",
      },
      {
        label: "Activos",
        value:
          selectedAssetCount === null || selectedAssetCount === undefined
            ? selectedAssetsSummary
            : `${selectedAssetCount} patentes seleccionadas`,
      },
    ],
    excelDetails: [
      {
        label: "Reporte",
        value: headerTitle,
      },
      {
        label: "Periodo",
        value: rangeLabel,
      },
      {
        label: "Activos",
        value: selectedAssetsSummary,
      },
      {
        label: "Generado",
        value: generatedAtLabel,
      },
    ],
    columns: {
      all: exportReportColumns,
      visible: previewColumns,
      pdfVisible: getPdfVisibleReportColumns(exportReportColumns),
      pdfHidden: getPdfHiddenReportColumns(exportReportColumns),
      hiddenPdfDetail: hiddenPdfDetailColumns,
    },
    hiddenPdfColumnCount: hiddenPdfColumns.length,
    hiddenPdfColumnLabels: hiddenPdfColumns.map((column) => column.label).filter(Boolean),
    previewRows: sourcePreviewRows,
    hiddenPreviewRowCount: Math.max(0, sourceRows.length - sourcePreviewRows.length),
    itineraryRows,
    metrics,
    summary: {
      distanceLabel: isRouteHistoryReport
        ? totalDistanceLabel
        : isStopsReport
          ? `${itineraryRows.length} detenciones`
          : `${itineraryRows.length} eventos`,
      movingLabel: isRouteHistoryReport
        ? `${itineraryRows.length} viajes`
        : `${metrics[1]?.value || 0} eventos`,
      stoppedLabel: isRouteHistoryReport
        ? `${assets.length} activos`
        : isStopsReport
          ? formatReportDurationMinutes(totalStoppedMinutes)
          : `${metrics[2]?.value || 0} eventos`,
      averageSpeedLabel: getAverageSpeedLabel(itineraryRows),
    },
    charts,
    routeMap: isRouteMapReport
      ? {
          title: isStopsReport ? "Mapa de detenciones" : "Mapa de viajes",
          image: routeMapImageDataUrl,
        }
      : null,
    assetColumns: REPORT_ASSET_TABLE_COLUMNS,
    assets,
  }
}

export const buildItineraryCompatibleReport = (options = {}) => {
  const model = buildAssetReportRenderModel(options)

  return {
    filename: createReportBaseFilename(options.template?.name),
    headerTitle: model.headerTitle,
    pdfLayout: model.isStopsReport ? "stops-operational" : "default",
    reportTypeId: model.reportTypeId,
    title: model.title,
    detailTitle: model.detailTitle,
    detailColumns: model.columns.visible,
    rowsLabel: model.rowsLabel,
    selectedAssetsSummary: model.selectedAssetsSummary,
    hiddenPdfColumnCount: model.hiddenPdfColumnCount,
    hiddenPdfColumnLabels: model.hiddenPdfColumnLabels,
    hiddenPdfDetailColumns: model.columns.hiddenPdfDetail,
    generatedAt: model.generatedAt,
    fromDate: model.fromDate,
    toDate: model.toDate,
    summary: model.summary,
    metrics: model.metrics,
    charts: model.charts,
    routeMap: model.routeMap,
    assetColumns: model.assetColumns,
    assets: model.assets,
    rows: model.itineraryRows,
  }
}
