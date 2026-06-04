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
          :activos="filteredActivos"
          :all-activos="tableActivos"
          :geofences="geofences"
          :selected-geofence-id="selectedGeofenceId"
          :selected-id="selectedId"
          :active-filter="statusFilter"
          :active-section="activeSidebarSection"
          :search="sidebarSearch"
          :empresa-sucursales="empresaSucursales"
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
          @alternar-sucursales-habilitadas="alternarSucursalesFlotaHabilitadas"
          @agregar-sucursal="agregarSucursalFlota"
          @actualizar-nombre-sucursal="actualizarNombreSucursalFlota"
          @alternar-estado-sucursal="alternarEstadoSucursalFlota"
          @eliminar-sucursal="eliminarSucursalFlota"
          @actualizar-sucursal-activo="actualizarSucursalActivoFlota"
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
            :activos="mapActivos"
            :all-activos="tableActivos"
            :telemetry-batch="latestTelemetryBatch"
            :selected-id="selectedId"
            :selected-geofence-id="selectedGeofenceId"
            :geofences="geofences"
            :itinerary-route="selectedItineraryRoute"
            :selected-itinerary-point="selectedItineraryPoint"
            :active-filter="statusFilter"
            :app-sidebar-open="props.appSidebarOpen"
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
import { onBeforeUnmount } from "vue"
import { useRoute } from "vue-router"

import { mockActivos } from "../data/mockActivos"
import { createMockFleetSnapshot } from "../data/mockTelemetryStream.js"
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
import { usePersistedFleetState } from "../composables/activos/fleet/usePersistedFleetState.js"

import { useActivosCrud } from "../composables/activos/view/useActivosCrud.js"
import { useActivosFilters } from "../composables/activos/view/useActivosFilters.js"
import { useActivosLayout } from "../composables/activos/view/useActivosLayout.js"
import { useActivosSelection } from "../composables/activos/view/useActivosSelection.js"
import { useActivosTelemetrySync } from "../composables/activos/view/useActivosTelemetrySync.js"

const props = defineProps({
  appSidebarOpen: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()

const STRESS_FLEET_COUNT = Number(import.meta.env.VITE_FLEET_STRESS_COUNT || 0)
const STRESS_BATCH_SIZE = Number(import.meta.env.VITE_FLEET_STRESS_BATCH_SIZE || 250)

const MOCK_TELEMETRY_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_MOCK_TELEMETRY !== "false"

const MOCK_TELEMETRY_INTERVAL_MS = 1000
const MOCK_TELEMETRY_BATCH_SIZE = STRESS_FLEET_COUNT > 0 ? STRESS_BATCH_SIZE : 18
const TABLE_SYNC_INTERVAL_MS = 2500

const baseMockActivos =
  import.meta.env.DEV && STRESS_FLEET_COUNT > 0
    ? createMockFleetSnapshot({
        count: STRESS_FLEET_COUNT,
      })
    : mockActivos

const { geofences, createGeofence, updateGeofence, deleteGeofence } = useGeofences()

const { confirmDialog, openConfirmDialog, confirmAction, cancelAction } = useConfirmDialog()

const { customActivos, deletedActivoIds, editedActivos, leftPanelWidth, persistPanelWidth } =
  usePersistedFleetState()

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

const filters = useActivosFilters({
  refreshMapLayout,

  onLeaveItinerarios: () => {
    selection?.clearSelectedItinerary()
  },

  onFilterChanged: async () => {
    telemetrySync?.syncMapSnapshotActivos()

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
  baseSelectedId: baseMockActivos[0]?.id || null,
  getMapActivos: () => telemetrySync?.mapActivos.value || [],
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
  openAddActivoModal,
  handleAddActivo,
  handleUpdateActivo,
  handleDeviceAction,
} = useActivosCrud({
  baseMockActivos,
  customActivos,
  deletedActivoIds,
  editedActivos,

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
  mockTelemetryEnabled: MOCK_TELEMETRY_ENABLED,
  mockTelemetryIntervalMs: MOCK_TELEMETRY_INTERVAL_MS,
  mockTelemetryBatchSize: MOCK_TELEMETRY_BATCH_SIZE,
  tableSyncIntervalMs: TABLE_SYNC_INTERVAL_MS,
})

const { tableActivos, latestTelemetryBatch, mapActivos, filteredActivos, cleanupTelemetrySync } =
  telemetrySync

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
  companyId: String(route.params.empresaId || "general"),
})

const handleGeofenceCreated = async (geofence) => {
  createGeofence(geofence)

  selectedGeofenceId.value = geofence?.id || null

  await refreshMapLayout(true)
}

const handleGeofenceUpdated = (updatedGeofence) => {
  updateGeofence(updatedGeofence)
}

const handleGeofenceDeleted = async (geofenceId) => {
  deleteGeofence(geofenceId)

  if (normalizeId(selectedGeofenceId.value) === normalizeId(geofenceId)) {
    selectedGeofenceId.value = null
  }

  await refreshMapLayout(true)
}

onBeforeUnmount(() => {
  cleanupTelemetrySync()
  cleanupLayout()
})
</script>
