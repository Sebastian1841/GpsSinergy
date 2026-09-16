import { computed, ref } from "vue"

import { normalizeId } from "../../utils/idUtils.js"
import {
  assetMatchesTagIds,
  getAssetTagIds,
  normalizeAssetTagId,
} from "../../utils/users/userAssetTagUtils.js"

const DEFAULT_PICKER_VISIBLE_LIMIT = 120

const normalizeSearchText = (value) => {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

const getAssetName = (asset = {}) => {
  return asset.vehiculo || asset.nombrePantalla || asset.name || asset.nombre || "Activo"
}

const getAssetPlate = (asset = {}) => {
  return asset.patente || asset.patent || asset.plate || asset.ppu || asset.matricula || "-"
}

const getAssetLabel = (asset = {}) => {
  return `${getAssetPlate(asset)} - ${getAssetName(asset)}`
}

export function useAlarmRuleAssetScope({
  assets,
  assetTags,
  draft,
  pickerVisibleLimit = DEFAULT_PICKER_VISIBLE_LIMIT,
}) {
  const assetSearchTerm = ref("")

  const clearAssetSearchTerm = () => {
    assetSearchTerm.value = ""
  }

  const assetsForDraftCompany = computed(() => {
    const draftCompanyId = normalizeId(draft.value.companyId)

    return assets.value
      .filter((asset) => normalizeId(asset.companyId) === draftCompanyId)
      .map((asset) => ({
        ...asset,
        id: normalizeId(asset.id),
        label: getAssetLabel(asset),
      }))
      .filter((asset) => asset.id)
      .sort((left, right) => left.label.localeCompare(right.label, "es", { sensitivity: "base" }))
  })

  const filteredAssetsForDraftCompany = computed(() => {
    const search = normalizeSearchText(assetSearchTerm.value)

    if (!search) {
      return assetsForDraftCompany.value
    }

    return assetsForDraftCompany.value.filter((asset) => {
      return normalizeSearchText(asset.label).includes(search)
    })
  })

  const visibleAssetsForDraftCompany = computed(() => {
    return filteredAssetsForDraftCompany.value.slice(0, pickerVisibleLimit)
  })

  const hiddenFilteredAssetCount = computed(() => {
    return Math.max(
      0,
      filteredAssetsForDraftCompany.value.length - visibleAssetsForDraftCompany.value.length,
    )
  })

  const assetTagOptions = computed(() => {
    const draftCompanyId = normalizeId(draft.value.companyId)
    const tagsById = new Map()

    assetTags.value
      .filter((tag) => tag.active !== false)
      .filter((tag) => normalizeId(tag.companyId) === draftCompanyId)
      .forEach((tag) => {
        const tagId = normalizeAssetTagId(tag.id)

        if (!tagId) return

        tagsById.set(tagId, {
          id: tagId,
          name: tag.name || tag.label || tagId,
          assetCount: 0,
        })
      })

    assetsForDraftCompany.value.forEach((asset) => {
      getAssetTagIds(asset).forEach((tagId) => {
        const currentTag = tagsById.get(tagId) || {
          id: tagId,
          name: tagId,
          assetCount: 0,
        }

        currentTag.assetCount += 1
        tagsById.set(tagId, currentTag)
      })
    })

    return Array.from(tagsById.values()).sort((left, right) => {
      return left.name.localeCompare(right.name, "es", { sensitivity: "base" })
    })
  })

  const selectedDraftAssetIds = computed(() => {
    if (draft.value.assetScope.type === "specific") {
      const availableAssetIds = new Set(assetsForDraftCompany.value.map((asset) => asset.id))

      return draft.value.assetScope.assetIds.filter((assetId) => {
        return availableAssetIds.has(normalizeId(assetId))
      })
    }

    if (draft.value.assetScope.type === "asset-tags") {
      return assetsForDraftCompany.value
        .filter((asset) => {
          return assetMatchesTagIds(asset, draft.value.assetScope.assetTagIds)
        })
        .map((asset) => asset.id)
    }

    return assetsForDraftCompany.value.map((asset) => asset.id)
  })

  const selectedDraftAssetCount = computed(() => selectedDraftAssetIds.value.length)

  const selectedDraftAssetIdSet = computed(() => {
    return new Set(selectedDraftAssetIds.value)
  })

  const selectedDraftAssetTagIdSet = computed(() => {
    return new Set((draft.value.assetScope.assetTagIds || []).map(normalizeAssetTagId))
  })

  const setDraftAssetScope = (type) => {
    if (type === "specific") {
      draft.value.assetScope = {
        type: "specific",
        assetIds: selectedDraftAssetIds.value.length
          ? selectedDraftAssetIds.value
          : assetsForDraftCompany.value.map((asset) => asset.id),
        assetTagIds: [],
      }

      return
    }

    if (type === "asset-tags") {
      draft.value.assetScope = {
        type: "asset-tags",
        assetIds: [],
        assetTagIds: draft.value.assetScope.assetTagIds || [],
      }

      return
    }

    draft.value.assetScope = {
      type: "all",
      assetIds: [],
      assetTagIds: [],
    }
  }

  const isDraftAssetSelected = (assetId) => {
    return selectedDraftAssetIdSet.value.has(normalizeId(assetId))
  }

  const toggleDraftAsset = (assetId) => {
    const normalizedAssetId = normalizeId(assetId)
    const currentIds = new Set(selectedDraftAssetIds.value)

    if (currentIds.has(normalizedAssetId)) {
      currentIds.delete(normalizedAssetId)
    } else {
      currentIds.add(normalizedAssetId)
    }

    draft.value.assetScope = {
      type: "specific",
      assetIds: [...currentIds],
      assetTagIds: [],
    }
  }

  const selectAllDraftAssets = () => {
    draft.value.assetScope = {
      type: "specific",
      assetIds: assetsForDraftCompany.value.map((asset) => asset.id),
      assetTagIds: [],
    }
  }

  const isDraftAssetTagSelected = (tagId) => {
    return selectedDraftAssetTagIdSet.value.has(normalizeAssetTagId(tagId))
  }

  const toggleDraftAssetTag = (tagId) => {
    const normalizedTagId = normalizeAssetTagId(tagId)
    const currentIds = new Set((draft.value.assetScope.assetTagIds || []).map(normalizeAssetTagId))

    if (currentIds.has(normalizedTagId)) {
      currentIds.delete(normalizedTagId)
    } else {
      currentIds.add(normalizedTagId)
    }

    draft.value.assetScope = {
      type: "asset-tags",
      assetIds: [],
      assetTagIds: [...currentIds],
    }
  }

  return {
    assetSearchTerm,
    assetTagOptions,
    assetsForDraftCompany,
    clearAssetSearchTerm,
    filteredAssetsForDraftCompany,
    hiddenFilteredAssetCount,
    isDraftAssetSelected,
    isDraftAssetTagSelected,
    selectAllDraftAssets,
    selectedDraftAssetCount,
    selectedDraftAssetIds,
    setDraftAssetScope,
    toggleDraftAsset,
    toggleDraftAssetTag,
    visibleAssetsForDraftCompany,
  }
}
