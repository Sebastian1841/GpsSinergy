import { computed } from "vue"

import { useDebouncedValue } from "../ui/useDebouncedValue.js"
import { normalizeText } from "../../utils/maintenance/maintenanceFormatUtils.js"
import { getOrderStatusLabel } from "../../utils/maintenance/maintenanceUiUtils.js"

export function useMaintenanceOverviewFilters({
  maintenanceItems,
  searchTerm,
  selectedStatus,
  selectedType,
  selectedWorkshop,
}) {
  const workshopOptions = computed(() => {
    return [...new Set(maintenanceItems.value.map((item) => item.workshop))].sort()
  })
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 180)

  const filteredMaintenanceItems = computed(() => {
    const query = normalizeText(debouncedSearchTerm.value)

    return maintenanceItems.value.filter((item) => {
      if (selectedStatus.value !== "all" && item.status !== selectedStatus.value) return false
      if (selectedType.value !== "all" && item.type !== selectedType.value) return false
      if (selectedWorkshop.value !== "all" && item.workshop !== selectedWorkshop.value) {
        return false
      }

      if (!query) return true

      return [
        item.assetName,
        item.plate,
        item.companyName,
        item.intervalLabel,
        item.responsible,
        item.readingSourceLabel,
        item.type,
        item.workshop,
        item.nextJob,
      ].some((value) => normalizeText(value).includes(query))
    })
  })

  const overviewMaintenanceItems = computed(() => {
    return filteredMaintenanceItems.value.slice(0, 5)
  })

  const hasHourMeterData = computed(() => {
    return filteredMaintenanceItems.value.some((item) => item.hourMeterHours !== null)
  })

  const countByStatus = (status) => {
    return maintenanceItems.value.filter((item) => item.status === status).length
  }

  const maintenanceSummaryMetrics = computed(() => [
    {
      key: "current",
      label: "Al dia",
      value: countByStatus("current"),
      detail: "vehiculos",
      dotClass: "bg-emerald-500",
      filter: "current",
    },
    {
      key: "due",
      label: "Proximas",
      value: countByStatus("due"),
      detail: "vehiculos",
      dotClass: "bg-amber-500",
      filter: "due",
    },
    {
      key: "overdue",
      label: "Vencidas",
      value: countByStatus("overdue"),
      detail: "vehiculos",
      dotClass: "bg-rose-500",
      filter: "overdue",
    },
    {
      key: "unconfigured",
      label: "Sin configurar",
      value: countByStatus("unconfigured"),
      detail: "vehiculos",
      dotClass: "bg-slate-400",
      filter: "unconfigured",
    },
    {
      key: "workshop",
      label: "En taller",
      value: countByStatus("workshop"),
      detail: "vehiculos",
      dotClass: "bg-blue-500",
      filter: "workshop",
    },
  ])

  const clearFilters = () => {
    searchTerm.value = ""
    selectedStatus.value = "all"
    selectedType.value = "all"
    selectedWorkshop.value = "all"
  }

  const applyMetricFilter = (filter) => {
    if (!filter) return

    selectedStatus.value = filter
  }

  return {
    applyMetricFilter,
    clearFilters,
    filteredMaintenanceItems,
    hasHourMeterData,
    maintenanceSummaryMetrics,
    overviewMaintenanceItems,
    workshopOptions,
  }
}

export function useMaintenanceOrderFilters({
  orderSearchTerm,
  selectedOrderPriority,
  selectedOrderStatus,
  selectedOrderWorkshop,
  workOrders,
}) {
  const workOrderWorkshopOptions = computed(() => {
    return [...new Set(workOrders.value.map((order) => order.workshop))].sort()
  })
  const debouncedOrderSearchTerm = useDebouncedValue(orderSearchTerm, 180)

  const filteredWorkOrders = computed(() => {
    const query = normalizeText(debouncedOrderSearchTerm.value)

    return workOrders.value.filter((order) => {
      if (selectedOrderStatus.value !== "all" && order.status !== selectedOrderStatus.value) {
        return false
      }
      if (selectedOrderPriority.value !== "all" && order.priority !== selectedOrderPriority.value) {
        return false
      }
      if (selectedOrderWorkshop.value !== "all" && order.workshop !== selectedOrderWorkshop.value) {
        return false
      }

      if (!query) return true

      return [
        order.id,
        order.plate,
        order.job,
        order.workshop,
        order.owner,
        order.intervalLabel,
        order.type,
        order.priority,
        order.readingSourceLabel,
        getOrderStatusLabel(order.status),
      ].some((value) => normalizeText(value).includes(query))
    })
  })

  const visibleWorkOrders = computed(() => {
    return filteredWorkOrders.value.slice(0, 10)
  })

  const clearOrderFilters = () => {
    orderSearchTerm.value = ""
    selectedOrderStatus.value = "all"
    selectedOrderPriority.value = "all"
    selectedOrderWorkshop.value = "all"
  }

  const applyOrderMetricFilter = (filter) => {
    if (!filter) return

    selectedOrderStatus.value = filter
  }

  return {
    applyOrderMetricFilter,
    clearOrderFilters,
    filteredWorkOrders,
    visibleWorkOrders,
    workOrderWorkshopOptions,
  }
}
