import test from "node:test"
import assert from "node:assert/strict"
import { speedingRuleOptions, speedingLevel, speedingConditionLabel } from "./speedingRule.js"
import {
  normalizeAutomaticAlertRule,
  getAutomaticAlertConditionLabel,
} from "./automaticAlertRuleUtils.js"
import { getAlarmRuleStepError } from "./alarmRuleWizard.js"
import { ref } from "vue"
import {
  createInitialAlarmRuleDraft,
  useAlarmRuleDraft,
} from "../../composables/alarms/useAlarmRuleDraft.js"

test("speeding options survive normalization, preserving legacy rules", () => {
  assert.deepEqual(speedingRuleOptions({ value: 90 }), {})
  for (const limitSource of ["vehicle-type", "custom"]) {
    for (const minimumExcessSeverity of ["mild", "moderate", "severe"]) {
      const rule = normalizeAutomaticAlertRule({
        name: "Prueba",
        type: "speeding",
        condition: { value: 105, limitSource, minimumExcessSeverity, durationSeconds: 30 },
      })
      assert.equal(rule.condition.limitSource, limitSource)
      assert.equal(rule.condition.minimumExcessSeverity, minimumExcessSeverity)
      assert.equal(rule.condition.hysteresisKmh, 5)
      assert.equal(rule.condition.severityMode, "excess")
      assert.equal(getAutomaticAlertConditionLabel(rule), speedingConditionLabel(rule.condition))
      assert.deepEqual(normalizeAutomaticAlertRule(rule).condition, rule.condition)
    }
  }
})

test("severity boundaries match the reference and custom limits validate", () => {
  assert.equal(speedingLevel(10), "mild")
  assert.equal(speedingLevel(10.1), "moderate")
  assert.equal(speedingLevel(20), "moderate")
  assert.equal(speedingLevel(20.1), "severe")
  const draft = {
    name: "Prueba",
    type: "speeding",
    condition: { limitSource: "vehicle-type", value: "" },
  }
  assert.equal(getAlarmRuleStepError(draft, 1), "")
  for (const value of ["", 0, 301, 90.5])
    assert.notEqual(
      getAlarmRuleStepError({ ...draft, condition: { limitSource: "custom", value } }, 1),
      "",
    )
  assert.equal(
    getAlarmRuleStepError({ ...draft, condition: { limitSource: "custom", value: 120 } }, 1),
    "",
  )
})

test("draft save payload keeps speed source and minimum severity", () => {
  const draft = ref(createInitialAlarmRuleDraft({ companyId: "company-001" }))
  Object.assign(draft.value.condition, {
    limitSource: "vehicle-type",
    minimumExcessSeverity: "moderate",
  })
  const editor = useAlarmRuleDraft({
    draft,
    batteryConditionOptions: [],
    fallbackCompanyId: ref("company-001"),
    getSelectedGeofenceNames: () => [],
    selectedDraftAssetIds: ref([]),
    selectedDraftGeofenceGroup: ref(null),
    selectedDraftGeofenceIds: ref([]),
  })
  const saved = normalizeAutomaticAlertRule(editor.getDraftPayload())
  assert.equal(saved.condition.limitSource, "vehicle-type")
  assert.equal(saved.condition.minimumExcessSeverity, "moderate")
  assert.equal(saved.condition.severityMode, "excess")
})
