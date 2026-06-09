import { computed, ref, unref, watch } from "vue"

import { normalizeId } from "../../../utils/idUtils.js"

const STORAGE_KEY = "sinergy-personal-asset-groups"
const SELECTED_GROUP_KEY = "sinergy-selected-personal-asset-group"
const PERSIST_DEBOUNCE_MS = 200

let groupsPersistTimer = null
let selectedPersistTimer = null

const readJsonStorage = (key, fallback) => {
  if (typeof window === "undefined") return fallback

  try {
    return JSON.parse(window.localStorage.getItem(key) || "null") || fallback
  } catch {
    return fallback
  }
}

const writeJsonStorage = (key, value) => {
  if (typeof window === "undefined") return

  window.localStorage.setItem(key, JSON.stringify(value))
}

const scheduleGroupsPersist = () => {
  if (typeof window === "undefined") return

  if (groupsPersistTimer) {
    window.clearTimeout(groupsPersistTimer)
  }

  groupsPersistTimer = window.setTimeout(() => {
    groupsPersistTimer = null
    writeJsonStorage(STORAGE_KEY, personalAssetGroups.value)
  }, PERSIST_DEBOUNCE_MS)
}

const scheduleSelectedPersist = () => {
  if (typeof window === "undefined") return

  if (selectedPersistTimer) {
    window.clearTimeout(selectedPersistTimer)
  }

  selectedPersistTimer = window.setTimeout(() => {
    selectedPersistTimer = null
    writeJsonStorage(SELECTED_GROUP_KEY, selectedPersonalAssetGroupsByScope.value)
  }, PERSIST_DEBOUNCE_MS)
}

const normalizeName = (value) => {
  return String(value || "").trim()
}

const buildStorageScopeKey = ({ userId, companyId }) => {
  return `${normalizeId(userId)}::${normalizeId(companyId)}`
}

const buildGroupId = ({ userId, companyId }) => {
  return `asset-view-${normalizeId(userId)}-${normalizeId(companyId)}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`
}

const personalAssetGroups = ref(readJsonStorage(STORAGE_KEY, []))
const selectedPersonalAssetGroupsByScope = ref(readJsonStorage(SELECTED_GROUP_KEY, {}))

export function usePersonalAssetGroups({ userId, companyId, availableActivos }) {
  const resolvedUserId = computed(() => normalizeId(unref(userId)))
  const resolvedCompanyId = computed(() => normalizeId(unref(companyId)))

  const storageScopeKey = computed(() => {
    return buildStorageScopeKey({
      userId: resolvedUserId.value,
      companyId: resolvedCompanyId.value,
    })
  })

  const selectedGroupId = computed({
    get() {
      if (!resolvedUserId.value || !resolvedCompanyId.value) return null

      return selectedPersonalAssetGroupsByScope.value[storageScopeKey.value] || null
    },
    set(groupId) {
      if (!resolvedUserId.value || !resolvedCompanyId.value) return

      const normalizedGroupId = normalizeId(groupId)
      const nextGroupsByScope = {
        ...selectedPersonalAssetGroupsByScope.value,
      }

      if (normalizedGroupId) {
        nextGroupsByScope[storageScopeKey.value] = normalizedGroupId
      } else {
        delete nextGroupsByScope[storageScopeKey.value]
      }

      selectedPersonalAssetGroupsByScope.value = nextGroupsByScope
      scheduleSelectedPersist()
    },
  })

  const availableAssetIds = computed(() => {
    return new Set(
      (unref(availableActivos) || []).map((activo) => normalizeId(activo?.id)).filter(Boolean),
    )
  })

  const availableAssetIdsSignature = computed(() => {
    return Array.from(availableAssetIds.value).sort().join("|")
  })

  const groups = computed(() => {
    return personalAssetGroups.value
      .filter((group) => {
        return (
          normalizeId(group.userId) === resolvedUserId.value &&
          normalizeId(group.companyId) === resolvedCompanyId.value
        )
      })
      .map((group) => ({
        ...group,
        assetIds: (group.assetIds || []).filter((assetId) => {
          return availableAssetIds.value.has(normalizeId(assetId))
        }),
      }))
  })

  const selectedGroup = computed(() => {
    return (
      groups.value.find((group) => {
        return normalizeId(group.id) === normalizeId(selectedGroupId.value)
      }) || null
    )
  })

  const selectedGroupAssetIds = computed(() => {
    return new Set((selectedGroup.value?.assetIds || []).map(normalizeId))
  })

  const resolveGroup = (groupId) => {
    return personalAssetGroups.value.find((group) => {
      return (
        normalizeId(group.id) === normalizeId(groupId) &&
        normalizeId(group.userId) === resolvedUserId.value &&
        normalizeId(group.companyId) === resolvedCompanyId.value
      )
    })
  }

  const selectPersonalAssetGroup = (groupId = null) => {
    const normalizedGroupId = normalizeId(groupId)

    if (!normalizedGroupId) {
      selectedGroupId.value = null
      return
    }

    const exists = groups.value.some((group) => {
      return normalizeId(group.id) === normalizedGroupId
    })

    selectedGroupId.value = exists ? normalizedGroupId : null
  }

  const normalizeAssetIds = (assetIds = []) => {
    return Array.from(new Set(assetIds.map(normalizeId))).filter((assetId) => {
      return availableAssetIds.value.has(assetId)
    })
  }

  const createPersonalAssetGroup = (name, assetIds = []) => {
    const groupName = normalizeName(name)

    if (!resolvedUserId.value || !resolvedCompanyId.value || !groupName) return null

    const group = {
      id: buildGroupId({
        userId: resolvedUserId.value,
        companyId: resolvedCompanyId.value,
      }),
      userId: resolvedUserId.value,
      companyId: resolvedCompanyId.value,
      name: groupName,
      assetIds: normalizeAssetIds(assetIds),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    personalAssetGroups.value = [group, ...personalAssetGroups.value]
    scheduleGroupsPersist()

    selectedGroupId.value = group.id

    return group
  }

  const setPersonalAssetGroupAssets = (groupId, assetIds = []) => {
    const group = resolveGroup(groupId)

    if (!group) return null

    group.assetIds = normalizeAssetIds(assetIds)
    group.updatedAt = new Date().toISOString()

    scheduleGroupsPersist()

    return group
  }

  const renamePersonalAssetGroup = (groupId, name) => {
    const groupName = normalizeName(name)
    const group = resolveGroup(groupId)

    if (!group || !groupName) return null

    group.name = groupName
    group.updatedAt = new Date().toISOString()

    scheduleGroupsPersist()

    return group
  }

  const deletePersonalAssetGroup = (groupId) => {
    const normalizedGroupId = normalizeId(groupId)
    const previousLength = personalAssetGroups.value.length

    personalAssetGroups.value = personalAssetGroups.value.filter((group) => {
      return normalizeId(group.id) !== normalizedGroupId
    })

    if (personalAssetGroups.value.length !== previousLength) {
      scheduleGroupsPersist()
    }

    if (normalizeId(selectedGroupId.value) === normalizedGroupId) {
      selectedGroupId.value = null
    }
  }

  const togglePersonalAssetGroupAsset = ({ groupId, assetId }) => {
    const group = resolveGroup(groupId)
    const normalizedAssetId = normalizeId(assetId)

    if (!group || !availableAssetIds.value.has(normalizedAssetId)) return

    const currentAssetIds = new Set((group.assetIds || []).map(normalizeId))

    if (currentAssetIds.has(normalizedAssetId)) {
      currentAssetIds.delete(normalizedAssetId)
    } else {
      currentAssetIds.add(normalizedAssetId)
    }

    group.assetIds = Array.from(currentAssetIds)
    group.updatedAt = new Date().toISOString()

    scheduleGroupsPersist()
  }

  const filterActivosBySelectedGroup = (activos = []) => {
    if (!selectedGroup.value) return activos

    return activos.filter((activo) => {
      return selectedGroupAssetIds.value.has(normalizeId(activo?.id))
    })
  }

  watch([groups, availableAssetIdsSignature], () => {
    const selectedExists = groups.value.some((group) => {
      return normalizeId(group.id) === normalizeId(selectedGroupId.value)
    })

    if (!selectedExists) {
      selectedGroupId.value = null
    }
  })

  return {
    personalAssetGroups: groups,
    selectedPersonalAssetGroupId: selectedGroupId,
    selectedPersonalAssetGroup: selectedGroup,
    selectedPersonalAssetGroupAssetIds: selectedGroupAssetIds,

    selectPersonalAssetGroup,
    createPersonalAssetGroup,
    renamePersonalAssetGroup,
    setPersonalAssetGroupAssets,
    deletePersonalAssetGroup,
    togglePersonalAssetGroupAsset,
    filterActivosBySelectedGroup,
  }
}
