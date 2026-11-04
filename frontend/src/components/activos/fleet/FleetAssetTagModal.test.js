import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("tag editor compiles with native modal, page selection and accessible pagination", () => {
  const { descriptor } = parse(
    readFileSync(new URL("./FleetAssetTagModal.vue", import.meta.url), "utf8"),
  )
  const script = compileScript(descriptor, { id: "tag-modal" })
  const result = compileTemplate({
    source: descriptor.template.content,
    filename: "FleetAssetTagModal.vue",
    id: "tag-modal",
    compilerOptions: { bindingMetadata: script.bindings },
  })
  assert.deepEqual(result.errors, [])
  assert.match(descriptor.template.content, /<dialog/)
  assert.match(descriptor.template.content, /:indeterminate="partiallySelected"/)
  assert.match(descriptor.template.content, /Seleccionar activos de esta página/)
  assert.match(descriptor.scriptSetup.content, /showModal\(\)/)
  assert.match(descriptor.template.content, /Página siguiente/)
  assert.match(descriptor.template.content, /@save|@click="save"/)
})
