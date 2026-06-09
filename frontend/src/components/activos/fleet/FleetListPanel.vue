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
      :visible-columns="visibleColumns"
      :configurable-columns="configurableColumns"
      :filtered-configurable-columns="filteredConfigurableColumns"
      :visible-column-keys="visibleColumnKeys"
      :column-search="columnSearch"
      @set-section="setSection"
      @search-input="handleSearchInput"
      @clear-search="clearSearch"
      @clear-sort="clearSort"
      @open-add-activo="$emit('open-add-activo')"
      @toggle-columns="toggleColumnsDropdown"
      @reset-columns="resetColumns"
      @update-column-search="columnSearch = $event"
      @toggle-column-key="toggleColumnKey"
    />

    <FleetTable
      v-if="localActiveSection === 'activos' && allowedSections.includes('activos')"
      :activos="sortedActivos"
      :visible-columns="visibleColumns"
      :selected-id="selectedId"
      :first-visible-column-key="firstVisibleColumnKey"
      :sort-column-key="sortColumnKey"
      :get-sort-icon="getSortIcon"
      :get-cell-value="getCellValue"
      @select="handleRowClick"
      @toggle-sort="handleToggleSort"
      @resize-column="setColumnWidth"
      @move-column="moveColumn"
      @open-context-menu="handleTableContextMenu"
    />

    <div
      v-else-if="localActiveSection === 'itinerarios'"
      class="min-h-0 flex-1 overflow-hidden bg-[#f8fafc]"
    >
      <ItineraryPanel
        :activos="resolvedItineraryActivos"
        class="h-full min-h-0 rounded-none border-0 shadow-none"
        @route-selected="$emit('route-selected', $event)"
        @point-selected="$emit('point-selected', $event)"
        @clear-route="$emit('clear-route', $event)"
      />
    </div>

    <FleetGeofencePanel
      v-else-if="localActiveSection === 'geocercas'"
      :geofences="geofenceItems"
      :filtered-geofences="filteredGeofenceItems"
      :selected-geofence-id="selectedGeofenceId"
      :can-edit-geofences="canEditGeofences"
      @select-geofence="handleGeofenceSelect"
      @delete-geofence="confirmDeleteGeofence"
    />

    <div
      v-else-if="localActiveSection === 'sucursales' && allowedSections.includes('sucursales')"
      class="min-h-0 flex-1 overflow-auto bg-[#eef2f7] p-3"
    >
      <GestionSucursalesPanel
        :company="empresaSucursales"
        :companies="sucursalCompanies"
        :selected-company-id="selectedSucursalCompanyId"
        :show-company-selector="showSucursalCompanySelector"
        :can-manage="canManageSucursales"
        @select-company="$emit('select-sucursal-company', $event)"
        @alternar-sucursales-habilitadas="handleAlternarSucursalesHabilitadas"
        @agregar-sucursal="handleAgregarSucursal"
        @actualizar-nombre-sucursal="handleActualizarNombreSucursal"
        @alternar-estado-sucursal="handleAlternarEstadoSucursal"
        @eliminar-sucursal="handleEliminarSucursal"
        @actualizar-sucursal-activo="handleActualizarSucursalActivo"
      />
    </div>

    <div
      v-else
      class="flex min-h-0 flex-1 items-center justify-center bg-[#eef2f7] p-4 text-center"
    >
      <p class="text-[11px] font-black text-[#102372]">Sin funciones habilitadas</p>
    </div>

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
import { computed, onBeforeUnmount, ref, watch } from "vue"
import GestionSucursalesPanel from "../sucursales/GestionSucursalesPanel.vue"
import ItineraryPanel from "../itinerarios/ItineraryPanel.vue"
import FleetTable from "./FleetTable.vue"
import FleetContextMenu from "./FleetContextMenu.vue"
import FleetGeofencePanel from "./FleetGeofencePanel.vue"
import FleetPanelHeader from "./FleetPanelHeader.vue"
import { useFleetColumns } from "../../../composables/activos/fleet/useFleetColumns"
import { useFleetSorting } from "../../../composables/activos/fleet/useFleetSorting"
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
    default: () => ["activos", "itinerarios", "geocercas", "sucursales"],
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
  canManageSucursales: {
    type: Boolean,
    default: false,
  },
  columns: {
    type: Array,
    default: () => [
      { key: "estado", label: "Estado", width: "92px", locked: true },
      { key: "vehiculo", label: "Activo", width: "160px", locked: true },
      { key: "datosUlt", label: "Último", width: "92px" },
      { key: "trackerModelLabel", label: "Modelo GPS", width: "135px" },
      { key: "imei", label: "IMEI", width: "140px" },
      { key: "protocol", label: "Protocolo", width: "90px" },
      { key: "fechaIngreso", label: "Ingreso", width: "105px" },
      { key: "horometroDiario", label: "Hor. diario", width: "100px", align: "right" },
      { key: "horometroTotal", label: "Hor. total", width: "100px", align: "right" },
      { key: "odometro", label: "Odómetro", width: "110px", align: "right" },
    ],
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
  "geofence-delete",
  "select-sucursal-company",
  "alternar-sucursales-habilitadas",
  "agregar-sucursal",
  "actualizar-nombre-sucursal",
  "alternar-estado-sucursal",
  "eliminar-sucursal",
  "actualizar-sucursal-activo",
  "select-personal-asset-group",
])

const showColumns = ref(false)
const localActiveSection = ref(props.activeSection || "activos")
const localSearch = ref(props.search || "")

const SEARCH_EMIT_DELAY_MS = 220

let searchEmitTimer = null

const deviceContextMenu = ref({
  isOpen: false,
  x: 0,
  y: 0,
  activo: null,
})

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

const getNestedValue = (row, path) => {
  return path.split(".").reduce((value, key) => value?.[key], row)
}

const getCellValue = (activo, column) => {
  if (typeof column.formatter === "function") {
    return column.formatter(activo)
  }

  const value = getNestedValue(activo, column.key)

  if (value === null || value === undefined || value === "") {
    return "-"
  }

  return String(value)
}

const {
  columnSearch,
  visibleColumnKeys,
  configurableColumns,
  filteredConfigurableColumns,
  visibleColumns,
  firstVisibleColumnKey,
  resetColumns,
  setColumnWidth,
  moveColumn,
} = useFleetColumns({
  columns: computed(() => props.columns),
  normalizeText,
})

const { sortColumnKey, sortedActivos, toggleSort, clearSort, getSortIcon } = useFleetSorting({
  activos: computed(() => props.activos),
  columns: computed(() => props.columns),
  getCellValue,
  normalizeText,
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
      label: "Sucursales",
      count: props.empresaSucursales.sucursales?.length || 0,
    },
  ].filter((section) => allowedSections.has(section.key))
})

const resolvedItineraryActivos = computed(() => {
  if (props.itineraryActivos.length) return props.itineraryActivos

  return props.allActivos.length ? props.allActivos : props.activos
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

const searchPlaceholder = computed(() => {
  const placeholders = {
    activos: "Buscar activo, IMEI, modelo GPS...",
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
  if (!geofence?.id || !props.canEditGeofences) return

  emit("geofence-selected", geofence)
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

const handleActualizarSucursalActivo = (payload) => {
  if (!props.canManageSucursales) return
  emit("actualizar-sucursal-activo", payload)
}

const closeDeviceContextMenu = () => {
  deviceContextMenu.value = {
    isOpen: false,
    x: 0,
    y: 0,
    activo: null,
  }
}

const setSection = (section) => {
  closeDeviceContextMenu()

  localActiveSection.value = section

  if (section !== "activos") {
    showColumns.value = false
    columnSearch.value = ""
  }

  emit("update:active-section", section)
  emit("select-section", section)
}

const toggleColumnsDropdown = () => {
  closeDeviceContextMenu()
  showColumns.value = !showColumns.value
}

const toggleColumnKey = (columnKey) => {
  const column = configurableColumns.value.find((item) => item.key === columnKey)

  if (!column || column.locked) return

  if (visibleColumnKeys.value.includes(columnKey)) {
    visibleColumnKeys.value = visibleColumnKeys.value.filter((key) => key !== columnKey)
    return
  }

  visibleColumnKeys.value = [...visibleColumnKeys.value, columnKey]
}

const handleRowClick = (activo) => {
  closeDeviceContextMenu()
  emit("select", activo.id)
}

const handleToggleSort = (columnKey) => {
  closeDeviceContextMenu()
  toggleSort(columnKey)
}

const openDeviceContextMenu = (event, activo) => {
  if (!activo || !props.canManageAssets) return

  event.preventDefault?.()
  event.stopPropagation?.()

  showColumns.value = false

  const menuWidth = 186
  const menuHeight = 118
  const padding = 8

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight

  const rawX = event.clientX || padding
  const rawY = event.clientY || padding

  const x = Math.min(rawX, viewportWidth - menuWidth - padding)
  const y = Math.min(rawY, viewportHeight - menuHeight - padding)

  deviceContextMenu.value = {
    isOpen: true,
    x: Math.max(padding, x),
    y: Math.max(padding, y),
    activo,
  }
}

const handleTableContextMenu = ({ event, activo }) => {
  openDeviceContextMenu(event, activo)
}

const handleDeviceAction = ({ action, activo }) => {
  emit("device-action", {
    action,
    activo,
  })

  closeDeviceContextMenu()
}

const handleShowAllAssets = () => {
  emit("select-personal-asset-group", null)
  emit("select-filter", "all")
}

watch(
  [menuSections, () => props.activeSection],
  ([sections, requestedSection]) => {
    const availableSection = sections.find((section) => section.key === requestedSection)
    const nextSection = availableSection?.key || sections[0]?.key || "activos"

    if (localActiveSection.value !== nextSection) {
      localActiveSection.value = nextSection
      emit("update:active-section", nextSection)
      emit("select-section", nextSection)
    }
  },
  { immediate: true },
)

watch(
  () => props.activeSection,
  (nextSection) => {
    localActiveSection.value = nextSection || "activos"

    if (nextSection !== "activos") {
      showColumns.value = false
      columnSearch.value = ""
      closeDeviceContextMenu()
    }
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

onBeforeUnmount(() => {
  clearSearchEmitTimer()
})
</script>
