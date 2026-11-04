import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("configuration rule list compiles with compact rows and explicit channel limitations", () => {
  const source = readFileSync(new URL("./AlarmConfigPanel.vue", import.meta.url), "utf8")
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: "alarm-config" })
  const template = compileTemplate({ source: descriptor.template.content, filename: "AlarmConfigPanel.vue", id: "alarm-config", compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(template.errors, [])
  assert.ok(source.includes("rule.description.trim() !== rule.conditionLabel?.trim()"))
  assert.ok(source.includes("Correo · sin proveedor"))
  assert.ok(source.includes("WhatsApp · sin proveedor"))
  assert.ok(!source.includes("REGLA DE MONITOREO"))
  assert.ok(!source.includes("flex: 1 0 90px"))
  assert.ok(source.includes('role="switch"'))
  assert.ok(source.includes('@click="selectRule(rule.id)"'))
})
