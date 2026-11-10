export const formatOrderDetailDate = (value) => {
  if (!value) return "Sin registro"
  const text = String(value)
  const calendar = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (calendar) return `${calendar[3]}-${calendar[2]}-${calendar[1]}`
  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(text)) return text.replaceAll("/", "-")
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? text : date.toLocaleString("es-CL", {
    timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  })
}

export const getOrderDetailEvents = (order) => {
  const audit = (order.audit || []).filter((event) => {
    // Legacy scheduling entries stored the target date, not the time of an action.
    const targetDate = /^programada$/i.test(String(event.action || "")) &&
      [order.plannedStartDate, order.scheduledDate].filter(Boolean).includes(event.at)
    return !targetDate
  })
  if (audit.length) return audit.map((event, index) => ({
    action: event.action || "Actualizacion", at: event.at || "", detail: event.detail || "",
    user: event.user || "", key: `audit-${index}`,
  }))
  return [
    { action: "OT creada", at: order.createdAt },
    { action: "Trabajo iniciado", at: order.startedAt },
    ...(order.status === "finished" ? [{ action: "OT cerrada", at: order.closedAt, user: order.closedBy }] : []),
    ...(order.status === "cancelled" ? [{ action: "OT cancelada", at: order.cancelledAt, user: order.cancelledBy }] : []),
  ].filter((event) => event.at).map((event, index) => ({ ...event, detail: "", key: `record-${index}` }))
}
