import assert from "node:assert/strict"
import test from "node:test"
import { effectScope, nextTick, reactive, ref } from "vue"
import { useMaintenanceTypeCatalog } from "./useMaintenanceTypeCatalog.js"

const setup = () => {
  const state = reactive({
    types: Array.from({ length: 18 }, (_, index) => `Tipo ${index + 1}`),
    origins: { "Tipo 18": "custom" },
    sources: { "Tipo 18": "Horometro", "Tipo 1": "Fecha/Hora" },
  })
  const search = ref("")
  const criterion = ref("all")
  const mode = ref("empty")
  const selected = ref("")
  const scope = effectScope()
  const catalog = scope.run(() => useMaintenanceTypeCatalog({
    types: () => state.types,
    origins: () => state.origins,
    readingSource: (type) => state.sources[type] || "Odometro",
    search, criterion, mode, selected,
  }))
  return { state, search, criterion, mode, selected, catalog, scope }
}

test("catalog paginates 18 types in two pages without changing source order", (t) => {
  const { catalog, scope } = setup()
  t.after(() => scope.stop())
  assert.equal(catalog.pageCount.value, 2)
  assert.equal(catalog.displayed.value.length, 10)
  catalog.page.value = 2
  assert.equal(catalog.displayed.value.length, 8)
  assert.equal(catalog.displayed.value[0], "Tipo 11")
})

test("search, origin and actual criterion filter together and reset the page", async (t) => {
  const { catalog, search, criterion, scope } = setup()
  t.after(() => scope.stop())
  catalog.page.value = 2
  catalog.originFilter.value = "custom"
  criterion.value = "Horometro"
  search.value = "TIPO 18"
  await nextTick()
  assert.equal(catalog.page.value, 1)
  assert.deepEqual(catalog.displayed.value, ["Tipo 18"])
  criterion.value = "Odometro"
  await nextTick()
  assert.equal(catalog.filtered.value.length, 0)
  assert.equal(catalog.pageCount.value, 1)
})

test("sorting is numeric-aware, reversible and does not mutate the type collection", (t) => {
  const { catalog, state, scope } = setup()
  t.after(() => scope.stop())
  const original = [...state.types]
  catalog.toggleSort()
  assert.equal(catalog.displayed.value[1], "Tipo 2")
  catalog.toggleSort()
  assert.equal(catalog.displayed.value[0], "Tipo 18")
  assert.deepEqual(state.types, original)
})

test("editing hides the selected row and deleting the last page clamps pagination", async (t) => {
  const { catalog, state, mode, selected, scope } = setup()
  t.after(() => scope.stop())
  selected.value = "Tipo 1"
  mode.value = "edit"
  assert.equal(catalog.filtered.value.includes("Tipo 1"), false)
  mode.value = "empty"
  catalog.page.value = 2
  state.types.splice(10)
  await nextTick()
  assert.equal(catalog.page.value, 1)
  catalog.pageSize.value = 20
  await nextTick()
  assert.equal(catalog.displayed.value.length, 10)
})
