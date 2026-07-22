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
          :company-id="activeCompanyId"
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
          :use-geofence-location-address="useGeofenceLocationAddress"
          :column-preferences="fleetTableColumnPreferences"
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
          @geofence-edit="handleSidebarGeofenceEdit"
          @geofence-delete="handleGeofenceDeleted"
          @update:use-geofence-location-address="setUseGeofenceLocationAddress"
          @select-sucursal-company="selectSucursalCompany"
          @alternar-sucursales-habilitadas="handleAlternarSucursalesFlotaHabilitadas"
          @agregar-sucursal="handleAgregarSucursalFlota"
          @actualizar-nombre-sucursal="handleActualizarNombreSucursalFlota"
          @alternar-estado-sucursal="handleAlternarEstadoSucursalFlota"
          @eliminar-sucursal="handleEliminarSucursalFlota"
          @select-personal-asset-group="selectPersonalAssetGroup"
          @update:column-preferences="setFleetTableColumnPreferences"
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
            ref="mapPanelRef"
            :activos="permittedMapActivos"
            :all-activos="permittedMapStatsActivos"
            :selected-id="selectedId"
            :selected-geofence-id="selectedGeofenceId"
            :geofences="permittedGeofences"
            :itinerary-route="selectedItineraryRoute"
            :selected-itinerary-point="selectedItineraryPoint"
            :active-filter="statusFilter"
            :app-sidebar-open="props.appSidebarOpen"
            :background-paused="isRouteComparisonModalOpen"
            :can-view-geofences="canViewGeofences"
            :can-edit-geofences="canEditGeofences"
            :use-geofence-location-address="useGeofenceLocationAddress"
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

    <AddActivoModal
      v-if="showActivoModal || hasMountedActivoModal"
      v-model="showActivoModal"
      :groups="assetCreationGroups"
      @add-activo="handleAddActivo"
    />

    <FleetEditModal
      v-if="showEditActivoModal || hasMountedEditActivoModal"
      v-model="showEditActivoModal"
      :activo="editingActivo"
      :groups="assetCreationGroups"
      @update-activo="handleUpdateActivo"
    />

    <FleetTerminalModal
      v-if="showTerminalModal || hasMountedTerminalModal"
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
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"

import { normalizeId } from "../utils/idUtils.js"

import FleetListPanel from "../components/activos/fleet/FleetListPanel.vue"
import ConfirmDialog from "../components/ui/ConfirmDialog.vue"

import { useFleetTerminal } from "../composables/activos/fleet/useFleetTerminal"
import { useFleetTelemetry } from "../composables/activos/fleet/useFleetTelemetry.js"
import { useSucursalesFlota } from "../composables/activos/fleet/useSucursalesFlota.js"
import { useGeofences } from "../composables/activos/geocercas/useGeofences.js"
import { useAuditTrail } from "../composables/audit/useAuditTrail.js"
import { useConfirmDialog } from "../composables/ui/useConfirmDialog.js"
import { usePersistedFleetLayout } from "../composables/activos/fleet/usePersistedFleetLayout.js"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"
import { useActivosService } from "../services/activos/useActivosService.js"

import { useActivosCrud } from "../composables/activos/view/useActivosCrud.js"
import { useActivosFilters } from "../composables/activos/view/useActivosFilters.js"
import { useActivosFleetModals } from "../composables/activos/view/useActivosFleetModals.js"
import { useActivosLayout } from "../composables/activos/view/useActivosLayout.js"
import { useActivosPermissions } from "../composables/activos/view/useActivosPermissions.js"
import { useActivosSelection } from "../composables/activos/view/useActivosSelection.js"
import { useActivosTelemetrySync } from "../composables/activos/view/useActivosTelemetrySync.js"
import { useActivosWorkspacePersistence } from "../composables/activos/view/useActivosWorkspacePersistence.js"
import { usePersonalAssetGroups } from "../composables/activos/fleet/usePersonalAssetGroups.js"
import { useRouteComparisonUiState } from "../composables/activos/routes/useRouteComparisonUiState.js"
import { useWorkspaceViewState } from "../composables/workspaces/useWorkspaceViewState.js"
import { createCityAssetGroups } from "../utils/activos/assetCityUtils.js"

const ActivosMapPanel = defineAsyncComponent(
  () => import("../components/activos/map/ActivosMapPanel.vue"),
)

const props = defineProps({
  appSidebarOpen: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()
const { currentUser } = useAuthSession()
const { accessibleCompanies, visibleAssets, canAccessFunction } = useAccessControl()
const { isRouteComparisonModalOpen } = useRouteComparisonUiState()

const MOCK_TELEMETRY_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_MOCK_TELEMETRY !== "false"

const MOCK_TELEMETRY_INTERVAL_MS = 5000
const MOCK_TELEMETRY_BATCH_SIZE = 18
const TABLE_SYNC_INTERVAL_MS = 2500

const {
  createActivo: createActivoRecord,
  updateActivo: updateActivoRecord,
  deleteActivo: deleteActivoRecord,
} = useActivosService()

const activeCompanyId = computed(() => String(route.params.empresaId || ""))
const { recordAudit } = useAuditTrail({
  companyId: activeCompanyId,
})

const getActivoAuditName = (activo = {}) => {
  return (
    activo.vehiculo ||
    activo.nombrePantalla ||
    activo.name ||
    activo.patente ||
    activo.id ||
    "Activo"
  )
}

const getGeofenceAuditName = (geofence = {}) => {
  return geofence.name || geofence.nombre || geofence.id || "Geocerca"
}

const {
  allowedSidebarSections,
  canCreateAssets,
  canEditGeofences,
  canManageAssets,
  canManageSucursales,
  canViewGeofences,
  canViewGps,
} = useActivosPermissions({
  activeCompanyId,
  canAccessFunction,
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
  const exists = sucursalCompanies.value.some((company) => {
    return company.id === String(companyId)
  })

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

const cityAssetGroups = computed(() => {
  return createCityAssetGroups(baseMockActivos.value)
})

const { selectedPersonalAssetGroupId, selectPersonalAssetGroup, filterActivosBySelectedGroup } =
  usePersonalAssetGroups({
    userId: currentUserId,
    companyId: activeCompanyId,
    availableActivos: baseMockActivos,
    dynamicGroups: cityAssetGroups,
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
  startMockTelemetry: startFleetMockTelemetry,
  stopMockTelemetry: stopFleetMockTelemetry,
} = useFleetTelemetry([], {
  intervalMs: MOCK_TELEMETRY_INTERVAL_MS,
  batchSize: MOCK_TELEMETRY_BATCH_SIZE,
})

let isMockTelemetryRunning = false

const startMockTelemetry = (...args) => {
  if (!MOCK_TELEMETRY_ENABLED || isMockTelemetryRunning) return

  const result = startFleetMockTelemetry(...args)

  isMockTelemetryRunning = true

  return result
}

const stopMockTelemetry = (...args) => {
  if (!isMockTelemetryRunning) return

  try {
    return stopFleetMockTelemetry(...args)
  } finally {
    isMockTelemetryRunning = false
  }
}

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

const mapPanelRef = ref(null)

let pendingMapTelemetryBatch = null

const applyMapTelemetryBatch = (batch = []) => {
  const applyTelemetryBatch = mapPanelRef.value?.applyTelemetryBatch

  if (typeof applyTelemetryBatch !== "function") {
    pendingMapTelemetryBatch = batch
    return
  }

  pendingMapTelemetryBatch = null
  applyTelemetryBatch(batch)
}

const filters = useActivosFilters({
  refreshMapLayout,

  onLeaveItinerarios: () => {
    selection?.clearSelectedItinerary()
  },

  onFilterChanged: async () => {
    selection?.ensureSelectedActivo()
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
  handleSidebarGeofenceSelected: selectSidebarGeofence,
  handleItineraryRouteSelected,
  handleItineraryPointSelected,
  handleClearItineraryRoute,
} = selection

const { publishWorkspaceViewState, pendingWorkspaceViewRestore } = useWorkspaceViewState()

const {
  fleetTableColumnPreferences,
  setFleetTableColumnPreferences,
  setUseGeofenceLocationAddress,
  useGeofenceLocationAddress,
} = useActivosWorkspacePersistence({
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
})

const handleSidebarGeofenceSelected = async (geofence) => {
  const isSameSelectedGeofence = normalizeId(selectedGeofenceId.value) === normalizeId(geofence?.id)

  await selectSidebarGeofence(geofence)

  if (!geofence) return

  if (isSameSelectedGeofence) {
    mapPanelRef.value?.focusGeofenceSelection?.(geofence)
  }
}

const handleSidebarGeofenceEdit = (geofence) => {
  if (!geofence?.id || !canEditGeofences.value) return

  selectedGeofenceId.value = geofence.id
  activeSidebarSection.value = "geocercas"

  mapPanelRef.value?.editGeofenceSelection?.(geofence)
}

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

    const createdActivo = createActivoRecord({
      activo,
      companyId: activeCompanyId.value,
    })

    if (createdActivo) {
      recordAudit({
        module: "activos",
        action: "asset:create",
        entityType: "activo",
        entityName: getActivoAuditName(createdActivo),
        description: "Se creo un activo en la flota.",
        metadata: {
          assetId: createdActivo.id,
          patent: createdActivo.patente || createdActivo.patent || "",
        },
      })
    }
  },

  updateActivo: (assetId, changes) => {
    if (!canManageAssets.value) return

    const updatedActivo = updateActivoRecord(assetId, changes)

    if (updatedActivo) {
      recordAudit({
        module: "activos",
        action: "asset:update",
        entityType: "activo",
        entityName: getActivoAuditName(updatedActivo),
        description: "Se actualizo la ficha de un activo.",
        metadata: {
          assetId: updatedActivo.id,
          changedFields: Object.keys(changes || {}),
        },
      })
    }
  },

  removeActivo: (assetId) => {
    if (!canManageAssets.value) return

    const activo = baseMockActivos.value.find((item) => {
      return normalizeId(item.id) === normalizeId(assetId)
    })

    deleteActivoRecord(assetId)

    recordAudit({
      module: "activos",
      action: "asset:delete",
      entityType: "activo",
      entityName: getActivoAuditName(activo) || String(assetId),
      severity: "warning",
      description: "Se elimino un activo de la flota.",
      metadata: {
        assetId,
      },
    })
  },
})

const {
  AddActivoModal,
  FleetEditModal,
  FleetTerminalModal,
  hasMountedActivoModal,
  hasMountedEditActivoModal,
  hasMountedTerminalModal,
  preloadFleetModals,
} = useActivosFleetModals({
  showActivoModal,
  showEditActivoModal,
  showTerminalModal,
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
  getPriorityTelemetryIds: () => {
    const terminalActivoId = normalizeId(terminalActivo.value?.id)

    return terminalActivoId ? [terminalActivoId] : []
  },
  recordTelemetryReports: false,

  onTelemetryBatch: (batch) => {
    applyMapTelemetryBatch(batch)
  },

  mockTelemetryEnabled: MOCK_TELEMETRY_ENABLED,
  mockTelemetryIntervalMs: MOCK_TELEMETRY_INTERVAL_MS,
  mockTelemetryBatchSize: MOCK_TELEMETRY_BATCH_SIZE,
  tableSyncIntervalMs: TABLE_SYNC_INTERVAL_MS,
})

const { normalizedActivos, tableActivos, mapActivos, filteredActivos, cleanupTelemetrySync } =
  telemetrySync

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
} = useSucursalesFlota({
  activos: tableActivos,
  companyId: selectedSucursalCompanyId,
})

const assetCreationGroups = computed(() => {
  return empresaSucursales.value?.sucursales || []
})

const handleAlternarSucursalesFlotaHabilitadas = () => {
  if (!canManageSucursales.value) return

  alternarSucursalesFlotaHabilitadas()

  recordAudit({
    companyId: selectedSucursalCompanyId.value || activeCompanyId.value,
    module: "empresas",
    action: "branch:toggle",
    entityType: "sucursales",
    entityName: empresaSucursales.value.name || "Sucursales",
    description: "Se cambio la configuracion de sucursales de la empresa.",
  })
}

const handleAgregarSucursalFlota = (nombreSucursal) => {
  if (!canManageSucursales.value) return

  agregarSucursalFlota(nombreSucursal)

  recordAudit({
    companyId: selectedSucursalCompanyId.value || activeCompanyId.value,
    module: "empresas",
    action: "branch:create",
    entityType: "sucursal",
    entityName: nombreSucursal || "Sucursal",
    description: "Se creo una sucursal para organizar la flota.",
  })
}

const handleActualizarNombreSucursalFlota = (sucursalId, nombreSucursal) => {
  if (!canManageSucursales.value) return

  actualizarNombreSucursalFlota(sucursalId, nombreSucursal)

  recordAudit({
    companyId: selectedSucursalCompanyId.value || activeCompanyId.value,
    module: "empresas",
    action: "branch:rename",
    entityType: "sucursal",
    entityName: nombreSucursal || "Sucursal",
    description: "Se renombro una sucursal de flota.",
    metadata: {
      branchId: sucursalId,
    },
  })
}

const handleAlternarEstadoSucursalFlota = (sucursalId) => {
  if (!canManageSucursales.value) return

  const sucursal = empresaSucursales.value.sucursales.find((item) => {
    return normalizeId(item.id) === normalizeId(sucursalId)
  })

  alternarEstadoSucursalFlota(sucursalId)

  recordAudit({
    companyId: selectedSucursalCompanyId.value || activeCompanyId.value,
    module: "empresas",
    action: "branch:status",
    entityType: "sucursal",
    entityName: sucursal?.name || "Sucursal",
    description: "Se cambio el estado de una sucursal de flota.",
    metadata: {
      branchId: sucursalId,
    },
  })
}

const handleEliminarSucursalFlota = (sucursalId) => {
  if (!canManageSucursales.value) return

  const sucursal = empresaSucursales.value.sucursales.find((item) => {
    return normalizeId(item.id) === normalizeId(sucursalId)
  })

  eliminarSucursalFlota(sucursalId)

  recordAudit({
    companyId: selectedSucursalCompanyId.value || activeCompanyId.value,
    module: "empresas",
    action: "branch:delete",
    entityType: "sucursal",
    entityName: sucursal?.name || "Sucursal",
    severity: "warning",
    description: "Se elimino una sucursal de flota.",
    metadata: {
      branchId: sucursalId,
    },
  })
}

const handleGeofenceCreated = async (geofence) => {
  if (!canEditGeofences.value) return

  const createdGeofence = createGeofence(geofence)

  if (!createdGeofence) return

  selectedGeofenceId.value = createdGeofence.id

  recordAudit({
    module: "geocercas",
    action: "geofence:create",
    entityType: "geocerca",
    entityName: getGeofenceAuditName(createdGeofence),
    description: "Se creo una geocerca.",
    metadata: {
      geofenceId: createdGeofence.id,
      type: createdGeofence.type,
    },
  })

  await refreshMapLayout(true)
}

const handleGeofenceUpdated = (updatedGeofence) => {
  if (!canEditGeofences.value) return

  const geofence = updateGeofence(updatedGeofence)

  if (!geofence) return

  recordAudit({
    module: "geocercas",
    action: "geofence:update",
    entityType: "geocerca",
    entityName: getGeofenceAuditName(geofence),
    description: "Se actualizo una geocerca.",
    metadata: {
      geofenceId: geofence.id,
      type: geofence.type,
    },
  })
}

const handleGeofenceDeleted = async (geofenceId) => {
  if (!canEditGeofences.value) return

  const geofence = geofences.value.find((item) => {
    return normalizeId(item.id) === normalizeId(geofenceId)
  })

  deleteGeofence(geofenceId)

  recordAudit({
    module: "geocercas",
    action: "geofence:delete",
    entityType: "geocerca",
    entityName: getGeofenceAuditName(geofence),
    severity: "warning",
    description: "Se elimino una geocerca.",
    metadata: {
      geofenceId,
    },
  })

  if (normalizeId(selectedGeofenceId.value) === normalizeId(geofenceId)) {
    selectedGeofenceId.value = null
  }

  await refreshMapLayout(true)
}

watch(personalMapActivoIdsSignature, () => {
  ensureSelectedActivo()
})

onMounted(() => {
  preloadFleetModals()

  if (pendingMapTelemetryBatch) {
    applyMapTelemetryBatch(pendingMapTelemetryBatch)
  }
})

onBeforeUnmount(() => {
  cleanupTelemetrySync()
  cleanupLayout()
})
</script>
