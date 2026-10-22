import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("company editor keeps fields and emits while using a neutral overlay and white sections", () => {
  const { descriptor, errors } = parse(
    readFileSync(new URL("./CompanyEditorModal.vue", import.meta.url), "utf8"),
  )
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: "company-editor" })
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: "CompanyEditorModal.vue",
    id: "company-editor",
    compilerOptions: { bindingMetadata: script.bindings },
  })
  assert.deepEqual(template.errors, [])
  assert.match(descriptor.styles[0].content, /background: rgb\(0 0 0 \/ 40%\)/)
  assert.match(descriptor.styles[0].content, /section > header\s*\{[^}]*background: #fff;/s)
  for (const field of [
    "name",
    "rut",
    "status",
    "contactName",
    "contactPhone",
    "contactEmail",
    "city",
    "region",
  ])
    assert.ok(descriptor.template.content.includes(`updateField('${field}'`))
  assert.match(descriptor.template.content, /md:grid-cols-2/)
  assert.match(descriptor.template.content, /Contacto principal/)
  assert.match(descriptor.template.content, /maxlength="12"/)
  assert.match(descriptor.template.content, /formatCompanyRut\(draftCompany.rut\)/)
  assert.match(descriptor.template.content, /\$emit\('save'\)/)
})
