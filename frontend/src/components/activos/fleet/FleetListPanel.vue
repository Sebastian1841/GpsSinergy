<template>
  <aside class="fleet-readable flex h-full min-h-0 flex-col overflow-hidden bg-white">
    <FleetPanelHeader
      :active-section="localActiveSection"
      :sections="menuSections"
      :search="localSearch"
      :search-placeholder="searchPlaceholder"
      :sort-column-key="sortColumnKey"
      :can-create-assets="canCreateAssets"
      :show-columns="showColumns"
      :visible-columns="activeHeaderVisibleColumns"
      :configurable-columns="activeHeaderConfigurableColumns"
      :filtered-configurable-columns="activeHeaderFilteredConfigurableColumns"
      :visible-column-keys="activeHeaderVisibleColumnKeys"
      :column-search="columnSearch"
      :show-search-actions="localActiveSection !== 'geocercas'"
      @set-section="setSection"
      @search-input="handleSearchInput"
      @clear-search="clearSearch"
      @clear-sort="clearSort"
      @open-add-activo="$emit('open-add-activo')"
      @toggle-columns="toggleColumnsDropdown"
      @reset-columns="handleResetColumns"
      @update-column-search="columnSearch = $event"
      @toggle-column-key="toggleColumnKey"
    />

    <FleetSectionContent
      :active-section="localActiveSection"
      :allowed-sections="allowedSections"
      :sorted-activos="activeSortedActivos"
      :visible-columns="activeTableVisibleColumns"
      :selected-id="selectedId"
      :first-visible-column-key="activeFirstVisibleColumnKey"
      :sort-column-key="sortColumnKey"
      :get-sort-icon="getSortIcon"
      :get-cell-value="getCellValue"
      :itinerary-activos="activeItineraryActivos"
      :itinerary-context-request="itineraryContextRequest"
      :activos="activeSectionActivos"
      :all-activos="activeSectionAllActivos"
      :company-id="companyId"
      :asset-tags="assetTags"
      :can-manage-asset-tags="canManageAssets"
      :search="localSearch"
      :geofences="activeSectionGeofences"
      :geofence-groups="geofenceGroups"
      :filtered-geofences="activeFilteredGeofences"
      :selected-geofence-id="selectedGeofenceId"
      :can-edit-geofences="canEditGeofences"
      :use-geofence-location-address="useGeofenceLocationAddress"
      :alert-rows="alertRows"
      :alert-summary="alertSummary"
      :can-manage-alerts="canManageAlerts"
      @select="handleRowClick"
      @toggle-sort="handleToggleSort"
      @resize-column="handleSetColumnWidth"
      @move-column="handleMoveColumn"
      @open-context-menu="handleTableContextMenu"
      @route-selected="$emit('route-selected', $event)"
      @point-selected="$emit('point-selected', $event)"
      @clear-route="$emit('clear-route', $event)"
      @select-geofence="handleGeofenceSelect"
      @edit-geofence="handleGeofenceEdit"
      @delete-geofence="confirmDeleteGeofence"
      @delete-geofences="confirmDeleteGeofences"
      @export-geofences="$emit('geofence-export', $event)"
      @import-geofences="$emit('geofence-import', $event)"
      @create-geofence-group="$emit('geofence-group-create', $event)"
      @delete-geofence-group="$emit('geofence-group-delete', $event)"
      @rename-geofence-group="$emit('geofence-group-rename', $event)"
      @create-asset-tag="$emit('asset-tag-create', $event)"
      @update-asset-tag="$emit('asset-tag-update', $event)"
      @delete-asset-tag="$emit('asset-tag-delete', $event)"
      @update:search="handleSearchUpdate"
      @update:use-geofence-location-address="$emit('update:use-geofence-location-address', $event)"
      @view-alert-route="$emit('view-alert-route', $event)"
      @resolve-alert="$emit('resolve-alert', $event)"
      @reopen-alert="$emit('reopen-alert', $event)"
    />

    <div
      v-if="localActiveSection === 'activos' && allowedSections.includes('activos')"
      class="shrink-0 border-t border-[#d8dee8] bg-[#f8fafc] px-3 py-2"
    >
      <button
        type="button"
        class="w-full cursor-pointer rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
        @click="handleShowAllAssets"
      >
        Ver todos los activos →
      </button>
    </div>

    <FleetContextMenu
      v-if="canOpenDeviceContextMenu"
      :is-open="deviceContextMenu.isOpen"
      :x="deviceContextMenu.x"
      :y="deviceContextMenu.y"
      :activo="deviceContextMenu.activo"
      :can-manage-assets="canManageAssets"
      :can-view-itineraries="canViewItineraries"
      :can-view-maintenance="canViewMaintenance"
      :has-active-daily-summary="hasActiveDailySummary"
      @close="closeDeviceContextMenu"
      @action="handleDeviceAction"
    />
  </aside>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue"
import FleetContextMenu from "./FleetContextMenu.vue"
import FleetPanelHeader from "./FleetPanelHeader.vue"
import FleetSectionContent from "./FleetSectionContent.vue"
import { useFleetColumns } from "../../../composables/activos/fleet/useFleetColumns"
import { useFleetDeviceContextMenu } from "../../../composables/activos/fleet/useFleetDeviceContextMenu.js"
import { useFleetPanelGeofences } from "../../../composables/activos/fleet/useFleetPanelGeofences.js"
import { useFleetPanelSearch } from "../../../composables/activos/fleet/useFleetPanelSearch.js"
import { useFleetPanelSections } from "../../../composables/activos/fleet/useFleetPanelSections.js"
import { useFleetSorting } from "../../../composables/activos/fleet/useFleetSorting"
import {
  FLEET_TELEMETRY_COLUMNS,
  getCellValue,
  normalizeText,
} from "../../../utils/activos/fleetTelemetryColumns.js"

const props = defineProps({
  activos: {
    type: Array,
    default: () => [],
  },
  allActivos: {
    type: Array,
    default: () => [],
  },
  companyId: {
    type: [String, Number],
    default: "",
  },
  assetTags: {
    type: Array,
    default: () => [],
  },
  itineraryActivos: {
    type: Array,
    default: () => [],
  },
  itineraryContextRequest: {
    type: Object,
    default: null,
  },
  geofences: {
    type: Array,
    default: () => [],
  },
  geofenceGroups: {
    type: Array,
    default: () => [],
  },
  alertRows: {
    type: Array,
    default: () => [],
  },
  alertSummary: {
    type: Object,
    default: () => ({
      total: 0,
      active: 0,
      open: 0,
      critical: 0,
      resolved: 0,
    }),
  },
  selectedGeofenceId: {
    type: [String, Number],
    default: null,
  },
  selectedId: {
    type: [Number, String],
    default: null,
  },
  search: {
    type: String,
    default: "",
  },
  activeFilter: {
    type: String,
    default: "all",
  },
  activeSection: {
    type: String,
    default: "activos",
  },
  allowedSections: {
    type: Array,
    default: () => ["activos", "reportes", "itinerarios", "geocercas", "etiquetas", "alertas"],
  },
  canManageAssets: {
    type: Boolean,
    default: false,
  },
  canCreateAssets: {
    type: Boolean,
    default: false,
  },
  canViewItineraries: {
    type: Boolean,
    default: false,
  },
  canViewMaintenance: {
    type: Boolean,
    default: false,
  },
  canManageAlerts: {
    type: Boolean,
    default: false,
  },
  hasActiveDailySummary: {
    type: Boolean,
    default: false,
  },
  canEditGeofences: {
    type: Boolean,
    default: false,
  },
  useGeofenceLocationAddress: {
    type: Boolean,
    default: true,
  },
  columnPreferences: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  "select",
  "update:search",
  "select-filter",
  "update:active-section",
  "select-section",
  "route-selected",
  "point-selected",
  "clear-route",
  "open-add-activo",
  "device-action",
  "geofence-selected",
  "geofence-edit",
  "geofence-delete",
  "geofence-delete-many",
  "geofence-export",
  "geofence-import",
  "geofence-group-create",
  "geofence-group-delete",
  "geofence-group-rename",
  "asset-tag-create",
  "asset-tag-update",
  "asset-tag-delete",
  "update:use-geofence-location-address",
  "view-alert-route",
  "resolve-alert",
  "reopen-alert",
  "select-city-asset-group",
  "select-vehicle-asset-group",
  "update:column-preferences",
])

const showColumns = ref(false)
const localActiveSection = ref(props.activeSection || "activos")

const canOpenDeviceContextMenu = computed(() => {
  return props.canManageAssets || props.canViewItineraries || props.canViewMaintenance
})

const { deviceContextMenu, closeDeviceContextMenu, handleTableContextMenu, handleDeviceAction } =
  useFleetDeviceContextMenu({
    canOpenDeviceContextMenu: () => canOpenDeviceContextMenu.value,
    closeColumns: () => {
      showColumns.value = false
    },
    onDeviceAction: (payload) => {
      emit("device-action", payload)
    },
  })

const { localSearch, searchPlaceholder, clearSearch, handleSearchInput } = useFleetPanelSearch({
  activeSection: localActiveSection,
  emitSearch: (value) => {
    emit("update:search", value)
  },
  search: computed(() => props.search),
})

const handleSearchUpdate = (value) => {
  localSearch.value = value
  emit("update:search", value)
}

const fleetColumns = computed(() => FLEET_TELEMETRY_COLUMNS)

const {
  columnSearch,
  visibleColumnKeys,
  configurableColumns,
  filteredConfigurableColumns,
  visibleColumns,
  firstVisibleColumnKey,
  resetColumns,
  getColumnPreferences,
  applyColumnPreferences,
  setColumnWidth,
  moveColumn,
} = useFleetColumns({
  columns: fleetColumns,
  normalizeText,
})

const { sortColumnKey, sortedActivos, toggleSort, clearSort, getSortIcon } = useFleetSorting({
  activos: computed(() => props.activos),
  columns: fleetColumns,
  getCellValue,
  normalizeText,
})

const {
  activeFirstVisibleColumnKey,
  activeHeaderConfigurableColumns,
  activeHeaderFilteredConfigurableColumns,
  activeHeaderVisibleColumnKeys,
  activeHeaderVisibleColumns,
  isActivosSection,
  activeItineraryActivos,
  activeReportActivos,
  activeReportAllActivos,
  activeSortedActivos,
  activeTableVisibleColumns,
  isGeocercasSection,
  isReportesSection,
  menuSections,
  setSection,
} = useFleetPanelSections({
  activeSection: localActiveSection,
  alertRows: computed(() => props.alertRows),
  activos: computed(() => props.activos),
  allActivos: computed(() => props.allActivos),
  assetTags: computed(() => props.assetTags),
  allowedSections: computed(() => props.allowedSections),
  closeDeviceContextMenu,
  columnSearch,
  configurableColumns,
  emitSectionSelected: (section) => {
    emit("update:active-section", section)
    emit("select-section", section)
  },
  filteredConfigurableColumns,
  firstVisibleColumnKey,
  geofences: computed(() => props.geofences),
  itineraryActivos: computed(() => props.itineraryActivos),
  showColumns,
  sourceActiveSection: computed(() => props.activeSection),
  sortedActivos,
  visibleColumnKeys,
  visibleColumns,
})

const activeSectionActivos = computed(() => {
  if (localActiveSection.value === "etiquetas") {
    return props.activos
  }

  return activeReportActivos.value
})

const activeSectionAllActivos = computed(() => {
  if (localActiveSection.value === "etiquetas") {
    return props.allActivos.length ? props.allActivos : props.activos
  }

  return activeReportAllActivos.value
})

const {
  activeFilteredGeofences,
  activeSectionGeofences,
  confirmDeleteGeofence,
  confirmDeleteGeofences,
  handleGeofenceEdit,
  handleGeofenceSelect,
} = useFleetPanelGeofences({
  emitDeleteGeofence: (geofenceId) => {
    emit("geofence-delete", geofenceId)
  },
  emitDeleteGeofences: (geofenceIds) => {
    emit("geofence-delete-many", geofenceIds)
  },
  emitEditGeofence: (geofence) => {
    emit("geofence-edit", geofence)
  },
  emitSelectGeofence: (geofence) => {
    emit("geofence-selected", geofence)
  },
  geofences: computed(() => props.geofences),
  isActivosSection,
  isGeocercasSection,
  isReportesSection,
  normalizeText,
  search: computed(() => props.search),
})

const toggleColumnsDropdown = () => {
  closeDeviceContextMenu()
  showColumns.value = !showColumns.value
}

const emitColumnPreferences = () => {
  emit("update:column-preferences", getColumnPreferences())
}

const handleResetColumns = () => {
  resetColumns()
  emitColumnPreferences()
}

const toggleColumnKey = (columnKey) => {
  const column = configurableColumns.value.find((item) => item.key === columnKey)

  if (!column || column.locked) return

  if (visibleColumnKeys.value.includes(columnKey)) {
    visibleColumnKeys.value = visibleColumnKeys.value.filter((key) => key !== columnKey)
    emitColumnPreferences()
    return
  }

  visibleColumnKeys.value = [...visibleColumnKeys.value, columnKey]
  emitColumnPreferences()
}

const handleSetColumnWidth = (columnKey, width) => {
  setColumnWidth(columnKey, width)
  emitColumnPreferences()
}

const handleMoveColumn = (sourceColumnKey, targetColumnKey) => {
  moveColumn(sourceColumnKey, targetColumnKey)
  emitColumnPreferences()
}

const handleRowClick = (activo) => {
  closeDeviceContextMenu()
  emit("select", activo.id)
}

const handleToggleSort = (columnKey) => {
  closeDeviceContextMenu()
  toggleSort(columnKey)
}

const handleShowAllAssets = () => {
  emit("select-city-asset-group", null)
  emit("select-vehicle-asset-group", null)
  emit("select-filter", "all")
}

watch(
  () => props.columnPreferences,
  (preferences) => {
    applyColumnPreferences(preferences)
  },
  {
    deep: true,
    immediate: true,
  },
)

onMounted(() => {
  emitColumnPreferences()
})
</script>

<style scoped>
.fleet-readable :deep(.text-\[8px\]) {
  font-size: 9px !important;
  line-height: 0.95rem !important;
}

.fleet-readable :deep(.text-\[9px\]) {
  font-size: 10px !important;
  line-height: 1rem !important;
}

.fleet-readable :deep(.text-\[10px\]) {
  font-size: 11px !important;
  line-height: 1.1rem !important;
}

.fleet-readable :deep(.text-\[11px\]),
.fleet-readable :deep(.text-xs) {
  font-size: 12px !important;
  line-height: 1.2rem !important;
}

.fleet-readable :deep(.text-\[12px\]) {
  font-size: 13px !important;
  line-height: 1.3rem !important;
}

.fleet-readable :deep(.text-\[13px\]),
.fleet-readable :deep(.text-sm) {
  font-size: 14px !important;
  line-height: 1.4rem !important;
}
</style>
