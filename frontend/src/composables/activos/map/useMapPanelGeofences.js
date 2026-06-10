import { computed, ref, watch } from "vue"

import { buildMockGeofenceHistory } from "../../../data/mockGeofenceHistoryData.js"
import { DEFAULT_GEOFENCE_COLOR, normalizeGeofenceColor } from "../../../utils/geofenceUtils.js"
import { normalizeId } from "../../../utils/idUtils.js"

export function useMapPanelGeofenceState({ props, emit }) {
  const showGeofenceModal = ref(false)
  const showGeofenceHistoryModal = ref(false)
  const activeGeofenceId = ref(null)
  const selectedHistoryGeofence = ref(null)
  const selectedHistoryEvents = ref([])
  const showGeofences = ref(true)
  const currentDraftType = ref("circle")

  const draftGeofenceForm = ref({
    name: "",
    color: DEFAULT_GEOFENCE_COLOR,
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

  const handleDraftGeofenceField = (field, value) => {
    draftGeofenceForm.value = {
      ...draftGeofenceForm.value,
      [field]: value,
    }
  }

  const prepareCreateGeofence = (type) => {
    if (!props.canEditGeofences) return false

    showGeofences.value = true
    showGeofenceModal.value = false
    clearActiveGeofenceSelection()
    resetHistoryState()
    resetDraftGeofenceForm(type)

    return true
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

  const toggleGeofenceVisibility = (editingDraft) => {
    const nextValue = !showGeofences.value

    if (!nextValue) {
      if (editingDraft?.id) {
        activeGeofenceId.value = editingDraft.id
      } else {
        clearActiveGeofenceSelection()
      }
    }

    showGeofences.value = nextValue
  }

  watch(
    () => showGeofenceHistoryModal.value,
    (isOpen) => {
      if (isOpen) return

      selectedHistoryGeofence.value = null
      selectedHistoryEvents.value = []
    },
  )

  return {
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

    getGeofenceById,
    resetHistoryState,
    clearActiveGeofenceSelection,
    handleDraftGeofenceField,
    prepareCreateGeofence,
    openEditGeofenceModal,
    openGeofenceHistorySelector,
    openGeofenceHistory,
    toggleGeofenceVisibility,
  }
}

export function useMapPanelGeofenceActions({ props, state, mapController }) {
  const editingColor = computed(() => {
    return normalizeGeofenceColor(mapController.editingDraft.value?.color)
  })

  const editingPreviewName = computed(() => {
    return mapController.editingDraft.value?.name || "Geocerca sin nombre"
  })

  const canRemoveLastEditPoint = computed(() => {
    if (mapController.editingDraft.value?.type === "polygon") {
      return mapController.editingDraft.value.coordinates.length > 3
    }

    if (mapController.editingDraft.value?.type === "route") {
      return mapController.editingDraft.value.coordinates.length > 2
    }

    return false
  })

  const handleEditingGeofenceMeta = (field, value) => {
    if (!mapController.editingDraft.value) return
    if (typeof mapController.updateEditingGeofenceMeta !== "function") return

    mapController.updateEditingGeofenceMeta({
      [field]: value,
    })
  }

  const handleUpdateEditAddPoint = (value) => {
    mapController.editAddPoint.value = value
  }

  const handleToggleGeofenceVisibility = () => {
    state.toggleGeofenceVisibility(mapController.editingDraft.value)
  }

  const handleCreateCircle = () => {
    if (!state.prepareCreateGeofence("circle")) return

    mapController.startCircleDraw()
  }

  const handleCreatePolygon = () => {
    if (!state.prepareCreateGeofence("polygon")) return

    mapController.startPolygonDraw()
  }

  const handleCreateRoute = () => {
    if (!state.prepareCreateGeofence("route")) return

    mapController.startRouteDraw()
  }

  const selectGeofenceToEdit = (geofenceId) => {
    if (!props.canEditGeofences) return

    state.resetHistoryState()
    state.activeGeofenceId.value = geofenceId
    state.showGeofenceModal.value = false
    state.showGeofences.value = true
    mapController.startEditGeofence(geofenceId)
  }

  const handleExternalGeofenceSelection = (geofenceId) => {
    if (!props.canEditGeofences) return

    if (!geofenceId) {
      state.clearActiveGeofenceSelection(false)
      return
    }

    const geofence = state.getGeofenceById(geofenceId)

    if (!geofence) return

    if (
      normalizeId(state.activeGeofenceId.value) === normalizeId(geofence.id) &&
      normalizeId(mapController.editingDraft.value?.id) === normalizeId(geofence.id)
    ) {
      return
    }

    if (mapController.drawMode.value) {
      mapController.cancelAll()
    }

    state.resetHistoryState()
    state.activeGeofenceId.value = geofence.id
    state.showGeofenceModal.value = false
    state.showGeofences.value = true

    mapController.startEditGeofence(geofence.id)
  }

  const handleStopEditing = () => {
    state.clearActiveGeofenceSelection()
    mapController.stopEditing()
  }

  const handleCancel = () => {
    state.clearActiveGeofenceSelection()
    state.resetHistoryState()
    mapController.cancelAll()
  }

  const handleDeleteGeofence = (geofenceId) => {
    if (!props.canEditGeofences) return

    if (normalizeId(state.activeGeofenceId.value) === normalizeId(geofenceId)) {
      state.clearActiveGeofenceSelection()
    }

    if (normalizeId(state.selectedHistoryGeofence.value?.id) === normalizeId(geofenceId)) {
      state.resetHistoryState()
    }

    mapController.deleteGeofence(geofenceId)
  }

  return {
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
  }
}
