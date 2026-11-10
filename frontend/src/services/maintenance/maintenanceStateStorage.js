import { mergeStoredRecords } from "../storage/mergeStoredRecords.js"

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const isRecordMap = (value) => value !== null && typeof value === "object" && !Array.isArray(value)

const mergeSection = (baseline, next, latest) => {
  const before = baseline ?? (Array.isArray(next) ? [] : isRecordMap(next) ? {} : baseline)
  const current = latest ?? (Array.isArray(next) ? [] : isRecordMap(next) ? {} : latest)
  if (same(next, before)) return current
  if (same(current, before) || same(next, current)) return next
  if ([before, next, current].every(isRecordMap)) {
    const rows = (value) => Object.entries(value).map(([id, record]) => ({ id, record }))
    return Object.fromEntries(
      mergeStoredRecords(rows(before), rows(next), rows(current)).map(({ id, record }) => [
        id,
        record,
      ]),
    )
  }
  return mergeStoredRecords(before, next, current)
}

export const createMaintenanceStateStorage = ({
  storage,
  key,
  createId = () => crypto.randomUUID(),
}) => {
  const manifestKey = `${key}:manifest`
  const readManifest = () => JSON.parse(storage.getItem(manifestKey) || "null")
  let baseline
  const readLatest = () => {
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
      try {
        return JSON.parse(storage.getItem(key) || "{}")
      } catch {
        return {}
      }
    }
  }
  const read = () => {
    const state = readLatest()
    // Cleanup also reads persisted state; it must not advance the editor's baseline.
    if (baseline === undefined) baseline = JSON.parse(JSON.stringify(state))
    return state
  }
  const writeSections = (changes) => {
    if (!storage || !Object.keys(changes).length) return
    const manifestBefore = storage.getItem(manifestKey)
    const legacyBefore = storage.getItem(key)
    const previous = readManifest()
    const latest = readLatest()
    if (baseline === undefined) baseline = JSON.parse(JSON.stringify(latest))
    const local = Object.fromEntries(
      Object.entries(changes).map(([name, json]) => [name, JSON.parse(json)]),
    )
    const merged = Object.fromEntries(
      Object.entries(local).map(([name, value]) => [
        name,
        JSON.stringify(mergeSection(baseline[name], value, latest[name])),
      ]),
    )
    // A partial first save must retain sections still stored in the legacy snapshot.
    if (!previous) {
      for (const [name, value] of Object.entries(latest)) {
        if (!Object.hasOwn(merged, name)) merged[name] = JSON.stringify(value)
      }
    }
    const sections = { ...(previous?.sections || {}) }
    const created = []
    try {
      for (const [name, json] of Object.entries(merged)) {
        const sectionKey = `${key}:section:${name}:${createId()}`
        storage.setItem(sectionKey, json)
        created.push(sectionKey)
        sections[name] = sectionKey
      }
      if (
        storage.getItem(manifestKey) !== manifestBefore ||
        storage.getItem(key) !== legacyBefore
      ) {
        throw new Error("Los datos cambiaron en otra ventana. Recarga antes de guardar.")
      }
      // A single pointer update commits all changes; old sections survive failures.
      storage.setItem(manifestKey, JSON.stringify({ version: 2, sections }))
      // Keep the local snapshot, not external records the editor has not loaded.
      baseline = { ...baseline, ...local }
    } catch (error) {
      for (const sectionKey of created) {
        try {
          storage.removeItem(sectionKey)
        } catch {
          /* Keep the previous committed state. */
        }
      }
      throw error
    }
    try {
      const referenced = new Set(Object.values(readManifest()?.sections || {}))
      for (const sectionKey of Object.values(previous?.sections || {})) {
        if (!referenced.has(sectionKey)) storage.removeItem(sectionKey)
      }
      storage.removeItem(key)
    } catch {
      /* Cleanup must not invalidate a committed save. */
    }
  }
  return { read, writeSections }
}
