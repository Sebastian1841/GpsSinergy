import test from "node:test"
import assert from "node:assert/strict"
import {
  groupHistoryEquipment,
  countHistoryEquipment,
  filterHistoryEquipment,
} from "./unreportedHistorySearch.js"
import { consultationsForInterruption } from "./unreportedHistory.js"
import { computed, ref } from "vue"
const one = { id: "old", lastReportAt: "2026-09-01T12:00:00Z", recoveredAt: "2026-09-02T12:00:00Z" }
const two = {
  id: "recent",
  lastReportAt: "2026-10-10T12:00:00Z",
  recoveredAt: "2026-10-11T12:00:00Z",
}
const rows = [
  {
    name: "Equipo",
    company: "Empresa",
    imei: "001",
    interruptions: [one, two, { id: "open", lastReportAt: "2026-10-12T12:00:00Z" }],
  },
]

test("history filters combine per episode without mixing reasons, durations and decisions across cases", () => {
  const row = {
    ...rows[0],
    interruptions: [
      { ...one, durationMs: 86400000 },
      { ...two, durationMs: 8 * 86400000 },
      { id: "no-call", lastReportAt: "2026-08-01T12:00:00Z", recoveredAt: "2026-08-20T12:00:00Z" },
      { id: "first", kind: "first_report", recoveredAt: "2026-07-01T12:00:00Z", durationMs: null },
    ],
    consultations: [
      { interruptionId: "old", situation: "workshop", decision: "pending" },
      { interruptionId: "recent", situation: "working", decision: "field_review" },
    ],
  }
  for (const [filters, expected] of [
    [{ situation: "workshop", duration: "7d" }, []],
    [{ situation: "working", duration: "7d", review: "yes" }, ["recent"]],
    [{ situation: "workshop", review: "no" }, ["old"]],
    [{ situation: "none", duration: "15d" }, ["no-call"]],
    [{ review: "yes" }, ["recent"]],
  ]) {
    const grouped = groupHistoryEquipment([row], "", "", filters)
    assert.deepEqual(
      grouped.flatMap((item) => item.interruptions.map((episode) => episode.id)),
      expected,
    )
    assert.equal(countHistoryEquipment([row], "", "", filters), expected.length ? 1 : 0)
    if (grouped.length) assert.equal(grouped[0].totalCompletedCount, 4)
  }
})
test("filtered large histories read consultation links linearly rather than once per episode", () => {
  let reads = 0
  const interruptions = Array.from({ length: 1000 }, (_, index) => ({
    ...two,
    id: String(index),
    durationMs: 8 * 86400000,
  }))
  const consultations = interruptions.flatMap((episode) =>
    Array.from({ length: 3 }, () => ({
      get interruptionId() {
        reads++
        return episode.id
      },
      situation: "workshop",
      decision: "pending",
    })),
  )
  const input = [{ interruptions, consultations }]
  const filters = { situation: "workshop", duration: "7d", review: "no" }
  assert.equal(groupHistoryEquipment(input, "", "", filters)[0].completedCount, 1000)
  assert.equal(countHistoryEquipment(input, "", "", filters), 1)
  assert.ok(reads <= consultations.length * 3, `Too many consultation reads: ${reads}`)
})

test("indexed filters retain legacy boundaries and explicit links without caching stale edits", () => {
  const consultations = [
    {
      interruptionId: "other",
      createdAt: two.lastReportAt,
      situation: "workshop",
      decision: "pending",
    },
    { createdAt: two.lastReportAt, situation: "workshop", decision: "pending" },
    { createdAt: two.recoveredAt, situation: "not_in_use", decision: "pending" },
    { createdAt: "invalid", situation: "working", decision: "field_review" },
    { interruptionId: "old", createdAt: "invalid", situation: "working", decision: "field_review" },
  ]
  const input = [{ interruptions: [one, two], consultations }]
  for (const situation of ["workshop", "working", "not_in_use", "none"]) {
    const expected = [one, two]
      .filter((episode) => {
        const calls = consultationsForInterruption(input[0], episode)
        return situation === "none"
          ? !calls.length
          : calls.some((call) => call.situation === situation)
      })
      .map((episode) => episode.id)
      .sort()
    const actual = groupHistoryEquipment(input, "", "", { situation })
      .flatMap((row) => row.interruptions.map((episode) => episode.id))
      .sort()
    assert.deepEqual(actual, expected)
  }
  consultations[1].situation = "not_contacted"
  assert.deepEqual(groupHistoryEquipment(input, "", "", { situation: "workshop" }), [])
})

test("equipment history groups many episodes once and counts only the episodes it shows", () => {
  const result = groupHistoryEquipment(rows)
  assert.equal(result.length, 1)
  assert.equal(result[0].completedCount, 2)
  assert.deepEqual(
    result[0].interruptions.map((x) => x.id),
    ["recent", "old"],
  )
  assert.equal(result[0].latestDisconnectionAt, two.lastReportAt)
  assert.equal(rows[0].interruptions.length, 3)
})
test("date search includes only matching episodes and retains the total", () => {
  const result = groupHistoryEquipment(rows, "2026-10-01", "2026-10-31")
  assert.equal(result[0].completedCount, 1)
  assert.equal(result[0].totalCompletedCount, 2)
  assert.equal(result[0].interruptions[0].id, "recent")
  assert.deepEqual(groupHistoryEquipment(rows, "2026-11-01", "2026-10-01"), [])
  assert.deepEqual(groupHistoryEquipment(rows, "2027-01-01"), [])
  const calls = [
    { interruptionId: "old", createdAt: one.lastReportAt },
    { interruptionId: "recent", createdAt: two.lastReportAt },
  ]
  const filtered = groupHistoryEquipment([{ ...rows[0], consultations: calls }], "2026-10-01")
  assert.deepEqual(filtered[0].consultations, [calls[1]])
  assert.equal(filtered[0].lastRecoveryAt, two.recoveredAt)
})
test("calendar boundaries use Chilean dates, including the entire end day", () => {
  const result = groupHistoryEquipment(
    [
      {
        interruptions: [
          { id: "edge", lastReportAt: "2026-10-11T02:59:00Z", recoveredAt: "2026-10-12T00:00:00Z" },
        ],
      },
    ],
    "2026-10-10",
    "2026-10-10",
  )
  assert.equal(result.length, 1)
  assert.equal(result[0].completedCount, 1)
})

test("lightweight history count never reads calls and stops at the first matching episode", () => {
  const row = {
    interruptions: [
      one,
      {
        get recoveredAt() {
          throw new Error("Unnecessary episode scan")
        },
      },
    ],
    get consultations() {
      throw new Error("Counter must not load calls")
    },
  }
  assert.equal(countHistoryEquipment([row]), 1)
  assert.equal(
    countHistoryEquipment(rows, "2026-10-01", "2026-10-31"),
    groupHistoryEquipment(rows, "2026-10-01", "2026-10-31").length,
  )
  assert.equal(countHistoryEquipment(rows, "2026-11-01", "2026-10-01"), 0)
  assert.equal(
    countHistoryEquipment([
      { interruptions: [{ recoveredAt: two.recoveredAt, lastReportAt: "invalid" }] },
    ]),
    0,
  )
})

test("search and company filtering happen before accessing excluded equipment history", () => {
  const excluded = {
    name: "Other",
    company: "Another company",
    imei: "002",
    get interruptions() {
      throw new Error("Excluded history was read")
    },
  }
  const source = [...rows, excluded]
  const selected = filterHistoryEquipment(source, " EQUIPO ", "Empresa")
  assert.equal(selected.length, 1)
  assert.equal(groupHistoryEquipment(selected).length, 1)
  assert.equal(filterHistoryEquipment(source, "001").length, 1)
  assert.equal(filterHistoryEquipment(source, "empresa").length, 1)
  assert.equal(countHistoryEquipment(filterHistoryEquipment(source, "", "Empresa")), 1)
})

test("indexed consultation selection preserves explicit IDs, legacy boundaries, order and duplicates", () => {
  const episodes = [
    one,
    two,
    { id: "overlap", lastReportAt: two.lastReportAt, recoveredAt: two.recoveredAt },
    { id: "open", lastReportAt: two.lastReportAt, recoveredAt: null },
  ]
  const calls = [
    { id: "outside-date-but-linked", interruptionId: "recent", createdAt: "2027-01-01T00:00:00Z" },
    { id: "wrong-link", interruptionId: "other", createdAt: two.lastReportAt },
    { id: "legacy-start", createdAt: two.lastReportAt },
    { id: "legacy-end", createdAt: two.recoveredAt },
    { id: "legacy-old", createdAt: one.lastReportAt },
    { id: "invalid", createdAt: "invalid" },
    { id: "open-only", interruptionId: "open", createdAt: two.lastReportAt },
  ]
  calls.push(calls[2])
  const row = { interruptions: episodes, consultations: calls }
  const selected = [two, episodes[2]]
  const expected = new Set(
    selected.flatMap((episode) => consultationsForInterruption(row, episode)),
  )
  const result = groupHistoryEquipment([row], "2026-10-01", "2026-10-31")[0]
  assert.deepEqual(
    result.consultations,
    calls.filter((call) => expected.has(call)),
  )
  assert.equal(row.interruptions.length, 4)
  assert.equal(row.consultations.length, 8)
})

test("explicit consultation IDs are read once per call rather than once per episode", () => {
  let reads = 0
  const episodes = Array.from({ length: 100 }, (_, index) => ({ ...two, id: String(index) }))
  const calls = episodes.map((episode) => ({
    get interruptionId() {
      reads++
      return episode.id
    },
  }))
  const result = groupHistoryEquipment([{ interruptions: episodes, consultations: calls }])
  assert.equal(result[0].consultations.length, 100)
  assert.ok(reads <= 200)
})

test("reactive counts do not evaluate detail queries while the operational tab is active", () => {
  const section = ref("active")
  let callReads = 0
  const source = [
    {
      ...rows[0],
      get consultations() {
        callReads++
        return []
      },
    },
  ]
  const query = computed(() => (section.value === "history" ? groupHistoryEquipment(source) : []))
  const count = computed(() => countHistoryEquipment(source))
  assert.equal(count.value, 1)
  assert.equal(callReads, 0)
  assert.deepEqual(query.value, [])
  assert.equal(callReads, 0)
  section.value = "history"
  assert.equal(query.value.length, 1)
  assert.ok(callReads > 0)
  const previousReads = callReads
  assert.equal(query.value.length, 1)
  assert.equal(count.value, 1)
  assert.equal(callReads, previousReads)
})
test("first reports are searchable by reception date without inventing an outage start", () => {
  const row = {
    name: "Nunca reporto",
    interruptions: [
      {
        id: "first",
        kind: "first_report",
        lastReportAt: null,
        recoveredAt: "2026-10-19T12:00:00Z",
      },
    ],
    consultations: [{ id: "call", interruptionId: "first" }],
  }
  const result = groupHistoryEquipment([row], "2026-10-19", "2026-10-19")
  assert.equal(result.length, 1)
  assert.equal(result[0].interruptions[0].lastReportAt, null)
  assert.equal(result[0].consultations.length, 1)
  assert.equal(countHistoryEquipment([row]), 1)
  assert.equal(groupHistoryEquipment([row], "2026-10-20", "").length, 0)
})
