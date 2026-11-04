import test from "node:test"
import assert from "node:assert/strict"
import { ref } from "vue"
import { readFileSync } from "node:fs"
import { useAlarmRuleDraftProtection } from "./useAlarmRuleDraftProtection.js"

const fixture = () => {
  const rule = { id: "one", name: "Velocidad", condition: { value: 90 }, updatedAt: "old" }
  const draft = ref(JSON.parse(JSON.stringify(rule)))
  const rules = ref([JSON.parse(JSON.stringify(rule))])
  const isEditorOpen = ref(true)
  const guard = useAlarmRuleDraftProtection({ draft, rules, isEditorOpen })
  guard.captureDraft(rule)
  return { draft, rules, isEditorOpen, ...guard }
}

test("pristine drafts close without confirmation; nested edits and undo are detected", () => {
  const state = fixture()
  assert.equal(state.editorDirty.value, false)
  assert.equal(state.confirmDiscard(), true)
  state.draft.value.condition.value = 100
  assert.equal(state.editorDirty.value, true)
  state.draft.value.condition.value = 90
  state.draft.value.updatedAt = "new"
  assert.equal(state.editorDirty.value, false)
})

test("discard cancellation preserves editor; reload and tab closure warn only when dirty", () => {
  const previous = globalThis.window
  let prompts = 0
  globalThis.window = { confirm: () => { prompts++; return false } }
  try {
    const state = fixture()
    state.draft.value.name = "Borrador"
    assert.equal(state.confirmDiscard(), false)
    assert.equal(prompts, 1)
    assert.equal(state.draft.value.name, "Borrador")
    assert.equal(state.isEditorOpen.value, true)
    let prevented = 0
    const event = { preventDefault: () => { prevented++ } }
    state.protectUnload(event)
    assert.equal(prevented, 1)
    assert.equal(event.returnValue, "")
    globalThis.window.confirm = () => true
    assert.equal(state.confirmDiscard(), true)
    state.isEditorOpen.value = false
    state.protectUnload(event)
    assert.equal(prevented, 1)
  } finally {
    if (previous === undefined) delete globalThis.window
    else globalThis.window = previous
  }
})

test("external edits and deletion flag conflict without replacing the draft", () => {
  const state = fixture()
  state.draft.value.name = "Mi borrador"
  state.rules.value.push({ id: "other", name: "Otra regla" })
  assert.equal(state.editorConflict.value, false)
  state.rules.value[0].condition.value = 120
  assert.equal(state.editorConflict.value, true)
  assert.equal(state.draft.value.condition.value, 90)
  assert.equal(state.draft.value.name, "Mi borrador")
  state.rules.value = []
  assert.equal(state.editorConflict.value, true)
  state.captureDraft()
  assert.equal(state.editorConflict.value, false)
  assert.equal(state.editorDirty.value, false)
})

test("panel protects all close paths and route changes and never refreshes an open draft", () => {
  const source = readFileSync(new URL("../../components/alarms/AlarmConfigPanel.vue", import.meta.url), "utf8")
  assert.match(source, /@cancel.prevent="closeEditor"/)
  assert.match(source, /@click.self="closeEditor"/)
  assert.match(source, /onBeforeRouteLeave\(confirmDiscard\)/)
  assert.match(source, /onBeforeRouteUpdate/)
  assert.match(source, /removeEventListener\("beforeunload", protectUnload\)/)
  assert.match(source, /\(rows\) => \{\s*if \(isEditorOpen.value\) return/)
  assert.match(source, /editorConflict \|\| !canManage/)
})
