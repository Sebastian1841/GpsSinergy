export const LIMIT_TYPES = [
  { id: "bus", label: "Bus", speed: 100, idle: 3.49 },
  { id: "car", label: "Auto", speed: 120, idle: 1.2 },
  { id: "pickup", label: "Camioneta", speed: 120, idle: 1.8 },
  { id: "trailer", label: "Remolque", speed: 90, idle: 3.49 },
  { id: "truck", label: "Cami\u00f3n", speed: 90, idle: 3.49 },
  { id: "van", label: "Furg\u00f3n", speed: 120, idle: 1.8 },
  { id: "machinery", label: "Maquinaria", speed: 90, idle: 5 },
  { id: "other", label: "Otro", speed: 90, idle: 2 },
  { id: "motorcycle", label: "Moto", speed: 120, idle: 1.2 },
]
export const IDLE_TYPE_ORDER = [
  "truck",
  "bus",
  "car",
  "pickup",
  "van",
  "machinery",
  "trailer",
  "other",
  "motorcycle",
]
const typeIds = new Set(LIMIT_TYPES.map((type) => type.id))
export const limitAssetType = (asset) => {
  const type = asset.assetType || asset.tipoActivo
  return typeIds.has(type) ? type : null
}
export const limitsStorageKey = (companyId = "") =>
  `sinergy-configuration-limits-v1:${companyId ? `company:${companyId}` : "platform"}`

export function readLimitsConfiguration(read, companyId = "") {
  const raw = read(limitsStorageKey(companyId))
  if (raw === null) return { speed: {}, idle: {} }
  const value = JSON.parse(raw)
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !value.speed ||
    !value.idle ||
    typeof value.speed !== "object" ||
    typeof value.idle !== "object" ||
    Array.isArray(value.speed) ||
    Array.isArray(value.idle)
  )
    throw Error("No se pudo leer la configuracion guardada.")
  for (const kind of ["speed", "idle"]) {
    for (const [id, number] of Object.entries(value[kind])) {
      if (
        !typeIds.has(id) ||
        typeof number !== "number" ||
        !Number.isFinite(number) ||
        number < (kind === "speed" ? 1 : 0) ||
        number > (kind === "speed" ? 300 : 100) ||
        (kind === "speed" && !Number.isInteger(number))
      )
        throw Error("La configuracion guardada contiene valores invalidos.")
    }
  }
  if (value.notes !== undefined) {
    if (!value.notes || typeof value.notes !== "object" || Array.isArray(value.notes))
      throw Error("Los motivos guardados no son validos.")
    for (const [kind, notes] of Object.entries(value.notes)) {
      if (!["speed", "idle"].includes(kind) || !notes || typeof notes !== "object" || Array.isArray(notes))
        throw Error("Los motivos guardados no son validos.")
      for (const [id, note] of Object.entries(notes)) {
        if (!typeIds.has(id) || typeof note !== "string" || note.length > 500)
          throw Error("El motivo debe tener como maximo 500 caracteres.")
      }
    }
  }
  return value
}

export function saveLimit({ read, write, companyId = "", kind, type, raw, canEdit }) {
  if (!canEdit()) throw Error("No tienes permiso para modificar estos limites.")
  if (!["speed", "idle"].includes(kind) || !typeIds.has(type)) throw Error("Limite desconocido.")
  const text = String(raw).trim().replace(",", ".")
  const number = Number(text)
  if (
    text &&
    (!Number.isFinite(number) ||
      number < (kind === "speed" ? 1 : 0) ||
      number > (kind === "speed" ? 300 : 100) ||
      (kind === "speed" && !Number.isInteger(number)))
  ) {
    throw Error(
      kind === "speed"
        ? "Ingresa una velocidad entera entre 1 y 300 km/h."
        : "Ingresa un consumo entre 0 y 100 L/h.",
    )
  }
  const next = readLimitsConfiguration(read, companyId)
  if (text) next[kind][type] = number
  else delete next[kind][type]
  if (!write(limitsStorageKey(companyId), JSON.stringify(next)))
    throw Error("No se pudo guardar el cambio. Intenta nuevamente.")
  return next
}

export const sameLimits = (a, b) =>
  ["speed", "idle"].every((kind) =>
    LIMIT_TYPES.every((type) => a[kind][type.id] === b[kind][type.id] &&
      (a.notes?.[kind]?.[type.id] || "") === (b.notes?.[kind]?.[type.id] || "")),
  )

export function saveLimitsConfiguration({ read, write, companyId = "", draft, expected, canEdit }) {
  if (!canEdit()) throw Error("No tienes permiso para modificar estos limites.")
  const current = readLimitsConfiguration(read, companyId)
  if (!sameLimits(current, expected))
    throw Error("Los limites cambiaron en otra ventana. Recarga antes de guardar.")
  const next = readLimitsConfiguration(() => JSON.stringify(draft))
  if (!write(limitsStorageKey(companyId), JSON.stringify(next)))
    throw Error("No se pudieron guardar los cambios. Intenta nuevamente.")
  return next
}
