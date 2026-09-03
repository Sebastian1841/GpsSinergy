import { computed, ref, unref, watch } from "vue"

import { readJsonStorage, writeJsonStorage } from "../../../services/storage/browserStorage.js"
import { normalizeId } from "../../../utils/idUtils.js"

const SELECTED_VEHICLE_GROUP_FILTER_KEY = "sinergy-selected-vehicle-group-filter"
const PERSIST_DEBOUNCE_MS = 200

let selectedPersistTimer = null

const selectedVehicleGroupFiltersByScope = ref(
  readJsonStorage(SELECTED_VEHICLE_GROUP_FILTER_KEY, {}),
)

const buildStorageScopeKey = ({ userId, contextId }) => {
  return `${normalizeId(userId)}::${normalizeId(contextId)}`
}

const scheduleSelectedPersist = () => {
  if (typeof window === "undefined") return

  if (selectedPersistTimer) {
    window.clearTimeout(selectedPersistTimer)
  }

  selectedPersistTimer = window.setTimeout(() => {
    selectedPersistTimer = null
    writeJsonStorage(SELECTED_VEHICLE_GROUP_FILTER_KEY, selectedVehicleGroupFiltersByScope.value)
  }, PERSIST_DEBOUNCE_MS)
}

export function useAssetVehicleGroupFilter({ userId, contextId, availableActivos, vehicleGroups }) {
  const resolvedUserId = computed(() => normalizeId(unref(userId)))
  const resolvedContextId = computed(() => normalizeId(unref(contextId)))

  const storageScopeKey = computed(() => {
    return buildStorageScopeKey({
      userId: resolvedUserId.value,
      contextId: resolvedContextId.value,
    })
  })

  const availableAssetIds = computed(() => {
    return new Set(
      (unref(availableActivos) || []).map((activo) => normalizeId(activo?.id)).filter(Boolean),
    )
  })

  const availableAssetIdsSignature = computed(() => {
    return Array.from(availableAssetIds.value).sort().join("|")
  })

  const normalizedVehicleGroups = computed(() => {
    return (unref(vehicleGroups) || [])
      .map((group) => ({
        ...group,
        assetIds: (group.assetIds || []).filter((assetId) => {
          return availableAssetIds.value.has(normalizeId(assetId))
        }),
      }))
      .filter((group) => {
        return normalizeId(group.id)
      })
  })

  const selectedVehicleAssetGroupId = computed({
    get() {
      if (!resolvedUserId.value || !resolvedContextId.value) return null

      return selectedVehicleGroupFiltersByScope.value[storageScopeKey.value] || null
    },
    set(groupId) {
      if (!resolvedUserId.value || !resolvedContextId.value) return

      const normalizedGroupId = normalizeId(groupId)
      const nextFiltersByScope = {
        ...selectedVehicleGroupFiltersByScope.value,
      }

      if (normalizedGroupId) {
        nextFiltersByScope[storageScopeKey.value] = normalizedGroupId
      } else {
        delete nextFiltersByScope[storageScopeKey.value]
      }

      selectedVehicleGroupFiltersByScope.value = nextFiltersByScope
      scheduleSelectedPersist()
    },
  })

  const selectedVehicleAssetGroup = computed(() => {
    return (
      normalizedVehicleGroups.value.find((group) => {
        return normalizeId(group.id) === normalizeId(selectedVehicleAssetGroupId.value)
      }) || null
    )
  })

  const selectedVehicleAssetIds = computed(() => {
    return new Set((selectedVehicleAssetGroup.value?.assetIds || []).map(normalizeId))
  })

  const selectVehicleAssetGroup = (groupId = null) => {
    const normalizedGroupId = normalizeId(groupId)

    if (!normalizedGroupId) {
      selectedVehicleAssetGroupId.value = null
      return
    }

    const exists = normalizedVehicleGroups.value.some((group) => {
      return normalizeId(group.id) === normalizedGroupId
    })

    selectedVehicleAssetGroupId.value = exists ? normalizedGroupId : null
  }

  const filterActivosBySelectedVehicleGroup = (activos = []) => {
    if (!selectedVehicleAssetGroup.value) return activos

    return activos.filter((activo) => {
      return selectedVehicleAssetIds.value.has(normalizeId(activo?.id))
    })
  }

  watch([normalizedVehicleGroups, availableAssetIdsSignature], () => {
    const selectedExists = normalizedVehicleGroups.value.some((group) => {
      return normalizeId(group.id) === normalizeId(selectedVehicleAssetGroupId.value)
    })

    if (!selectedExists) {
      selectedVehicleAssetGroupId.value = null
    }
  })

  return {
    vehicleAssetGroups: normalizedVehicleGroups,
    selectedVehicleAssetGroupId,
    selectedVehicleAssetGroup,
    selectedVehicleAssetIds,

    selectVehicleAssetGroup,
    filterActivosBySelectedVehicleGroup,
  }
}
