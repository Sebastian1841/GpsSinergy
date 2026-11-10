import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('all maintenance action modals share a single width', () => {
  const source = readFileSync(new URL('./MaintenanceActionModal.vue', import.meta.url), 'utf8')
  const shell = source.slice(0, source.indexOf('<header'))
  for (const name of ['maintenance-create', 'work-order-create', 'work-order-close', 'work-order-cost', 'work-order-planning']) {
    assert.ok(shell.includes(`${name}-shell max-w-[900px]`), name)
  }
  for (const name of ['maintenance-types-modal', 'order-detail']) {
    assert.ok(shell.includes(`${name}-shell max-w-[900px]`), name)
  }
  assert.ok(shell.includes('work-order-transition-shell max-w-[900px]'))
  assert.doesNotMatch(shell, /max-w-\[(?!900px\])\d+px\]/)
})
