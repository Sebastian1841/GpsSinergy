export const createMaintenanceStateStorage = ({ storage, key, createId = () => crypto.randomUUID() }) => {
  const manifestKey = `${key}:manifest`
  const readManifest = () => JSON.parse(storage.getItem(manifestKey) || "null")
  const read = () => {
    if (!storage) return {}
    try {
      const manifest = readManifest()
      if (!manifest) return JSON.parse(storage.getItem(key) || "{}")
      if (manifest.version !== 2 || !manifest.sections) throw new Error("Estado no compatible.")
      const state = {}
      for (const [name, sectionKey] of Object.entries(manifest.sections)) {
        const json = storage.getItem(sectionKey)
        if (json === null) throw new Error("Seccion no encontrada.")
        state[name] = JSON.parse(json)
      }
      return state
    } catch {
      try { return JSON.parse(storage.getItem(key) || "{}") } catch { return {} }
    }
  }
  const writeSections = (changes) => {
    if (!storage || !Object.keys(changes).length) return
    const previous = readManifest()
    const sections = { ...(previous?.sections || {}) }
    const created = []
    try {
      for (const [name, json] of Object.entries(changes)) {
        const sectionKey = `${key}:section:${name}:${createId()}`
        storage.setItem(sectionKey, json)
        created.push(sectionKey)
        sections[name] = sectionKey
      }
      // A single pointer update commits all changes; old sections survive failures.
      storage.setItem(manifestKey, JSON.stringify({ version: 2, sections }))
    } catch (error) {
      for (const sectionKey of created) {
        try { storage.removeItem(sectionKey) } catch { /* Keep the previous committed state. */ }
      }
      throw error
    }
    try {
      const referenced = new Set(Object.values(readManifest()?.sections || {}))
      for (const sectionKey of Object.values(previous?.sections || {})) {
        if (!referenced.has(sectionKey)) storage.removeItem(sectionKey)
      }
      storage.removeItem(key)
    } catch { /* Cleanup must not invalidate a committed save. */ }
  }
  return { read, writeSections }
}
