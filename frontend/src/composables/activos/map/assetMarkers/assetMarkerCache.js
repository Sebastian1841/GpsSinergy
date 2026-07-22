import {
  createMarkerIcon,
  hasAssetImageMarker,
  syncAssetImageMarkerState,
} from "./assetMarkerIcons.js"

export const createAssetMarkerCacheController = ({
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
}) => {
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
    bindActivoTooltipOpenRefresh(marker, activo, {
      permanent: true,
    })

    return marker
  }

  const createNormalActivoMarker = (activo, activoLatLng) => {
    if (hasAssetImageMarker(activo)) {
      const marker = L.marker(activoLatLng, {
        icon: createMarkerIcon({
          L,
          activo,
          isSelected: false,
        }),
        zIndexOffset: 650,
      })

      bindMarkerClick(marker, activo)
      bindLazyActivoTooltip(marker, activo)

      return marker
    }

    const marker = L.circleMarker(activoLatLng, getNormalMarkerStyle(activo))

    bindMarkerClick(marker, activo)
    bindLazyActivoTooltip(marker, activo)

    return marker
  }

  const createActivoMarker = (activo, activoLatLng) => {
    const markerKind = getMarkerKind(activo)
    const markerRenderMode = getMarkerRenderMode(activo)
    const marker =
      markerKind === "selected"
        ? createSelectedActivoMarker(activo, activoLatLng)
        : createNormalActivoMarker(activo, activoLatLng)

    return {
      marker,
      markerKind,
      markerRenderMode,
    }
  }

  const createMarkerCacheRecord = ({ activo, activoLatLng, isVisible = false }) => {
    const { marker, markerKind, markerRenderMode } = createActivoMarker(activo, activoLatLng)

    return {
      marker,
      markerKind,
      markerRenderMode,
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

    if (cachedMarker.markerRenderMode === "icon" && hasAssetImageMarker(cachedMarker.activo)) {
      syncAssetImageMarkerState(cachedMarker.marker, cachedMarker.activo, {
        isSelected: cachedMarker.markerKind === "selected",
      })
    }
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

  const updateCachedMarker = ({ markerId, cachedMarker, activo, activoLatLng }) => {
    const markerKind = getMarkerKind(activo)
    const markerRenderMode = getMarkerRenderMode(activo)

    if (
      cachedMarker.markerKind !== markerKind ||
      cachedMarker.markerRenderMode !== markerRenderMode
    ) {
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

    if (cachedMarker.markerRenderMode === "icon" && cachedMarker.iconSignature !== iconSignature) {
      cachedMarker.marker.setIcon(
        createMarkerIcon({
          L,
          activo,
          isSelected: cachedMarker.markerKind === "selected",
        }),
      )

      cachedMarker.iconSignature = iconSignature
    }

    if (
      cachedMarker.markerRenderMode === "circle" &&
      cachedMarker.markerKind === "normal" &&
      cachedMarker.styleSignature !== styleSignature
    ) {
      cachedMarker.marker.setStyle(getNormalMarkerStyle(activo))
      cachedMarker.styleSignature = styleSignature
    }

    if (cachedMarker.markerRenderMode === "icon" && hasAssetImageMarker(activo)) {
      syncAssetImageMarkerState(cachedMarker.marker, activo, {
        isSelected: cachedMarker.markerKind === "selected",
      })
    }

    const currentTooltip = cachedMarker.marker.getTooltip?.()
    const tooltipIsOpen = Boolean(currentTooltip?.isOpen?.())
    const shouldRefreshTooltip = cachedMarker.markerKind === "selected" || tooltipIsOpen

    if (
      shouldRefreshTooltip &&
      (cachedMarker.tooltipSignature !== tooltipSignature || tooltipIsOpen)
    ) {
      bindActivoTooltip(cachedMarker.marker, activo, {
        permanent: cachedMarker.markerKind === "selected",
      })
    }

    cachedMarker.tooltipSignature = tooltipSignature
    cachedMarker.activo = activo

    return cachedMarker
  }

  return {
    addCachedMarkerToLayer,
    createMarkerCacheRecord,
    hideCachedMarker,
    updateCachedMarker,
  }
}
