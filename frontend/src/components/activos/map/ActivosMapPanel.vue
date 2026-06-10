<template>
  <section
    ref="panelRef"
    class="min-h-0 overflow-hidden bg-[#dbe3ee] shadow-sm"
    :class="
      isFullscreen
        ? 'fixed inset-0 z-[2147483600] h-screen w-screen rounded-none border-0'
        : 'relative h-full rounded-xl border border-[#d8dee8]'
    "
  >
    <div ref="mapRef" class="absolute inset-0"></div>

    <div v-if="showKpis" class="pointer-events-none absolute bottom-3 left-3 z-[520]">
      <TopStatsBar
        :activos="mapStatsActivos"
        :active-filter="activeFilter"
        class="pointer-events-auto"
        @select-filter="handleSelectFilter"
      />
    </div>

    <MapFloatingTools
      :show-kpis="showKpis"
      :show-geofences="showGeofences"
      :draw-mode="drawMode"
      :can-save-polygon="canSavePolygon"
      :can-save-route="canSaveRoute"
      :draft-polygon-points="draftPolygonPoints"
      :draft-route-points="draftRoutePoints"
      :map-type="mapType"
      :map-type-options="mapTypeOptions"
      :is-fullscreen="isFullscreen"
      :can-view-geofences="canViewGeofences"
      :can-edit-geofences="canEditGeofences"
      @toggle-kpis="toggleKpis"
      @toggle-fullscreen="toggleFullscreen"
      @create-circle="handleCreateCircle"
      @create-polygon="handleCreatePolygon"
      @create-route="handleCreateRoute"
      @open-edit-geofence-modal="openEditGeofenceModal"
      @open-geofence-history-selector="openGeofenceHistorySelector"
      @toggle-geofence-visibility="handleToggleGeofenceVisibility"
      @finish-polygon="finishPolygon"
      @finish-route="finishRoute"
      @undo-polygon-point="undoPolygonPoint"
      @undo-route-point="undoRoutePoint"
      @cancel="handleCancel"
      @change-map-type="handleChangeMapType"
    />

    <div class="pointer-events-none absolute right-3 top-3 z-[520]">
      <div
        class="flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/90 px-2.5 py-1.5 text-[10px] font-black text-[#102372] shadow-lg backdrop-blur-md"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-[#FF6600]"></span>
        <span>{{ currentMapTypeOption.label }}</span>
      </div>
    </div>

    <div class="pointer-events-none absolute right-3 top-12 z-[520]">
      <div
        class="pointer-events-auto flex items-center gap-1 rounded-xl border border-white/70 bg-white/90 p-1 shadow-lg backdrop-blur-md"
      >
        <button
          type="button"
          class="rounded-lg px-2.5 py-1.5 text-[10px] font-black transition"
          :class="
            showMovementTrails
              ? 'bg-[#102372] text-white shadow-sm'
              : 'bg-white text-[#102372] hover:bg-[#f3f5fa]'
          "
          @click="toggleMovementTrails"
        >
          Estela
        </button>

        <button
          type="button"
          class="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-black text-[#FF6600] transition hover:bg-[#fff3eb]"
          @click="clearMovementTrails"
        >
          Limpiar
        </button>
      </div>
    </div>

    <GeofenceEditorPanel
      v-if="drawMode || editingDraft"
      :draw-mode="drawMode"
      :editing-draft="editingDraft"
      :helper-title="helperTitle"
      :helper-text="helperText"
      :draft-geofence-form="draftGeofenceForm"
      :draft-geofence-preview-name="draftGeofencePreviewName"
      :edit-add-point="editAddPoint"
      :editing-color="editingColor"
      :editing-preview-name="editingPreviewName"
      :can-remove-last-edit-point="canRemoveLastEditPoint"
      @update-draft-field="handleDraftGeofenceField"
      @update-editing-meta="handleEditingGeofenceMeta"
      @update-edit-add-point="handleUpdateEditAddPoint"
      @remove-last-edit-point="removeLastEditPoint"
      @stop-editing="handleStopEditing"
    />

    <GeofenceSelectorModal
      v-if="showGeofenceModal"
      v-model="showGeofenceModal"
      :geofence-items="geofenceItems"
      :selected-geofence-id="activeGeofenceId"
      :editing-draft="editingDraft"
      :can-edit="canEditGeofences"
      @select-edit="selectGeofenceToEdit"
      @open-history="openGeofenceHistory"
      @delete-geofence="handleDeleteGeofence"
    />

    <GeofenceHistoryModal
      v-if="showGeofenceHistoryModal"
      v-model="showGeofenceHistoryModal"
      :geofence="selectedHistoryGeofence"
      :events="selectedHistoryEvents"
    />
  </section>
</template>

<script setup>
import { computed, defineAsyncComponent, ref, watch } from "vue"
import "leaflet/dist/leaflet.css"
import "../../../assets/styles/activos-map.css"

import MapFloatingTools from "./MapFloatingTools.vue"
import TopStatsBar from "./TopStatsBar.vue"
import GeofenceEditorPanel from "../geocercas/GeofenceEditorPanel.vue"
import { useActivosMap } from "../../../composables/activos/map/useActivosMap.js"
import {
  useMapPanelGeofenceActions,
  useMapPanelGeofenceState,
} from "../../../composables/activos/map/useMapPanelGeofences.js"
import { useMapPanelFullscreen } from "../../../composables/activos/map/useMapPanelFullscreen.js"

const GeofenceSelectorModal = defineAsyncComponent(
  () => import("../geocercas/GeofenceSelectorModal.vue"),
)

const GeofenceHistoryModal = defineAsyncComponent(
  () => import("../geocercas/GeofenceHistoryModal.vue"),
)

const props = defineProps({
  activos: {
    type: Array,
    default: () => [],
  },
  allActivos: {
    type: Array,
    default: () => [],
  },
  selectedId: {
    type: [Number, String],
    default: null,
  },
  selectedGeofenceId: {
    type: [Number, String],
    default: null,
  },
  activeFilter: {
    type: String,
    default: "all",
  },
  geofences: {
    type: Array,
    default: () => [],
  },
  itineraryRoute: {
    type: Object,
    default: null,
  },
  selectedItineraryPoint: {
    type: Object,
    default: null,
  },
  telemetryBatch: {
    type: Array,
    default: () => [],
  },
  appSidebarOpen: {
    type: Boolean,
    default: false,
  },
  canViewGeofences: {
    type: Boolean,
    default: false,
  },
  canEditGeofences: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  "select",
  "select-filter",
  "geofence-created",
  "geofence-updated",
  "geofence-deleted",
  "clear-geofence-selection",
])

const panelRef = ref(null)
const mapRef = ref(null)
const showKpis = ref(true)
const mapType = ref("standard")

let pendingSidebarBatch = null

const { isFullscreen, toggleFullscreen } = useMapPanelFullscreen(panelRef)

const geofencePanel = useMapPanelGeofenceState({ props, emit })

const {
  showGeofenceModal,
  showGeofenceHistoryModal,
  activeGeofenceId,
  selectedHistoryGeofence,
  selectedHistoryEvents,
  showGeofences,
  draftGeofenceForm,
  geofenceItems,
  visibleGeofences,
  draftGeofencePreviewName,
  draftGeofenceOptions,
  handleDraftGeofenceField,
  openEditGeofenceModal,
  openGeofenceHistorySelector,
  openGeofenceHistory,
} = geofencePanel

const mapTypeOptions = [
  {
    value: "standard",
    label: "Estándar",
    icon: "mapa",
  },
  {
    value: "satellite",
    label: "Satelital",
    icon: "satelital",
  },
  {
    value: "light",
    label: "Claro",
    icon: "claro",
  },
  {
    value: "voyager",
    label: "Urbano",
    icon: "urbano",
  },
  {
    value: "hot",
    label: "Simple",
    icon: "simple",
  },
]

const currentMapTypeOption = computed(() => {
  return mapTypeOptions.find((option) => option.value === mapType.value) || mapTypeOptions[0]
})

const mapStatsActivos = computed(() => {
  return props.allActivos.length ? props.allActivos : props.activos
})

const mapProps = {
  get activos() {
    return props.activos
  },
  get selectedId() {
    return props.selectedId
  },
  get geofences() {
    return visibleGeofences.value
  },
  get itineraryRoute() {
    return props.itineraryRoute
  },
  get selectedItineraryPoint() {
    return props.selectedItineraryPoint
  },
  get mapType() {
    return mapType.value
  },
  get draftGeofenceOptions() {
    return draftGeofenceOptions.value
  },
  get canEditGeofences() {
    return props.canEditGeofences
  },
}

const {
  drawMode,
  draftPolygonPoints,
  draftRoutePoints,
  editingDraft,
  editAddPoint,
  canSavePolygon,
  canSaveRoute,
  helperTitle,
  helperText,

  startCircleDraw,
  startPolygonDraw,
  startRouteDraw,

  finishPolygon,
  finishRoute,

  undoPolygonPoint,
  undoRoutePoint,
  cancelAll,

  startEditGeofence,
  stopEditing,
  removeLastEditPoint,
  deleteGeofence,
  updateEditingGeofenceMeta,

  applyActivoTelemetryBatch,

  showMovementTrails,
  toggleMovementTrails,
  clearMovementTrails,
} = useActivosMap({
  props: mapProps,
  emit,
  mapRef,
})

const mapController = {
  drawMode,
  editingDraft,
  editAddPoint,
  startCircleDraw,
  startPolygonDraw,
  startRouteDraw,
  cancelAll,
  startEditGeofence,
  stopEditing,
  deleteGeofence,
  updateEditingGeofenceMeta,
}

const {
  editingColor,
  editingPreviewName,
  canRemoveLastEditPoint,
  handleEditingGeofenceMeta,
  handleUpdateEditAddPoint,
  handleToggleGeofenceVisibility,
  handleCreateCircle,
  handleCreatePolygon,
  handleCreateRoute,
  selectGeofenceToEdit,
  handleExternalGeofenceSelection,
  handleStopEditing,
  handleCancel,
  handleDeleteGeofence,
} = useMapPanelGeofenceActions({
  props,
  state: geofencePanel,
  mapController,
})

const handleSelectFilter = (filter) => {
  emit("select-filter", filter)
}

const toggleKpis = () => {
  showKpis.value = !showKpis.value
}

const handleChangeMapType = (type) => {
  const exists = mapTypeOptions.some((option) => option.value === type)

  if (!exists) return

  mapType.value = type
}

const handleTelemetryBatch = (batch = []) => {
  if (!Array.isArray(batch) || !batch.length) return []

  return applyActivoTelemetryBatch(batch)
}

watch(
  () => props.telemetryBatch,
  (batch) => {
    if (props.appSidebarOpen) {
      pendingSidebarBatch = batch
      return
    }

    handleTelemetryBatch(batch)
  },
  {
    deep: false,
  },
)

watch(
  () => props.appSidebarOpen,
  (isOpen) => {
    if (isOpen || !pendingSidebarBatch) return

    handleTelemetryBatch(pendingSidebarBatch)
    pendingSidebarBatch = null
  },
)

watch(
  () => props.selectedGeofenceId,
  (geofenceId) => {
    handleExternalGeofenceSelection(geofenceId)
  },
)
</script>
