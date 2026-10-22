import test from "node:test"
import assert from "node:assert/strict"
import { createDriverLicenseStore } from "./driverLicenseStore.js"

const data = { name: "Conductor", rut: "123456789", classes: ["B"], expiresAt: "2026-11-01" }
function setup() {
  let saved = [],
    fail = false,
    blocked = false
  const commits = []
  const repository = {
    load: async () => saved,
    commit: async (changes, next, allowed) => {
      await new Promise((resolve) => setTimeout(resolve, 0))
      if (fail || !allowed()) throw new Error("No se guardaron los cambios.")
      commits.push(changes)
      saved = next
    },
  }
  let id = 0
  const store = createDriverLicenseStore({
    repository,
    companyId: "one",
    canView: () => true,
    canEdit: () => !blocked,
    now: () => "2026-10-22T12:00:00Z",
    createId: () => String(++id),
  })
  return {
    store,
    repository,
    commits,
    fail: () => {
      fail = true
    },
    deny: () => {
      blocked = true
    },
  }
}

test("incremental saves commit only the changed driver and never serialize the collection", async () => {
  const { store, commits } = setup()
  await store.load()
  const first = await store.save(data)
  const second = await store.save({ ...data, name: "Otro", rut: "987654321" })
  const before = store.records.value
  const stringify = JSON.stringify
  let edited
  try {
    JSON.stringify = () => {
      throw new Error("Whole collection serialization is forbidden")
    }
    const pending = store.save({ ...first, name: "Corregido" }, { id: first.id })
    assert.equal(store.records.value, before)
    edited = await pending
  } finally {
    JSON.stringify = stringify
  }
  assert.equal(commits.at(-1).length, 1)
  assert.equal(commits.at(-1)[0].id, first.id)
  assert.equal(store.records.value[1], second)
  assert.equal(edited.history.length, 0)
  const renewed = await store.save(
    { ...edited, expiresAt: "2029-01-01" },
    { id: first.id, renewal: true },
  )
  assert.equal(commits.at(-1).length, 1)
  assert.equal(renewed.history[0].expiresAt, first.expiresAt)
  const current = store.records.value
  await store.load()
  assert.equal(store.records.value, current)
})

test("failed, overlapping and revoked incremental writes never report an unsaved state", async () => {
  const context = setup()
  await context.store.load()
  const first = await context.store.save(data)
  const before = context.store.records.value
  const pending = context.store.save({ ...first, name: "No guardar" }, { id: first.id })
  assert.throws(
    () => context.store.save({ ...first, name: "Otro cambio" }, { id: first.id }),
    /guardado anterior/,
  )
  context.fail()
  await assert.rejects(pending, /No se guardaron/)
  assert.equal(context.store.records.value, before)
  const denied = setup()
  await denied.store.load()
  const write = denied.store.save(data)
  denied.deny()
  await assert.rejects(write, /No se guardaron/)
  assert.equal(denied.store.records.value.length, 0)
})

test("incremental store cannot save before the first successful load", () => {
  const { store } = setup()
  assert.throws(() => store.save(data), /disponible/)
})
