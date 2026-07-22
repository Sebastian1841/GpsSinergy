import { resolveAssetClusterGridSize } from "./assetMarkerClusterConfig.js"

export const getClusteredActivos = ({ map, activos = [], getActivoLatLng, isActivoSelected }) => {
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
