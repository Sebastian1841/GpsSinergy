import { asText, compareSortText, normalizeSortText } from "./itineraryExportFormatUtils.js"

export const ASSET_TABLE_COLUMNS = [
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

export const getAssetTableColumns = (report = {}) => {
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

export const getDetailColumns = (report = {}) => {
  return Array.isArray(report.detailColumns) && report.detailColumns.length
    ? report.detailColumns
    : DEFAULT_DETAIL_COLUMNS
}

export const getDetailCellValue = (reportRow, column) => {
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

export const getSortedReportRows = (rows = []) => {
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

export const getChronologicalReportRows = (rows = []) => {
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

export const getSortedReportAssets = (assets = []) => {
  return [...assets].sort((firstAsset, secondAsset) => {
    const deviceComparison = compareSortText(
      getReportAssetDeviceId(firstAsset),
      getReportAssetDeviceId(secondAsset),
    )

    return deviceComparison || compareSortText(firstAsset.name, secondAsset.name)
  })
}

const metricColorKeys = ["navy", "teal", "orange", "blue"]

export const getCustomMetricItems = ({ report, colorSet }) => {
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
