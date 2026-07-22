import { computed, ref, unref, watch } from "vue"
import {
  HEAVY_ITINERARY_ROWS_THRESHOLD,
  itineraryStatusLabels,
  itineraryStatusOrder,
  itineraryTablePageSizeOptions,
  normalizeItineraryTableText,
} from "../../../utils/activos/itineraryTableColumns.js"
import { getCellValue as getFleetTelemetryCellValue } from "../../../utils/activos/fleetTelemetryColumns.js"

const textCollator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
})

const parseSortableNumber = (value) => {
  if (value === null || value === undefined) return null

  const match = String(value).match(/-?\d[\d.,]*/)

  if (!match) return null

  const rawNumber = match[0]
  const hasComma = rawNumber.includes(",")
  const hasDot = rawNumber.includes(".")
  const normalizedNumber =
    hasComma && hasDot
      ? rawNumber.replace(/\./g, "").replace(",", ".")
      : hasComma
        ? rawNumber.replace(",", ".")
        : hasDot && (rawNumber.split(".").length > 2 || rawNumber.split(".").at(-1)?.length === 3)
          ? rawNumber.replace(/\./g, "")
          : rawNumber
  const parsedValue = Number(normalizedNumber)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

const parseSortableDate = (value) => {
  const timestamp = new Date(value || 0).getTime()

  return Number.isNaN(timestamp) ? null : timestamp
}

const formatCoordinate = (value) => {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return "-"

  return numberValue.toFixed(6)
}

const formatTimeFromTimestamp = (timestamp) => {
  const date = new Date(timestamp || 0)

  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const compareValues = (valueA, valueB) => {
  const emptyA = valueA === null || valueA === undefined || valueA === ""
  const emptyB = valueB === null || valueB === undefined || valueB === ""

  if (emptyA && emptyB) return 0
  if (emptyA) return 1
  if (emptyB) return -1

  if (typeof valueA === "number" && typeof valueB === "number") {
    return valueA - valueB
  }

  return textCollator.compare(String(valueA), String(valueB))
}

export function useItineraryTableRows({
  rows,
  route,
  selectedPointId,
  visibleColumns,
  columnsByKey,
}) {
  const sortColumnKey = ref("timestamp")
  const sortDirection = ref("desc")
  const currentPage = ref(1)
  const pageSize = ref(50)

  const sourceRows = computed(() => {
    const value = unref(rows)

    return Array.isArray(value) ? value : []
  })

  const routeAsset = computed(() => {
    return unref(route)?.asset || null
  })

  const selectedPointIdString = computed(() => {
    const value = unref(selectedPointId)

    if (value === null || value === undefined) return ""

    return String(value)
  })

  const hasCustomSort = computed(() => {
    return sortColumnKey.value !== "timestamp" || sortDirection.value !== "desc"
  })

  const hasHeavyItinerary = computed(() => {
    return sourceRows.value.length > HEAVY_ITINERARY_ROWS_THRESHOLD
  })

  const totalItems = computed(() => {
    return sourceRows.value.length
  })

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(totalItems.value / pageSize.value))
  })

  const paginationStart = computed(() => {
    if (!totalItems.value) return 0

    return (currentPage.value - 1) * pageSize.value + 1
  })

  const paginationEnd = computed(() => {
    return Math.min(currentPage.value * pageSize.value, totalItems.value)
  })

  const statusLabel = (status) => {
    return itineraryStatusLabels[status] || "Sin estado"
  }

  const getRouteAssetDisplayName = () => {
    return (
      routeAsset.value?.displayName ||
      routeAsset.value?.vehiculo ||
      routeAsset.value?.patente ||
      routeAsset.value?.name ||
      "-"
    )
  }

  const getRouteAssetPatente = () => {
    return (
      routeAsset.value?.patente || routeAsset.value?.patent || routeAsset.value?.vehiculo || "-"
    )
  }

  const getRouteAssetDeviceId = () => {
    return (
      routeAsset.value?.deviceId || routeAsset.value?.imei || routeAsset.value?.identificador || "-"
    )
  }

  const getRowTimeLabel = (row) => {
    return row.timeLabel || formatTimeFromTimestamp(row.timestamp || row.date || row.fecha)
  }

  const getCellValue = (row, column) => {
    if (column.key === "timestamp") return getRowTimeLabel(row)
    if (column.key === "status") return statusLabel(row.status)
    if (column.key === "speed") return row.speedLabel || `${row.speed || 0} km/h`
    if (column.key === "address") return row.address || "Sin direccion"
    if (column.key === "accumulatedDistanceKm") {
      return row.accumulatedDistanceLabel || "0,0 km"
    }

    if (column.telemetry) return getFleetTelemetryCellValue(row, column)

    if (column.key === "dateLabel") return row.dateLabel || "-"

    if (column.key === "assetDisplayName") {
      return row.assetDisplayName || row.assetPatente || getRouteAssetDisplayName()
    }

    if (column.key === "assetPatente") {
      return row.assetPatente || getRouteAssetPatente()
    }

    if (column.key === "assetDeviceId") {
      return row.assetDeviceId || getRouteAssetDeviceId()
    }

    if (column.key === "event") return row.event || "Reporte GPS"
    if (column.key === "lat" || column.key === "lng") return formatCoordinate(row[column.key])

    return row[column.key] ?? "-"
  }

  const getSortableValue = (row, columnKey) => {
    if (columnKey === "timestamp" || columnKey === "dateLabel") {
      return parseSortableDate(row.timestamp || row.date || row.fecha)
    }

    if (columnKey === "status") {
      return itineraryStatusOrder[row.status] || 99
    }

    if (columnKey === "speed") {
      return parseSortableNumber(row.speed ?? row.speedLabel)
    }

    if (columnKey === "accumulatedDistanceKm") {
      return parseSortableNumber(row.accumulatedDistanceKm ?? row.accumulatedDistanceLabel)
    }

    if (columnKey === "lat" || columnKey === "lng") {
      return parseSortableNumber(row[columnKey])
    }

    const column = unref(columnsByKey).get(columnKey)

    if (column?.numeric) {
      return parseSortableNumber(getCellValue(row, column))
    }

    return normalizeItineraryTableText(getCellValue(row, column || { key: columnKey }))
  }

  const toggleSort = (columnKey) => {
    if (sortColumnKey.value !== columnKey) {
      sortColumnKey.value = columnKey
      sortDirection.value = "asc"
      currentPage.value = 1
      return
    }

    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
    currentPage.value = 1
  }

  const resetSort = () => {
    sortColumnKey.value = "timestamp"
    sortDirection.value = "desc"
    currentPage.value = 1
  }

  const getSortIcon = (columnKey) => {
    if (sortColumnKey.value !== columnKey) return "-"

    return sortDirection.value === "asc" ? "^" : "v"
  }

  const getRowKey = (row, index) => {
    return [row.id, row.assetId, row.timestamp, row.lat, row.lng, row.speed, index]
      .map((value) => String(value ?? ""))
      .join("-")
  }

  const getCellTitle = (row, column) => {
    if (column.key === "address") {
      return [row.address || "Sin direccion", row.event || "Reporte GPS"].join(" - ")
    }

    return getCellValue(row, column)
  }

  const getCellClass = (row, column) => {
    return [
      column.align === "right" ? "text-right" : "text-left",
      selectedPointIdString.value === String(row.id) && column.key === unref(visibleColumns)[0]?.key
        ? "shadow-[inset_3px_0_0_#FF6600]"
        : "",
    ]
  }

  const isTimestampSort = computed(() => {
    return sortColumnKey.value === "timestamp"
  })

  const customSortedRowIndexes = computed(() => {
    if (isTimestampSort.value) return []

    const directionMultiplier = sortDirection.value === "asc" ? 1 : -1
    const columnKey = sortColumnKey.value
    const sortValues = sourceRows.value.map((row) => getSortableValue(row, columnKey))
    const rowIndexes = sourceRows.value.map((_, index) => index)

    rowIndexes.sort((indexA, indexB) => {
      const result = compareValues(sortValues[indexA], sortValues[indexB])

      if (result !== 0) {
        return result * directionMultiplier
      }

      return indexA - indexB
    })

    return rowIndexes
  })

  const paginatedRows = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value

    if (isTimestampSort.value) {
      if (sortDirection.value === "asc") {
        return sourceRows.value.slice(start, end)
      }

      const sourceLength = sourceRows.value.length
      const reversedStart = Math.max(sourceLength - end, 0)
      const reversedEnd = Math.max(sourceLength - start, 0)

      return sourceRows.value.slice(reversedStart, reversedEnd).reverse()
    }

    return customSortedRowIndexes.value.slice(start, end).map((index) => sourceRows.value[index])
  })

  const clampCurrentPage = () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }

    if (currentPage.value < 1) {
      currentPage.value = 1
    }
  }

  const goToPreviousPage = () => {
    currentPage.value = Math.max(1, currentPage.value - 1)
  }

  const goToNextPage = () => {
    currentPage.value = Math.min(totalPages.value, currentPage.value + 1)
  }

  watch(sourceRows, () => {
    currentPage.value = 1
  })

  watch([pageSize, totalItems], () => {
    clampCurrentPage()
  })

  return {
    pageSizeOptions: itineraryTablePageSizeOptions,
    sortColumnKey,
    currentPage,
    pageSize,

    hasCustomSort,
    hasHeavyItinerary,
    totalItems,
    totalPages,
    paginationStart,
    paginationEnd,
    paginatedRows,

    statusLabel,
    toggleSort,
    resetSort,
    getSortIcon,
    getRowKey,
    getRowTimeLabel,
    getCellValue,
    getCellTitle,
    getCellClass,
    goToPreviousPage,
    goToNextPage,
  }
}
