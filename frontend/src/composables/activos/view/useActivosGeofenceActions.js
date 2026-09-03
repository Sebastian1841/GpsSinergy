import { unref } from "vue"

import { normalizeId } from "../../../utils/idUtils.js"

const getGeofenceAuditName = (geofence = {}) => {
  return geofence?.name || geofence?.nombre || geofence?.id || "Geocerca"
}

export function useActivosGeofenceActions({
  activeSidebarSection,
  canEditGeofences,
  createGeofence,
  createGeofenceGroup,
  deleteGeofence,
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
}) {
  const handleSidebarGeofenceSelected = async (geofence) => {
    const isSameSelectedGeofence =
      normalizeId(selectedGeofenceId.value) === normalizeId(geofence?.id)

    await selectSidebarGeofence(geofence)

    if (!geofence) return

    if (isSameSelectedGeofence) {
      mapPanelRef.value?.focusGeofenceSelection?.(geofence)
    }
  }

  const handleSidebarGeofenceEdit = (geofence) => {
    if (!geofence?.id || !unref(canEditGeofences)) return

    selectedGeofenceId.value = geofence.id
    activeSidebarSection.value = "geocercas"

    mapPanelRef.value?.editGeofenceSelection?.(geofence)
  }

  const handleGeofenceCreated = async (geofence) => {
    if (!unref(canEditGeofences)) return

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
    if (!unref(canEditGeofences)) return

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
    if (!unref(canEditGeofences)) return

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

  const handleGeofenceGroupCreated = (groupName) => {
    if (!unref(canEditGeofences) || typeof createGeofenceGroup !== "function") return null

    const group = createGeofenceGroup(groupName)

    if (!group) return null

    activeSidebarSection.value = "geocercas"

    recordAudit({
      module: "geocercas",
      action: "geofence-group:create",
      entityType: "grupo de geocercas",
      entityName: group.name,
      description: "Se creo un grupo de geocercas.",
      metadata: {
        groupId: group.id,
        groupName: group.name,
      },
    })

    return group
  }

  const handleGeofenceGroupDeleted = async (groupIdOrName) => {
    if (!unref(canEditGeofences) || typeof deleteGeofenceGroup !== "function") return

    const group = geofenceGroups?.value?.find((item) => {
      return normalizeId(item.id) === normalizeId(groupIdOrName) || item.name === groupIdOrName
    })

    const deleted = deleteGeofenceGroup(groupIdOrName)

    if (!deleted) return

    recordAudit({
      module: "geocercas",
      action: "geofence-group:delete",
      entityType: "grupo de geocercas",
      entityName: group?.name || "Grupo de geocercas",
      severity: "warning",
      description: "Se elimino un grupo de geocercas. Las geocercas quedaron sin grupo.",
      metadata: {
        groupId: group?.id || groupIdOrName,
        groupName: group?.name || groupIdOrName,
      },
    })

    await refreshMapLayout(true)
  }

  const handleGeofenceGroupRenamed = async ({ groupIdOrName, name } = {}) => {
    if (!unref(canEditGeofences) || typeof renameGeofenceGroup !== "function") return

    const previousGroup = geofenceGroups?.value?.find((item) => {
      return normalizeId(item.id) === normalizeId(groupIdOrName) || item.name === groupIdOrName
    })

    const renamedGroup = renameGeofenceGroup({
      groupIdOrName,
      name,
    })

    if (!renamedGroup) return

    recordAudit({
      module: "geocercas",
      action: "geofence-group:rename",
      entityType: "grupo de geocercas",
      entityName: renamedGroup.name,
      description: "Se renombro un grupo de geocercas.",
      metadata: {
        groupId: renamedGroup.id,
        previousGroupName: previousGroup?.name || groupIdOrName,
        groupName: renamedGroup.name,
      },
    })

    await refreshMapLayout(true)
  }

  const handleGeofenceExported = ({ count = 0, format = "" } = {}) => {
    recordAudit({
      module: "geocercas",
      action: "geofence:export",
      entityType: "geocerca",
      entityName: "Exportacion de geocercas",
      description: `Se exportaron ${count} geocercas en formato ${String(format).toUpperCase()}.`,
      metadata: {
        count,
        format,
      },
    })
  }

  const handleGeofencesImported = async ({
    fileName = "",
    format = "",
    geofences: payload = [],
    onResult,
  }) => {
    if (!unref(canEditGeofences) || typeof importGeofences !== "function") {
      onResult?.({
        importedCount: 0,
        parsedCount: payload.length,
      })
      return
    }

    const importedGeofences = importGeofences(payload)

    if (!importedGeofences.length) {
      onResult?.({
        importedCount: 0,
        parsedCount: payload.length,
      })
      return
    }

    const firstImportedGeofence = importedGeofences[0]

    selectedGeofenceId.value = firstImportedGeofence.id
    activeSidebarSection.value = "geocercas"

    recordAudit({
      module: "geocercas",
      action: "geofence:import",
      entityType: "geocerca",
      entityName: "Importacion de geocercas",
      description: `Se importaron ${importedGeofences.length} geocercas desde ${fileName || "archivo"}.`,
      metadata: {
        count: importedGeofences.length,
        fileName,
        format,
      },
    })

    try {
      await refreshMapLayout(true)
      mapPanelRef.value?.focusGeofenceSelection?.(firstImportedGeofence)
    } finally {
      onResult?.({
        importedCount: importedGeofences.length,
        parsedCount: payload.length,
      })
    }
  }

  return {
    handleGeofenceCreated,
    handleGeofenceDeleted,
    handleGeofenceExported,
    handleGeofenceGroupCreated,
    handleGeofenceGroupDeleted,
    handleGeofenceGroupRenamed,
    handleGeofencesImported,
    handleGeofenceUpdated,
    handleSidebarGeofenceEdit,
    handleSidebarGeofenceSelected,
  }
}
