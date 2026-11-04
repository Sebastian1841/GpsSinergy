import test from "node:test"
import assert from "node:assert/strict"
import { createVariableTestState, reconcileVariableTestState } from "./calculatedVariableTestState.js"

test("test state keeps surviving inputs and removes deleted keys independently by origin", () => {
  const state = createVariableTestState()
  Object.assign(state.signals, { speed: "0", ignition: "false" })
  Object.assign(state.profile, { speed: "manual", capacity: "" })
  state.profileAssetId = "a"
  const next = reconcileVariableTestState(state, { signals: ["speed", "rpm"], profile: ["speed", "capacity"] })
  assert.equal(next.signals.speed, "0")
  assert.equal(Object.hasOwn(next.signals, "ignition"), false)
  assert.equal(Object.hasOwn(next.signals, "rpm"), false)
  assert.equal(next.profile.speed, "manual")
  assert.equal(next.profile.capacity, "")
  assert.equal(next.profileAssetId, "a")
  const readded = reconcileVariableTestState(next, { signals: ["speed", "ignition"], profile: [] })
  assert.equal(Object.hasOwn(readded.signals, "ignition"), false)
  assert.equal(Object.getPrototypeOf(readded.signals), null)
})

test("new sessions do not share values or serialize manual inputs into configuration", () => {
  const first = createVariableTestState(), second = createVariableTestState()
  first.signals.speed = "99"
  assert.equal(Object.keys(second.signals).length, 0)
  assert.notEqual(first.profile, second.profile)
})
