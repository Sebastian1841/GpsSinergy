import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"
import { getFleetPage } from "./fleetPagination.js"

test("fleet pagination limits rendered rows and retains indexes across pages", () => {
  const items = Array.from({ length: 1000 }, (_, id) => ({ id }))
  const original = [...items]
  for (const size of [10, 20, 50]) {
    const page = getFleetPage(items, 2, size)
    assert.equal(page.rows.length, size)
    assert.equal(page.rows[0].item, items[size])
    assert.equal(page.rows[0].index, size)
    assert.equal(page.start, size + 1)
    assert.equal(page.end, size * 2)
    assert.equal(page.total, 1000)
  }
  assert.deepEqual(items, original)
})

test("fleet pagination handles empty sets, final pages and invalid choices", () => {
  const items = Array.from({ length: 53 }, (_, id) => ({ id }))
  const final = getFleetPage(items, 99, 20)
  assert.equal(final.page, 3)
  assert.equal(final.rows.length, 13)
  assert.equal(final.start, 41)
  assert.equal(final.end, 53)
  assert.deepEqual(getFleetPage([], 4, 10), {
    page: 1,
    pageCount: 1,
    total: 0,
    start: 0,
    end: 0,
    rows: [],
  })
  assert.equal(getFleetPage(items, -1, 9999).rows.length, 20)
})

test("fleet component renders a page but keeps export scoped to complete sorted results", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./MaintenanceFleetTab.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: "fleet" })
  assert.deepEqual(
    compileTemplate({
      source: descriptor.template.content,
      filename: "MaintenanceFleetTab.vue",
      id: "fleet",
      compilerOptions: { bindingMetadata: script.bindings },
    }).errors,
    [],
  )
  assert.match(descriptor.template.content, /v-for="\{ item, index \} in fleetPagination.rows"/)
  assert.doesNotMatch(descriptor.template.content, /in sortedFleetItems"/)
  assert.match(descriptor.scriptSetup.content, /getExportRows:.*sortedFleetItems.value/)
  assert.match(descriptor.scriptSetup.content, /watch\(\[sortedFleetItems, fleetPageSize\]/)
  assert.match(descriptor.template.content, /v-model.number="fleetPageSize"/)
})
