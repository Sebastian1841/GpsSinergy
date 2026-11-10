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
  const createStore = () =>
    createMaintenanceStateStorage({ storage, key: "module", createId: () => String(++nextId) })
  const store = createStore()
  return {
    items,
    writes,
    store,
    createStore,
    fail: (key) => {
      failKey = key
    },
  }
}

test("migrates old state and reads partitioned sections after reload", () => {
  const { items, store } = setup()
  const original = { plans: [{ id: "p1" }], orders: [{ id: "OT-1" }], costs: [] }
  items.set("module", JSON.stringify(original))
  assert.deepEqual(store.read(), original)
  store.writeSections(
    Object.fromEntries(
      Object.entries(original).map(([key, value]) => [key, JSON.stringify(value)]),
    ),
  )
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

test("two windows preserve independent record edits within the same section", () => {
  const { store, createStore } = setup()
  store.writeSections({
    plans: JSON.stringify([
      { id: "a", name: "old A" },
      { id: "b", name: "old B" },
    ]),
  })
  const first = createStore()
  const second = createStore()
  const a = first.read()
  const b = second.read()
  a.plans[0].name = "new A"
  b.plans[1].name = "new B"
  first.writeSections({ plans: JSON.stringify(a.plans) })
  second.writeSections({ plans: JSON.stringify(b.plans) })
  assert.deepEqual(
    createStore()
      .read()
      .plans.map((row) => row.name),
    ["new A", "new B"],
  )
  // A later save from the stale editor must not erase the external edit either.
  b.plans[1].name = "newer B"
  second.writeSections({ plans: JSON.stringify(b.plans) })
  assert.deepEqual(
    createStore()
      .read()
      .plans.map((row) => row.name),
    ["new A", "newer B"],
  )
})

test("conflicting edits reject the whole multi-section commit and keep its baseline", () => {
  const { store, createStore, items } = setup()
  store.writeSections({ plans: '[{"id":"a","name":"old"}]', costs: "[]" })
  const first = createStore()
  const second = createStore()
  first.read()
  second.read()
  first.writeSections({ plans: '[{"id":"a","name":"external"}]' })
  const manifest = items.get("module:manifest")
  const keys = [...items.keys()]
  // An evidence-cleanup read must not turn an outdated draft into the new baseline.
  second.read()
  const save = () =>
    second.writeSections({ plans: '[{"id":"a","name":"local"}]', costs: '[{"id":"cost"}]' })
  assert.throws(save, /otra ventana/)
  assert.throws(save, /otra ventana/)
  assert.equal(items.get("module:manifest"), manifest)
  assert.deepEqual([...items.keys()], keys)
  assert.deepEqual(createStore().read(), { plans: [{ id: "a", name: "external" }], costs: [] })
})

test("OT override maps merge by key and reject competing edits or deletion", () => {
  const { store, createStore } = setup()
  store.writeSections({ overrides: '{"OT-A":{"status":"old"},"OT-B":{"status":"old"}}' })
  const first = createStore()
  const second = createStore()
  const a = first.read()
  const b = second.read()
  a.overrides["OT-A"].status = "finished"
  b.overrides["OT-B"].status = "scheduled"
  first.writeSections({ overrides: JSON.stringify(a.overrides) })
  second.writeSections({ overrides: JSON.stringify(b.overrides) })
  assert.deepEqual(createStore().read().overrides, {
    "OT-A": { status: "finished" },
    "OT-B": { status: "scheduled" },
  })
  delete b.overrides["OT-A"]
  assert.throws(
    () => second.writeSections({ overrides: JSON.stringify(b.overrides) }),
    /otra ventana/,
  )
})

test("independent additions and removals survive stale windows and failed writes", () => {
  const { store, createStore, fail } = setup()
  store.writeSections({ plans: '[{"id":"a"},{"id":"b"}]' })
  const first = createStore()
  const second = createStore()
  first.read()
  second.read()
  first.writeSections({ plans: '[{"id":"b"},{"id":"external"}]' })
  fail(":manifest")
  assert.throws(
    () => second.writeSections({ plans: '[{"id":"a"},{"id":"b"},{"id":"local"}]' }),
    /Quota/,
  )
  fail("")
  second.writeSections({ plans: '[{"id":"a"},{"id":"b"},{"id":"local"}]' })
  assert.deepEqual(
    createStore()
      .read()
      .plans.map((row) => row.id),
    ["local", "b", "external"],
  )
})

test("partial legacy migration preserves untouched sections", () => {
  const { items, store, createStore } = setup()
  items.set("module", '{"plans":[{"id":"a"}],"overrides":{"OT-1":{"status":"old"}}}')
  store.read()
  store.writeSections({ plans: '[{"id":"a","name":"changed"}]' })
  assert.deepEqual(createStore().read(), {
    plans: [{ id: "a", name: "changed" }],
    overrides: { "OT-1": { status: "old" } },
  })
})
