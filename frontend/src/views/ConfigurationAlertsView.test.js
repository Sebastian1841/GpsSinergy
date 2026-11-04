import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parse, compileScript, compileTemplate } from "@vue/compiler-sfc"

test("configuration alerts reuses existing rules with independent routes and edit guards", () => {
  for (const path of [
    "./ConfigurationAlertsView.vue",
    "../components/alarms/AlarmConfigPanel.vue",
    "../components/alarms/AlarmRuleTriggerSection.vue",
    "../components/alarms/AlarmRuleSpeedingSection.vue",
    "../components/alarms/AlarmRuleEpisodeSection.vue",
    "../components/alarms/AlarmRuleFuelDropSection.vue",
    "../components/alarms/AlarmRuleSignalSection.vue",
    "../components/alarms/AlarmRuleTimingSection.vue",
    "../components/alarms/AlarmRuleScopeSection.vue",
    "../components/alarms/AlarmRuleWizardActions.vue",
    "../components/alarms/AlarmRuleCompanyCombobox.vue",
    "../components/alarms/AlarmRuleNotificationsSection.vue",
  ]) {
    const { descriptor } = parse(readFileSync(new URL(path, import.meta.url), "utf8"))
    const script = compileScript(descriptor, { id: "alerts" })
    const result = compileTemplate({
      source: descriptor.template.content,
      filename: path,
      id: "alerts",
      compilerOptions: { bindingMetadata: script.bindings },
    })
    assert.deepEqual(result.errors, [])
  }
  const source = readFileSync(new URL("./ConfigurationAlertsView.vue", import.meta.url), "utf8")
  assert.match(source, /configuration-alerts/)
  assert.match(source, /canAccessFunction\("alarms", companyId.value, "edit"\)/)
  assert.match(source, /presentation="configuration"/)
  const panel = readFileSync(
    new URL("../components/alarms/AlarmConfigPanel.vue", import.meta.url),
    "utf8",
  )
  assert.match(panel, /role="switch"/)
  assert.match(panel, /:aria-checked="rule.enabled"/)
  assert.match(panel, /:inbox-to="inboxTo"/)
  assert.match(panel, /v-model:selected-type="selectedType"/)
  assert.match(panel, /v-model:selected-company-id="selectedCompanyId"/)
  assert.match(panel, /v-model:selected-status="selectedStatus"/)
  assert.match(panel, /configuration-rule-row/)
  assert.match(panel, /integrated-clear/)
  assert.match(panel, /const configurationPageSize = 6/)
  assert.match(panel, /selectRule\(rule.id\)/)
  assert.match(panel, /<dialog/)
  assert.match(panel, /showModal\(\)/)
  assert.match(panel, /getAlarmRuleStepError/)
  assert.match(panel, /editorStep === 3/)
  assert.match(panel, /draft.value.enabled = false/)
  assert.match(panel, /Guardar inactiva/)
  assert.match(panel, /:wizard="isWizard"/)
  assert.match(panel, /setEditorAssetScope/)
  const router = readFileSync(new URL("../router/index.js", import.meta.url), "utf8")
  assert.equal((router.match(/\? routeViewLoaders.configurationAlerts/g) || []).length, 2)
})
