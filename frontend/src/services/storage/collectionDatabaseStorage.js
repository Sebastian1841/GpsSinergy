import { mergeStoredRecords } from "./mergeStoredRecords.js"

export const createCollectionDatabaseStorage = ({
  storage,
  key,
  createId = () => crypto.randomUUID(),
}) => {
  let baseline
  let lastError = ""
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
        baseline = JSON.parse(JSON.stringify(data))
        return data
      }
    } catch {
      /* Fall back to the legacy snapshot when available. */
    }
    try {
      const legacy = JSON.parse(storage?.getItem(key) || "null")
      const data = legacy?.version === 1 ? legacy.data : null
      baseline = data == null ? {} : JSON.parse(JSON.stringify(data))
      return data
    } catch {
      return null
    }
  }
  const write = (state, dirtyNames) => {
    if (!storage || !dirtyNames.size) return false
    if (baseline === undefined) read()
    const created = []
    try {
      lastError = ""
      const previous = readManifest()
      const sections = { ...(previous?.sections || {}) }
      const names = previous?.version === 2 ? [...dirtyNames] : Object.keys(state)
      const nextBaseline = { ...baseline }
      for (const name of names) {
        const raw = previous?.sections?.[name] ? storage.getItem(previous.sections[name]) : null
        if (previous?.sections?.[name] && raw === null)
          throw new Error("Falta una coleccion guardada.")
        const latest = raw === null ? baseline[name] : JSON.parse(raw)
        const merged = mergeStoredRecords(baseline[name], state[name], latest)
        nextBaseline[name] = JSON.parse(JSON.stringify(state[name]))
        const sectionKey = `${key}:collection:${name}:${createId()}`
        storage.setItem(sectionKey, JSON.stringify(merged))
        created.push(sectionKey)
        sections[name] = sectionKey
      }
      if (JSON.stringify(readManifest()) !== JSON.stringify(previous)) {
        throw new Error("Los datos cambiaron en otra ventana. Intenta guardar nuevamente.")
      }
      // Commit the collection pointers together, preserving the previous snapshot on failure.
      storage.setItem(manifestKey, JSON.stringify({ version: 2, sections }))
      baseline = nextBaseline
      try {
        for (const name of names) {
          if (previous?.sections?.[name]) storage.removeItem(previous.sections[name])
        }
        storage.removeItem(key)
      } catch {
        /* Cleanup does not invalidate the committed snapshot. */
      }
      return true
    } catch (error) {
      lastError = error.message
      for (const sectionKey of created) {
        try {
          storage.removeItem(sectionKey)
        } catch {
          /* Preserve the last committed snapshot. */
        }
      }
      return false
    }
  }
  return { read, write, getError: () => lastError }
}
