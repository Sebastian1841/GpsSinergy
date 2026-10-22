import test from "node:test"
import assert from "node:assert/strict"
import { createUnreportedStateStorage } from "./unreportedStateStorage.js"
import { createUnreportedLifecycleStore, equipmentKey } from "./unreportedLifecycleStore.js"

const setup = () => {
  const items = new Map(),
    writes = []
  let fail = () => false,
    id = 0
  const storage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      if (fail(key)) throw new Error("Storage full")
      items.set(key, value)
      writes.push(key)
    },
    removeItem: (key) => items.delete(key),
  }
  const persistence = createUnreportedStateStorage({
    storage,
    key: "state",
    createId: () => String(++id),
  })
  return {
    items,
    writes,
    storage,
    persistence,
    failOn: (predicate) => {
      fail = predicate
    },
  }
}
const row = {
  company: "Empresa",
  imei: "00123",
  name: "Equipo",
  lastReport: "2026-10-12T00:00:00Z",
}
const context = { user: { id: "u1", name: "Operador" }, companies: ["Empresa"] }
const record = {
  mode: "active",
  lastSeenAt: row.lastReport,
  interruptions: [{ id: "case", lastReportAt: row.lastReport, recoveredAt: null }],
  consultations: [],
  notes: [{ id: "old", text: "Dato conservado" }],
}

test("plain legacy snapshots migrate every team once and preserve all original fields", () => {
  const { items, persistence, writes } = setup()
  const key = equipmentKey(row),
    other = equipmentKey({ ...row, company: "Otra empresa" })
  const original = { [key]: record, [other]: { ...record, fault: "Falla anterior" } }
  items.set("state", JSON.stringify(original))
  assert.deepEqual(persistence.read(), original)
  assert.equal(writes.length, 0)
  const updated = { ...original, [key]: { ...record, followUp: "field_review" } }
  assert.equal(persistence.write(updated, new Set([key])), true)
  assert.equal(writes.length, 3)
  assert.equal(items.has("state"), false)
  assert.deepEqual(persistence.read(), updated)
})

test("subsequent saves serialize only the changed equipment and a small manifest", () => {
  const { persistence, items, writes } = setup()
  const previous = { one: record, two: { ...record, consultations: [{ id: "unrelated" }] } }
  assert.equal(persistence.write(previous, new Set(["one", "two"])), true)
  const manifest = JSON.parse(items.get("state:collections"))
  writes.length = 0
  assert.equal(
    persistence.write(
      {
        one: { ...record, followUp: "field_review" },
        two: {
          toJSON() {
            throw new Error("Unchanged team serialized")
          },
        },
      },
      new Set(["one"]),
    ),
    true,
  )
  assert.equal(writes.length, 2)
  assert.ok(writes[0].startsWith("state:collection:one:"))
  assert.equal(writes[1], "state:collections")
  assert.equal(items.has(manifest.sections.one), false)
  assert.equal(items.has(manifest.sections.two), true)
  assert.deepEqual(persistence.read().two, previous.two)
})

test("failed migration leaves the complete legacy snapshot available for retry", () => {
  for (const fragment of [":collection:", ":collections"]) {
    const { items, persistence, failOn } = setup()
    const previous = { one: record, two: record }
    items.set("state", JSON.stringify(previous))
    const before = [...items]
    failOn((key) => key.includes(fragment))
    assert.equal(
      persistence.write({ ...previous, one: { ...record, fault: "New" } }, new Set(["one"])),
      false,
    )
    assert.deepEqual([...items], before)
    assert.deepEqual(persistence.read(), previous)
    failOn(() => false)
    assert.equal(persistence.write(previous, new Set(["one"])), true)
  }
})

test("partial record or manifest failures never commit half a batch", () => {
  for (const failManifest of [false, true]) {
    const { items, persistence, failOn } = setup()
    const previous = { one: record, two: record }
    persistence.write(previous, new Set(["one", "two"]))
    const before = [...items]
    let recordsWritten = 0
    failOn((key) =>
      failManifest
        ? key.endsWith(":collections")
        : key.includes(":collection:") && ++recordsWritten === 2,
    )
    assert.equal(
      persistence.write(
        { one: { ...record, fault: "1" }, two: { ...record, fault: "2" } },
        new Set(["one", "two"]),
      ),
      false,
    )
    assert.deepEqual([...items], before)
    assert.deepEqual(persistence.read(), previous)
  }
})

test("lifecycle marks only affected teams and failed persistence keeps memory unchanged", () => {
  const { persistence, writes, failOn, storage } = setup()
  const store = createUnreportedLifecycleStore({
    ...persistence,
    now: () => "2026-10-13T12:00:00Z",
  })
  const second = { ...row, imei: "00456" }
  store.observe([row, second], context, 6)
  writes.length = 0
  store.observe([row, second], context, 6)
  assert.equal(writes.length, 0)
  const before = store.records.value
  failOn((key) => key.endsWith(":collections"))
  assert.throws(
    () =>
      store.addConsultation(
        row,
        { situation: "workshop", workshopDays: 10, decision: "pending", observation: "En taller" },
        context,
      ),
    /No se pudo guardar/,
  )
  assert.equal(store.records.value, before)
  assert.deepEqual(persistence.read(), before)
  failOn(() => false)
  writes.length = 0
  store.addConsultation(
    row,
    { situation: "workshop", workshopDays: 10, decision: "pending", observation: "En taller" },
    context,
  )
  assert.equal(writes.length, 2)
  assert.equal(store.records.value[equipmentKey(second)], before[equipmentKey(second)])
  const restored = createUnreportedStateStorage({ storage, key: "state" }).read()
  assert.equal(restored[equipmentKey(row)].consultations[0].observation, "En taller")
  assert.equal(restored[equipmentKey(second)].consultations, undefined)
  writes.length = 0
  assert.throws(
    () =>
      store.addConsultation(
        row,
        { situation: "workshop", workshopDays: 10, decision: "pending" },
        { ...context, companies: [] },
      ),
    /No tienes acceso/,
  )
  assert.equal(writes.length, 0)
})

test("absent or blocked storage fails without changing saved data", () => {
  for (const storage of [
    null,
    {
      getItem() {
        throw new Error("Blocked")
      },
      setItem() {
        throw new Error("Blocked")
      },
    },
  ]) {
    const persistence = createUnreportedStateStorage({ storage })
    assert.deepEqual(persistence.read(), {})
    assert.equal(persistence.write({ one: record }, new Set(["one"])), false)
  }
})

test("corrupted legacy data or missing committed sections cannot be silently overwritten", () => {
  const brokenLegacy = setup()
  brokenLegacy.items.set("state", "{")
  assert.deepEqual(brokenLegacy.persistence.read(), {})
  assert.equal(brokenLegacy.persistence.write({ one: record }, new Set(["one"])), false)
  assert.equal(brokenLegacy.items.get("state"), "{")
  const missingSection = setup()
  missingSection.persistence.write({ one: record, two: record }, new Set(["one", "two"]))
  const manifest = JSON.parse(missingSection.items.get("state:collections"))
  missingSection.items.delete(manifest.sections.two)
  assert.deepEqual(missingSection.persistence.read(), {})
  const before = [...missingSection.items]
  assert.equal(
    missingSection.persistence.write(
      { one: { ...record, fault: "Replacement" } },
      new Set(["one"]),
    ),
    false,
  )
  assert.deepEqual([...missingSection.items], before)
})

test("cleanup failure does not turn a committed save into a failed save", () => {
  const { persistence, storage } = setup()
  persistence.write({ one: record }, new Set(["one"]))
  storage.removeItem = () => {
    throw new Error("Cleanup blocked")
  }
  const updated = { one: { ...record, fault: "Saved" } }
  assert.equal(persistence.write(updated, new Set(["one"])), true)
  assert.deepEqual(persistence.read(), updated)
})
