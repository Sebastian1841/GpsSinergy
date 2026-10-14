import { shallowRef } from "vue"
import {
  canReadSupportRequest,
  canManageSupportRequest,
  SUPPORT_TYPES,
  SUPPORT_STATUSES,
  supportStatusLabel,
} from "../../utils/support/supportRequestUtils.js"

export const createSupportRequestStore = ({
  read,
  write,
  createId = () => crypto.randomUUID(),
  now = () => new Date().toISOString(),
}) => {
  const initial = read()
  const requests = shallowRef(
    Array.isArray(initial)
      ? initial.filter(
          (item) =>
            item && typeof item.id === "string" && item.companyId && Array.isArray(item.messages),
        )
      : [],
  )
  const commit = (next) => {
    if (!write(next))
      throw new Error(
        "No se pudo guardar. Revisa el almacenamiento del navegador e intenta nuevamente.",
      )
    requests.value = next
  }
  const requireRequest = (id, context) => {
    const request = requests.value.find((item) => item.id === id)
    if (!request || !canReadSupportRequest(request, context))
      throw new Error("No tienes acceso a esta solicitud.")
    return request
  }
  const message = (context, text, attachments = [], kind = "reply") => ({
    id: createId(),
    authorId: context.user.id,
    author: context.user.name || context.user.email || "Usuario",
    createdAt: now(),
    text,
    attachments,
    kind,
  })
  const create = (data, context) => {
    if (!canReadSupportRequest(data, context)) throw new Error("Selecciona una empresa autorizada.")
    const subject = String(data.subject || "").trim(),
      description = String(data.description || "").trim()
    if (
      !subject ||
      subject.length > 120 ||
      !description ||
      description.length > 5000 ||
      !SUPPORT_TYPES.includes(data.type)
    )
      throw new Error("Completa tipo, asunto y descripcion dentro de los limites permitidos.")
    if (data.vehicleId && !context.assetIds.map(String).includes(String(data.vehicleId)))
      throw new Error("El vehiculo no esta autorizado.")
    const id = createId(),
      date = now()
    const request = {
      id,
      number: `SOP-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      companyId: String(data.companyId),
      company: data.company,
      vehicleId: data.vehicleId || "",
      plate: data.plate || "",
      type: data.type,
      subject,
      status: "received",
      createdAt: date,
      updatedAt: date,
      createdBy: context.user.id,
      creator: context.user.name,
      assigneeId: "",
      assignee: "",
      scheduledAt: "",
      messages: [message(context, description, data.attachments || [])],
    }
    commit([request, ...requests.value])
    return id
  }
  const reply = (id, text, attachments, context) => {
    const request = requireRequest(id, context)
    const content = String(text || "").trim()
    if ((!content && !attachments.length) || content.length > 5000)
      throw new Error("Escribe una respuesta o adjunta un archivo (maximo 5000 caracteres).")
    const changed = {
      ...request,
      updatedAt: now(),
      status: request.status === "resolved" ? "received" : request.status,
      messages: [
        ...request.messages,
        ...(request.status === "resolved"
          ? [message(context, "Solicitud reabierta", [], "event")]
          : []),
        message(context, content, attachments),
      ],
    }
    commit(requests.value.map((item) => (item.id === id ? changed : item)))
  }
  const update = (id, data, context) => {
    const request = requireRequest(id, context)
    if (!canManageSupportRequest(request, context))
      throw new Error("No tienes permiso para gestionar esta solicitud.")
    if (!SUPPORT_STATUSES.some((item) => item.id === data.status))
      throw new Error("Estado no valido.")
    if (
      data.status === "scheduled" &&
      (!data.scheduledAt || Number.isNaN(Date.parse(data.scheduledAt)))
    )
      throw new Error("Indica una fecha de atencion valida.")
    if (data.assigneeId && !context.assigneeIds.map(String).includes(String(data.assigneeId)))
      throw new Error("Responsable no autorizado.")
    const events = []
    if (request.status !== data.status)
      events.push(message(context, `Estado: ${supportStatusLabel(data.status)}`, [], "event"))
    if (request.assigneeId !== data.assigneeId)
      events.push(message(context, `Responsable: ${data.assignee || "Sin asignar"}`, [], "event"))
    if (request.scheduledAt !== (data.scheduledAt || ""))
      events.push(
        message(context, `Fecha de atencion: ${data.scheduledAt || "Sin fecha"}`, [], "event"),
      )
    const changed = {
      ...request,
      status: data.status,
      assigneeId: data.assigneeId || "",
      assignee: data.assignee || "",
      scheduledAt: data.scheduledAt || "",
      updatedAt: now(),
      messages: [...request.messages, ...events],
    }
    commit(requests.value.map((item) => (item.id === id ? changed : item)))
  }
  return { requests, create, reply, update, requireRequest }
}
