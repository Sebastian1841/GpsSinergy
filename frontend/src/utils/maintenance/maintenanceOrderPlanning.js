import { parseMaintenanceOrderDate } from "./maintenanceOrderSummary.js"

export const toOrderPlanningDate = (value) => {
  const date = parseMaintenanceOrderDate(value)
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : ""
}

export const validateOrderPlanning = (draft) => {
  const valid = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "") && toOrderPlanningDate(value) === value
  if (!valid(draft.scheduledDate)) return "Ingresa una fecha limite valida."
  if (draft.plannedStartDate && !valid(draft.plannedStartDate)) return "Ingresa una fecha de inicio valida."
  if (draft.plannedStartDate && draft.plannedStartDate > draft.scheduledDate) return "El inicio planificado no puede ser posterior a la fecha limite."
  if (draft.scheduledTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.scheduledTime)) return "Ingresa una hora valida."
  if (!String(draft.owner || "").trim() || !String(draft.workshop || "").trim()) return "Completa responsable y taller/proveedor."
  return ""
}
