import {
  ASSET_CLUSTER_VIEWPORT_PRECISION,
  resolveAssetClusterGridSize,
} from "./assetMarkerClusterConfig.js"
import { normalizeActivoId, normalizeClusterValue } from "./assetMarkerClusterUtils.js"

const roundMapValue = (value, precision = ASSET_CLUSTER_VIEWPORT_PRECISION) => {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return ""

  return numberValue.toFixed(precision)
}

const buildViewportSignature = (map) => {
  const bounds = map?.getBounds?.()

  if (!bounds) return "no-bounds"

  const north = bounds.getNorth?.()
  const south = bounds.getSouth?.()
  const east = bounds.getEast?.()
  const west = bounds.getWest?.()

  return [north, south, east, west].map((value) => roundMapValue(value)).join(":")
}

export const buildClusterSignature = (cluster) => {
  return [
    cluster.id,
    cluster.count,
    cluster.latLng?.[0]?.toFixed(5),
    cluster.latLng?.[1]?.toFixed(5),
  ]
    .map(normalizeClusterValue)
    .join(":")
}

export const buildClusterInputSignature = ({
  map,
  activos = [],
  getActivoLatLng,
  isActivoSelected,
  isActivoExpanded,
}) => {
  if (!map) return ""

  const zoom = map.getZoom()
  const gridSize = resolveAssetClusterGridSize({
    zoom,
    activos,
  })

  const viewportSignature = buildViewportSignature(map)

  const assetCellSignature = activos
    .map((activo) => {
      const activoId = normalizeActivoId(activo)
      const activoLatLng = getActivoLatLng(activo)

      if (!activoId || !activoLatLng) return ""

      if (isActivoSelected(activo)) {
        return `${activoId}:selected`
      }

      if (isActivoExpanded(activo)) {
        return `${activoId}:expanded`
      }

      const point = map.project(activoLatLng, zoom)
      const cellX = Math.floor(point.x / gridSize)
      const cellY = Math.floor(point.y / gridSize)

      return `${activoId}:${cellX}:${cellY}`
    })
    .filter(Boolean)
    .join("|")

  return [zoom, gridSize, activos.length, viewportSignature, assetCellSignature].join("::")
}
