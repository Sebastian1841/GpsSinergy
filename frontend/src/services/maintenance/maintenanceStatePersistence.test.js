import assert from "node:assert/strict"
import test from "node:test"
import { createMaintenanceStatePersistence } from "./maintenanceStatePersistence.js"

const setup = (state, overrides = {}) => {
  const writes = []
  const documents = new Map()
  const errors = []
  let nextId = 0
  const persistence = createMaintenanceStatePersistence({
    readState: () => state,
    writeState: (json) => writes.push(JSON.parse(json)),
    putEvidence: async (id, blob) => documents.set(id, blob),
    onError: (error) => errors.push(error),
    createId: () => `file-${++nextId}`,
    ...overrides,
  })
  return { ...persistence, writes, documents, errors }
}

test("batches changes and flushes metadata synchronously before leaving", async () => {
  const state = { extraWorkOrders: [{ id: "OT-1", status: "scheduled" }] }
  const persistence = setup(state)
  persistence.schedule()
  state.extraWorkOrders[0].status = "finished"
  persistence.schedule()
  state.extraWorkOrders[0].title = "Latest"
  persistence.schedule()
  const saved = persistence.flush()
  assert.equal(persistence.writes.length, 1)
  assert.equal(persistence.writes[0].extraWorkOrders[0].title, "Latest")
  await saved
  await persistence.flush()
  assert.equal(persistence.writes.length, 1)
})

test("migrates legacy evidence in orders and overrides before replacing local state", async () => {
  const file = { name: "test.txt", type: "text/plain", size: 5, dataUrl: "data:text/plain;base64,aGVsbG8=" }
  const state = { extraWorkOrders: [{ evidence: [file] }], workOrderOverrides: { "OT-1": { evidence: [file] } } }
  const persistence = setup(state)
  persistence.schedule()
  await persistence.flush()
  const migrated = persistence.writes[0].extraWorkOrders[0].evidence[0]
  assert.equal(migrated.dataUrl, undefined)
  assert.equal(migrated.storageId, "file-1")
  assert.equal(persistence.writes[0].workOrderOverrides["OT-1"].evidence[0].storageId, "file-1")
  assert.equal(await persistence.documents.get("file-1").text(), "hello")
  persistence.schedule()
  await persistence.flush()
  assert.equal(persistence.documents.size, 1)
  assert.equal(persistence.writes.length, 2)
  assert.equal(persistence.errors.length, 0)
})

test("failed migration preserves old state and retries without changing document id", async () => {
  const state = { extraWorkOrders: [{ evidence: [{ name: "test.txt", dataUrl: "data:text/plain,hello" }] }] }
  let fail = true
  const ids = []
  const persistence = setup(state, {
    putEvidence: async (id) => {
      ids.push(id)
      if (fail) throw new Error("Quota exceeded")
    },
  })
  persistence.schedule()
  await persistence.flush()
  assert.equal(persistence.writes.length, 0)
  assert.equal(persistence.errors.length, 1)
  assert.ok(state.extraWorkOrders[0].evidence[0].dataUrl)
  fail = false
  persistence.schedule()
  await persistence.flush()
  assert.deepEqual(ids, ["file-1", "file-1"])
  assert.equal(persistence.writes.length, 1)
})

test("new attachments persist only metadata without rewriting their files", async () => {
  const file = { storageId: "existing", name: "a.pdf", size: 10, type: "application/pdf" }
  const persistence = setup({ workOrderOverrides: { "OT-1": { evidence: [file] } } })
  persistence.schedule()
  await persistence.flush()
  assert.deepEqual(persistence.writes[0].workOrderOverrides["OT-1"].evidence, [file])
  assert.equal(persistence.documents.size, 0)
})

test("changes during migration are saved after the older snapshot", async () => {
  let release
  const blocked = new Promise((resolve) => { release = resolve })
  const state = { title: "old", extraWorkOrders: [{ evidence: [{ dataUrl: "data:text/plain,hello" }] }] }
  const persistence = setup(state, { putEvidence: () => blocked })
  persistence.schedule()
  const first = persistence.flush()
  state.title = "new"
  persistence.schedule()
  const second = persistence.flush()
  release()
  await Promise.all([first, second])
  assert.equal(persistence.writes.at(-1).title, "new")
  assert.equal(persistence.errors.length, 0)
})

test("reports local storage failures without throwing", async () => {
  const persistence = setup({}, { writeState: () => { throw new Error("Storage full") } })
  persistence.schedule()
  await persistence.flush()
  assert.equal(persistence.errors.length, 1)
})

test("incremental saves serialize only replaced collections, not untouched sections", async () => {
  let orderReads = 0
  const state = {
    orders: [{ get id() { orderReads += 1; return "OT-1" } }],
    costs: [],
  }
  const writes = []
  const persistence = setup(state, { writeSections: (sections) => writes.push(sections) })
  persistence.schedule()
  await persistence.flush()
  assert.equal(orderReads, 1)
  state.costs = [{ total: 1000 }]
  persistence.schedule()
  await persistence.flush()
  assert.equal(orderReads, 1)
  assert.deepEqual(Object.keys(writes[1]), ["costs"])
  persistence.schedule()
  await persistence.flush()
  assert.deepEqual(writes[2], {})
})

test("failed incremental commit retries every modified section", async () => {
  const state = { orders: [], costs: [] }
  let fail = true
  const writes = []
  const persistence = setup(state, { writeSections: (sections) => {
    if (fail) throw new Error("Quota")
    writes.push(sections)
  } })
  persistence.schedule()
  await persistence.flush()
  assert.equal(persistence.errors.length, 1)
  fail = false
  persistence.schedule()
  await persistence.flush()
  assert.deepEqual(Object.keys(writes[0]), ["orders", "costs"])
})

test("incremental migration commits file references only after document writes", async () => {
  const state = { orders: [{ evidence: [{ name: "file", dataUrl: "data:text/plain,hello" }] }], costs: [] }
  const writes = []
  const persistence = setup(state, { writeSections: (sections) => writes.push(sections) })
  persistence.schedule()
  await persistence.flush()
  const file = JSON.parse(writes[0].orders)[0].evidence[0]
  assert.equal(file.dataUrl, undefined)
  assert.equal(await persistence.documents.get(file.storageId).text(), "hello")
  state.costs = [{ total: 100 }]
  persistence.schedule()
  await persistence.flush()
  assert.deepEqual(Object.keys(writes[1]), ["costs"])
})
