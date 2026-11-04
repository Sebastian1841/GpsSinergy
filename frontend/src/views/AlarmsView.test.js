import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("inbox renders independently from configuration and compiles attention workflow", () => {
  for (const file of [
    "AlarmsView.vue",
    "../components/alarms/AlarmList.vue",
    "../components/alarms/AlarmDetailPanel.vue",
    "../components/alarms/AlarmAttentionForm.vue",
    "../components/alarms/AlarmFilters.vue",
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8")
    const { descriptor, errors } = parse(source)
    assert.deepEqual(errors, [])
    const script = compileScript(descriptor, { id: file })
    const template = compileTemplate({
      source: descriptor.template.content,
      filename: file,
      id: file,
      compilerOptions: { bindingMetadata: script.bindings },
    })
    assert.deepEqual(template.errors, [])
  }
  const source = readFileSync(new URL("AlarmsView.vue", import.meta.url), "utf8")
  assert.ok(!source.includes("AlarmConfigPanel"))
  assert.ok(source.includes("groupInboxAlarms"))
  assert.ok(source.includes("attentionTargets"))
  assert.ok(source.includes("inbox-showing-detail"))
  assert.ok(source.includes('const inboxTab = ref("unattended")'))
  assert.ok(!source.includes('label: "Pendientes"'))
  assert.ok(source.includes('label: "Sin iniciar"'))
  assert.ok(source.includes("const MAX_INBOX_PAGE_SIZE = 4"))
  assert.ok(source.includes("Math.min(MAX_INBOX_PAGE_SIZE,"))
  assert.ok(source.includes('v-model="pageSizeChoice"'))
  assert.ok(source.includes("[4, 10, 25, 50]"))
  assert.ok(!source.includes("position: fixed"))
  assert.ok(source.includes("if (!canManageAlarms.value"))
})
