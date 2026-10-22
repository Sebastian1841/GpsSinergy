import test from "node:test"
import assert from "node:assert/strict"
import { createDriverLicenseStore } from "./driverLicenseStore.js"
import { seedDriverLicenseDemo } from "./driverLicenseDemo.js"
import { licenseState } from "../../utils/maintenance/driverLicenseUtils.js"

test("demo drivers preserve existing records, cover states and are not duplicated", async () => {
  const data = new Map()
  let id = 0
  const store = createDriverLicenseStore({
    storage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    },
    companyId: "test",
    canView: () => true,
    canEdit: () => true,
    createId: () => String(++id),
    now: () => "2026-10-21T12:00:00Z",
  })
  store.load()
  const original = store.save({
    name: "Original",
    rut: "123456789",
    classes: ["B"],
    expiresAt: "2027-01-01",
  })
  await seedDriverLicenseDemo(store, "2026-10-21")
  await seedDriverLicenseDemo(store, "2026-10-21")
  assert.equal(store.records.value.length, 16)
  assert.equal(store.records.value[0], original)
  const examples = store.records.value.slice(1)
  assert.ok(examples.every((row) => row.history.length === 2))
  assert.ok(
    examples.every(
      (row) =>
        row.history[0].expiresAt < row.history[1].expiresAt &&
        row.history[1].expiresAt < row.expiresAt,
    ),
  )
  assert.ok(
    examples.every((row) =>
      row.history.every((entry) => entry.renewedBy === "Datos de demostracion"),
    ),
  )
  const beforeReload = JSON.stringify(store.records.value)
  store.load()
  assert.equal(JSON.stringify(store.records.value), beforeReload)
  const demo = store.records.value.find((row) => row.rut === "90.000.015-K")
  const entry = demo.history.at(-1)
  const image = { storageId: "demo-front", name: "demo.png", type: "image/png", size: 100 }
  store.addDemoHistoryPhotos(demo.id, entry.id, { front: image })
  const updated = store.records.value.find((row) => row.id === demo.id)
  assert.equal(updated.expiresAt, demo.expiresAt)
  assert.deepEqual(updated.photos, demo.photos)
  assert.equal(updated.history.at(-1).photos.front.storageId, "demo-front")
  store.addDemoHistoryPhotos(demo.id, entry.id, { front: { ...image, storageId: "replacement" } })
  assert.equal(
    store.records.value.find((row) => row.id === demo.id).history.at(-1).photos.front.storageId,
    "demo-front",
  )
  assert.throws(
    () => store.addDemoHistoryPhotos(original.id, entry.id, { front: image }),
    /demostracion/,
  )
  assert.deepEqual(
    new Set(store.records.value.map((row) => licenseState(row.expiresAt, "2026-10-21").key)),
    new Set(["valid", "soon", "expired"]),
  )
  assert.ok(
    store.records.value.some((row) =>
      row.managements.some((entry) => entry.result === "appointment"),
    ),
  )
})
