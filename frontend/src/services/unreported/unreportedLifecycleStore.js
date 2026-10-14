import { shallowRef } from "vue"
import { readJsonStorage, writeJsonStorage } from "../storage/browserStorage.js"
export const equipmentKey = (row) => JSON.stringify([row.company, String(row.imei)])
const diagnosticFields = [
  "externalVoltage",
  "internalVoltage",
  "previousExternalVoltage",
  "simStatus",
  "mobileRegistered",
  "mobileRegistration",
  "mobileSignalDbm",
  "gpsFixValid",
  "gpsFix",
  "satellites",
]
const telemetrySnapshot = (data, reportedAt) => {
  const snapshot = { reportedAt }
  for (const field of diagnosticFields) {
    if (
      Object.hasOwn(data, field) &&
      (data[field] === null || ["string", "number", "boolean"].includes(typeof data[field]))
    )
      snapshot[field] = data[field]
  }
  return snapshot
}
export const parseUnreportedTimestamp = (value) => {
  if (!value) return null
  const match = String(value).match(
    /^(\d{2})-(\d{2})-(\d{4})(?:[,\s]+(\d{2}):(\d{2})(?::(\d{2}))?)?/,
  )
  const date = match
    ? new Date(
        +match[3],
        +match[2] - 1,
        +match[1],
        +(match[4] || 0),
        +(match[5] || 0),
        +(match[6] || 0),
      )
    : new Date(value)
  if (
    match &&
    (date.getFullYear() !== +match[3] ||
      date.getMonth() !== +match[2] - 1 ||
      date.getDate() !== +match[1])
  )
    return null
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
export const createUnreportedLifecycleStore = ({
  read,
  write,
  now = () => new Date().toISOString(),
}) => {
  const initial = read()
  const records = shallowRef(
    initial && !Array.isArray(initial) && typeof initial === "object" ? initial : {},
  )
  const allowed = (row, context) =>
    Boolean(context.user?.id && context.companies.includes(row.company))
  const requireAccess = (row, context) => {
    if (!allowed(row, context)) throw new Error("No tienes acceso a este equipo.")
  }
  const commit = (next) => {
    if (!write(next)) throw new Error("No se pudo guardar el cambio. Intenta nuevamente.")
    records.value = next
  }
  const thresholdMs = (hours) => {
    const value = Number(hours) * 3600000
    if (!Number.isFinite(value) || value <= 0) throw new Error("Umbral no valido.")
    return value
  }
  const baseline = (row, hours = 6) => {
    const parsed = parseUnreportedTimestamp(row.lastReport),
      elapsed = parsed ? Date.parse(now()) - Date.parse(parsed) : Infinity
    const lastSeenAt = elapsed < 0 ? null : parsed
    return {
      mode: elapsed >= 0 && elapsed <= thresholdMs(hours) ? "reporting" : "active",
      lastSeenAt,
      recoveredAt: "",
      outageDurationMs: null,
      fault: "",
      faultAt: "",
      faultBy: "",
    }
  }
  const recover = (record, reportAt) => ({
    ...record,
    mode: "recovered",
    lastSeenAt: reportAt,
    recoveredAt: reportAt,
    outageDurationMs: record.lastSeenAt
      ? Math.max(0, Date.parse(reportAt) - Date.parse(record.lastSeenAt))
      : null,
  })
  const migrateRetirement = (record, hours) => {
    const notes = Array.isArray(record.notes) ? record.notes : []
    const text = record.fault || (record.mode === "inactive" ? record.reason : "")
    if (text && !record.notesMigrated && !notes.some((note) => note.id === "legacy-fault"))
      record = {
        ...record,
        notes: [
          ...notes,
          {
            id: "legacy-fault",
            text,
            createdAt: record.faultAt || record.inactiveAt || "",
            author: record.faultBy || record.inactiveBy || "Usuario",
          },
        ],
      }
    if (record.mode !== "inactive") return record
    const elapsed = record.lastSeenAt ? Date.parse(now()) - Date.parse(record.lastSeenAt) : Infinity
    return {
      ...record,
      mode: elapsed >= 0 && elapsed <= thresholdMs(hours) ? "recovered" : "active",
      fault: record.fault || record.reason || "",
      faultAt: record.faultAt || record.inactiveAt || "",
      faultBy: record.faultBy || record.inactiveBy || "",
      recoveredAt:
        elapsed >= 0 && elapsed <= thresholdMs(hours) ? record.lastSeenAt : record.recoveredAt,
    }
  }
  const observe = (rows, context, thresholdHours) => {
    const date = now(),
      threshold = thresholdMs(thresholdHours)
    let changed = false
    const next = { ...records.value }
    for (const row of rows) {
      if (!allowed(row, context)) continue
      const key = equipmentKey(row),
        previous = next[key],
        incoming = parseUnreportedTimestamp(row.lastReport)
      let record = migrateRetirement(previous || baseline(row, thresholdHours), thresholdHours)
      if (
        ["recovered", "reporting"].includes(record.mode) &&
        record.lastSeenAt &&
        incoming &&
        Date.parse(incoming) <= Date.parse(date) &&
        Date.parse(incoming) - Date.parse(record.lastSeenAt) > threshold
      )
        record = { ...record, mode: "active" }
      if (
        previous &&
        incoming &&
        (!record.lastSeenAt || Date.parse(incoming) > Date.parse(record.lastSeenAt)) &&
        Date.parse(incoming) <= Date.parse(date)
      ) {
        record =
          record.mode === "recovered" || record.mode === "reporting"
            ? { ...record, lastSeenAt: incoming }
            : Date.parse(date) - Date.parse(incoming) <= threshold
              ? recover(record, incoming)
              : { ...record, lastSeenAt: incoming }
      }
      if (
        ["recovered", "reporting"].includes(record.mode) &&
        (!record.lastSeenAt || Date.parse(date) - Date.parse(record.lastSeenAt) > threshold)
      )
        record = { ...record, mode: "active" }
      if (
        row.telemetry &&
        incoming &&
        parseUnreportedTimestamp(row.telemetry.reportedAt) === incoming &&
        record.lastSeenAt === incoming &&
        Date.parse(incoming) <= Date.parse(date)
      ) {
        const snapshot = telemetrySnapshot(row.telemetry, incoming)
        if (JSON.stringify(snapshot) !== JSON.stringify(record.telemetry))
          record = { ...record, telemetry: snapshot }
      }
      if (record !== previous) {
        next[key] = record
        changed = true
      }
    }
    if (changed) commit(next)
  }
  const receiveReport = (row, context, reportAt = now(), thresholdHours = 6, reportData = null) => {
    requireAccess(row, context)
    const incoming = parseUnreportedTimestamp(reportAt),
      date = now()
    if (!incoming || Date.parse(incoming) > Date.parse(date))
      throw new Error("La fecha del reporte no es valida.")
    const threshold = thresholdMs(thresholdHours)
    const key = equipmentKey(row)
    let previous = migrateRetirement(
      records.value[key] || baseline(row, thresholdHours),
      thresholdHours,
    )
    if (
      ["recovered", "reporting"].includes(previous.mode) &&
      previous.lastSeenAt &&
      Date.parse(incoming) - Date.parse(previous.lastSeenAt) > threshold
    )
      previous = { ...previous, mode: "active" }
    if (previous.lastSeenAt && Date.parse(incoming) <= Date.parse(previous.lastSeenAt)) return false
    const fresh = Date.parse(date) - Date.parse(incoming) <= threshold
    const next =
      previous.mode === "reporting" || previous.mode === "recovered"
        ? {
            ...previous,
            lastSeenAt: incoming,
            mode: fresh ? previous.mode : "active",
          }
        : fresh
          ? recover(previous, incoming)
          : { ...previous, lastSeenAt: incoming }
    const confirmed =
      reportData && typeof reportData === "object" && !Array.isArray(reportData)
        ? { ...next, telemetry: telemetrySnapshot(reportData, incoming) }
        : next
    commit({ ...records.value, [key]: confirmed })
    return true
  }
  const saveFault = (row, reason, context, thresholdHours = 6) => {
    requireAccess(row, context)
    const text = String(reason || "").trim()
    if (!text || text.length > 500) throw new Error("Indica una falla de hasta 500 caracteres.")
    const key = equipmentKey(row),
      record = migrateRetirement(
        records.value[key] || baseline(row, thresholdHours),
        thresholdHours,
      )
    commit({
      ...records.value,
      [key]: {
        ...record,
        fault: text,
        faultAt: now(),
        faultBy: context.user.name || context.user.email || "Usuario",
      },
    })
  }
  const addNote = (row, text, context, thresholdHours = 6) => {
    requireAccess(row, context)
    const value = String(text || "").trim()
    if (!value || value.length > 500) throw new Error("Escribe una nota de hasta 500 caracteres.")
    const key = equipmentKey(row)
    const record = migrateRetirement(
      records.value[key] || baseline(row, thresholdHours),
      thresholdHours,
    )
    const notes = Array.isArray(record.notes) ? record.notes : []
    commit({
      ...records.value,
      [key]: {
        ...record,
        notes: [
          ...notes,
          {
            id: globalThis.crypto.randomUUID(),
            text: value,
            createdAt: now(),
            author: context.user.name || context.user.email || "Usuario",
          },
        ],
      },
    })
  }
  const mutateNote = (row, id, context, transform) => {
    requireAccess(row, context)
    const key = equipmentKey(row),
      record = records.value[key]
    if (!record?.notes?.some((note) => note.id === id)) throw new Error("La nota ya no existe.")
    commit({
      ...records.value,
      [key]: { ...record, notesMigrated: true, notes: transform(record.notes) },
    })
  }
  const editNote = (row, id, text, context) => {
    const value = String(text || "").trim()
    if (!value || value.length > 500) throw new Error("Escribe una nota de hasta 500 caracteres.")
    mutateNote(row, id, context, (notes) =>
      notes.map((note) =>
        note.id === id
          ? {
              ...note,
              text: value,
              updatedAt: now(),
              updatedBy: context.user.name || context.user.email || "Usuario",
            }
          : note,
      ),
    )
  }
  const deleteNote = (row, id, context) =>
    mutateNote(row, id, context, (notes) => notes.filter((note) => note.id !== id))
  return { records, allowed, observe, receiveReport, saveFault, addNote, editNote, deleteNote }
}
let store
export const useUnreportedLifecycleStore = () => {
  if (!store)
    store = createUnreportedLifecycleStore({
      read: () => readJsonStorage("sinergy-unreported-lifecycle-v1", {}),
      write: (value) => writeJsonStorage("sinergy-unreported-lifecycle-v1", value),
    })
  return store
}
