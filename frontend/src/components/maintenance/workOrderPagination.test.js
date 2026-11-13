import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { getWorkOrderPage } from "./workOrderPagination.js"

test("all orders remain reachable with every supported page size", () => {
  const orders = Array.from({ length: 137 }, (_, id) => ({ id }))
  for (const size of [10, 25, 50]) {
    const all = []
    const count = getWorkOrderPage(orders, 1, size).pageCount
    for (let page = 1; page <= count; page++) {
      const result = getWorkOrderPage(orders, page, size)
      assert.equal(result.start, (page - 1) * size + 1)
      assert.equal(result.end, Math.min(page * size, orders.length))
      all.push(...result.rows)
    }
    assert.deepEqual(all, orders)
  }
})

test("empty lists and shrinking final pages clamp safely", () => {
  assert.deepEqual(getWorkOrderPage([], 5, 10), { page: 1, pageCount: 1, total: 0, start: 0, end: 0, rows: [] })
  const orders = Array.from({ length: 26 }, (_, id) => ({ id }))
  assert.equal(getWorkOrderPage(orders, 99, 25).page, 2)
  assert.deepEqual(getWorkOrderPage(orders, 2, 25).rows, [{ id: 25 }])
  assert.equal(getWorkOrderPage(orders.slice(0, 25), 2, 25).page, 1)
  assert.equal(getWorkOrderPage(orders, -5, 10).page, 1)
})

test("UI wires real navigation, filter reset and contextual navigation beyond first 50 rows", () => {
  const source = readFileSync(new URL("./MaintenanceWorkOrdersTab.vue", import.meta.url), "utf8")
  assert.match(source, /@click="currentPage = pagination.page - 1"/)
  assert.match(source, /@click="currentPage = pagination.page \+ 1"/)
  assert.match(source, /currentPage.value = Math.floor\(index \/ Number\(pageSize.value\)\) \+ 1/)
  assert.match(source, /watch\(\[activeList, selectedAsset, deadlineFrom, deadlineTo, pendingSearch, pageSize\]/)
  assert.doesNotMatch(source, /pageSize.value = 50/)
  assert.match(source, /pendingFocusOrderId.value !== id/)
})
