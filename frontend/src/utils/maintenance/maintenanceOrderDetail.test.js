import test from "node:test"
import assert from "node:assert/strict"
import { formatOrderDetailDate, getOrderDetailEvents } from "./maintenanceOrderDetail.js"

test("calendar deadlines never shift to the previous day or acquire an invented time", () => {
  assert.equal(formatOrderDetailDate("2026-09-30"), "30-09-2026")
  assert.equal(formatOrderDetailDate("30/09/2026"), "30-09-2026")
  assert.equal(formatOrderDetailDate(""), "Sin registro")
  assert.equal(formatOrderDetailDate("not-a-date"), "not-a-date")
  assert.match(formatOrderDetailDate("2026-11-06T15:30:00Z"), /12:30/)
})

test("history does not invent waiting steps, actors or timestamps", () => {
  const order = { status: "in-progress", scheduledDate: "2026-09-30", createdAt: "2026-11-05T16:00:00Z", audit: [
    { action: "OT creada", at: "2026-11-05T16:00:00Z", user: "Ana" },
    { action: "Programada", at: "2026-09-30", user: "Ana" },
    { action: "Trabajo iniciado", at: "2026-11-06T15:30:00Z", user: "Pedro", detail: "Inicio confirmado" },
  ] }
  const before = JSON.stringify(order)
  const events = getOrderDetailEvents(order)
  assert.deepEqual(events.map((event) => event.action), ["OT creada", "Trabajo iniciado"])
  assert.equal(events.at(-1).detail, "Inicio confirmado")
  assert.equal(JSON.stringify(order), before)
  assert.deepEqual(getOrderDetailEvents({ status: "finished", scheduledDate: "2026-09-30" }), [])
})

test("history falls back only to recorded facts when no audit exists", () => {
  const events = getOrderDetailEvents({ status: "finished", createdAt: "2026-11-01", startedAt: "2026-11-02", closedAt: "2026-11-03", closedBy: "Ana" })
  assert.deepEqual(events.map((event) => event.action), ["OT creada", "Trabajo iniciado", "OT cerrada"])
  assert.equal(events.at(-1).user, "Ana")
  assert.equal(events[0].user, undefined)
})
