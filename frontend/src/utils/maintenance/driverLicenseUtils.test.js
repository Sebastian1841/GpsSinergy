import test from "node:test"
import assert from "node:assert/strict"
import {
  driverToday,
  licenseState,
  normalizeDriverLicense,
  validLicenseDate,
  licenseExpiryMessage,
  validateDriverRenewal,
} from "./driverLicenseUtils.js"

test("renewals require an expired license or one expiring within thirty days", () => {
  const today = "2026-10-22"
  for (const expiresAt of ["2026-10-21", "2026-10-22", "2026-11-21"])
    assert.doesNotThrow(() => validateDriverRenewal("2028-01-01", { expiresAt }, today))
  assert.throws(
    () => validateDriverRenewal("2028-01-01", { expiresAt: "2026-11-22" }, today),
    /por vencer o vencidas/,
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
  })
  for (const change of [
    { name: "" },
    { rut: "1" },
    { classes: [] },
    { classes: ["unknown"] },
    { expiresAt: "2026-02-30" },
    { phone: "x".repeat(31) },
  ])
    assert.throws(() => normalizeDriverLicense({ ...data, ...change }))
})
