let databasePromise

const openDatabase = () => {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB no esta disponible."))
        return
      }
      const request = indexedDB.open("maintenance-documents", 1)
      request.onupgradeneeded = () => request.result.createObjectStore("evidence")
      request.onsuccess = () => {
        const database = request.result
        database.onversionchange = () => {
          database.close()
          databasePromise = undefined
        }
        resolve(database)
      }
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error("El almacenamiento de documentos esta bloqueado."))
    }).catch((error) => {
      databasePromise = undefined
      throw error
    })
  }
  return databasePromise
}

export const putMaintenanceEvidence = async (id, blob) => {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("evidence", "readwrite")
    transaction.objectStore("evidence").put(blob, id)
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error || new Error("No se guardo el documento."))
    transaction.onerror = () => reject(transaction.error)
  })
}

export const getMaintenanceEvidence = async (id) => {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("evidence", "readonly")
    const request = transaction.objectStore("evidence").get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export const deleteMaintenanceEvidence = async (id) => {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("evidence", "readwrite")
    transaction.objectStore("evidence").delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error || new Error("No se elimino el documento."))
    transaction.onerror = () => reject(transaction.error)
  })
}

export const saveMaintenanceEvidenceFile = async (file) => {
  const storageId = crypto.randomUUID()
  await putMaintenanceEvidence(storageId, file)
  return { storageId, name: file.name, size: file.size, type: file.type || "application/octet-stream" }
}
