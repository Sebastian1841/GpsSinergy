import { ref, watch } from "vue"

const STORAGE_KEY = "sinergy-activos-geofences"
const STORAGE_VERSION = 1

const VALID_GEOFENCE_TYPES = new Set([
  "circle",
  "polygon",
  "route",
])

const DEFAULT_STROKE_COLOR = "#FF6600"
const DEFAULT_FILL_COLOR = "#FF6600"
const DEFAULT_FILL_OPACITY = 0.12

const canUseLocalStorage = () => {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

const normalizeGeofenceId = (id) => {
  return String(id ?? "")
}

const isFiniteNumber = (value) => {
  return Number.isFinite(Number(value))
}

const normalizeNumber = (value, fallback = 0) => {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : fallback
}

const normalizePoint = (point) => {
  if (!point) return null

  const lat = normalizeNumber(point.lat, null)
  const lng = normalizeNumber(point.lng, null)

  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null

  return {
    lat,
    lng,
  }
}

const normalizeCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates)) return []

  return coordinates
    .map((point) => normalizePoint(point))
    .filter(Boolean)
}

const normalizeColor = (value, fallback) => {
  if (typeof value !== "string") return fallback

  const color = value.trim()

  return color || fallback
}

const normalizeGeofence = (geofence) => {
  if (!geofence || typeof geofence !== "object") return null

  const id = geofence.id
  const type = geofence.type

  if (!id) return null
  if (!VALID_GEOFENCE_TYPES.has(type)) return null

  const strokeColor = normalizeColor(
    geofence.strokeColor || geofence.color,
    DEFAULT_STROKE_COLOR,
  )

  const baseGeofence = {
    ...geofence,
    id,
    type,
    name: String(geofence.name || "Geocerca sin nombre").trim() || "Geocerca sin nombre",
    strokeColor,
    color: strokeColor,
    fillColor: normalizeColor(geofence.fillColor, strokeColor || DEFAULT_FILL_COLOR),
    fillOpacity: normalizeNumber(geofence.fillOpacity, DEFAULT_FILL_OPACITY),
  }

  if (type === "circle") {
    const center = normalizePoint(geofence.center)
    const radius = normalizeNumber(geofence.radius, 0)

    if (!center) return null
    if (radius <= 0) return null

    return {
      ...baseGeofence,
      center,
      radius,
    }
  }

  if (type === "polygon") {
    const coordinates = normalizeCoordinates(geofence.coordinates)

    if (coordinates.length < 3) return null

    return {
      ...baseGeofence,
      coordinates,
    }
  }

  if (type === "route") {
    const coordinates = normalizeCoordinates(geofence.coordinates)

    if (coordinates.length < 2) return null

    return {
      ...baseGeofence,
      fillColor: undefined,
      coordinates,
      toleranceMeters: normalizeNumber(geofence.toleranceMeters, 100),
    }
  }

  return null
}

const normalizeGeofences = (geofences) => {
  if (!Array.isArray(geofences)) return []

  return geofences
    .map((geofence) => normalizeGeofence(geofence))
    .filter(Boolean)
}

const readStoredPayload = () => {
  if (!canUseLocalStorage()) return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) return null

    return JSON.parse(raw)
  } catch {
    return null
  }
}

const readStoredGeofences = () => {
  const payload = readStoredPayload()

  if (!payload) return []

  // Formato viejo:
  // [
  //   { id, type, ... }
  // ]
  if (Array.isArray(payload)) {
    return normalizeGeofences(payload)
  }

  // Formato nuevo:
  // {
  //   version: 1,
  //   geofences: []
  // }
  if (payload.version === STORAGE_VERSION) {
    return normalizeGeofences(payload.geofences)
  }

  return []
}

const persistGeofences = (geofences) => {
  if (!canUseLocalStorage()) return

  try {
    const payload = {
      version: STORAGE_VERSION,
      geofences: normalizeGeofences(geofences),
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Mantiene la app funcionando aunque localStorage falle.
  }
}

export function useGeofences() {
  const geofences = ref(readStoredGeofences())

  const updateGeofence = (updatedGeofence) => {
    if (!updatedGeofence?.id) return

    geofences.value = geofences.value.map((geofence) => {
      if (normalizeGeofenceId(geofence.id) !== normalizeGeofenceId(updatedGeofence.id)) {
        return geofence
      }

      const mergedGeofence = {
        ...geofence,
        ...updatedGeofence,
      }

      return normalizeGeofence(mergedGeofence) || geofence
    })
  }

  const createGeofence = (geofence) => {
    const normalizedGeofence = normalizeGeofence(geofence)

    if (!normalizedGeofence) return

    const exists = geofences.value.some((item) => {
      return normalizeGeofenceId(item.id) === normalizeGeofenceId(normalizedGeofence.id)
    })

    if (exists) {
      updateGeofence(normalizedGeofence)
      return
    }

    geofences.value = [
      ...geofences.value,
      normalizedGeofence,
    ]
  }

  const deleteGeofence = (geofenceId) => {
    geofences.value = geofences.value.filter((geofence) => {
      return normalizeGeofenceId(geofence.id) !== normalizeGeofenceId(geofenceId)
    })
  }

  const clearGeofences = () => {
    geofences.value = []
  }

  watch(geofences, (nextGeofences) => {
    persistGeofences(nextGeofences)
  })

  return {
    geofences,
    createGeofence,
    updateGeofence,
    deleteGeofence,
    clearGeofences,
  }
}