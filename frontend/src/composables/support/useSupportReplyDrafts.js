import { ref, watch } from "vue"

export const useSupportReplyDrafts = (selectedId, userId) => {
  const drafts = new Map()
  const replyText = ref("")
  const replyFiles = ref([])
  watch(
    selectedId,
    (id, previousId) => {
      if (previousId)
        drafts.set(previousId, { text: replyText.value, files: [...replyFiles.value] })
      const draft = drafts.get(id)
      replyText.value = draft?.text || ""
      replyFiles.value = draft?.files ? [...draft.files] : []
    },
    { flush: "sync" },
  )
  watch(
    userId,
    () => {
      drafts.clear()
      replyText.value = ""
      replyFiles.value = []
    },
    { flush: "sync" },
  )
  const clearReplyDraft = (id) => {
    drafts.delete(id)
    if (selectedId.value === id) {
      replyText.value = ""
      replyFiles.value = []
    }
  }
  return { replyText, replyFiles, clearReplyDraft }
}
