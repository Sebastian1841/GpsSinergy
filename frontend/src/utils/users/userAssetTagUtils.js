const normalizeText = (value) => {
  return String(value ?? "").trim()
}

export const normalizeAssetTagId = (value) => {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export const getAssetTagCompanyKey = (tag = {}) => {
  return (
    normalizeText(
      tag.companyId || tag.company?.id || tag.applicationCompanyId || tag.applicationId,
    ) || "sin-empresa"
  )
}

export const getAssetTagCompanyLabel = (tag = {}) => {
  return (
    normalizeText(tag.companyName || tag.company?.name || tag.empresa || tag.companyLabel) ||
    (getAssetTagCompanyKey(tag) === "sin-empresa"
      ? "Sin empresa"
      : `Empresa ${getAssetTagCompanyKey(tag)}`)
  )
}

export const groupAssetTagsByCompany = (tags = []) => {
  const groupsByCompany = new Map()

  tags.forEach((tag) => {
    const companyKey = getAssetTagCompanyKey(tag)
    const currentGroup = groupsByCompany.get(companyKey) || {
      key: companyKey,
      label: getAssetTagCompanyLabel(tag),
      tags: [],
    }

    currentGroup.tags.push(tag)
    groupsByCompany.set(companyKey, currentGroup)
  })

  return Array.from(groupsByCompany.values()).sort((left, right) => {
    return left.label.localeCompare(right.label, "es", {
      sensitivity: "base",
    })
  })
}

const normalizeTagEntry = (tag) => {
  if (tag === null || tag === undefined) return null

  if (typeof tag === "object") {
    const name = normalizeText(tag.name || tag.label || tag.value || tag.id)
    const id = normalizeAssetTagId(tag.id || tag.value || name)

    if (!id || !name) return null

    return {
      id,
      name,
    }
  }

  const name = normalizeText(tag)
  const id = normalizeAssetTagId(name)

  if (!id || !name) return null

  return {
    id,
    name,
  }
}

const getExplicitTagEntries = (asset = {}) => {
  const sources = [asset.assetTagIds, asset.assetTags]

  return sources
    .filter(Array.isArray)
    .flatMap((items) => items.map(normalizeTagEntry))
    .filter(Boolean)
}

export const getAssetTagEntries = (asset = {}) => {
  const explicitTags = getExplicitTagEntries(asset)
  const tagsById = new Map()

  explicitTags.forEach((tag) => {
    const normalizedTag = normalizeTagEntry(tag)

    if (normalizedTag && !tagsById.has(normalizedTag.id)) {
      tagsById.set(normalizedTag.id, normalizedTag)
    }
  })

  return Array.from(tagsById.values())
}

export const getAssetTagIds = (asset = {}) => {
  return getAssetTagEntries(asset).map((tag) => tag.id)
}

export const buildAssetTagOptions = (assets = []) => {
  const tagsById = new Map()

  assets.forEach((asset) => {
    getAssetTagEntries(asset).forEach((tag) => {
      const currentTag = tagsById.get(tag.id) || {
        ...tag,
        assetCount: 0,
      }

      currentTag.assetCount += 1
      tagsById.set(tag.id, currentTag)
    })
  })

  return Array.from(tagsById.values()).sort((left, right) => {
    return left.name.localeCompare(right.name, "es", {
      sensitivity: "base",
    })
  })
}

export const assetMatchesTagIds = (asset = {}, tagIds = []) => {
  const selectedTagIds = new Set(tagIds.map(normalizeAssetTagId).filter(Boolean))

  if (!selectedTagIds.size) return false

  return getAssetTagIds(asset).some((tagId) => selectedTagIds.has(tagId))
}
