import { DEFAULT_MAINTENANCE_TYPE_READING_SOURCES } from "./maintenanceModuleConfig.js"

export const migrateMaintenanceReadingSource = (record, { plan = false } = {}) => {
  if (record.readingSourceLabel !== "Valor manual") return record
  const readingSourceLabel = DEFAULT_MAINTENANCE_TYPE_READING_SOURCES[record.type || record.name || record.job] || "Odometro"
  const migrated = { ...record, readingSourceLabel, intervalLabel: "Sin configurar" }
  if (!plan) return migrated
  return { ...migrated, status: "unconfigured", intervalValue: "", alertValue: "",
    alertLabel: "Alerta no configurada", nextLabel: "Sin configurar", remainingLabel: "Intervalo no configurado", summaryLabel: "Intervalo no configurado" }
}
