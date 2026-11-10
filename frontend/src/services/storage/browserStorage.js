const STORAGE_TYPES = {
  local: "localStorage",
  session: "sessionStorage",
}

const getBrowserStorage = (type = "local") => {
  if (typeof window === "undefined") return null

  const storageName = STORAGE_TYPES[type] || STORAGE_TYPES.local

  return window[storageName] || null
}

export const readStorageValue = (key, { type = "local" } = {}) => {
  try {
    return getBrowserStorage(type)?.getItem(key) ?? null
  } catch {
    return null
  }
}

export const writeStorageValue = (key, value, { type = "local" } = {}) => {
  try {
    const storage = getBrowserStorage(type)

    if (!storage) return false

    storage.setItem(key, String(value))
    return true
  } catch {
    return false
  }
}

export const removeStorageValue = (key, { type = "local" } = {}) => {
  try {
    const storage = getBrowserStorage(type)

    if (!storage) return false

    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export const readJsonStorage = (key, fallback = null, options = {}) => {
  const rawValue = readStorageValue(key, options)

  if (!rawValue) return fallback

  try {
    return JSON.parse(rawValue) ?? fallback
  } catch {
    return fallback
  }
}

export const writeJsonStorage = (key, value, options = {}) => {
  return writeStorageValue(key, JSON.stringify(value), options)
}

// Best-effort rollback for related browser keys; not a cross-window transaction.
export const writeJsonStorageBatch = (entries, { type = "local" } = {}) => {
  let storage
  const written = []
  try {
    storage = getBrowserStorage(type)
    if (!storage) return false
    const pending = entries.map(([key, value]) => ({
      key,
      next: JSON.stringify(value),
      previous: storage.getItem(key),
    }))
    for (const entry of pending) {
      storage.setItem(entry.key, entry.next)
      written.push(entry)
    }
    return true
  } catch {
    for (const entry of written.reverse()) {
      try {
        if (entry.previous === null) storage.removeItem(entry.key)
        else storage.setItem(entry.key, entry.previous)
      } catch {
        /* The caller must still report failure and keep its draft. */
      }
    }
    return false
  }
}
