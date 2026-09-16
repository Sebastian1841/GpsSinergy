import { computed, ref } from "vue"

import { mockAutomaticAlertRules } from "../../data/mockAutomaticAlertRules.js"
import { normalizeAutomaticAlertRule } from "../../utils/alarms/automaticAlertRuleUtils.js"
import { readJsonStorage, writeJsonStorage } from "../storage/browserStorage.js"

export const AUTOMATIC_ALERT_RULES_STORAGE_KEY = "sinergy-automatic-alert-rules"

const MAX_RULE_RECORDS = 500

const cloneData = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}

const normalizeText = (value, fallback = "") => {
  const text = String(value ?? "").trim()

  return text || fallback
}

const createRuleId = () => {
  return `auto-alert-rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const readRuleRecords = () => {
  const storedRules = readJsonStorage(AUTOMATIC_ALERT_RULES_STORAGE_KEY, null)

  if (Array.isArray(storedRules)) {
    return storedRules.map(normalizeAutomaticAlertRule)
  }

  return cloneData(mockAutomaticAlertRules).map(normalizeAutomaticAlertRule)
}

const rules = ref(readRuleRecords())

const persistRules = () => {
  writeJsonStorage(AUTOMATIC_ALERT_RULES_STORAGE_KEY, rules.value)
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== AUTOMATIC_ALERT_RULES_STORAGE_KEY) return

    rules.value = readRuleRecords()
  })
}

const createRule = (payload = {}) => {
  const now = new Date().toISOString()
  const rule = normalizeAutomaticAlertRule({
    ...payload,
    id: createRuleId(),
    createdAt: payload.createdAt || now,
    updatedAt: now,
  })

  rules.value = [rule, ...rules.value].slice(0, MAX_RULE_RECORDS)
  persistRules()

  return rule
}

const updateRule = (ruleId, changes = {}) => {
  const normalizedRuleId = normalizeText(ruleId)
  let updatedRule = null

  rules.value = rules.value.map((rule) => {
    if (normalizeText(rule.id) !== normalizedRuleId) return rule

    updatedRule = normalizeAutomaticAlertRule({
      ...rule,
      ...changes,
      id: rule.id,
      createdAt: rule.createdAt,
      updatedAt: new Date().toISOString(),
    })

    return updatedRule
  })

  if (updatedRule) {
    persistRules()
  }

  return updatedRule
}

const deleteRule = (ruleId) => {
  const normalizedRuleId = normalizeText(ruleId)
  const deletedRule =
    rules.value.find((rule) => normalizeText(rule.id) === normalizedRuleId) || null

  if (!deletedRule) return null

  rules.value = rules.value.filter((rule) => normalizeText(rule.id) !== normalizedRuleId)
  persistRules()

  return deletedRule
}

const toggleRule = (ruleId) => {
  const currentRule = rules.value.find((rule) => normalizeText(rule.id) === normalizeText(ruleId))

  if (!currentRule) return null

  return updateRule(ruleId, {
    enabled: !currentRule.enabled,
  })
}

export const useAutomaticAlertRulesService = () => {
  return {
    rules: computed(() => rules.value),
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  }
}
