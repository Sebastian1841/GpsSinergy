import test from "node:test"
import assert from "node:assert/strict"
import { useHistoryExportSelection } from "./useHistoryExportSelection.js"

test("history export includes only filtered finished selections", () => {
  const state = useHistoryExportSelection([
    { id: "1", status: "finished", job: "Frenos", actualCost: 100, closedAt: "2026-10-08", workshop: "A" },
    { id: "2", status: "finished", job: "Aceite", actualCost: 200, closedAt: "2026-10-07", workshop: "B" },
    { id: "3", status: "scheduled", job: "Frenos", actualCost: 300 },
  ])
  assert.equal(state.selected.value.length, 2)
  state.type.value = "Frenos"
  assert.deepEqual(state.selected.value.map(order => order.id), ["1"])
  assert.equal(state.total.value, 100)
  state.toggleAll()
  assert.equal(state.selected.value.length, 0)
  state.clear()
  assert.deepEqual(state.selected.value.map(order => order.id), ["2"])
})

test("history export date and workshop filters intersect", () => {
  const state = useHistoryExportSelection([
    { id: "1", status: "finished", job: "Frenos", closedAt: "2026-10-08", workshop: "A" },
    { id: "2", status: "finished", job: "Aceite", closedAt: "2026-10-07", workshop: "A" },
    { id: "3", status: "finished", job: "Aceite", workshop: "A" },
  ], { from: "2026-10-08", to: "2026-10-08" })
  assert.deepEqual(state.filtered.value.map(order => order.id), ["1"])
  state.workshop.value = "B"
  assert.equal(state.selected.value.length, 0)
})
