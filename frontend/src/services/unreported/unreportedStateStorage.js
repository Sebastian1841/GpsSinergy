import { createCollectionDatabaseStorage } from "../storage/collectionDatabaseStorage.js"

export const UNREPORTED_STATE_KEY = "sinergy-unreported-lifecycle-v1"

export const createUnreportedStateStorage = ({
  storage,
  key = UNREPORTED_STATE_KEY,
  createId,
} = {}) => {
  const database = createCollectionDatabaseStorage({
    storage,
    key,
    ...(createId ? { createId } : {}),
  })
  let writable = true
  const read = () => {
    const current = database.read()
    if (current && !Array.isArray(current) && typeof current === "object") return current
    try {
      // Never replace unreadable committed sections with an empty initial state.
      if (storage?.getItem(`${key}:collections`) != null) writable = false
      const raw = storage?.getItem(key)
      const legacy = JSON.parse(raw || "null")
      if (legacy && !Array.isArray(legacy) && typeof legacy === "object") return legacy
      if (raw != null) writable = false
      return {}
    } catch {
      writable = false
      return {}
    }
  }
  return { read, write: (state, changedKeys) => writable && database.write(state, changedKeys) }
}
