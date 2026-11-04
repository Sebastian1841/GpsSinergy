import test from "node:test"
import assert from "node:assert/strict"
import {
  alarmAttentionLabel,
  alarmAttentionState,
  alarmDay,
  matchesInboxTab,
  groupInboxAlarms,
  buildInboxSummary,
} from "./alarmInbox.js"

const alarm = (id, changes = {}) => ({
  id,
  companyId: "a",
  assetId: "v",
  ruleId: "r",
  status: "open",
  createdAt: "2026-10-28T12:00:00Z",
  metadata: {},
  ...changes,
})

test("inbox groups by authorized company, vehicle, rule and Chilean day", () => {
  const rows = [
    alarm("1"),
    alarm("2"),
    alarm("3", { assetId: "other" }),
    alarm("4", { ruleId: "other" }),
    alarm("5", { companyId: "other" }),
    alarm("6", { createdAt: "2026-10-29T12:00:00Z" }),
  ]
  assert.equal(groupInboxAlarms(rows).length, 5)
  assert.equal(groupInboxAlarms(rows)[0].groupMembers.length, 2)
  assert.equal(groupInboxAlarms([alarm("1", { ruleId: "" }), alarm("2", { ruleId: "" })]).length, 2)
  assert.equal(alarmDay("2026-10-29T01:00:00Z"), alarmDay("2026-10-28T12:00:00Z"))
})

test("mixed groups show all attention states regardless of which episode comes first", () => {
  const rows = [
    alarm("done", { status: "resolved" }),
    alarm("new"),
    alarm("started", { metadata: { attention: { startedAt: "2026-10-28T13:00:00Z" } } }),
  ]
  for (const ordered of [rows, [...rows].reverse()]) {
    const group = groupInboxAlarms(ordered)[0]
    assert.equal(group.status, "open")
    assert.equal(alarmAttentionState(group), "mixed")
    assert.equal(alarmAttentionLabel(group), "1 sin iniciar · 1 en curso · 1 atendida")
  }
  assert.equal(rows[0].status, "resolved")
  const done = groupInboxAlarms([
    alarm("1", { status: "resolved" }),
    alarm("2", { status: "resolved" }),
  ])[0]
  assert.equal(alarmAttentionState(done), "attended")
  assert.equal(alarmAttentionLabel(done), "Atendida")
})

test("attention and historical filters do not mistake old dates for historical execution", () => {
  const started = alarm("1", { metadata: { attention: { startedAt: "2026-10-28T13:00:00Z" } } })
  assert.equal(alarmAttentionState(started), "in-progress")
  assert.equal(matchesInboxTab(started, "pending"), true)
  assert.equal(matchesInboxTab(started, "unattended"), false)
  assert.equal(matchesInboxTab(started, "in-progress"), true)
  assert.equal(matchesInboxTab(alarm("new"), "in-progress"), false)
  assert.equal(matchesInboxTab({ ...started, status: "resolved" }, "in-progress"), false)
  assert.equal(
    matchesInboxTab(
      { ...started, metadata: { ...started.metadata, historical: true } },
      "in-progress",
    ),
    false,
  )
  assert.equal(matchesInboxTab(alarm("2", { status: "resolved" }), "attended"), true)
  assert.equal(matchesInboxTab(alarm("3"), "historical"), false)
  assert.equal(matchesInboxTab(alarm("4", { metadata: { historical: true } }), "pending"), false)
})

test("attention stages are mutually exclusive and use the same labels as the inbox", () => {
  const stages = ["unattended", "in-progress", "attended"]
  const rows = [
    alarm("new"),
    alarm("started", { metadata: { attention: { startedAt: "2026-10-28T13:00:00Z" } } }),
    alarm("done", { status: "resolved" }),
  ]
  rows.forEach((row, index) =>
    assert.deepEqual(
      stages.filter((stage) => matchesInboxTab(row, stage)),
      [stages[index]],
    ),
  )
  assert.equal(alarmAttentionLabel(rows[0]), "Sin iniciar")
})

test("summary uses actual attention and explicit deadlines only", () => {
  const now = Date.parse("2026-10-28T13:00:00Z")
  const summary = buildInboxSummary(
    [
      alarm("1"),
      alarm("2", { metadata: { attention: { startedAt: "now" }, dueAt: "2026-10-28T12:30:00Z" } }),
      alarm("3", { status: "resolved" }),
      alarm("4", { metadata: { historical: true } }),
    ],
    now,
  )
  assert.deepEqual(summary, {
    unattended: 1,
    inProgress: 1,
    today: 3,
    oldestMinutes: 60,
    overdue: 1,
  })
})
