import assert from "node:assert/strict"
import test from "node:test"
import { nextTick, ref } from "vue"

import {
  resetScopedAssetGroupFilterForTest,
  useScopedAssetGroupFilter,
} from "./useScopedAssetGroupFilter.js"

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

const withStorageWindow = async (callback) => {
  const previousWindow = globalThis.window
  let timerId = 0

  globalThis.window = {
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
    setTimeout(callback) {
      callback()

      timerId += 1
      return timerId
    },
    clearTimeout() {},
  }

  resetScopedAssetGroupFilterForTest()

  try {
    await callback(globalThis.window)
  } finally {
    resetScopedAssetGroupFilterForTest()

    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
}

test("scoped asset group filter only keeps assets that are available to the user", async () => {
  await withStorageWindow(async () => {
    const availableActivos = ref([{ id: "asset-1" }, { id: "asset-3" }])
    const groups = ref([
      {
        id: "north",
        name: "Norte",
        assetIds: ["asset-1", "asset-2"],
      },
      {
        id: "south",
        name: "Sur",
        assetIds: ["asset-2"],
      },
      {
        id: "",
        name: "Sin id",
        assetIds: ["asset-1"],
      },
    ])
    const { assetGroups, selectAssetGroup, selectedAssetGroupId, filterActivosBySelectedGroup } =
      useScopedAssetGroupFilter({
        userId: ref("user-1"),
        contextId: ref("company-1"),
        availableActivos,
        groups,
        storageKey: "test-scoped-city-filter",
        keepEmptyGroups: false,
      })

    assert.deepEqual(
      assetGroups.value.map((group) => ({
        id: group.id,
        assetIds: group.assetIds,
      })),
      [
        {
          id: "north",
          assetIds: ["asset-1"],
        },
      ],
    )

    selectAssetGroup("north")

    assert.equal(selectedAssetGroupId.value, "north")
    assert.deepEqual(filterActivosBySelectedGroup(availableActivos.value), [{ id: "asset-1" }])

    availableActivos.value = [{ id: "asset-3" }]
    await nextTick()

    assert.equal(selectedAssetGroupId.value, null)
    assert.deepEqual(assetGroups.value, [])
  })
})

test("scoped asset group filter can preserve empty vehicle groups", async () => {
  await withStorageWindow(async () => {
    const { assetGroups, selectAssetGroup, selectedAssetGroup, filterActivosBySelectedGroup } =
      useScopedAssetGroupFilter({
        userId: ref("user-1"),
        contextId: ref("fleet-1"),
        availableActivos: ref([{ id: "asset-1" }]),
        groups: ref([
          {
            id: "empty",
            name: "Sin vehiculos",
            assetIds: ["asset-2"],
          },
        ]),
        storageKey: "test-scoped-vehicle-group-filter",
        keepEmptyGroups: true,
      })

    assert.equal(assetGroups.value.length, 1)
    assert.deepEqual(assetGroups.value[0].assetIds, [])

    selectAssetGroup("empty")

    assert.equal(selectedAssetGroup.value?.id, "empty")
    assert.deepEqual(filterActivosBySelectedGroup([{ id: "asset-1" }]), [])
  })
})

test("scoped asset group filter persists selections by user and context", async () => {
  await withStorageWindow(async (storageWindow) => {
    const storageKey = "test-scoped-persisted-filter"
    const commonOptions = {
      availableActivos: ref([{ id: "asset-1" }]),
      groups: ref([
        {
          id: "north",
          name: "Norte",
          assetIds: ["asset-1"],
        },
      ]),
      storageKey,
      keepEmptyGroups: false,
    }
    const firstScope = useScopedAssetGroupFilter({
      ...commonOptions,
      userId: ref("user-1"),
      contextId: ref("company-1"),
    })
    const secondScope = useScopedAssetGroupFilter({
      ...commonOptions,
      userId: ref("user-1"),
      contextId: ref("company-2"),
    })

    firstScope.selectAssetGroup("north")

    const storedSelections = JSON.parse(storageWindow.localStorage.getItem(storageKey))

    assert.deepEqual(storedSelections, {
      "user-1::company-1": "north",
    })
    assert.equal(firstScope.selectedAssetGroupId.value, "north")
    assert.equal(secondScope.selectedAssetGroupId.value, null)
  })
})

test("scoped asset group filter migrates legacy storage when the main key is empty", async () => {
  await withStorageWindow(async (storageWindow) => {
    const storageKey = "test-scoped-modern-filter"
    const legacyStorageKey = "test-scoped-legacy-filter"

    storageWindow.localStorage.setItem(
      legacyStorageKey,
      JSON.stringify({
        "user-1::company-1": "north",
      }),
    )

    const { selectedAssetGroupId, selectedAssetGroup } = useScopedAssetGroupFilter({
      userId: ref("user-1"),
      contextId: ref("company-1"),
      availableActivos: ref([{ id: "asset-1" }]),
      groups: ref([
        {
          id: "north",
          name: "Norte",
          assetIds: ["asset-1"],
        },
      ]),
      storageKey,
      legacyStorageKey,
      keepEmptyGroups: false,
    })

    assert.equal(selectedAssetGroupId.value, "north")
    assert.equal(selectedAssetGroup.value?.name, "Norte")
  })
})
