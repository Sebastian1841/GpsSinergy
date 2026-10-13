import assert from "node:assert/strict"
import test from "node:test"
import { ref } from "vue"
import { useGlobalSearch } from "./useGlobalSearch.js"

const setup = (overrides = {}) => useGlobalSearch({
  activeCompanyId: ref("c1"), auditRecords: ref([]), companies: ref([]),
  reportTypes: ref([]), users: ref([]), visibleAssets: ref([]), workspaces: ref([]),
  query: ref("empresa"), typeFilter: ref("all"),
  canAccessFunction: () => true, canAccessModule: () => true,
  ...overrides,
})

test("general search preserves source order and stops before evaluating later categories", () => {
  const companies = ref(Array.from({ length: 60 }, (_, index) => ({ id: `c${index}`, name: `Empresa ${index}` })))
  let reads = 0
  const auditRecords = { __v_isRef: true, get value() { reads += 1; return [] } }
  const search = setup({ companies, auditRecords })
  assert.equal(search.globalSearchResults.value.length, 36)
  assert.deepEqual(search.globalSearchResults.value.map(result => result.title), companies.value.slice(0, 36).map(company => company.name))
  assert.equal(reads, 0)
})

test("category search preserves all matches and does not evaluate unrelated sources", () => {
  const companies = ref(Array.from({ length: 60 }, (_, index) => ({ id: `c${index}`, name: `Empresa ${index}` })))
  let reads = 0
  const visibleAssets = { __v_isRef: true, get value() { reads += 1; return [] } }
  const query = ref("empresa")
  const search = setup({ companies, visibleAssets, query, typeFilter: ref("company") })
  assert.equal(search.globalSearchResults.value.length, 60)
  query.value = "empresa 59"
  assert.equal(search.globalSearchResults.value.length, 1)
  assert.equal(search.firstGlobalSearchResult.value.title, "Empresa 59")
  assert.equal(reads, 0)
})

test("search keeps accent normalization, default suggestions and reactive updates", () => {
  const companies = ref([{ id: "c1", name: "Transportes Águila" }])
  const query = ref("aguila")
  const search = setup({ companies, query })
  assert.equal(search.globalSearchResults.value.length, 1)
  companies.value.push({ id: "c2", name: "Águila Sur" })
  assert.equal(search.globalSearchResults.value.length, 2)
  query.value = ""
  assert.equal(search.globalSearchResults.value.length, 2)
  query.value = "inexistente"
  assert.equal(search.firstGlobalSearchResult.value, null)
})
