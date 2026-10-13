import assert from "node:assert/strict"
import test from "node:test"
import { ref } from "vue"
import { useUnreportedPagination } from "./useUnreportedPagination.js"

test("pagination limits visible rows while preserving full data and order", () => {
  const rows = ref(Array.from({ length: 55 }, (_, index) => index))
  const state = useUnreportedPagination(rows)
  assert.deepEqual(state.visibleRows.value, rows.value.slice(0, 10))
  state.changePage(5)
  assert.equal(state.currentPage.value, 6)
  assert.deepEqual(state.visibleRows.value, [50, 51, 52, 53, 54])
  assert.equal(state.firstRow.value, 51)
  assert.equal(state.lastRow.value, 55)
  state.changePage(1)
  assert.equal(state.currentPage.value, 6)
  assert.equal(rows.value.length, 55)
})

test("filters and page size reset pagination and shrinking data clamps the page", () => {
  const rows = ref(Array.from({ length: 55 }, (_, index) => index))
  const filter = ref("")
  const state = useUnreportedPagination(rows, [filter])
  state.changePage(4)
  filter.value = "changed"
  assert.equal(state.currentPage.value, 1)
  for (const size of [20, 50]) {
    state.changePage(1)
    state.pageSize.value = size
    assert.equal(state.currentPage.value, 1)
    assert.equal(state.visibleRows.value.length, size)
  }
  state.changePage(1)
  rows.value = [1, 2]
  assert.equal(state.currentPage.value, 1)
  rows.value = []
  assert.equal(state.firstRow.value, 0)
  assert.equal(state.lastRow.value, 0)
  assert.equal(state.totalPages.value, 1)
  state.changePage(-1)
  assert.equal(state.currentPage.value, 1)
})
