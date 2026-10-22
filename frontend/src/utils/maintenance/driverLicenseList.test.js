import test from "node:test"
import assert from "node:assert/strict"
import {
  buildDriverLicenseList,
  filterDriverLicenseList,
  sortDriverLicenseList,
} from "./driverLicenseList.js"

test("driver column sorting preserves default expiry order and supports all header keys", () => {
  const rows = buildDriverLicenseList(
    [
      {
        id: "a",
        name: "Ana",
        rut: "11111111-1",
        classes: ["B"],
        expiresAt: "2026-01-01",
        licenseId: "one",
        managements: [{ licenseId: "one", result: "notified", createdAt: "2026-10-01T12:00:00Z" }],
      },
      {
        id: "b",
        name: "Beto",
        rut: "22222222-2",
        classes: ["A4"],
        expiresAt: "2028-01-01",
        managements: [],
      },
    ],
    "2026-10-21",
  ).rows
  assert.equal(sortDriverLicenseList(rows), rows)
  assert.equal(sortDriverLicenseList(rows, "name", "desc")[0].id, "b")
  assert.equal(sortDriverLicenseList(rows, "classes", "asc")[0].id, "b")
  assert.equal(sortDriverLicenseList(rows, "status", "desc")[0].id, "b")
  assert.equal(sortDriverLicenseList(rows, "expiry", "desc")[0].id, "b")
  assert.equal(rows[0].id, "a")
})

test("driver index preserves expiry priority, status totals and normalized search", () => {
  const records = [
    {
      id: "valid",
      name: "Jose Perez",
      rut: "12.345.678-K",
      classes: ["B"],
      expiresAt: "2028-01-01",
    },
    {
      id: "expired",
      name: "Ana Soto",
      rut: "11.222.333-4",
      classes: ["A4"],
      expiresAt: "2026-01-01",
    },
    {
      id: "soon",
      name: "Juan Rojas",
      rut: "22.333.444-5",
      classes: ["B"],
      expiresAt: "2026-10-30",
    },
  ]
  const { rows, counts } = buildDriverLicenseList(records, "2026-10-20")
  assert.deepEqual(
    rows.map((row) => row.id),
    ["expired", "soon", "valid"],
  )
  assert.deepEqual(counts, { all: 3, expired: 1, soon: 1, valid: 1, unknown: 0 })
  assert.equal(filterDriverLicenseList(rows, "José")[0].id, "valid")
  assert.equal(filterDriverLicenseList(rows, "12345678k")[0].id, "valid")
  assert.equal(filterDriverLicenseList(rows, "", "soon", "B")[0].id, "soon")
  assert.equal(filterDriverLicenseList(rows, "", "soon", "A4").length, 0)
  assert.equal(records[0].id, "valid")
})
test("building and filtering the list preserve evidence without scanning legacy activity", () => {
  const unreadableHistory = () => new Proxy([], {
    get() {
      assert.fail("The list must not scan contact or renewal history")
    },
  })
  const managements = unreadableHistory()
  const history = unreadableHistory()
  const photos = { front: { id: "front" }, back: { id: "back" } }
  const row = {
    name: "Juan Perez",
    rut: "12.345.678-K",
    classes: ["B"],
    expiresAt: "2027-01-01",
    licenseId: "new",
    managements,
    history,
    photos,
  }
  const index = buildDriverLicenseList([row], "2026-10-20")
  for (let i = 0; i < 20; i++) assert.equal(filterDriverLicenseList(index.rows, "juan").length, 1)
  for (const key of ["name", "classes", "expiry", "status"]) {
    assert.equal(sortDriverLicenseList(index.rows, key, "desc")[0].rut, row.rut)
  }
  assert.equal(index.rows[0].managements, managements)
  assert.equal(index.rows[0].history, history)
  assert.equal(index.rows[0].photos, photos)
  for (const key of ["lastManagement", "managementLabel", "activityAt", "activityDateLabel"]) {
    assert.equal(Object.hasOwn(index.rows[0], key), false)
    assert.equal(Object.hasOwn(row, key), false)
  }
})
