import { computed } from "vue"

import { getGeofenceBadgeLabel, getGeofenceMeta } from "../../../utils/geofenceUtils.js"

export function useFleetPanelGeofences({
  emitDeleteGeofence,
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
    handleGeofenceEdit,
    handleGeofenceSelect,
  }
}
