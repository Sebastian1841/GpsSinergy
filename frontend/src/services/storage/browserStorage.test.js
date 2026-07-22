import assert from "node:assert/strict"
import test from "node:test"

import {
  readJsonStorage,
  readStorageValue,
  removeStorageValue,
  writeJsonStorage,
  writeStorageValue,
} from "./browserStorage.js"

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

const withStorageWindow = (callback) => {
  const previousWindow = globalThis.window

  globalThis.window = {
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
  }

  try {
    callback(globalThis.window)
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
}

test("readStorageValue returns null without browser storage", () => {
  const previousWindow = globalThis.window

  delete globalThis.window

  try {
    assert.equal(readStorageValue("missing"), null)
    assert.equal(writeStorageValue("missing", "value"), false)
    assert.equal(removeStorageValue("missing"), false)
  } finally {
    if (previousWindow !== undefined) {
      globalThis.window = previousWindow
    }
  }
})

test("writeStorageValue and removeStorageValue use local storage by default", () => {
  withStorageWindow(() => {
    assert.equal(writeStorageValue("company", "company-001"), true)
    assert.equal(readStorageValue("company"), "company-001")

    assert.equal(removeStorageValue("company"), true)
    assert.equal(readStorageValue("company"), null)
  })
})

test("storage helpers can target session storage", () => {
  withStorageWindow(() => {
    writeStorageValue("auth", "user-001", { type: "session" })

    assert.equal(readStorageValue("auth"), null)
    assert.equal(readStorageValue("auth", { type: "session" }), "user-001")
  })
})

test("json helpers round-trip objects and recover from invalid payloads", () => {
  withStorageWindow((storageWindow) => {
    const payload = {
      leftPanelWidth: 420,
    }

    assert.equal(writeJsonStorage("layout", payload), true)
    assert.deepEqual(readJsonStorage("layout", null), payload)

    storageWindow.localStorage.setItem("layout", "{")
    assert.deepEqual(readJsonStorage("layout", payload), payload)
  })
})
