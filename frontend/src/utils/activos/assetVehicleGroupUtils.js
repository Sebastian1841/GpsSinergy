import { normalizeId } from "../idUtils.js"

export const VEHICLE_ASSET_GROUP_TYPE = "vehicle-group"
export const VEHICLE_ASSET_GROUP_ID_PREFIX = "vehicle-group:"
export const UNASSIGNED_VEHICLE_GROUP_ID = `${VEHICLE_ASSET_GROUP_ID_PREFIX}unassigned`

const firstText = (...values) => {
  return values
    .map((value) => String(value ?? "").trim())
    .find((value) => value && value !== "-")
}

export const createVehicleAssetGroupId = (groupId) => {
  return `${VEHICLE_ASSET_GROUP_ID_PREFIX}${normalizeId(groupId)}`
}

export const isVehicleAssetGroupId = (groupId) => {
  return normalizeId(groupId).startsWith(VEHICLE_ASSET_GROUP_ID_PREFIX)
}

export const getVehicleAssetGroupSourceId = (groupId) => {
  const normalizedGroupId = normalizeId(groupId)

  if (!normalizedGroupId) return ""

  return isVehicleAssetGroupId(normalizedGroupId)
    ? normalizedGroupId.slice(VEHICLE_ASSET_GROUP_ID_PREFIX.length)
    : normalizedGroupId
}

const normalizeVehicleGroup = (group = {}) => {
  const sourceId = getVehicleAssetGroupSourceId(
    firstText(group.id, group.vehicleGroupId, group.fleetGroupId, group.groupId),
  )

  if (!sourceId) return null

  return {
    ...group,
    id: createVehicleAssetGroupId(sourceId),
    sourceId,
    type: VEHICLE_ASSET_GROUP_TYPE,
    name:
      firstText(group.name, group.nombre, group.label, group.title, group.alias) ||
      `Grupo ${sourceId}`,
    description: firstText(group.description, group.descripcion, group.companyName),
    assetIds: Array.isArray(group.assetIds)
      ? group.assetIds.map((assetId) => normalizeId(assetId)).filter(Boolean)
      : [],
    createdAt: group.createdAt || null,
    updatedAt: group.updatedAt || null,
    managed: group.managed === true,
  }
}

export const createVehicleAssetGroups = ({ assets = [], groups = [] } = {}) => {
  const groupsBySourceId = new Map()
  const availableAssetIds = new Set(
    (Array.isArray(assets) ? assets : [])
      .map((asset) => normalizeId(asset?.id))
      .filter(Boolean),
  )
  const assignedAssetIds = new Set()
  const configuredGroups = Array.isArray(groups) ? groups : []

  configuredGroups.forEach((group) => {
    const normalizedGroup = normalizeVehicleGroup(group)

    if (!normalizedGroup || normalizedGroup.active === false) return

    normalizedGroup.assetIds = normalizedGroup.assetIds.filter((assetId) => {
      return availableAssetIds.has(normalizeId(assetId))
    })

    normalizedGroup.assetIds.forEach((assetId) => {
      assignedAssetIds.add(normalizeId(assetId))
    })

    groupsBySourceId.set(normalizedGroup.sourceId, normalizedGroup)
  })

  const unassignedAssetIds = Array.from(availableAssetIds).filter((assetId) => {
    return !assignedAssetIds.has(normalizeId(assetId))
  })

  const vehicleGroups = Array.from(groupsBySourceId.values())
    .map((group) => ({
      ...group,
      assetIds: Array.from(new Set(group.assetIds)),
    }))
    .sort((firstGroup, secondGroup) => {
      return String(firstGroup.name || "").localeCompare(String(secondGroup.name || ""), "es")
    })

  if (unassignedAssetIds.length) {
    vehicleGroups.push({
      id: UNASSIGNED_VEHICLE_GROUP_ID,
      sourceId: "",
      type: VEHICLE_ASSET_GROUP_TYPE,
      name: "Sin grupo",
      description: "Activos sin grupo asignado",
      assetIds: Array.from(new Set(unassignedAssetIds)),
      readonly: true,
    })
  }

  return vehicleGroups
}
