import test from "node:test"
import assert from "node:assert/strict"
import {
  driverToday,
  licenseState,
  normalizeDriverLicense,
  validLicenseDate,
  licenseExpiryMessage,
  validateDriverRenewal,
  driverManagementStatus,
  validateDriverRenewalDetails,
  lastDriverRenewalDate,
  validateDriverLicenseCorrection,
} from "./driverLicenseUtils.js"

test('corrections respect renewal chronology but allow expired initial licenses', () => {
  assert.doesNotThrow(() => validateDriverLicenseCorrection('2020-01-01', { history: [] }))
  const previous = { history: [{ renewedAt: '2026-11-13T12:00:00Z' }, { renewedAt: '2022-01-01' }] }
  assert.throws(() => validateDriverLicenseCorrection('2026-11-12', previous), /anterior a la ultima renovacion/)
  assert.doesNotThrow(() => validateDriverLicenseCorrection('2026-11-13', previous))
  assert.throws(() => validateDriverLicenseCorrection('2026-02-30', previous))
})

test("renewals allow early renewal but require a later valid expiration", () => {
  const today = "2026-10-22"
  for (const expiresAt of ["2026-10-21", "2026-10-22", "2026-11-21", "2026-11-22", "2027-10-22"])
    assert.doesNotThrow(() => validateDriverRenewal("2028-01-01", { expiresAt }, today))
  assert.throws(
    () => validateDriverRenewal("2027-01-01", { expiresAt: "2028-01-01" }, today),
    /posterior/,
  )
  assert.throws(
    () => validateDriverRenewal("2028-01-01", { expiresAt: "invalid" }, today),
    /posterior/,
  )
})

test("license states use Chile calendar and inclusive thirty-day boundary", () => {
  assert.equal(licenseExpiryMessage("2026-10-19", "2026-10-20"), "Vencio hace 1 dia")
  assert.equal(licenseExpiryMessage("2026-10-25", "2026-10-20"), "Vence en 5 dias")
  assert.equal(licenseExpiryMessage("2026-10-20", "2026-10-20"), "Vence hoy")
  assert.equal(driverToday("2026-10-20T01:00:00Z"), "2026-10-19")
  assert.equal(licenseState("2026-10-19", "2026-10-20").key, "expired")
  assert.equal(licenseState("2026-10-20", "2026-10-20").days, 0)
  assert.equal(licenseState("2026-11-19", "2026-10-20").key, "soon")
  assert.equal(licenseState("2026-11-20", "2026-10-20").key, "valid")
  assert.equal(licenseState("invalid").key, "unknown")
  assert.equal(validLicenseDate("2026-02-30"), false)
})
test("driver validation formats RUT, deduplicates classes and rejects incomplete values", () => {
  const data = {
    name: " Juan Perez ",
    rut: "12345678k",
    phone: " 123 ",
    classes: ["B", "B", "A4"],
    expiresAt: "2027-01-01",
  }
  assert.deepEqual(normalizeDriverLicense(data), {
    name: "Juan Perez",
    rut: "12.345.678-K",
    phone: "123",
    classes: ["B", "A4"],
    expiresAt: "2027-01-01",
    warningDays: 30,
    notifications: { email: { enabled: false, address: '' }, whatsapp: { enabled: false, phone: '' } },
  })
  for (const change of [
    { name: "" },
    { rut: "1" },
    { classes: [] },
    { classes: ["unknown"] },
    { expiresAt: "2026-02-30" },
    { phone: "x".repeat(31) },
    { warningDays: '' }, { warningDays: -1 }, { warningDays: 1.5 }, { warningDays: 3651 },
  ])
    assert.throws(() => normalizeDriverLicense({ ...data, ...change }))
})

test('license advance warning is configurable without changing expiry days', () => {
  assert.equal(licenseState('2026-11-15', '2026-11-01', 7).key, 'valid')
  assert.equal(licenseState('2026-11-15', '2026-11-01', 15).key, 'soon')
  assert.equal(licenseState('2026-11-01', '2026-11-01', 0).key, 'soon')
  assert.equal(licenseState('2026-10-31', '2026-11-01', 0).key, 'expired')
})

test('management status belongs only to the current license and resets on renewal', () => {
  const row = { licenseId: 'new', managements: [{ licenseId: 'old', result: 'processing' }] }
  assert.equal(driverManagementStatus(row).label, 'Sin gestionar')
  row.managements.push({ licenseId: 'new', result: 'appointment', appointmentDate: '2026-11-20' })
  assert.equal(driverManagementStatus(row, '2026-11-12').label, 'Fecha agendada')
  assert.equal(driverManagementStatus(row).appointmentDate, '2026-11-20')
  row.managements.push({ licenseId: 'new', result: 'notified' })
  assert.equal(driverManagementStatus(row).label, 'Avisado')
  assert.equal(driverManagementStatus(row).appointmentDate, '')
})

test('past appointments request an outcome without changing the recorded management or expiry', () => {
  const row = { licenseId: 'license', expiresAt: '2026-11-30', managements: [{ licenseId: 'license', result: 'appointment', appointmentDate: '2026-11-12' }] }
  const before = JSON.stringify(row)
  assert.equal(driverManagementStatus(row, '2026-11-12').needsFollowUp, false)
  const status = driverManagementStatus(row, '2026-11-13')
  assert.equal(status.label, 'Confirmar resultado')
  assert.equal(status.result, 'appointment')
  assert.equal(status.needsFollowUp, true)
  assert.equal(JSON.stringify(row), before)
  row.managements.push({ licenseId: 'license', result: 'processing' })
  assert.equal(driverManagementStatus(row, '2026-11-13').needsFollowUp, false)
})

test('renewal dates cannot precede the last renewal, including unordered or legacy date records', () => {
  const previous = { history: [{ renewedAt: '2026-11-10T12:00:00Z' }, { renewedAt: 'invalid' }, { renewedAt: '2025-01-01' }] }
  assert.equal(lastDriverRenewalDate(previous), '2026-11-10')
  assert.throws(() => validateDriverRenewalDetails({ renewedOn: '2026-11-09' }, '2030-01-01', '2026-11-12', previous), /ultima renovacion/)
  assert.doesNotThrow(() => validateDriverRenewalDetails({ renewedOn: '2026-11-10' }, '2030-01-01', '2026-11-12', previous))
  assert.doesNotThrow(() => validateDriverRenewalDetails({ renewedOn: '2026-11-12' }, '2030-01-01', '2026-11-12', previous))
  assert.equal(lastDriverRenewalDate({ history: [{ renewedAt: '2026-11-12T01:00:00Z' }] }), '2026-11-11')
})
