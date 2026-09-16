import { computed, ref } from "vue"

import { normalizeId } from "../../utils/idUtils.js"

const DEFAULT_PICKER_VISIBLE_LIMIT = 120

export const normalizeSearchText = (value) => {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export const normalizeOptionId = (value) => {
  return normalizeId(value).trim()
}

export const normalizeGeofenceScope = (value) => {
  const scope = normalizeOptionId(value)

  return scope === "group" || scope === "specific" ? scope : "all"
}

const getGeofenceName = (geofence = {}) => {
  return String(geofence.name || geofence.nombre || geofence.label || "Geocerca").trim()
}

const getGeofenceGroupName = (geofence = {}) => {
  return String(
    geofence.groupName || geofence.group || geofence.grupo || geofence.groupLabel || "",
  ).trim()
}

const getGeofenceTypeLabel = (type) => {
  if (type === "circle") return "Circular"
  if (type === "polygon") return "Poligono"
  if (type === "route") return "Ruta"

  return "Geocerca"
}

const getGeofenceGroupLabel = (group = {}) => {
  return String(group.name || group.label || group.groupName || group.id || "Grupo").trim()
}

export function useAlarmRuleGeofenceSelection({
  geofences,
  geofenceGroups,
  draft,
  pickerVisibleLimit = DEFAULT_PICKER_VISIBLE_LIMIT,
}) {
  const geofenceSearchTerm = ref("")

  const clearGeofenceSearchTerm = () => {
    geofenceSearchTerm.value = ""
  }

  const geofenceOptionsForDraftCompany = computed(() => {
    const draftCompanyId = normalizeOptionId(draft.value.companyId)
    const optionsById = new Map()

    geofences.value
      .filter((geofence) => {
        const geofenceCompanyId = normalizeOptionId(geofence.companyId)

        return !draftCompanyId || !geofenceCompanyId || geofenceCompanyId === draftCompanyId
      })
      .forEach((geofence) => {
        const geofenceId = normalizeOptionId(geofence.id)

        if (!geofenceId) return

        const groupLabel = getGeofenceGroupName(geofence)
        const label = getGeofenceName(geofence)

        optionsById.set(geofenceId, {
          id: geofenceId,
          label,
          groupLabel,
          typeLabel: getGeofenceTypeLabel(geofence.type),
        })
      })

    return Array.from(optionsById.values()).sort((left, right) => {
      return left.label.localeCompare(right.label, "es", { sensitivity: "base" })
    })
  })

  const geofenceGroupOptions = computed(() => {
    const draftCompanyId = normalizeOptionId(draft.value.companyId)
    const groupsByKey = new Map()

    geofenceGroups.value
      .filter((group) => {
        const groupCompanyId = normalizeOptionId(group.companyId)

        return !draftCompanyId || !groupCompanyId || groupCompanyId === draftCompanyId
      })
      .forEach((group) => {
        const label = getGeofenceGroupLabel(group)
        const key = normalizeSearchText(label)

        if (!key) return

        groupsByKey.set(key, {
          id: normalizeOptionId(group.id || label),
          label,
          count: 0,
        })
      })

    geofenceOptionsForDraftCompany.value.forEach((geofence) => {
      const label = String(geofence.groupLabel || "").trim()
      const key = normalizeSearchText(label)

      if (!key) return

      const currentGroup = groupsByKey.get(key) || {
        id: label,
        label,
        count: 0,
      }

      groupsByKey.set(key, {
        ...currentGroup,
        count: currentGroup.count + 1,
      })
    })

    return Array.from(groupsByKey.values()).sort((left, right) => {
      return left.label.localeCompare(right.label, "es", { sensitivity: "base" })
    })
  })

  const filteredGeofenceOptions = computed(() => {
    const search = normalizeSearchText(geofenceSearchTerm.value)

    if (!search) {
      return geofenceOptionsForDraftCompany.value
    }

    return geofenceOptionsForDraftCompany.value.filter((geofence) => {
      return [geofence.label, geofence.groupLabel, geofence.typeLabel].some((value) => {
        return normalizeSearchText(value).includes(search)
      })
    })
  })

  const visibleGeofenceOptions = computed(() => {
    return filteredGeofenceOptions.value.slice(0, pickerVisibleLimit)
  })

  const hiddenFilteredGeofenceCount = computed(() => {
    return Math.max(0, filteredGeofenceOptions.value.length - visibleGeofenceOptions.value.length)
  })

  const selectedDraftGeofenceIds = computed(() => {
    const availableGeofenceIds = new Set(
      geofenceOptionsForDraftCompany.value.map((item) => item.id),
    )

    return (draft.value.condition.geofenceIds || [])
      .map(normalizeOptionId)
      .filter((geofenceId) => availableGeofenceIds.has(geofenceId))
  })

  const selectedDraftGeofenceCount = computed(() => selectedDraftGeofenceIds.value.length)

  const selectedDraftGeofenceIdSet = computed(() => {
    return new Set(selectedDraftGeofenceIds.value)
  })

  const selectedDraftGeofenceGroup = computed(() => {
    const groupId = normalizeOptionId(draft.value.condition.geofenceGroupId)
    const groupName = normalizeSearchText(draft.value.condition.geofenceGroupName)

    return (
      geofenceGroupOptions.value.find((group) => group.id === groupId) ||
      geofenceGroupOptions.value.find((group) => normalizeSearchText(group.label) === groupName) ||
      null
    )
  })

  const selectedDraftGeofenceGroupLabel = computed(() => {
    return selectedDraftGeofenceGroup.value?.label || ""
  })

  const getSelectedGeofenceNames = (geofenceIds = []) => {
    const selectedIds = new Set(geofenceIds.map(normalizeOptionId))

    return geofenceOptionsForDraftCompany.value
      .filter((geofence) => selectedIds.has(geofence.id))
      .map((geofence) => geofence.label)
  }

  const setDraftGeofenceScope = (scope) => {
    const geofenceScope = normalizeGeofenceScope(scope)
    const nextCondition = {
      ...draft.value.condition,
      geofenceScope,
    }

    clearGeofenceSearchTerm()

    if (geofenceScope === "group") {
      const selectedGroup =
        selectedDraftGeofenceGroup.value || geofenceGroupOptions.value[0] || null

      draft.value.condition = {
        ...nextCondition,
        geofenceGroupId: selectedGroup?.id || "",
        geofenceGroupName: selectedGroup?.label || "",
        geofenceIds: [],
        geofenceNames: [],
        geofenceName: selectedGroup?.label || "",
      }

      return
    }

    if (geofenceScope === "specific") {
      const geofenceIds = selectedDraftGeofenceIds.value

      draft.value.condition = {
        ...nextCondition,
        geofenceGroupId: "",
        geofenceGroupName: "",
        geofenceIds,
        geofenceNames: getSelectedGeofenceNames(geofenceIds),
        geofenceName: geofenceIds.length ? `${geofenceIds.length} geocercas` : "",
      }

      return
    }

    draft.value.condition = {
      ...nextCondition,
      geofenceGroupId: "",
      geofenceGroupName: "",
      geofenceIds: [],
      geofenceNames: [],
      geofenceName: "",
    }
  }

  const handleGeofenceGroupChange = () => {
    const selectedGroup = selectedDraftGeofenceGroup.value

    draft.value.condition = {
      ...draft.value.condition,
      geofenceScope: "group",
      geofenceGroupId: selectedGroup?.id || "",
      geofenceGroupName: selectedGroup?.label || "",
      geofenceName: selectedGroup?.label || "",
      geofenceIds: [],
      geofenceNames: [],
    }
  }

  const isDraftGeofenceSelected = (geofenceId) => {
    return selectedDraftGeofenceIdSet.value.has(normalizeOptionId(geofenceId))
  }

  const toggleDraftGeofence = (geofenceId) => {
    const normalizedGeofenceId = normalizeOptionId(geofenceId)

    if (!normalizedGeofenceId) return

    const currentIds = new Set(selectedDraftGeofenceIds.value)

    if (currentIds.has(normalizedGeofenceId)) {
      currentIds.delete(normalizedGeofenceId)
    } else {
      currentIds.add(normalizedGeofenceId)
    }

    const geofenceIds = [...currentIds]

    draft.value.condition = {
      ...draft.value.condition,
      geofenceScope: "specific",
      geofenceGroupId: "",
      geofenceGroupName: "",
      geofenceIds,
      geofenceNames: getSelectedGeofenceNames(geofenceIds),
      geofenceName: geofenceIds.length ? `${geofenceIds.length} geocercas` : "",
    }
  }

  const selectAllDraftGeofences = () => {
    const geofenceIds = geofenceOptionsForDraftCompany.value.map((geofence) => geofence.id)

    draft.value.condition = {
      ...draft.value.condition,
      geofenceScope: "specific",
      geofenceGroupId: "",
      geofenceGroupName: "",
      geofenceIds,
      geofenceNames: getSelectedGeofenceNames(geofenceIds),
      geofenceName: geofenceIds.length ? `${geofenceIds.length} geocercas` : "",
    }
  }

  return {
    clearGeofenceSearchTerm,
    filteredGeofenceOptions,
    geofenceGroupOptions,
    geofenceOptionsForDraftCompany,
    geofenceSearchTerm,
    getSelectedGeofenceNames,
    handleGeofenceGroupChange,
    hiddenFilteredGeofenceCount,
    isDraftGeofenceSelected,
    selectAllDraftGeofences,
    selectedDraftGeofenceCount,
    selectedDraftGeofenceGroup,
    selectedDraftGeofenceGroupLabel,
    selectedDraftGeofenceIds,
    setDraftGeofenceScope,
    toggleDraftGeofence,
    visibleGeofenceOptions,
  }
}
