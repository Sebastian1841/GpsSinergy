import { ref, watch } from "vue"

import { readJsonStorage, writeJsonStorage } from "../../../services/storage/browserStorage.js"
import { normalizeId } from "../../../utils/idUtils.js"

const GEOFENCE_LOCATION_ADDRESS_STORAGE_KEY = "sinergy-geofence-location-address-enabled"
const ACTIVOS_WORKSPACE_MODULE = "activos"
const ALLOWED_SIDEBAR_SECTIONS = ["activos", "reportes", "itinerarios", "geocercas", "sucursales"]
const ALLOWED_STATUS_FILTERS = ["all", "online", "offline", "moving", "stopped", "alerts"]

const normalizeWorkspaceSidebarSection = (section) => {
  return ALLOWED_SIDEBAR_SECTIONS.includes(section) ? section : "activos"
}

const normalizeWorkspaceStatusFilter = (filter) => {
  return ALLOWED_STATUS_FILTERS.includes(filter) ? filter : "all"
}

const normalizeWorkspaceColumnKeys = (keys = []) => {
  if (!Array.isArray(keys)) return []

  return Array.from(new Set(keys.map((key) => String(key || "").trim()).filter(Boolean)))
}

const normalizeWorkspaceColumnWidths = (widthsByKey = {}) => {
  if (!widthsByKey || typeof widthsByKey !== "object" || Array.isArray(widthsByKey)) {
    return {}
  }

  return Object.entries(widthsByKey).reduce((normalizedWidths, [key, width]) => {
    const columnKey = String(key || "").trim()
    const columnWidth = Number(width)

    if (!columnKey || !Number.isFinite(columnWidth)) return normalizedWidths

    return {
      ...normalizedWidths,
      [columnKey]: columnWidth,
    }
  }, {})
}

export const normalizeFleetTableColumnPreferences = (preferences = {}) => {
  if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) {
    return {}
  }

  return {
    visibleColumnKeys: normalizeWorkspaceColumnKeys(preferences.visibleColumnKeys),
    columnOrderKeys: normalizeWorkspaceColumnKeys(
      preferences.columnOrderKeys || preferences.order || preferences.columnOrder,
    ),
    columnWidthsByKey: normalizeWorkspaceColumnWidths(preferences.columnWidthsByKey),
  }
}

export function useActivosWorkspacePersistence({
  activeCompanyId,
  activeSidebarSection,
  ensureSelectedActivo,
  leftPanelWidth,
  pendingWorkspaceViewRestore,
  persistPanelWidth,
  publishWorkspaceViewState,
  refreshMapLayout,
  route,
  sectionSearch,
  selectPersonalAssetGroup,
  selectedGeofenceId,
  selectedId,
  selectedPersonalAssetGroupId,
  statusFilter,
}) {
  const useGeofenceLocationAddress = ref(readJsonStorage(GEOFENCE_LOCATION_ADDRESS_STORAGE_KEY, true))
  const fleetTableColumnPreferences = ref({})

  const setUseGeofenceLocationAddress = (enabled) => {
    useGeofenceLocationAddress.value = Boolean(enabled)
  }

  const setFleetTableColumnPreferences = (preferences = {}) => {
    fleetTableColumnPreferences.value = normalizeFleetTableColumnPreferences(preferences)
  }

  const buildActivosWorkspaceSettings = () => {
    return {
      module: ACTIVOS_WORKSPACE_MODULE,
      statusFilter: statusFilter.value,
      activeSidebarSection: activeSidebarSection.value,
      sectionSearch: {
        ...sectionSearch.value,
      },
      selectedActivoId: normalizeId(selectedId.value),
      selectedGeofenceId: normalizeId(selectedGeofenceId.value),
      selectedPersonalAssetGroupId: normalizeId(selectedPersonalAssetGroupId.value),
      leftPanelWidth: leftPanelWidth.value,
      fleetLayout: {
        leftPanelWidth: leftPanelWidth.value,
      },
      fleetTableColumns: normalizeFleetTableColumnPreferences(fleetTableColumnPreferences.value),
      useGeofenceLocationAddress: Boolean(useGeofenceLocationAddress.value),
    }
  }

  const publishActivosWorkspaceState = () => {
    publishWorkspaceViewState({
      module: ACTIVOS_WORKSPACE_MODULE,
      companyId: activeCompanyId.value,
      routePath: route.fullPath || route.path,
      routeName: "Activos",
      settings: buildActivosWorkspaceSettings(),
    })
  }

  const applyActivosWorkspaceSettings = async (settings = {}) => {
    if (!settings || (settings.module && settings.module !== ACTIVOS_WORKSPACE_MODULE)) return

    if (settings.sectionSearch && typeof settings.sectionSearch === "object") {
      sectionSearch.value = {
        ...sectionSearch.value,
        ...settings.sectionSearch,
      }
    }

    activeSidebarSection.value = normalizeWorkspaceSidebarSection(settings.activeSidebarSection)
    statusFilter.value = normalizeWorkspaceStatusFilter(settings.statusFilter)

    if (settings.selectedPersonalAssetGroupId !== undefined) {
      selectPersonalAssetGroup(settings.selectedPersonalAssetGroupId || null)
    }

    const restoredLeftPanelWidth = settings.fleetLayout?.leftPanelWidth ?? settings.leftPanelWidth

    if (restoredLeftPanelWidth !== undefined) {
      persistPanelWidth(restoredLeftPanelWidth)
    }

    if (settings.fleetTableColumns || settings.tableColumns) {
      setFleetTableColumnPreferences(settings.fleetTableColumns || settings.tableColumns)
    }

    if (typeof settings.useGeofenceLocationAddress === "boolean") {
      setUseGeofenceLocationAddress(settings.useGeofenceLocationAddress)
    }

    if (settings.selectedGeofenceId !== undefined) {
      selectedGeofenceId.value = normalizeId(settings.selectedGeofenceId) || null
    }

    const nextSelectedActivoId = normalizeId(settings.selectedActivoId || settings.selectedId)

    if (nextSelectedActivoId) {
      selectedId.value = nextSelectedActivoId
    }

    ensureSelectedActivo()
    await refreshMapLayout(true)
  }

  watch(useGeofenceLocationAddress, (enabled) => {
    writeJsonStorage(GEOFENCE_LOCATION_ADDRESS_STORAGE_KEY, Boolean(enabled))
  })

  watch(
    [
      activeCompanyId,
      statusFilter,
      activeSidebarSection,
      sectionSearch,
      selectedId,
      selectedGeofenceId,
      selectedPersonalAssetGroupId,
      leftPanelWidth,
      fleetTableColumnPreferences,
      useGeofenceLocationAddress,
    ],
    publishActivosWorkspaceState,
    {
      deep: true,
      immediate: true,
    },
  )

  watch(
    pendingWorkspaceViewRestore,
    (request) => {
      if (!request?.settings) return
      if (request.routePath && request.routePath !== route.fullPath) return

      void applyActivosWorkspaceSettings(request.settings)
    },
    {
      immediate: true,
    },
  )

  return {
    fleetTableColumnPreferences,
    setFleetTableColumnPreferences,
    setUseGeofenceLocationAddress,
    useGeofenceLocationAddress,
  }
}
