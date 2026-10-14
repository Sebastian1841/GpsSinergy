let databasePromise
const database = () => {
  if (!databasePromise)
    databasePromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("El almacenamiento de adjuntos no esta disponible."))
        return
      }
      const request = indexedDB.open("sinergy-support-files", 1)
      request.onupgradeneeded = () => request.result.createObjectStore("files")
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error("El almacenamiento de adjuntos esta bloqueado."))
      request.onsuccess = () => {
        const db = request.result
        db.onversionchange = () => {
          db.close()
          databasePromise = undefined
        }
        resolve(db)
      }
    }).catch((error) => {
      databasePromise = undefined
      throw error
    })
  return databasePromise
}
const operation = async (mode, action) => {
  const db = await database()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", mode),
      request = action(tx.objectStore("files"))
    let result
    request.onsuccess = () => {
      result = request.result
    }
    tx.oncomplete = () => resolve(result)
    tx.onabort = () => reject(tx.error || new Error("No se pudo guardar el adjunto."))
    tx.onerror = () => reject(tx.error)
  })
}
export const saveSupportFile = async (file) => {
  const storageId = crypto.randomUUID()
  await operation("readwrite", (store) => store.put(file, storageId))
  return { storageId, name: file.name, size: file.size, type: file.type }
}
export const getSupportFile = (id) => operation("readonly", (store) => store.get(id))
export const deleteSupportFile = (id) => operation("readwrite", (store) => store.delete(id))
