import { useScopedAssetGroupFilter } from "./useScopedAssetGroupFilter.js"

const SELECTED_CITY_FILTER_KEY = "sinergy-selected-city-asset-filter"
const LEGACY_SELECTED_GROUP_KEY = "sinergy-selected-personal-asset-group"

export function useAssetCityFilter({ userId, companyId, availableActivos, cityGroups }) {
  const {
    assetGroups,
    selectedAssetGroupId,
    selectedAssetGroup,
    selectedAssetIds,
    selectAssetGroup,
    filterActivosBySelectedGroup,
  } = useScopedAssetGroupFilter({
    userId,
    contextId: companyId,
    availableActivos,
    groups: cityGroups,
    storageKey: SELECTED_CITY_FILTER_KEY,
    legacyStorageKey: LEGACY_SELECTED_GROUP_KEY,
    keepEmptyGroups: false,
  })

  return {
    cityAssetGroups: assetGroups,
    selectedCityAssetGroupId: selectedAssetGroupId,
    selectedCityAssetGroup: selectedAssetGroup,
    selectedCityAssetIds: selectedAssetIds,

    selectCityAssetGroup: selectAssetGroup,
    filterActivosBySelectedCityGroup: filterActivosBySelectedGroup,
  }
}
