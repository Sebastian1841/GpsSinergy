import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDriverLicenseAlerts, createDriverLicenseAlertTracker } from './driverLicenseAlerts.js'

const driver = { id: 'driver', licenseId: 'license', name: 'Conductor', expiresAt: '2026-11-30', warningDays: 30 }
const setup = (companyId = 'company', userId = 'user', memory = new Map()) => {
  const storage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }
  return { storage, memory, tracker: createDriverLicenseAlertTracker({ storage, companyId, userId }) }
}

test('each deadline milestone alerts once and expiry never repeats every day', () => {
  const { tracker } = setup()
  for (const date of ['2026-11-01', '2026-11-15', '2026-11-23', '2026-11-30', '2026-12-01']) {
    const alerts = tracker.pending([driver], date)
    assert.equal(alerts.length, 1)
    tracker.acknowledge(alerts)
    assert.equal(tracker.pending([driver], date).length, 0)
  }
  assert.equal(tracker.pending([driver], '2026-12-02').length, 0)
})

test('custom advance and zero-day notice match maintenance-style threshold', () => {
  assert.equal(buildDriverLicenseAlerts([{ ...driver, warningDays: 7 }], '2026-11-22').length, 0)
  assert.equal(buildDriverLicenseAlerts([{ ...driver, warningDays: 7 }], '2026-11-23').length, 1)
  assert.equal(buildDriverLicenseAlerts([{ ...driver, warningDays: 0 }], '2026-11-29').length, 0)
  assert.equal(buildDriverLicenseAlerts([{ ...driver, warningDays: 0 }], '2026-11-30').length, 1)
  assert.equal(buildDriverLicenseAlerts([{ ...driver, expiresAt: 'invalid' }], '2026-11-30').length, 0)
})

test('seen alerts survive reload and are isolated by user, company and renewed license', () => {
  const { tracker, storage, memory } = setup()
  tracker.acknowledge(tracker.pending([driver], '2026-11-15'))
  const restored = createDriverLicenseAlertTracker({ storage, companyId: 'company', userId: 'user' })
  assert.equal(restored.pending([driver], '2026-11-15').length, 0)
  assert.equal(setup('other', 'user', memory).tracker.pending([driver], '2026-11-15').length, 1)
  assert.equal(setup('company', 'other', memory).tracker.pending([driver], '2026-11-15').length, 1)
  assert.equal(restored.pending([{ ...driver, licenseId: 'renewed' }], '2026-11-15').length, 1)
  assert.equal(restored.pending([{ ...driver, expiresAt: '2030-11-30', licenseId: 'renewed' }], '2026-11-15').length, 0)
})

test('invalid or unwritable alert tracking is surfaced without overwriting previous data', () => {
  let raw = '{broken'
  const storage = { getItem: () => raw, setItem: () => { throw new Error('quota') } }
  const tracker = createDriverLicenseAlertTracker({ storage, companyId: 'company', userId: 'user' })
  assert.throws(() => tracker.pending([driver], '2026-11-15'))
  assert.equal(raw, '{broken')
  raw = '[]'
  assert.throws(() => tracker.acknowledge(buildDriverLicenseAlerts([driver], '2026-11-15')), /quota/)
  assert.equal(tracker.pending([driver], '2026-11-15').length, 1)
})

test('shown alerts remain pending until explicit review, including after reloading', () => {
  const { tracker, storage } = setup()
  const alerts = tracker.unshown([driver], '2026-11-15')
  tracker.markShown(alerts)
  const restored = createDriverLicenseAlertTracker({ storage, companyId: 'company', userId: 'user' })
  assert.equal(restored.unshown([driver], '2026-11-15').length, 0)
  assert.equal(restored.pending([driver], '2026-11-15').length, 1)
  restored.acknowledge(alerts)
  assert.equal(restored.pending([driver], '2026-11-15').length, 0)
})

test('old automatically acknowledged entries migrate as shown, not reviewed', () => {
  const { memory, tracker } = setup()
  const old = buildDriverLicenseAlerts([driver], '2026-11-15')
  memory.set('sinergy-driver-license-alerts:company:user', JSON.stringify(old.map((alert) => alert.key)))
  assert.equal(tracker.unshown([driver], '2026-11-15').length, 0)
  assert.equal(tracker.pending([driver], '2026-11-15').length, 1)
  tracker.acknowledge(old)
  assert.equal(tracker.pending([driver], '2026-11-15').length, 0)
  assert.equal(JSON.parse(memory.get('sinergy-driver-license-alerts:company:user')).version, 2)
})
