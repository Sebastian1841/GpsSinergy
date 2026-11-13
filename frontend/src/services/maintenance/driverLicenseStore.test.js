import test from "node:test"
import assert from "node:assert/strict"
import { createDriverLicenseStore } from "./driverLicenseStore.js"
import { currentDriverManagements } from "../../utils/maintenance/driverLicenseUtils.js"

const data = { name: "Juan Perez", rut: "12345678k", classes: ["B"], expiresAt: "2026-11-01" }
const photo = { storageId: "front-image", name: "front.jpg", size: 1000, type: "image/jpeg" }
const setup = () => {
  const memory = new Map()
  let fail = false,
    edit = true,
    view = true,
    counter = 0
  const storage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      if (fail) throw new Error("quota")
      memory.set(key, value)
    },
  }
  const options = {
    storage,
    companyId: "one",
    canView: () => view,
    canEdit: () => edit,
    author: () => "Operador",
    now: () => "2026-10-20T12:00:00Z",
    createId: () => `id-${++counter}`,
  }
  const store = createDriverLicenseStore(options)
  store.load()
  return {
    memory,
    storage,
    store,
    options,
    denyEdit: () => {
      edit = false
    },
    denyView: () => {
      view = false
    },
    fail: () => {
      fail = true
    },
  }
}

test('corrections retain license identity, audit values and do not invent a renewal', () => {
  const { store, options } = setup()
  const original = store.save(data)
  assert.throws(() => store.save({ ...data, expiresAt: '2026-10-21' }, { id: original.id, correction: { reason: ' ' } }), /motivo/)
  const corrected = store.save({ ...data, expiresAt: '2026-10-21', classes: ['A4'] }, { id: original.id, correction: { reason: 'Fecha y clase mal digitadas' } })
  assert.equal(corrected.licenseId, original.licenseId)
  assert.equal(corrected.history.length, 0)
  assert.equal(corrected.corrections[0].previous.expiresAt, original.expiresAt)
  assert.equal(corrected.corrections[0].corrected.expiresAt, '2026-10-21')
  const restored = createDriverLicenseStore(options)
  restored.load()
  assert.equal(restored.records.value[0].corrections[0].reason, 'Fecha y clase mal digitadas')
})

test('unchanged follow-up is rejected, while new observations are preserved', () => {
  const { store } = setup()
  const row = store.save(data)
  store.addManagement(row.id, { result: 'notified' })
  assert.throws(() => store.addManagement(row.id, { result: 'notified' }), /No hay cambios/)
  assert.equal(store.records.value[0].managements.length, 1)
  store.addManagement(row.id, { result: 'notified', observation: 'Segundo contacto confirmado' })
  assert.equal(store.records.value[0].managements.length, 2)
})

test('correction rejects expiration before renewal without altering persisted data', () => {
  const { store, options, memory } = setup()
  const original = store.save(data)
  const renewed = store.save({ ...data, expiresAt: '2030-10-20' }, { id: original.id, renewal: true, renewalDetails: { renewedOn: '2026-10-20' } })
  const snapshot = JSON.stringify([...memory])
  assert.throws(() => store.save({ ...renewed, expiresAt: '2026-10-19' }, { id: original.id, correction: { reason: 'Fecha incorrecta' } }), /anterior a la ultima renovacion/)
  assert.equal(JSON.stringify([...memory]), snapshot)
  assert.equal(store.records.value[0].expiresAt, renewed.expiresAt)
  const corrected = store.save({ ...renewed, expiresAt: '2026-10-20' }, { id: original.id, correction: { reason: 'Fecha correcta' } })
  assert.equal(corrected.licenseId, renewed.licenseId)
  assert.equal(corrected.history.length, 1)
  const restored = createDriverLicenseStore(options)
  restored.load()
  assert.equal(restored.records.value[0].expiresAt, '2026-10-20')
})

test('class corrections require an audit reason, but reordered classes do not', () => {
  const { store } = setup()
  const original = store.save({ ...data, classes: ['B', 'A4'] })
  assert.throws(() => store.save({ ...original, classes: ['A5'] }, { id: original.id }), /motivo de correccion/)
  const unchanged = store.save({ ...original, classes: ['A4', 'B'] }, { id: original.id })
  assert.equal(unchanged.corrections.length, 0)
  const corrected = store.save({ ...original, classes: ['A5'] }, { id: original.id, correction: { reason: 'Clase digitada incorrectamente' } })
  assert.equal(corrected.licenseId, original.licenseId)
  assert.deepEqual(corrected.corrections[0].previous.classes, ['A4', 'B'])
  assert.deepEqual(corrected.corrections[0].corrected.classes, ['A5'])
})

test("renewal modal details and receipt survive reload alongside the previous license", () => {
  const { store, options } = setup()
  const original = store.save(data, { photos: { front: photo } })
  const receipt = { storageId: 'renewal-receipt', name: 'licencia.pdf', type: 'application/pdf', size: 100 }
  store.save({ ...data, expiresAt: '2030-10-20', classes: ['B', 'A4'] }, {
    id: original.id, renewal: true,
    renewalDetails: { renewedOn: '2026-10-19', notes: ' Renovada en Transito ', receipt },
  })
  const restored = createDriverLicenseStore(options)
  restored.load()
  const entry = restored.records.value[0].history[0]
  assert.equal(entry.renewedAt, '2026-10-19T12:00:00Z')
  assert.equal(entry.registeredAt, '2026-10-20T12:00:00Z')
  assert.equal(entry.newExpiresAt, '2030-10-20')
  assert.deepEqual(entry.newClasses, ['B', 'A4'])
  assert.equal(entry.notes, 'Renovada en Transito')
  assert.deepEqual(entry.receipt, receipt)
  assert.deepEqual(entry.photos.front, photo)
})

test("invalid renewal date or receipt cannot modify driver records", () => {
  const { store } = setup()
  const original = store.save(data)
  const before = store.records.value
  for (const renewalDetails of [
    { renewedOn: '2026-10-21' },
    { renewedOn: '2026-02-30' },
    { receipt: { storageId: 'bad', size: 100, type: 'text/html' } },
    { receipt: { storageId: 'large', size: 6 * 1024 * 1024, type: 'application/pdf' } },
    { notes: 'x'.repeat(1001) },
  ]) {
    assert.throws(() => store.save({ ...data, expiresAt: '2030-10-20' }, { id: original.id, renewal: true, renewalDetails }))
    assert.equal(store.records.value, before)
  }
})

test("renewal replaces front and back photos while archiving both previous photos", () => {
  const { store } = setup()
  const oldBack = { ...photo, storageId: 'old-back' }
  const original = store.save(data, { photos: { front: photo, back: oldBack } })
  const front = { ...photo, storageId: 'new-front' }
  const back = { ...photo, storageId: 'new-back' }
  const updated = store.save({ ...data, expiresAt: '2030-10-20' }, { id: original.id, renewal: true, photos: { front, back } })
  assert.deepEqual(updated.photos, { front, back })
  assert.deepEqual(updated.history[0].photos, { front: photo, back: oldBack })
  assert.deepEqual(original.photos, { front: photo, back: oldBack })
})

test("successive renewals keep each new license snapshot and never reuse old photos when none are supplied", () => {
  const { store, options } = setup()
  const original = store.save(data, { photos: { front: photo } })
  const firstPhoto = { ...photo, storageId: 'first-renewal-photo' }
  store.save({ ...data, expiresAt: '2030-10-20' }, { id: original.id, renewal: true, photos: { front: firstPhoto } })
  store.save({ ...data, expiresAt: '2035-10-20' }, { id: original.id, renewal: true })
  const restored = createDriverLicenseStore(options)
  restored.load()
  const row = restored.records.value[0]
  assert.equal(row.history[0].renewedLicense.photos.front.storageId, 'first-renewal-photo')
  assert.equal(row.history[0].photos.front.storageId, photo.storageId)
  assert.equal(row.history[1].photos.front.storageId, 'first-renewal-photo')
  assert.deepEqual(row.history[1].renewedLicense.photos, { front: null, back: null })
  assert.deepEqual(row.photos, { front: null, back: null })
})

test('advance notice survives edits and reload without manufacturing renewals', () => {
  const { store, options } = setup()
  const original = store.save({ ...data, warningDays: 15 })
  store.save({ ...original, warningDays: 7 }, { id: original.id })
  const restored = createDriverLicenseStore(options)
  restored.load()
  assert.equal(restored.records.value[0].warningDays, 7)
  assert.equal(restored.records.value[0].history.length, 0)
  assert.equal(restored.records.value[0].licenseId, original.licenseId)
})

test('notification settings persist through reload and edits without recipients being sent', () => {
  const { store, options } = setup()
  const notifications = { email: { enabled: true, address: 'correo@empresa.cl' }, whatsapp: { enabled: true, phone: '+56912345678' } }
  const original = store.save({ ...data, notifications, warningDays: 15 })
  store.save({ ...data, name: 'Nombre actualizado' }, { id: original.id })
  const restored = createDriverLicenseStore(options)
  restored.load()
  assert.deepEqual(restored.records.value[0].notifications, notifications)
  assert.equal(restored.records.value[0].warningDays, 15)
  const before = store.records.value
  assert.throws(() => store.save({ ...data, notifications: { email: { enabled: true, address: '' } } }, { id: original.id }), /correo valido/)
  assert.equal(store.records.value, before)
})

test('store rejects renewal before latest registered renewal and preserves the original history', () => {
  const { store } = setup()
  const original = store.save(data)
  store.save({ ...data, expiresAt: '2030-10-20' }, { id: original.id, renewal: true, renewalDetails: { renewedOn: '2026-10-19' } })
  const before = store.records.value
  assert.throws(() => store.save({ ...data, expiresAt: '2035-10-20' }, { id: original.id, renewal: true, renewalDetails: { renewedOn: '2026-10-18' } }), /ultima renovacion/)
  assert.equal(store.records.value, before)
  assert.equal(store.records.value[0].history.length, 1)
  store.save({ ...data, expiresAt: '2035-10-20' }, { id: original.id, renewal: true, renewalDetails: { renewedOn: '2026-10-20' } })
  assert.equal(store.records.value[0].history.length, 2)
})
test("management records capture contact results but never renew or modify the license", () => {
  const { store, options } = setup()
  const original = store.save(data, { photos: { front: photo } })
  for (const result of ["not_contacted", "notified", "appointment", "processing"])
    store.addManagement(original.id, {
      result,
      appointmentDate: "2026-10-30",
      observation: " Se contacto al conductor ",
    })
  const row = store.records.value[0]
  assert.equal(row.expiresAt, original.expiresAt)
  assert.deepEqual(row.classes, original.classes)
  assert.deepEqual(row.photos, original.photos)
  assert.deepEqual(row.history, [])
  assert.equal(row.managements.length, 4)
  assert.equal(row.managements[0].appointmentDate, "")
  assert.equal(row.managements[2].appointmentDate, "2026-10-30")
  assert.equal(row.managements[3].author, "Operador")
  assert.equal(row.managements[3].observation, "Se contacto al conductor")
  const restored = createDriverLicenseStore(options)
  restored.load()
  assert.equal(restored.records.value[0].managements.length, 4)
  const renewed = store.save(
    { ...data, expiresAt: "2028-01-01" },
    { id: original.id, renewal: true },
  )
  assert.deepEqual(currentDriverManagements(renewed), [])
  assert.equal(renewed.managements.length, 4)
  assert.equal(renewed.history[0].licenseId, row.licenseId)
  store.addManagement(original.id, { result: "notified" })
  assert.equal(currentDriverManagements(store.records.value[0]).length, 1)
})

test("invalid appointments, access and failed management persistence preserve the old state", () => {
  const { store, fail, denyEdit } = setup()
  const original = store.save(data),
    before = store.records.value
  for (const change of [
    { result: "invalid" },
    { result: "appointment" },
    { result: "appointment", appointmentDate: "2026-02-30" },
    { result: "appointment", appointmentDate: "2026-10-19" },
    { result: "processing", observation: "x".repeat(501) },
  ])
    assert.throws(() => store.addManagement(original.id, change))
  assert.throws(() => store.addManagement("missing", { result: "notified" }))
  assert.equal(store.records.value, before)
  fail()
  assert.throws(() => store.addManagement(original.id, { result: "notified" }))
  assert.equal(store.records.value, before)
  denyEdit()
  assert.throws(() => store.addManagement(original.id, { result: "notified" }), /permiso/)
})

test("driver persistence is scoped to company and renewal retains original photos and dates", () => {
  const { store, options } = setup()
  const original = store.save(data, { photos: { front: photo } })
  const renewed = store.save(
    { ...data, classes: ["B", "A4"], expiresAt: "2028-01-01" },
    { id: original.id, renewal: true },
  )
  assert.equal(renewed.history.length, 1)
  assert.equal(renewed.history[0].expiresAt, original.expiresAt)
  assert.equal(renewed.history[0].photos.front.storageId, photo.storageId)
  assert.equal(renewed.history[0].renewedBy, "Operador")
  assert.equal(renewed.photos.front, null)
  assert.deepEqual(original.history, [])
  const restored = createDriverLicenseStore(options)
  restored.load()
  assert.deepEqual(restored.records.value, store.records.value)
  const other = createDriverLicenseStore({ ...options, companyId: "two" })
  other.load()
  assert.deepEqual(other.records.value, [])
  other.save(data)
  assert.equal(other.records.value[0].companyId, "two")
})
test("invalid and duplicate drivers and non-advancing renewals never change saved data", () => {
  const { store } = setup()
  const original = store.save(data)
  const before = store.records.value
  assert.throws(() => store.save(data), /existe/)
  assert.throws(() => store.save(data, { id: "missing" }), /disponible/)
  assert.throws(() => store.save(data, { id: original.id, renewal: true }), /posterior/)
  assert.throws(
    () => store.save({ ...data, expiresAt: "2025-01-01" }, { id: original.id, renewal: true }),
    /posterior/,
  )
  assert.throws(
    () => store.save(data, { id: original.id, photos: { front: { ...photo, type: "text/html" } } }),
    /foto/,
  )
  assert.equal(store.records.value, before)
})
test("edits preserve current license photos without manufacturing renewal history", () => {
  const { store } = setup()
  const original = store.save(data, { photos: { front: photo } })
  const edited = store.save({ ...data, name: "Nombre corregido" }, { id: original.id })
  assert.equal(edited.photos.front.storageId, photo.storageId)
  assert.deepEqual(edited.history, [])
  assert.throws(
    () => store.save({ ...data, expiresAt: "2029-01-01" }, { id: original.id }),
    /Renovar licencia/,
  )
  assert.equal(store.records.value[0].expiresAt, original.expiresAt)
  const current = store.records.value
  store.load()
  assert.equal(store.records.value, current)
})

test("early renewal is allowed and preserves the previous valid license", () => {
  const { store, memory } = setup()
  const original = store.save({ ...data, expiresAt: "2027-10-20" }, { photos: { front: photo } })
  const updated = store.save({ ...original, expiresAt: "2029-10-20" }, { id: original.id, renewal: true })
  assert.equal(updated.expiresAt, '2029-10-20')
  assert.equal(updated.history[0].expiresAt, original.expiresAt)
  assert.deepEqual(updated.history[0].photos, original.photos)
  assert.equal(updated.history[0].renewedLicense.expiresAt, '2029-10-20')
  assert.equal(updated.history[0].renewedLicense.licenseId, updated.licenseId)
  assert.equal(JSON.parse(memory.get("sinergy-driver-licenses-v1:one"))[0].expiresAt, '2029-10-20')
  assert.equal(original.history.length, 0)
})
test("failed writes and access denials keep the prior records intact", () => {
  const { store, denyEdit, fail, denyView } = setup()
  const original = store.save(data),
    before = store.records.value
  fail()
  assert.throws(
    () => store.save({ ...data, name: "No guardado" }, { id: original.id }),
    /guardaron/,
  )
  assert.equal(store.records.value, before)
  denyEdit()
  assert.throws(() => store.save(data), /permiso/)
  denyView()
  assert.throws(() => store.load(), /permiso/)
})
test("unreadable storage is protected from overwrite and concurrent tabs cannot silently overwrite each other", () => {
  const { store, options, memory } = setup()
  const stale = createDriverLicenseStore(options)
  stale.load()
  store.save(data)
  assert.throws(() => stale.save({ ...data, rut: "987654321" }), /otra pestana/)
  memory.set("sinergy-driver-licenses-v1:one", "corrupted")
  const corrupt = createDriverLicenseStore(options)
  assert.throws(() => corrupt.load(), /leer/)
  assert.throws(() => corrupt.save(data), /disponible/)
  assert.equal(memory.get("sinergy-driver-licenses-v1:one"), "corrupted")
})

test("create, correction and renewal survive fresh stores and a failed later write", () => {
  const { store, options, memory, fail } = setup()
  const created = store.save(data, {
    photos: { front: photo, back: { ...photo, storageId: "back-image" } },
  })
  const reopen = () => {
    const instance = createDriverLicenseStore(options)
    instance.load()
    return instance
  }
  const editing = reopen()
  const corrected = editing.save(
    { ...data, name: "Corregido", phone: "+56 9 1234 5678" },
    { id: created.id },
  )
  assert.deepEqual(corrected.photos, created.photos)
  assert.equal(corrected.history.length, 0)
  const renewing = reopen()
  const renewed = renewing.save(
    { ...corrected, expiresAt: "2028-02-01", classes: ["B", "A4"] },
    {
      id: created.id,
      renewal: true,
      photos: { front: { ...photo, storageId: "new-front" } },
    },
  )
  const loaded = reopen().records.value[0]
  assert.deepEqual(loaded, renewed)
  assert.equal(loaded.name, "Corregido")
  assert.deepEqual(loaded.history[0].photos, created.photos)
  assert.equal(loaded.history[0].expiresAt, created.expiresAt)
  assert.equal(loaded.photos.front.storageId, "new-front")
  assert.equal(loaded.photos.back, null)
  const snapshot = memory.get("sinergy-driver-licenses-v1:one")
  fail()
  assert.throws(
    () => renewing.save({ ...loaded, name: "No debe guardarse" }, { id: loaded.id }),
    /guardaron/,
  )
  assert.equal(memory.get("sinergy-driver-licenses-v1:one"), snapshot)
  assert.deepEqual(reopen().records.value[0], loaded)
})
