import test from "node:test"
import assert from "node:assert/strict"
import { ref } from "vue"
import { fuelDropEpisode } from "./fuelDropEpisode.js"
import {
  normalizeAutomaticAlertRule,
  getAutomaticAlertConditionLabel,
} from "./automaticAlertRuleUtils.js"
import { useAlarmRuleDraft } from "../../composables/alarms/useAlarmRuleDraft.js"
import { getAlarmRuleStepError } from "./alarmRuleWizard.js"

test("fuel drop episode saves end notification and ten-minute evaluation without a manual threshold", () => {
  const condition = fuelDropEpisode({ episodeSource: "fuel-drop" })
  const rule = normalizeAutomaticAlertRule({
    name: "Caida combustible",
    companyId: "company-001",
    type: "fuel",
    condition,
    severity: "critical",
    enabled: false,
  })
  assert.deepEqual(rule.condition, condition)
  assert.equal(getAlarmRuleStepError(rule, 1), "")
  assert.match(getAutomaticAlertConditionLabel(rule), /finalizar/)
  const draft = ref(rule)
  const editor = useAlarmRuleDraft({
    draft,
    batteryConditionOptions: [],
    fallbackCompanyId: ref("company-001"),
    getSelectedGeofenceNames: () => [],
    selectedDraftAssetIds: ref([]),
    selectedDraftGeofenceGroup: ref(null),
    selectedDraftGeofenceIds: ref([]),
  })
  assert.deepEqual(editor.getDraftPayload().condition, condition)
  assert.equal(editor.getDraftPayload().severity, "critical")
})
test("legacy fuel rules retain their thresholds and windows", () => {
  const rule = normalizeAutomaticAlertRule({
    type: "fuel",
    condition: { value: -18, unit: "%", windowMinutes: 12 },
  })
  assert.equal(fuelDropEpisode(rule.condition), null)
  assert.equal(rule.condition.value, -18)
  assert.equal(rule.condition.windowMinutes, 12)
})
