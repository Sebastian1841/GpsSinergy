import { computed, ref, unref, watch } from "vue"
import {
  DEFAULT_GEOFENCE_HISTORY_DATE_PRESET,
  formatGeofenceHistoryEventDate,
  geofenceHistoryPageSizeOptions,
  getGeofenceHistoryDefaultSortDirection,
  getGeofenceHistoryDurationSeconds,
  getGeofenceHistoryEventDateValue,
  getGeofenceHistoryEventLabel,
  getGeofenceHistoryNumericValue,
  normalizeGeofenceHistoryText,
  parseGeofenceHistoryEventDate,
  parseGeofenceHistoryLocalDateInput,
} from "../../../utils/activos/geofenceHistoryUtils.js"

const buildDateRangeForPreset = ({ datePreset, dateFrom, dateTo }) => {
  const now = new Date()

  if (datePreset === "all") {
    return {
      start: null,
      end: null,
    }
  }

  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (datePreset === "today") {
    return {
      start: start.getTime(),
      end: end.getTime(),
    }
  }

  if (datePreset === "7d") {
    start.setDate(start.getDate() - 6)

    return {
      start: start.getTime(),
      end: end.getTime(),
    }
  }

  if (datePreset === "30d") {
    start.setDate(start.getDate() - 29)

    return {
      start: start.getTime(),
      end: end.getTime(),
    }
  }

  return {
    start: parseGeofenceHistoryLocalDateInput(dateFrom),
    end: parseGeofenceHistoryLocalDateInput(dateTo, true),
  }
}

export function useGeofenceHistoryRows({ events }) {
  const searchTerm = ref("")
  const datePreset = ref(DEFAULT_GEOFENCE_HISTORY_DATE_PRESET)
  const dateFrom = ref("")
  const dateTo = ref("")

  const sortKey = ref("date")
  const sortDirection = ref("desc")

  const currentPage = ref(1)
  const pageSize = ref(50)

  const safeEvents = computed(() => {
    const value = unref(events)

    return Array.isArray(value) ? value : []
  })

  const normalizedRows = computed(() => {
    return safeEvents.value.map((event, index) => {
      const rawDate = getGeofenceHistoryEventDateValue(event)
      const time = parseGeofenceHistoryEventDate(rawDate)
      const eventLabel = getGeofenceHistoryEventLabel(event.eventType)
      const displayDate = formatGeofenceHistoryEventDate(rawDate, time)

      const searchText = normalizeGeofenceHistoryText(
        [
          event.patent,
          event.vehicle,
          event.driver,
          event.eventLabel,
          eventLabel,
          displayDate,
          event.speed,
          event.duration,
        ].join(" "),
      )

      return {
        key: event.id || `${event.patent || event.vehicle || "event"}-${rawDate || index}`,
        index,
        event,
        eventLabel,
        displayDate,
        searchText,
        time,
      }
    })
  })

  const activeDateRange = computed(() => {
    return buildDateRangeForPreset({
      datePreset: datePreset.value,
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
    })
  })

  const searchNeedle = computed(() => {
    return normalizeGeofenceHistoryText(searchTerm.value)
  })

  const filteredRows = computed(() => {
    const needle = searchNeedle.value
    const { start, end } = activeDateRange.value

    return normalizedRows.value.filter((row) => {
      if (needle && !row.searchText.includes(needle)) {
        return false
      }

      if (!start && !end) {
        return true
      }

      if (!row.time) {
        return false
      }

      if (start && row.time < start) {
        return false
      }

      if (end && row.time > end) {
        return false
      }

      return true
    })
  })

  const getSortValue = (row) => {
    if (sortKey.value === "vehicle") {
      return normalizeGeofenceHistoryText(row.event.patent || row.event.vehicle || "")
    }

    if (sortKey.value === "event") {
      return normalizeGeofenceHistoryText(row.event.eventLabel || row.eventLabel)
    }

    if (sortKey.value === "date") {
      return row.time || 0
    }

    if (sortKey.value === "speed") {
      return getGeofenceHistoryNumericValue(row.event.speed)
    }

    if (sortKey.value === "duration") {
      return getGeofenceHistoryDurationSeconds(row.event.duration)
    }

    return ""
  }

  const sortedRows = computed(() => {
    const direction = sortDirection.value === "asc" ? 1 : -1

    return [...filteredRows.value].sort((a, b) => {
      const firstValue = getSortValue(a)
      const secondValue = getSortValue(b)

      if (typeof firstValue === "number" && typeof secondValue === "number") {
        const result = firstValue - secondValue

        return result === 0 ? a.index - b.index : result * direction
      }

      const result = String(firstValue).localeCompare(String(secondValue), "es", {
        numeric: true,
        sensitivity: "base",
      })

      return result === 0 ? a.index - b.index : result * direction
    })
  })

  const totalItems = computed(() => sortedRows.value.length)

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

  const paginatedRows = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value

    return sortedRows.value.slice(start, end)
  })

  const toggleSort = (key) => {
    if (sortKey.value === key) {
      sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
      return
    }

    sortKey.value = key
    sortDirection.value = getGeofenceHistoryDefaultSortDirection(key)
  }

  const getSortIcon = (key) => {
    if (sortKey.value !== key) return "↕"

    return sortDirection.value === "asc" ? "↑" : "↓"
  }

  const uniqueVehicles = computed(() => {
    return new Set(
      filteredRows.value.map((row) => row.event.patent || row.event.vehicle).filter(Boolean),
    ).size
  })

  const entryCount = computed(() => {
    return filteredRows.value.filter((row) => row.event.eventType === "entry").length
  })

  const exitCount = computed(() => {
    return filteredRows.value.filter((row) => row.event.eventType === "exit").length
  })

  const metrics = computed(() => [
    {
      label: "Eventos",
      value: filteredRows.value.length,
      orange: false,
    },
    {
      label: "Vehiculos",
      value: uniqueVehicles.value,
      orange: false,
    },
    {
      label: "Entradas",
      value: entryCount.value,
      orange: true,
    },
    {
      label: "Salidas",
      value: exitCount.value,
      orange: true,
    },
  ])

  const hasActiveFilters = computed(() => {
    return Boolean(searchTerm.value) || datePreset.value !== DEFAULT_GEOFENCE_HISTORY_DATE_PRESET
  })

  const resetFiltersToDefault = () => {
    searchTerm.value = ""
    datePreset.value = DEFAULT_GEOFENCE_HISTORY_DATE_PRESET
    dateFrom.value = ""
    dateTo.value = ""
    sortKey.value = "date"
    sortDirection.value = "desc"
    currentPage.value = 1
  }

  const clearFilters = () => {
    resetFiltersToDefault()
  }

  watch([pageSize, totalItems], () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }

    if (currentPage.value < 1) {
      currentPage.value = 1
    }
  })

  watch([searchTerm, datePreset, dateFrom, dateTo, sortKey, sortDirection], () => {
    currentPage.value = 1
  })

  return {
    searchTerm,
    datePreset,
    dateFrom,
    dateTo,
    currentPage,
    pageSize,
    pageSizeOptions: geofenceHistoryPageSizeOptions,

    normalizedRows,
    metrics,
    hasActiveFilters,
    totalItems,
    totalPages,
    paginationStart,
    paginationEnd,
    paginatedRows,

    toggleSort,
    getSortIcon,
    resetFiltersToDefault,
    clearFilters,
  }
}
