import { computed, ref } from "vue"

import { readJsonStorage, writeJsonStorage } from "../storage/browserStorage.js"

export const AUDIT_LOG_STORAGE_KEY = "sinergy-audit-log"

const MAX_AUDIT_RECORDS = 700

const createAuditId = () => {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const minutesAgo = (minutes) => {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

const initialAuditRecords = [
  {
    id: "audit-seed-001",
    timestamp: minutesAgo(8),
    actorId: "user-001",
    actorName: "Administrador Principal",
    companyId: "company-003",
    companyName: "Constructora Norte",
    module: "activos",
    action: "workspace:update",
    entityType: "espacio de trabajo",
    entityName: "Vista operacion norte",
    status: "success",
    severity: "info",
    description: "Se actualizo la configuracion visual del espacio de trabajo.",
  },
  {
    id: "audit-seed-002",
    timestamp: minutesAgo(34),
    actorId: "user-003",
    actorName: "Supervisor Territorial",
    companyId: "company-001",
    companyName: "Transportes San Pedro",
    module: "reportes",
    action: "report:generate",
    entityType: "reporte",
    entityName: "Reporte de viajes",
    status: "success",
    severity: "info",
    description: "Se genero un reporte operativo para la flota seleccionada.",
  },
  {
    id: "audit-seed-003",
    timestamp: minutesAgo(92),
    actorId: "user-001",
    actorName: "Administrador Principal",
    companyId: "company-001",
    companyName: "Transportes San Pedro",
    module: "usuarios",
    action: "permissions:update",
    entityType: "usuario",
    entityName: "Supervisor Territorial",
    status: "success",
    severity: "warning",
    description: "Se modificaron permisos de acceso a funciones del sistema.",
  },
]

const normalizeText = (value, fallback = "") => {
  const text = String(value ?? "").trim()

  return text || fallback
}

const normalizeAuditRecord = (entry = {}) => {
  return {
    id: normalizeText(entry.id, createAuditId()),
    timestamp: normalizeText(entry.timestamp, new Date().toISOString()),
    actorId: normalizeText(entry.actorId, "system"),
    actorName: normalizeText(entry.actorName, "Sistema"),
    companyId: normalizeText(entry.companyId, ""),
    companyName: normalizeText(entry.companyName, "Plataforma"),
    module: normalizeText(entry.module, "sistema"),
    action: normalizeText(entry.action, "activity"),
    entityType: normalizeText(entry.entityType, "registro"),
    entityName: normalizeText(entry.entityName, "Sin detalle"),
    status: normalizeText(entry.status, "success"),
    severity: normalizeText(entry.severity, "info"),
    description: normalizeText(entry.description, "Actividad registrada."),
    metadata: entry.metadata && typeof entry.metadata === "object" ? entry.metadata : {},
  }
}

const readAuditRecords = () => {
  const storedRecords = readJsonStorage(AUDIT_LOG_STORAGE_KEY, null)

  if (Array.isArray(storedRecords)) {
    return storedRecords.map(normalizeAuditRecord)
  }

  return initialAuditRecords.map(normalizeAuditRecord)
}

const auditRecords = ref(readAuditRecords())

const persistAuditRecords = () => {
  writeJsonStorage(AUDIT_LOG_STORAGE_KEY, auditRecords.value)
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== AUDIT_LOG_STORAGE_KEY) return

    auditRecords.value = readAuditRecords()
  })
}

export const appendAuditLog = (entry = {}) => {
  const record = normalizeAuditRecord(entry)

  auditRecords.value = [record, ...auditRecords.value].slice(0, MAX_AUDIT_RECORDS)
  persistAuditRecords()

  return record
}

export const clearAuditLog = () => {
  auditRecords.value = []
  persistAuditRecords()
}

export const resetAuditLog = () => {
  auditRecords.value = initialAuditRecords.map(normalizeAuditRecord)
  persistAuditRecords()
}

export const useAuditService = () => {
  return {
    auditRecords: computed(() => auditRecords.value),
    appendAuditLog,
    clearAuditLog,
    resetAuditLog,
  }
}
