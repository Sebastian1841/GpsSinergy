import { createDriverLicenseStore } from "../src/services/maintenance/driverLicenseStore.js"
import { createDriverLicenseRepository } from "../src/services/maintenance/driverLicenseRepository.js"

export async function auditDriverPersistence() {
  const companyId = `persistence-audit-${crypto.randomUUID()}`
  const key = `sinergy-driver-licenses-v1:${companyId}`
  const originals = Array.from({ length: 1000 }, (_, index) => ({
    id: `driver-${index}`,
    companyId,
    name: `Conductor ${index}`,
    rut: `${10000000 + index}-K`,
    classes: ["B"],
    expiresAt: "2026-11-01",
    phone: "",
    licenseId: `license-${index}`,
    photos: {},
    managements: [],
    createdAt: "2026-01-01T12:00:00Z",
    history: Array.from({ length: 10 }, (_, age) => ({
      id: `old-${index}-${age}`,
      classes: ["B"],
      expiresAt: "2023-01-01",
      renewedAt: "2023-01-01T12:00:00Z",
      renewedBy: "Cliente",
      photos: {},
    })),
  }))
  const legacy = JSON.stringify(originals)
  localStorage.setItem(key, legacy)
  const create = (id = companyId, storage = localStorage) =>
    createDriverLicenseStore({
      repository: createDriverLicenseRepository({ companyId: id, legacyStorage: storage }),
      companyId: id,
      canView: () => true,
      canEdit: () => true,
      now: () => "2026-10-22T12:00:00Z",
    })
  const check = (value, message) => {
    if (!value) throw new Error(message)
  }
  const store = create()
  await store.load()
  check(store.records.value.length === 1000, "Migration lost drivers")
  check(
    store.records.value.every((row) => row.history.length === 10),
    "Migration lost histories",
  )
  check(localStorage.getItem(key) === legacy, "Legacy data was modified")
  const stale = create()
  await stale.load()
  const originalPut = IDBObjectStore.prototype.put
  let recordWrites = 0,
    collectionSerializations = 0
  const stringify = JSON.stringify
  const started = performance.now()
  try {
    IDBObjectStore.prototype.put = function (value, ...args) {
      if (this.name === "drivers") recordWrites++
      return originalPut.call(this, value, ...args)
    }
    JSON.stringify = function (value, ...args) {
      if (Array.isArray(value) && value.length >= 1000) collectionSerializations++
      return stringify.call(this, value, ...args)
    }
    const row = store.records.value.find((row) => row.id === "driver-0")
    await store.save({ ...row, name: "Corregido" }, { id: row.id })
  } finally {
    IDBObjectStore.prototype.put = originalPut
    JSON.stringify = stringify
  }
  const editMs = +(performance.now() - started).toFixed(2)
  check(recordWrites === 1 && collectionSerializations === 0, "An edit rewrote the collection")
  const staleBefore = stale.records.value
  let staleRejected = false
  try {
    const row = stale.records.value[0]
    await stale.save({ ...row, name: "Cambio antiguo" }, { id: row.id })
  } catch (error) {
    staleRejected = error.message.includes("otra pestana")
  }
  check(staleRejected && stale.records.value === staleBefore, "Stale write was not rejected")
  const restore = create(companyId, {
    getItem: () => {
      throw new Error("Legacy must not be read after migration")
    },
  })
  await restore.load()
  check(
    restore.records.value.find((row) => row.id === "driver-0").name === "Corregido",
    "Reopen lost the edit",
  )
  const before = restore.records.value
  let failed = false
  try {
    IDBObjectStore.prototype.put = function (value, ...args) {
      if (this.name === "drivers") throw new DOMException("Forced failure", "QuotaExceededError")
      return originalPut.call(this, value, ...args)
    }
    const row = before[0]
    try {
      await restore.save({ ...row, name: "No guardar" }, { id: row.id })
    } catch {
      failed = true
    }
  } finally {
    IDBObjectStore.prototype.put = originalPut
  }
  check(failed && restore.records.value === before, "Failed write changed the in-memory state")
  const disk = create()
  await disk.load()
  check(
    disk.records.value.find((row) => row.id === "driver-0").name === "Corregido",
    "Transaction failure changed stored data",
  )
  const emptyCompany = create(`${companyId}-other`)
  await emptyCompany.load()
  check(emptyCompany.records.value.length === 0, "Company isolation failed")
  const invalidCompany = `${companyId}-invalid`
  const invalidKey = `sinergy-driver-licenses-v1:${invalidCompany}`
  localStorage.setItem(invalidKey, "corrupted")
  const invalid = create(invalidCompany)
  let corruptRejected = false
  try {
    await invalid.load()
  } catch {
    corruptRejected = true
  }
  check(
    corruptRejected && localStorage.getItem(invalidKey) === "corrupted",
    "Corrupted legacy data was overwritten",
  )
  const repaired = { ...originals[0], companyId: invalidCompany }
  localStorage.setItem(invalidKey, JSON.stringify([repaired]))
  await invalid.load()
  check(invalid.records.value.length === 1, "Failed migration left a partial migration marker")
  const unchanged = store.records.value.find((row) => row.id === "driver-1")
  check(
    unchanged.name === originals[1].name && unchanged.history.length === 10,
    "Unchanged driver was modified",
  )
  return {
    drivers: 1000,
    historiesPerDriver: 10,
    recordWrites,
    collectionSerializations,
    editMs,
    migratedWithoutLoss: true,
    legacyPreserved: true,
    staleRejected,
    failedWriteRolledBack: true,
    reopenedFromIndexedDB: true,
    companyIsolation: true,
    corruptMigrationPreserved: true,
  }
}
