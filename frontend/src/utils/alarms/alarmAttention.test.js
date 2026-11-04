import test from "node:test"
import assert from "node:assert/strict"
import {
  ATTENTION_ACTIONS,
  buildAttentionUpdate,
  getAttentionTargets,
  attentionTargetSignature,
} from "./alarmAttention.js"

const base = { status: "open", metadata: { speed: 90 } }
const input = { actor: "Ana", at: "2026-10-28T15:00:00Z" }
test("bulk attention never falls back to the open group when the selection is removed", () => {
  const groups = [
    {
      id: "one",
      groupKey: "a",
      groupMembers: [
        { id: "one", status: "open" },
        { id: "done", status: "resolved" },
      ],
    },
    { id: "two", groupKey: "b", groupMembers: [{ id: "two", status: "open" }] },
  ]
  const request = { groups, selectedAlarmId: "one", mode: "bulk", selectedGroupKeys: ["a", "b"] }
  assert.deepEqual(
    getAttentionTargets(request).map((alarm) => alarm.id),
    ["one", "two"],
  )
  assert.deepEqual(getAttentionTargets({ ...request, selectedGroupKeys: [] }), [])
  assert.deepEqual(getAttentionTargets({ ...request, selectedGroupKeys: ["b"] }), [])
  assert.deepEqual(
    getAttentionTargets({ ...request, mode: "single" }).map((alarm) => alarm.id),
    ["one"],
  )
  assert.notEqual(
    attentionTargetSignature(getAttentionTargets(request)),
    attentionTargetSignature(getAttentionTargets({ ...request, selectedGroupKeys: ["a"] })),
  )
  assert.equal(
    attentionTargetSignature(getAttentionTargets(request)),
    attentionTargetSignature([...getAttentionTargets(request)].reverse()),
  )
})
test("attention requires an explicit action and never mutates the previous record", () => {
  assert.equal(buildAttentionUpdate(base, input), null)
  assert.equal(buildAttentionUpdate(base, { ...input, action: "unknown" }), null)
  assert.equal(
    buildAttentionUpdate({ ...base, status: "resolved" }, { ...input, action: "confirmed" }),
    null,
  )
  assert.equal(base.metadata.attentionHistory, undefined)
})
test("all four choices set their intended state and store actor, time and optional note", () => {
  for (const choice of ATTENTION_ACTIONS) {
    const changes = buildAttentionUpdate(base, {
      ...input,
      action: choice.id,
      note: "  Verificado  ",
    })
    assert.equal(changes.status, choice.resolved ? "resolved" : "open")
    assert.equal(changes.resolvedBy, choice.resolved ? "Ana" : null)
    assert.equal(changes.metadata.attention.note, "Verificado")
    assert.equal(changes.metadata.attentionHistory[0].actor, "Ana")
    assert.equal(changes.metadata.speed, 90)
  }
})
test("successive attention actions append history and preserve the initial reviewer", () => {
  const first = buildAttentionUpdate(base, { ...input, action: "reviewing" })
  const second = buildAttentionUpdate(first, {
    ...input,
    actor: "Luis",
    at: "2026-10-28T16:00:00Z",
    action: "called-driver",
  })
  const last = buildAttentionUpdate(second, { ...input, actor: "Luis", action: "false-alarm" })
  assert.equal(last.metadata.attentionHistory.length, 3)
  assert.equal(last.metadata.attentionHistory[0].actor, "Ana")
  assert.equal(last.metadata.attention.startedBy, "Ana")
  assert.equal(last.resolvedBy, "Luis")
})
