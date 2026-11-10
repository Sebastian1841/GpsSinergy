import assert from "node:assert/strict"
import test from "node:test"
import { createUnreportedLifecycleStore, equipmentKey } from "./unreportedLifecycleStore.js"
import { buildUnreportedEquipment } from "./unreportedAssetsSource.js"
import { createUnreportedStateStorage } from "./unreportedStateStorage.js"
import { knownEquipmentWithHistory } from "../../utils/unreported/unreportedHistory.js"
import { resolveUnreportedCompanyContact } from "../../utils/unreported/unreportedCompanyContact.js"

const date = "2026-11-05T12:00:00Z"
const row = {
  companyId: "a",
  company: "Empresa",
  imei: "00123",
  name: "Equipo",
  lastReport: "2026-11-01T12:00:00Z",
}
const context = {
  user: { id: "operator" },
  companyIds: ["a"],
  companies: ["Empresa"],
  companyCatalog: [{ id: "a", name: "Empresa" }],
}
const fixture = (initial = {}) => {
  let saved = structuredClone(initial)
  let fail = false
  let writes = 0
  const create = () =>
    createUnreportedLifecycleStore({
      read: () => structuredClone(saved),
      write: (next) => {
        if (fail) return false
        saved = structuredClone(next)
        writes++
        return true
      },
      now: () => date,
    })
  return {
    create,
    saved: () => saved,
    fail: (value) => {
      fail = value
    },
    writes: () => writes,
  }
}
const legacyKey = JSON.stringify([row.company, row.imei])
const legacy = {
  mode: "active",
  lastSeenAt: row.lastReport,
  equipment: { company: row.company, imei: row.imei, name: row.name },
  notes: [{ id: "note", text: "Conservar" }],
  consultations: [{ id: "call", observation: "Consulta anterior", createdAt: date }],
}

test("company rename preserves lifecycle, consultations and history across reload", () => {
  const state = fixture()
  const store = state.create()
  store.observe([row], context, 6)
  store.addNote(row, "Antecedente", context)
  store.addConsultation(
    row,
    { situation: "workshop", decision: "pending", workshopDays: 2, observation: "En taller" },
    context,
  )
  const before = store.records.value[equipmentKey(row)]
  const renamed = { ...row, company: "Renombrada" }
  store.observe(
    [renamed],
    { ...context, companies: ["Renombrada"], companyCatalog: [{ id: "a", name: "Renombrada" }] },
    6,
  )
  const after = store.records.value[equipmentKey(renamed)]
  assert.equal(equipmentKey(row), equipmentKey(renamed))
  assert.deepEqual(after.notes, before.notes)
  assert.deepEqual(after.consultations, before.consultations)
  assert.deepEqual(after.interruptions, before.interruptions)
  assert.equal(after.equipment.companyId, "a")
  assert.equal(after.equipment.company, "Renombrada")
  assert.deepEqual(state.create().records.value[equipmentKey(renamed)], after)
})

test("same-name companies and matching IMEIs remain separate and permissions use IDs", () => {
  const companies = [
    { id: "a", name: "Same" },
    { id: "b", name: "Same" },
  ]
  const rows = buildUnreportedEquipment(
    [
      { id: "one", companyId: "a", imei: "00123" },
      { id: "two", companyId: "b", imei: "00123" },
    ],
    companies,
  )
  assert.equal(rows.length, 2)
  assert.notEqual(equipmentKey(rows[0]), equipmentKey(rows[1]))
  const store = fixture().create()
  const scoped = { ...context, companies: ["Same"], companyCatalog: companies }
  store.observe(rows, scoped, 6)
  assert.ok(store.records.value[equipmentKey(rows[0])])
  assert.equal(store.records.value[equipmentKey(rows[1])], undefined)
  assert.equal(store.allowed(rows[1], scoped), false)
  assert.throws(() => store.addNote(rows[1], "Not allowed", scoped), /acceso/)
  assert.equal(store.allowed({ company: "Same", imei: "00123" }, scoped), false)
})

test("verified legacy records migrate once with a retained backup", () => {
  const state = fixture({ [legacyKey]: legacy })
  const store = state.create()
  store.observe([row], context, 6)
  const record = store.records.value[equipmentKey(row)]
  assert.deepEqual(record.notes, legacy.notes)
  assert.deepEqual(record.consultations, legacy.consultations)
  assert.equal(store.records.value[legacyKey].identityMigratedTo, equipmentKey(row))
  const count = state.writes()
  store.observe([row], context, 6)
  assert.equal(state.writes(), count)
  assert.equal(knownEquipmentWithHistory([row], store.records.value).length, 1)
  assert.equal(state.create().records.value[legacyKey].identityMigratedTo, equipmentKey(row))
})

test("explicit legacy company IDs survive old names without guessing by IMEI", () => {
  const store = fixture({
    [legacyKey]: { ...legacy, equipment: { ...legacy.equipment, companyId: "a" } },
  }).create()
  const renamed = { ...row, company: "New" }
  store.observe([renamed], { ...context, companyCatalog: [{ id: "a", name: "New" }] }, 6)
  assert.deepEqual(store.records.value[equipmentKey(renamed)].notes, legacy.notes)
  const unknown = fixture({ [legacyKey]: legacy }).create()
  unknown.observe([renamed], { ...context, companyCatalog: [{ id: "a", name: "New" }] }, 6)
  assert.deepEqual(unknown.records.value[legacyKey], legacy)
  assert.equal(unknown.records.value[equipmentKey(renamed)].notes, undefined)
  assert.match(unknown.migrationWarning.value, /sin empresa verificable/)
})

test("duplicate names, competing histories and existing stable records are never merged", () => {
  const ambiguous = fixture({ [legacyKey]: legacy }).create()
  ambiguous.observe(
    [row],
    {
      ...context,
      companyCatalog: [
        { id: "a", name: "Empresa" },
        { id: "b", name: "Empresa" },
      ],
    },
    6,
  )
  assert.deepEqual(ambiguous.records.value[legacyKey], legacy)
  const claimed = { ...legacy, equipment: { ...legacy.equipment, companyId: "a" } }
  const otherKey = JSON.stringify(["Old", row.imei])
  const competing = fixture({ [legacyKey]: claimed, [otherKey]: claimed }).create()
  competing.observe([row], context, 6)
  assert.equal(competing.records.value[legacyKey].identityMigratedTo, undefined)
  assert.equal(competing.records.value[otherKey].identityMigratedTo, undefined)
  const existing = fixture({
    [legacyKey]: legacy,
    [equipmentKey(row)]: { ...legacy, notes: [{ id: "new" }] },
  }).create()
  existing.observe([row], context, 6)
  assert.deepEqual(existing.records.value[equipmentKey(row)].notes, [{ id: "new" }])
  assert.equal(existing.records.value[legacyKey].identityMigratedTo, undefined)
})

test("failed identity migration preserves memory and storage and can be retried", () => {
  const initial = { [legacyKey]: legacy }
  const state = fixture(initial)
  const store = state.create()
  state.fail(true)
  assert.throws(() => store.observe([row], context, 6), /guardar/)
  assert.deepEqual(store.records.value, initial)
  assert.deepEqual(state.saved(), initial)
  state.fail(false)
  store.observe([row], context, 6)
  assert.deepEqual(store.records.value[equipmentKey(row)].consultations, legacy.consultations)
})

test("archived equipment and company contacts resolve by company ID after rename", () => {
  const record = { ...legacy, equipment: { ...legacy.equipment, companyId: "a" } }
  const rows = knownEquipmentWithHistory([], { [equipmentKey(row)]: record }, [
    { id: "a", name: "New" },
  ])
  assert.equal(rows[0].companyId, "a")
  assert.equal(rows[0].company, "New")
  assert.equal(equipmentKey(rows[0]), equipmentKey(row))
  const companies = [
    { id: "a", name: "Same", contactName: "A" },
    { id: "b", name: "Same", contactName: "B" },
  ]
  assert.equal(
    resolveUnreportedCompanyContact(companies, { companyId: "b", company: "Old" }).name,
    "B",
  )
  assert.equal(resolveUnreportedCompanyContact(companies, { company: "Same" }).name, "")
})

test("archived legacy history migrates with a uniquely verified company without a current asset", () => {
  const store = fixture({ [legacyKey]: legacy }).create()
  const archived = knownEquipmentWithHistory([], store.records.value, context.companyCatalog)
  assert.equal(archived[0].companyId, "a")
  store.observe(archived, context, 6)
  assert.deepEqual(store.records.value[equipmentKey(row)].notes, legacy.notes)
  assert.equal(knownEquipmentWithHistory([], store.records.value, context.companyCatalog).length, 1)
})

test("real section storage migrates backup and stable key together and reloads them", () => {
  const items = new Map()
  items.set("identity-test", JSON.stringify({ [legacyKey]: legacy }))
  let index = 0
  const storage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
  }
  const persistence = () =>
    createUnreportedStateStorage({ storage, key: "identity-test", createId: () => String(++index) })
  const store = createUnreportedLifecycleStore({ ...persistence(), now: () => date })
  store.observe([row], context, 6)
  const reloaded = createUnreportedLifecycleStore({ ...persistence(), now: () => date })
  assert.equal(reloaded.records.value[legacyKey].identityMigratedTo, equipmentKey(row))
  assert.deepEqual(reloaded.records.value[equipmentKey(row)].notes, legacy.notes)
})
