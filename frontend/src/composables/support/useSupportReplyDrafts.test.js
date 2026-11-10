import test from "node:test"
import assert from "node:assert/strict"
import { ref, effectScope } from "vue"
import { useSupportReplyDrafts } from "./useSupportReplyDrafts.js"

test("filtering and switching requests preserve text and files per request", () => {
  const scope = effectScope()
  try {
    const id = ref("A"),
      user = ref("user")
    const drafts = scope.run(() => useSupportReplyDrafts(id, user))
    const file = { name: "evidence.png" }
    drafts.replyText.value = "Pending A"
    drafts.replyFiles.value = [file]
    id.value = "B"
    assert.equal(drafts.replyText.value, "")
    drafts.replyText.value = "Pending B"
    id.value = ""
    id.value = "A"
    assert.equal(drafts.replyText.value, "Pending A")
    assert.equal(drafts.replyFiles.value[0].name, file.name)
    drafts.clearReplyDraft("B")
    assert.equal(drafts.replyText.value, "Pending A")
    id.value = "B"
    assert.equal(drafts.replyText.value, "")
    id.value = "A"
    user.value = "other-user"
    assert.equal(drafts.replyText.value, "")
    assert.deepEqual(drafts.replyFiles.value, [])
    id.value = "B"
    id.value = "A"
    assert.equal(drafts.replyText.value, "")
  } finally {
    scope.stop()
  }
})
