import test from "node:test"
import assert from "node:assert/strict"
import { createDemoHistoryEquipment } from "./unreportedHistoryDemo.js"
import { groupHistoryEquipment } from "./unreportedHistorySearch.js"
import { interruptionDiagnosis } from "./unreportedHistory.js"
const now = new Date("2026-10-15T15:00:00Z")
test("demo fixtures include multiple teams and historical episodes with unambiguous identities", () => {
  const rows = createDemoHistoryEquipment(now)
  assert.equal(rows.length, 12)
  assert.equal(rows.flatMap((row) => row.interruptions).length, 59)
  assert.equal(new Set(rows.map((row) => row.imei)).size, 12)
  assert.equal(rows[0].interruptions.length, 8)
  for (const row of rows) {
    assert.match(row.name, /\(DEMO\)/)
    assert.match(row.imei, /^DEMO-/)
    for (const episode of row.interruptions) {
      assert.ok(Date.parse(episode.recoveredAt) < now.getTime())
      assert.ok(Date.parse(episode.recoveredAt) > Date.parse(episode.detectedAt))
      for (const call of row.consultations.filter((item) => item.interruptionId === episode.id)) {
        assert.ok(Date.parse(call.createdAt) >= Date.parse(episode.detectedAt))
        assert.ok(Date.parse(call.createdAt) <= Date.parse(episode.recoveredAt))
      }
    }
  }
  assert.deepEqual(createDemoHistoryEquipment("invalid"), [])
})
test("examples exercise repeated faults, unknown causes, searches by date and calls", () => {
  const rows = createDemoHistoryEquipment(now)
  const first = groupHistoryEquipment(rows)[0]
  assert.equal(first.completedCount, 8)
  assert.equal(interruptionDiagnosis(first.interruptions[0]).reason, "Alimentacion desconectada")
  assert.equal(interruptionDiagnosis(first.interruptions[2]).reason, "Alimentacion desconectada")
  assert.ok(rows.some((row) => row.interruptions.some((item) => !item.telemetry)))
  assert.ok(
    rows.some((row) =>
      row.interruptions.some(
        (item) => !row.consultations.some((call) => call.interruptionId === item.id),
      ),
    ),
  )
  assert.equal(groupHistoryEquipment(rows, "2026-10-01", "2026-10-15")[0].completedCount, 1)
  assert.equal(
    first.consultations.filter((call) => call.interruptionId === first.interruptions[0].id).length,
    2,
  )
})
