import { computed, ref, watch } from "vue"

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
      fromDate.value = addDays(latestDate, -6)
      toDate.value = latestDate
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
