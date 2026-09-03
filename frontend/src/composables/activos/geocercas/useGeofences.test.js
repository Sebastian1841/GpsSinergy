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

test("createGeofenceGroup stores empty groups for the active company", () => {
  const previousWindow = globalThis.window

  globalThis.window = {
    localStorage: createMemoryStorage(),
  }

  try {
    const { geofenceGroups, createGeofenceGroup } = useGeofences({ companyId: "company-001" })

    const createdGroup = createGeofenceGroup("Zonas norte")

    assert.equal(createdGroup?.name, "Zonas norte")
    assert.equal(geofenceGroups.value.length, 1)
    assert.equal(geofenceGroups.value[0]?.count, 0)
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
})

test("deleteGeofenceGroup keeps geofences and clears their group", () => {
  const previousWindow = globalThis.window

  globalThis.window = {
    localStorage: createMemoryStorage(),
  }

  try {
    const { geofences, geofenceGroups, createGeofence, createGeofenceGroup, deleteGeofenceGroup } =
      useGeofences({ companyId: "company-001" })

    const createdGroup = createGeofenceGroup("Bodegas")
    const createdGeofence = createGeofence({
      ...createCircle(1),
      groupName: "Bodegas",
    })

    assert.equal(createdGeofence?.groupName, "Bodegas")
    assert.equal(geofenceGroups.value[0]?.count, 1)

    const deleted = deleteGeofenceGroup(createdGroup.id)

    assert.equal(deleted, true)
    assert.equal(geofences.value.length, 1)
    assert.equal(geofences.value[0]?.groupName, "")
    assert.equal(geofenceGroups.value.length, 0)
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
})

test("renameGeofenceGroup updates grouped geofences", () => {
  const previousWindow = globalThis.window

  globalThis.window = {
    localStorage: createMemoryStorage(),
  }

  try {
    const { geofences, geofenceGroups, createGeofence, createGeofenceGroup, renameGeofenceGroup } =
      useGeofences({ companyId: "company-001" })

    const createdGroup = createGeofenceGroup("Bodegas")

    createGeofence({
      ...createCircle(1),
      groupName: "Bodegas",
    })

    const renamedGroup = renameGeofenceGroup({
      groupIdOrName: createdGroup.id,
      name: "Bodegas norte",
    })

    assert.equal(renamedGroup?.name, "Bodegas norte")
    assert.equal(geofences.value[0]?.groupName, "Bodegas norte")
    assert.deepEqual(
      geofenceGroups.value.map((group) => group.name),
      ["Bodegas norte"],
    )
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
})

test("importGeofences adds imported geofences to the active company", () => {
  const previousWindow = globalThis.window

  globalThis.window = {
    localStorage: createMemoryStorage(),
  }

  try {
    const { geofences, importGeofences } = useGeofences({ companyId: "company-001" })
    const importedGeofences = importGeofences([
      {
        id: "imported-zone",
        name: "Zona importada",
        type: "polygon",
        coordinates: [
          {
            lat: -33.44,
            lng: -70.66,
          },
          {
            lat: -33.45,
            lng: -70.66,
          },
          {
            lat: -33.45,
            lng: -70.65,
          },
        ],
      },
    ])

    assert.equal(importedGeofences.length, 1)
    assert.equal(geofences.value.length, 1)
    assert.equal(geofences.value[0]?.companyId, "company-001")
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
})
