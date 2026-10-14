import test from "node:test"
import assert from "node:assert/strict"
import {
  createUnreportedLifecycleStore,
  equipmentKey,
  parseUnreportedTimestamp,
} from "./unreportedLifecycleStore.js"
const row = {
  company: "Empresa",
  imei: "00123",
  name: "Equipo",
  lastReport: "2026-10-12T00:00:00.000Z",
}
const context = { user: { id: "u1", name: "Operador" }, companies: ["Empresa"] }
const setup = (write = () => true) => {
  let date = "2026-10-13T12:00:00.000Z"
  const store = createUnreportedLifecycleStore({ read: () => ({}), write, now: () => date })
  const record = () => store.records.value[equipmentKey(row)]
  return {
    store,
    record,
    setTime: (value) => {
      date = value
    },
  }
}
test("new recent equipment is not mistaken for an outage or a recovered incident", () => {
  const { store, record, setTime } = setup()
  store.observe([{ ...row, lastReport: "2026-10-13T11:00:00.000Z" }], context, 6)
  assert.equal(record().mode, "reporting")
  setTime("2026-10-13T18:00:00.000Z")
  store.observe([{ ...row, lastReport: "2026-10-13T11:00:00.000Z" }], context, 6)
  assert.equal(record().mode, "active")
})
test("a new report recovers an active outage and records its duration", () => {
  const { store, record } = setup()
  store.observe([row], context, 6)
  assert.equal(record().mode, "active")
  store.observe([{ ...row, lastReport: "2026-10-13T12:00:00.000Z" }], context, 6)
  assert.equal(record().mode, "recovered")
  assert.equal(record().outageDurationMs, 36 * 3600000)
})
test("later normal reports preserve the first recovery date and duration", () => {
  const { store, record, setTime } = setup()
  store.receiveReport(row, context)
  const recovered = record().recoveredAt,
    duration = record().outageDurationMs
  setTime("2026-10-13T13:00:00.000Z")
  store.observe([{ ...row, lastReport: "2026-10-13T13:00:00.000Z" }], context, 6)
  assert.equal(record().recoveredAt, recovered)
  assert.equal(record().outageDurationMs, duration)
})
test("registered faults do not remove equipment from follow-up and survive recovery", () => {
  const { store, record } = setup()
  assert.throws(() => store.saveFault(row, " ", context), /falla/)
  store.saveFault(row, "Antena danada", context)
  assert.equal(record().mode, "active")
  store.receiveReport(row, context)
  store.observe([row], context, 6)
  assert.equal(record().mode, "recovered")
  assert.equal(record().fault, "Antena danada")
  assert.equal(record().faultBy, "Operador")
  assert.equal(record().faultAt, "2026-10-13T12:00:00.000Z")
})
test("editing a fault preserves active follow-up", () => {
  const { store, record } = setup()
  store.saveFault(row, "Antena", context)
  store.saveFault(row, "Conector de antena danado", context)
  assert.equal(record().mode, "active")
  assert.equal(record().fault, "Conector de antena danado")
})
test("recovered equipment becomes unreported again when the threshold expires", () => {
  const { store, record, setTime } = setup()
  store.receiveReport(row, context)
  setTime("2026-10-13T18:00:00.000Z")
  store.observe([row], context, 6)
  assert.equal(record().mode, "recovered")
  setTime("2026-10-13T18:00:01.000Z")
  store.observe([row], context, 6)
  assert.equal(record().mode, "active")
})
test("old, repeated and invalid future reports cannot clear an outage", () => {
  const { store, record } = setup()
  store.observe([row], context, 6)
  assert.equal(store.receiveReport(row, context, row.lastReport), false)
  store.receiveReport(row, context, "2026-10-12T01:00:00.000Z")
  assert.equal(record().mode, "active")
  assert.throws(() => store.receiveReport(row, context, "2027-01-01T00:00:00.000Z"), /fecha/)
  assert.throws(() => store.observe([row], context, 0), /Umbral/)
  store.receiveReport(row, context)
  store.observe([{ ...row, lastReport: "2027-01-01T00:00:00.000Z" }], context, 6)
  assert.equal(record().mode, "recovered")
  assert.equal(record().lastSeenAt, "2026-10-13T12:00:00.000Z")
})
test("requests outside the company scope cannot mutate lifecycle data", () => {
  const { store } = setup(),
    outside = { ...context, companies: [] }
  store.observe([row], outside, 6)
  assert.deepEqual(store.records.value, {})
  assert.throws(() => store.receiveReport(row, outside), /acceso/)
  assert.throws(() => store.saveFault(row, "Antena", outside), /acceso/)
})
test("failed persistence keeps the previous lifecycle and allows retry", () => {
  let writable = true
  const { store, record } = setup(() => writable)
  store.observe([row], context, 6)
  const previous = store.records.value
  writable = false
  assert.throws(() => store.saveFault(row, "Antena", context), /guardar/)
  assert.throws(() => store.receiveReport(row, context), /guardar/)
  assert.equal(store.records.value, previous)
  writable = true
  store.saveFault(row, "Antena", context)
  assert.equal(record().mode, "active")
})
test("lifecycle is restored after all transitions", () => {
  let snapshot
  const { store } = setup((value) => {
    snapshot = JSON.parse(JSON.stringify(value))
    return true
  })
  store.saveFault(row, "Antena", context)
  store.receiveReport(row, context)
  const reloaded = createUnreportedLifecycleStore({ read: () => snapshot, write: () => true })
  assert.equal(reloaded.records.value[equipmentKey(row)].mode, "recovered")
  assert.equal(reloaded.records.value[equipmentKey(row)].fault, "Antena")
})
test("legacy retired equipment returns to tracking without losing its recorded reason", () => {
  for (const lastSeenAt of [row.lastReport, "2026-10-13T11:00:00.000Z"]) {
    const store = createUnreportedLifecycleStore({
      read: () => ({
        [equipmentKey(row)]: {
          mode: "inactive",
          lastSeenAt,
          reason: "Antena",
          inactiveAt: row.lastReport,
          inactiveBy: "Operador",
        },
      }),
      write: () => true,
      now: () => "2026-10-13T12:00:00.000Z",
    })
    store.observe([row], context, 6)
    const record = store.records.value[equipmentKey(row)]
    assert.equal(record.mode, lastSeenAt === row.lastReport ? "active" : "recovered")
    assert.equal(record.fault, "Antena")
    assert.equal(record.faultBy, "Operador")
    assert.equal(record.faultAt, row.lastReport)
  }
})
test("legacy date parsing keeps seconds and rejects invalid dates", () => {
  const date = new Date(parseUnreportedTimestamp("10-09-2026 18:07:15"))
  assert.equal(date.getSeconds(), 15)
  assert.equal(parseUnreportedTimestamp("31-02-2026"), null)
  assert.equal(parseUnreportedTimestamp("Sin reporte"), null)
})
test("editing and deleting notes preserve attribution and never restore deleted legacy notes", () => {
  const { store, record } = setup()
  store.saveFault(row, "En taller", context)
  store.observe([row], context, 6)
  const original = record().notes[0]
  store.editNote(row, original.id, "Antena reparada", context)
  assert.equal(record().notes[0].text, "Antena reparada")
  assert.equal(record().notes[0].createdAt, original.createdAt)
  assert.equal(record().notes[0].author, original.author)
  assert.equal(record().notes[0].updatedBy, "Operador")
  assert.ok(record().notes[0].updatedAt)
  assert.throws(() => store.editNote(row, original.id, " ", context), /nota/)
  assert.throws(() => store.deleteNote(row, original.id, { ...context, companies: [] }), /acceso/)
  store.deleteNote(row, original.id, context)
  store.observe([row], context, 6)
  assert.deepEqual(record().notes, [])
  assert.equal(record().mode, "active")
  assert.throws(() => store.deleteNote(row, original.id, context), /existe/)
})
test("failed note updates retain the original data", () => {
  let writable = true
  const { store, record } = setup(() => writable)
  store.addNote(row, "En taller", context)
  const note = record().notes[0]
  writable = false
  assert.throws(() => store.editNote(row, note.id, "Cambio", context), /guardar/)
  assert.throws(() => store.deleteNote(row, note.id, context), /guardar/)
  assert.equal(record().notes[0], note)
})
test("notes append without overwriting, survive recovery and migrate faults once", () => {
  const { store, record } = setup()
  store.saveFault(row, "Esta en taller", context)
  store.observe([row], context, 6)
  store.observe([row], context, 6)
  assert.equal(record().notes.length, 1)
  store.addNote(row, "Antena revisada", context)
  store.addNote(row, "Pendiente prueba", context)
  assert.deepEqual(
    record().notes.map((note) => note.text),
    ["Esta en taller", "Antena revisada", "Pendiente prueba"],
  )
  assert.equal(new Set(record().notes.map((note) => note.id)).size, 3)
  assert.equal(record().mode, "active")
  store.receiveReport(row, context)
  assert.equal(record().notes.length, 3)
  assert.equal(record().mode, "recovered")
  assert.throws(() => store.addNote(row, " ", context), /nota/)
  assert.throws(() => store.addNote(row, "x".repeat(501), context), /nota/)
  assert.throws(() => store.addNote(row, "Prueba", { ...context, companies: [] }), /acceso/)
})
test("explicit incoming diagnostic fields are stored with their packet timestamp", () => {
  const { store, record } = setup()
  store.receiveReport(row, context, "2026-10-13T12:00:00.000Z", 6, {
    externalVoltage: 12.82,
    mobileRegistered: false,
    mobileSignalDbm: -109,
    simStatus: "ready",
    unrelatedField: "ignored",
  })
  assert.equal(record().telemetry.reportedAt, "2026-10-13T12:00:00.000Z")
  assert.equal(record().telemetry.mobileRegistered, false)
  assert.equal(record().telemetry.mobileSignalDbm, -109)
  assert.equal("unrelatedField" in record().telemetry, false)
})
test("a simulated report without measurements does not refresh older diagnostic fields", () => {
  const { store, record, setTime } = setup()
  store.receiveReport(row, context, "2026-10-13T12:00:00.000Z", 6, {
    externalVoltage: 0,
    simStatus: "error",
  })
  setTime("2026-10-13T13:00:00.000Z")
  store.receiveReport(row, context)
  assert.equal(record().lastSeenAt, "2026-10-13T13:00:00.000Z")
  assert.equal(record().telemetry.reportedAt, "2026-10-13T12:00:00.000Z")
})
test("observe attaches measurements from the new packet in the same update", () => {
  const { store, record } = setup()
  store.observe([row], context, 6)
  const reportedAt = "2026-10-13T12:00:00.000Z"
  store.observe(
    [
      {
        ...row,
        lastReport: reportedAt,
        telemetry: { reportedAt, externalVoltage: 12.82, simStatus: "absent" },
      },
    ],
    context,
    6,
  )
  assert.equal(record().mode, "recovered")
  assert.equal(record().telemetry.reportedAt, reportedAt)
  assert.equal(record().telemetry.simStatus, "absent")
})
