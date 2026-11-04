import test from "node:test"
import assert from "node:assert/strict"
import {
  ADVANCED_STORAGE_KEY,
  ADVANCED_AUDIT_ACTION,
  ADVANCED_FIELDS,
  advancedDefaults,
  validateAdvancedConfiguration,
  readAdvancedConfiguration,
  saveAdvancedConfiguration,
  advancedChanges,
  syncAdvancedAudit,
} from "./advancedConfiguration.js"

const createStore = (initial = null) => {
  let raw = initial
  let writes = 0
  return {
    read: (key) => {
      assert.equal(key, ADVANCED_STORAGE_KEY)
      return raw
    },
    write: (key, value) => {
      assert.equal(key, ADVANCED_STORAGE_KEY)
      raw = value
      writes++
      return true
    },
    get raw() {
      return raw
    },
    get writes() {
      return writes
    },
  }
}
const options = (store, overrides = {}) => ({
  ...store,
  read: store.read,
  write: store.write,
  expected: advancedDefaults(),
  draft: { ...advancedDefaults(), fuelLoadRise: 15 },
  canEdit: () => true,
  actor: { id: "admin-1", name: "Administrador" },
  now: () => "2026-10-30T13:00:00.000Z",
  ...overrides,
})

test("seven defaults and field validation remain unchanged", () => {
  assert.equal(ADVANCED_FIELDS.length, 7)
  assert.deepEqual(Object.values(advancedDefaults()), [0.5, 10, 30, 10, 10, 90, 30])
  assert.deepEqual(
    readAdvancedConfiguration(() => null),
    advancedDefaults(),
  )
  for (const field of ADVANCED_FIELDS) {
    for (const value of [
      "",
      " ",
      [],
      {},
      null,
      undefined,
      -1,
      Infinity,
      NaN,
      field.max + 1,
      field.min + field.step / 2,
    ]) {
      assert.ok(
        validateAdvancedConfiguration({ ...advancedDefaults(), [field.id]: value })[field.id],
      )
    }
  }
  assert.deepEqual(
    validateAdvancedConfiguration({ ...advancedDefaults(), temperatureReturnMargin: 0 }),
    {},
  )
})

test("settings and pending audit are atomic; permissions, invalid input and stale drafts cannot write", () => {
  const store = createStore()
  assert.throws(
    () => saveAdvancedConfiguration(options(store, { canEdit: () => false })),
    /administrador/,
  )
  assert.equal(store.writes, 0)
  const saved = saveAdvancedConfiguration(options(store))
  const record = JSON.parse(store.raw)
  assert.equal(store.writes, 1)
  assert.deepEqual(readAdvancedConfiguration(store.read), saved)
  assert.deepEqual(record.history, [])
  assert.equal(record.pendingAudit.length, 1)
  assert.deepEqual(record.pendingAudit[0].changes, [
    { fieldId: "fuelLoadRise", before: 10, after: 15 },
  ])
  assert.throws(() => saveAdvancedConfiguration(options(store)), /otra ventana/)
  assert.throws(
    () =>
      saveAdvancedConfiguration(
        options(store, { expected: saved, draft: { ...saved, fuelLoadRise: "" } }),
      ),
    /Revisa/,
  )
  const before = store.raw
  assert.throws(
    () =>
      saveAdvancedConfiguration(
        options(store, {
          expected: saved,
          draft: { ...saved, fuelLoadRise: 16 },
          write: () => false,
        }),
      ),
    /No se pudieron guardar/,
  )
  assert.equal(store.raw, before)
  saveAdvancedConfiguration(options(store, { expected: saved, draft: saved }))
  assert.equal(store.writes, 1)
  assert.deepEqual(advancedChanges(saved, { ...saved, fuelLoadRise: "15" }), [])
})

test("sync sends the actual actor, timestamp and before/after to central audit, then clears the queue", () => {
  const store = createStore()
  saveAdvancedConfiguration(options(store))
  const audit = []
  assert.equal(
    syncAdvancedAudit({
      ...store,
      recordAudit: (entry) => {
        audit.push(entry)
        return entry
      },
    }),
    1,
  )
  assert.equal(audit.length, 1)
  assert.equal(audit[0].action, ADVANCED_AUDIT_ACTION)
  assert.equal(audit[0].module, "configuracion")
  assert.equal(audit[0].actorId, "admin-1")
  assert.equal(audit[0].actorName, "Administrador")
  assert.equal(audit[0].timestamp, "2026-10-30T13:00:00.000Z")
  assert.deepEqual(Object.values(audit[0].metadata.before), ["10 puntos"])
  assert.deepEqual(Object.values(audit[0].metadata.after), ["15 puntos"])
  assert.deepEqual(JSON.parse(store.raw).pendingAudit, [])
  assert.deepEqual(JSON.parse(store.raw).history, [])
  assert.equal(
    syncAdvancedAudit({ ...store, recordAudit: () => assert.fail("duplicate event") }),
    0,
  )
})

test("failed audit delivery remains pending and can be retried without losing saved settings", () => {
  const store = createStore()
  saveAdvancedConfiguration(options(store))
  const before = store.raw
  assert.throws(
    () =>
      syncAdvancedAudit({
        ...store,
        recordAudit: () => {
          throw Error("audit unavailable")
        },
      }),
    /audit unavailable/,
  )
  assert.equal(store.raw, before)
  assert.equal(readAdvancedConfiguration(store.read).fuelLoadRise, 15)
  assert.throws(
    () => syncAdvancedAudit({ ...store, recordAudit: () => null }),
    /No se pudo registrar/,
  )
  syncAdvancedAudit({ ...store, recordAudit: (entry) => entry })
  assert.equal(JSON.parse(store.raw).pendingAudit.length, 0)
})

test("legacy real history migrates once using stable audit IDs, including retries after acknowledgement failure", () => {
  const legacy = {
    id: "legacy-1",
    timestamp: "2026-10-29T15:00:00Z",
    actor: { id: "user-old", name: "Responsable anterior" },
    changes: [{ fieldId: "fuelLoadRise", before: 10, after: 15 }],
  }
  const store = createStore(
    JSON.stringify({
      version: 1,
      values: { ...advancedDefaults(), fuelLoadRise: 15 },
      history: [legacy],
    }),
  )
  const audit = new Map()
  const recordAudit = (entry) => {
    if (!audit.has(entry.id)) audit.set(entry.id, entry)
    return audit.get(entry.id)
  }
  assert.throws(() => syncAdvancedAudit({ ...store, write: () => false, recordAudit }), /pendiente/)
  assert.equal(audit.size, 1)
  assert.equal(JSON.parse(store.raw).history.length, 1)
  syncAdvancedAudit({ ...store, recordAudit })
  assert.equal(audit.size, 1)
  assert.equal(audit.get("advanced-settings-legacy-1").actorName, legacy.actor.name)
  assert.equal(JSON.parse(store.raw).history.length, 0)
})

test("sync preserves a newer save and its pending event arriving during delivery", () => {
  const store = createStore()
  const first = saveAdvancedConfiguration(options(store))
  syncAdvancedAudit({
    ...store,
    recordAudit: (entry) => {
      saveAdvancedConfiguration(
        options(store, { expected: first, draft: { ...first, fuelLoadRise: 20 } }),
      )
      return entry
    },
  })
  assert.equal(readAdvancedConfiguration(store.read).fuelLoadRise, 20)
  assert.equal(JSON.parse(store.raw).pendingAudit.length, 1)
  assert.equal(JSON.parse(store.raw).pendingAudit[0].changes[0].after, 20)
})

test("corrupt values, legacy history or pending queue are never overwritten", () => {
  for (const raw of [
    "invalid",
    "null",
    JSON.stringify({ version: 2, values: advancedDefaults() }),
    JSON.stringify({ version: 1, values: {} }),
    JSON.stringify({ version: 1, values: { ...advancedDefaults(), fuelLoadRise: "10" } }),
    JSON.stringify({ version: 1, values: advancedDefaults(), history: [{}] }),
    JSON.stringify({ version: 1, values: advancedDefaults(), pendingAudit: [{}] }),
  ])
    assert.throws(() => readAdvancedConfiguration(() => raw), /No se pudo leer/)
})
