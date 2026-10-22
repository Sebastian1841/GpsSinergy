import test from "node:test"
import assert from "node:assert/strict"
import { computed, nextTick, ref, watch } from "vue"
import { knownEquipmentWithHistory } from "../../utils/unreported/unreportedHistory.js"
import { currentConsultations } from "../../utils/unreported/unreportedFlow.js"
import { workshopReminder } from "../../utils/unreported/unreportedWorkshop.js"
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

test("editing preserves identity and authorship, updates review, and deletion restores previous decision", () => {
  let persisted
  const { store, record, setTime } = setup((value) => {
    persisted = JSON.parse(JSON.stringify(value))
    return true
  })
  store.observe([row], context, 6)
  store.addConsultation(row, { situation: "working", decision: "field_review" }, context)
  const first = record().consultations[0]
  setTime("2026-10-14T12:00:00Z")
  store.addConsultation(row, { situation: "not_contacted", decision: "pending" }, context)
  const second = record().consultations[1]
  setTime("2026-10-15T12:00:00Z")
  store.editConsultation(
    row,
    second.id,
    { situation: "workshop", decision: "pending", workshopDays: 10, observation: "Corregido" },
    context,
  )
  const edited = record().consultations[1]
  assert.equal(edited.id, second.id)
  assert.equal(edited.createdAt, second.createdAt)
  assert.equal(edited.author, second.author)
  assert.equal(edited.interruptionId, second.interruptionId)
  assert.equal(edited.editedBy, "Operador")
  assert.equal(edited.updatedAt, "2026-10-15T12:00:00Z")
  assert.equal(edited.observation, "Corregido")
  assert.equal(record().followUp, "pending")
  store.deleteConsultation(row, second.id, context)
  assert.deepEqual(record().consultations, [first])
  assert.equal(record().followUp, "field_review")
  store.deleteConsultation(row, first.id, context)
  assert.equal(record().followUp, "pending")
  assert.equal(persisted[equipmentKey(row)].consultations.length, 0)
})

test("consultation editing and deletion enforce access and leave state intact on failed persistence", () => {
  let canSave = true
  const { store, record } = setup(() => canSave)
  store.observe([row], context, 6)
  store.addConsultation(row, { situation: "working", decision: "field_review" }, context)
  const before = record(),
    call = before.consultations[0]
  const denied = { ...context, companies: [] }
  assert.throws(() => store.editConsultation(row, call.id, call, denied))
  assert.throws(() => store.deleteConsultation(row, call.id, denied))
  assert.throws(() => store.editConsultation(row, "missing", call, context))
  assert.throws(() => store.deleteConsultation(row, "missing", context))
  canSave = false
  assert.throws(() =>
    store.editConsultation(row, call.id, { ...call, observation: "No guardado" }, context),
  )
  assert.equal(record(), before)
  assert.throws(() => store.deleteConsultation(row, call.id, context))
  assert.equal(record(), before)
})

test("editing an old episode never changes the current case decision or consultations", () => {
  const { store, record, setTime } = setup()
  store.observe([row], context, 6)
  store.addConsultation(row, { situation: "working", decision: "field_review" }, context)
  const old = record().consultations[0]
  store.receiveReport(row, context)
  setTime("2026-10-14T12:00:00Z")
  store.observe([row], context, 6)
  store.editConsultation(row, old.id, { ...old, observation: "Correccion anterior" }, context)
  assert.equal(record().followUp, "pending")
  assert.equal(currentConsultations(record()).length, 0)
  assert.equal(record().consultations[0].interruptionId, old.interruptionId)
})

test("new consultations enforce situation decisions and recurrence clears current motives", () => {
  const { store, record, setTime } = setup()
  store.observe([row], context, 6)
  for (const [situation, decision] of [
    ["working", "field_review"],
    ["not_in_use", "pending"],
    ["not_contacted", "pending"],
    ["workshop", "pending"],
  ]) {
    store.addConsultation(row, { situation, decision: "no_visit", workshopDays: 10 }, context)
    assert.equal(record().followUp, decision)
    assert.equal(record().consultations.at(-1).decision, decision)
  }
  store.receiveReport(row, context)
  setTime("2026-10-14T12:00:00Z")
  store.observe([row], context, 6)
  assert.equal(record().mode, "active")
  assert.equal(record().followUp, "pending")
  assert.equal(currentConsultations(record()).length, 0)
  assert.equal(workshopReminder(record(), "2026-11-01T12:00:00Z"), null)
  assert.equal(record().consultations.length, 4)
})

test("workshop days are persisted and invalid estimates are rejected", () => {
  const { store, record } = setup()
  store.observe([row], context, 6)
  for (const workshopDays of [undefined, null, "", 0, -1, 2.5, 3651, "invalid"])
    assert.throws(
      () =>
        store.addConsultation(
          row,
          { situation: "workshop", decision: "pending", workshopDays },
          context,
        ),
      /dias estimados/,
    )
  store.addConsultation(
    row,
    { situation: "workshop", decision: "pending", workshopDays: 10 },
    context,
  )
  assert.equal(record().consultations.at(-1).workshopDays, 10)
})

test("contacted person belongs to the consultation, survives reload and is distinct from its author", () => {
  let saved
  const { store, record } = setup((value) => {
    saved = JSON.parse(JSON.stringify(value))
    return true
  })
  store.observe([row], context, 6)
  store.addConsultation(
    row,
    {
      situation: "workshop",
      workshopDays: 10,
      decision: "pending",
      contactedPerson: " Juan Perez ",
      contactedRole: " Encargado de taller ",
    },
    context,
  )
  const call = record().consultations[0]
  assert.equal(call.contactedPerson, "Juan Perez")
  assert.equal(call.contactedRole, "Encargado de taller")
  assert.equal(call.author, "Operador")
  const restored = createUnreportedLifecycleStore({ read: () => saved, write: () => true })
  assert.equal(
    restored.records.value[equipmentKey(row)].consultations[0].contactedPerson,
    "Juan Perez",
  )
  for (const fields of [{ contactedPerson: "a".repeat(101) }, { contactedRole: "a".repeat(81) }])
    assert.throws(() =>
      store.addConsultation(row, { situation: "working", decision: "pending", ...fields }, context),
    )
  assert.equal(record().consultations.length, 1)
  store.addConsultation(row, { situation: "not_contacted", decision: "pending" }, context)
  assert.equal(record().consultations[1].contactedPerson, "")
  assert.equal(record().consultations[1].contactedRole, "")
})

test("development simulation opens an independent second case and preserves both recoveries", () => {
  let date = "2026-10-19T12:00:00Z"
  const store = createUnreportedLifecycleStore({
    read: () => ({}),
    write: () => true,
    now: () => date,
    allowSimulation: true,
  })
  store.observe([row], context, 6)
  store.addConsultation(
    row,
    { situation: "workshop", workshopDays: 10, decision: "no_visit" },
    context,
  )
  store.receiveReport(row, context, date, 6)
  const closed = store.records.value[equipmentKey(row)].interruptions[0]
  date = "2026-10-19T12:01:00Z"
  store.simulateDisconnection(row, context, 6)
  store.observe([row], context, 6)
  let record = store.records.value[equipmentKey(row)]
  assert.equal(record.mode, "active")
  assert.equal(record.followUp, "pending")
  assert.equal(record.interruptions.length, 2)
  assert.equal(record.interruptions[0], closed)
  assert.equal(record.interruptions[1].demo, true)
  assert.equal(record.interruptions[1].recoveredAt, null)
  assert.equal(record.consultations[0].interruptionId, closed.id)
  date = "2026-10-19T12:02:00Z"
  store.receiveReport(row, context, date, 6)
  record = store.records.value[equipmentKey(row)]
  assert.equal(record.mode, "recovered")
  assert.equal(record.demoDisconnected, false)
  assert.equal(record.interruptions.length, 2)
  assert.equal(record.interruptions[1].recoveredAt, new Date(date).toISOString())
  const production = createUnreportedLifecycleStore({
    read: () => store.records.value,
    write: () => true,
  })
  assert.throws(() => production.simulateDisconnection(row, context, 6), /solo en desarrollo/)
})

test("simulated first report preserves the never-reported case and its consultations in history", () => {
  const { store, setTime } = setup()
  const never = { ...row, lastReport: "Sin reporte" }
  store.observe([never], context, 6)
  store.addConsultation(
    never,
    { situation: "workshop", workshopDays: 10, decision: "no_visit", observation: "En taller" },
    context,
  )
  setTime("2026-10-13T13:00:00Z")
  assert.equal(store.receiveReport(never, context, "2026-10-13T13:00:00Z", 6), true)
  store.observe([never], context, 6)
  const record = store.records.value[equipmentKey(never)]
  assert.equal(record.mode, "recovered")
  assert.equal(record.interruptions.length, 1)
  const episode = record.interruptions[0]
  assert.equal(episode.kind, "first_report")
  assert.equal(episode.lastReportAt, null)
  assert.equal(episode.durationMs, null)
  assert.equal(record.consultations[0].interruptionId, episode.id)
  assert.equal(store.receiveReport(never, context, "2026-10-13T13:00:00Z", 6), false)
  assert.equal(store.records.value[equipmentKey(never)].interruptions.length, 1)
  const restored = createUnreportedLifecycleStore({
    read: () => store.records.value,
    write: () => true,
  })
  assert.equal(restored.records.value[equipmentKey(never)].interruptions[0].kind, "first_report")
})

test("consultations validate and persist next calls and completed visits without recovering GPS", () => {
  const { store, record } = setup()
  store.observe([row], context, 6)
  const data = {
    situation: "workshop",
    workshopDays: 10,
    decision: "no_visit",
    nextCallDate: "2026-10-14",
    visitResult: "repaired",
    visitDate: "2026-10-13",
  }
  store.addConsultation(row, data, context)
  assert.equal(record().mode, "active")
  assert.equal(record().consultations[0].visitResult, "repaired")
  assert.equal(record().consultations[0].nextCallDate, "2026-10-14")
  const restored = createUnreportedLifecycleStore({
    read: () => store.records.value,
    write: () => true,
  })
  assert.equal(restored.records.value[equipmentKey(row)].consultations[0].visitDate, "2026-10-13")
  for (const invalid of [
    { nextCallDate: "2026-10-12" },
    { nextCallDate: "2026-02-30" },
    { visitDate: "2026-10-14" },
    { visitResult: "unknown" },
    { visitDate: "" },
    { visitResult: "", visitDate: "2026-10-13" },
  ])
    assert.throws(() => store.addConsultation(row, { ...data, ...invalid }, context))
  assert.equal(record().consultations.length, 1)
})
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

test("observed outages preserve independent telemetry and consultations across reloads", () => {
  let saved
  const { store, record, setTime } = setup((value) => {
    saved = structuredClone(value)
    return true
  })
  store.observe(
    [{ ...row, telemetry: { reportedAt: row.lastReport, externalVoltage: 0 } }],
    context,
    6,
  )
  store.addConsultation(
    row,
    { situation: "workshop", workshopDays: 10, decision: "no_visit", observation: "Primera falla" },
    context,
  )
  store.receiveReport(row, context, undefined, 6, { externalVoltage: 12, simStatus: "absent" })
  assert.equal(record().interruptions[0].telemetry.externalVoltage, 0)
  assert.ok(record().interruptions[0].recoveredAt)
  setTime("2026-10-14T12:00:00.000Z")
  store.observe([row], context, 6)
  assert.equal(record().interruptions.length, 2)
  assert.equal(record().interruptions[1].telemetry.simStatus, "absent")
  assert.equal(record().consultations[0].interruptionId, record().interruptions[0].id)
  const restored = createUnreportedLifecycleStore({ read: () => saved, write: () => true })
  assert.equal(restored.records.value[equipmentKey(row)].interruptions.length, 2)
  assert.equal(
    restored.records.value[equipmentKey(row)].interruptions[0].telemetry.externalVoltage,
    0,
  )
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
test("every interruption remains recorded after recovery, recurrence and reload", () => {
  let snapshot
  const { store, record, setTime } = setup((value) => {
    snapshot = JSON.parse(JSON.stringify(value))
    return true
  })
  store.observe([row], context, 6)
  store.observe([row], context, 6)
  assert.equal(record().interruptions.length, 1)
  store.addConsultation(
    row,
    { situation: "workshop", workshopDays: 10, decision: "no_visit" },
    context,
  )
  assert.equal(record().consultations[0].interruptionId, record().interruptions[0].id)
  store.receiveReport(row, context)
  const first = record().interruptions[0]
  setTime("2026-10-13T13:00:00.000Z")
  store.receiveReport(row, context)
  assert.equal(record().interruptions.length, 1)
  setTime("2026-10-13T20:00:00.000Z")
  store.observe([row], context, 6)
  assert.equal(record().interruptions.length, 2)
  assert.equal(record().interruptions[0], first)
  store.receiveReport(row, context)
  assert.equal(record().interruptions[1].durationMs, 7 * 3600000)
  const restored = createUnreportedLifecycleStore({
    read: () => snapshot,
    write: () => true,
    now: () => "2026-10-13T20:00:00.000Z",
  })
  restored.observe([row], context, 6)
  assert.equal(restored.records.value[equipmentKey(row)].interruptions.length, 2)
})
test("report gaps create new historical episodes even without an intermediate poll", () => {
  const { store, record, setTime } = setup()
  store.receiveReport(row, context)
  setTime("2026-10-13T20:00:00.000Z")
  store.receiveReport(row, context)
  assert.equal(record().interruptions.length, 2)
  assert.equal(record().interruptions[1].lastReportAt, "2026-10-13T12:00:00.000Z")
  assert.equal(record().interruptions[1].recoveredAt, "2026-10-13T20:00:00.000Z")
  store.observe([{ ...row, lastReport: "2026-10-13T20:00:00.000Z" }], context, 6)
  assert.equal(record().interruptions.length, 2)
})
test("a fresh latest-state snapshot after a closed page does not invent an unseen interruption", () => {
  const { store, record, setTime } = setup()
  const recent = { ...row, lastReport: "2026-10-13T11:00:00.000Z" }
  store.observe([recent], context, 6)
  setTime("2026-10-14T12:00:00.000Z")
  store.observe([{ ...row, lastReport: "2026-10-14T11:59:00.000Z" }], context, 6)
  assert.equal(record().mode, "reporting")
  assert.equal(record().interruptions.length, 0)
})
test("reactive known-equipment observation settles without repeated writes and retains archived lookup", async () => {
  let writes = 0
  const { store, record } = setup(() => {
    writes += 1
    return true
  })
  const source = ref([row])
  const known = computed(() => knownEquipmentWithHistory(source.value, store.records.value))
  const stop = watch(known, (rows) => store.observe(rows, context, 6), { immediate: true })
  try {
    await nextTick()
    assert.equal(writes, 1)
    store.receiveReport(row, context)
    await nextTick()
    assert.equal(writes, 2)
    source.value = []
    await nextTick()
    assert.equal(known.value[0].archived, true)
    assert.equal(record().interruptions.length, 1)
    assert.equal(writes, 2)
  } finally {
    stop()
  }
})
test("archived teams retain history without inventing current outages or admitting new consultations", () => {
  const { store, record, setTime } = setup()
  store.observe([row], context, 6)
  store.receiveReport(row, context)
  setTime("2026-10-14T12:00:00.000Z")
  store.observe([{ ...row, archived: true }], context, 6)
  assert.equal(record().mode, "recovered")
  assert.equal(record().interruptions.length, 1)
  assert.throws(
    () =>
      store.addConsultation(
        { ...row, archived: true },
        { situation: "working", decision: "pending" },
        context,
      ),
    /actual/,
  )
})
test("historical failures cannot overwrite records and ordinary reports create no false episodes", () => {
  let writable = true
  const { store, record, setTime } = setup(() => writable)
  const recent = { ...row, lastReport: "2026-10-13T11:00:00.000Z" }
  store.observe([recent], context, 6)
  store.receiveReport(recent, context)
  assert.equal(record().interruptions.length, 0)
  writable = false
  const before = store.records.value
  setTime("2026-10-13T14:00:00.000Z")
  assert.throws(() => store.observe([row], context, 1), /guardar/)
  assert.equal(store.records.value, before)
})
test("consultations retain reported situation and field decision independently of connectivity", () => {
  const { store, record, setTime } = setup()
  store.observe([row], context, 6)
  store.addConsultation(
    row,
    {
      situation: "workshop",
      workshopDays: 10,
      decision: "no_visit",
      observation: "En taller hasta el viernes",
    },
    context,
  )
  assert.equal(record().mode, "active")
  assert.equal(record().followUp, "pending")
  assert.equal(record().consultations[0].author, "Operador")
  store.addConsultation(row, { situation: "working", decision: "field_review" }, context)
  assert.equal(record().consultations.length, 2)
  assert.equal(record().followUp, "field_review")
  store.receiveReport(row, context)
  assert.equal(record().consultations.length, 2)
  assert.equal(record().mode, "recovered")
  setTime("2026-10-13T19:00:00.000Z")
  store.observe([row], context, 6)
  assert.equal(record().followUp, "pending")
  assert.equal(record().consultations.length, 2)
  assert.throws(
    () => store.addConsultation(row, { situation: "wrong", decision: "no_visit" }, context),
    /validas/,
  )
  assert.throws(
    () =>
      store.addConsultation(
        row,
        { situation: "working", decision: "pending" },
        { ...context, companies: [] },
      ),
    /acceso/,
  )
})
test("failed consultation persistence does not change the decision or history", () => {
  let writable = true
  const { store, record } = setup(() => writable)
  store.observe([row], context, 6)
  writable = false
  assert.throws(
    () => store.addConsultation(row, { situation: "not_contacted", decision: "pending" }, context),
    /guardar/,
  )
  assert.equal(record().followUp, "pending")
  assert.equal(record().consultations, undefined)
})
test("starting follow-up is explicit and does not change connectivity or overwrite notes", () => {
  const { store, record } = setup()
  store.observe([row], context, 6)
  store.addNote(row, "En taller", context)
  assert.equal(record().followUp, "pending")
  store.setFollowUp(row, "in_progress", context)
  assert.equal(record().mode, "active")
  assert.equal(record().followUp, "in_progress")
  assert.equal(record().followUpBy, "Operador")
  assert.equal(record().notes.length, 1)
  store.observe([row], context, 6)
  assert.equal(record().followUp, "in_progress")
  store.receiveReport(row, context)
  assert.equal(record().mode, "recovered")
  assert.equal(record().followUp, "in_progress")
  assert.throws(() => store.setFollowUp(row, "pending", context), /ya no/)
})
test("recurrence resets review status while preserving notes for both polling and incoming reports", () => {
  for (const path of ["poll", "packet"]) {
    const { store, record, setTime } = setup()
    store.observe([row], context, 6)
    store.addNote(row, "Revisado", context)
    store.setFollowUp(row, "in_progress", context)
    store.receiveReport(row, context)
    setTime("2026-10-13T19:00:00.000Z")
    if (path === "poll") store.observe([row], context, 6)
    else store.receiveReport(row, context)
    assert.equal(record().followUp, "pending")
    assert.equal(record().notes[0].text, "Revisado")
    assert.equal(record().mode, path === "poll" ? "active" : "recovered")
  }
})
test("follow-up is scoped by company and failed persistence keeps the previous state", () => {
  let writable = true
  const { store, record } = setup(() => writable)
  store.observe([row], context, 6)
  assert.throws(() => store.setFollowUp(row, "wrong", context), /valido/)
  assert.throws(
    () => store.setFollowUp(row, "in_progress", { ...context, companies: [] }),
    /acceso/,
  )
  writable = false
  assert.throws(() => store.setFollowUp(row, "in_progress", context), /guardar/)
  assert.equal(record().followUp, "pending")
})
test("equal IMEIs across companies keep independent follow-up records", () => {
  const { store, record } = setup()
  const other = { ...row, company: "Otra empresa" }
  const globalContext = { ...context, companies: [row.company, other.company] }
  store.observe([row, other], globalContext, 6)
  store.setFollowUp(row, "in_progress", globalContext)
  assert.equal(record().followUp, "in_progress")
  assert.equal(store.records.value[equipmentKey(other)].followUp, "pending")
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
