import { computed } from "vue"

import { normalizeGeofenceColor } from "../../../../utils/geofenceUtils.js"
import { normalizeId } from "../../../../utils/idUtils.js"

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

  const handleExternalGeofenceSelection = (geofenceSelection) => {
    if (!props.canViewGeofences) return

    if (!geofenceSelection) {
      state.clearActiveGeofenceSelection(false)
      return
    }

    const geofence =
      typeof geofenceSelection === "object"
        ? geofenceSelection
        : state.getGeofenceById(geofenceSelection)

    if (!geofence?.id) return

    const isSameActiveGeofence =
      normalizeId(state.activeGeofenceId.value) === normalizeId(geofence.id)

    if (isSameActiveGeofence) {
      state.resetHistoryState()
      state.showGeofenceModal.value = false
      state.showGeofences.value = true
      mapController.focusGeofence?.(geofence)
      return
    }

    if (mapController.drawMode.value) {
      mapController.cancelAll()
    }

    if (
      mapController.editingDraft.value &&
      normalizeId(mapController.editingDraft.value.id) !== normalizeId(geofence.id)
    ) {
      mapController.stopEditing?.()
    }

    state.resetHistoryState()
    state.activeGeofenceId.value = geofence.id
    state.showGeofenceModal.value = false
    state.showGeofences.value = true

    mapController.focusGeofence?.(geofence)
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
