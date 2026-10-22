import test from "node:test"
import assert from "node:assert/strict"
import {
  connectivityLabel,
  followUpLabel,
  matchesConsultation,
  matchesSilenceDays,
  compareUnreportedPriority,
  currentConsultations,
  localFollowUpDate,
  consultationFollowUpText,
  consultationContactLabel,
} from "./unreportedFlow.js"

test("contacted person is optional and export text preserves both name and role", () => {
  assert.equal(consultationContactLabel({}), "")
  assert.equal(consultationContactLabel({ contactedPerson: "Juan" }), "Hablo con: Juan")
  assert.equal(consultationContactLabel({ contactedRole: "Taller" }), "Cargo: Taller")
  assert.equal(
    consultationContactLabel({ contactedPerson: "Juan", contactedRole: "Taller" }),
    "Hablo con: Juan (Taller)",
  )
  assert.match(
    consultationFollowUpText({
      contactedPerson: "Juan",
      contactedRole: "Taller",
      nextCallDate: "2026-10-20",
    }),
    /Juan \(Taller\)[\s\S]*20-10-2026/,
  )
})

test("new outages do not inherit earlier calls, dates or visits; legacy calls use episode dates", () => {
  const record = {
    mode: "active",
    interruptions: [
      { id: "old", lastReportAt: "2026-10-01T00:00:00Z", recoveredAt: "2026-10-02T00:00:00Z" },
      { id: "new", lastReportAt: "2026-10-10T00:00:00Z" },
    ],
    consultations: [
      {
        id: "old-call",
        interruptionId: "old",
        situation: "workshop",
        nextCallDate: "2026-10-19",
        visitResult: "repaired",
      },
      { id: "legacy-old", createdAt: "2026-10-01T12:00:00Z" },
    ],
  }
  assert.deepEqual(currentConsultations(record), [])
  assert.equal(matchesConsultation(record, "none"), true)
  record.consultations.push(
    { id: "new-call", interruptionId: "new", situation: "working" },
    { id: "legacy-new", createdAt: "2026-10-11T00:00:00Z", situation: "not_in_use" },
  )
  assert.deepEqual(
    currentConsultations(record).map((call) => call.id),
    ["new-call", "legacy-new"],
  )
  assert.equal(matchesConsultation(record, "not_in_use"), true)
  assert.equal(record.consultations.length, 4)
  assert.equal(currentConsultations({ ...record, mode: "recovered" }).length, 4)
  assert.deepEqual(
    currentConsultations({
      mode: "active",
      consultations: [{ id: "never", interruptionId: null }],
    }).map((call) => call.id),
    ["never"],
  )
})

test("follow-up uses Chile calendar dates and readable export metadata", () => {
  assert.equal(localFollowUpDate("2026-10-19T01:00:00Z"), "2026-10-18")
  assert.match(
    consultationFollowUpText({
      nextCallDate: "2026-10-20",
      visitDate: "2026-10-19",
      visitResult: "repaired",
    }),
    /20-10-2026[\s\S]*19-10-2026: Falla corregida/,
  )
  assert.equal(consultationFollowUpText({}), "")
})

test("connectivity is independent from diagnostics, notes and human follow-up", () => {
  for (const followUp of ["pending", "field_review", "no_visit"]) {
    assert.equal(
      connectivityLabel({ mode: "active", lastSeenAt: "2026-10-14T10:00:00Z", followUp }),
      "Sin reportar",
    )
    assert.equal(connectivityLabel({ mode: "active", lastSeenAt: null, followUp }), "Nunca reporto")
    assert.equal(connectivityLabel({ mode: "recovered", followUp }), "Recuperado")
  }
  assert.equal(followUpLabel({}), "Pendiente de confirmar")
  assert.equal(followUpLabel({ followUp: "field_review" }), "Revision en terreno")
  assert.equal(followUpLabel({ followUp: "no_visit" }), "Sin revision por ahora")
  assert.equal(followUpLabel({ followUp: "in_progress" }), "Pendiente de confirmar")
})
test("consultation filter uses the latest call, not historical situations", () => {
  const row = { consultations: [{ situation: "workshop" }, { situation: "working" }] }
  assert.equal(matchesConsultation(row, "all"), true)
  assert.equal(matchesConsultation(row, "working"), true)
  assert.equal(matchesConsultation(row, "workshop"), false)
  assert.equal(matchesConsultation(row, "none"), false)
  for (const empty of [{}, { consultations: [] }]) {
    assert.equal(matchesConsultation(empty, "none"), true)
    assert.equal(matchesConsultation(empty, "working"), false)
  }
  for (const situation of ["working", "not_in_use", "workshop", "not_contacted"])
    assert.equal(matchesConsultation({ consultations: [{ situation }] }, situation), true)
})
test("day filters include the chosen threshold and do not invent time for unknown reports", () => {
  assert.equal(matchesSilenceDays({ elapsedHours: 24 }, "1d"), true)
  assert.equal(matchesSilenceDays({ elapsedHours: 23.99 }, "1d"), false)
  assert.equal(matchesSilenceDays({ elapsedHours: 72 }, "3d"), true)
  assert.equal(matchesSilenceDays({ elapsedHours: 72.1 }, "3d"), true)
  assert.equal(matchesSilenceDays({ elapsedHours: 168 }, "7d"), true)
  assert.equal(matchesSilenceDays({ elapsedHours: 169 }, "7d"), true)
  assert.equal(matchesSilenceDays({ elapsedHours: 360 }, "15d"), true)
  assert.equal(matchesSilenceDays({ elapsedHours: 361 }, "15d"), true)
  assert.equal(matchesSilenceDays({ elapsedHours: null }, "3d"), false)
  assert.equal(matchesSilenceDays({ elapsedHours: null }, "all"), true)
  assert.equal(matchesSilenceDays({ elapsedHours: null }, "unknown"), true)
  assert.equal(matchesSilenceDays({ elapsedHours: 24 }, "unknown"), false)
  assert.equal(matchesSilenceDays({ elapsedHours: 240 }, "custom", 10), true)
  assert.equal(matchesSilenceDays({ elapsedHours: 239 }, "custom", 10), false)
  for (const days of [null, "10", "", 0, -1, 1.5, 3651, NaN])
    assert.equal(matchesSilenceDays({ elapsedHours: 240 }, "custom", days), false)
})
test("default priority is strictly older first regardless of review decision", () => {
  const rows = [
    { name: "En taller", followUp: "no_visit", elapsedHours: 900 },
    { name: "Pendiente reciente", followUp: "pending", elapsedHours: 80 },
    { name: "Nunca reporto", followUp: "pending", elapsedHours: null },
    { name: "Pendiente antiguo", followUp: "pending", elapsedHours: 200 },
    { name: "Visita requerida", followUp: "field_review", elapsedHours: 12 },
  ]
  assert.deepEqual(
    [...rows].sort(compareUnreportedPriority).map((row) => row.name),
    ["En taller", "Pendiente antiguo", "Pendiente reciente", "Visita requerida", "Nunca reporto"],
  )
  assert.equal(rows[0].name, "En taller")
  const recovered = [
    { mode: "recovered", recoveredAt: "2026-10-13T12:00:00Z" },
    { mode: "recovered", recoveredAt: "2026-10-14T12:00:00Z" },
  ]
  assert.equal([...recovered].sort(compareUnreportedPriority)[0], recovered[1])
})

test("only workshop reminders override age, and age sorts within each priority group", () => {
  const rows = [
    { name: "Visita 2 dias", followUp: "field_review", elapsedHours: 48 },
    { name: "Pendiente 30 dias", followUp: "pending", elapsedHours: 720 },
    {
      name: "Taller proximo 3 dias",
      elapsedHours: 72,
      workshopReminder: { label: "Pronto a salir de taller" },
    },
    {
      name: "Taller vencido 10 dias",
      elapsedHours: 240,
      workshopReminder: { label: "Fecha estimada de salida cumplida" },
    },
  ]
  assert.deepEqual(
    [...rows].sort(compareUnreportedPriority).map((row) => row.name),
    ["Taller vencido 10 dias", "Taller proximo 3 dias", "Pendiente 30 dias", "Visita 2 dias"],
  )
  assert.equal(
    compareUnreportedPriority(
      { name: "Alfa", elapsedHours: 10 },
      { name: "Beta", elapsedHours: 10 },
    ) < 0,
    true,
  )
})
