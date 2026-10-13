export const createCollectionDatabaseStorage = ({ storage, key, createId = () => crypto.randomUUID() }) => {
  const manifestKey = `${key}:collections`
  const readManifest = () => JSON.parse(storage?.getItem(manifestKey) || "null")
  const read = () => {
    try {
      const manifest = readManifest()
      if (manifest?.version === 2) {
        const data = {}
        for (const [name, sectionKey] of Object.entries(manifest.sections)) {
          const raw = storage.getItem(sectionKey)
          if (raw === null) throw new Error("Missing database collection")
          data[name] = JSON.parse(raw)
        }
        return data
      }
    } catch { /* Fall back to the legacy snapshot when available. */ }
    try {
      const legacy = JSON.parse(storage?.getItem(key) || "null")
      return legacy?.version === 1 ? legacy.data : null
    } catch { return null }
  }
  const write = (state, dirtyNames) => {
    if (!storage || !dirtyNames.size) return false
    const created = []
    try {
      const previous = readManifest()
      const sections = { ...(previous?.sections || {}) }
      const names = previous?.version === 2 ? [...dirtyNames] : Object.keys(state)
      for (const name of names) {
        const sectionKey = `${key}:collection:${name}:${createId()}`
        storage.setItem(sectionKey, JSON.stringify(state[name]))
        created.push(sectionKey)
        sections[name] = sectionKey
      }
      // Commit the collection pointers together, preserving the previous snapshot on failure.
      storage.setItem(manifestKey, JSON.stringify({ version: 2, sections }))
      try {
        for (const name of names) {
          if (previous?.sections?.[name]) storage.removeItem(previous.sections[name])
        }
        storage.removeItem(key)
      } catch { /* Cleanup does not invalidate the committed snapshot. */ }
      return true
    } catch {
      for (const sectionKey of created) {
        try { storage.removeItem(sectionKey) } catch { /* Preserve the last committed snapshot. */ }
      }
      return false
    }
  }
  return { read, write }
}
