import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("audit accepts module/action deep links and labels advanced settings events", () => {
  const source = readFileSync(new URL("AuditView.vue", import.meta.url), "utf8")
  const { descriptor, errors } = parse(source)
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: "audit" })
  assert.deepEqual(
    compileTemplate({
      source: descriptor.template.content,
      filename: "AuditView.vue",
      id: "audit",
      compilerOptions: { bindingMetadata: script.bindings },
    }).errors,
    [],
  )
  assert.ok(source.includes("route.query.module"))
  assert.ok(source.includes("route.query.action"))
  assert.ok(source.includes('"configuration:advanced:update": "Ajustes avanzados actualizados"'))
})

test("platform settings audit events are hidden from company users", () => {
  const source = readFileSync(new URL("AuditView.vue", import.meta.url), "utf8")
  const expression = source.match(/const visibleRecords = (computed\(\(\) => \{[\s\S]*?\n\}\))/)[1]
  const records = [
    { id: "platform", action: "configuration:advanced:update", companyId: "" },
    { id: "own", action: "report:generate", companyId: "company-1" },
    { id: "other", action: "report:generate", companyId: "company-2" },
  ]
  const run = (admin, company) =>
    new Function(
      "computed",
      "auditRecords",
      "isPlatformAdmin",
      "currentCompanyId",
      `return ${expression}`,
    )(
      (getter) => ({ value: getter() }),
      { value: records },
      { value: admin },
      { value: company },
    ).value.map((record) => record.id)
  assert.deepEqual(run(false, "company-1"), ["own"])
  assert.deepEqual(run(true, ""), ["platform", "own", "other"])
})
