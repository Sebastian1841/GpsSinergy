import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { ref, watch } from "vue"
import { mockAutomaticAlertRules } from "../../data/mockAutomaticAlertRules.js"
import { parseRuleRecords } from "./useAutomaticAlertRulesService.js"

test("only missing storage initializes example rules; empty saved configuration stays empty", () => {
  const initial = parseRuleRecords(null)
  assert.equal(initial.length, mockAutomaticAlertRules.length)
  assert.notEqual(initial[0], mockAutomaticAlertRules[0])
  assert.deepEqual(parseRuleRecords("[]"), [])
})

test("failed writes do not publish create, edit, delete or toggle; retry succeeds", async () => {
  const previousWindow = globalThis.window
  const key = "sinergy-automatic-alert-rules"
  const storage = new Map([[key, JSON.stringify([mockAutomaticAlertRules[0]])]])
  let failWrites = true
  globalThis.window = {
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => {
        if (failWrites) throw Error("quota")
        storage.set(key, value)
      },
    },
    addEventListener: () => {},
  }
  let stop
  try {
    const { useAutomaticAlertRulesService } = await import("./useAutomaticAlertRulesService.js?write-regression")
    const service = useAutomaticAlertRulesService()
    let published = 0
    stop = watch(service.rules, () => { published++ }, { flush: "sync" })
    const id = service.rules.value[0].id
    const actions = [
      () => service.createRule({ ...mockAutomaticAlertRules[0], name: "Nueva" }),
      () => service.updateRule(id, { name: "Editada", condition: { ...mockAutomaticAlertRules[0].condition, value: 65 } }),
      () => service.toggleRule(id),
      () => service.deleteRule(id),
    ]
    for (const action of actions) {
      failWrites = true
      const stateBefore = JSON.stringify(service.rules.value)
      const storedBefore = storage.get(key)
      const publishedBefore = published
      assert.equal(action(), null)
      assert.match(service.rulesWriteError.value, /No se pudo guardar/)
      assert.equal(JSON.stringify(service.rules.value), stateBefore)
      assert.equal(storage.get(key), storedBefore)
      assert.equal(published, publishedBefore)
      failWrites = false
      assert.ok(action())
      assert.equal(service.rulesWriteError.value, "")
      assert.equal(published, publishedBefore + 1)
      assert.deepEqual(JSON.parse(storage.get(key)), JSON.parse(JSON.stringify(service.rules.value)))
    }
    assert.ok(!service.rules.value.some(rule => rule.id === id))
    service.reloadRules()
    assert.ok(!service.rules.value.some(rule => rule.id === id))
  } finally {
    stop?.()
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})

test("editor retains draft, selection and open state on save failure without success feedback", () => {
  const source = readFileSync(new URL("../../components/alarms/AlarmConfigPanel.vue", import.meta.url), "utf8")
  const handler = source.slice(source.indexOf("const saveDraft ="), source.indexOf("const handleDeleteRule ="))
  const draft = ref({ id: "existing", name: "Edicion sin guardar" })
  const selectedRuleId = ref("existing")
  const isCreatingRule = ref(false)
  const isEditorOpen = ref(true)
  const feedbackMessage = ref("Exito anterior")
  let success = false
  new Function("rulesLoadError", "props", "isDraftValid", "isWizard", "isCreatingRule", "getDraftPayload", "draft", "updateRule", "createRule", "selectedRuleId", "cloneDraft", "isEditorOpen", "showFeedback", "feedbackMessage", "editorConflict", "expectedRule", `${handler}; saveDraft()`)(
    ref(""), { canManage: true }, ref(true), ref(false), isCreatingRule,
    () => ({ name: draft.value.name }), draft, () => null, () => null, selectedRuleId,
    () => { throw Error("must not reset draft") }, isEditorOpen,
    () => { success = true }, feedbackMessage, ref(false), ref({ id: "existing" }),
  )
  assert.equal(isEditorOpen.value, true)
  assert.equal(draft.value.name, "Edicion sin guardar")
  assert.equal(selectedRuleId.value, "existing")
  assert.equal(isCreatingRule.value, false)
  assert.equal(success, false)
  assert.equal(feedbackMessage.value, "")
  assert.match(source, /v-if="rulesWriteError" class="wizard-error" role="alert"/)
})

test("stale drafts cannot overwrite external edits or deletion before storage event arrives", async () => {
  const previous = globalThis.window
  let raw = JSON.stringify([mockAutomaticAlertRules[0]])
  globalThis.window = {
    localStorage: { getItem: () => raw, setItem: (_key, value) => { raw = value } },
    addEventListener: () => {},
  }
  try {
    const { useAutomaticAlertRulesService } = await import("./useAutomaticAlertRulesService.js?conflict-regression")
    const service = useAutomaticAlertRulesService()
    const expected = JSON.parse(JSON.stringify(service.rules.value[0]))
    raw = JSON.stringify([{ ...expected, name: "Cambio externo", updatedAt: "2026-11-02T12:00:00Z" }])
    const externalRaw = raw
    assert.equal(service.updateRule(expected.id, { name: "Borrador viejo" }, { expected }), null)
    assert.equal(raw, externalRaw)
    assert.match(service.rulesWriteError.value, /otra ventana/)
    assert.equal(service.rules.value[0].name, "Cambio externo")
    const current = JSON.parse(JSON.stringify(service.rules.value[0]))
    assert.ok(service.updateRule(current.id, { name: "Tras recargar" }, { expected: current }))
    raw = "[]"
    assert.equal(service.updateRule(expected.id, { name: "No recrear" }, { expected }), null)
    assert.equal(raw, "[]")
    assert.deepEqual(service.rules.value, [])
    const external = { ...expected, id: "external-other" }
    raw = JSON.stringify([external])
    assert.ok(service.createRule({ ...expected, name: "Nueva" }))
    assert.ok(JSON.parse(raw).some(rule => rule.id === external.id))
  } finally {
    if (previous === undefined) delete globalThis.window
    else globalThis.window = previous
  }
})

test("reload preserves edited and disabled rules without replacing compatible custom rules", () => {
  const changed = {
    ...mockAutomaticAlertRules[0],
    name: "Limite urbano",
    enabled: false,
    condition: { ...mockAutomaticAlertRules[0].condition, value: 55, durationSeconds: 17 },
  }
  const custom = { ...changed, id: "custom-speeding-rule", name: "Regla propia" }
  const result = parseRuleRecords(JSON.stringify([changed, custom]))
  assert.equal(result.length, 2)
  assert.equal(result[0].name, changed.name)
  assert.equal(result[0].enabled, false)
  assert.equal(result[0].condition.value, 55)
  assert.equal(result[0].condition.durationSeconds, 17)
  assert.equal(result[1].id, custom.id)
  assert.equal(result[1].name, custom.name)
})

test("deleted seed rules are not restored on reload", () => {
  const remaining = mockAutomaticAlertRules.slice(1)
  const result = parseRuleRecords(JSON.stringify(remaining))
  assert.equal(result.length, remaining.length)
  assert.ok(!result.some(rule => rule.id === mockAutomaticAlertRules[0].id))
})

test("malformed saved data is rejected instead of replaced with seeds", () => {
  for (const raw of ["", "{bad", "null", "{}", "[null]", "[1]", '[{"id":"x"}]',
    JSON.stringify([{ ...mockAutomaticAlertRules[0], condition: [] }]),
    JSON.stringify([mockAutomaticAlertRules[0], mockAutomaticAlertRules[0]]),
  ]) assert.throws(() => parseRuleRecords(raw))
})

test("service reload preserves deletion and historical alarms; corrupt storage blocks mutations", async () => {
  const previousWindow = globalThis.window
  const key = "sinergy-automatic-alert-rules"
  const storage = new Map()
  const listeners = []
  globalThis.window = {
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    addEventListener: (name, callback) => { if (name === "storage") listeners.push(callback) },
  }
  try {
    const { useAutomaticAlertRulesService } = await import("./useAutomaticAlertRulesService.js?reload-regression")
    const { useAlarmsService } = await import("./useAlarmsService.js?rule-deletion-regression")
    const service = useAutomaticAlertRulesService()
    const historyBefore = JSON.stringify(useAlarmsService().alarms.value)
    const first = service.rules.value[0]
    service.updateRule(first.id, { name: "Editada", enabled: false, condition: { ...first.condition, value: 70 } })
    assert.equal(service.reloadRules(), true)
    assert.equal(service.rules.value.find(rule => rule.id === first.id).name, "Editada")
    assert.equal(service.rules.value.find(rule => rule.id === first.id).enabled, false)
    service.deleteRule(first.id)
    service.reloadRules()
    assert.ok(!service.rules.value.some(rule => rule.id === first.id))
    assert.equal(JSON.stringify(useAlarmsService().alarms.value), historyBefore)
    for (const rule of [...service.rules.value]) service.deleteRule(rule.id)
    service.reloadRules()
    assert.deepEqual(service.rules.value, [])
    storage.set(key, "{bad")
    listeners.forEach(callback => callback({ key }))
    assert.ok(service.rulesLoadError.value)
    assert.equal(service.createRule({ name: "No sobrescribir" }), null)
    assert.equal(service.updateRule(first.id, { enabled: true }), null)
    assert.equal(service.deleteRule(first.id), null)
    assert.equal(storage.get(key), "{bad")
    storage.set(key, "[]")
    assert.equal(service.reloadRules(), true)
    assert.equal(service.rulesLoadError.value, "")
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})
