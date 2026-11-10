import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("orders table expansion compiles and keeps the same table, filters and pagination", () => {
  const filename = new URL("./MaintenanceWorkOrdersTab.vue", import.meta.url)
  const source = readFileSync(filename, "utf8")
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: "orders-expansion" })
  const template = compileTemplate({ source: descriptor.template.content, filename: filename.pathname, id: "orders-expansion", compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(template.errors, [])
  assert.match(source, /:aria-pressed="isTableExpanded"/)
  assert.match(source, /Salir de pantalla completa/)
  assert.match(source, /event.key !== "Escape"/)
  assert.match(source, /scrollTop = position.top/)
  assert.match(source, /scrollLeft = position.left/)
  assert.match(source, /focus\(\{ preventScroll: true \}\)/)
  const action = source.slice(source.indexOf("const toggleTableExpanded"), source.indexOf("const assetOptions"))
  assert.doesNotMatch(action, /pendingSearch.value\s*=|currentPage.value\s*=|clearLocalFilters\(/)
  assert.match(source, /\.is-table-expanded \.orders-table-wrap \{ height: auto; min-height: 0; \}/)
})
