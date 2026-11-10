const openStatuses = new Set(["scheduled", "in-progress", "waiting"])

export const getFleetPlanSummary = (plans) => {
  const summary = { withoutOrder: 0, withOpenOrder: 0, renewal: 0, unconfigured: 0 }
  for (const plan of plans) {
    if (plan.orderState === "pending-renewal" || plan.status === "renewal-pending") summary.renewal++
    else if (plan.order && openStatuses.has(plan.order.status)) summary.withOpenOrder++
    else if (["due", "overdue"].includes(plan.status)) summary.withoutOrder++
    else if (plan.status === "unconfigured") summary.unconfigured++
  }
  return summary
}

export const getFleetVehicleAction = (plans) => {
  if (!plans.length) return { label: "Configurar mantencion", mode: "configure", attention: false }

  let renewals = 0
  let withoutOrder = 0
  let unconfigured = 0
  const orders = new Map()
  for (const plan of plans) {
    const openOrder = plan.order && openStatuses.has(plan.order.status)
    if (plan.orderState === "pending-renewal" || plan.status === "renewal-pending") {
      renewals++
    } else if (openOrder) {
      orders.set(plan.order.id, plan.order)
    } else if (["due", "overdue"].includes(plan.status)) {
      withoutOrder++
    } else if (plan.status === "unconfigured") {
      unconfigured++
    }
  }

  const pending = renewals + withoutOrder + unconfigured
  let label = "Ver planes"
  if (
    withoutOrder ||
    (pending && [renewals, withoutOrder, unconfigured].filter(Boolean).length > 1)
  ) {
    label = `Revisar ${pending} ${pending === 1 ? "pendiente" : "pendientes"}`
  } else if (renewals) {
    label = renewals === 1 ? "Revisar renovacion" : `Revisar ${renewals} renovaciones`
  } else if (unconfigured) {
    label = "Revisar configuracion"
  } else if (orders.size) {
    if (orders.size > 1) {
      return { label: `Ver ${orders.size} OT`, mode: "expand", attention: false }
    }
    const { status } = orders.values().next().value
    label = status === "scheduled" ? "Ver OT programada"
      : status === "waiting" ? "Ver trabajo en espera" : "Ver trabajo en curso"
  }

  if (!pending && orders.size === 1) {
    return { label, mode: "order", orderId: orders.keys().next().value, attention: false }
  }
  return { label, mode: "expand", attention: pending > 0 }
}
