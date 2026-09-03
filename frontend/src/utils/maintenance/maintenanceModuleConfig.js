export const MAINTENANCE_TABS = [
  { id: "overview", label: "Resumen" },
  { id: "orders", label: "Ordenes de trabajo" },
  { id: "calendar", label: "Calendario OT" },
  { id: "history", label: "Historial" },
  { id: "costs", label: "Costos y facturas" },
]

export const DEFAULT_MAINTENANCE_TYPES = [
  "Revision tecnica",
  "Permiso de circulacion",
  "Cambio de aceite y filtros",
  "Filtro de combustible",
  "Revision de frenos",
]

export const MAINTENANCE_READING_SOURCES = ["Odometro", "Horometro", "Fecha/Hora", "Valor manual"]

export const DEFAULT_MAINTENANCE_TYPE_READING_SOURCES = {
  "Cambio de aceite y filtros": "Odometro",
  "Filtro de combustible": "Horometro",
  "Permiso de circulacion": "Fecha/Hora",
  "Revision de frenos": "Odometro",
  "Revision tecnica": "Fecha/Hora",
}

export const MAINTENANCE_TYPE_CRITERION_OPTIONS = [
  {
    description: "Se activa segun kilometraje recorrido.",
    label: "Por odometro",
    value: "Odometro",
  },
  {
    description: "Se activa segun horas de uso del motor o equipo.",
    label: "Por horometro",
    value: "Horometro",
  },
  {
    description: "Se activa por fecha, vencimiento o frecuencia calendario.",
    label: "Por tiempo",
    value: "Fecha/Hora",
  },
]

export const MAINTENANCE_TEMPLATES = [
  {
    id: "revision-tecnica",
    description: "Control documental y tecnico segun normativa vigente.",
    interval: 365,
    name: "Revision tecnica",
    sourceLabel: "Fecha/Hora",
    warning: 30,
  },
  {
    id: "permiso-circulacion",
    description: "Control anual de permiso de circulacion y vencimiento.",
    interval: 365,
    name: "Permiso de circulacion",
    sourceLabel: "Fecha/Hora",
    warning: 30,
  },
  {
    id: "cambio-aceite",
    description: "Cambio de aceite, filtro y revision general de motor.",
    interval: 10000,
    name: "Cambio de aceite y filtros",
    sourceLabel: "Odometro",
    warning: 1000,
  },
  {
    id: "filtro-combustible",
    description: "Reemplazo de filtro y control de sistema de combustible.",
    interval: 450,
    name: "Filtro de combustible",
    sourceLabel: "Horometro",
    warning: 50,
  },
  {
    id: "revision-frenos",
    description: "Inspeccion de frenos, pastillas, liquidos y respuesta de frenado.",
    interval: 15000,
    name: "Revision de frenos",
    sourceLabel: "Odometro",
    warning: 1500,
  },
]

export const MAINTENANCE_STATUS_FILTERS = [
  { value: "current", label: "Al dia", dotClass: "bg-emerald-500" },
  { value: "due", label: "Proximas", dotClass: "bg-amber-500" },
  { value: "overdue", label: "Vencidas", dotClass: "bg-rose-500" },
  { value: "unconfigured", label: "Sin configurar", dotClass: "bg-slate-400" },
  { value: "workshop", label: "En taller", dotClass: "bg-blue-500" },
]

export const WORK_ORDER_STATUS_FILTERS = [
  { value: "scheduled", label: "Programadas" },
  { value: "in-progress", label: "En proceso" },
  { value: "waiting", label: "En espera" },
  { value: "finished", label: "Finalizadas" },
  { value: "cancelled", label: "Canceladas" },
]

export const WORK_ORDER_PRIORITY_OPTIONS = ["Alta", "Media", "Baja"]

export const MAINTENANCE_WEEK_DAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]

export const MAINTENANCE_LIFECYCLE_STEPS = [
  { title: "Mantencion creada", detail: "Sistema - 06/08/2026 10:15", done: true },
  { title: "Alerta enviada", detail: "Sistema - 06/08/2026 10:16", done: true },
  { title: "Orden programada", detail: "Mecanica Vivar - 07/08/2026", done: true },
  { title: "Trabajo finalizado", detail: "Taller mecanico - 07/08/2026", done: true },
  { title: "Proximo ciclo generado", detail: "Sistema - 136.000 km", done: false },
]

export const MAINTENANCE_BASE_COST_ROWS = [
  {
    id: "cost-1",
    className: "bg-emerald-50 text-emerald-700",
    date: "24/05/2026",
    invoice: "F-12548",
    total: "$ 1.245.600",
    type: "Mantencion preventiva",
    workshop: "Mecanica Andina Ltda.",
  },
  {
    id: "cost-2",
    className: "bg-blue-50 text-blue-700",
    date: "12/04/2026",
    invoice: "F-12411",
    total: "$ 850.000",
    type: "Reparacion",
    workshop: "Diesel Norte SpA",
  },
  {
    id: "cost-3",
    className: "bg-orange-50 text-[#ff6600]",
    date: "18/03/2026",
    invoice: "F-12302",
    total: "$ 620.000",
    type: "Repuestos",
    workshop: "Repuestos y Cia.",
  },
]

export const MAINTENANCE_COST_FORM_FIELDS = [
  { label: "Tipo de costo", placeholder: "Selecciona tipo de costo" },
  { label: "Fecha", placeholder: "24/08/2026" },
  { label: "Taller / proveedor", placeholder: "Selecciona taller" },
  { label: "N de factura", placeholder: "Ingresa numero" },
  { label: "Monto total", placeholder: "$ 0" },
  { label: "Repuestos", placeholder: "$ 0" },
]

export const MAINTENANCE_MODAL_COPY_BY_TYPE = {
  maintenance: {
    action: "Crear mantencion",
    description:
      "Selecciona un tipo existente, el vehiculo y configura intervalo/alerta. La OT se crea aparte cuando haya ejecucion real.",
    kicker: "Plan de mantencion",
    title: "Nueva mantencion",
  },
  "maintenance-type": {
    action: "Crear tipo",
    description: "Define el nombre del tipo y si se controlara por odometro, horometro o tiempo.",
    kicker: "Catalogo de mantenciones",
    title: "Nuevo tipo de mantencion",
  },
  "edit-maintenance": {
    action: "Guardar cambios",
    description: "Actualiza la configuracion de esta mantencion sin crear una OT automaticamente.",
    kicker: "Plan de mantencion",
    title: "Editar mantencion",
  },
  "delete-maintenance": {
    action: "Eliminar mantencion",
    description:
      "Elimina la mantencion configurada del vehiculo. Las ordenes ya creadas quedan como historial.",
    kicker: "Plan de mantencion",
    title: "Eliminar mantencion",
  },
  "maintenance-detail": {
    action: "Ir a ordenes",
    description:
      "Revisa las mantenciones configuradas del vehiculo y genera una OT cuando requieran ejecucion.",
    kicker: "Mantenciones del vehiculo",
    title: "Detalle de mantenciones",
  },
  order: {
    action: "Crear orden",
    description: "Crea una ejecucion concreta; puede quedar asociada a una mantencion origen.",
    kicker: "Orden de trabajo",
    title: "Nueva orden de trabajo",
  },
  "edit-order": {
    action: "Guardar cambios",
    description: "Actualiza los datos principales de la orden seleccionada.",
    kicker: "Editar OT",
    title: "Modificar orden",
  },
  "reprogram-order": {
    action: "Reprogramar",
    description: "Ajusta la fecha, hora, taller o responsable de la orden seleccionada.",
    kicker: "Agenda",
    title: "Reprogramar orden",
  },
  "assign-order": {
    action: "Asignar",
    description: "Cambia responsable, taller, prioridad o estado operativo de la OT.",
    kicker: "Asignacion",
    title: "Asignar orden",
  },
  "cancel-order": {
    action: "Cancelar OT",
    description: "Marca la orden como cancelada y deja un motivo visible en el detalle.",
    kicker: "Cancelacion",
    title: "Cancelar orden",
  },
  "close-order": {
    action: "Cerrar OT",
    description: "Registra el trabajo realizado, costo, factura y proximo ciclo de mantencion.",
    kicker: "Cierre",
    title: "Registrar cierre",
  },
  cost: {
    action: "Guardar costo",
    description: "Agrega un costo documental al historial financiero del vehiculo seleccionado.",
    kicker: "Costos",
    title: "Registrar costo",
  },
  export: {
    action: "Preparar exportacion",
    description: "Simula la preparacion del archivo de salida con el alcance seleccionado.",
    kicker: "Exportacion",
    title: "Exportar mantenciones",
  },
}
