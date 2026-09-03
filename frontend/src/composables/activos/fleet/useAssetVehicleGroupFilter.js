import { useScopedAssetGroupFilter } from "./useScopedAssetGroupFilter.js"

const SELECTED_VEHICLE_GROUP_FILTER_KEY = "sinergy-selected-vehicle-group-filter"

export function useAssetVehicleGroupFilter({ userId, contextId, availableActivos, vehicleGroups }) {
  const {
    assetGroups,
    selectedAssetGroupId,
    selectedAssetGroup,
    selectedAssetIds,
    selectAssetGroup,
    filterActivosBySelectedGroup,
  } = useScopedAssetGroupFilter({
    userId,
    contextId,
    availableActivos,
    groups: vehicleGroups,
    storageKey: SELECTED_VEHICLE_GROUP_FILTER_KEY,
    keepEmptyGroups: true,
  })

  return {
    vehicleAssetGroups: assetGroups,
    selectedVehicleAssetGroupId: selectedAssetGroupId,
    selectedVehicleAssetGroup: selectedAssetGroup,
    selectedVehicleAssetIds: selectedAssetIds,

    selectVehicleAssetGroup: selectAssetGroup,
    filterActivosBySelectedVehicleGroup: filterActivosBySelectedGroup,
  }
}
