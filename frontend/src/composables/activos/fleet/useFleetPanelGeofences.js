import { computed } from "vue"

import { getGeofenceBadgeLabel, getGeofenceMeta } from "../../../utils/geofenceUtils.js"

export function useFleetPanelGeofences({
  emitDeleteGeofence,
  emitDeleteGeofences,
  emitEditGeofence,
  emitSelectGeofence,
  geofences,
  isActivosSection,
  isGeocercasSection,
  isReportesSection,
  normalizeText,
  search,
}) {
  const geofenceItems = computed(() => {
    return geofences.value || []
  })

  const filteredGeofenceItems = computed(() => {
    const term = normalizeText(search.value)

    if (!term) return geofenceItems.value

    return geofenceItems.value.filter((geofence) => {
      return (
        normalizeText(geofence.name).includes(term) ||
        normalizeText(geofence.groupName || geofence.group || geofence.grupo).includes(term) ||
        normalizeText(geofence.type).includes(term) ||
        normalizeText(getGeofenceBadgeLabel(geofence)).includes(term) ||
        normalizeText(getGeofenceMeta(geofence)).includes(term)
      )
    })
  })

  const activeSectionGeofences = computed(() => {
    return isActivosSection.value || isGeocercasSection.value || isReportesSection.value
      ? geofenceItems.value
      : []
  })

  const activeFilteredGeofences = computed(() => {
    return isGeocercasSection.value ? filteredGeofenceItems.value : []
  })

  const confirmDeleteGeofence = (geofence) => {
    if (!geofence?.id) return

    const geofenceName = geofence.name || "esta geocerca"
    const confirmed = window.confirm(`Eliminar la geocerca "${geofenceName}"?`)

    if (!confirmed) return

    emitDeleteGeofence(geofence.id)
  }

  const confirmDeleteGeofences = (geofenceItemsToDelete = []) => {
    if (!Array.isArray(geofenceItemsToDelete) || !geofenceItemsToDelete.length) return

    const ids = []
    const seenIds = new Set()

    geofenceItemsToDelete.forEach((geofence) => {
      const geofenceId = String(geofence?.id ?? geofence ?? "")

      if (!geofenceId || seenIds.has(geofenceId)) return

      seenIds.add(geofenceId)
      ids.push(geofenceId)
    })

    if (!ids.length) return

    const confirmed = window.confirm(`Eliminar ${ids.length} geocercas seleccionadas?`)

    if (!confirmed) return

    if (typeof emitDeleteGeofences === "function") {
      emitDeleteGeofences(ids)
      return
    }

    ids.forEach((geofenceId) => {
      emitDeleteGeofence(geofenceId)
    })
  }

  const handleGeofenceSelect = (geofence) => {
    if (!geofence?.id) return

    emitSelectGeofence(geofence)
  }

  const handleGeofenceEdit = (geofence) => {
    if (!geofence?.id) return

    emitEditGeofence(geofence)
  }

  return {
    activeFilteredGeofences,
    activeSectionGeofences,
    geofenceItems,

    confirmDeleteGeofence,
    confirmDeleteGeofences,
    handleGeofenceEdit,
    handleGeofenceSelect,
  }
}
