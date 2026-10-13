import assert from "node:assert/strict"
import test from "node:test"

import { mockAutomaticAlertRules } from "../../data/mockAutomaticAlertRules.js"
import { mergeMissingSeedRules } from "./useAutomaticAlertRulesService.js"

test("mergeMissingSeedRules replaces compatible entries with the exact linked historical rule", () => {
  const existingRule = {
    ...mockAutomaticAlertRules[0],
    id: "custom-speeding-rule",
    name: "Velocidad urbana personalizada",
  }
  const mergedRules = mergeMissingSeedRules([existingRule])

  assert.equal(mergedRules.length, 8)
  assert.equal(
    mergedRules.filter(
      (rule) => rule.type === existingRule.type && rule.companyId === existingRule.companyId,
    ).length,
    1,
  )
  assert.equal(
    mergedRules.some((rule) => rule.id === existingRule.id),
    false,
  )
  assert.equal(mergedRules[0].id, "auto-alert-rule-001")
  assert.equal(mergedRules[0].name, "Exceso de velocidad")
})
