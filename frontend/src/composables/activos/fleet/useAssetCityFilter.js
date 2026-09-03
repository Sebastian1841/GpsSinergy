import { computed, ref, unref, watch } from "vue"

import { readJsonStorage, writeJsonStorage } from "../../../services/storage/browserStorage.js"
import { normalizeId } from "../../../utils/idUtils.js"

const SELECTED_CITY_FILTER_KEY = "sinergy-selected-city-asset-filter"
const LEGACY_SELECTED_GROUP_KEY = "sinergy-selected-personal-asset-group"
const PERSIST_DEBOUNCE_MS = 200

let selectedPersistTimer = null

const selectedCityFiltersByScope = ref(
  readJsonStorage(
    SELECTED_CITY_FILTER_KEY,
    readJsonStorage(LEGACY_SELECTED_GROUP_KEY, {}),
  ),
)

const buildStorageScopeKey = ({ userId, companyId }) => {
  return `${normalizeId(userId)}::${normalizeId(companyId)}`
}

const scheduleSelectedPersist = () => {
  if (typeof window === "undefined") return

  if (selectedPersistTimer) {
    window.clearTimeout(selectedPersistTimer)
  }

  selectedPersistTimer = window.setTimeout(() => {
    selectedPersistTimer = null
    writeJsonStorage(SELECTED_CITY_FILTER_KEY, selectedCityFiltersByScope.value)
  }, PERSIST_DEBOUNCE_MS)
}

export function useAssetCityFilter({ userId, companyId, availableActivos, cityGroups }) {
  const resolvedUserId = computed(() => normalizeId(unref(userId)))
  const resolvedCompanyId = computed(() => normalizeId(unref(companyId)))

  const storageScopeKey = computed(() => {
    return buildStorageScopeKey({
      userId: resolvedUserId.value,
      companyId: resolvedCompanyId.value,
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

  const normalizedCityGroups = computed(() => {
    return (unref(cityGroups) || [])
      .map((group) => ({
        ...group,
        assetIds: (group.assetIds || []).filter((assetId) => {
          return availableAssetIds.value.has(normalizeId(assetId))
        }),
      }))
      .filter((group) => {
        return normalizeId(group.id) && group.assetIds.length
      })
  })

  const selectedCityAssetGroupId = computed({
    get() {
      if (!resolvedUserId.value || !resolvedCompanyId.value) return null

      return selectedCityFiltersByScope.value[storageScopeKey.value] || null
    },
    set(groupId) {
      if (!resolvedUserId.value || !resolvedCompanyId.value) return

      const normalizedGroupId = normalizeId(groupId)
      const nextFiltersByScope = {
        ...selectedCityFiltersByScope.value,
      }

      if (normalizedGroupId) {
        nextFiltersByScope[storageScopeKey.value] = normalizedGroupId
      } else {
        delete nextFiltersByScope[storageScopeKey.value]
      }

      selectedCityFiltersByScope.value = nextFiltersByScope
      scheduleSelectedPersist()
    },
  })

  const selectedCityAssetGroup = computed(() => {
    return (
      normalizedCityGroups.value.find((group) => {
        return normalizeId(group.id) === normalizeId(selectedCityAssetGroupId.value)
      }) || null
    )
  })

  const selectedCityAssetIds = computed(() => {
    return new Set((selectedCityAssetGroup.value?.assetIds || []).map(normalizeId))
  })

  const selectCityAssetGroup = (groupId = null) => {
    const normalizedGroupId = normalizeId(groupId)

    if (!normalizedGroupId) {
      selectedCityAssetGroupId.value = null
      return
    }

    const exists = normalizedCityGroups.value.some((group) => {
      return normalizeId(group.id) === normalizedGroupId
    })

    selectedCityAssetGroupId.value = exists ? normalizedGroupId : null
  }

  const filterActivosBySelectedCityGroup = (activos = []) => {
    if (!selectedCityAssetGroup.value) return activos

    return activos.filter((activo) => {
      return selectedCityAssetIds.value.has(normalizeId(activo?.id))
    })
  }

  watch([normalizedCityGroups, availableAssetIdsSignature], () => {
    const selectedExists = normalizedCityGroups.value.some((group) => {
      return normalizeId(group.id) === normalizeId(selectedCityAssetGroupId.value)
    })

    if (!selectedExists) {
      selectedCityAssetGroupId.value = null
    }
  })

  return {
    cityAssetGroups: normalizedCityGroups,
    selectedCityAssetGroupId,
    selectedCityAssetGroup,
    selectedCityAssetIds,

    selectCityAssetGroup,
    filterActivosBySelectedCityGroup,
  }
}
