import { computed } from "vue"

import {
  MAINTENANCE_BASE_COST_ROWS,
  MAINTENANCE_COST_FORM_FIELDS,
  MAINTENANCE_LIFECYCLE_STEPS,
} from "../../utils/maintenance/maintenanceModuleConfig.js"
import { formatCurrency, formatNumber } from "../../utils/maintenance/maintenanceFormatUtils.js"

export function useMaintenanceDerivedData({
  activeTab,
  extraCostRows,
  maintenanceSummaryMetrics,
  selectedVehicle,
  workOrders,
}) {
  const orderSummaryMetrics = computed(() => {
    const countOrdersByStatus = (status) => {
      return workOrders.value.filter((order) => order.status === status).length
    }
    const total = workOrders.value.length || 1
    const percent = (status) =>
      `${Math.round((countOrdersByStatus(status) / total) * 100)}% del total`

    return [
      {
        key: "scheduled",
        label: "Programadas",
        value: countOrdersByStatus("scheduled"),
        detail: percent("scheduled"),
        dotClass: "bg-blue-500",
        filter: "scheduled",
      },
      {
        key: "in-progress",
        label: "En proceso",
        value: countOrdersByStatus("in-progress"),
        detail: percent("in-progress"),
        dotClass: "bg-[#ff6600]",
        filter: "in-progress",
      },
      {
        key: "waiting",
        label: "En espera",
        value: countOrdersByStatus("waiting"),
        detail: percent("waiting"),
        dotClass: "bg-slate-400",
        filter: "waiting",
      },
      {
        key: "finished",
        label: "Finalizadas",
        value: countOrdersByStatus("finished"),
        detail: percent("finished"),
        dotClass: "bg-emerald-500",
        filter: "finished",
      },
      {
        key: "cancelled",
        label: "Canceladas",
        value: countOrdersByStatus("cancelled"),
        detail: percent("cancelled"),
        dotClass: "bg-rose-500",
        filter: "cancelled",
      },
    ]
  })

  const currentSummaryMetrics = computed(() => {
    if (activeTab.value === "orders" || activeTab.value === "calendar") {
      return orderSummaryMetrics.value
    }

    return maintenanceSummaryMetrics.value
  })

  const upcomingOrders = computed(() => {
    return workOrders.value.slice(0, 5).map((order, index) => ({
      ...order,
      day: ["01", "04", "07", "09", "12"][index],
      month: "Ago",
      time: ["08:30", "09:00", "11:30", "10:00", "13:00"][index],
    }))
  })

  const calendarDays = computed(() => {
    const eventMap = new Map(
      upcomingOrders.value.map((order, index) => [
        Number(order.day),
        [
          {
            id: order.id,
            status: order.status,
            time: order.time,
            title: order.job,
          },
          ...(index === 1
            ? [
                {
                  id: "OT-311",
                  status: "in-progress",
                  time: "15:00",
                  title: "Revision secundaria",
                },
              ]
            : []),
        ],
      ]),
    )

    return Array.from({ length: 35 }, (_item, index) => {
      const number = index - 3

      return {
        key: `day-${index}`,
        events: number > 0 ? eventMap.get(number) || [] : [],
        number: number > 0 ? number : 29 + index,
        outside: number <= 0,
      }
    })
  })

  const lifecycleSteps = MAINTENANCE_LIFECYCLE_STEPS

  const maintenanceHistory = computed(() => {
    const vehicle = selectedVehicle.value

    return [
      {
        id: "hist-1",
        cost: formatCurrency(659000),
        date: "07/01/2026",
        invoice: "FAC-12578",
        job: "Servicio 125.000 km",
        reading: `${formatNumber(vehicle.odometer - 1100)} km`,
        type: "Servicio 125.000 km",
        workshop: vehicle.workshop,
      },
      {
        id: "hist-2",
        cost: formatCurrency(263000),
        date: "15/10/2025",
        invoice: "FAC-11234",
        job: "Cambio de aceite y filtros",
        reading: `${formatNumber(vehicle.odometer - 10840)} km`,
        type: "Servicio menor",
        workshop: vehicle.workshop,
      },
      {
        id: "hist-3",
        cost: formatCurrency(198500),
        date: "18/07/2025",
        invoice: "FAC-10489",
        job: "Revision de frenos",
        reading: `${formatNumber(vehicle.odometer - 21450)} km`,
        type: "Revision de frenos",
        workshop: "Frenos del Sur",
      },
      {
        id: "hist-4",
        cost: formatCurrency(612000),
        date: "22/04/2025",
        invoice: "FAC-10012",
        job: "Servicio 100.000 km",
        reading: `${formatNumber(vehicle.odometer - 33000)} km`,
        type: "Servicio 100.000 km",
        workshop: vehicle.workshop,
      },
    ]
  })

  const costSummary = computed(() => [
    {
      label: "Costo acumulado",
      value: formatCurrency(5124600),
      detail: "Ultimos 12 meses",
    },
    {
      label: "Costo promedio",
      value: formatCurrency(512460),
      detail: "Por servicio",
    },
    {
      label: "Ultimo costo",
      value: formatCurrency(1245600),
      detail: "24/05/2026",
    },
  ])

  const displayCostRows = computed(() => {
    return [...extraCostRows.value, ...MAINTENANCE_BASE_COST_ROWS]
  })

  return {
    calendarDays,
    costFormFields: MAINTENANCE_COST_FORM_FIELDS,
    costSummary,
    currentSummaryMetrics,
    displayCostRows,
    lifecycleSteps,
    maintenanceHistory,
    orderSummaryMetrics,
    upcomingOrders,
  }
}
