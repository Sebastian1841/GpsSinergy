import test from "node:test"
import assert from "node:assert/strict"
import { buildUnreportedEquipment } from "./unreportedAssetsSource.js"
import { createUnreportedLifecycleStore, equipmentKey } from "./unreportedLifecycleStore.js"
import { mockDatabaseSeed } from "../../data/mockDatabase.js"
import { filterHistoryEquipment } from "../../utils/unreported/unreportedHistorySearch.js"

const companies = [
  { id: "a", name: "Empresa A" },
  { id: "b", name: "Empresa B" },
]

test("Maquinaria forestal returns to the active search after a second simulated outage", () => {
  let date = "2026-10-19T13:45:00Z"
  const row = buildUnreportedEquipment(mockDatabaseSeed.assets, mockDatabaseSeed.companies).find(
    (item) => item.imei === "868123450009",
  )
  assert.ok(row)
  const context = { user: { id: "test" }, companies: [row.company] }
  const store = createUnreportedLifecycleStore({
    read: () => ({}),
    write: () => true,
    now: () => date,
    allowSimulation: true,
  })
  store.observe([row], context, 6)
  store.receiveReport(row, context, date, 6)
  assert.equal(store.records.value[equipmentKey(row)].mode, "recovered")
  date = "2026-10-19T13:46:00Z"
  store.simulateDisconnection(row, context, 6)
  store.observe([row], context, 6)
  const record = store.records.value[equipmentKey(row)]
  const matches = filterHistoryEquipment([{ ...row, ...record }], row.imei).filter(
    (item) => item.mode === "active" && !item.archived,
  )
  assert.equal(matches.length, 1)
  assert.equal(record.interruptions.filter((item) => item.recoveredAt).length, 1)
  assert.equal(record.interruptions.filter((item) => !item.recoveredAt).length, 1)
})

test("equipment source uses the actual company, identity, location and report without synthetic rows", () => {
  const assets = [
    {
      id: "1",
      companyId: "b",
      imei: "00123",
      nombrePantalla: "Bus real",
      patente: "AB-12",
      mapIcon: "vehicle-bus",
      reportedAt: "2026-10-19T12:00:00Z",
      direccion: "Temuco",
      externalVoltage: 0,
    },
    {
      id: "2",
      companyId: "a",
      imei: "00123",
      name: "Otra empresa",
      datosUlt: "12:01:03",
      estado: "offline",
    },
    { id: "3", companyId: "unknown", imei: "999" },
    { id: "4", companyId: "a" },
  ]
  const rows = buildUnreportedEquipment(assets, companies)
  assert.equal(rows.length, 2)
  assert.equal(rows[0].company, "Empresa B")
  assert.equal(rows[0].imei, "00123")
  assert.equal(rows[0].name, "Bus real")
  assert.equal(rows[0].location, "Temuco")
  assert.equal(rows[0].mapIcon, "vehicle-bus")
  assert.equal(rows[0].lastReport, "2026-10-19T12:00:00.000Z")
  assert.equal(rows[0].telemetry.externalVoltage, 0)
  assert.equal(rows[1].lastReport, null)
  assert.equal(rows[1].hasUndatedReport, true)
  assert.equal(buildUnreportedEquipment(assets, [companies[0]]).length, 1)
  assert.equal(buildUnreportedEquipment([assets[0], assets[0]], companies).length, 1)
})

test("a new report on the actual asset closes its case with the original telemetry", () => {
  const context = { user: { id: "u" }, companies: ["Empresa A"] }
  const store = createUnreportedLifecycleStore({
    read: () => ({}),
    write: () => true,
    now: () => "2026-10-19T12:00:00Z",
  })
  const asset = {
    companyId: "a",
    imei: "1",
    name: "Real",
    reportedAt: "2026-10-17T12:00:00Z",
    externalVoltage: 0,
  }
  let rows = buildUnreportedEquipment([asset], companies)
  store.observe(rows, context, 6)
  assert.equal(store.records.value[equipmentKey(rows[0])].mode, "active")
  rows = buildUnreportedEquipment(
    [{ ...asset, reportedAt: "2026-10-19T12:00:00Z", externalVoltage: 12 }],
    companies,
  )
  store.observe(rows, context, 6)
  const record = store.records.value[equipmentKey(rows[0])]
  assert.equal(record.mode, "recovered")
  assert.equal(record.interruptions[0].telemetry.externalVoltage, 0)
  assert.equal(record.interruptions[0].recoveredAt, "2026-10-19T12:00:00.000Z")
})

test("completing an old undated fixture creates an open case, not a fictitious recovery", () => {
  const context = { user: { id: "u" }, companies: ["Empresa A"] }
  const store = createUnreportedLifecycleStore({
    read: () => ({}),
    write: () => true,
    now: () => "2026-10-19T12:00:00Z",
  })
  const asset = { id: "old", companyId: "a", imei: "001", estado: "offline", datosUlt: "12:00:00" }
  let rows = buildUnreportedEquipment([asset], companies)
  store.observe(rows, context, 6)
  store.addConsultation(
    rows[0],
    {
      situation: "workshop",
      workshopDays: 10,
      decision: "pending",
      observation: "Consulta guardada",
    },
    context,
  )
  rows = buildUnreportedEquipment([{ ...asset, reportedAt: "2026-10-10T12:00:00Z" }], companies)
  store.observe(rows, context, 6)
  const record = store.records.value[equipmentKey(rows[0])]
  assert.equal(record.mode, "active")
  assert.equal(record.interruptions.length, 1)
  assert.equal(record.interruptions[0].recoveredAt, null)
  assert.equal(record.consultations[0].observation, "Consulta guardada")
})
