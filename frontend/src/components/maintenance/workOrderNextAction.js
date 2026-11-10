export const getWorkOrderNextAction = (status) => {
  if (status === "scheduled") return { label: "Iniciar trabajo", modal: "assign-order", status: "in-progress" }
  if (status === "waiting") return { label: "Reanudar trabajo", modal: "assign-order", status: "in-progress" }
  if (status === "in-progress") return { label: "Cerrar OT", modal: "close-order", status: "finished" }
  return null
}
