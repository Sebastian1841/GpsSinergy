<template>
  <FleetTable
    v-if="activeSection === 'activos' && allowedSections.includes('activos')"
    :activos="sortedActivos"
    :visible-columns="visibleColumns"
    :selected-id="selectedId"
    :first-visible-column-key="firstVisibleColumnKey"
    :sort-column-key="sortColumnKey"
    :get-sort-icon="getSortIcon"
    :get-cell-value="getCellValue"
    :geofences="geofences"
    :use-geofence-location-address="useGeofenceLocationAddress"
    @select="emit('select', $event)"
    @toggle-sort="emit('toggle-sort', $event)"
    @resize-column="emitResizeColumn"
    @move-column="emitMoveColumn"
    @open-context-menu="emit('open-context-menu', $event)"
  />

  <div
    v-else-if="activeSection === 'itinerarios' && allowedSections.includes('itinerarios')"
    class="min-h-0 flex-1 overflow-hidden bg-[#eef2f7]"
  >
    <ItineraryPanel
      :activos="itineraryActivos"
      class="h-full min-h-0 rounded-none border-0 shadow-none"
      @route-selected="emit('route-selected', $event)"
      @point-selected="emit('point-selected', $event)"
      @clear-route="emit('clear-route', $event)"
    />
  </div>

  <div
    v-else-if="activeSection === 'reportes' && allowedSections.includes('reportes')"
    class="min-h-0 flex-1 overflow-hidden bg-[#eef2f7]"
  >
    <FleetReportsPanel
      :activos="activos"
      :all-activos="allActivos"
      :company-id="companyId"
      :geofences="geofences"
      :search="search"
      class="h-full min-h-0"
    />
  </div>

  <FleetGeofencePanel
    v-else-if="activeSection === 'geocercas' && allowedSections.includes('geocercas')"
    :geofences="geofences"
    :filtered-geofences="filteredGeofences"
    :selected-geofence-id="selectedGeofenceId"
    :can-edit-geofences="canEditGeofences"
    :use-geofence-location-address="useGeofenceLocationAddress"
    @update:use-geofence-location-address="emit('update:use-geofence-location-address', $event)"
    @select-geofence="emit('select-geofence', $event)"
    @edit-geofence="emit('edit-geofence', $event)"
    @delete-geofence="emit('delete-geofence', $event)"
  />

  <div
    v-else-if="activeSection === 'sucursales' && allowedSections.includes('sucursales')"
    class="min-h-0 flex-1 overflow-auto bg-[#eef2f7] p-3"
  >
    <GestionSucursalesPanel
      :company="empresaSucursales"
      :companies="sucursalCompanies"
      :selected-company-id="selectedSucursalCompanyId"
      :show-company-selector="showSucursalCompanySelector"
      :can-manage="canManageSucursales"
      @select-company="emit('select-sucursal-company', $event)"
      @alternar-sucursales-habilitadas="emit('alternar-sucursales-habilitadas')"
      @agregar-sucursal="emit('agregar-sucursal', $event)"
      @actualizar-nombre-sucursal="emitActualizarNombreSucursal"
      @alternar-estado-sucursal="emit('alternar-estado-sucursal', $event)"
      @eliminar-sucursal="emit('eliminar-sucursal', $event)"
    />
  </div>

  <div v-else class="flex min-h-0 flex-1 items-center justify-center bg-[#eef2f7] p-4 text-center">
    <p class="text-[11px] font-black text-[#102372]">Sin funciones habilitadas</p>
  </div>
</template>

<script setup>
import { defineAsyncComponent, h, onBeforeUnmount, onMounted, watch } from "vue"
import FleetTable from "./FleetTable.vue"

const FleetSectionLoading = {
  name: "FleetSectionLoading",
  setup() {
    return () =>
      h(
        "div",
        {
          class:
            "flex h-full min-h-[220px] flex-1 flex-col items-center justify-center bg-[#eef2f7] p-4 text-center",
        },
        [
          h("span", {
            class: "h-7 w-7 animate-spin rounded-full border-2 border-[#d8dee8] border-t-[#FF6600]",
            "aria-hidden": "true",
          }),
          h(
            "p",
            {
              class: "mt-3 text-[11px] font-black text-[#102372]",
            },
            "Cargando modulo...",
          ),
        ],
      )
  },
}

const loadGestionSucursalesPanel = () => import("../sucursales/GestionSucursalesPanel.vue")
const loadItineraryPanel = () => import("../itinerarios/ItineraryPanel.vue")
const loadFleetGeofencePanel = () => import("./FleetGeofencePanel.vue")
const loadFleetReportsPanel = () => import("./FleetReportsPanel.vue")

const createAsyncFleetSection = (loader) =>
  defineAsyncComponent({
    loader,
    loadingComponent: FleetSectionLoading,
    delay: 80,
    suspensible: false,
  })

const GestionSucursalesPanel = createAsyncFleetSection(loadGestionSucursalesPanel)
const ItineraryPanel = createAsyncFleetSection(loadItineraryPanel)
const FleetGeofencePanel = createAsyncFleetSection(loadFleetGeofencePanel)
const FleetReportsPanel = createAsyncFleetSection(loadFleetReportsPanel)

const sectionLoaders = {
  reportes: loadFleetReportsPanel,
  itinerarios: loadItineraryPanel,
  geocercas: loadFleetGeofencePanel,
  sucursales: loadGestionSucursalesPanel,
}

const preloadedSectionKeys = new Set()

let idlePreloadId = null
let preloadTimer = null

const props = defineProps({
  activeSection: {
    type: String,
    default: "activos",
  },
  allowedSections: {
    type: Array,
    default: () => [],
  },
  sortedActivos: {
    type: Array,
    default: () => [],
  },
  visibleColumns: {
    type: Array,
    default: () => [],
  },
  selectedId: {
    type: [Number, String],
    default: null,
  },
  firstVisibleColumnKey: {
    type: String,
    default: "",
  },
  sortColumnKey: {
    type: String,
    default: "",
  },
  getSortIcon: {
    type: Function,
    required: true,
  },
  getCellValue: {
    type: Function,
    required: true,
  },
  itineraryActivos: {
    type: Array,
    default: () => [],
  },
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
  search: {
    type: String,
    default: "",
  },
  geofences: {
    type: Array,
    default: () => [],
  },
  filteredGeofences: {
    type: Array,
    default: () => [],
  },
  selectedGeofenceId: {
    type: [String, Number],
    default: null,
  },
  canEditGeofences: {
    type: Boolean,
    default: false,
  },
  useGeofenceLocationAddress: {
    type: Boolean,
    default: true,
  },
  empresaSucursales: {
    type: Object,
    required: true,
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
  canManageSucursales: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  "select",
  "toggle-sort",
  "resize-column",
  "move-column",
  "open-context-menu",
  "route-selected",
  "point-selected",
  "clear-route",
  "select-geofence",
  "edit-geofence",
  "delete-geofence",
  "update:use-geofence-location-address",
  "select-sucursal-company",
  "alternar-sucursales-habilitadas",
  "agregar-sucursal",
  "actualizar-nombre-sucursal",
  "alternar-estado-sucursal",
  "eliminar-sucursal",
])

const emitActualizarNombreSucursal = (sucursalId, nombreSucursal) => {
  emit("actualizar-nombre-sucursal", sucursalId, nombreSucursal)
}

const emitResizeColumn = (columnKey, width) => {
  emit("resize-column", columnKey, width)
}

const emitMoveColumn = (sourceColumnKey, targetColumnKey) => {
  emit("move-column", sourceColumnKey, targetColumnKey)
}

const preloadSection = (sectionKey) => {
  const loader = sectionLoaders[sectionKey]

  if (!loader || preloadedSectionKeys.has(sectionKey)) return

  preloadedSectionKeys.add(sectionKey)

  loader().catch(() => {
    preloadedSectionKeys.delete(sectionKey)
  })
}

const preloadAllowedSections = () => {
  props.allowedSections.forEach((sectionKey) => {
    if (sectionKey === "activos" || sectionKey === props.activeSection) return

    preloadSection(sectionKey)
  })
}

const cancelScheduledPreload = () => {
  if (typeof window === "undefined") return

  if (idlePreloadId !== null && typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(idlePreloadId)
  }

  if (preloadTimer !== null) {
    window.clearTimeout(preloadTimer)
  }

  idlePreloadId = null
  preloadTimer = null
}

const scheduleAllowedSectionPreload = () => {
  cancelScheduledPreload()

  if (typeof window === "undefined") return

  if (typeof window.requestIdleCallback === "function") {
    idlePreloadId = window.requestIdleCallback(
      () => {
        idlePreloadId = null
        preloadAllowedSections()
      },
      {
        timeout: 2200,
      },
    )
    return
  }

  preloadTimer = window.setTimeout(() => {
    preloadTimer = null
    preloadAllowedSections()
  }, 700)
}

watch(
  () => props.activeSection,
  (sectionKey) => {
    preloadSection(sectionKey)
  },
  {
    immediate: true,
  },
)

watch(
  () => props.allowedSections.join("|"),
  () => {
    scheduleAllowedSectionPreload()
  },
)

onMounted(() => {
  scheduleAllowedSectionPreload()
})

onBeforeUnmount(() => {
  cancelScheduledPreload()
})
</script>
