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
      v-model="showGeofenceHistoryModal"
      :geofence="selectedHistoryGeofence"
      :events="selectedHistoryEvents"
    />
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import "leaflet/dist/leaflet.css"
import "../../../assets/styles/activos-map.css"

import MapFloatingTools from "./MapFloatingTools.vue"
import TopStatsBar from "./TopStatsBar.vue"
import GeofenceEditorPanel from "../geocercas/GeofenceEditorPanel.vue"
import GeofenceSelectorModal from "../geocercas/GeofenceSelectorModal.vue"
import GeofenceHistoryModal from "../geocercas/GeofenceHistoryModal.vue"
import { buildMockGeofenceHistory } from "../../../data/mockGeofenceHistoryData.js"
import { useActivosMap } from "../../../composables/activos/map/useActivosMap.js"
import { DEFAULT_GEOFENCE_COLOR, normalizeGeofenceColor } from "../../../utils/geofenceUtils.js"
import { normalizeId } from "../../../utils/idUtils.js"

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
const showGeofenceModal = ref(false)
const showGeofenceHistoryModal = ref(false)
const activeGeofenceId = ref(null)
const selectedHistoryGeofence = ref(null)
const selectedHistoryEvents = ref([])
const showGeofences = ref(true)
const showKpis = ref(true)
const mapType = ref("standard")
const currentDraftType = ref("circle")
const isFullscreen = ref(false)

let pendingSidebarBatch = null

const draftGeofenceForm = ref({
  name: "",
  color: DEFAULT_GEOFENCE_COLOR,
})

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

const refreshFullscreenLayout = async () => {
  await nextTick()

  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"))

    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"))
    })
  })

  setTimeout(() => {
    window.dispatchEvent(new Event("resize"))
  }, 220)

  setTimeout(() => {
    window.dispatchEvent(new Event("resize"))
  }, 420)
}

const requestNativeFullscreen = async () => {
  if (!panelRef.value) return

  if (panelRef.value.requestFullscreen) {
    await panelRef.value.requestFullscreen({
      navigationUI: "hide",
    })
    return
  }

  if (panelRef.value.webkitRequestFullscreen) {
    panelRef.value.webkitRequestFullscreen()
  }
}

const exitNativeFullscreen = async () => {
  if (document.fullscreenElement && document.exitFullscreen) {
    await document.exitFullscreen()
    return
  }

  if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  }
}

const enterFullscreen = async () => {
  isFullscreen.value = true

  try {
    await requestNativeFullscreen()
  } catch {
    // Si el navegador bloquea fullscreen nativo, queda el modo visual fixed.
  }

  await refreshFullscreenLayout()
}

const exitFullscreen = async () => {
  try {
    await exitNativeFullscreen()
  } catch {
    // Si el navegador ya salió de fullscreen, solo se sincroniza el estado visual.
  }

  isFullscreen.value = false

  await refreshFullscreenLayout()
}

const toggleFullscreen = async () => {
  if (isFullscreen.value || document.fullscreenElement === panelRef.value) {
    await exitFullscreen()
    return
  }

  await enterFullscreen()
}

const handleFullscreenChange = async () => {
  const panelIsFullscreen =
    document.fullscreenElement === panelRef.value ||
    document.webkitFullscreenElement === panelRef.value

  isFullscreen.value = panelIsFullscreen

  await refreshFullscreenLayout()
}

const handleFullscreenKeydown = async (event) => {
  if (event.key !== "Escape") return
  if (!isFullscreen.value) return

  await exitFullscreen()
}

const currentMapTypeOption = computed(() => {
  return mapTypeOptions.find((option) => option.value === mapType.value) || mapTypeOptions[0]
})

const mapStatsActivos = computed(() => {
  return props.allActivos.length ? props.allActivos : props.activos
})

const geofenceItems = computed(() => {
  return props.canViewGeofences ? props.geofences || [] : []
})

const visibleGeofences = computed(() => {
  if (!props.canViewGeofences) return []

  const allGeofences = props.geofences || []

  if (showGeofences.value) {
    return allGeofences
  }

  if (activeGeofenceId.value) {
    return allGeofences.filter((geofence) => {
      return normalizeId(geofence.id) === normalizeId(activeGeofenceId.value)
    })
  }

  return []
})

const getGeofenceById = (geofenceId) => {
  return geofenceItems.value.find((geofence) => {
    return normalizeId(geofence.id) === normalizeId(geofenceId)
  })
}

const getNextGeofenceName = (type) => {
  const nextNumber = (props.geofences || []).length + 1

  if (type === "route") return `Ruta ${nextNumber}`

  return `Geocerca ${nextNumber}`
}

const resetDraftGeofenceForm = (type) => {
  currentDraftType.value = type

  draftGeofenceForm.value = {
    name: getNextGeofenceName(type),
    color: DEFAULT_GEOFENCE_COLOR,
  }
}

const draftGeofencePreviewName = computed(() => {
  return draftGeofenceForm.value.name.trim() || getNextGeofenceName(currentDraftType.value)
})

const draftGeofenceOptions = computed(() => {
  return {
    name: draftGeofencePreviewName.value,
    color: normalizeGeofenceColor(draftGeofenceForm.value.color),
  }
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

const editingColor = computed(() => {
  return normalizeGeofenceColor(editingDraft.value?.color)
})

const editingPreviewName = computed(() => {
  return editingDraft.value?.name || "Geocerca sin nombre"
})

const canRemoveLastEditPoint = computed(() => {
  if (editingDraft.value?.type === "polygon") {
    return editingDraft.value.coordinates.length > 3
  }

  if (editingDraft.value?.type === "route") {
    return editingDraft.value.coordinates.length > 2
  }

  return false
})

const handleDraftGeofenceField = (field, value) => {
  draftGeofenceForm.value = {
    ...draftGeofenceForm.value,
    [field]: value,
  }
}

const handleEditingGeofenceMeta = (field, value) => {
  if (!editingDraft.value) return
  if (typeof updateEditingGeofenceMeta !== "function") return

  updateEditingGeofenceMeta({
    [field]: value,
  })
}

const handleUpdateEditAddPoint = (value) => {
  editAddPoint.value = value
}

const resetHistoryState = () => {
  showGeofenceHistoryModal.value = false
  selectedHistoryGeofence.value = null
  selectedHistoryEvents.value = []
}

const clearActiveGeofenceSelection = (notifyParent = true) => {
  activeGeofenceId.value = null

  if (notifyParent) {
    emit("clear-geofence-selection")
  }
}

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

const handleToggleGeofenceVisibility = () => {
  const nextValue = !showGeofences.value

  if (!nextValue) {
    if (editingDraft.value?.id) {
      activeGeofenceId.value = editingDraft.value.id
    } else {
      clearActiveGeofenceSelection()
    }
  }

  showGeofences.value = nextValue
}

const handleCreateCircle = () => {
  if (!props.canEditGeofences) return

  showGeofences.value = true
  showGeofenceModal.value = false
  clearActiveGeofenceSelection()
  resetHistoryState()
  resetDraftGeofenceForm("circle")
  startCircleDraw()
}

const handleCreatePolygon = () => {
  if (!props.canEditGeofences) return

  showGeofences.value = true
  showGeofenceModal.value = false
  clearActiveGeofenceSelection()
  resetHistoryState()
  resetDraftGeofenceForm("polygon")
  startPolygonDraw()
}

const handleCreateRoute = () => {
  if (!props.canEditGeofences) return

  showGeofences.value = true
  showGeofenceModal.value = false
  clearActiveGeofenceSelection()
  resetHistoryState()
  resetDraftGeofenceForm("route")
  startRouteDraw()
}

const openEditGeofenceModal = () => {
  if (!props.canEditGeofences) return

  resetHistoryState()
  showGeofenceModal.value = true
}

const openGeofenceHistorySelector = () => {
  if (!props.canViewGeofences) return

  resetHistoryState()
  showGeofenceModal.value = false

  if (!geofenceItems.value.length) {
    selectedHistoryGeofence.value = null
    selectedHistoryEvents.value = []
    showGeofenceHistoryModal.value = true
    return
  }

  showGeofenceModal.value = true
}

const openGeofenceHistory = (geofence) => {
  if (!geofence) return

  selectedHistoryGeofence.value = geofence
  selectedHistoryEvents.value = buildMockGeofenceHistory(geofence, props.allActivos)

  showGeofenceModal.value = false
  showGeofenceHistoryModal.value = true
}

const selectGeofenceToEdit = (geofenceId) => {
  if (!props.canEditGeofences) return

  resetHistoryState()
  activeGeofenceId.value = geofenceId
  showGeofenceModal.value = false
  showGeofences.value = true
  startEditGeofence(geofenceId)
}

const handleExternalGeofenceSelection = (geofenceId) => {
  if (!props.canEditGeofences) return

  if (!geofenceId) {
    clearActiveGeofenceSelection(false)
    return
  }

  const geofence = getGeofenceById(geofenceId)

  if (!geofence) return

  if (
    normalizeId(activeGeofenceId.value) === normalizeId(geofence.id) &&
    normalizeId(editingDraft.value?.id) === normalizeId(geofence.id)
  ) {
    return
  }

  if (drawMode.value) {
    cancelAll()
  }

  resetHistoryState()
  activeGeofenceId.value = geofence.id
  showGeofenceModal.value = false
  showGeofences.value = true

  startEditGeofence(geofence.id)
}

const handleStopEditing = () => {
  clearActiveGeofenceSelection()
  stopEditing()
}

const handleCancel = () => {
  clearActiveGeofenceSelection()
  resetHistoryState()
  cancelAll()
}

const handleDeleteGeofence = (geofenceId) => {
  if (!props.canEditGeofences) return

  if (normalizeId(activeGeofenceId.value) === normalizeId(geofenceId)) {
    clearActiveGeofenceSelection()
  }

  if (normalizeId(selectedHistoryGeofence.value?.id) === normalizeId(geofenceId)) {
    resetHistoryState()
  }

  deleteGeofence(geofenceId)
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

watch(
  () => showGeofenceHistoryModal.value,
  (isOpen) => {
    if (isOpen) return

    selectedHistoryGeofence.value = null
    selectedHistoryEvents.value = []
  },
)

onMounted(() => {
  showGeofenceModal.value = false
  resetHistoryState()

  window.addEventListener("keydown", handleFullscreenKeydown)
  document.addEventListener("fullscreenchange", handleFullscreenChange)
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
})

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleFullscreenKeydown)
  document.removeEventListener("fullscreenchange", handleFullscreenChange)
  document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)

  if (document.fullscreenElement === panelRef.value) {
    document.exitFullscreen()
  }

  if (document.webkitFullscreenElement === panelRef.value && document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  }
})
</script>
