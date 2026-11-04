import { computed, ref } from "vue"

export const alarmDraftSignature = (draft) => {
  return JSON.stringify(Object.fromEntries(Object.entries(draft || {})
    .filter(([key]) => key !== "createdAt" && key !== "updatedAt")))
}

export function useAlarmRuleDraftProtection({ draft, isEditorOpen, rules }) {
  const baseline = ref("")
  const expectedRule = ref(null)
  const captureDraft = (rule = null) => {
    baseline.value = alarmDraftSignature(draft.value)
    expectedRule.value = rule ? JSON.parse(JSON.stringify(rule)) : null
  }
  const editorDirty = computed(() => isEditorOpen.value && Boolean(baseline.value) &&
    alarmDraftSignature(draft.value) !== baseline.value)
  const editorConflict = computed(() => {
    if (!isEditorOpen.value || !expectedRule.value) return false
    const current = rules.value.find(rule => rule.id === expectedRule.value.id)
    return !current || JSON.stringify(current) !== JSON.stringify(expectedRule.value)
  })
  const confirmDiscard = () => !editorDirty.value ||
    window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos?")
  const protectUnload = (event) => {
    if (!editorDirty.value) return
    event.preventDefault()
    event.returnValue = ""
  }
  return { captureDraft, expectedRule, editorDirty, editorConflict, confirmDiscard, protectUnload }
}
