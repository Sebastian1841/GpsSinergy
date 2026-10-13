import { computed, ref } from "vue"

const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
export const useFleetExportSelection = (rows, initialIds = []) => {
  const search = ref("")
  const company = ref("")
  const status = ref("")
  const criterion = ref("")
  const order = ref("")
  const selectedIds = ref(new Set(initialIds))
  const options = computed(() => ({
    companies: [...new Set(rows.map(row => row.company).filter(Boolean))].sort(),
    statuses: [...new Set(rows.flatMap(row => row.plans.map(plan => plan.status)).filter(Boolean))].sort(),
    criteria: [...new Set(rows.flatMap(row => row.plans.map(plan => plan.criterion)).filter(Boolean))].sort(),
  }))
  const filteredRows = computed(() => rows.flatMap(row => {
    const query = normalize(search.value)
    if (company.value && company.value !== row.company) return []
    const vehicleMatches = !query || normalize([row.plate, row.name].join(" ")).includes(query)
    const plans = row.plans.filter(plan => (vehicleMatches || normalize(plan.name).includes(query)) &&
      (!status.value || plan.status === status.value) &&
      (!criterion.value || plan.criterion === criterion.value) &&
      (!order.value || (order.value === "with" ? plan.order && plan.order !== "Sin OT" : !plan.order || plan.order === "Sin OT")))
    if (!plans.length && (row.plans.length || !vehicleMatches || status.value || criterion.value || order.value)) return []
    return [{ ...row, plans }]
  }))
  const selectedRows = computed(() => filteredRows.value.filter(row => selectedIds.value.has(row.id)))
  const planCount = computed(() => selectedRows.value.reduce((sum, row) => sum + row.plans.length, 0))
  const allFilteredSelected = computed(() => filteredRows.value.length > 0 && filteredRows.value.every(row => selectedIds.value.has(row.id)))
  const toggle = id => {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }
  const toggleFiltered = () => {
    const next = new Set(selectedIds.value)
    const remove = allFilteredSelected.value
    for (const row of filteredRows.value) {
      if (remove) next.delete(row.id)
      else next.add(row.id)
    }
    selectedIds.value = next
  }
  const clearFilters = () => { search.value = company.value = status.value = criterion.value = order.value = "" }
  return { search, company, status, criterion, order, selectedIds, options, filteredRows, selectedRows, planCount, allFilteredSelected, toggle, toggleFiltered, clearFilters }
}
