export const SUPPORT_TYPES = [
  "Instalacion de GPS",
  "Retiro o traslado",
  "Falla tecnica",
  "Consulta",
]
export const SUPPORT_STATUSES = [
  { id: "received", label: "Recibida" },
  { id: "review", label: "En revision" },
  { id: "waiting", label: "Esperando al cliente" },
  { id: "scheduled", label: "Agendada" },
  { id: "resolved", label: "Resuelta" },
]
export const canReadSupportRequest = (request, context) =>
  Boolean(context.user?.id && context.companyIds.map(String).includes(String(request.companyId)))
export const canManageSupportRequest = (request, context) =>
  canReadSupportRequest(request, context) &&
  (context.user.isPlatformAdmin ||
    context.technicianCompanyIds.map(String).includes(String(request.companyId)))
export const validateSupportFiles = (files) => {
  if (files.length > 5) throw new Error("Puedes adjuntar hasta 5 archivos por mensaje.")
  for (const file of files) {
    if (!/\.(pdf|png|jpe?g|webp|txt)$/i.test(file.name))
      throw new Error("Solo se permiten PDF, imagenes PNG/JPG/WebP y archivos TXT.")
    if (file.size > 10 * 1024 * 1024) throw new Error("Cada archivo debe pesar como maximo 10 MB.")
  }
}
export const supportStatusLabel = (id) =>
  SUPPORT_STATUSES.find((item) => item.id === id)?.label || id
