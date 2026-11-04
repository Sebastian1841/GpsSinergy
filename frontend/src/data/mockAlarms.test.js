import test from "node:test"
import assert from "node:assert/strict"
import { mockAlarms } from "./mockAlarms.js"
import { mockAutomaticAlertRules } from "./mockAutomaticAlertRules.js"
import { groupInboxAlarms } from "../utils/alarms/alarmInbox.js"

test("ten stable demo alerts provide separate groups for pagination without adding rules", () => {
  const demos = mockAlarms.filter((alarm) => alarm.id.startsWith("alarm-pagination-demo-"))
  assert.equal(demos.length, 10)
  assert.equal(new Set(mockAlarms.map((alarm) => alarm.id)).size, mockAlarms.length)
  assert.equal(groupInboxAlarms(demos).length, 10)
  for (const alarm of demos) {
    assert.equal(alarm.status, "open")
    assert.equal(alarm.metadata.demo, true)
    assert.ok(alarm.metadata.durationSeconds > 0)
    assert.ok(
      mockAutomaticAlertRules.some(
        (rule) => rule.id === alarm.ruleId && rule.companyId === alarm.companyId,
      ),
    )
  }
})
