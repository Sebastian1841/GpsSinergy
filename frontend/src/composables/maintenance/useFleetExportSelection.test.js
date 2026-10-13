import assert from "node:assert/strict"
import test from "node:test"
import { useFleetExportSelection } from "./useFleetExportSelection.js"

const rows = [
  { id: "1", plate: "JSFG-74", name: "Camion", company: "Forestal", plans: [
    { name: "Permiso de circulacion", status: "Proxima", criterion: "Tiempo", order: "Sin OT" },
    { name: "Frenos", status: "Al dia", criterion: "Odometro", order: "OT-905" },
  ] },
  { id: "2", plate: "FLRB-22", name: "Camion", company: "Transportes", plans: [
    { name: "Frenos", status: "Vencida", criterion: "Odometro", order: "Sin OT" },
  ] },
]

test("export filters apply to downloaded vehicles and plans together", () => {
  const state = useFleetExportSelection(rows, ["1"])
  state.search.value = "CIRCULACIÓN"
  assert.deepEqual(state.filteredRows.value.map(row => row.id), ["1"])
  state.status.value = "Proxima"
  state.criterion.value = "Odometro"
  assert.equal(state.filteredRows.value.length, 0)
  state.criterion.value = "Tiempo"
  state.order.value = "without"
  assert.equal(state.filteredRows.value.length, 1)
  assert.equal(state.selectedRows.value[0].plans.length, 1)
  assert.equal(state.planCount.value, 1)
  assert.equal(state.selectedRows.value[0].plans[0].status, "Proxima")
  assert.equal(rows[0].plans.length, 2)
})

test("bulk selection respects filters and preserves selections in other companies", () => {
  const state = useFleetExportSelection(rows, ["1"])
  state.company.value = "Transportes"
  state.toggleFiltered()
  assert.equal(state.allFilteredSelected.value, true)
  assert.equal(state.selectedRows.value.length, 1)
  state.toggleFiltered()
  assert.equal(state.selectedRows.value.length, 0)
  assert.equal(state.selectedIds.value.has("1"), true)
  state.clearFilters()
  assert.equal(state.filteredRows.value.length, 2)
  assert.deepEqual(state.selectedRows.value.map(row => row.id), ["1"])
  state.toggle("1")
  assert.equal(state.selectedRows.value.length, 0)
  assert.equal(state.planCount.value, 0)
})

test("upcoming filter excludes other vehicles and non-upcoming plans despite initial selection", () => {
  const state = useFleetExportSelection(rows, ["1", "2"])
  state.status.value = "Proxima"
  assert.deepEqual(state.selectedRows.value.map(row => row.id), ["1"])
  assert.equal(state.planCount.value, 1)
  assert.ok(state.selectedRows.value.every(row => row.plans.every(plan => plan.status === "Proxima")))
  state.clearFilters()
  assert.equal(state.planCount.value, 3)
})
