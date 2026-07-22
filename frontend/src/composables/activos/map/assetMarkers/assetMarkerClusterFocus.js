import { resolveAssetClusterMaxZoom } from "./assetMarkerClusterConfig.js"
import { isValidClusterLatLng } from "./assetMarkerClusterUtils.js"

export const getClusterLatLngs = ({ cluster, getActivoLatLng }) => {
  return (cluster?.activos || [])
    .map((activo) => {
      return getActivoLatLng(activo)
    })
    .filter(isValidClusterLatLng)
}

export const getNearestClusterLatLng = ({ L, targetLatLng, clusterLatLngs = [] }) => {
  const target = L.latLng(targetLatLng)
  let nearestLatLng = null
  let nearestDistance = Infinity

  clusterLatLngs.forEach((clusterLatLng) => {
    const nextLatLng = L.latLng(clusterLatLng[0], clusterLatLng[1])
    const distance = target.distanceTo(nextLatLng)

    if (distance >= nearestDistance) return

    nearestDistance = distance
    nearestLatLng = nextLatLng
  })

  return nearestLatLng || target
}

export const resolveClusterClickZoom = ({ map, activos = [] }) => {
  const currentZoom = map?.getZoom?.() ?? 0
  const maxClusterZoom = resolveAssetClusterMaxZoom(activos)
  const maxMapZoom = map?.getMaxZoom?.() ?? maxClusterZoom + 1
  const minRevealZoom = activos.length <= 12 ? 17 : activos.length <= 50 ? 16 : maxClusterZoom + 1

  return Math.min(Math.max(currentZoom + 1, maxClusterZoom + 1, minRevealZoom), maxMapZoom)
}
