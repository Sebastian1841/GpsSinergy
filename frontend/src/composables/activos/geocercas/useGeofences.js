import { computed, ref, unref, watch } from "vue"

import { readJsonStorage, writeJsonStorage } from "../../../services/storage/browserStorage.js"
import { getGeofenceColor, removeLegacyGeofenceColorFields } from "../../../utils/geofenceUtils.js"

const STORAGE_KEY = "sinergy-activos-geofences"
const STORAGE_VERSION = 2

const VALID_GEOFENCE_TYPES = new Set(["circle", "polygon", "route"])

const normalizeGeofenceId = (id) => {
  return String(id ?? "")
}

const createGeofenceId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `geofence-${crypto.randomUUID()}`
  }

  return `geofence-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const createGeofenceGroupId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `geofence-group-${crypto.randomUUID()}`
  }

  return `geofence-group-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const normalizeGeofenceGroupName = (geofence = {}) => {
  if (typeof geofence === "string") return geofence.trim()

  return String(
    geofence.groupName || geofence.group || geofence.grupo || geofence.groupLabel || "",
  ).trim()
}

const normalizeGroupNameKey = (value) => {
  return normalizeGeofenceGroupName(value).toLocaleLowerCase("es")
}

const normalizeGeofenceGroup = (group, companyId = "general") => {
  const name = normalizeGeofenceGroupName(group?.name || group?.label || group)

  if (!name) return null

  const resolvedCompanyId = String(group?.companyId || companyId || "general")

  return {
    id: String(group?.id || createGeofenceGroupId()),
    companyId: resolvedCompanyId,
    name,
    createdAt: group?.createdAt || new Date().toISOString(),
  }
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

const normalizeGeofenceGroups = (groups = []) => {
  if (!Array.isArray(groups)) return []

  const groupsByKey = new Map()

  groups
    .map((group) => normalizeGeofenceGroup(group))
    .filter(Boolean)
    .forEach((group) => {
      const groupKey = `${group.companyId}::${normalizeGroupNameKey(group.name)}`

      if (!groupsByKey.has(groupKey)) {
        groupsByKey.set(groupKey, group)
      }
    })

  return Array.from(groupsByKey.values())
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
  //   version: 1 | 2,
  //   geofences: []
  // }
  if (payload.version === 1 || payload.version === STORAGE_VERSION) {
    return normalizeGeofences(payload.geofences)
  }

  return []
}

const readStoredGeofenceGroups = () => {
  const payload = readStoredPayload()

  if (!payload || Array.isArray(payload)) return []

  if (payload.version === 1 || payload.version === STORAGE_VERSION) {
    return normalizeGeofenceGroups(payload.groups)
  }

  return []
}

const persistGeofenceState = ({ geofences, groups }) => {
  writeJsonStorage(STORAGE_KEY, {
    version: STORAGE_VERSION,
    geofences: normalizeGeofences(geofences),
    groups: normalizeGeofenceGroups(groups),
  })
}

export function useGeofences({ companyId = "general" } = {}) {
  const allGeofences = ref(readStoredGeofences())
  const allGeofenceGroups = ref(readStoredGeofenceGroups())
  const resolvedCompanyId = computed(() => String(unref(companyId) || "general"))

  persistGeofenceState({
    geofences: allGeofences.value,
    groups: allGeofenceGroups.value,
  })

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

  const geofenceGroups = computed(() => {
    const currentCompanyId = resolvedCompanyId.value
    const groupsByName = new Map()

    allGeofenceGroups.value
      .filter((group) => {
        return currentCompanyId === "general" || String(group.companyId || "") === currentCompanyId
      })
      .forEach((group) => {
        groupsByName.set(normalizeGroupNameKey(group.name), {
          ...group,
          count: 0,
          color: "#102372",
        })
      })

    geofences.value.forEach((geofence) => {
      const groupName = normalizeGeofenceGroupName(geofence)

      if (!groupName) return

      const groupKey = normalizeGroupNameKey(groupName)
      const existingGroup =
        groupsByName.get(groupKey) ||
        normalizeGeofenceGroup({
          id: `derived-${currentCompanyId}-${groupKey}`,
          companyId: currentCompanyId,
          name: groupName,
        })

      if (!existingGroup) return

      groupsByName.set(groupKey, {
        ...existingGroup,
        count: Number(existingGroup.count || 0) + 1,
        color: existingGroup.color === "#102372" ? getGeofenceColor(geofence) : existingGroup.color,
      })
    })

    return Array.from(groupsByName.values()).sort((firstGroup, secondGroup) => {
      return firstGroup.name.localeCompare(secondGroup.name, "es", {
        sensitivity: "base",
      })
    })
  })

  const createGeofenceGroup = (groupName) => {
    const name = normalizeGeofenceGroupName(groupName)

    if (!name) return null

    const currentCompanyId = resolvedCompanyId.value
    const groupKey = normalizeGroupNameKey(name)
    const existingGroup = geofenceGroups.value.find((group) => {
      return normalizeGroupNameKey(group.name) === groupKey
    })

    if (existingGroup) return existingGroup

    const nextGroup = normalizeGeofenceGroup({
      companyId: currentCompanyId,
      name,
    })

    if (!nextGroup) return null

    allGeofenceGroups.value = normalizeGeofenceGroups([...allGeofenceGroups.value, nextGroup])

    return (
      geofenceGroups.value.find((group) => {
        return normalizeGroupNameKey(group.name) === groupKey
      }) || nextGroup
    )
  }

  const deleteGeofenceGroup = (groupIdOrName) => {
    const targetGroup = geofenceGroups.value.find((group) => {
      return (
        normalizeGeofenceId(group.id) === normalizeGeofenceId(groupIdOrName) ||
        normalizeGroupNameKey(group.name) === normalizeGroupNameKey(groupIdOrName)
      )
    })

    if (!targetGroup) return false

    const targetGroupNameKey = normalizeGroupNameKey(targetGroup.name)
    const currentCompanyId = resolvedCompanyId.value

    allGeofenceGroups.value = allGeofenceGroups.value.filter((group) => {
      const isSameCompany =
        currentCompanyId === "general" || String(group.companyId || "") === currentCompanyId
      const isSameGroup =
        normalizeGeofenceId(group.id) === normalizeGeofenceId(targetGroup.id) ||
        normalizeGroupNameKey(group.name) === targetGroupNameKey

      return !(isSameCompany && isSameGroup)
    })

    allGeofences.value = normalizeGeofences(
      allGeofences.value.map((geofence) => {
        const isSameCompany =
          currentCompanyId === "general" || String(geofence.companyId || "") === currentCompanyId

        if (!isSameCompany || normalizeGroupNameKey(geofence) !== targetGroupNameKey) {
          return geofence
        }

        return {
          ...geofence,
          groupName: "",
        }
      }),
    )

    return true
  }

  const renameGeofenceGroup = ({ groupIdOrName, name: nextGroupName } = {}) => {
    const nextName = normalizeGeofenceGroupName(nextGroupName)

    if (!nextName) return null

    const targetGroup = geofenceGroups.value.find((group) => {
      return (
        normalizeGeofenceId(group.id) === normalizeGeofenceId(groupIdOrName) ||
        normalizeGroupNameKey(group.name) === normalizeGroupNameKey(groupIdOrName)
      )
    })

    if (!targetGroup) return null

    const currentCompanyId = resolvedCompanyId.value
    const previousGroupNameKey = normalizeGroupNameKey(targetGroup.name)
    const nextGroupNameKey = normalizeGroupNameKey(nextName)

    if (previousGroupNameKey === nextGroupNameKey) return targetGroup

    const duplicatedGroup = geofenceGroups.value.some((group) => {
      return (
        normalizeGeofenceId(group.id) !== normalizeGeofenceId(targetGroup.id) &&
        normalizeGroupNameKey(group.name) === nextGroupNameKey
      )
    })

    if (duplicatedGroup) return null

    let groupWasPersisted = false

    allGeofenceGroups.value = normalizeGeofenceGroups([
      ...allGeofenceGroups.value.map((group) => {
        const isSameCompany =
          currentCompanyId === "general" || String(group.companyId || "") === currentCompanyId
        const isSameGroup =
          normalizeGeofenceId(group.id) === normalizeGeofenceId(targetGroup.id) ||
          normalizeGroupNameKey(group.name) === previousGroupNameKey

        if (!isSameCompany || !isSameGroup) return group

        groupWasPersisted = true

        return {
          ...group,
          name: nextName,
        }
      }),
      ...(groupWasPersisted
        ? []
        : [
            {
              companyId: currentCompanyId,
              name: nextName,
            },
          ]),
    ])

    allGeofences.value = normalizeGeofences(
      allGeofences.value.map((geofence) => {
        const isSameCompany =
          currentCompanyId === "general" || String(geofence.companyId || "") === currentCompanyId

        if (!isSameCompany || normalizeGroupNameKey(geofence) !== previousGroupNameKey) {
          return geofence
        }

        return {
          ...geofence,
          groupName: nextName,
        }
      }),
    )

    return (
      geofenceGroups.value.find((group) => {
        return normalizeGroupNameKey(group.name) === nextGroupNameKey
      }) || null
    )
  }

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

  const importGeofences = (importedGeofences = []) => {
    if (!Array.isArray(importedGeofences) || !importedGeofences.length) return []

    const existingIds = new Set(
      allGeofences.value.map((geofence) => normalizeGeofenceId(geofence.id)).filter(Boolean),
    )

    const normalizedImportedGeofences = importedGeofences
      .map((geofence) => {
        let nextId = normalizeGeofenceId(geofence?.id)

        if (!nextId || existingIds.has(nextId)) {
          nextId = createGeofenceId()
        }

        existingIds.add(nextId)

        return normalizeGeofence({
          ...geofence,
          id: nextId,
          companyId: resolvedCompanyId.value,
        })
      })
      .filter(Boolean)

    if (!normalizedImportedGeofences.length) return []

    allGeofences.value = normalizeGeofences([...allGeofences.value, ...normalizedImportedGeofences])

    return normalizedImportedGeofences.filter((importedGeofence) => {
      return geofences.value.some((geofence) => {
        return normalizeGeofenceId(geofence.id) === normalizeGeofenceId(importedGeofence.id)
      })
    })
  }

  const deleteGeofences = (geofenceIds = []) => {
    if (!Array.isArray(geofenceIds) || !geofenceIds.length) return []

    const requestedIds = new Set(geofenceIds.map((id) => normalizeGeofenceId(id)).filter(Boolean))

    if (!requestedIds.size) return []

    const removableIds = new Set()

    geofences.value.forEach((geofence) => {
      const geofenceId = normalizeGeofenceId(geofence.id)

      if (requestedIds.has(geofenceId)) {
        removableIds.add(geofenceId)
      }
    })

    if (!removableIds.size) return []

    allGeofences.value = allGeofences.value.filter((geofence) => {
      return !removableIds.has(normalizeGeofenceId(geofence.id))
    })

    return Array.from(removableIds)
  }

  const deleteGeofence = (geofenceId) => {
    deleteGeofences([geofenceId])
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

  watch([allGeofences, allGeofenceGroups], ([nextGeofences, nextGroups]) => {
    persistGeofenceState({
      geofences: nextGeofences,
      groups: nextGroups,
    })
  })

  watch(resolvedCompanyId, migrateLegacyGeofencesToCompany, {
    immediate: true,
  })

  return {
    geofences,
    geofenceGroups,
    createGeofence,
    createGeofenceGroup,
    updateGeofence,
    deleteGeofence,
    deleteGeofences,
    deleteGeofenceGroup,
    renameGeofenceGroup,
    clearGeofences,
    importGeofences,
  }
}
