import assert from "node:assert/strict"
import test from "node:test"
import {
  collectMaintenanceEvidenceIds,
  createMaintenanceEvidenceSession,
  removeUnreferencedMaintenanceEvidence,
} from "./maintenanceEvidenceSession.js"

const setup = (overrides = {}) => {
  const deleted = []
  const errors = []
  const state = { extraWorkOrders: [], workOrderOverrides: {} }
  const session = createMaintenanceEvidenceSession({
    saveFile: async (file) => ({ storageId: file.name, name: file.name }),
    cleanupFiles: (ids) => removeUnreferencedMaintenanceEvidence(ids, {
      readStates: () => [state],
      deleteFile: async (id) => deleted.push(id),
    }),
    onCleanupError: (error) => errors.push(error),
    ...overrides,
  })
  return { session, deleted, errors, state }
}

test("removing new attachments and cancelling cleans only session-owned files", async () => {
  const { session, deleted } = setup()
  await session.upload([{ name: "removed" }, { name: "cancelled" }])
  await session.release(["removed", "previously-saved"])
  assert.deepEqual(deleted, ["removed"])
  await session.dispose()
  assert.deepEqual(deleted, ["removed", "cancelled"])
})

test("saving an OT before closing preserves its new documents", async () => {
  const { session, state, deleted } = setup()
  const files = await session.upload([{ name: "keep" }, { name: "discard" }])
  state.workOrderOverrides["OT-1"] = { evidence: [files[0]] }
  await session.dispose()
  assert.deepEqual(deleted, ["discard"])
})

test("both current and persisted state protect shared documents", async () => {
  const deleted = []
  const current = { extraWorkOrders: [{ evidence: [{ storageId: "current" }] }] }
  const stored = { workOrderOverrides: { "OT-1": { evidence: [{ storageId: "stored" }] } } }
  await removeUnreferencedMaintenanceEvidence(["current", "stored", "unused", "unused"], {
    readStates: () => [current, stored],
    deleteFile: async (id) => deleted.push(id),
  })
  assert.deepEqual(deleted, ["unused"])
  assert.deepEqual([...collectMaintenanceEvidenceIds([current, stored])], ["current", "stored"])
})

test("cancel during upload cleans files once the pending writes finish", async () => {
  let finish
  const pending = new Promise((resolve) => { finish = resolve })
  const { session, deleted } = setup({ saveFile: () => pending })
  const upload = session.upload([{ name: "late" }])
  await session.dispose()
  finish({ storageId: "late", name: "late" })
  assert.deepEqual(await upload, [])
  assert.deepEqual(deleted, ["late"])
})

test("partial upload failure cleans successful files without dropping earlier uploads", async () => {
  const { session, deleted } = setup({
    saveFile: async (file) => {
      if (file.name === "fail") throw new Error("Quota")
      return { storageId: file.name }
    },
  })
  await session.upload([{ name: "earlier" }])
  await assert.rejects(session.upload([{ name: "success" }, { name: "fail" }]), /Quota/)
  assert.deepEqual(deleted, ["success"])
  await session.dispose()
  assert.deepEqual(deleted, ["success", "earlier"])
})

test("failed cleanup reports an error and can be retried", async () => {
  let fail = true
  const ids = []
  const { session, errors } = setup({ cleanupFiles: async (files) => {
    if (fail) throw new Error("Storage unavailable")
    ids.push(...files)
  } })
  await session.upload([{ name: "retry" }])
  await session.release(["retry"])
  assert.equal(errors.length, 1)
  fail = false
  await session.dispose()
  assert.deepEqual(ids, ["retry"])
})
