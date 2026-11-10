const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export const validateMaintenanceOrderStep = (draft, step) => {
  if (step === 1) {
    if (!draft.vehicleId || !draft.maintenancePlanId) return 'Selecciona un vehiculo y un plan de mantencion.'
    if (!String(draft.job || '').trim()) return 'Ingresa el titulo del trabajo.'
    if (!['Alta', 'Media', 'Baja'].includes(draft.priority)) return 'Selecciona la prioridad.'
  }
  if (step === 2) {
    if (!validDate(draft.plannedStartDate)) return 'Ingresa una fecha planificada valida.'
    if (draft.scheduledDate && (!validDate(draft.scheduledDate) || draft.scheduledDate < draft.plannedStartDate)) return 'La fecha limite no puede ser anterior a la fecha planificada.'
    if (!String(draft.owner || '').trim() || !String(draft.workshop || '').trim()) return 'Completa el responsable y el taller.'
  }
  if (step === 3) return validateMaintenanceOrderStep(draft, 1) || validateMaintenanceOrderStep(draft, 2)
  return ''
}
