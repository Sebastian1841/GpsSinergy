import { computed, ref, unref } from "vue"

import { readJsonStorage, writeJsonStorage } from "../../../services/storage/browserStorage.js"
import { getVehicleAssetGroupSourceId } from "../../../utils/activos/assetVehicleGroupUtils.js"
import { normalizeId } from "../../../utils/idUtils.js"

const VEHICLE_GROUPS_STORAGE_KEY = "sinergy-vehicle-asset-groups"
const PERSIST_DEBOUNCE_MS = 200

let persistTimer = null

const vehicleGroupsByFleetContext = ref(readJsonStorage(VEHICLE_GROUPS_STORAGE_KEY, {}))

const schedulePersist = () => {
  if (typeof window === "undefined") return

  if (persistTimer) {
    window.clearTimeout(persistTimer)
  }

  persistTimer = window.setTimeout(() => {
    persistTimer = null
    writeJsonStorage(VEHICLE_GROUPS_STORAGE_KEY, vehicleGroupsByFleetContext.value)
  }, PERSIST_DEBOUNCE_MS)
}

const createVehicleGroupId = (contextId) => {
  return `group-${normalizeId(contextId)}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const normalizeText = (value) => {
  return String(value ?? "").trim()
}

const normalizeAssetIds = (assetIds = []) => {
  if (!Array.isArray(assetIds)) return []

  return [
    ...new Set(
      assetIds
        .map((assetId) => normalizeId(assetId))
        .filter(Boolean),
    ),
  ]
}

const getAssetIdSet = (assets = []) => {
  return new Set(
    (Array.isArray(assets) ? assets : [])
      .map((asset) => normalizeId(asset?.id))
      .filter(Boolean),
  )
}

const getFleetContextGroups = (contextId) => {
  const normalizedContextId = normalizeId(contextId)

  if (!normalizedContextId) return []

  return Array.isArray(vehicleGroupsByFleetContext.value[normalizedContextId])
    ? vehicleGroupsByFleetContext.value[normalizedContextId]
    : []
}

const updateFleetContextGroups = (contextId, updater) => {
  const normalizedContextId = normalizeId(contextId)

  if (!normalizedContextId) return null

  const currentGroups = getFleetContextGroups(normalizedContextId)
  const nextGroups = updater(currentGroups)

  vehicleGroupsByFleetContext.value = {
    ...vehicleGroupsByFleetContext.value,
    [normalizedContextId]: nextGroups,
  }

  schedulePersist()

  return nextGroups
}

export function useAssetVehicleGroupManagement({ contextId, availableActivos }) {
  const resolvedFleetContextId = computed(() => normalizeId(unref(contextId)))

  const authorizedAssetIds = computed(() => {
    return getAssetIdSet(unref(availableActivos) || [])
  })

  const managedVehicleGroups = computed(() => {
    return getFleetContextGroups(resolvedFleetContextId.value)
      .map((group) => ({
        ...group,
        assetIds: normalizeAssetIds(group.assetIds).filter((assetId) => {
          return authorizedAssetIds.value.has(assetId)
        }),
        managed: true,
      }))
      .sort((firstGroup, secondGroup) => {
        return String(firstGroup.name || "").localeCompare(String(secondGroup.name || ""), "es")
      })
  })

  const createVehicleAssetGroup = ({ name, description = "", assetIds = [] } = {}) => {
    const normalizedFleetContextId = resolvedFleetContextId.value
    const normalizedName = normalizeText(name)

    if (!normalizedFleetContextId || !normalizedName) return null

    const now = new Date().toISOString()
    const availableAssetIds = authorizedAssetIds.value
    const group = {
      id: createVehicleGroupId(normalizedFleetContextId),
      name: normalizedName,
      description: normalizeText(description),
      assetIds: normalizeAssetIds(assetIds).filter((assetId) => availableAssetIds.has(assetId)),
      active: true,
      managed: true,
      createdAt: now,
      updatedAt: now,
    }

    updateFleetContextGroups(normalizedFleetContextId, (groups) => [...groups, group])

    return group
  }

  const updateVehicleAssetGroup = (groupId, changes = {}) => {
    const normalizedFleetContextId = resolvedFleetContextId.value
    const sourceGroupId = getVehicleAssetGroupSourceId(groupId)

    if (!normalizedFleetContextId || !sourceGroupId) return null

    let updatedGroup = null
    const availableAssetIds = authorizedAssetIds.value

    updateFleetContextGroups(normalizedFleetContextId, (groups) => {
      return groups.map((group) => {
        if (normalizeId(group.id) !== sourceGroupId) return group

        updatedGroup = {
          ...group,
          ...(changes.name !== undefined ? { name: normalizeText(changes.name) } : {}),
          ...(changes.description !== undefined
            ? { description: normalizeText(changes.description) }
            : {}),
          ...(Array.isArray(changes.assetIds)
            ? {
                assetIds: normalizeAssetIds(changes.assetIds).filter((assetId) => {
                  return availableAssetIds.has(assetId)
                }),
              }
            : {}),
          updatedAt: new Date().toISOString(),
        }

        return updatedGroup
      })
    })

    return updatedGroup
  }

  const deleteVehicleAssetGroup = (groupId) => {
    const normalizedFleetContextId = resolvedFleetContextId.value
    const sourceGroupId = getVehicleAssetGroupSourceId(groupId)

    if (!normalizedFleetContextId || !sourceGroupId) return false

    let deleted = false

    updateFleetContextGroups(normalizedFleetContextId, (groups) => {
      const nextGroups = groups.filter((group) => {
        const shouldKeep = normalizeId(group.id) !== sourceGroupId

        if (!shouldKeep) {
          deleted = true
        }

        return shouldKeep
      })

      return nextGroups
    })

    return deleted
  }

  return {
    managedVehicleGroups,

    createVehicleAssetGroup,
    updateVehicleAssetGroup,
    deleteVehicleAssetGroup,
  }
}
