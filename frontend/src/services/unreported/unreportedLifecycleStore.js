import { shallowRef } from "vue"
import { createUnreportedStateStorage } from "./unreportedStateStorage.js"
import {
  consultationSituations,
  currentConsultations,
  consultationDecisionForSituation,
  consultationDecisions,
  localFollowUpDate,
  visitResults,
} from "../../utils/unreported/unreportedFlow.js"
import {
  ensureInterruptionHistory,
  closeInterruption,
  captureInterruptionTelemetry,
} from "../../utils/unreported/unreportedHistory.js"
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
  allowSimulation = false,
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
  const commit = (next, changedKeys) => {
    if (!changedKeys.size) return
    if (!write(next, changedKeys))
      throw new Error("No se pudo guardar el cambio. Intenta nuevamente.")
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
      followUp: "pending",
    }
  }
  const withEquipment = (record, row) => {
    const equipment = {
      name: row.name || String(row.imei),
      company: row.company,
      imei: String(row.imei),
      location: row.location || "Sin posicion conocida",
    }
    return JSON.stringify(equipment) === JSON.stringify(record.equipment)
      ? record
      : { ...record, equipment }
  }
  const recover = (record, reportAt) => ({
    ...record,
    demoDisconnected: false,
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
    const changedKeys = new Set()
    const next = { ...records.value }
    for (const row of rows) {
      if (!allowed(row, context)) continue
      const key = equipmentKey(row),
        previous = next[key],
        incoming = parseUnreportedTimestamp(row.lastReport)
      let record = withEquipment(
        migrateRetirement(previous || baseline(row, thresholdHours), thresholdHours),
        row,
      )
      if (row.archived) {
        const historical = ensureInterruptionHistory(
          { ...record, mode: "reporting" },
          date,
          threshold,
        )
        if (!record.historyInitialized || historical.interruptions !== record.interruptions)
          record = { ...record, historyInitialized: true, interruptions: historical.interruptions }
        if (record !== previous) {
          next[key] = record
          changedKeys.add(key)
        }
        continue
      }
      record = ensureInterruptionHistory(record, date, threshold)
      // Latest-state polling does not prove what happened between two observations.
      if (
        previous &&
        incoming &&
        (!record.lastSeenAt || Date.parse(incoming) > Date.parse(record.lastSeenAt)) &&
        Date.parse(incoming) <= Date.parse(date)
      ) {
        record = closeInterruption(record, incoming, threshold, date)
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
        record = { ...record, mode: "active", followUp: "pending", followUpAt: "", followUpBy: "" }
      record = ensureInterruptionHistory(record, date, threshold)
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
      record = captureInterruptionTelemetry(record)
      if (record !== previous) {
        next[key] = record
        changedKeys.add(key)
      }
    }
    if (changedKeys.size) commit(next, changedKeys)
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
    previous = withEquipment(previous, row)
    previous = ensureInterruptionHistory(previous, date, threshold)
    if (
      ["recovered", "reporting"].includes(previous.mode) &&
      previous.lastSeenAt &&
      Date.parse(incoming) - Date.parse(previous.lastSeenAt) > threshold
    )
      previous = {
        ...previous,
        mode: "active",
        followUp: "pending",
        followUpAt: "",
        followUpBy: "",
      }
    if (previous.lastSeenAt && Date.parse(incoming) <= Date.parse(previous.lastSeenAt)) return false
    previous = ensureInterruptionHistory(previous, date, threshold)
    previous = closeInterruption(previous, incoming, threshold, date)
    const fresh = Date.parse(date) - Date.parse(incoming) <= threshold
    const next =
      previous.mode === "reporting" || previous.mode === "recovered"
        ? {
            ...previous,
            lastSeenAt: incoming,
            mode: fresh ? previous.mode : "active",
            followUp: fresh ? previous.followUp : "pending",
            followUpAt: fresh ? previous.followUpAt : "",
            followUpBy: fresh ? previous.followUpBy : "",
          }
        : fresh
          ? recover(previous, incoming)
          : { ...previous, lastSeenAt: incoming }
    const recorded = ensureInterruptionHistory(next, date, threshold)
    const confirmed =
      reportData && typeof reportData === "object" && !Array.isArray(reportData)
        ? { ...recorded, telemetry: telemetrySnapshot(reportData, incoming) }
        : recorded
    commit({ ...records.value, [key]: captureInterruptionTelemetry(confirmed) }, new Set([key]))
    return true
  }
  const simulateDisconnection = (row, context, thresholdHours = 6) => {
    requireAccess(row, context)
    if (!allowSimulation) throw new Error("Simulacion disponible solo en desarrollo.")
    const key = equipmentKey(row)
    const record = records.value[key]
    if (
      row.archived ||
      !record ||
      !["recovered", "reporting"].includes(record.mode) ||
      !record.lastSeenAt
    )
      throw new Error("El equipo debe haber vuelto a reportar antes de simular otra desconexion.")
    const next = ensureInterruptionHistory(
      {
        ...record,
        mode: "active",
        demoDisconnected: true,
        followUp: "pending",
        followUpAt: "",
        followUpBy: "",
      },
      now(),
      thresholdMs(thresholdHours),
    )
    commit({ ...records.value, [key]: next }, new Set([key]))
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
    commit(
      {
        ...records.value,
        [key]: {
          ...record,
          fault: text,
          faultAt: now(),
          faultBy: context.user.name || context.user.email || "Usuario",
        },
      },
      new Set([key]),
    )
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
    commit(
      {
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
      },
      new Set([key]),
    )
  }
  const mutateNote = (row, id, context, transform) => {
    requireAccess(row, context)
    const key = equipmentKey(row),
      record = records.value[key]
    if (!record?.notes?.some((note) => note.id === id)) throw new Error("La nota ya no existe.")
    commit(
      {
        ...records.value,
        [key]: { ...record, notesMigrated: true, notes: transform(record.notes) },
      },
      new Set([key]),
    )
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
  const setFollowUp = (row, status, context) => {
    requireAccess(row, context)
    if (!["pending", "in_progress"].includes(status)) throw new Error("Seguimiento no valido.")
    const key = equipmentKey(row),
      record = records.value[key]
    if (!record || record.mode !== "active")
      throw new Error("El equipo ya no esta sin reportar. Actualiza su estado.")
    commit(
      {
        ...records.value,
        [key]: {
          ...record,
          followUp: status,
          followUpAt: now(),
          followUpBy: context.user.name || context.user.email || "Usuario",
        },
      },
      new Set([key]),
    )
  }
  const commitConsultations = (key, record, consultations) => {
    const next = { ...record, consultations }
    if (record.mode === "active") {
      const latest = currentConsultations(next).at(-1)
      next.followUp = latest?.decision || "pending"
      next.followUpAt = latest?.updatedAt || latest?.createdAt || ""
      next.followUpBy = latest?.editedBy || latest?.author || ""
    }
    commit({ ...records.value, [key]: next }, new Set([key]))
  }
  const saveConsultation = (row, data, context, editingId = null) => {
    requireAccess(row, context)
    const key = equipmentKey(row),
      record = records.value[key]
    if (row.archived || !record || (!editingId && record.mode !== "active"))
      throw new Error("El equipo no tiene una incidencia actual disponible.")
    const existing = editingId ? record.consultations?.find((call) => call.id === editingId) : null
    if (editingId && !existing) throw new Error("La consulta ya no existe.")
    data = existing ? { ...existing, ...data } : data
    if (
      !consultationSituations.some((option) => option.value === data.situation) ||
      !consultationDecisions.some((option) => option.value === data.decision)
    )
      throw new Error("Selecciona situacion y decision validas.")
    const observation = String(data.observation || "").trim()
    const workshopDays =
      data.situation === "workshop" && data.workshopDays !== "" && data.workshopDays != null
        ? Number(data.workshopDays)
        : null
    if (
      data.situation === "workshop" &&
      (!Number.isInteger(workshopDays) || workshopDays < 1 || workshopDays > 3650)
    )
      throw new Error("Indica entre 1 y 3650 dias estimados en taller.")
    if (observation.length > 500) throw new Error("La observacion admite hasta 500 caracteres.")
    const contactedPerson = String(data.contactedPerson || "").trim()
    const contactedRole = String(data.contactedRole || "").trim()
    if (contactedPerson.length > 100)
      throw new Error("El nombre de la persona admite hasta 100 caracteres.")
    if (contactedRole.length > 80) throw new Error("El cargo admite hasta 80 caracteres.")
    const createdAt = now(),
      author = context.user.name || context.user.email || "Usuario"
    const nextCallDate = String(data.nextCallDate || "")
    const visitResult = String(data.visitResult || "")
    const visitDate = String(data.visitDate || "")
    const validDate = (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value
    const today = localFollowUpDate(createdAt)
    if (
      nextCallDate &&
      nextCallDate !== existing?.nextCallDate &&
      (!validDate(nextCallDate) || nextCallDate < today)
    )
      throw new Error("La proxima llamada debe ser hoy o una fecha posterior.")
    if (
      visitResult &&
      (!visitResults.some((option) => option.value === visitResult) ||
        !validDate(visitDate) ||
        visitDate > today)
    )
      throw new Error("Selecciona un resultado y una fecha de visita valida, no futura.")
    if (visitDate && !visitResult) throw new Error("Selecciona el resultado de la visita.")
    const consultation = {
      id: existing?.id || globalThis.crypto.randomUUID(),
      situation: data.situation,
      ...(workshopDays !== null ? { workshopDays } : {}),
      decision: consultationDecisionForSituation(data.situation),
      observation,
      createdAt: existing?.createdAt || createdAt,
      author: existing?.author || author,
      ...(existing ? { updatedAt: createdAt, editedBy: author } : {}),
      contactedPerson: data.situation === "not_contacted" ? "" : contactedPerson,
      contactedRole: data.situation === "not_contacted" ? "" : contactedRole,
      nextCallDate,
      visitResult,
      visitDate,
      interruptionId: existing
        ? existing.interruptionId
        : record.interruptions?.find((item) => !item.recoveredAt)?.id || null,
    }
    commitConsultations(
      key,
      record,
      existing
        ? record.consultations.map((call) => (call.id === editingId ? consultation : call))
        : [...(record.consultations || []), consultation],
    )
  }
  const addConsultation = (row, data, context) => saveConsultation(row, data, context)
  const editConsultation = (row, id, data, context) => {
    if (!id) throw new Error("Selecciona una consulta.")
    saveConsultation(row, data, context, id)
  }
  const deleteConsultation = (row, id, context) => {
    requireAccess(row, context)
    const key = equipmentKey(row),
      record = records.value[key]
    if (row.archived || !record?.consultations?.some((call) => call.id === id))
      throw new Error("La consulta ya no esta disponible.")
    commitConsultations(
      key,
      record,
      record.consultations.filter((call) => call.id !== id),
    )
  }
  return {
    records,
    allowed,
    observe,
    receiveReport,
    simulateDisconnection,
    saveFault,
    addNote,
    editNote,
    deleteNote,
    setFollowUp,
    addConsultation,
    editConsultation,
    deleteConsultation,
  }
}
let store
export const useUnreportedLifecycleStore = () => {
  if (!store) {
    let storage = null
    try {
      if (typeof window !== "undefined") storage = window.localStorage
    } catch {
      /* Access can be blocked by the browser. */
    }
    const persistence = createUnreportedStateStorage({ storage })
    store = createUnreportedLifecycleStore({
      ...persistence,
      allowSimulation: import.meta.env?.DEV === true,
    })
  }
  return store
}
