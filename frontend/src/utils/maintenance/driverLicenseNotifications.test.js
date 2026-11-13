import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeDriverLicenseNotifications } from './driverLicenseNotifications.js'

test('notification channels default off and preserve validated recipients without sending', () => {
  assert.deepEqual(normalizeDriverLicenseNotifications(), { email: { enabled: false, address: '' }, whatsapp: { enabled: false, phone: '' } })
  const input = { email: { enabled: true, address: ' correo@empresa.cl ' }, whatsapp: { enabled: true, phone: '+56 9 1234 5678' } }
  const before = JSON.stringify(input)
  assert.deepEqual(normalizeDriverLicenseNotifications(input), { email: { enabled: true, address: 'correo@empresa.cl' }, whatsapp: { enabled: true, phone: '+56912345678' } })
  assert.equal(JSON.stringify(input), before)
})

test('enabled channels require recipients and disabled channels do not become enabled accidentally', () => {
  for (const address of ['', 'invalid', 'a@b', 'a b@empresa.cl']) assert.throws(() => normalizeDriverLicenseNotifications({ email: { enabled: true, address } }), /correo valido/)
  for (const phone of ['', '912345678', '+000000000', '+123']) assert.throws(() => normalizeDriverLicenseNotifications({ whatsapp: { enabled: true, phone } }), /codigo de pais/)
  assert.equal(normalizeDriverLicenseNotifications({ email: { enabled: 'false', address: '' } }).email.enabled, false)
})
