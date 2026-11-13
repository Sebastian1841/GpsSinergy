import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'

test('history alone shows closing-date fields while open orders keep their status filters', () => {
  const source = readFileSync(new URL('./MaintenanceWorkOrdersTab.vue', import.meta.url), 'utf8')
  assert.match(source, /Fecha de cierre desde/)
  assert.match(source, /<label v-if="isHistory">/)
  assert.match(source, /<nav v-if="!isHistory" aria-label="Estados de ordenes">/)
  assert.match(source, /@click="selectOrderList\('finished'\)"/)
  assert.match(source, /<span>Hasta<\/span>/)
  assert.doesNotMatch(source, /deadlineFilter|optgroup|has-custom-range/)
  assert.match(source, /if \(!deadlineFrom.value && !deadlineTo.value\) return true/)
  assert.match(source, /return \(!from \|\| deadline >= from\) && \(!to \|\| deadline <= to\)/)
  assert.match(source, /:max="deadlineTo \|\| undefined"/)
  assert.match(source, /:min="deadlineFrom \|\| undefined"/)
  assert.match(source, /if \(invalidDeadlineRange.value\) return false/)
  assert.match(source, /v-if="isHistory && invalidDeadlineRange" class="orders-date-error" role="alert"/)
  const { descriptor } = parse(source)
  const script = compileScript(descriptor, { id: 'order-date-filter' })
  const result = compileTemplate({ source: descriptor.template.content, filename: 'MaintenanceWorkOrdersTab.vue', id: 'order-date-filter', compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(result.errors, [])
})

test('closing-date range ignores deadlines and never filters open orders', async () => {
  const { parseMaintenanceOrderDate: parseOrderDate } = await import('../../utils/maintenance/maintenanceOrderSummary.js')
  const source = readFileSync(new URL('./MaintenanceWorkOrdersTab.vue', import.meta.url), 'utf8')
  const body = source.match(/const matchesDeadlineFilter = \(order\) => \{([\s\S]*?)\n\}/)[1]
  const isHistory = { value: true }
  const deadlineFrom = { value: '2026-11-01' }
  const deadlineTo = { value: '2026-11-11' }
  const invalidDeadlineRange = { value: false }
  const matches = new Function('isHistory', 'deadlineFrom', 'deadlineTo', 'invalidDeadlineRange', 'parseOrderDate', `return (order) => {${body}}`)(isHistory, deadlineFrom, deadlineTo, invalidDeadlineRange, parseOrderDate)
  assert.equal(matches({ closedAt: '2026-11-01', scheduledDate: '2027-01-01' }), true)
  assert.equal(matches({ closedAt: '2026-11-11T23:00:00', scheduledDate: '2020-01-01' }), true)
  assert.equal(matches({ closedAt: '2026-10-31', scheduledDate: '2026-11-05' }), false)
  assert.equal(matches({}), false)
  invalidDeadlineRange.value = true
  assert.equal(matches({ closedAt: '2026-11-05' }), false)
  isHistory.value = false
  assert.equal(matches({ scheduledDate: '2020-01-01' }), true)
  isHistory.value = true
  deadlineFrom.value = ''
  deadlineTo.value = ''
  invalidDeadlineRange.value = false
  assert.equal(matches({}), true)
})
