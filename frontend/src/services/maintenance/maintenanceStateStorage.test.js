import assert from "node:assert/strict"
import test from "node:test"
import { createMaintenanceStateStorage } from "./maintenanceStateStorage.js"

const setup = () => {
  const items = new Map()
  const writes = []
  let failKey = ""
  let nextId = 0
  const storage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      if (key.includes(failKey) && failKey) throw new Error("Quota exceeded")
      items.set(key, value)
      writes.push(key)
    },
    removeItem: (key) => items.delete(key),
  }
  const store = createMaintenanceStateStorage({ storage, key: "module", createId: () => String(++nextId) })
  return { items, writes, store, fail: (key) => { failKey = key } }
}

test("migrates old state and reads partitioned sections after reload", () => {
  const { items, store } = setup()
  const original = { plans: [{ id: "p1" }], orders: [{ id: "OT-1" }], costs: [] }
  items.set("module", JSON.stringify(original))
  assert.deepEqual(store.read(), original)
  store.writeSections(Object.fromEntries(Object.entries(original).map(([key, value]) => [key, JSON.stringify(value)])))
  assert.deepEqual(store.read(), original)
  assert.equal(items.has("module"), false)
  assert.equal(JSON.parse(items.get("module:manifest")).version, 2)
})

test("writes only changed sections and removes their obsolete version", () => {
  const { items, writes, store } = setup()
  store.writeSections({ plans: "[]", costs: "[]" })
  const before = JSON.parse(items.get("module:manifest")).sections
  writes.length = 0
  store.writeSections({ costs: '[{"total":1000}]' })
  const after = JSON.parse(items.get("module:manifest")).sections
  assert.equal(before.plans, after.plans)
  assert.notEqual(before.costs, after.costs)
  assert.equal(items.has(before.costs), false)
  assert.equal(writes.length, 2)
  assert.deepEqual(store.read(), { plans: [], costs: [{ total: 1000 }] })
  store.writeSections({})
  assert.equal(writes.length, 2)
})

test("failed multi-section save retains the previous committed state", () => {
  const { items, store, fail } = setup()
  store.writeSections({ plans: "[]", costs: "[]" })
  const manifest = items.get("module:manifest")
  const keys = [...items.keys()]
  fail(":costs:")
  assert.throws(() => store.writeSections({ plans: '[{"id":"new"}]', costs: "[100]" }), /Quota/)
  assert.equal(items.get("module:manifest"), manifest)
  assert.deepEqual([...items.keys()], keys)
  assert.deepEqual(store.read(), { plans: [], costs: [] })
})

test("failed manifest commit preserves legacy state and removes uncommitted sections", () => {
  const { items, store, fail } = setup()
  items.set("module", '{"plans":[{"id":"keep"}]}')
  fail(":manifest")
  assert.throws(() => store.writeSections({ plans: "[]" }), /Quota/)
  assert.deepEqual(store.read(), { plans: [{ id: "keep" }] })
  assert.deepEqual([...items.keys()], ["module"])
})
