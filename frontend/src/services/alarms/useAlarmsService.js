import { computed, ref } from "vue"

import { mockAlarms } from "../../data/mockAlarms.js"
import { readJsonStorage, writeJsonStorage } from "../storage/browserStorage.js"

export const ALARMS_STORAGE_KEY = "sinergy-alarms"

const MAX_ALARM_RECORDS = 1000

const cloneData = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}

const normalizeText = (value, fallback = "") => {
  const text = String(value ?? "").trim()

  return text || fallback
}

const normalizeAlarmStatus = (status) => {
  return normalizeText(status, "open").toLowerCase() === "resolved" ? "resolved" : "open"
}

const normalizeAlarm = (alarm = {}) => {
  return {
    id: normalizeText(alarm.id, `alarm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    ruleId: normalizeText(alarm.ruleId),
    companyId: normalizeText(alarm.companyId),
    assetId: normalizeText(alarm.assetId),
    type: normalizeText(alarm.type, "operation"),
    severity: normalizeText(alarm.severity, "medium"),
    status: normalizeAlarmStatus(alarm.status),
    title: normalizeText(alarm.title, "Alarma operativa"),
    description: normalizeText(alarm.description, "Evento operativo pendiente de revision."),
    createdAt: normalizeText(alarm.createdAt, new Date().toISOString()),
    resolvedAt: alarm.resolvedAt || null,
    resolvedBy: alarm.resolvedBy || null,
    source: normalizeText(alarm.source, "sistema"),
    metadata: alarm.metadata && typeof alarm.metadata === "object" ? alarm.metadata : {},
  }
}

const mergeSeedAlarms = (items = []) => {
  const alarmIds = new Set(items.map((alarm) => normalizeText(alarm.id)))
  const seedAlarmsById = new Map(mockAlarms.map((alarm) => [normalizeText(alarm.id), alarm]))
  const enrichedItems = items.map((alarm) => ({
    ...(seedAlarmsById.get(normalizeText(alarm.id)) || {}),
    ...alarm,
  }))
  const missingSeedAlarms = mockAlarms.filter((alarm) => !alarmIds.has(normalizeText(alarm.id)))

  return [...enrichedItems, ...cloneData(missingSeedAlarms)]
}

const readAlarmRecords = () => {
  const storedAlarms = readJsonStorage(ALARMS_STORAGE_KEY, null)

  if (Array.isArray(storedAlarms)) {
    return mergeSeedAlarms(storedAlarms).map(normalizeAlarm)
  }

  return cloneData(mockAlarms).map(normalizeAlarm)
}

const alarms = ref(readAlarmRecords())
const alarmsWriteError = ref("")

const persistAlarms = (nextAlarms) => {
  alarmsWriteError.value = ""
  if (!writeJsonStorage(ALARMS_STORAGE_KEY, nextAlarms)) {
    alarmsWriteError.value =
      "No se pudo guardar el cambio de alertas. Los datos no cambiaron. Intenta nuevamente."
    return false
  }
  alarms.value = nextAlarms
  return true
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== ALARMS_STORAGE_KEY) return

    alarms.value = readAlarmRecords()
  })
}

const createAlarm = (payload = {}) => {
  const alarm = normalizeAlarm(payload)

  if (!persistAlarms([alarm, ...alarms.value].slice(0, MAX_ALARM_RECORDS))) return null

  return alarm
}

const updateAlarms = (updates = []) => {
  alarmsWriteError.value = ""
  if (!updates.length) return null
  const changesById = new Map(updates.map(({ id, changes }) => [normalizeText(id), changes]))
  if (
    changesById.size !== updates.length ||
    [...changesById.keys()].some((id) => !alarms.value.some((alarm) => alarm.id === id))
  ) {
    alarmsWriteError.value =
      "No se encontraron todas las alertas. Actualiza la seleccion e intenta nuevamente."
    return null
  }
  const updatedAlarms = []
  const nextAlarms = alarms.value.map((alarm) => {
    if (!changesById.has(alarm.id)) return alarm
    const updated = normalizeAlarm({ ...alarm, ...changesById.get(alarm.id), id: alarm.id })
    updatedAlarms.push(updated)
    return updated
  })
  return persistAlarms(nextAlarms) ? updatedAlarms : null
}

const updateAlarm = (alarmId, changes = {}) => updateAlarms([{ id: alarmId, changes }])?.[0] || null

const resolveAlarm = (alarmId, actorName = "Usuario") => {
  const currentAlarm = alarms.value.find(
    (alarm) => normalizeText(alarm.id) === normalizeText(alarmId),
  )

  if (!currentAlarm) return null

  const now = new Date().toISOString()

  return updateAlarm(alarmId, {
    status: "resolved",
    resolvedAt: now,
    resolvedBy: actorName,
  })
}

const reopenAlarm = (alarmId) => {
  return updateAlarm(alarmId, {
    status: "open",
    resolvedAt: null,
    resolvedBy: null,
  })
}

export const useAlarmsService = () => {
  return {
    alarms: computed(() => alarms.value),
    alarmsWriteError: computed(() => alarmsWriteError.value),
    createAlarm,
    updateAlarms,
    updateAlarm,
    resolveAlarm,
    reopenAlarm,
  }
}
