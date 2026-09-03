import { computed, ref, watch } from "vue"

const parseLocalDate = (value) => {
  const [year, month, day] = String(value || "")
    .split("-")
    .map(Number)

  if (!year || !month || !day) return new Date()

  return new Date(year, month - 1, day)
}

const formatLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const getWeekStart = (date) => {
  const startDate = new Date(date)
  const day = startDate.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1

  startDate.setDate(startDate.getDate() - daysFromMonday)

  return startDate
}

export function useItineraryFilters({ latestDate, addDays, rangeOptions }) {
  const activePanelView = ref("itinerarios")
  const searchTerm = ref("")
  const showDeviceList = ref(false)
  const dateRange = ref("today")
  const fromDate = ref(latestDate)
  const toDate = ref(latestDate)
  const formError = ref("")

  const activeRangeLabel = computed(() => {
    if (dateRange.value === "custom") {
      return `${fromDate.value || "-"} / ${toDate.value || "-"}`
    }

    if (dateRange.value === "week") return "Esta semana"
    if (dateRange.value === "last-week") return "Ultima semana"
    if (dateRange.value === "month") return "Este mes"
    if (dateRange.value === "last-month") return "Ultimo mes"

    return rangeOptions.find((option) => option.value === dateRange.value)?.label || "Hoy"
  })

  const applyDateRange = () => {
    if (dateRange.value === "custom") return

    if (dateRange.value === "today") {
      fromDate.value = latestDate
      toDate.value = latestDate
      return
    }

    if (dateRange.value === "yesterday") {
      const yesterday = addDays(latestDate, -1)
      fromDate.value = yesterday
      toDate.value = yesterday
      return
    }

    if (dateRange.value === "week") {
      fromDate.value = formatLocalDate(getWeekStart(parseLocalDate(latestDate)))
      toDate.value = latestDate
      return
    }

    if (dateRange.value === "last-week") {
      const currentWeekStart = getWeekStart(parseLocalDate(latestDate))

      fromDate.value = addDays(formatLocalDate(currentWeekStart), -7)
      toDate.value = addDays(formatLocalDate(currentWeekStart), -1)
      return
    }

    if (dateRange.value === "month") {
      const baseDate = parseLocalDate(latestDate)

      fromDate.value = formatLocalDate(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1))
      toDate.value = latestDate
      return
    }

    if (dateRange.value === "last-month") {
      const baseDate = parseLocalDate(latestDate)

      fromDate.value = formatLocalDate(new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1))
      toDate.value = formatLocalDate(new Date(baseDate.getFullYear(), baseDate.getMonth(), 0))
    }
  }

  const setDateRange = (range) => {
    dateRange.value = range
    applyDateRange()
  }

  const openDeviceDropdown = () => {
    showDeviceList.value = true
  }

  const clearSearchTerm = () => {
    searchTerm.value = ""
    showDeviceList.value = true
  }

  watch(dateRange, () => {
    applyDateRange()
  })

  applyDateRange()

  return {
    activePanelView,
    searchTerm,
    showDeviceList,
    dateRange,
    fromDate,
    toDate,
    formError,
    activeRangeLabel,

    setDateRange,
    applyDateRange,
    openDeviceDropdown,
    clearSearchTerm,
  }
}
