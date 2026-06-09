const ASSET_CLUSTER_DEFAULT_MAX_ZOOM = 12
const ASSET_CLUSTER_DENSE_MAX_ZOOM = 14
const ASSET_CLUSTER_DENSE_MIN_ACTIVOS = 250

const ASSET_CLUSTER_BASE_GRID_SIZE = 76
const ASSET_CLUSTER_MIN_GRID_SIZE = 44

const normalizeClusterValue = (value) => {
  if (value === null || value === undefined) return ""

  return String(value)
}

const normalizeActivoId = (activo) => {
  return String(activo?.id ?? "")
}

const resolveAssetClusterMaxZoom = (activos = []) => {
  return activos.length >= ASSET_CLUSTER_DENSE_MIN_ACTIVOS
    ? ASSET_CLUSTER_DENSE_MAX_ZOOM
    : ASSET_CLUSTER_DEFAULT_MAX_ZOOM
}

const resolveAssetClusterGridSize = ({ zoom, activos = [] }) => {
  if (activos.length >= ASSET_CLUSTER_DENSE_MIN_ACTIVOS) {
    if (zoom >= 14) return ASSET_CLUSTER_MIN_GRID_SIZE
    if (zoom >= 13) return 54
    return ASSET_CLUSTER_BASE_GRID_SIZE
  }

  if (zoom >= 12) return 58

  return ASSET_CLUSTER_BASE_GRID_SIZE
}

export const shouldClusterAssetMarkers = (map, activos = []) => {
  const zoom = map?.getZoom?.() ?? 0
  const maxClusterZoom = resolveAssetClusterMaxZoom(activos)

  return zoom <= maxClusterZoom
}

const buildClusterSignature = (cluster) => {
  return [
    cluster.id,
    cluster.count,
    cluster.latLng?.[0]?.toFixed(5),
    cluster.latLng?.[1]?.toFixed(5),
  ]
    .map(normalizeClusterValue)
    .join(":")
}

const getClusteredActivos = ({ map, activos = [], getActivoLatLng, isActivoSelected }) => {
  if (!map) {
    return {
      clusters: [],
      singletons: [],
    }
  }

  const zoom = map.getZoom()
  const gridSize = resolveAssetClusterGridSize({
    zoom,
    activos,
  })

  const clustersByKey = new Map()
  const singletons = []

  activos.forEach((activo) => {
    const activoLatLng = getActivoLatLng(activo)

    if (!activoLatLng) return

    if (isActivoSelected(activo)) {
      singletons.push({
        activo,
      })
      return
    }

    const point = map.project(activoLatLng, zoom)
    const key = [
      zoom,
      gridSize,
      Math.floor(point.x / gridSize),
      Math.floor(point.y / gridSize),
    ].join(":")

    if (!clustersByKey.has(key)) {
      clustersByKey.set(key, {
        key,
        activos: [],
        latSum: 0,
        lngSum: 0,
      })
    }

    const cluster = clustersByKey.get(key)

    cluster.activos.push(activo)
    cluster.latSum += Number(activoLatLng[0])
    cluster.lngSum += Number(activoLatLng[1])
  })

  const clusters = []

  clustersByKey.forEach((cluster) => {
    if (cluster.activos.length <= 1) {
      singletons.push({
        activo: cluster.activos[0],
      })
      return
    }

    clusters.push({
      id: cluster.key,
      count: cluster.activos.length,
      activos: cluster.activos,
      latLng: [cluster.latSum / cluster.activos.length, cluster.lngSum / cluster.activos.length],
    })
  })

  return {
    clusters,
    singletons,
  }
}

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

  const createClusterMarker = (cluster, activos = []) => {
    const marker = L.marker(cluster.latLng, {
      icon: createClusterIcon({
        L,
        count: cluster.count,
      }),
    })

    bindClusterTooltip(marker, cluster.count)

    marker.on("click", () => {
      if (drawMode.value || editingDraft.value) return

      const map = getMap()

      if (!map) return

      const maxClusterZoom = resolveAssetClusterMaxZoom(activos)
      const targetZoom = Math.min(maxClusterZoom + 1, map.getMaxZoom?.() ?? maxClusterZoom + 1)

      map.flyTo(marker.getLatLng(), targetZoom, {
        duration: 0.35,
      })
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
    const map = getMap()

    if (!map || !layers.markerLayer) return

    if (!shouldClusterAssetMarkers(map, activos)) {
      clearClusterMarkers()

      activos.forEach((activo) => {
        upsertIndividualMarker(activo, {
          trackTrail: false,
        })
      })

      return
    }

    const { clusters, singletons } = getClusteredActivos({
      map,
      activos,
      getActivoLatLng,
      isActivoSelected,
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

    activos.forEach((activo) => {
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
        return
      }

      if (cachedCluster) {
        updateClusterMarker({
          cachedCluster,
          cluster,
          signature,
        })

        return
      }

      const marker = createClusterMarker(cluster, activos)

      marker.addTo(layers.markerLayer)

      clusterCache.set(clusterId, {
        marker,
        signature,
        count: cluster.count,
      })
    })

    removeStaleClusterMarkers(nextClusterIds)
  }

  return {
    clearClusterMarkers,
    renderMarkerClusters,
  }
}
