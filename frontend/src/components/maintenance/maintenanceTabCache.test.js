import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("maintenance caches visited tabs per company with separate analysis instances", () => {
  const source = readFileSync(new URL("../../views/MaintenanceView.vue", import.meta.url), "utf8")
  const { descriptor } = parse(source)
  const template = descriptor.template.content
  assert.match(template, /<KeepAlive :key="String\(route.params.empresaId \|\| ''\)" :max="6">/)
  const cached = template.slice(template.indexOf('<KeepAlive :key='), template.lastIndexOf('</KeepAlive>'))
  for (const name of ["MaintenanceOverviewTab", "MaintenanceWorkOrdersTab", "MaintenanceCostsTab"]) {
    assert.ok(cached.includes(`<${name}`))
  }
  assert.match(cached, /key="without-order"/)
  assert.match(cached, /key="analysis"/)
  const script = compileScript(descriptor, { id: "cache-view" })
  const result = compileTemplate({
    source: template,
    filename: "MaintenanceView.vue",
    id: "cache-view",
    compilerOptions: { bindingMetadata: script.bindings },
  })
  assert.deepEqual(result.errors, [])
})

test("cached tabs release document listeners and overlays on deactivation", () => {
  for (const filename of ["MaintenanceFleetTab.vue", "MaintenanceWorkOrdersTab.vue", "MaintenanceCostsTab.vue"]) {
    const { descriptor } = parse(readFileSync(new URL(filename, import.meta.url), "utf8"))
    const script = descriptor.scriptSetup.content
    assert.match(script, /onDeactivated\(/)
    if (filename !== "MaintenanceCostsTab.vue") {
      assert.match(script, /onActivated\(\(\) => document.addEventListener/)
      assert.match(script, /onDeactivated\(\(\) => \{\s*document.removeEventListener/)
    } else {
      assert.match(script, /onDeactivated\(closeExpandedChart\)/)
    }
    compileScript(descriptor, { id: filename })
  }
})
