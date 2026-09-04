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
          :asset-tags="activeAssetTags"
          :itinerary-activos="normalizedActivos"
          :geofences="permittedGeofences"
          :geofence-groups="geofenceGroups"
          :selected-geofence-id="selectedGeofenceId"
          :selected-id="selectedId"
          :active-filter="statusFilter"
          :active-section="activeSidebarSection"
          :search="sidebarSearch"
          :allowed-sections="allowedSidebarSections"
          :can-manage-assets="canManageAssets"
          :can-create-assets="canCreateAssets"
          :can-view-itineraries="canViewItineraries"
          :can-view-maintenance="canViewMaintenance"
          :has-active-daily-summary="hasActiveDailySummary"
          :can-edit-geofences="canEditGeofences"
          :use-geofence-location-address="useGeofenceLocationAddress"
          :column-preferences="fleetTableColumnPreferences"
          :itinerary-context-request="itineraryContextRequest"
          class="min-h-0 flex-1"
          @select="selectActivo"
          @select-filter="setStatusFilter"
          @update:search="setSidebarSearch"
          @update:active-section="setSidebarSection"
          @route-selected="handleItineraryRouteSelected"
          @point-selected="handleItineraryPointSelected"
          @clear-route="handleClearItineraryRouteState"
          @open-add-activo="openAddActivoModal"
          @device-action="handleDeviceAction"
          @geofence-selected="handleSidebarGeofenceSelected"
          @geofence-edit="handleSidebarGeofenceEdit"
          @geofence-delete="handleGeofenceDeleted"
          @geofence-delete-many="handleGeofencesDeleted"
          @geofence-export="handleGeofenceExported"
          @geofence-import="handleGeofencesImported"
          @geofence-group-create="handleGeofenceGroupCreated"
          @geofence-group-delete="handleGeofenceGroupDeleted"
          @geofence-group-rename="handleGeofenceGroupRenamed"
          @asset-tag-create="handleAssetTagCreate"
          @asset-tag-update="handleAssetTagUpdate"
          @asset-tag-delete="handleAssetTagDelete"
          @update:use-geofence-location-address="setUseGeofenceLocationAddress"
          @select-city-asset-group="selectCityAssetGroup"
          @select-vehicle-asset-group="selectVehicleAssetGroup"
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
            :geofence-groups="geofenceGroups"
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
            @open-geofence-section="setSidebarSection('geocercas')"
          />
        </div>
      </div>
    </div>

    <AddActivoModal
      v-if="showActivoModal || hasMountedActivoModal"
      v-model="showActivoModal"
      :asset-tags="activeAssetTags"
      @add-activo="handleAddActivo"
    />

    <FleetEditModal
      v-if="showEditActivoModal || hasMountedEditActivoModal"
      v-model="showEditActivoModal"
      :activo="editingActivo"
      :asset-tags="activeAssetTags"
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
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

import { normalizeId } from "../utils/idUtils.js"

import FleetListPanel from "../components/activos/fleet/FleetListPanel.vue"
import ConfirmDialog from "../components/ui/ConfirmDialog.vue"

import { useFleetTerminal } from "../composables/activos/fleet/useFleetTerminal"
import { useFleetTelemetry } from "../composables/activos/fleet/useFleetTelemetry.js"
import { useGeofences } from "../composables/activos/geocercas/useGeofences.js"
import { useAuditTrail } from "../composables/audit/useAuditTrail.js"
import { useConfirmDialog } from "../composables/ui/useConfirmDialog.js"
import { usePersistedFleetLayout } from "../composables/activos/fleet/usePersistedFleetLayout.js"
import { useAccessControl } from "../composables/auth/useAccessControl.js"
import { useAuthSession } from "../composables/auth/useAuthSession.js"
import { useMockDatabase } from "../composables/mock/useMockDatabase.js"
import { useActivosService } from "../services/activos/useActivosService.js"

import { useActivosCrud } from "../composables/activos/view/useActivosCrud.js"
import { useActivosDeviceActions } from "../composables/activos/view/useActivosDeviceActions.js"
import { useActivosFilters } from "../composables/activos/view/useActivosFilters.js"
import { useActivosFleetModals } from "../composables/activos/view/useActivosFleetModals.js"
import { useActivosGeofenceActions } from "../composables/activos/view/useActivosGeofenceActions.js"
import { useActivosLayout } from "../composables/activos/view/useActivosLayout.js"
import { useActivosMapTelemetryBridge } from "../composables/activos/view/useActivosMapTelemetryBridge.js"
import { useActivosPermissions } from "../composables/activos/view/useActivosPermissions.js"
import { useActivosSelection } from "../composables/activos/view/useActivosSelection.js"
import { useActivosTelemetrySync } from "../composables/activos/view/useActivosTelemetrySync.js"
import { useActivosWorkspacePersistence } from "../composables/activos/view/useActivosWorkspacePersistence.js"
import { useAssetCityFilter } from "../composables/activos/fleet/useAssetCityFilter.js"
import { useAssetVehicleGroupFilter } from "../composables/activos/fleet/useAssetVehicleGroupFilter.js"
import { useAssetVehicleGroupManagement } from "../composables/activos/fleet/useAssetVehicleGroupManagement.js"
import { useRouteComparisonUiState } from "../composables/activos/routes/useRouteComparisonUiState.js"
import { useWorkspaceViewState } from "../composables/workspaces/useWorkspaceViewState.js"
import { createCityAssetGroups } from "../utils/activos/assetCityUtils.js"
import { createVehicleAssetGroups } from "../utils/activos/assetVehicleGroupUtils.js"

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
const router = useRouter()
const { currentUser } = useAuthSession()
const { visibleAssets, canAccessFunction } = useAccessControl()
const { isRouteComparisonModalOpen } = useRouteComparisonUiState()

const { assetTags, createAssetTag, updateAssetTag, deleteAssetTag } = useMockDatabase()

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

const activeAssetTags = computed(() => {
  if (!activeCompanyId.value) return []

  return assetTags.value.filter((tag) => {
    return String(tag.companyId) === activeCompanyId.value && tag.active !== false
  })
})

const baseMockActivos = computed(() => {
  if (!activeCompanyId.value) return []

  return visibleAssets.value.filter((activo) => {
    return String(activo.companyId) === activeCompanyId.value
  })
})

const getRouteSelectedActivoId = () => {
  return normalizeId(route.query.activoId || route.query.assetId || route.query.asset)
}

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

const {
  allowedSidebarSections,
  canCreateAssets,
  canEditGeofences,
  canManageAssets,
  canManageAssetTags,
  canViewGeofences,
  canViewGps,
  canViewItineraries,
  canViewMaintenance,
} = useActivosPermissions({
  activeCompanyId,
  canAccessFunction,
})

const normalizeAssetTagIds = (assetTagIds = []) => {
  if (!Array.isArray(assetTagIds)) return []

  return [
    ...new Set(
      assetTagIds
        .map((assetTagId) => {
          return String(assetTagId ?? "").trim()
        })
        .filter(Boolean),
    ),
  ]
}

const normalizeAssetIds = (assetIds = []) => {
  if (!Array.isArray(assetIds)) return []

  return [
    ...new Set(
      assetIds
        .map((assetId) => {
          return normalizeId(assetId)
        })
        .filter(Boolean),
    ),
  ]
}

const syncAssetTagAssignments = (assetTagId, selectedAssetIds = []) => {
  const normalizedAssetTagId = String(assetTagId ?? "").trim()

  if (!normalizedAssetTagId) {
    return {
      updatedAssetIds: [],
      assignedAssetIds: [],
    }
  }

  const selectedAssetIdSet = new Set(normalizeAssetIds(selectedAssetIds))
  const updatedAssetIds = []

  baseMockActivos.value.forEach((activo) => {
    const activoId = normalizeId(activo?.id)

    if (!activoId) return

    const currentAssetTagIds = normalizeAssetTagIds(activo.assetTagIds)
    const hasAssetTag = currentAssetTagIds.includes(normalizedAssetTagId)
    const shouldHaveAssetTag = selectedAssetIdSet.has(activoId)

    if (hasAssetTag === shouldHaveAssetTag) return

    const nextAssetTagIds = shouldHaveAssetTag
      ? normalizeAssetTagIds([...currentAssetTagIds, normalizedAssetTagId])
      : currentAssetTagIds.filter((currentAssetTagId) => {
          return currentAssetTagId !== normalizedAssetTagId
        })

    const updatedActivo = updateActivoRecord(activo.id, {
      assetTagIds: nextAssetTagIds,
    })

    if (updatedActivo) {
      updatedAssetIds.push(activoId)
    }
  })

  return {
    updatedAssetIds,
    assignedAssetIds: Array.from(selectedAssetIdSet),
  }
}

const handleAssetTagCreate = (payload = {}) => {
  if (!canManageAssetTags.value || !activeCompanyId.value) return

  const name = String(payload.name || "").trim()

  if (!name) return

  const { assetIds = [], ...assetTagPayload } = payload

  const createdTag = createAssetTag({
    ...assetTagPayload,
    companyId: activeCompanyId.value,
    name,
  })

  if (!createdTag) return

  const assignmentResult = syncAssetTagAssignments(createdTag.id, assetIds)

  recordAudit({
    module: "activos",
    action: "asset-tag:create",
    entityType: "asset-tag",
    entityName: createdTag.name,
    description: "Se creo una etiqueta de activos.",
    metadata: {
      assetTagId: createdTag.id,
      assignedAssetIds: assignmentResult.assignedAssetIds,
      updatedAssetIds: assignmentResult.updatedAssetIds,
    },
  })
}

const handleAssetTagUpdate = (payload = {}) => {
  if (!canManageAssetTags.value) return

  const assetTagId = payload.id

  if (assetTagId === null || assetTagId === undefined) return

  const updatedTag = updateAssetTag(assetTagId, payload.changes || {})

  if (!updatedTag) return

  const hasAssetAssignments = Array.isArray(payload.assetIds)

  const assignmentResult = hasAssetAssignments
    ? syncAssetTagAssignments(assetTagId, payload.assetIds)
    : {
        updatedAssetIds: [],
        assignedAssetIds: [],
      }

  recordAudit({
    module: "activos",
    action: "asset-tag:update",
    entityType: "asset-tag",
    entityName: updatedTag.name,
    description: "Se actualizo una etiqueta de activos.",
    metadata: {
      assetTagId: updatedTag.id,
      changedFields: Object.keys(payload.changes || {}),
      assetAssignmentsChanged: assignmentResult.updatedAssetIds.length > 0,
      assignedAssetIds: hasAssetAssignments ? assignmentResult.assignedAssetIds : undefined,
      updatedAssetIds: assignmentResult.updatedAssetIds,
    },
  })
}

const handleAssetTagDelete = (assetTagId) => {
  if (!canManageAssetTags.value) return

  const tag = assetTags.value.find((item) => {
    return String(item.id) === String(assetTagId)
  })

  if (!tag) return

  deleteAssetTag(assetTagId)

  recordAudit({
    module: "activos",
    action: "asset-tag:delete",
    entityType: "asset-tag",
    entityName: tag.name,
    severity: "warning",
    description: "Se elimino una etiqueta de activos.",
    metadata: {
      assetTagId: tag.id,
    },
  })
}

const currentUserId = computed(() => {
  return currentUser.value?.id || ""
})

const cityAssetGroups = computed(() => {
  return createCityAssetGroups(baseMockActivos.value)
})

const { selectedCityAssetGroupId, selectCityAssetGroup, filterActivosBySelectedCityGroup } =
  useAssetCityFilter({
    userId: currentUserId,
    companyId: activeCompanyId,
    availableActivos: baseMockActivos,
    cityGroups: cityAssetGroups,
  })

const { managedVehicleGroups } = useAssetVehicleGroupManagement({
  contextId: activeCompanyId,
  availableActivos: baseMockActivos,
})

const vehicleAssetGroups = computed(() => {
  return createVehicleAssetGroups({
    assets: baseMockActivos.value,
    groups: managedVehicleGroups.value,
  })
})

const {
  selectedVehicleAssetGroupId,
  selectVehicleAssetGroup,
  filterActivosBySelectedVehicleGroup,
} = useAssetVehicleGroupFilter({
  userId: currentUserId,
  contextId: activeCompanyId,
  availableActivos: baseMockActivos,
  vehicleGroups: vehicleAssetGroups,
})

const {
  geofences,
  geofenceGroups,
  createGeofence,
  createGeofenceGroup,
  updateGeofence,
  deleteGeofence,
  deleteGeofences,
  deleteGeofenceGroup,
  renameGeofenceGroup,
  importGeofences,
} = useGeofences({
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

const { mapPanelRef, applyMapTelemetryBatch, flushPendingMapTelemetryBatch } =
  useActivosMapTelemetryBridge()

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
  baseSelectedId: getRouteSelectedActivoId() || baseMockActivos.value[0]?.id || null,
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

watch(
  () => route.query.activoId || route.query.assetId || route.query.asset,
  async () => {
    const routeActivoId = getRouteSelectedActivoId()

    if (!routeActivoId || normalizeId(selectedId.value) === routeActivoId) return

    selectedId.value = routeActivoId
    await refreshMapLayout(true)
  },
)

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
  selectCityAssetGroup,
  selectVehicleAssetGroup,
  selectedGeofenceId,
  selectedId,
  selectedCityAssetGroupId,
  selectedVehicleAssetGroupId,
  statusFilter,
})

const {
  handleGeofenceCreated,
  handleGeofenceDeleted,
  handleGeofencesDeleted,
  handleGeofenceExported,
  handleGeofenceGroupCreated,
  handleGeofenceGroupDeleted,
  handleGeofenceGroupRenamed,
  handleGeofencesImported,
  handleGeofenceUpdated,
  handleSidebarGeofenceEdit,
  handleSidebarGeofenceSelected,
} = useActivosGeofenceActions({
  activeSidebarSection,
  canEditGeofences,
  createGeofence,
  createGeofenceGroup,
  deleteGeofence,
  deleteGeofences,
  deleteGeofenceGroup,
  geofences,
  geofenceGroups,
  importGeofences,
  mapPanelRef,
  recordAudit,
  refreshMapLayout,
  renameGeofenceGroup,
  selectedGeofenceId,
  selectSidebarGeofence,
  updateGeofence,
})

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

const {
  hasActiveDailySummary,
  itineraryContextRequest,
  handleClearItineraryRouteState,
  handleDeviceAction,
} = useActivosDeviceActions({
  activeCompanyId,
  canManageAssets,
  canViewItineraries,
  canViewMaintenance,
  handleClearItineraryRoute,
  handleDeviceActionBase,
  router,
  selectedId,
  setSidebarSection,
})

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
  return filterActivosBySelectedCityGroup(filterActivosBySelectedVehicleGroup(mapActivos.value))
})

const personalFilteredActivos = computed(() => {
  return filterActivosBySelectedCityGroup(
    filterActivosBySelectedVehicleGroup(filteredActivos.value),
  )
})

const personalTableActivos = computed(() => {
  return filterActivosBySelectedCityGroup(filterActivosBySelectedVehicleGroup(tableActivos.value))
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

watch(personalMapActivoIdsSignature, () => {
  ensureSelectedActivo()
})

onMounted(() => {
  preloadFleetModals()
  flushPendingMapTelemetryBatch()
})

onBeforeUnmount(() => {
  cleanupTelemetrySync()
  cleanupLayout()
})
</script>
