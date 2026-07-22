export const normalizeClusterValue = (value) => {
  if (value === null || value === undefined) return ""

  return String(value)
}

export const normalizeActivoId = (activo) => {
  return String(activo?.id ?? "")
}

export const isValidClusterLatLng = (activoLatLng) => {
  return (
    Array.isArray(activoLatLng) &&
    Number.isFinite(Number(activoLatLng[0])) &&
    Number.isFinite(Number(activoLatLng[1]))
  )
}
