import { computed, ref } from "vue"
import { parseMaintenanceOrderCost, parseMaintenanceOrderDate } from "../../utils/maintenance/maintenanceOrderSummary.js"

export const useHistoryExportSelection = (orders, initial = {}) => {
  const search = ref("")
  const type = ref(initial.type || "all")
  const from = ref(initial.from || "")
  const to = ref(initial.to || "")
  const workshop = ref("")
  const entries = orders.filter(order => order.status === "finished").map(order => ({ order, date: parseMaintenanceOrderDate(order.closedAt)?.getTime() ?? null }))
  const selectedIds = ref(new Set(entries.map(({ order }) => order.id)))
  const options = { types: [...new Set(entries.map(({ order }) => order.job).filter(Boolean))].sort(), workshops: [...new Set(entries.map(({ order }) => order.workshop).filter(Boolean))].sort() }
  const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  const filtered = computed(() => {
    const start = from.value ? new Date(`${from.value}T00:00:00`).getTime() : null
    const end = to.value ? new Date(`${to.value}T23:59:59`).getTime() : null
    const query = normalize(search.value).trim()
    return entries.filter(({ order, date }) => (type.value === "all" || order.job === type.value) &&
      (!workshop.value || order.workshop === workshop.value) &&
      (start === null || date !== null && date >= start) && (end === null || date !== null && date <= end) &&
      (!query || normalize([order.id, order.job, order.closedBy || order.owner, order.workshop].join(" ")).includes(query)))
      .sort((a, b) => (b.date ?? 0) - (a.date ?? 0)).map(entry => entry.order)
  })
  const selected = computed(() => filtered.value.filter(order => selectedIds.value.has(order.id)))
  const total = computed(() => selected.value.reduce((sum, order) => sum + parseMaintenanceOrderCost(order.actualCost), 0))
  const allSelected = computed(() => filtered.value.length > 0 && filtered.value.every(order => selectedIds.value.has(order.id)))
  const toggle = id => {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }
  const toggleAll = () => {
    const next = new Set(selectedIds.value)
    const remove = allSelected.value
    for (const order of filtered.value) { if (remove) next.delete(order.id); else next.add(order.id) }
    selectedIds.value = next
  }
  const clear = () => { search.value = from.value = to.value = workshop.value = ""; type.value = "all" }
  return { search, type, from, to, workshop, selectedIds, options, filtered, selected, total, allSelected, toggle, toggleAll, clear }
}
