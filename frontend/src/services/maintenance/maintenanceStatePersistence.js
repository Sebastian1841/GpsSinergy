export const createMaintenanceStatePersistence = ({
  readState, writeState, writeSections, putEvidence, onError,
  createId = () => crypto.randomUUID(), delay = 350,
}) => {
  const migratedFiles = new WeakMap()
  const committedSections = new Map()
  let timer
  let dirty = false
  let running

  const snapshot = () => {
    const documents = new Map()
    const replacer = (key, value) => {
      if (key !== "evidence" || !Array.isArray(value)) return value
      return value.map((file) => {
        if (!file.dataUrl) return file
        let entry = migratedFiles.get(file)
        if (!entry) {
          entry = { storageId: file.storageId || createId(), saved: false }
          migratedFiles.set(file, entry)
        }
        if (!entry.saved) documents.set(entry.storageId, { entry, dataUrl: file.dataUrl })
        const { dataUrl: _dataUrl, ...metadata } = file
        return { ...metadata, storageId: entry.storageId }
      })
    }
    const state = readState()
    if (!writeSections) return { json: JSON.stringify(state, replacer), documents }
    const sections = {}
    const references = new Map()
    for (const [name, value] of Object.entries(state)) {
      if (committedSections.has(name) && committedSections.get(name) === value) continue
      sections[name] = JSON.stringify(value, replacer)
      references.set(name, value)
    }
    return { sections, references, documents }
  }

  const commit = (pending) => {
    if (!writeSections) {
      writeState(pending.json)
      return
    }
    writeSections(pending.sections)
    for (const [name, value] of pending.references) committedSections.set(name, value)
  }

  const flush = () => {
    clearTimeout(timer)
    if (running) return running.then(() => dirty ? flush() : undefined)
    if (!dirty) return Promise.resolve()
    dirty = false
    let pending
    try {
      pending = snapshot()
      // Metadata-only saves complete synchronously, including on pagehide.
      if (!pending.documents.size) {
        commit(pending)
        return Promise.resolve()
      }
    } catch (error) {
      onError(error)
      return Promise.resolve()
    }
    running = (async () => {
      try {
        for (const { entry, dataUrl } of pending.documents.values()) {
          const response = await fetch(dataUrl)
          await putEvidence(entry.storageId, await response.blob())
          entry.saved = true
        }
        commit(pending)
      } catch (error) {
        onError(error)
      } finally {
        running = undefined
      }
    })()
    return running
  }

  const schedule = () => {
    dirty = true
    clearTimeout(timer)
    timer = setTimeout(flush, delay)
  }
  return { schedule, flush }
}
