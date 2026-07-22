import assert from "node:assert/strict"
import test from "node:test"

import { useGeofences } from "./useGeofences.js"

const createMemoryStorage = () => {
  const values = new Map()

  return {
    getItem(key) {
      return values.has(String(key)) ? values.get(String(key)) : null
    },
    setItem(key, value) {
      values.set(String(key), String(value))
    },
    removeItem(key) {
      values.delete(String(key))
    },
  }
}

const createCircle = (index) => ({
  id: `geofence-${index}`,
  name: `Geocerca ${index}`,
  type: "circle",
  center: {
    lat: -33.44 + index * 0.001,
    lng: -70.66 + index * 0.001,
  },
  radius: 100 + index,
})

test("createGeofence stores more than three geofences for the active company", () => {
  const previousWindow = globalThis.window

  globalThis.window = {
    localStorage: createMemoryStorage(),
  }

  try {
    const { geofences, createGeofence } = useGeofences({ companyId: "company-001" })

    for (let index = 1; index <= 4; index += 1) {
      const createdGeofence = createGeofence(createCircle(index))

      assert.equal(createdGeofence?.id, `geofence-${index}`)
    }

    assert.equal(geofences.value.length, 4)
    assert.deepEqual(
      geofences.value.map((geofence) => geofence.id),
      ["geofence-1", "geofence-2", "geofence-3", "geofence-4"],
    )
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
})

test("createGeofence preserves geofence group names", () => {
  const previousWindow = globalThis.window

  globalThis.window = {
    localStorage: createMemoryStorage(),
  }

  try {
    const { geofences, createGeofence, updateGeofence } = useGeofences({ companyId: "company-001" })

    const createdGeofence = createGeofence({
      ...createCircle(1),
      groupName: "PEAJE",
    })

    assert.equal(createdGeofence?.groupName, "PEAJE")
    assert.equal(geofences.value[0]?.groupName, "PEAJE")

    const updatedGeofence = updateGeofence({
      ...createdGeofence,
      groupName: "BODEGA",
    })

    assert.equal(updatedGeofence?.groupName, "BODEGA")
    assert.equal(geofences.value[0]?.groupName, "BODEGA")
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
})
