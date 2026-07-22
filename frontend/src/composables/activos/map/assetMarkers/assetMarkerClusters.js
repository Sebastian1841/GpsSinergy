import { endDevMeasure, startDevMeasure } from "../../../../utils/performanceUtils.js"
import {
  RENDER_MARKER_CLUSTERS_MEASURE,
  shouldClusterAssetMarkers,
} from "./assetMarkerClusterConfig.js"
import { getClusteredActivos } from "./assetMarkerClusterData.js"
import {
  getClusterLatLngs,
  getNearestClusterLatLng,
  resolveClusterClickZoom,
} from "./assetMarkerClusterFocus.js"
import {
  buildClusterInputSignature,
  buildClusterSignature,
} from "./assetMarkerClusterSignatures.js"
import { normalizeActivoId } from "./assetMarkerClusterUtils.js"

export { shouldClusterAssetMarkers } from "./assetMarkerClusterConfig.js"

export const createAssetMarkerClusterController = ({
  L,
  getMap,
  layers,
  createClusterIcon,
  getActivoLatLng,
  isActivoSelected,
  upsertIndividualMarker,
  hideIndividualMarker,
  drawMode,
  editingDraft,
}) => {
  const clusterCache = new Map()

  let cachedClusterInputSignature = ""
  let cachedClusterResult = null
  let expandedClusterActivoIds = new Set()
  let expandedClusterActivosById = new Map()
  let expandedClusterMinZoom = null

  const resetClusterResultCache = () => {
    cachedClusterInputSignature = ""
    cachedClusterResult = null
  }

  const isActivoExpanded = (activo) => {
    return expandedClusterActivoIds.has(normalizeActivoId(activo))
  }

  const clearExpandedCluster = () => {
    if (!expandedClusterActivoIds.size && expandedClusterMinZoom === null) return

    expandedClusterActivoIds = new Set()
    expandedClusterActivosById = new Map()
    expandedClusterMinZoom = null
    resetClusterResultCache()
  }

  const setExpandedCluster = ({ activos = [], minZoom }) => {
    expandedClusterActivoIds = new Set(
      activos.map((activo) => normalizeActivoId(activo)).filter((activoId) => Boolean(activoId)),
    )
    expandedClusterActivosById = new Map(
      activos
        .map((activo) => {
          return [normalizeActivoId(activo), activo]
        })
        .filter(([activoId]) => Boolean(activoId)),
    )
    expandedClusterMinZoom = Number.isFinite(Number(minZoom)) ? Number(minZoom) : null
    resetClusterResultCache()
  }

  const includeExpandedClusterActivos = (activos = []) => {
    if (!expandedClusterActivosById.size) return activos

    const nextActivos = [...activos]
    const nextActivoIds = new Set(
      nextActivos
        .map((activo) => normalizeActivoId(activo))
        .filter((activoId) => Boolean(activoId)),
    )

    expandedClusterActivosById.forEach((activo, activoId) => {
      if (nextActivoIds.has(activoId)) return

      nextActivos.push(activo)
      nextActivoIds.add(activoId)
    })

    return nextActivos
  }

  const maybeClearExpandedCluster = (map) => {
    if (!expandedClusterActivoIds.size || expandedClusterMinZoom === null) return

    const zoom = map?.getZoom?.()

    if (!Number.isFinite(Number(zoom)) || Number(zoom) >= expandedClusterMinZoom) return

    clearExpandedCluster()
  }

  const getCachedClusteredActivos = ({ map, activos = [] }) => {
    const nextSignature = buildClusterInputSignature({
      map,
      activos,
      getActivoLatLng,
      isActivoSelected,
      isActivoExpanded,
    })

    if (cachedClusterResult && cachedClusterInputSignature === nextSignature) {
      return cachedClusterResult
    }

    const nextResult = getClusteredActivos({
      map,
      activos,
      getActivoLatLng,
      isActivoSelected,
    })

    cachedClusterInputSignature = nextSignature
    cachedClusterResult = nextResult

    return nextResult
  }

  const getClusterTooltipLabel = (count) => {
    return `${count} activos`
  }

  const bindClusterTooltip = (marker, count) => {
    marker.unbindTooltip()

    marker.bindTooltip(getClusterTooltipLabel(count), {
      direction: "top",
      offset: [0, -14],
      className: "sinergy-tooltip",
    })
  }

  const focusCluster = (cachedCluster) => {
    if (drawMode.value || editingDraft.value) return

    const map = getMap()

    if (!map) return

    const clusterLatLngs = getClusterLatLngs({
      cluster: cachedCluster?.cluster,
      getActivoLatLng,
    })
    const clusterActivos = cachedCluster?.cluster?.activos || cachedCluster?.activos || []
    const currentZoom = map.getZoom?.() ?? 0
    const targetZoom = resolveClusterClickZoom({
      map,
      activos: cachedCluster?.renderActivos || clusterActivos,
    })

    setExpandedCluster({
      activos: clusterActivos,
      minZoom: Math.max(0, currentZoom - 0.25),
    })

    renderMarkerClusters(cachedCluster?.renderActivos || clusterActivos)

    if (!clusterLatLngs.length) {
      map.invalidateSize({
        pan: false,
      })

      map.flyTo(cachedCluster.marker.getLatLng(), targetZoom, {
        duration: 0.35,
      })
      return
    }

    const bounds = L.latLngBounds(clusterLatLngs)

    if (!bounds.isValid()) {
      map.invalidateSize({
        pan: false,
      })

      map.flyTo(cachedCluster.marker.getLatLng(), targetZoom, {
        duration: 0.35,
      })
      return
    }

    const targetLatLng = getNearestClusterLatLng({
      L,
      targetLatLng: bounds.getCenter(),
      clusterLatLngs,
    })

    map.invalidateSize({
      pan: false,
    })

    if (clusterLatLngs.length > 1 && typeof map.flyToBounds === "function") {
      map.flyToBounds(bounds, {
        padding: [84, 84],
        maxZoom: targetZoom,
        duration: 0.35,
      })
      return
    }

    map.flyTo(targetLatLng, targetZoom, {
      duration: 0.35,
    })
  }

  const createClusterMarker = (cachedCluster) => {
    const marker = L.marker(cachedCluster.cluster.latLng, {
      icon: createClusterIcon({
        L,
        count: cachedCluster.cluster.count,
      }),
    })

    bindClusterTooltip(marker, cachedCluster.cluster.count)

    marker.on("click", (event) => {
      if (event?.originalEvent) {
        L.DomEvent.stopPropagation(event.originalEvent)
      }

      focusCluster(cachedCluster)
    })

    return marker
  }

  const updateClusterMarker = ({ cachedCluster, cluster, signature }) => {
    cachedCluster.marker.setLatLng(cluster.latLng)

    if (cachedCluster.count !== cluster.count) {
      cachedCluster.marker.setIcon(
        createClusterIcon({
          L,
          count: cluster.count,
        }),
      )

      bindClusterTooltip(cachedCluster.marker, cluster.count)
    }

    cachedCluster.signature = signature
    cachedCluster.count = cluster.count
  }

  const clearClusterMarkers = () => {
    clusterCache.forEach((cachedCluster) => {
      layers.markerLayer?.removeLayer(cachedCluster.marker)
    })

    clusterCache.clear()
    resetClusterResultCache()
  }

  const removeStaleClusterMarkers = (nextClusterIds) => {
    const staleClusterIds = []

    clusterCache.forEach((_cachedCluster, clusterId) => {
      if (!nextClusterIds.has(clusterId)) {
        staleClusterIds.push(clusterId)
      }
    })

    staleClusterIds.forEach((clusterId) => {
      const cachedCluster = clusterCache.get(clusterId)

      if (!cachedCluster) return

      layers.markerLayer?.removeLayer(cachedCluster.marker)
      clusterCache.delete(clusterId)
    })
  }

  const renderMarkerClusters = (activos = []) => {
    const measure = startDevMeasure(RENDER_MARKER_CLUSTERS_MEASURE)

    try {
      const map = getMap()

      if (!map || !layers.markerLayer) return

      maybeClearExpandedCluster(map)

      const renderActivos = includeExpandedClusterActivos(activos)

      const shouldRenderClusters =
        shouldClusterAssetMarkers(map, renderActivos) || expandedClusterActivoIds.size > 0

      if (!shouldRenderClusters) {
        clearClusterMarkers()

        renderActivos.forEach((activo) => {
          upsertIndividualMarker(activo, {
            trackTrail: false,
          })
        })

        return
      }

      const { clusters, singletons } = getCachedClusteredActivos({
        map,
        activos: renderActivos,
      })

      const singletonActivoIds = new Set()
      const nextClusterIds = new Set()

      singletons.forEach(({ activo }) => {
        const markerId = normalizeActivoId(activo)

        if (!markerId) return

        singletonActivoIds.add(markerId)

        upsertIndividualMarker(activo, {
          trackTrail: false,
        })
      })

      renderActivos.forEach((activo) => {
        const markerId = normalizeActivoId(activo)

        if (!markerId || singletonActivoIds.has(markerId)) return

        hideIndividualMarker(markerId)
      })

      clusters.forEach((cluster) => {
        const clusterId = cluster.id
        const signature = buildClusterSignature(cluster)
        const cachedCluster = clusterCache.get(clusterId)

        nextClusterIds.add(clusterId)

        if (cachedCluster?.signature === signature) {
          cachedCluster.cluster = cluster
          cachedCluster.activos = cluster.activos
          cachedCluster.renderActivos = renderActivos
          return
        }

        if (cachedCluster) {
          cachedCluster.cluster = cluster
          cachedCluster.activos = cluster.activos
          cachedCluster.renderActivos = renderActivos

          updateClusterMarker({
            cachedCluster,
            cluster,
            signature,
          })

          return
        }

        const nextCachedCluster = {
          marker: null,
          signature,
          count: cluster.count,
          cluster,
          activos: cluster.activos,
          renderActivos,
        }

        const marker = createClusterMarker(nextCachedCluster)

        nextCachedCluster.marker = marker

        marker.addTo(layers.markerLayer)

        clusterCache.set(clusterId, nextCachedCluster)
      })

      removeStaleClusterMarkers(nextClusterIds)
    } finally {
      endDevMeasure(measure)
    }
  }

  return {
    clearClusterMarkers,
    renderMarkerClusters,
  }
}
