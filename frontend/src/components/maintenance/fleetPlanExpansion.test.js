import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('fleet expansion replaces other open vehicle and scrolls after its rows render', () => {
  const source = readFileSync(new URL('./MaintenanceFleetTab.vue', import.meta.url), 'utf8')
  assert.match(source, /expandedVehicleIds.value = \[itemId\]/)
  assert.match(source, /expandedVehicleIds.value = \[id\]/)
  assert.doesNotMatch(source, /expandedVehicleIds.value.push|\.\.\.expandedVehicleIds.value/)
  assert.match(source, /await nextTick\(\)/)
  assert.match(source, /request !== vehicleFocusRequest/)
  assert.match(source, /:data-vehicle-id="item.id"/)
  assert.match(source, /container.scrollTo\(/)
  assert.match(source, /prefers-reduced-motion: reduce/)
  assert.match(source, /- headerHeight - 8/)
})
