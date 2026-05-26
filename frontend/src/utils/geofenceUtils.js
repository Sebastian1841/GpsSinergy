const DEFAULT_GEOFENCE_COLOR = "#FF6600"

export const getGeofenceColor = (geofence) => {
  return geofence?.strokeColor || geofence?.color || DEFAULT_GEOFENCE_COLOR
}

export const getGeofenceMeta = (geofence) => {
  if (geofence?.type === "circle") {
    return `Circular · ${geofence.radius || 0} m`
  }

  if (geofence?.type === "route") {
    return `Ruta · ${geofence.coordinates?.length || 0} puntos`
  }

  return `Poligonal · ${geofence?.coordinates?.length || 0} puntos`
}

export const getGeofenceBadgeLabel = (geofence) => {
  if (geofence?.type === "circle") return "Radio"
  if (geofence?.type === "route") return "Ruta"

  return "Polígono"
}

export const getGeofenceBadgeClass = (geofence) => {
  if (geofence?.type === "circle") {
    return "bg-[#eef3ff] text-[#102372]"
  }

  if (geofence?.type === "route") {
    return "bg-emerald-50 text-emerald-700"
  }

  return "bg-[#fff3eb] text-[#FF6600]"
}

export const getGeofenceDescription = (geofence) => {
  if (geofence?.type === "circle") {
    return "Permite editar centro, radio, nombre y colores."
  }

  if (geofence?.type === "route") {
    return "Permite editar puntos del recorrido, nombre y color."
  }

  return "Permite editar puntos del perímetro, nombre y colores."
}
