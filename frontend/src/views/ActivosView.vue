<template>
  <section class="h-full min-h-0 overflow-hidden bg-[#eef2f7]">
    <div
      ref="layoutRef"
      class="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[var(--fleet-grid)]"
      :style="{
        '--fleet-grid': `${leftPanelWidth}px 8px minmax(0, 1fr)`,
      }"
    >
      <div class="relative flex min-h-0 flex-col overflow-hidden bg-white">
        <FleetListPanel
          :activos="personalFilteredActivos"
          :all-activos="personalTableActivos"
          :itinerary-activos="normalizedActivos"
          :geofences="permittedGeofences"
          :selected-geofence-id="selectedGeofenceId"
          :selected-id="selectedId"
          :active-filter="statusFilter"
          :active-section="activeSidebarSection"
          :search="sidebarSearch"
          :empresa-sucursales="empresaSucursales"
          :sucursal-companies="sucursalCompanies"
          :selected-sucursal-company-id="selectedSucursalCompanyId"
          :show-sucursal-company-selector="false"
          :allowed-sections="allowedSidebarSections"
          :can-manage-assets="canManageAssets"
          :can-create-assets="canCreateAssets"
          :can-edit-geofences="canEditGeofences"
          :can-manage-sucursales="canManageSucursales"
          class="min-h-0 flex-1"
          @select="selectActivo"
          @select-filter="setStatusFilter"
          @update:search="setSidebarSearch"
          @update:active-section="setSidebarSection"
          @route-selected="handleItineraryRouteSelected"
          @point-selected="handleItineraryPointSelected"
          @clear-route="handleClearItineraryRoute"
          @open-add-activo="openAddActivoModal"
          @device-action="handleDeviceAction"
          @geofence-selected="handleSidebarGeofenceSelected"
          @geofence-delete="handleGeofenceDeleted"
          @select-sucursal-company="selectSucursalCompany"
          @alternar-sucursales-habilitadas="handleAlternarSucursalesFlotaHabilitadas"
          @agregar-sucursal="handleAgregarSucursalFlota"
          @actualizar-nombre-sucursal="handleActualizarNombreSucursalFlota"
          @alternar-estado-sucursal="handleAlternarEstadoSucursalFlota"
          @eliminar-sucursal="handleEliminarSucursalFlota"
          @actualizar-sucursal-activo="handleActualizarSucursalActivoFlota"
          @select-personal-asset-group="selectPersonalAssetGroup"
        />
      </div>

      <div
        class="group hidden cursor-col-resize bg-[#d8dee8] transition hover:bg-[#FF6600] xl:block"
        @pointerdown="startFleetResize"
      >
        <div class="relative h-full w-full">
          <div
            class="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#b9c2d0] group-hover:bg-[#FF6600]"
          ></div>

          <div
            class="absolute left-1/2 top-1/2 flex h-12 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#cbd5e1] bg-white shadow-sm"
          >
            <span class="h-7 w-[2px] rounded-full bg-[#102372] group-hover:bg-[#FF6600]"></span>
          </div>
        </div>
      </div>

      <div class="flex min-h-0 flex-col overflow-hidden bg-[#eef2f7]">
        <div class="relative grid min-h-0 flex-1 overflow-hidden p-3">
          <ActivosMapPanel
            :activos="permittedMapActivos"
            :all-activos="permittedMapStatsActivos"
            :telemetry-batch="latestTelemetryBatch"
            :selected-id="selectedId"
            :selected-geofence-id="selectedGeofenceId"
            :geofences="permittedGeofences"
            :itinerary-route="selectedItineraryRoute"
            :selected-itinerary-point="selectedItineraryPoint"
            :active-filter="statusFilter"
            :app-sidebar-open="props.appSidebarOpen"
            :can-view-geofences="canViewGeofences"
            :can-edit-geofences="canEditGeofences"
            class="min-h-0"
            @select="selectActivo"
            @select-filter="setStatusFilter"
            @geofence-created="handleGeofenceCreated"
            @geofence-updated="handleGeofenceUpdated"
            @geofence-deleted="handleGeofenceDeleted"
            @clear-geofence-selection="handleClearGeofenceSelection"
          />
        </div>
      </div>
    </div>

    <AddActivoModal v-model="showActivoModal" @add-activo="handleAddActivo" />

    <FleetEditModal
      v-model="showEditActivoModal"
      :activo="editingActivo"
      @update-activo="handleUpdateActivo"
    />

    <FleetTerminalModal
      v-model="showTerminalModal"
      :activo="terminalActivo"
      :history="terminalHistory"
      @send-command="handleTerminalCommand"
    />

    <ConfirmDialog
      v-model="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :detail="confirmDialog.detail"
      :confirm-label="confirmDialog.confirmLabel"
      :cancel-label="confirmDialog.cancelLabel"
      :variant="confirmDialog.variant"
      @confirm="confirmAction"
      @cancel="cancelAction"
    />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useRoute } from "vue-router"

import { normalizeId } from "../utils/idUtils.js"

import FleetListPanel from "../components/activos/fleet/FleetListPanel.vue"
import ActivosMapPanel from "../components/activos/map/ActivosMapPanel.vue"
import AddActivoModal from "../components/activos/fleet/AddActivoModal.vue"
import FleetEditModal from "../components/activos/fleet/FleetEditModal.vue"
import FleetTerminalModal from "../components/activos/fleet/FleetTerminalModal.vue"
import ConfirmDialog from "../components/ui/ConfirmDialog.vue"

import { useFleetTerminal } from "../composables/activos/fleet/useFleetTerminal"
import { useFleetTelemetry } from "../composables/activos/fleet/useFleetTelemetry.js"
import { useSucursalesFlota } from "../composables/activos/fleet/useSucursalesFlota.js"
import { useGeofences } from "../composables/activos/geocercas/useGeofences.js"
import { useConfirmDialog } from "../composables/ui/useConfirmDialog.js"
import { usePersistedFleetLayout } from "../composables/activos/fleet/usePersistedFleetLayout.js"
import { useMockDatabase } from "../composables/mock/useMockDatabase.js"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"

import { useActivosCrud } from "../composables/activos/view/useActivosCrud.js"
import { useActivosFilters } from "../composables/activos/view/useActivosFilters.js"
import { useActivosLayout } from "../composables/activos/view/useActivosLayout.js"
import { useActivosSelection } from "../composables/activos/view/useActivosSelection.js"
import { useActivosTelemetrySync } from "../composables/activos/view/useActivosTelemetrySync.js"
import { usePersonalAssetGroups } from "../composables/activos/fleet/usePersonalAssetGroups.js"

const props = defineProps({
  appSidebarOpen: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()
const { currentUser } = useAuthSession()
const { accessibleCompanies, visibleAssets, canAccessFunction } = useAccessControl()

const MOCK_TELEMETRY_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_MOCK_TELEMETRY !== "false"

const MOCK_TELEMETRY_INTERVAL_MS = 1000
const MOCK_TELEMETRY_BATCH_SIZE = 18
const TABLE_SYNC_INTERVAL_MS = 2500

const {
  assets: databaseAssets,
  getApplicationForCompany,
  createAsset: createDatabaseAsset,
  updateAsset: updateDatabaseAsset,
  deleteAsset: deleteDatabaseAsset,
} = useMockDatabase()

const activeCompanyId = computed(() => String(route.params.empresaId || ""))
const permissionCompanyId = computed(() => {
  return activeCompanyId.value || null
})

const canManageAssets = computed(() => {
  return Boolean(
    activeCompanyId.value && canAccessFunction("gps", permissionCompanyId.value, "edit"),
  )
})

const canCreateAssets = computed(() => {
  return canManageAssets.value
})

const canViewGps = computed(() => {
  return Boolean(
    activeCompanyId.value && canAccessFunction("gps", permissionCompanyId.value, "view"),
  )
})

const canViewItineraries = computed(() => {
  return Boolean(
    activeCompanyId.value && canAccessFunction("itineraries", permissionCompanyId.value, "view"),
  )
})

const canViewGeofences = computed(() => {
  return Boolean(
    activeCompanyId.value && canAccessFunction("geofences", permissionCompanyId.value, "view"),
  )
})

const canEditGeofences = computed(() => {
  return Boolean(
    activeCompanyId.value && canAccessFunction("geofences", permissionCompanyId.value, "edit"),
  )
})

const canViewSucursales = computed(() => {
  return Boolean(
    activeCompanyId.value && canAccessFunction("branches", permissionCompanyId.value, "view"),
  )
})

const canManageSucursales = computed(() => {
  return Boolean(
    activeCompanyId.value && canAccessFunction("branches", permissionCompanyId.value, "edit"),
  )
})

const allowedSidebarSections = computed(() => {
  const sections = []

  if (canViewGps.value) sections.push("activos")
  if (canViewItineraries.value) sections.push("itinerarios")
  if (canViewGeofences.value) sections.push("geocercas")
  if (canViewSucursales.value) sections.push("sucursales")

  return sections
})

const sucursalCompanies = computed(() => {
  return accessibleCompanies.value.map((company) => ({
    id: String(company.id),
    name: company.name,
  }))
})

const selectedSucursalCompanyId = ref("")

watch(
  [activeCompanyId, sucursalCompanies],
  ([routeCompanyId, companies]) => {
    if (routeCompanyId) {
      selectedSucursalCompanyId.value = routeCompanyId
      return
    }

    const selectionExists = companies.some((company) => {
      return company.id === selectedSucursalCompanyId.value
    })

    if (!selectionExists) {
      selectedSucursalCompanyId.value = companies[0]?.id || ""
    }
  },
  { immediate: true },
)

const selectSucursalCompany = (companyId) => {
  const exists = sucursalCompanies.value.some((company) => company.id === String(companyId))

  if (exists) {
    selectedSucursalCompanyId.value = String(companyId)
  }
}

const baseMockActivos = computed(() => {
  if (!activeCompanyId.value) return []

  return visibleAssets.value.filter((activo) => {
    return String(activo.companyId) === activeCompanyId.value
  })
})

const currentUserId = computed(() => {
  return currentUser.value?.id || ""
})

const { selectPersonalAssetGroup, filterActivosBySelectedGroup } = usePersonalAssetGroups({
  userId: currentUserId,
  companyId: activeCompanyId,
  availableActivos: baseMockActivos,
})

const { geofences, createGeofence, updateGeofence, deleteGeofence } = useGeofences({
  companyId: activeCompanyId,
})

const permittedGeofences = computed(() => {
  return activeCompanyId.value && canViewGeofences.value ? geofences.value : []
})

const { confirmDialog, openConfirmDialog, confirmAction, cancelAction } = useConfirmDialog()

const { leftPanelWidth, persistPanelWidth } = usePersistedFleetLayout()

const {
  activos: telemetryActivos,
  replaceFleetSnapshot,
  startMockTelemetry,
  stopMockTelemetry,
} = useFleetTelemetry([], {
  intervalMs: MOCK_TELEMETRY_INTERVAL_MS,
  batchSize: MOCK_TELEMETRY_BATCH_SIZE,
})

const {
  showTerminalModal,
  terminalActivo,
  terminalHistory,
  openTerminalModal: openFleetTerminalModal,
  closeTerminalModal,
  handleTerminalCommand,
  removeTerminalHistory,
  appendTelemetryPulses,
} = useFleetTerminal()

const { layoutRef, refreshMapLayout, startFleetResize, cleanupLayout } = useActivosLayout({
  leftPanelWidth,
  persistPanelWidth,
})

let telemetrySync = null
let selection = null
let personalMapActivos = null

const filters = useActivosFilters({
  refreshMapLayout,

  onLeaveItinerarios: () => {
    selection?.clearSelectedItinerary()
  },

  onFilterChanged: async () => {
    const nextActivo = telemetrySync?.mapActivos.value?.[0]

    if (selection) {
      selection.selectedId.value = nextActivo?.id || null
    }
  },
})

const {
  statusFilter,
  activeSidebarSection,
  sectionSearch,
  sidebarSearch,
  filterActivosByCurrentState,
  setSidebarSearch,
  setSidebarSection,
  setStatusFilter,
} = filters

selection = useActivosSelection({
  baseSelectedId: baseMockActivos.value[0]?.id || null,
  getMapActivos: () => personalMapActivos?.value || telemetrySync?.mapActivos.value || [],
  activeSidebarSection,
  refreshMapLayout,
})

const {
  selectedId,
  selectedGeofenceId,
  selectedItineraryRoute,
  selectedItineraryPoint,
  ensureSelectedActivo,
  selectActivo,
  handleClearGeofenceSelection,
  handleSidebarGeofenceSelected,
  handleItineraryRouteSelected,
  handleItineraryPointSelected,
  handleClearItineraryRoute,
} = selection

const {
  baseNormalizedActivos,
  showActivoModal,
  showEditActivoModal,
  editingActivo,
  openAddActivoModal: openAddActivoModalBase,
  handleAddActivo: handleAddActivoBase,
  handleUpdateActivo: handleUpdateActivoBase,
  handleDeviceAction: handleDeviceActionBase,
} = useActivosCrud({
  baseMockActivos,

  getNormalizedActivos: () => telemetrySync?.normalizedActivos.value || [],
  getMapActivos: () => telemetrySync?.mapActivos.value || [],

  selectedId,
  statusFilter,
  activeSidebarSection,
  sectionSearch,

  openConfirmDialog,
  removeTerminalHistory,
  terminalActivo,
  closeTerminalModal,
  openFleetTerminalModal,
  refreshMapLayout,
  createActivo: (activo) => {
    if (!canCreateAssets.value) return

    const companyId = activeCompanyId.value
    const application = getApplicationForCompany(companyId)

    createDatabaseAsset({
      ...activo,
      companyId,
      applicationId: application?.id || null,
      sucursalId: null,
      patente: activo.patente || `MOCK-${String(databaseAssets.value.length + 1).padStart(3, "0")}`,
      patent: activo.patente || `MOCK-${String(databaseAssets.value.length + 1).padStart(3, "0")}`,
    })
  },
  updateActivo: (assetId, changes) => {
    if (!canManageAssets.value) return
    updateDatabaseAsset(assetId, changes)
  },
  removeActivo: (assetId) => {
    if (!canManageAssets.value) return
    deleteDatabaseAsset(assetId)
  },
})

const openAddActivoModal = () => {
  if (!canCreateAssets.value) return
  openAddActivoModalBase()
}

const handleAddActivo = (payload) => {
  if (!canCreateAssets.value) return
  handleAddActivoBase(payload)
}

const handleUpdateActivo = (payload) => {
  if (!canManageAssets.value) return
  handleUpdateActivoBase(payload)
}

const handleDeviceAction = (payload) => {
  if (!canManageAssets.value) return
  handleDeviceActionBase(payload)
}

telemetrySync = useActivosTelemetrySync({
  telemetryActivos,
  baseNormalizedActivos,
  filterActivosByCurrentState,
  statusFilter,
  sectionSearch,
  replaceFleetSnapshot,
  startMockTelemetry,
  stopMockTelemetry,
  appendTelemetryPulses,
  ensureSelectedActivo,
  mockTelemetryEnabled: MOCK_TELEMETRY_ENABLED,
  mockTelemetryIntervalMs: MOCK_TELEMETRY_INTERVAL_MS,
  mockTelemetryBatchSize: MOCK_TELEMETRY_BATCH_SIZE,
  tableSyncIntervalMs: TABLE_SYNC_INTERVAL_MS,
})

const {
  normalizedActivos,
  tableActivos,
  latestTelemetryBatch,
  mapActivos,
  filteredActivos,
  cleanupTelemetrySync,
} = telemetrySync

personalMapActivos = computed(() => {
  return filterActivosBySelectedGroup(mapActivos.value)
})

const personalFilteredActivos = computed(() => {
  return filterActivosBySelectedGroup(filteredActivos.value)
})

const personalTableActivos = computed(() => {
  return filterActivosBySelectedGroup(tableActivos.value)
})

const personalMapActivoIdsSignature = computed(() => {
  return personalMapActivos.value
    .map((activo) => normalizeId(activo?.id))
    .filter(Boolean)
    .join("|")
})

const permittedMapActivos = computed(() => {
  return canViewGps.value ? personalMapActivos.value : []
})

const permittedMapStatsActivos = computed(() => {
  return canViewGps.value ? personalTableActivos.value : []
})

const {
  empresaSucursales,
  alternarSucursalesHabilitadas: alternarSucursalesFlotaHabilitadas,
  agregarSucursal: agregarSucursalFlota,
  actualizarNombreSucursal: actualizarNombreSucursalFlota,
  alternarEstadoSucursal: alternarEstadoSucursalFlota,
  eliminarSucursal: eliminarSucursalFlota,
  actualizarSucursalActivo: actualizarSucursalActivoFlota,
} = useSucursalesFlota({
  activos: tableActivos,
  companyId: selectedSucursalCompanyId,
})

const handleAlternarSucursalesFlotaHabilitadas = () => {
  if (!canManageSucursales.value) return
  alternarSucursalesFlotaHabilitadas()
}

const handleAgregarSucursalFlota = (nombreSucursal) => {
  if (!canManageSucursales.value) return
  agregarSucursalFlota(nombreSucursal)
}

const handleActualizarNombreSucursalFlota = (sucursalId, nombreSucursal) => {
  if (!canManageSucursales.value) return
  actualizarNombreSucursalFlota(sucursalId, nombreSucursal)
}

const handleAlternarEstadoSucursalFlota = (sucursalId) => {
  if (!canManageSucursales.value) return
  alternarEstadoSucursalFlota(sucursalId)
}

const handleEliminarSucursalFlota = (sucursalId) => {
  if (!canManageSucursales.value) return
  eliminarSucursalFlota(sucursalId)
}

const handleActualizarSucursalActivoFlota = (payload) => {
  if (!canManageSucursales.value) return
  actualizarSucursalActivoFlota(payload)
}

const handleGeofenceCreated = async (geofence) => {
  if (!canEditGeofences.value) return

  createGeofence(geofence)

  selectedGeofenceId.value = geofence?.id || null

  await refreshMapLayout(true)
}

const handleGeofenceUpdated = (updatedGeofence) => {
  if (!canEditGeofences.value) return

  updateGeofence(updatedGeofence)
}

const handleGeofenceDeleted = async (geofenceId) => {
  if (!canEditGeofences.value) return

  deleteGeofence(geofenceId)

  if (normalizeId(selectedGeofenceId.value) === normalizeId(geofenceId)) {
    selectedGeofenceId.value = null
  }

  await refreshMapLayout(true)
}

watch(personalMapActivoIdsSignature, () => {
  ensureSelectedActivo()
})

onBeforeUnmount(() => {
  cleanupTelemetrySync()
  cleanupLayout()
})
</script>
