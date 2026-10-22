import { shallowRef } from "vue"
import {
  normalizeDriverLicense,
  driverToday,
  DRIVER_MANAGEMENT_OPTIONS,
  validLicenseDate,
  validateDriverRenewal,
} from "../../utils/maintenance/driverLicenseUtils.js"

export function createDriverLicenseStore({
  storage,
  repository,
  companyId,
  canView = () => false,
  canEdit = () => false,
  author = () => "Usuario",
  now = () => new Date().toISOString(),
  createId = () => crypto.randomUUID(),
}) {
  const records = shallowRef([])
  const key = `sinergy-driver-licenses-v1:${companyId}`
  let readable = !repository
  let snapshot = null
  let pendingWrite = null
  const requireAccess = (edit = false) => {
    if (!companyId || !canView() || (edit && !canEdit()))
      throw new Error("No tienes permiso para gestionar conductores de esta empresa.")
  }
  const load = () => {
    requireAccess()
    if (repository) {
      if (pendingWrite) return pendingWrite.then(load)
      return repository
        .load(() => !!companyId && canView())
        .then((saved) => {
          requireAccess()
          if (saved !== records.value) {
            for (const row of saved) normalizeDriverLicense(row)
            records.value = saved
          }
          readable = true
        })
        .catch((failure) => {
          readable = false
          throw failure
        })
    }
    try {
      const raw = storage?.getItem(key)
      if (readable && raw === snapshot) return
      const saved = raw == null ? [] : JSON.parse(raw)
      if (
        !Array.isArray(saved) ||
        saved.some(
          (row) =>
            !row ||
            row.companyId !== companyId ||
            !row.id ||
            !Array.isArray(row.history) ||
            (row.managements != null && !Array.isArray(row.managements)),
        )
      )
        throw new Error("Invalid driver data")
      for (const row of saved) normalizeDriverLicense(row)
      records.value = saved
      snapshot = raw
      readable = true
    } catch {
      readable = false
      throw new Error(
        "No se pudieron leer los conductores guardados. No se sobrescribiran sus datos.",
      )
    }
  }
  const persist = (updated) => {
    if (!readable || (!storage && !repository))
      throw new Error("El almacenamiento de conductores no esta disponible.")
    if (repository) {
      if (pendingWrite) throw new Error("Espera a que termine el guardado anterior.")
      const previous = new Map(records.value.map((row) => [row.id, row]))
      const changes = updated.filter((row) => row !== previous.get(row.id))
      if (!changes.length) return
      pendingWrite = repository
        .commit(changes, updated, () => !!companyId && canView() && canEdit())
        .then(() => {
          records.value = updated
        })
        .finally(() => {
          pendingWrite = null
        })
      return pendingWrite
    }
    try {
      if (storage.getItem(key) !== snapshot) throw new Error("stale")
      const serialized = JSON.stringify(updated)
      storage.setItem(key, serialized)
      snapshot = serialized
    } catch (failure) {
      if (failure.message === "stale")
        throw new Error(
          "Los conductores cambiaron en otra pestana. Actualiza la lista antes de guardar.",
          { cause: failure },
        )
      throw new Error("No se guardaron los cambios. Revisa el espacio disponible del navegador.", {
        cause: failure,
      })
    }
    records.value = updated
  }
  const save = (data, { id = null, renewal = false, photos = {} } = {}) => {
    requireAccess(true)
    if (!readable || (!storage && !repository))
      throw new Error("El almacenamiento de conductores no esta disponible.")
    const normalized = normalizeDriverLicense(data)
    const previous = id ? records.value.find((row) => row.id === id) : null
    if (id && !previous) throw new Error("El conductor ya no esta disponible.")
    if (previous && !renewal && normalized.expiresAt !== previous.expiresAt)
      throw new Error("Para cambiar el vencimiento debes usar Renovar licencia.")
    if (records.value.some((row) => row.id !== id && row.rut === normalized.rut))
      throw new Error("Ya existe un conductor con este RUT en la empresa.")
    if (renewal) validateDriverRenewal(normalized.expiresAt, previous, driverToday(now()))
    const stamp = now()
    const photo = (side) => {
      const value = photos[side]
      if (!value) return renewal ? null : previous?.photos?.[side] || null
      if (
        !value.storageId ||
        !["image/jpeg", "image/png", "image/webp"].includes(value.type) ||
        !(value.size > 0 && value.size <= 5 * 1024 * 1024)
      )
        throw new Error("La foto debe ser JPG, PNG o WebP de hasta 5 MB.")
      return {
        storageId: value.storageId,
        name: String(value.name || "Foto"),
        type: value.type,
        size: value.size,
      }
    }
    const next = {
      ...normalized,
      id: previous?.id || createId(),
      companyId,
      licenseId: renewal ? createId() : previous?.licenseId || previous?.createdAt || createId(),
      managements: previous?.managements || [],
      photos: { front: photo("front"), back: photo("back") },
      createdAt: previous?.createdAt || stamp,
      updatedAt: stamp,
      updatedBy: author(),
      history: previous?.history || [],
    }
    if (renewal)
      next.history = [
        ...next.history,
        {
          id: createId(),
          licenseId: previous.licenseId || previous.createdAt,
          classes: previous.classes,
          expiresAt: previous.expiresAt,
          photos: previous.photos,
          renewedAt: stamp,
          renewedBy: author(),
        },
      ]
    const updated = previous
      ? records.value.map((row) => (row.id === id ? next : row))
      : [...records.value, next]
    const persisted = persist(updated)
    return persisted ? persisted.then(() => next) : next
  }
  const addManagement = (id, data) => {
    requireAccess(true)
    const row = records.value.find((item) => item.id === id)
    if (!row) throw new Error("El conductor ya no esta disponible.")
    if (!DRIVER_MANAGEMENT_OPTIONS.some((option) => option.value === data.result))
      throw new Error("Selecciona el resultado de la gestion.")
    const observation = String(data.observation || "").trim()
    if (observation.length > 500) throw new Error("La observacion admite hasta 500 caracteres.")
    const stamp = now()
    const appointmentDate = data.result === "appointment" ? String(data.appointmentDate || "") : ""
    if (
      data.result === "appointment" &&
      (!validLicenseDate(appointmentDate) || appointmentDate < driverToday(stamp))
    )
      throw new Error("Indica una fecha de renovacion desde hoy.")
    const entry = {
      id: createId(),
      licenseId: row.licenseId || row.createdAt,
      result: data.result,
      observation,
      appointmentDate,
      createdAt: stamp,
      author: author(),
    }
    const next = { ...row, managements: [...(row.managements || []), entry] }
    const persisted = persist(records.value.map((item) => (item.id === id ? next : item)))
    return persisted ? persisted.then(() => next) : next
  }
  const seedDemoHistory = (ids) => {
    requireAccess(true)
    const allowed = new Set(ids)
    let changed = false
    const updated = records.value.map((row) => {
      if (!allowed.has(row.id) || !row.name.endsWith(" (DEMO)") || row.history.length) return row
      const rawRut = row.rut.replace(/[.-]/g, "")
      const number = Number(rawRut.slice(0, -1))
      if (!rawRut.endsWith("K") || number < 90000001 || number > 90000015) return row
      const date = (days) =>
        new Date(Date.parse(row.expiresAt) - days * 86400000).toISOString().slice(0, 10)
      changed = true
      return {
        ...row,
        history: [2, 1].map((age) => ({
          id: `demo-history-${row.id}-${age}`,
          licenseId: `demo-license-${row.id}-${age}`,
          classes: age === 2 ? row.classes.slice(0, 1) : [...row.classes],
          expiresAt: date(age * 1095),
          photos: { front: null, back: null },
          renewedAt: `${date(age * 1095 + 14)}T12:00:00Z`,
          renewedBy: "Datos de demostracion",
        })),
      }
    })
    if (changed) return persist(updated)
  }
  const addDemoHistoryPhotos = (id, historyId, photos) => {
    requireAccess(true)
    const row = records.value.find((item) => item.id === id)
    const entry = row?.history.find((item) => item.id === historyId)
    if (
      row?.rut !== "90.000.015-K" ||
      !row.name.endsWith(" (DEMO)") ||
      entry?.renewedBy !== "Datos de demostracion"
    )
      throw new Error("Solo se pueden completar fotos del historial de demostracion.")
    const nextPhotos = { ...entry.photos }
    for (const side of ["front", "back"]) {
      if (nextPhotos[side] || !photos[side]) continue
      const photo = photos[side]
      if (
        !photo.storageId ||
        !["image/jpeg", "image/png", "image/webp"].includes(photo.type) ||
        !(photo.size > 0 && photo.size <= 5 * 1024 * 1024)
      )
        throw new Error("Foto de demostracion invalida.")
      nextPhotos[side] = {
        storageId: photo.storageId,
        name: photo.name,
        type: photo.type,
        size: photo.size,
      }
    }
    return persist(
      records.value.map((item) =>
        item.id === id
          ? {
              ...item,
              history: item.history.map((old) =>
                old.id === historyId ? { ...old, photos: nextPhotos } : old,
              ),
            }
          : item,
      ),
    )
  }
  return { records, load, save, addManagement, seedDemoHistory, addDemoHistoryPhotos }
}
