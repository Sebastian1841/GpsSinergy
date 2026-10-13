export const collectMaintenanceEvidenceIds = (value, ids = new Set()) => {
  if (!value || typeof value !== "object") return ids
  if (value.storageId) ids.add(value.storageId)
  for (const child of Object.values(value)) collectMaintenanceEvidenceIds(child, ids)
  return ids
}

export const removeUnreferencedMaintenanceEvidence = async (ids, { readStates, deleteFile }) => {
  const referenced = collectMaintenanceEvidenceIds(readStates())
  for (const id of new Set(ids)) {
    if (!referenced.has(id)) await deleteFile(id)
  }
}

export const createMaintenanceEvidenceSession = ({ saveFile, cleanupFiles, onCleanupError }) => {
  const owned = new Set()
  let disposed = false
  let uploading = false

  const release = async (ids) => {
    const candidates = ids.filter((id) => owned.has(id))
    if (!candidates.length) return
    try {
      await cleanupFiles(candidates)
      candidates.forEach((id) => owned.delete(id))
    } catch (error) {
      onCleanupError(error)
    }
  }

  const upload = async (files) => {
    if (disposed || uploading) throw new Error("La carga no esta disponible.")
    uploading = true
    try {
      const results = await Promise.allSettled(files.map(saveFile))
      const saved = results.filter((result) => result.status === "fulfilled").map((result) => result.value)
      saved.forEach((file) => owned.add(file.storageId))
      const failed = results.find((result) => result.status === "rejected")
      if (disposed || failed) {
        await release(saved.map((file) => file.storageId))
        if (failed) throw failed.reason
        return []
      }
      return saved
    } finally {
      uploading = false
    }
  }

  const dispose = () => {
    disposed = true
    return release([...owned])
  }
  return { upload, release, dispose }
}
