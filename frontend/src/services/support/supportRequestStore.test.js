import test from "node:test"
import assert from "node:assert/strict"
import { createSupportRequestStore } from "./supportRequestStore.js"
const client = {
  user: { id: "u1", name: "Cliente" },
  companyIds: ["c1"],
  technicianCompanyIds: [],
  assetIds: ["a1"],
  assigneeIds: [],
}
const tech = {
  ...client,
  user: { id: "t1", name: "Tecnico" },
  technicianCompanyIds: ["c1"],
  assigneeIds: ["t1"],
}
const draft = {
  companyId: "c1",
  company: "Empresa 1",
  type: "Consulta",
  subject: "Revision GPS",
  description: "Equipo sin señal",
  vehicleId: "a1",
}
const setup = (write = () => true) => {
  let id = 0
  return createSupportRequestStore({
    read: () => [],
    write,
    createId: () => `id-${++id}`,
    now: () => "2026-10-13T12:00:00.000Z",
  })
}
test("creates a request with initial message and keeps it after storage reload", () => {
  let saved
  const store = setup((rows) => {
    saved = JSON.parse(JSON.stringify(rows))
    return true
  })
  const id = store.create(draft, client)
  assert.equal(store.requests.value[0].status, "received")
  assert.equal(store.requests.value[0].messages[0].authorId, "u1")
  const loaded = createSupportRequestStore({ read: () => saved, write: () => true })
  assert.equal(loaded.requireRequest(id, client).subject, draft.subject)
})
test("rejects requests and replies outside authorized company scope", () => {
  const store = setup(),
    id = store.create(draft, client)
  const stranger = { ...client, companyIds: ["c2"] }
  assert.throws(() => store.create({ ...draft, companyId: "c2" }, client), /autorizada/)
  assert.throws(() => store.requireRequest(id, stranger), /acceso/)
  assert.throws(() => store.reply(id, "Hola", [], stranger), /acceso/)
  assert.equal(store.requests.value[0].messages.length, 1)
})
test("rejects unauthorized vehicles and empty or oversized submissions", () => {
  const store = setup()
  assert.throws(() => store.create({ ...draft, vehicleId: "a2" }, client), /vehiculo/)
  assert.throws(() => store.create({ ...draft, subject: " " }, client), /Completa/)
  assert.throws(() => store.create({ ...draft, description: "x".repeat(5001) }, client), /Completa/)
  assert.throws(() => store.create({ ...draft, type: "Otro" }, client), /Completa/)
})
test("clients cannot manage requests and technicians are restricted to their company", () => {
  const store = setup(),
    id = store.create(draft, client)
  const change = { status: "review", assigneeId: "" }
  assert.throws(() => store.update(id, change, client), /permiso/)
  assert.throws(
    () => store.update(id, change, { ...tech, technicianCompanyIds: ["c2"] }),
    /permiso/,
  )
  store.update(id, change, tech)
  assert.equal(store.requests.value[0].status, "review")
  assert.equal(store.requests.value[0].messages[1].kind, "event")
})
test("management validates appointment, state and assignee", () => {
  const store = setup(),
    id = store.create(draft, client)
  assert.throws(() => store.update(id, { status: "unknown" }, tech), /Estado/)
  assert.throws(() => store.update(id, { status: "scheduled", assigneeId: "" }, tech), /fecha/)
  assert.throws(
    () => store.update(id, { status: "review", assigneeId: "outside" }, tech),
    /Responsable/,
  )
  store.update(
    id,
    { status: "scheduled", assigneeId: "t1", assignee: "Tecnico", scheduledAt: "2026-10-14T12:00" },
    tech,
  )
  assert.equal(store.requests.value[0].assigneeId, "t1")
  assert.equal(store.requests.value[0].scheduledAt, "2026-10-14T12:00")
})
test("replying to a resolved request reopens it and retains the previous conversation", () => {
  const store = setup(),
    id = store.create(draft, client)
  store.update(id, { status: "resolved", assigneeId: "" }, tech)
  store.reply(id, "Sigue fallando", [{ storageId: "file-1", name: "foto.png" }], client)
  const request = store.requests.value[0]
  assert.equal(request.status, "received")
  assert.equal(request.messages.at(-1).text, "Sigue fallando")
  assert.equal(request.messages.at(-2).text, "Solicitud reabierta")
  assert.equal(request.messages[0].text, draft.description)
})
test("failed persistence never commits an unconfirmed change", () => {
  let writable = true
  const store = setup(() => writable),
    id = store.create(draft, client)
  const previous = store.requests.value
  writable = false
  assert.throws(() => store.reply(id, "Respuesta", [], client), /guardar/)
  assert.equal(store.requests.value, previous)
  assert.throws(() => store.create(draft, client), /guardar/)
  assert.equal(store.requests.value.length, 1)
})
test("platform administrators can manage requests only within the supplied authorized scope", () => {
  const store = setup(),
    id = store.create(draft, client)
  const admin = { ...client, user: { id: "admin", name: "Admin", isPlatformAdmin: true } }
  store.update(id, { status: "review", assigneeId: "" }, admin)
  assert.throws(
    () => store.update(id, { status: "resolved" }, { ...admin, companyIds: [] }),
    /acceso/,
  )
})
