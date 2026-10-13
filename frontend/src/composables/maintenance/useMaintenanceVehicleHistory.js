import { computed, ref, watch } from "vue"

export const useMaintenanceVehicleHistory = ({ orders, vehicleId }) => {
  const type = ref("all")
  const from = ref("")
  const to = ref("")
  const sort = ref({ key: "closedAt", direction: -1 })
  const page = ref(1)
  const pageSize = ref(10)
  const entries = computed(() => orders()
    .filter((order) => String(order.vehicleId) === String(vehicleId()) && order.status === "finished")
    .map((order) => ({ order, date: Date.parse(order.closedAt) })))
  const historyOrders = computed(() => entries.value.map(({ order }) => order))
  const types = computed(() => [...new Set(historyOrders.value.map((order) => order.job).filter(Boolean))].sort())
  const filtered = computed(() => {
    const start = from.value ? new Date(`${from.value}T00:00:00`).getTime() : null
    const end = to.value ? new Date(`${to.value}T23:59:59`).getTime() : null
    return entries.value.filter(({ order, date }) =>
      (type.value === "all" || order.job === type.value) &&
      (start === null || date >= start) && (end === null || date <= end),
    )
  })
  const sorted = computed(() => {
    const { key, direction } = sort.value
    const decorated = filtered.value.map((entry) => {
      const { order, date } = entry
      let value
      if (key === "closedAt") value = date || 0
      else if (key === "actualCost" || key === "closingReading") value = Number(String(order[key] || "").replace(/[^0-9]/g, "")) || 0
      else value = String(key === "owner" ? order.closedBy || order.owner || "" : order[key] || "")
      return { ...entry, value }
    })
    return decorated.sort((a, b) => {
      const comparison = typeof a.value === "number" ? a.value - b.value : a.value.localeCompare(b.value, "es", { numeric: true })
      // Preserve the previous newest-first tie order without a preliminary sort.
      return direction * comparison || (b.date || 0) - (a.date || 0)
    }).map(({ order }) => order)
  })
  const filteredOrders = computed(() => filtered.value.map(({ order }) => order))
  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
  const displayed = computed(() => sorted.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
  const sortBy = (key) => {
    sort.value = { key, direction: sort.value.key === key ? -sort.value.direction : 1 }
    page.value = 1
  }
  watch([type, from, to, pageSize, vehicleId], () => { page.value = 1 })
  watch(pageCount, (count) => { page.value = Math.min(page.value, count) })
  return { type, from, to, sort, page, pageSize, pageCount, historyOrders, types, filteredOrders, displayed, sortBy }
}
