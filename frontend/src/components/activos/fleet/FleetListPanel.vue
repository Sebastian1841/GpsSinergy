<template>
  <aside class="flex h-full min-h-0 flex-col overflow-hidden bg-white">
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
      :activos="activeReportActivos"
      :all-activos="activeReportAllActivos"
      :company-id="companyId"
      :search="localSearch"
      :geofences="activeSectionGeofences"
      :filtered-geofences="activeFilteredGeofences"
      :selected-geofence-id="selectedGeofenceId"
      :can-edit-geofences="canEditGeofences"
      :use-geofence-location-address="useGeofenceLocationAddress"
      :empresa-sucursales="empresaSucursales"
      :sucursal-companies="sucursalCompanies"
      :selected-sucursal-company-id="selectedSucursalCompanyId"
      :show-sucursal-company-selector="showSucursalCompanySelector"
      :can-manage-sucursales="canManageSucursales"
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
      @update:use-geofence-location-address="$emit('update:use-geofence-location-address', $event)"
      @select-sucursal-company="$emit('select-sucursal-company', $event)"
      @alternar-sucursales-habilitadas="handleAlternarSucursalesHabilitadas"
      @agregar-sucursal="handleAgregarSucursal"
      @actualizar-nombre-sucursal="handleActualizarNombreSucursal"
      @alternar-estado-sucursal="handleAlternarEstadoSucursal"
      @eliminar-sucursal="handleEliminarSucursal"
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
      v-if="canManageAssets"
      :is-open="deviceContextMenu.isOpen"
      :x="deviceContextMenu.x"
      :y="deviceContextMenu.y"
      :activo="deviceContextMenu.activo"
      @close="closeDeviceContextMenu"
      @action="handleDeviceAction"
    />
  </aside>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import FleetContextMenu from "./FleetContextMenu.vue"
import FleetPanelHeader from "./FleetPanelHeader.vue"
import FleetSectionContent from "./FleetSectionContent.vue"
import { useFleetColumns } from "../../../composables/activos/fleet/useFleetColumns"
import { useFleetDeviceContextMenu } from "../../../composables/activos/fleet/useFleetDeviceContextMenu.js"
import { useFleetSorting } from "../../../composables/activos/fleet/useFleetSorting"
import {
  FLEET_TELEMETRY_COLUMNS,
  getCellValue,
  normalizeText,
} from "../../../utils/activos/fleetTelemetryColumns.js"
import { getGeofenceBadgeLabel, getGeofenceMeta } from "../../../utils/geofenceUtils.js"

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
  itineraryActivos: {
    type: Array,
    default: () => [],
  },
  geofences: {
    type: Array,
    default: () => [],
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
  empresaSucursales: {
    type: Object,
    default: () => ({
      sucursalesHabilitadas: true,
      sucursales: [],
      assets: [],
      assetsCount: 0,
    }),
  },
  sucursalCompanies: {
    type: Array,
    default: () => [],
  },
  selectedSucursalCompanyId: {
    type: [String, Number],
    default: "",
  },
  showSucursalCompanySelector: {
    type: Boolean,
    default: false,
  },
  allowedSections: {
    type: Array,
    default: () => ["activos", "reportes", "itinerarios", "geocercas", "sucursales"],
  },
  canManageAssets: {
    type: Boolean,
    default: false,
  },
  canCreateAssets: {
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
  canManageSucursales: {
    type: Boolean,
    default: false,
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
  "update:use-geofence-location-address",
  "select-sucursal-company",
  "alternar-sucursales-habilitadas",
  "agregar-sucursal",
  "actualizar-nombre-sucursal",
  "alternar-estado-sucursal",
  "eliminar-sucursal",
  "select-personal-asset-group",
  "update:column-preferences",
])

const showColumns = ref(false)
const localActiveSection = ref(props.activeSection || "activos")
const localSearch = ref(props.search || "")

const SEARCH_EMIT_DELAY_MS = 220

let searchEmitTimer = null

const { deviceContextMenu, closeDeviceContextMenu, handleTableContextMenu, handleDeviceAction } =
  useFleetDeviceContextMenu({
    canManageAssets: () => props.canManageAssets,
    closeColumns: () => {
      showColumns.value = false
    },
    onDeviceAction: (payload) => {
      emit("device-action", payload)
    },
  })

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

const isActivosSection = computed(() => localActiveSection.value === "activos")
const isReportesSection = computed(() => localActiveSection.value === "reportes")
const isItinerariosSection = computed(() => localActiveSection.value === "itinerarios")
const isGeocercasSection = computed(() => localActiveSection.value === "geocercas")

const activeHeaderVisibleColumns = computed(() => {
  return isActivosSection.value ? visibleColumns.value : []
})

const activeHeaderConfigurableColumns = computed(() => {
  return isActivosSection.value ? configurableColumns.value : []
})

const activeHeaderFilteredConfigurableColumns = computed(() => {
  return isActivosSection.value ? filteredConfigurableColumns.value : []
})

const activeHeaderVisibleColumnKeys = computed(() => {
  return isActivosSection.value ? visibleColumnKeys.value : []
})

const activeTableVisibleColumns = computed(() => {
  return isActivosSection.value ? visibleColumns.value : []
})

const activeFirstVisibleColumnKey = computed(() => {
  return isActivosSection.value ? firstVisibleColumnKey.value : ""
})

const activeSortedActivos = computed(() => {
  return isActivosSection.value ? sortedActivos.value : []
})

const activeReportActivos = computed(() => {
  return isReportesSection.value ? props.activos : []
})

const activeReportAllActivos = computed(() => {
  return isReportesSection.value ? props.allActivos : []
})

const menuSections = computed(() => {
  const allowedSections = new Set(props.allowedSections)

  return [
    {
      key: "activos",
      label: "Activos",
      count: props.allActivos.length || props.activos.length,
    },
    {
      key: "reportes",
      label: "Reportes",
      count: null,
    },
    {
      key: "itinerarios",
      label: "Itinerarios",
      count: null,
    },
    {
      key: "geocercas",
      label: "Geocercas",
      count: props.geofences.length,
    },
    {
      key: "sucursales",
      label: "Grupos",
      count: props.empresaSucursales.sucursales?.length || 0,
    },
  ].filter((section) => allowedSections.has(section.key))
})

const getFirstAvailableSection = () => {
  return menuSections.value[0]?.key || "activos"
}

const isSectionAllowed = (sectionKey) => {
  return menuSections.value.some((section) => section.key === sectionKey)
}

const applyActiveSection = (sectionKey, shouldEmit = false) => {
  const nextSection = isSectionAllowed(sectionKey) ? sectionKey : getFirstAvailableSection()

  if (localActiveSection.value === nextSection) return

  localActiveSection.value = nextSection

  if (nextSection !== "activos") {
    showColumns.value = false
    columnSearch.value = ""
    closeDeviceContextMenu()
  }

  if (shouldEmit) {
    emit("update:active-section", nextSection)
    emit("select-section", nextSection)
  }
}

const resolvedItineraryActivos = computed(() => {
  if (props.itineraryActivos.length) return props.itineraryActivos

  return props.allActivos.length ? props.allActivos : props.activos
})

const activeItineraryActivos = computed(() => {
  return isItinerariosSection.value ? resolvedItineraryActivos.value : []
})

const geofenceItems = computed(() => {
  return props.geofences || []
})

const filteredGeofenceItems = computed(() => {
  const term = normalizeText(props.search)

  if (!term) return geofenceItems.value

  return geofenceItems.value.filter((geofence) => {
    return (
      normalizeText(geofence.name).includes(term) ||
      normalizeText(geofence.type).includes(term) ||
      normalizeText(getGeofenceBadgeLabel(geofence)).includes(term) ||
      normalizeText(getGeofenceMeta(geofence)).includes(term)
    )
  })
})

const activeSectionGeofences = computed(() => {
  return isGeocercasSection.value || isReportesSection.value ? geofenceItems.value : []
})

const activeFilteredGeofences = computed(() => {
  return isGeocercasSection.value ? filteredGeofenceItems.value : []
})

const searchPlaceholder = computed(() => {
  const placeholders = {
    activos: "Buscar activo, IMEI, modelo GPS...",
    reportes: "Buscar reporte o activo...",
    geocercas: "Buscar geocerca o zona...",
  }

  return placeholders[localActiveSection.value] || placeholders.activos
})

const clearSearchEmitTimer = () => {
  if (!searchEmitTimer) return

  window.clearTimeout(searchEmitTimer)
  searchEmitTimer = null
}

const emitSearch = (value) => {
  emit("update:search", value)
}

const scheduleSearchEmit = (value) => {
  clearSearchEmitTimer()

  searchEmitTimer = window.setTimeout(() => {
    searchEmitTimer = null
    emitSearch(value)
  }, SEARCH_EMIT_DELAY_MS)
}

const handleSearchInput = (event) => {
  const value = event.target.value

  localSearch.value = value
  scheduleSearchEmit(value)
}

const clearSearch = () => {
  clearSearchEmitTimer()
  localSearch.value = ""
  emitSearch("")
}

const confirmDeleteGeofence = (geofence) => {
  if (!geofence?.id) return

  const geofenceName = geofence.name || "esta geocerca"
  const confirmed = window.confirm(`¿Eliminar la geocerca "${geofenceName}"?`)

  if (!confirmed) return

  emit("geofence-delete", geofence.id)
}

const handleGeofenceSelect = (geofence) => {
  if (!geofence?.id) return

  emit("geofence-selected", geofence)
}

const handleGeofenceEdit = (geofence) => {
  if (!geofence?.id) return

  emit("geofence-edit", geofence)
}

const handleActualizarNombreSucursal = (sucursalId, nombreSucursal) => {
  if (!props.canManageSucursales) return
  emit("actualizar-nombre-sucursal", sucursalId, nombreSucursal)
}

const handleAlternarSucursalesHabilitadas = () => {
  if (!props.canManageSucursales) return
  emit("alternar-sucursales-habilitadas")
}

const handleAgregarSucursal = (nombreSucursal) => {
  if (!props.canManageSucursales) return
  emit("agregar-sucursal", nombreSucursal)
}

const handleAlternarEstadoSucursal = (sucursalId) => {
  if (!props.canManageSucursales) return
  emit("alternar-estado-sucursal", sucursalId)
}

const handleEliminarSucursal = (sucursalId) => {
  if (!props.canManageSucursales) return
  emit("eliminar-sucursal", sucursalId)
}

const setSection = (section) => {
  closeDeviceContextMenu()
  applyActiveSection(section, true)
}

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
  emit("select-personal-asset-group", null)
  emit("select-filter", "all")
}

watch(
  menuSections,
  () => {
    if (isSectionAllowed(localActiveSection.value)) return

    applyActiveSection(getFirstAvailableSection(), true)
  },
  { immediate: true },
)

watch(
  () => props.activeSection,
  (nextSection) => {
    if (!nextSection || nextSection === localActiveSection.value) return

    applyActiveSection(nextSection, false)
  },
)

watch(
  () => props.search,
  (nextSearch) => {
    const normalizedSearch = nextSearch || ""

    if (normalizedSearch !== localSearch.value) {
      localSearch.value = normalizedSearch
    }
  },
)

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

onBeforeUnmount(() => {
  clearSearchEmitTimer()
})
</script>
