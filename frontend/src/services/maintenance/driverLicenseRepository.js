import { normalizeDriverLicense } from "../../utils/maintenance/driverLicenseUtils.js"

let databasePromise
const openDatabase = () => {
  if (!databasePromise)
    databasePromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined")
        return reject(new Error("IndexedDB no esta disponible."))
      const request = indexedDB.open("sinergy-driver-licenses", 1)
      let blocked = false
      request.onupgradeneeded = () => {
        const records = request.result.createObjectStore("drivers", {
          keyPath: ["companyId", "id"],
        })
        records.createIndex("company", "companyId")
        records.createIndex("companyRut", ["companyId", "rut"], { unique: true })
        request.result.createObjectStore("companies", { keyPath: "companyId" })
      }
      request.onsuccess = () => {
        const database = request.result
        if (blocked) {
          database.close()
          return
        }
        database.onversionchange = () => {
          database.close()
          databasePromise = undefined
        }
        resolve(database)
      }
      request.onerror = () => reject(request.error)
      request.onblocked = () => {
        blocked = true
        reject(new Error("El almacenamiento de conductores esta bloqueado por otra pestana."))
      }
    }).catch((error) => {
      databasePromise = undefined
      throw error
    })
  return databasePromise
}

export function createDriverLicenseRepository({ companyId, legacyStorage }) {
  let version = null
  let cachedRows = null
  const validateLegacy = (rows) => {
    if (!Array.isArray(rows))
      throw new Error("El formato de los conductores anteriores no es valido.")
    const ids = new Set()
    for (const row of rows) {
      if (
        !row ||
        row.companyId !== companyId ||
        !row.id ||
        ids.has(row.id) ||
        !Array.isArray(row.history) ||
        (row.managements != null && !Array.isArray(row.managements))
      )
        throw new Error(
          "No se pudieron migrar los conductores anteriores. Sus datos no se modificaron.",
        )
      normalizeDriverLicense(row)
      ids.add(row.id)
    }
    return rows
  }
  const load = async (canRead = () => true) => {
    const database = await openDatabase()
    if (!canRead()) throw new Error("No tienes permiso para ver conductores.")
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(["drivers", "companies"], "readwrite")
      const drivers = transaction.objectStore("drivers")
      const companies = transaction.objectStore("companies")
      let nextRows, nextVersion, failure
      const request = companies.get(companyId)
      request.onsuccess = () => {
        try {
          if (!canRead()) throw new Error("No tienes permiso para ver conductores.")
          if (!request.result) {
            // Keep the legacy key untouched until and after the atomic migration.
            nextRows = validateLegacy(
              JSON.parse(legacyStorage?.getItem(`sinergy-driver-licenses-v1:${companyId}`) || "[]"),
            )
            nextVersion = 0
            for (const row of nextRows)
              drivers.add({ companyId, id: row.id, rut: row.rut, data: row })
            companies.put({ companyId, version: nextVersion })
          } else {
            nextVersion = request.result.version
            if (cachedRows && nextVersion === version) nextRows = cachedRows
            else {
              const records = drivers.index("company").getAll(companyId)
              records.onsuccess = () => {
                nextRows = records.result.map((record) => record.data)
              }
            }
          }
        } catch (error) {
          failure = error
          transaction.abort()
        }
      }
      transaction.oncomplete = () => {
        if (!canRead()) return reject(new Error("No tienes permiso para ver conductores."))
        cachedRows = nextRows
        version = nextVersion
        resolve(cachedRows)
      }
      transaction.onabort = () =>
        reject(failure || transaction.error || new Error("No se pudieron cargar los conductores."))
      transaction.onerror = () => {}
    })
  }
  const commit = async (changes, updatedRows, canWrite = () => true) => {
    const database = await openDatabase()
    if (version === null || !canWrite())
      throw new Error("El almacenamiento no esta listo o no tienes permiso para guardar.")
    const expectedVersion = version
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(["drivers", "companies"], "readwrite")
      const companies = transaction.objectStore("companies")
      const drivers = transaction.objectStore("drivers")
      let failure
      const request = companies.get(companyId)
      request.onsuccess = () => {
        try {
          if (!canWrite()) throw new Error("No tienes permiso para guardar conductores.")
          if (request.result?.version !== expectedVersion)
            throw new Error(
              "Los conductores cambiaron en otra pestana. Vuelve a abrir Conductores antes de guardar.",
            )
          for (const row of changes) drivers.put({ companyId, id: row.id, rut: row.rut, data: row })
          companies.put({ companyId, version: expectedVersion + 1 })
        } catch (error) {
          failure = error
          transaction.abort()
        }
      }
      transaction.oncomplete = () => {
        version = expectedVersion + 1
        cachedRows = updatedRows
        resolve()
      }
      transaction.onabort = () =>
        reject(
          failure ||
            (transaction.error?.name === "ConstraintError"
              ? new Error("Ya existe un conductor con este RUT en la empresa.")
              : new Error(
                  "No se guardaron los cambios. Revisa el espacio disponible del navegador.",
                  { cause: transaction.error },
                )),
        )
      transaction.onerror = () => {}
    })
  }
  return { load, commit }
}
