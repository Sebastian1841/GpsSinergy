import { computed } from "vue"

import { normalizeSignatureValue } from "../../../utils/mapSignatureUtils.js"
import { endDevMeasure, startDevMeasure } from "../../../utils/performanceUtils.js"
import { formatTelemetryTime } from "../../../utils/telemetryUtils.js"
import {
  createAssetMarkerClusterController,
  shouldClusterAssetMarkers,
} from "./assetMarkers/assetMarkerClusters.js"
import { createClusterIcon, createMarkerIcon } from "./assetMarkers/assetMarkerIcons.js"

const NORMAL_MARKER_RADIUS = 6
const NORMAL_MARKER_SELECTED_RADIUS = 8
const NORMAL_MARKER_STROKE_COLOR = "#ffffff"
const SYNC_ACTIVO_MARKERS_MEASURE = "syncActivoMarkers"
const APPLY_ACTIVO_TELEMETRY_BATCH_MEASURE = "applyActivoTelemetryBatch"

const statusMarkerStyles = {
  moving: {
    fillColor: "#10b981",
    color: "#047857",
  },
  idle: {
    fillColor: "#0ea5e9",
    color: "#0369a1",
  },
  stopped: {
    fillColor: "#ef4444",
    color: "#b91c1c",
  },
  offline: {
    fillColor: "#94a3b8",
    color: "#64748b",
  },
}

const defaultMarkerStyle = {
  fillColor: "#FF6600",
  color: "#102372",
}

const isValidNumber = (value) => {
  return Number.isFinite(Number(value))
}

const formatTelemetrySpeed = (value) => {
  if (!isValidNumber(value)) return null

  return `${Number(value).toFixed(1)} km/h`
}

const requestClusterFrame = (callback) => {
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    return window.requestAnimationFrame(callback)
  }

  return setTimeout(callback, 16)
}

const cancelClusterFrame = (frameId) => {
  if (frameId === null || frameId === undefined) return

  if (typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
    window.cancelAnimationFrame(frameId)
    return
  }

  clearTimeout(frameId)
}

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
}) {
  const markerCache = new Map()
  const latestActivosById = new Map()
  const pendingTelemetryUpdatesById = new Map()

  let visibleActivoIds = new Set()
  let clusterRefreshFrame = null
  let pendingTelemetryFrame = null

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

  const getUpdateMarkerId = (update = {}) => {
    return normalizeId(update?.id || update?.activo?.id || update?.assetId)
  }

  const getChangedIdsFromUpdates = (updates = []) => {
    return [
      ...new Set(
        updates
          .map((update) => {
            return getUpdateMarkerId(update)
          })
          .filter(Boolean),
      ),
    ]
  }

  const normalizeTelemetryBatchPayload = (payload = []) => {
    if (Array.isArray(payload)) {
      return {
        updates: payload,
        changedIds: getChangedIdsFromUpdates(payload),
      }
    }

    const updates = Array.isArray(payload?.updates)
      ? payload.updates
      : Array.isArray(payload?.batch)
        ? payload.batch
        : Array.isArray(payload?.appliedUpdates)
          ? payload.appliedUpdates
          : []

    const changedIds = Array.isArray(payload?.changedIds)
      ? [
          ...new Set(
            payload.changedIds
              .map((id) => {
                return normalizeId(id)
              })
              .filter(Boolean),
          ),
        ]
      : getChangedIdsFromUpdates(updates)

    return {
      updates,
      changedIds,
    }
  }

  const isActivoSelected = (activo) => {
    return normalizeId(activo?.id) === normalizeId(props.selectedId)
  }

  const getMarkerKind = (activo) => {
    return isActivoSelected(activo) ? "selected" : "normal"
  }

  const getNormalMarkerStyle = (activo) => {
    const statusStyle = statusMarkerStyles[activo?.estado] || defaultMarkerStyle
    const selected = isActivoSelected(activo)

    return {
      radius: selected ? NORMAL_MARKER_SELECTED_RADIUS : NORMAL_MARKER_RADIUS,
      color: NORMAL_MARKER_STROKE_COLOR,
      weight: selected ? 3 : 2,
      opacity: 1,
      fillColor: statusStyle.fillColor,
      fillOpacity: selected ? 1 : 0.9,
      interactive: true,
    }
  }

  const buildMarkerPositionSignature = (activoLatLng) => {
    return [activoLatLng?.[0], activoLatLng?.[1]].map(normalizeSignatureValue).join(":")
  }

  const buildMarkerIconSignature = (activo) => {
    return [getMarkerKind(activo), activo.id, activo.estado, isActivoSelected(activo)]
      .map(normalizeSignatureValue)
      .join(":")
  }

  const buildMarkerStyleSignature = (activo) => {
    const style = getNormalMarkerStyle(activo)

    return [
      getMarkerKind(activo),
      activo?.estado,
      style.radius,
      style.color,
      style.weight,
      style.fillColor,
      style.fillOpacity,
    ]
      .map(normalizeSignatureValue)
      .join(":")
  }

  const buildMarkerTooltipSignature = (activo) => {
    if (!isActivoSelected(activo)) return ""

    return [activo.id, activo.vehiculo, activo.patente, activo.name, "selected"]
      .map(normalizeSignatureValue)
      .join(":")
  }

  const isActivoInsideViewport = (activoLatLng) => {
    const map = getMap()

    if (!map || !activoLatLng) return true

    const bounds = map.getBounds().pad(0.25)
    const latLng = L.latLng(activoLatLng[0], activoLatLng[1])

    return bounds.contains(latLng)
  }

  const getActivoTooltipLabel = (activo) => {
    return activo.vehiculo || activo.patente || activo.name || "Activo"
  }

  const bindSelectedActivoTooltip = (marker, activo) => {
    marker.unbindTooltip()

    marker.bindTooltip(getActivoTooltipLabel(activo), {
      permanent: true,
      direction: "top",
      offset: [0, -12],
      className: "sinergy-tooltip",
    })
  }

  const bindMarkerClick = (marker, activo) => {
    marker.on("click", () => {
      if (drawMode.value || editingDraft.value) return

      emit("select", activo.id)
    })
  }

  const createSelectedActivoMarker = (activo, activoLatLng) => {
    const marker = L.marker(activoLatLng, {
      icon: createMarkerIcon({
        L,
        activo,
        isSelected: true,
      }),
      zIndexOffset: 1000,
    })

    bindMarkerClick(marker, activo)
    bindSelectedActivoTooltip(marker, activo)

    return marker
  }

  const createNormalActivoMarker = (activo, activoLatLng) => {
    const marker = L.circleMarker(activoLatLng, getNormalMarkerStyle(activo))

    bindMarkerClick(marker, activo)

    return marker
  }

  const createActivoMarker = (activo, activoLatLng) => {
    const markerKind = getMarkerKind(activo)
    const marker =
      markerKind === "selected"
        ? createSelectedActivoMarker(activo, activoLatLng)
        : createNormalActivoMarker(activo, activoLatLng)

    return {
      marker,
      markerKind,
    }
  }

  const createMarkerCacheRecord = ({ activo, activoLatLng, isVisible = false }) => {
    const { marker, markerKind } = createActivoMarker(activo, activoLatLng)

    return {
      marker,
      markerKind,
      activo,
      isVisible,
      positionSignature: buildMarkerPositionSignature(activoLatLng),
      iconSignature: buildMarkerIconSignature(activo),
      styleSignature: buildMarkerStyleSignature(activo),
      tooltipSignature: buildMarkerTooltipSignature(activo),
    }
  }

  const addCachedMarkerToLayer = (cachedMarker) => {
    if (!layers.markerLayer || !cachedMarker || cachedMarker.isVisible) return

    cachedMarker.marker.addTo(layers.markerLayer)
    cachedMarker.isVisible = true
  }

  const hideCachedMarker = (markerId) => {
    const cachedMarker = markerCache.get(markerId)

    if (!cachedMarker || !cachedMarker.isVisible) return

    layers.markerLayer?.removeLayer(cachedMarker.marker)
    cachedMarker.isVisible = false
  }

  const replaceCachedMarker = ({ markerId, cachedMarker, activo, activoLatLng }) => {
    const wasVisible = cachedMarker.isVisible

    layers.markerLayer?.removeLayer(cachedMarker.marker)

    const nextCachedMarker = createMarkerCacheRecord({
      activo,
      activoLatLng,
      isVisible: false,
    })

    markerCache.set(markerId, nextCachedMarker)

    if (wasVisible) {
      addCachedMarkerToLayer(nextCachedMarker)
    }

    return nextCachedMarker
  }

  const cancelClusterRefresh = () => {
    if (clusterRefreshFrame === null || clusterRefreshFrame === undefined) return

    cancelClusterFrame(clusterRefreshFrame)
    clusterRefreshFrame = null
  }

  const cancelTelemetryFlush = () => {
    pendingTelemetryUpdatesById.clear()

    if (pendingTelemetryFrame === null || pendingTelemetryFrame === undefined) return

    cancelClusterFrame(pendingTelemetryFrame)
    pendingTelemetryFrame = null
  }

  const removeActivoMarker = (id) => {
    const markerId = normalizeId(id)
    const cachedMarker = markerCache.get(markerId)

    pendingTelemetryUpdatesById.delete(markerId)
    movementTrails.removeMovementTrail(markerId)
    visibleActivoIds.delete(markerId)

    if (!cachedMarker) {
      latestActivosById.delete(markerId)
      return
    }

    layers.markerLayer?.removeLayer(cachedMarker.marker)
    markerCache.delete(markerId)
    latestActivosById.delete(markerId)
  }

  const updateCachedMarker = ({ markerId, cachedMarker, activo, activoLatLng }) => {
    const markerKind = getMarkerKind(activo)

    if (cachedMarker.markerKind !== markerKind) {
      return replaceCachedMarker({
        markerId,
        cachedMarker,
        activo,
        activoLatLng,
      })
    }

    const positionSignature = buildMarkerPositionSignature(activoLatLng)
    const iconSignature = buildMarkerIconSignature(activo)
    const styleSignature = buildMarkerStyleSignature(activo)
    const tooltipSignature = buildMarkerTooltipSignature(activo)

    if (cachedMarker.positionSignature !== positionSignature) {
      cachedMarker.marker.setLatLng(activoLatLng)
      cachedMarker.positionSignature = positionSignature
    }

    if (cachedMarker.markerKind === "selected" && cachedMarker.iconSignature !== iconSignature) {
      cachedMarker.marker.setIcon(
        createMarkerIcon({
          L,
          activo,
          isSelected: true,
        }),
      )

      cachedMarker.iconSignature = iconSignature
    }

    if (cachedMarker.markerKind === "normal" && cachedMarker.styleSignature !== styleSignature) {
      cachedMarker.marker.setStyle(getNormalMarkerStyle(activo))
      cachedMarker.styleSignature = styleSignature
    }

    if (
      cachedMarker.markerKind === "selected" &&
      cachedMarker.tooltipSignature !== tooltipSignature
    ) {
      bindSelectedActivoTooltip(cachedMarker.marker, activo)
      cachedMarker.tooltipSignature = tooltipSignature
    }

    cachedMarker.activo = activo

    return cachedMarker
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

  const getVisibleActivos = () => {
    return Array.from(latestActivosById.values()).filter((activo) => {
      const activoLatLng = getActivoLatLng(activo)

      if (!activoLatLng) return false
      if (isActivoSelected(activo)) return true

      return isActivoInsideViewport(activoLatLng)
    })
  }

  const hideMarkersOutsideActivos = (activos = []) => {
    const visibleMarkerIds = new Set(
      activos.map((activo) => normalizeId(activo?.id)).filter((markerId) => Boolean(markerId)),
    )

    markerCache.forEach((_cachedMarker, markerId) => {
      if (visibleMarkerIds.has(markerId)) return

      hideCachedMarker(markerId)
    })
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
    visibleActivoIds.clear()
    movementTrails.clearMovementTrails()
  }

  const scheduleClusterRefresh = () => {
    if (clusterRefreshFrame !== null && clusterRefreshFrame !== undefined) return

    clusterRefreshFrame = requestClusterFrame(() => {
      clusterRefreshFrame = null
      markerClusters.renderMarkerClusters(getVisibleActivos())
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

    if (trackTrail) {
      movementTrails.registerMovementTrailPoint(activo)
    }

    const shouldCluster = shouldClusterAssetMarkers(map, getAllLatestActivos())

    if (!isActivoInsideViewport(activoLatLng) && !isActivoSelected(activo)) {
      hideCachedMarker(markerId)

      if (shouldCluster) {
        scheduleClusterRefresh()
      }

      return null
    }

    if (shouldCluster && !isActivoSelected(activo)) {
      hideCachedMarker(markerId)
      scheduleClusterRefresh()
      return null
    }

    if (!shouldCluster) {
      markerClusters.clearClusterMarkers()
    }

    return upsertIndividualMarker(activo, {
      trackTrail: false,
    })
  }

  const mergeTelemetryUpdateIntoActivo = (activo = {}, update = {}) => {
    const sourceUpdate = update?.activo
      ? {
          ...update.activo,
          id: update.activo.id ?? update.id,
        }
      : update

    const timestamp =
      sourceUpdate.timestamp ||
      sourceUpdate.updatedAt ||
      sourceUpdate.updated_at ||
      sourceUpdate.lastReport ||
      sourceUpdate.lastTelemetryAt ||
      activo.timestamp ||
      activo.lastTelemetryAt

    const speedValue = sourceUpdate.velocidad ?? sourceUpdate.velocidad_kmh ?? sourceUpdate.speed
    const speedLabel = formatTelemetrySpeed(speedValue)
    const timeLabel = formatTelemetryTime(timestamp, {
      fallback: null,
    })

    return {
      ...activo,
      ...sourceUpdate,

      id: activo.id ?? sourceUpdate.id,

      lat: sourceUpdate.lat ?? activo.lat,
      lng: sourceUpdate.lng ?? activo.lng,

      estado: sourceUpdate.estado || sourceUpdate.status || activo.estado,

      speed: isValidNumber(speedValue) ? Number(speedValue) : activo.speed,
      velocidad: speedLabel || sourceUpdate.velocidad || activo.velocidad,
      velocidad_kmh: isValidNumber(speedValue) ? Number(speedValue) : activo.velocidad_kmh,

      timestamp: timestamp || activo.timestamp,
      lastTelemetryAt: timestamp || activo.lastTelemetryAt,
      datosUlt: timeLabel || sourceUpdate.datosUlt || activo.datosUlt,
    }
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

    const shouldCluster = shouldClusterAssetMarkers(map, getAllLatestActivos())

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
      movementTrails.registerMovementTrailPoint(nextActivo)

      if (shouldCluster && !isActivoSelected(nextActivo)) {
        hideCachedMarker(markerId)
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

    pendingTelemetryFrame = requestClusterFrame(flushPendingTelemetryUpdates)
  }

  const applyActivoTelemetryBatch = (payload = []) => {
    const measure = startDevMeasure(APPLY_ACTIVO_TELEMETRY_BATCH_MEASURE)

    try {
      const { updates, changedIds } = normalizeTelemetryBatchPayload(payload)

      if (!updates.length && !changedIds.length) return []

      changedIds.forEach((changedId) => {
        const markerId = normalizeId(changedId)

        if (!markerId || pendingTelemetryUpdatesById.has(markerId)) return

        pendingTelemetryUpdatesById.set(markerId, [])
      })

      updates.forEach((update) => {
        const markerId = getUpdateMarkerId(update)

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

  const syncActivoMarkers = (activos = [], { fit = false } = {}) => {
    const measure = startDevMeasure(SYNC_ACTIVO_MARKERS_MEASURE)

    try {
      const map = getMap()

      if (!map || !layers.markerLayer) return

      const bounds = []
      const nextMarkerIds = new Set()
      const nextVisibleActivos = []
      const nextVisibleActivoIds = new Set()

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
        bounds.push(activoLatLng)

        movementTrails.registerMovementTrailPoint(activo)

        if (!isActivoInsideViewport(activoLatLng) && !isActivoSelected(activo)) {
          hideCachedMarker(markerId)
          return
        }

        nextVisibleActivos.push(activo)
        nextVisibleActivoIds.add(markerId)
      })

      visibleActivoIds = nextVisibleActivoIds

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

      if (shouldClusterAssetMarkers(map, activos)) {
        markerClusters.renderMarkerClusters(getVisibleActivos())
      } else {
        markerClusters.clearClusterMarkers()

        nextVisibleActivos.forEach((activo) => {
          upsertIndividualMarker(activo, {
            trackTrail: false,
          })
        })
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

    map.invalidateSize()

    map.flyTo(activoLatLng, 15, {
      duration: 0.45,
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
