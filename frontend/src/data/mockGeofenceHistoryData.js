const buildVehiclePool = (activos = []) => {
  return activos.map((activo) => ({
    patent: activo.patente || activo.patent || "Sin patente",
    vehicle: activo.vehiculo || activo.name || "Activo",
    driver: activo.conductor || "Sin conductor",
  }))
}

const baseEvents = [
  {
    eventType: "entry",
    eventLabel: "Entrada",
    time: "08:14",
    speed: 31,
    duration: "22 min",
  },
  {
    eventType: "pass",
    eventLabel: "Paso",
    time: "09:02",
    speed: 44,
    duration: "-",
  },
  {
    eventType: "exit",
    eventLabel: "Salida",
    time: "10:36",
    speed: 28,
    duration: "41 min",
  },
  {
    eventType: "entry",
    eventLabel: "Entrada",
    time: "12:18",
    speed: 19,
    duration: "1 h 08 min",
  },
  {
    eventType: "exit",
    eventLabel: "Salida",
    time: "13:26",
    speed: 36,
    duration: "1 h 08 min",
  },
  {
    eventType: "pass",
    eventLabel: "Paso",
    time: "15:44",
    speed: 52,
    duration: "-",
  },
  {
    eventType: "entry",
    eventLabel: "Entrada",
    time: "17:05",
    speed: 24,
    duration: "16 min",
  },
  {
    eventType: "exit",
    eventLabel: "Salida",
    time: "17:21",
    speed: 32,
    duration: "16 min",
  },
]

const getGeofenceTypeText = (type) => {
  if (type === "circle") return "zona circular"
  if (type === "route") return "ruta definida"
  if (type === "polygon") return "zona poligonal"

  return "geocerca"
}

const getGeofenceSeed = (geofence) => {
  const rawId = String(geofence?.id || geofence?.name || "1")
  const seed = rawId.split("").reduce((total, character) => total + character.charCodeAt(0), 0)

  return seed || 1
}

export const buildMockGeofenceHistory = (geofence, activos = []) => {
  if (!geofence) return []

  const vehiclePool = buildVehiclePool(activos)

  if (!vehiclePool.length) return []

  const seed = getGeofenceSeed(geofence)
  const typeText = getGeofenceTypeText(geofence.type)
  const geofenceName = geofence.name || "Geocerca"

  return baseEvents.map((event, index) => {
    const vehicleIndex = (seed + index) % vehiclePool.length
    const vehicle = vehiclePool[vehicleIndex]
    const speedVariation = seed % 7

    return {
      id: `${geofence.id || "geofence"}-${index + 1}`,
      geofenceId: geofence.id,
      patent: vehicle.patent,
      vehicle: vehicle.vehicle,
      driver: vehicle.driver,
      eventType: event.eventType,
      eventLabel: event.eventLabel,
      date: `2026-05-25 ${event.time}`,
      speed: event.speed + speedVariation,
      duration: event.duration,
      address: `${event.eventLabel} en ${geofenceName}`,
      detail: `Vehículo detectado en la ${typeText}: ${geofenceName}.`,
    }
  })
}
