export const getMaintenanceSummaryMetricCardClass = (metric, selectedStatus) => {
  const isActive = metric.filter && selectedStatus === metric.filter

  if (isActive) return "border-[#ff6600] ring-2 ring-[#ff6600]/10"

  if (metric.key === "current") return "border-emerald-100"
  if (metric.key === "due") return "border-amber-100"
  if (metric.key === "overdue") return "border-rose-100"
  if (metric.key === "workshop") return "border-blue-100"

  return "border-[#dfe5ed]"
}

export const getSummaryMetricIcon = (status) => {
  if (status === "current") return "ok"
  if (status === "due") return "mantenciones"
  if (status === "overdue") return "vencida"
  if (status === "unconfigured") return "configuracion"
  if (status === "workshop") return "llave"

  return "mantenciones"
}

export const getWorkOrderSummaryMetricClass = (metric, selectedOrderStatus) => {
  const isActive = metric.filter && selectedOrderStatus === metric.filter

  if (isActive) return "border-[#ff6600] ring-2 ring-[#ff6600]/10"
  if (metric.key === "scheduled") return "border-blue-100"
  if (metric.key === "in-progress") return "border-orange-100"
  if (metric.key === "waiting") return "border-slate-200"
  if (metric.key === "finished") return "border-emerald-100"
  if (metric.key === "cancelled") return "border-rose-100"

  return "border-[#dfe5ed]"
}

export const getOrderStatusIcon = (status) => {
  if (status === "in-progress") return "llave"
  if (status === "waiting") return "mantenciones"
  if (status === "finished") return "ok"
  if (status === "cancelled") return "close"

  return "mantenciones"
}

export const getOrderStatusIconClass = (status) => {
  if (status === "scheduled") return "bg-blue-500"
  if (status === "in-progress") return "bg-[#ff6600]"
  if (status === "waiting") return "bg-slate-400"
  if (status === "finished") return "bg-emerald-500"
  if (status === "cancelled") return "bg-rose-500"

  return "bg-slate-400"
}

export const getStatusLabel = (status) => {
  if (status === "current") return "Al dia"
  if (status === "due") return "Proxima"
  if (status === "overdue") return "Vencida"
  if (status === "unconfigured") return "Sin configurar"
  if (status === "workshop") return "En taller"

  return "Sin estado"
}

export const getStatusClass = (status) => {
  if (status === "current") return "bg-emerald-50 text-emerald-700"
  if (status === "due") return "bg-amber-50 text-amber-700"
  if (status === "overdue") return "bg-rose-50 text-rose-700"
  if (status === "unconfigured") return "bg-slate-100 text-slate-600"
  if (status === "workshop") return "bg-blue-50 text-blue-700"

  return "bg-slate-100 text-slate-600"
}

export const getMaintenancePlanPillClass = (status) => {
  if (status === "current") return "bg-emerald-600 text-white"
  if (status === "due") return "bg-[#0f7cff] text-white"
  if (status === "overdue") return "bg-rose-600 text-white"
  if (status === "workshop") return "bg-blue-600 text-white"

  return "bg-slate-200 text-slate-700"
}

export const getMaintenancePlanStatusClass = (status) => {
  if (status === "current") return "text-emerald-700"
  if (status === "due") return "text-amber-700"
  if (status === "overdue") return "text-rose-700"
  if (status === "workshop") return "text-blue-700"

  return "text-slate-600"
}

export const getMaintenancePlanStatusMessage = (status) => {
  if (status === "current") return "Al dia"
  if (status === "due") return "Requiere revision"
  if (status === "overdue") return "Requiere mantencion"
  if (status === "workshop") return "En taller"
  if (status === "unconfigured") return "Sin configurar"

  return "Sin estado"
}

export const getStatusTextClass = (status) => {
  if (status === "overdue") return "text-rose-600"
  if (status === "due") return "text-amber-600"
  if (status === "workshop") return "text-blue-600"

  return "text-slate-500"
}

export const getStatusIconClass = (status) => {
  if (status === "current") return "bg-emerald-500"
  if (status === "due") return "bg-amber-500"
  if (status === "overdue") return "bg-rose-500"
  if (status === "workshop") return "bg-blue-500"

  return "bg-slate-400"
}

export const getOrderStatusLabel = (status) => {
  if (status === "scheduled") return "Programada"
  if (status === "in-progress") return "En proceso"
  if (status === "waiting") return "En espera"
  if (status === "finished") return "Finalizada"
  if (status === "cancelled") return "Cancelada"

  return "Sin estado"
}

export const getOrderStatusClass = (status) => {
  if (status === "scheduled") return "bg-blue-50 text-blue-700"
  if (status === "in-progress") return "bg-orange-50 text-[#ff6600]"
  if (status === "waiting") return "bg-slate-100 text-slate-600"
  if (status === "finished") return "bg-emerald-50 text-emerald-700"
  if (status === "cancelled") return "bg-rose-50 text-rose-700"

  return "bg-slate-100 text-slate-600"
}

export const getPriorityClass = (priority) => {
  if (priority === "Alta") return "bg-rose-50 text-rose-700"
  if (priority === "Media") return "bg-amber-50 text-amber-700"

  return "bg-emerald-50 text-emerald-700"
}

export const getTaskStatusClass = (status) => {
  if (status === "Completada") return "bg-emerald-50 text-emerald-700"
  if (status === "En proceso") return "bg-orange-50 text-[#ff6600]"

  return "bg-slate-100 text-slate-500"
}
