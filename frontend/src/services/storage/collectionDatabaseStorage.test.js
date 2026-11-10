import assert from "node:assert/strict"
import test from "node:test"
import { createCollectionDatabaseStorage } from "./collectionDatabaseStorage.js"

const setup = () => {
  const items = new Map()
  const writes = []
  let fail = ""
  let id = 0
  const storage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      if (fail && key.includes(fail)) throw new Error("Storage full")
      items.set(key, value)
      writes.push(key)
    },
    removeItem: (key) => items.delete(key),
  }
  const database = createCollectionDatabaseStorage({
    storage,
    key: "db",
    createId: () => String(++id),
  })
  return {
    items,
    writes,
    database,
    failOn: (value) => {
      fail = value
    },
  }
}

test("legacy snapshot migrates all collections without losing unrelated records", () => {
  const { items, database } = setup()
  const data = { assets: [{ id: 1 }], users: [{ id: 2 }], accesses: [] }
  items.set("db", JSON.stringify({ version: 1, data }))
  assert.deepEqual(database.read(), data)
  assert.equal(database.write(data, new Set(["assets"])), true)
  assert.deepEqual(database.read(), data)
  assert.equal(items.has("db"), false)
})

test("subsequent saves serialize and write only changed collections", () => {
  const { database, writes, items } = setup()
  database.write({ assets: [], users: [] }, new Set(["assets"]))
  const oldAssetsKey = JSON.parse(items.get("db:collections")).sections.assets
  writes.length = 0
  const state = {
    assets: [{ id: 3 }],
    users: {
      toJSON: () => {
        throw new Error("Unchanged collection serialized")
      },
    },
  }
  assert.equal(database.write(state, new Set(["assets"])), true)
  assert.equal(writes.length, 2)
  assert.deepEqual(database.read(), { assets: [{ id: 3 }], users: [] })
  assert.equal(items.has(oldAssetsKey), false)
  writes.length = 0
  assert.equal(database.write(state, new Set()), false)
  assert.equal(writes.length, 0)
})

test("failed collection or manifest writes preserve the committed snapshot and allow retry", () => {
  for (const failingKey of ["collection:users", ":collections"]) {
    const { database, items, failOn } = setup()
    const previous = { assets: [], users: [] }
    database.write(previous, new Set(["assets", "users"]))
    const before = [...items]
    const next = { assets: [{ id: 1 }], users: [{ id: 2 }] }
    failOn(failingKey)
    assert.equal(database.write(next, new Set(["assets", "users"])), false)
    assert.deepEqual([...items], before)
    assert.deepEqual(database.read(), previous)
    failOn("")
    assert.equal(database.write(next, new Set(["assets", "users"])), true)
    assert.deepEqual(database.read(), next)
  }
})

test("failed migration retains the legacy snapshot and missing storage is supported", () => {
  const { database, items, failOn } = setup()
  const data = { assets: [], users: [] }
  items.set("db", JSON.stringify({ version: 1, data }))
  failOn(":collections")
  assert.equal(database.write(data, new Set(["assets"])), false)
  assert.deepEqual(database.read(), data)
  const unavailable = createCollectionDatabaseStorage({ storage: null, key: "db" })
  assert.equal(unavailable.read(), null)
  assert.equal(unavailable.write(data, new Set(["assets"])), false)
})

test("two windows preserve independent edits and reject conflicting record updates atomically", () => {
  const { database: first, items } = setup()
  first.write(
    {
      companies: [
        { id: "A", phone: "old" },
        { id: "B", phone: "old" },
      ],
      users: [],
    },
    new Set(["companies"]),
  )
  const second = createCollectionDatabaseStorage({
    storage: {
      getItem: (key) => items.get(key) ?? null,
      setItem: (key, value) => items.set(key, value),
      removeItem: (key) => items.delete(key),
    },
    key: "db",
  })
  const a = first.read(),
    b = second.read()
  a.companies[0].phone = "from A"
  assert.equal(first.write(a, new Set(["companies"])), true)
  b.companies[1].phone = "from B"
  assert.equal(second.write(b, new Set(["companies"])), true)
  assert.deepEqual(
    first.read().companies.map((c) => c.phone),
    ["from A", "from B"],
  )
  const stale = second.read()
  const fresh = first.read()
  fresh.companies[0].phone = "newer"
  first.write(fresh, new Set(["companies"]))
  stale.companies[0].phone = "conflict"
  stale.users.push({ id: "uncommitted" })
  assert.equal(second.write(stale, new Set(["users", "companies"])), false)
  assert.match(second.getError(), /otra ventana/)
  assert.equal(first.read().companies[0].phone, "newer")
  assert.deepEqual(first.read().users, [])
})
