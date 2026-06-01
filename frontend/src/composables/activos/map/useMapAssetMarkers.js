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

  let visibleActivoIds = new Set()
  let clusterRefreshFrame = null

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

  const removeActivoMarker = (id) => {
    const markerId = normalizeId(id)
    const cachedMarker = markerCache.get(markerId)

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
    const sourceIds = visibleActivoIds.size
      ? Array.from(visibleActivoIds)
      : Array.from(latestActivosById.keys())

    return sourceIds
      .map((activoId) => {
        return latestActivosById.get(activoId)
      })
      .filter(Boolean)
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
    markerClusters.renderMarkerClusters(getVisibleActivos())
  }

  const upsertActivoMarker = (activo) => {
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

    if (shouldClusterAssetMarkers(map) && !isActivoSelected(activo)) {
      movementTrails.registerMovementTrailPoint(activo)
      hideCachedMarker(markerId)
      scheduleClusterRefresh()
      return null
    }

    if (!shouldClusterAssetMarkers(map)) {
      markerClusters.clearClusterMarkers()
    }

    return upsertIndividualMarker(activo)
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

  const applyActivoTelemetryBatch = (updates = []) => {
    if (!Array.isArray(updates) || !updates.length) return []

    const appliedUpdates = []

    updates.forEach((update) => {
      const markerId = normalizeId(update?.id)

      if (!markerId) return

      const currentActivo =
        latestActivosById.get(markerId) ||
        (props.activos || []).find((activo) => {
          return normalizeId(activo.id) === markerId
        })

      if (!currentActivo) return

      const nextActivo = mergeTelemetryUpdateIntoActivo(currentActivo, update)

      latestActivosById.set(markerId, nextActivo)
      upsertActivoMarker(nextActivo)

      appliedUpdates.push(nextActivo)
    })

    return appliedUpdates
  }

  const syncActivoMarkers = (activos = [], { fit = false } = {}) => {
    const map = getMap()

    if (!map || !layers.markerLayer) return

    const bounds = []
    const nextMarkerIds = new Set()
    const nextActivos = []

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
      nextActivos.push(activo)
      bounds.push(activoLatLng)

      movementTrails.registerMovementTrailPoint(activo)
    })

    visibleActivoIds = nextMarkerIds

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

      nextActivos.forEach((activo) => {
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
