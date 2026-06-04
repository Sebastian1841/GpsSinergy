import { computed } from "vue"

import { normalizeSignatureValue } from "../../../utils/mapSignatureUtils.js"
import {
  createAssetMarkerClusterController,
  shouldClusterAssetMarkers,
} from "./assetMarkers/assetMarkerClusters.js"
import { createClusterIcon, createMarkerIcon } from "./assetMarkers/assetMarkerIcons.js"

const isValidNumber = (value) => {
  return Number.isFinite(Number(value))
}

const formatTelemetrySpeed = (value) => {
  if (!isValidNumber(value)) return null

  return `${Number(value).toFixed(1)} km/h`
}

const formatTelemetryTime = (timestamp) => {
  if (!timestamp) return null

  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
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

  const isActivoSelected = (activo) => {
    return normalizeId(activo?.id) === normalizeId(props.selectedId)
  }

  const buildMarkerPositionSignature = (activoLatLng) => {
    return [activoLatLng?.[0], activoLatLng?.[1]].map(normalizeSignatureValue).join(":")
  }

  const buildMarkerIconSignature = (activo) => {
    return [activo.id, activo.estado, isActivoSelected(activo)]
      .map(normalizeSignatureValue)
      .join(":")
  }

  const buildMarkerTooltipSignature = (activo) => {
    return [activo.id, activo.vehiculo, activo.patente, activo.name, isActivoSelected(activo)]
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

  const bindActivoTooltip = (marker, activo) => {
    marker.unbindTooltip()

    marker.bindTooltip(getActivoTooltipLabel(activo), {
      permanent: isActivoSelected(activo),
      direction: "top",
      offset: [0, -12],
      className: "sinergy-tooltip",
    })
  }

  const createActivoMarker = (activo, activoLatLng) => {
    const marker = L.marker(activoLatLng, {
      icon: createMarkerIcon({
        L,
        activo,
        isSelected: isActivoSelected(activo),
      }),
    })

    marker.on("click", () => {
      if (drawMode.value || editingDraft.value) return
      emit("select", activo.id)
    })

    bindActivoTooltip(marker, activo)

    return marker
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

  const updateCachedMarker = ({ cachedMarker, activo, activoLatLng }) => {
    const positionSignature = buildMarkerPositionSignature(activoLatLng)
    const iconSignature = buildMarkerIconSignature(activo)
    const tooltipSignature = buildMarkerTooltipSignature(activo)

    if (cachedMarker.positionSignature !== positionSignature) {
      cachedMarker.marker.setLatLng(activoLatLng)
      cachedMarker.positionSignature = positionSignature
    }

    if (cachedMarker.iconSignature !== iconSignature) {
      cachedMarker.marker.setIcon(
        createMarkerIcon({
          L,
          activo,
          isSelected: isActivoSelected(activo),
        }),
      )
      cachedMarker.iconSignature = iconSignature
    }

    if (cachedMarker.tooltipSignature !== tooltipSignature) {
      bindActivoTooltip(cachedMarker.marker, activo)
      cachedMarker.tooltipSignature = tooltipSignature
    }

    cachedMarker.activo = activo
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
      updateCachedMarker({
        cachedMarker,
        activo,
        activoLatLng,
      })

      addCachedMarkerToLayer(cachedMarker)

      return cachedMarker.marker
    }

    const marker = createActivoMarker(activo, activoLatLng)

    marker.addTo(layers.markerLayer)

    markerCache.set(markerId, {
      marker,
      activo,
      isVisible: true,
      positionSignature: buildMarkerPositionSignature(activoLatLng),
      iconSignature: buildMarkerIconSignature(activo),
      tooltipSignature: buildMarkerTooltipSignature(activo),
    })

    return marker
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

    if (!isActivoInsideViewport(activoLatLng) && !isActivoSelected(activo)) {
      hideCachedMarker(markerId)
      scheduleClusterRefresh()
      return null
    }

    if (shouldClusterAssetMarkers(map) && !isActivoSelected(activo)) {
      hideCachedMarker(markerId)
      scheduleClusterRefresh()
      return null
    }

    if (!shouldClusterAssetMarkers(map)) {
      markerClusters.clearClusterMarkers()
    }

    return upsertIndividualMarker(activo, {
      trackTrail: false,
    })
  }

  const mergeTelemetryUpdateIntoActivo = (activo = {}, update = {}) => {
    const timestamp =
      update.timestamp || update.updatedAt || activo.timestamp || activo.lastTelemetryAt
    const speedValue = update.velocidad ?? update.speed
    const speedLabel = formatTelemetrySpeed(speedValue)
    const timeLabel = formatTelemetryTime(timestamp)

    return {
      ...activo,
      ...update,

      id: activo.id ?? update.id,

      lat: update.lat ?? activo.lat,
      lng: update.lng ?? activo.lng,

      estado: update.estado || update.status || activo.estado,

      speed: isValidNumber(speedValue) ? Number(speedValue) : activo.speed,
      velocidad: speedLabel || activo.velocidad,

      timestamp: timestamp || activo.timestamp,
      lastTelemetryAt: timestamp || activo.lastTelemetryAt,
      datosUlt: timeLabel || activo.datosUlt,
    }
  }

  const flushPendingTelemetryUpdates = () => {
    pendingTelemetryFrame = null

    const groupedUpdates = Array.from(pendingTelemetryUpdatesById.entries())

    pendingTelemetryUpdatesById.clear()

    groupedUpdates.forEach(([markerId, updates]) => {
      const currentActivo =
        latestActivosById.get(markerId) ||
        (props.activos || []).find((activo) => {
          return normalizeId(activo.id) === markerId
        })

      if (!currentActivo) return

      let nextActivo = currentActivo

      updates.forEach((update) => {
        nextActivo = mergeTelemetryUpdateIntoActivo(nextActivo, update)

        latestActivosById.set(markerId, nextActivo)
        movementTrails.registerMovementTrailPoint(nextActivo)
      })

      upsertActivoMarker(nextActivo, {
        trackTrail: false,
      })
    })
  }

  const scheduleTelemetryFlush = () => {
    if (pendingTelemetryFrame !== null && pendingTelemetryFrame !== undefined) return

    pendingTelemetryFrame = requestClusterFrame(flushPendingTelemetryUpdates)
  }

  const applyActivoTelemetryBatch = (updates = []) => {
    if (!Array.isArray(updates) || !updates.length) return []

    updates.forEach((update) => {
      const markerId = normalizeId(update?.id)

      if (!markerId) return

      const pendingUpdates = pendingTelemetryUpdatesById.get(markerId) || []

      pendingUpdates.push(update)
      pendingTelemetryUpdatesById.set(markerId, pendingUpdates)
    })

    scheduleTelemetryFlush()

    return updates
  }

  const syncActivoMarkers = (activos = [], { fit = false } = {}) => {
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

    if (shouldClusterAssetMarkers(map)) {
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
