import { computed, ref, unref, watch } from "vue"

import { readJsonStorage, writeJsonStorage } from "../../../services/storage/browserStorage.js"
import { normalizeId } from "../../../utils/idUtils.js"

const PERSIST_DEBOUNCE_MS = 200

const selectedFiltersByStorageKey = new Map()
const persistTimersByStorageKey = new Map()

export const resetScopedAssetGroupFilterForTest = () => {
  persistTimersByStorageKey.forEach((timer) => {
    if (typeof window !== "undefined") {
      window.clearTimeout(timer)
    }
  })

  persistTimersByStorageKey.clear()
  selectedFiltersByStorageKey.clear()
}

const buildStorageScopeKey = ({ userId, contextId }) => {
  return `${normalizeId(userId)}::${normalizeId(contextId)}`
}

const readInitialFilters = ({ storageKey, legacyStorageKey = null }) => {
  const legacyFilters = legacyStorageKey ? readJsonStorage(legacyStorageKey, {}) : {}
  const storedFilters = readJsonStorage(storageKey, legacyFilters)

  if (!storedFilters || typeof storedFilters !== "object" || Array.isArray(storedFilters)) {
    return {}
  }

  return storedFilters
}

const getSelectedFiltersState = ({ storageKey, legacyStorageKey = null }) => {
  if (!selectedFiltersByStorageKey.has(storageKey)) {
    selectedFiltersByStorageKey.set(
      storageKey,
      ref(
        readInitialFilters({
          storageKey,
          legacyStorageKey,
        }),
      ),
    )
  }

  return selectedFiltersByStorageKey.get(storageKey)
}

const scheduleSelectedPersist = ({ storageKey, selectedFiltersByScope }) => {
  if (typeof window === "undefined") return

  const currentTimer = persistTimersByStorageKey.get(storageKey)

  if (currentTimer) {
    window.clearTimeout(currentTimer)
  }

  const nextTimer = window.setTimeout(() => {
    persistTimersByStorageKey.delete(storageKey)
    writeJsonStorage(storageKey, selectedFiltersByScope.value)
  }, PERSIST_DEBOUNCE_MS)

  persistTimersByStorageKey.set(storageKey, nextTimer)
}

export function useScopedAssetGroupFilter({
  userId,
  contextId,
  availableActivos,
  groups,
  storageKey,
  legacyStorageKey = null,
  keepEmptyGroups = false,
}) {
  const selectedFiltersByScope = getSelectedFiltersState({
    storageKey,
    legacyStorageKey,
  })

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

  const assetGroups = computed(() => {
    return (unref(groups) || [])
      .map((group) => ({
        ...group,
        assetIds: (Array.isArray(group.assetIds) ? group.assetIds : []).filter((assetId) => {
          return availableAssetIds.value.has(normalizeId(assetId))
        }),
      }))
      .filter((group) => {
        const hasId = Boolean(normalizeId(group.id))

        if (!hasId) return false
        if (keepEmptyGroups) return true

        return group.assetIds.length > 0
      })
  })

  const selectedAssetGroupId = computed({
    get() {
      if (!resolvedUserId.value || !resolvedContextId.value) return null

      return selectedFiltersByScope.value[storageScopeKey.value] || null
    },
    set(groupId) {
      if (!resolvedUserId.value || !resolvedContextId.value) return

      const normalizedGroupId = normalizeId(groupId)
      const nextFiltersByScope = {
        ...selectedFiltersByScope.value,
      }

      if (normalizedGroupId) {
        nextFiltersByScope[storageScopeKey.value] = normalizedGroupId
      } else {
        delete nextFiltersByScope[storageScopeKey.value]
      }

      selectedFiltersByScope.value = nextFiltersByScope

      scheduleSelectedPersist({
        storageKey,
        selectedFiltersByScope,
      })
    },
  })

  const selectedAssetGroup = computed(() => {
    return (
      assetGroups.value.find((group) => {
        return normalizeId(group.id) === normalizeId(selectedAssetGroupId.value)
      }) || null
    )
  })

  const selectedAssetIds = computed(() => {
    return new Set((selectedAssetGroup.value?.assetIds || []).map(normalizeId))
  })

  const selectAssetGroup = (groupId = null) => {
    const normalizedGroupId = normalizeId(groupId)

    if (!normalizedGroupId) {
      selectedAssetGroupId.value = null
      return
    }

    const exists = assetGroups.value.some((group) => {
      return normalizeId(group.id) === normalizedGroupId
    })

    selectedAssetGroupId.value = exists ? normalizedGroupId : null
  }

  const filterActivosBySelectedGroup = (activos = []) => {
    if (!selectedAssetGroup.value) return activos

    return activos.filter((activo) => {
      return selectedAssetIds.value.has(normalizeId(activo?.id))
    })
  }

  watch([assetGroups, availableAssetIdsSignature], () => {
    const selectedExists = assetGroups.value.some((group) => {
      return normalizeId(group.id) === normalizeId(selectedAssetGroupId.value)
    })

    if (!selectedExists) {
      selectedAssetGroupId.value = null
    }
  })

  return {
    assetGroups,
    selectedAssetGroupId,
    selectedAssetGroup,
    selectedAssetIds,

    selectAssetGroup,
    filterActivosBySelectedGroup,
  }
}
