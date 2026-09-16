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
  const missingSeedAlarms = mockAlarms.filter((alarm) => !alarmIds.has(normalizeText(alarm.id)))

  return [...items, ...cloneData(missingSeedAlarms)]
}

const readAlarmRecords = () => {
  const storedAlarms = readJsonStorage(ALARMS_STORAGE_KEY, null)

  if (Array.isArray(storedAlarms)) {
    return mergeSeedAlarms(storedAlarms).map(normalizeAlarm)
  }

  return cloneData(mockAlarms).map(normalizeAlarm)
}

const alarms = ref(readAlarmRecords())

const persistAlarms = () => {
  writeJsonStorage(ALARMS_STORAGE_KEY, alarms.value)
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== ALARMS_STORAGE_KEY) return

    alarms.value = readAlarmRecords()
  })
}

const createAlarm = (payload = {}) => {
  const alarm = normalizeAlarm(payload)

  alarms.value = [alarm, ...alarms.value].slice(0, MAX_ALARM_RECORDS)
  persistAlarms()

  return alarm
}

const updateAlarm = (alarmId, changes = {}) => {
  const normalizedAlarmId = normalizeText(alarmId)
  let updatedAlarm = null

  alarms.value = alarms.value.map((alarm) => {
    if (normalizeText(alarm.id) !== normalizedAlarmId) return alarm

    updatedAlarm = normalizeAlarm({
      ...alarm,
      ...changes,
      id: alarm.id,
    })

    return updatedAlarm
  })

  if (updatedAlarm) {
    persistAlarms()
  }

  return updatedAlarm
}

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
    createAlarm,
    updateAlarm,
    resolveAlarm,
    reopenAlarm,
  }
}
