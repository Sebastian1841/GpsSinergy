import test from 'node:test'
import assert from 'node:assert/strict'
import { getDriverRenewalLicense } from './driverLicenseHistory.js'

test('late photos resolve by license identity before and after another renewal', () => {
  const entry = { renewedLicense: { licenseId: 'renewed', photos: { front: null, back: null }, classes: ['B'], expiresAt: '2030-01-01' } }
  const driver = { licenseId: 'renewed', photos: { front: { storageId: 'late-photo' } }, classes: ['B'], expiresAt: '2030-02-01', history: [entry] }
  assert.equal(getDriverRenewalLicense(entry, driver).photos.front.storageId, 'late-photo')
  assert.equal(getDriverRenewalLicense(entry, driver).expiresAt, '2030-02-01')
  driver.history.push({ licenseId: 'renewed', photos: driver.photos, classes: driver.classes, expiresAt: driver.expiresAt })
  driver.licenseId = 'newer'
  driver.photos = { front: { storageId: 'unrelated' } }
  assert.equal(getDriverRenewalLicense(entry, driver).photos.front.storageId, 'late-photo')
  assert.equal(entry.renewedLicense.photos.front, null)
})

test('renewal snapshot uses its own photos and never the previous license photos', () => {
  const entry = { photos: { front: { storageId: 'old' } }, renewedLicense: { classes: ['B'], expiresAt: '2030-01-01', photos: { front: { storageId: 'new' }, back: null } } }
  assert.equal(getDriverRenewalLicense(entry, {}).photos.front.storageId, 'new')
  assert.equal(getDriverRenewalLicense(entry, {}).isPrevious, false)
  assert.equal(entry.photos.front.storageId, 'old')
})

test('legacy renewal resolves documents from the matching current or archived license', () => {
  const entry = { newClasses: ['B'], newExpiresAt: '2030-01-01', photos: { front: { storageId: 'old' } } }
  const driver = { expiresAt: '2030-01-01', photos: { front: { storageId: 'current' } }, history: [entry] }
  assert.equal(getDriverRenewalLicense(entry, driver).photos.front.storageId, 'current')
  driver.expiresAt = '2035-01-01'
  driver.history.push({ expiresAt: '2030-01-01', photos: { front: { storageId: 'archived' } } })
  assert.equal(getDriverRenewalLicense(entry, driver).photos.front.storageId, 'archived')
  driver.history.pop()
  assert.deepEqual(getDriverRenewalLicense(entry, driver).photos, { front: null, back: null })
})

test('old archive-only records remain labeled as previous licenses without inventing renewal data', () => {
  const entry = { classes: ['A4'], expiresAt: '2020-01-01', photos: { front: { storageId: 'previous' } } }
  const result = getDriverRenewalLicense(entry, {})
  assert.equal(result.isPrevious, true)
  assert.equal(result.expiresAt, '2020-01-01')
  assert.equal(result.photos.front.storageId, 'previous')
})

test('legacy photos follow the corrected license identity across repeated corrections and later renewals', () => {
  const entry = { licenseId: 'original', newExpiresAt: '2030-01-01', newClasses: ['B'], photos: { front: { storageId: 'previous' } } }
  const driver = { licenseId: 'renewed', expiresAt: '2030-03-01', classes: ['A4'], photos: { front: { storageId: 'correct-photo' } }, history: [entry], corrections: [
    { licenseId: 'renewed', previous: { expiresAt: '2030-01-01' } },
    { licenseId: 'renewed', previous: { expiresAt: '2030-02-01' } },
  ] }
  assert.equal(getDriverRenewalLicense(entry, driver).photos.front.storageId, 'correct-photo')
  assert.equal(getDriverRenewalLicense(entry, driver).expiresAt, '2030-03-01')
  assert.deepEqual(getDriverRenewalLicense(entry, driver).classes, ['A4'])
  driver.history.push({ licenseId: driver.licenseId, expiresAt: driver.expiresAt, classes: driver.classes, photos: driver.photos })
  driver.licenseId = 'newer'
  driver.photos = { front: { storageId: 'other-photo' } }
  assert.equal(getDriverRenewalLicense(entry, driver).photos.front.storageId, 'correct-photo')
  assert.equal(entry.photos.front.storageId, 'previous')
})

test('ambiguous legacy correction dates never return another license photos', () => {
  const entry = { newExpiresAt: '2030-01-01', newClasses: ['B'] }
  const driver = { licenseId: 'one', photos: { front: { storageId: 'not-proven' } }, corrections: [
    { licenseId: 'one', previous: { expiresAt: '2030-01-01' } },
    { licenseId: 'two', previous: { expiresAt: '2030-01-01' } },
  ] }
  assert.deepEqual(getDriverRenewalLicense(entry, driver).photos, { front: null, back: null })
})
