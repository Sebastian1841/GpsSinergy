import test from 'node:test'
import assert from 'node:assert/strict'
import { sortFleetPlansByPriority } from './fleetPlanPriority.js'

test('plans prioritize overdue and due, resolving managed ties without comparing km to hours or days', () => {
  const plans = [
    { id: 'battery', status: 'current' },
    { id: 'fuel', status: 'due' },
    { id: 'oil', status: 'current' },
    { id: 'permit', status: 'due', order: { status: 'scheduled' } },
    { id: 'renew', status: 'renewal-pending' },
    { id: 'overdue', status: 'overdue', order: { status: 'in-progress' } },
  ]
  const before = plans.map((plan) => plan.id)
  assert.deepEqual(sortFleetPlansByPriority(plans).map((plan) => plan.id), ['overdue', 'fuel', 'permit', 'renew', 'battery', 'oil'])
  assert.deepEqual(plans.map((plan) => plan.id), before)
  assert.deepEqual(sortFleetPlansByPriority([]), [])
})

test('order and state updates change priority while ties remain stable', () => {
  const plans = [{ id: 'a', status: 'due', order: { status: 'waiting' } }, { id: 'b', status: 'due' }]
  assert.equal(sortFleetPlansByPriority(plans)[0].id, 'b')
  plans[0].status = 'overdue'
  assert.equal(sortFleetPlansByPriority(plans)[0].id, 'a')
})
