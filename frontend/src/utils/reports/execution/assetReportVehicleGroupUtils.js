import { normalizeReportId } from "./assetReportExecutionUtils.js"

const toArray = (value) => {
  if (Array.isArray(value)) return value

  if (value === undefined || value === null || String(value).trim() === "") {
    return []
  }

  return [value]
}

const normalizeIds = (values = []) => {
  return [...new Set(values.map((value) => normalizeReportId(value)).filter(Boolean))]
}

export const normalizeReportVehicleGroup = (group = {}) => {
  const id = normalizeReportId(group.vehicleGroupId ?? group.groupId ?? group.id)

  if (!id) return null

  return {
    ...group,

    id,

    name:
      group.vehicleGroupName ||
      group.groupName ||
      group.name ||
      group.nombre ||
      group.label ||
      group.title ||
      group.alias ||
      `Grupo ${id}`,
  }
}

export const getAssetVehicleGroupIds = (asset = {}) => {
  return normalizeIds([
    ...toArray(asset.vehicleGroupIds),
    asset.vehicleGroupId,

    ...toArray(asset.groupIds),
    asset.groupId,
  ])
}

export const assetMatchesVehicleGroup = (asset, vehicleGroupId) => {
  const normalizedVehicleGroupId = normalizeReportId(vehicleGroupId)

  if (!normalizedVehicleGroupId) {
    return true
  }

  return getAssetVehicleGroupIds(asset).includes(normalizedVehicleGroupId)
}
