import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("vehicle assignment compiles with model selection, signal filters and bounded pages", () => {
  const source = readFileSync(new URL("./CalculatedVariableVehicles.vue", import.meta.url), "utf8")
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: "variable-vehicles" })
  const template = compileTemplate({ source: descriptor.template.content, filename: "CalculatedVariableVehicles.vue", id: "variable-vehicles", compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(template.errors, [])
  assert.match(source, /filtered.value.slice\(\(page.value - 1\) \* 20/)
  assert.match(source, /calculatedSignalValue\(asset, key\) != null/)
  assert.match(source, /tag: "NIVEL", matches: hasCalculatedFuelLevel/)
  assert.match(source, /new Set\(\[\.\.\.selected.value/)
  assert.match(source, /Añadir compatibles \(/)
  assert.doesNotMatch(source, /Elegir los/)
  assert.match(source, /no incluye incorporaciones futuras/)
})
