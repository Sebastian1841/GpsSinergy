import { computed, ref, unref, watch } from "vue"

import { readJsonStorage, writeJsonStorage } from "../../../services/storage/browserStorage.js"
import { getGeofenceColor, removeLegacyGeofenceColorFields } from "../../../utils/geofenceUtils.js"

const STORAGE_KEY = "sinergy-activos-geofences"
const STORAGE_VERSION = 1

const VALID_GEOFENCE_TYPES = new Set(["circle", "polygon", "route"])

const normalizeGeofenceId = (id) => {
  return String(id ?? "")
}

const normalizeGeofenceGroupName = (geofence = {}) => {
  return String(
    geofence.groupName || geofence.group || geofence.grupo || geofence.groupLabel || "",
  ).trim()
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

  return coordinates.map((point) => normalizePoint(point)).filter(Boolean)
}

const normalizeGeofence = (geofence) => {
  if (!geofence || typeof geofence !== "object") return null

  const id = geofence.id
  const type = geofence.type

  if (!id) return null
  if (!VALID_GEOFENCE_TYPES.has(type)) return null

  const color = getGeofenceColor(geofence)
  const cleanGeofence = removeLegacyGeofenceColorFields(geofence)

  const baseGeofence = {
    ...cleanGeofence,
    id,
    type,
    name: String(geofence.name || "Geocerca sin nombre").trim() || "Geocerca sin nombre",
    groupName: normalizeGeofenceGroupName(geofence),
    color,
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
      coordinates,
      toleranceMeters: normalizeNumber(geofence.toleranceMeters, 100),
    }
  }

  return null
}

const buildPointKey = (point) => {
  return `${Number(point?.lat || 0).toFixed(7)},${Number(point?.lng || 0).toFixed(7)}`
}

const buildCoordinatesKey = (coordinates = []) => {
  if (!Array.isArray(coordinates)) return ""

  return coordinates.map((point) => buildPointKey(point)).join("|")
}

const buildGeofenceDuplicateKey = (geofence) => {
  const baseKey = [
    String(geofence.companyId || ""),
    String(geofence.type || ""),
    String(geofence.name || "")
      .trim()
      .toLowerCase(),
  ]

  if (geofence.type === "circle") {
    return [
      ...baseKey,
      buildPointKey(geofence.center),
      Math.round(Number(geofence.radius) || 0),
    ].join("::")
  }

  return [...baseKey, buildCoordinatesKey(geofence.coordinates)].join("::")
}

const preferCompanyScopedGeofence = (currentGeofence, nextGeofence) => {
  const currentHasCompany = Boolean(currentGeofence?.companyId)
  const nextHasCompany = Boolean(nextGeofence?.companyId)

  if (nextHasCompany || !currentHasCompany) return nextGeofence

  return currentGeofence
}

const normalizeGeofences = (geofences) => {
  if (!Array.isArray(geofences)) return []

  const geofencesById = new Map()
  const geofencesByContent = new Map()

  geofences
    .map((geofence) => normalizeGeofence(geofence))
    .filter(Boolean)
    .forEach((geofence) => {
      const geofenceId = normalizeGeofenceId(geofence.id)
      const duplicateKey = buildGeofenceDuplicateKey(geofence)
      const previousGeofence = geofencesById.get(geofenceId)
      const previousDuplicateGeofence = geofencesByContent.get(duplicateKey)

      if (
        previousDuplicateGeofence &&
        normalizeGeofenceId(previousDuplicateGeofence.id) !== geofenceId
      ) {
        const nextGeofence = preferCompanyScopedGeofence(previousDuplicateGeofence, geofence)

        geofencesById.delete(normalizeGeofenceId(previousDuplicateGeofence.id))
        geofencesById.set(normalizeGeofenceId(nextGeofence.id), nextGeofence)
        geofencesByContent.set(duplicateKey, nextGeofence)
        return
      }

      if (!previousGeofence) {
        geofencesById.set(geofenceId, geofence)
        geofencesByContent.set(duplicateKey, geofence)
        return
      }

      const nextGeofence = preferCompanyScopedGeofence(previousGeofence, geofence)

      geofencesById.set(geofenceId, nextGeofence)
      geofencesByContent.set(duplicateKey, nextGeofence)
    })

  return Array.from(geofencesById.values())
}

const readStoredPayload = () => {
  return readJsonStorage(STORAGE_KEY, null)
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
  writeJsonStorage(STORAGE_KEY, {
    version: STORAGE_VERSION,
    geofences: normalizeGeofences(geofences),
  })
}

export function useGeofences({ companyId = "general" } = {}) {
  const allGeofences = ref(readStoredGeofences())
  const resolvedCompanyId = computed(() => String(unref(companyId) || "general"))

  persistGeofences(allGeofences.value)

  const migrateLegacyGeofencesToCompany = () => {
    const currentCompanyId = resolvedCompanyId.value

    if (!currentCompanyId || currentCompanyId === "general") return

    let migrated = false

    const nextGeofences = normalizeGeofences(
      allGeofences.value.map((geofence) => {
        if (String(geofence.companyId || "")) return geofence

        migrated = true

        return (
          normalizeGeofence({
            ...geofence,
            companyId: currentCompanyId,
          }) || geofence
        )
      }),
    )

    if (migrated || nextGeofences.length !== allGeofences.value.length) {
      allGeofences.value = nextGeofences
    }
  }

  const geofences = computed(() => {
    if (resolvedCompanyId.value === "general") return allGeofences.value

    return allGeofences.value.filter((geofence) => {
      return String(geofence.companyId || "") === resolvedCompanyId.value
    })
  })

  const updateGeofence = (updatedGeofence) => {
    if (!updatedGeofence?.id) return null

    const visibleGeofenceExists = geofences.value.some((geofence) => {
      return normalizeGeofenceId(geofence.id) === normalizeGeofenceId(updatedGeofence.id)
    })

    if (!visibleGeofenceExists) return null

    allGeofences.value = normalizeGeofences(
      allGeofences.value.map((geofence) => {
        if (normalizeGeofenceId(geofence.id) !== normalizeGeofenceId(updatedGeofence.id)) {
          return geofence
        }

        const mergedGeofence = {
          ...geofence,
          ...updatedGeofence,
        }

        return normalizeGeofence(mergedGeofence) || geofence
      }),
    )

    return (
      geofences.value.find((geofence) => {
        return normalizeGeofenceId(geofence.id) === normalizeGeofenceId(updatedGeofence.id)
      }) || null
    )
  }

  const createGeofence = (geofence) => {
    const normalizedGeofence = normalizeGeofence({
      ...geofence,
      companyId: resolvedCompanyId.value,
    })

    if (!normalizedGeofence) return null

    const exists = geofences.value.some((item) => {
      return normalizeGeofenceId(item.id) === normalizeGeofenceId(normalizedGeofence.id)
    })

    if (exists) {
      return updateGeofence(normalizedGeofence)
    }

    allGeofences.value = normalizeGeofences([...allGeofences.value, normalizedGeofence])

    return (
      geofences.value.find((item) => {
        return normalizeGeofenceId(item.id) === normalizeGeofenceId(normalizedGeofence.id)
      }) || null
    )
  }

  const deleteGeofence = (geofenceId) => {
    const visibleGeofenceExists = geofences.value.some((geofence) => {
      return normalizeGeofenceId(geofence.id) === normalizeGeofenceId(geofenceId)
    })

    if (!visibleGeofenceExists) return

    allGeofences.value = allGeofences.value.filter((geofence) => {
      return normalizeGeofenceId(geofence.id) !== normalizeGeofenceId(geofenceId)
    })
  }

  const clearGeofences = () => {
    if (resolvedCompanyId.value === "general") {
      allGeofences.value = []
      return
    }

    allGeofences.value = allGeofences.value.filter((geofence) => {
      return String(geofence.companyId || "") !== resolvedCompanyId.value
    })
  }

  watch(allGeofences, (nextGeofences) => {
    persistGeofences(nextGeofences)
  })

  watch(resolvedCompanyId, migrateLegacyGeofencesToCompany, {
    immediate: true,
  })

  return {
    geofences,
    createGeofence,
    updateGeofence,
    deleteGeofence,
    clearGeofences,
  }
}
