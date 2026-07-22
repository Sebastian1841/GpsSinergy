export const ASSET_CLUSTER_DEFAULT_MAX_ZOOM = 12
export const ASSET_CLUSTER_DENSE_MAX_ZOOM = 14
export const ASSET_CLUSTER_DENSE_MIN_ACTIVOS = 250

export const ASSET_CLUSTER_BASE_GRID_SIZE = 76
export const ASSET_CLUSTER_MIN_GRID_SIZE = 44
export const ASSET_CLUSTER_VIEWPORT_PRECISION = 3

export const RENDER_MARKER_CLUSTERS_MEASURE = "renderMarkerClusters"

export const resolveAssetClusterMaxZoom = (activos = []) => {
  return activos.length >= ASSET_CLUSTER_DENSE_MIN_ACTIVOS
    ? ASSET_CLUSTER_DENSE_MAX_ZOOM
    : ASSET_CLUSTER_DEFAULT_MAX_ZOOM
}

export const resolveAssetClusterGridSize = ({ zoom, activos = [] }) => {
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
