export const requestAssetMarkerFrame = (callback) => {
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    return window.requestAnimationFrame(callback)
  }

  return setTimeout(callback, 16)
}

export const cancelAssetMarkerFrame = (frameId) => {
  if (frameId === null || frameId === undefined) return

  if (typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
    window.cancelAnimationFrame(frameId)
    return
  }

  clearTimeout(frameId)
}

export const createAssetMarkerVisibilityController = ({
  L,
  getMap,
  getActivoLatLng,
  normalizeId,
  latestActivosById,
  markerCache,
  isActivoSelected,
  isActivoAllowedByFocus = () => true,
  hideCachedMarker,
}) => {
  const isActivoInsideViewport = (activoLatLng) => {
    const map = getMap()

    if (!map || !activoLatLng) return true

    const bounds = map.getBounds().pad(0.25)
    const latLng = L.latLng(activoLatLng[0], activoLatLng[1])

    return bounds.contains(latLng)
  }

  const getVisibleActivos = () => {
    return Array.from(latestActivosById.values()).filter((activo) => {
      const activoLatLng = getActivoLatLng(activo)

      if (!activoLatLng) return false
      if (!isActivoAllowedByFocus(activo)) return false
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

  return {
    isActivoInsideViewport,
    getVisibleActivos,
    hideMarkersOutsideActivos,
  }
}
