import { computed, ref } from "vue"

import { mockAutomaticAlertRules } from "../../data/mockAutomaticAlertRules.js"
import { normalizeAutomaticAlertRule } from "../../utils/alarms/automaticAlertRuleUtils.js"
import { readStorageValue, writeJsonStorage } from "../storage/browserStorage.js"

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

export const parseRuleRecords = (raw) => {
  if (raw === null) return cloneData(mockAutomaticAlertRules).map(normalizeAutomaticAlertRule)
  let stored
  try {
    stored = JSON.parse(raw)
  } catch {
    throw Error("No se pudieron leer las reglas guardadas. Los datos existentes no se modificaron.")
  }
  if (!Array.isArray(stored))
    throw Error("La configuracion de alertas guardada no es valida. Los datos existentes no se modificaron.")
  const ids = new Set()
  for (const rule of stored) {
    if (!rule || typeof rule !== "object" || Array.isArray(rule) ||
      typeof rule.id !== "string" || !rule.id.trim() ||
      typeof rule.companyId !== "string" || !rule.companyId.trim() || ids.has(rule.id.trim()) ||
      ["condition", "assetScope", "schedule", "notificationChannels"].some(key =>
        rule[key] !== undefined && (!rule[key] || typeof rule[key] !== "object" || Array.isArray(rule[key])),
      ))
      throw Error("La configuracion de alertas contiene reglas invalidas. Los datos existentes no se modificaron.")
    ids.add(rule.id.trim())
  }
  return stored.map(normalizeAutomaticAlertRule)
}

const rules = ref([])
const rulesLoadError = ref("")
const rulesWriteError = ref("")
const reloadRules = () => {
  try {
    rules.value = parseRuleRecords(readStorageValue(AUTOMATIC_ALERT_RULES_STORAGE_KEY))
    rulesLoadError.value = ""
    return true
  } catch (error) {
    rulesLoadError.value = error.message
    return false
  }
}
reloadRules()

const readLatestRules = () => {
  try {
    const latest = parseRuleRecords(readStorageValue(AUTOMATIC_ALERT_RULES_STORAGE_KEY))
    if (JSON.stringify(latest) !== JSON.stringify(rules.value)) rules.value = latest
    return latest
  } catch (error) {
    rulesLoadError.value = error.message
    return null
  }
}
const checkExpectedRule = (current, expected) => {
  if (current && expected && JSON.stringify(current) === JSON.stringify(expected)) return true
  rulesWriteError.value = "La regla cambio o fue eliminada en otra ventana. Recarga la version actual antes de guardar."
  return false
}

const persistRules = (next) => {
  rulesWriteError.value = ""
  try {
    if (!writeJsonStorage(AUTOMATIC_ALERT_RULES_STORAGE_KEY, next))
      throw Error("storage-write-failed")
  } catch {
    rulesWriteError.value = "No se pudo guardar el cambio. Se mantiene la configuracion anterior. Intenta nuevamente."
    return false
  }
  rules.value = next
  return true
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== AUTOMATIC_ALERT_RULES_STORAGE_KEY && event.key !== null) return

    reloadRules()
  })
}

const createRule = (payload = {}) => {
  if (rulesLoadError.value) return null
  const latest = readLatestRules()
  if (!latest) return null
  const now = new Date().toISOString()
  const rule = normalizeAutomaticAlertRule({
    ...payload,
    id: createRuleId(),
    createdAt: payload.createdAt || now,
    updatedAt: now,
  })

  const next = [rule, ...latest].slice(0, MAX_RULE_RECORDS)
  if (!persistRules(next)) return null

  return rule
}

const updateRule = (ruleId, changes = {}, options = {}) => {
  if (rulesLoadError.value) return null
  const normalizedRuleId = normalizeText(ruleId)
  const expected = options.expected ?? rules.value.find(rule => rule.id === normalizedRuleId)
  const latest = readLatestRules()
  if (!latest || !checkExpectedRule(latest.find(rule => rule.id === normalizedRuleId), expected)) return null
  let updatedRule = null

  const next = latest.map((rule) => {
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

  if (updatedRule && !persistRules(next)) return null

  return updatedRule
}

const deleteRule = (ruleId) => {
  if (rulesLoadError.value) return null
  const normalizedRuleId = normalizeText(ruleId)
  const expected = rules.value.find(rule => rule.id === normalizedRuleId)
  const latest = readLatestRules()
  if (!latest || !checkExpectedRule(latest.find(rule => rule.id === normalizedRuleId), expected)) return null
  const deletedRule =
    latest.find((rule) => normalizeText(rule.id) === normalizedRuleId) || null

  if (!deletedRule) return null

  const next = latest.filter((rule) => normalizeText(rule.id) !== normalizedRuleId)
  if (!persistRules(next)) return null

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
    rulesLoadError: computed(() => rulesLoadError.value),
    rulesWriteError: computed(() => rulesWriteError.value),
    reloadRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  }
}
