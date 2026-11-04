import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("maintenance separates navigation from contextual actions and preserves action handlers", () => {
  const source = readFileSync(new URL("./MaintenanceView.vue", import.meta.url), "utf8")
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: "maintenance-layout" })
  const template = compileTemplate({ source: descriptor.template.content, filename: "MaintenanceView.vue", id: "maintenance-layout", compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(template.errors, [])
  const nav = descriptor.template.content.split("</nav>")[0]
  assert.ok(!nav.includes("maintenance-module-actions"))
  assert.ok(source.includes('class="maintenance-context-toolbar"'))
  for (const handler of ['@click="openFleetExport"', '@click="openMaintenanceModal(\'maintenance\')"', '@click="openCreateWorkOrder()"', 'v-model="analysisPeriod"']) assert.ok(source.includes(handler))
  assert.match(source, /\.maintenance-header-button\s*\{[^}]*height: 38px/)
})
