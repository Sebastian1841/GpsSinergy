import { computed } from "vue"

import { endDevMeasure, startDevMeasure } from "../../../utils/performanceUtils.js"
import { createAssetMarkerAppearanceController } from "./assetMarkers/assetMarkerAppearance.js"
import { createAssetMarkerCacheController } from "./assetMarkers/assetMarkerCache.js"
import {
  createAssetMarkerClusterController,
  shouldClusterAssetMarkers,
} from "./assetMarkers/assetMarkerClusters.js"
import { createClusterIcon } from "./assetMarkers/assetMarkerIcons.js"
import {
  getTelemetryUpdateMarkerId,
  mergeTelemetryUpdateIntoActivo,
  normalizeTelemetryBatchPayload,
} from "./assetMarkers/assetMarkerTelemetry.js"
import { createAssetMarkerTooltipController } from "./assetMarkers/assetMarkerTooltips.js"
import {
  cancelAssetMarkerFrame,
  createAssetMarkerVisibilityController,
  requestAssetMarkerFrame,
} from "./assetMarkers/assetMarkerVisibility.js"

const SYNC_ACTIVO_MARKERS_MEASURE = "syncActivoMarkers"
const APPLY_ACTIVO_TELEMETRY_BATCH_MEASURE = "applyActivoTelemetryBatch"

export function createAssetMarkerController({
  L,
  props,
  emit,
  getMap,
  layers,
  getActivoLatLng,
  normalizeId,
  movementTrails,
  drawMode,
  editingDraft,
  getFocusedActivoIds = () => [],
}) {
  const markerCache = new Map()
  const latestActivosById = new Map()
  const pendingTelemetryUpdatesById = new Map()

  let clusterRefreshFrame = null
  let pendingTelemetryFrame = null
  let focusedActivoIdSetCache = new Set()
  let focusedActivoSignatureCache = ""

  const selectedActivo = computed(() => {
    const selectedId = normalizeId(props.selectedId)

    if (selectedId) {
      const latestActivo = latestActivosById.get(selectedId)

      if (latestActivo) return latestActivo
    }

    return (
      (props.activos || []).find((activo) => {
        return normalizeId(activo.id) === selectedId
      }) || null
    )
  })

  const getAllLatestActivos = () => {
    return Array.from(latestActivosById.values())
  }

  const isActivoSelected = (activo) => {
    return normalizeId(activo?.id) === normalizeId(props.selectedId)
  }

  const getFocusedActivoIdSet = () => {
    const focusedIds = getFocusedActivoIds?.() || []
    const nextSignature = focusedIds
      .map((activoId) => normalizeId(activoId))
      .filter((activoId) => Boolean(activoId))
      .sort()
      .join("|")

    if (nextSignature !== focusedActivoSignatureCache) {
      focusedActivoSignatureCache = nextSignature
      focusedActivoIdSetCache = new Set(nextSignature ? nextSignature.split("|") : [])
    }

    return focusedActivoIdSetCache
  }

  const isActivoAllowedByFocus = (activo) => {
    const focusedActivoIds = getFocusedActivoIdSet()

    if (!focusedActivoIds.size) return true

    return focusedActivoIds.has(normalizeId(activo?.id))
  }

  const getRenderableLatestActivos = () => {
    const focusedActivoIds = getFocusedActivoIdSet()
    const latestActivos = getAllLatestActivos()

    if (!focusedActivoIds.size) return latestActivos

    return latestActivos.filter((activo) => {
      return focusedActivoIds.has(normalizeId(activo?.id))
    })
  }

  const centerMapOnLatLng = (activoLatLng, { minZoom = 15, duration = 0.32 } = {}) => {
    const map = getMap()

    if (!map || !activoLatLng) return

    const currentZoom = map.getZoom()
    const targetZoom = Math.max(currentZoom, minZoom)

    if (targetZoom > currentZoom && typeof map.flyTo === "function") {
      map.flyTo(activoLatLng, targetZoom, {
        duration,
      })
      return
    }

    map.panTo(activoLatLng, {
      animate: true,
      duration,
    })
  }

  const {
    getMarkerKind,
    getMarkerRenderMode,
    getNormalMarkerStyle,
    buildMarkerPositionSignature,
    buildMarkerIconSignature,
    buildMarkerStyleSignature,
  } = createAssetMarkerAppearanceController({
    isActivoSelected,
  })

  const {
    buildMarkerTooltipSignature,
    bindActivoTooltip,
    bindActivoTooltipOpenRefresh,
    bindLazyActivoTooltip,
    bindSelectedActivoTooltip,
  } = createAssetMarkerTooltipController({
    normalizeId,
    latestActivosById,
    getMarkerKind,
    getGeofences: () => props.geofences || [],
    getUseGeofenceLocationAddress: () => props.useGeofenceLocationAddress !== false,
  })

  const { addCachedMarkerToLayer, createMarkerCacheRecord, hideCachedMarker, updateCachedMarker } =
    createAssetMarkerCacheController({
      L,
      layers,
      emit,
      markerCache,
      drawMode,
      editingDraft,
      getMarkerKind,
      getMarkerRenderMode,
      getNormalMarkerStyle,
      buildMarkerPositionSignature,
      buildMarkerIconSignature,
      buildMarkerStyleSignature,
      buildMarkerTooltipSignature,
      bindActivoTooltip,
      bindActivoTooltipOpenRefresh,
      bindLazyActivoTooltip,
      bindSelectedActivoTooltip,
    })

  const { isActivoInsideViewport, getVisibleActivos, hideMarkersOutsideActivos } =
    createAssetMarkerVisibilityController({
      L,
      getMap,
      getActivoLatLng,
      normalizeId,
      latestActivosById,
      markerCache,
      isActivoSelected,
      isActivoAllowedByFocus,
      hideCachedMarker,
    })

  const cancelClusterRefresh = () => {
    if (clusterRefreshFrame === null || clusterRefreshFrame === undefined) return

    cancelAssetMarkerFrame(clusterRefreshFrame)
    clusterRefreshFrame = null
  }

  const cancelTelemetryFlush = () => {
    pendingTelemetryUpdatesById.clear()

    if (pendingTelemetryFrame === null || pendingTelemetryFrame === undefined) return

    cancelAssetMarkerFrame(pendingTelemetryFrame)
    pendingTelemetryFrame = null
  }

  const removeActivoMarker = (id) => {
    const markerId = normalizeId(id)
    const cachedMarker = markerCache.get(markerId)

    pendingTelemetryUpdatesById.delete(markerId)
    movementTrails.removeMovementTrail(markerId)
    if (!cachedMarker) {
      latestActivosById.delete(markerId)
      return
    }

    layers.markerLayer?.removeLayer(cachedMarker.marker)
    markerCache.delete(markerId)
    latestActivosById.delete(markerId)
  }

  const upsertIndividualMarker = (activo, { trackTrail = true } = {}) => {
    const map = getMap()

    if (!map || !layers.markerLayer || !activo) return null

    const markerId = normalizeId(activo.id)

    if (!markerId) return null

    const activoLatLng = getActivoLatLng(activo)

    latestActivosById.set(markerId, activo)

    if (!activoLatLng) {
      removeActivoMarker(markerId)
      return null
    }

    if (!isActivoAllowedByFocus(activo)) {
      hideCachedMarker(markerId)
      return null
    }

    if (trackTrail) {
      movementTrails.registerMovementTrailPoint(activo)
    }

    if (!isActivoInsideViewport(activoLatLng) && !isActivoSelected(activo)) {
      hideCachedMarker(markerId)
      return null
    }

    const cachedMarker = markerCache.get(markerId)

    if (cachedMarker) {
      const nextCachedMarker = updateCachedMarker({
        markerId,
        cachedMarker,
        activo,
        activoLatLng,
      })

      addCachedMarkerToLayer(nextCachedMarker)

      return nextCachedMarker.marker
    }

    const nextCachedMarker = createMarkerCacheRecord({
      activo,
      activoLatLng,
      isVisible: false,
    })

    markerCache.set(markerId, nextCachedMarker)
    addCachedMarkerToLayer(nextCachedMarker)

    return nextCachedMarker.marker
  }

  const markerClusters = createAssetMarkerClusterController({
    L,
    getMap,
    layers,
    createClusterIcon,
    getActivoLatLng,
    isActivoSelected,
    upsertIndividualMarker,
    hideIndividualMarker: hideCachedMarker,
    drawMode,
    editingDraft,
  })

  const clearMarkerCache = () => {
    cancelClusterRefresh()
    cancelTelemetryFlush()
    markerClusters.clearClusterMarkers()

    markerCache.forEach((cachedMarker) => {
      layers.markerLayer?.removeLayer(cachedMarker.marker)
    })

    markerCache.clear()
    latestActivosById.clear()
    movementTrails.clearMovementTrails()
  }

  const scheduleClusterRefresh = () => {
    if (clusterRefreshFrame !== null && clusterRefreshFrame !== undefined) return

    clusterRefreshFrame = requestAssetMarkerFrame(() => {
      clusterRefreshFrame = null
      const visibleActivos = getVisibleActivos()

      hideMarkersOutsideActivos(visibleActivos)
      markerClusters.renderMarkerClusters(visibleActivos)
    })
  }

  const refreshActivoMarkers = () => {
    const map = getMap()

    if (!map || !layers.markerLayer) return

    const visibleActivos = getVisibleActivos()

    hideMarkersOutsideActivos(visibleActivos)
    markerClusters.renderMarkerClusters(visibleActivos)
  }

  const upsertActivoMarker = (activo, { trackTrail = true } = {}) => {
    const map = getMap()

    if (!map || !layers.markerLayer || !activo) return null

    const markerId = normalizeId(activo.id)

    if (!markerId) return null

    const activoLatLng = getActivoLatLng(activo)

    latestActivosById.set(markerId, activo)

    if (!activoLatLng) {
      removeActivoMarker(markerId)
      return null
    }

    const shouldCluster = shouldClusterAssetMarkers(map, getRenderableLatestActivos())

    if (!isActivoAllowedByFocus(activo)) {
      hideCachedMarker(markerId)

      if (shouldCluster) {
        scheduleClusterRefresh()
      }

      return null
    }

    if (trackTrail) {
      movementTrails.registerMovementTrailPoint(activo)
    }

    if (!isActivoInsideViewport(activoLatLng) && !isActivoSelected(activo)) {
      hideCachedMarker(markerId)

      if (shouldCluster) {
        scheduleClusterRefresh()
      }

      return null
    }

    if (shouldCluster && !isActivoSelected(activo)) {
      scheduleClusterRefresh()
      return markerCache.get(markerId)?.marker || null
    }

    if (!shouldCluster) {
      markerClusters.clearClusterMarkers()
    }

    return upsertIndividualMarker(activo, {
      trackTrail: false,
    })
  }

  const getActivoFallbackById = (markerId) => {
    return (
      latestActivosById.get(markerId) ||
      (props.activos || []).find((activo) => {
        return normalizeId(activo.id) === markerId
      }) ||
      null
    )
  }

  const flushPendingTelemetryUpdates = () => {
    pendingTelemetryFrame = null

    const groupedUpdates = Array.from(pendingTelemetryUpdatesById.entries())

    pendingTelemetryUpdatesById.clear()

    if (!groupedUpdates.length) return

    const map = getMap()

    if (!map || !layers.markerLayer) return

    const shouldCluster = shouldClusterAssetMarkers(map, getRenderableLatestActivos())

    if (!shouldCluster) {
      markerClusters.clearClusterMarkers()
    }

    let shouldRefreshClusters = false

    groupedUpdates.forEach(([markerId, updates]) => {
      const currentActivo = getActivoFallbackById(markerId)

      if (!currentActivo) return

      let nextActivo = currentActivo

      updates.forEach((update) => {
        nextActivo = mergeTelemetryUpdateIntoActivo(nextActivo, update)
      })

      latestActivosById.set(markerId, nextActivo)

      if (!isActivoAllowedByFocus(nextActivo)) {
        hideCachedMarker(markerId)
        shouldRefreshClusters = true
        return
      }

      movementTrails.registerMovementTrailPoint(nextActivo)

      if (shouldCluster && !isActivoSelected(nextActivo)) {
        const nextActivoLatLng = getActivoLatLng(nextActivo)

        if (!nextActivoLatLng) {
          removeActivoMarker(markerId)
          return
        }

        if (!isActivoInsideViewport(nextActivoLatLng)) {
          hideCachedMarker(markerId)
        }

        shouldRefreshClusters = true
        return
      }

      upsertIndividualMarker(nextActivo, {
        trackTrail: false,
      })
    })

    if (shouldRefreshClusters) {
      scheduleClusterRefresh()
    }
  }

  const scheduleTelemetryFlush = () => {
    if (pendingTelemetryFrame !== null && pendingTelemetryFrame !== undefined) return

    pendingTelemetryFrame = requestAssetMarkerFrame(flushPendingTelemetryUpdates)
  }

  const applyActivoTelemetryBatch = (payload = []) => {
    const measure = startDevMeasure(APPLY_ACTIVO_TELEMETRY_BATCH_MEASURE)

    try {
      const { updates, changedIds } = normalizeTelemetryBatchPayload(payload, normalizeId)

      if (!updates.length && !changedIds.length) return []

      changedIds.forEach((changedId) => {
        const markerId = normalizeId(changedId)

        if (!markerId || pendingTelemetryUpdatesById.has(markerId)) return

        pendingTelemetryUpdatesById.set(markerId, [])
      })

      updates.forEach((update) => {
        const markerId = getTelemetryUpdateMarkerId(update, normalizeId)

        if (!markerId) return

        const pendingUpdates = pendingTelemetryUpdatesById.get(markerId) || []

        pendingUpdates.push(update)
        pendingTelemetryUpdatesById.set(markerId, pendingUpdates)
      })

      scheduleTelemetryFlush()

      return updates
    } finally {
      endDevMeasure(measure)
    }
  }

  const syncActivoMarkers = (activos = [], { fit = false, trackTrail = true } = {}) => {
    const measure = startDevMeasure(SYNC_ACTIVO_MARKERS_MEASURE)

    try {
      const map = getMap()

      if (!map || !layers.markerLayer) return

      const bounds = []
      const nextMarkerIds = new Set()
      const nextVisibleActivos = []

      ;(activos || []).forEach((activo) => {
        const markerId = normalizeId(activo?.id)

        if (!markerId) return

        const activoLatLng = getActivoLatLng(activo)

        if (!activoLatLng) {
          removeActivoMarker(markerId)
          return
        }

        latestActivosById.set(markerId, activo)
        nextMarkerIds.add(markerId)

        if (!isActivoAllowedByFocus(activo)) {
          hideCachedMarker(markerId)
          return
        }

        bounds.push(activoLatLng)

        if (trackTrail) {
          movementTrails.registerMovementTrailPoint(activo)
        }

        if (!isActivoInsideViewport(activoLatLng) && !isActivoSelected(activo)) {
          hideCachedMarker(markerId)
          return
        }

        nextVisibleActivos.push(activo)
      })

      const staleMarkerIds = []

      markerCache.forEach((_cachedMarker, markerId) => {
        if (!nextMarkerIds.has(markerId)) {
          staleMarkerIds.push(markerId)
        }
      })

      staleMarkerIds.forEach((markerId) => {
        removeActivoMarker(markerId)
      })

      const staleActivoIds = []

      latestActivosById.forEach((_activo, activoId) => {
        if (!nextMarkerIds.has(activoId)) {
          staleActivoIds.push(activoId)
        }
      })

      staleActivoIds.forEach((activoId) => {
        latestActivosById.delete(activoId)
        movementTrails.removeMovementTrail(activoId)
      })

      if (shouldClusterAssetMarkers(map, nextVisibleActivos)) {
        markerClusters.renderMarkerClusters(getVisibleActivos())
      } else {
        markerClusters.renderMarkerClusters(nextVisibleActivos)
      }

      if (fit && bounds.length && !props.selectedId && !props.itineraryRoute) {
        map.fitBounds(bounds, {
          padding: [30, 30],
          maxZoom: 14,
        })
      }
    } finally {
      endDevMeasure(measure)
    }
  }

  const centerSelected = () => {
    const map = getMap()

    if (!map || !selectedActivo.value) return

    const activoLatLng = getActivoLatLng(selectedActivo.value)

    if (!activoLatLng) return

    map.invalidateSize({
      pan: false,
    })

    centerMapOnLatLng(activoLatLng, {
      minZoom: 15,
      duration: 0.32,
    })
  }

  return {
    selectedActivo,
    syncActivoMarkers,
    applyActivoTelemetryBatch,
    upsertActivoMarker,
    removeActivoMarker,
    clearMarkerCache,
    refreshActivoMarkers,
    centerSelected,
  }
}
