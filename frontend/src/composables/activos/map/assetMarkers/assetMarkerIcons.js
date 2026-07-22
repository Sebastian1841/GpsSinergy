import vehicleBlueBusIconUrl from "../../../../assets/map/vehicle-blue-bus.png"
import vehicleBlueCarIconUrl from "../../../../assets/map/vehicle-blue-car.png"
import vehicleBlueMotorcycleIconUrl from "../../../../assets/map/vehicle-blue-motorcycle.png"
import vehicleBluePickupIconUrl from "../../../../assets/map/vehicle-blue-pickup.png"
import vehicleBlueTrailerIconUrl from "../../../../assets/map/vehicle-blue-trailer.png"
import vehicleBlueTruckIconUrl from "../../../../assets/map/vehicle-blue-truck.png"
import vehicleBlueVanIconUrl from "../../../../assets/map/vehicle-blue-van.png"
import vehicleYellowMachineryIconUrl from "../../../../assets/map/vehicle-yellow-machinery.png"
import { getAssetTypeMapIcon } from "../../../../utils/activos/assetTypeOptions.js"

const ASSET_IMAGE_MARKER_ICONS = {
  "vehicle-3d": vehicleBlueCarIconUrl,
  "vehicle-car": vehicleBlueCarIconUrl,
  "vehicle-pickup": vehicleBluePickupIconUrl,
  "vehicle-truck": vehicleBlueTruckIconUrl,
  "vehicle-bus": vehicleBlueBusIconUrl,
  "vehicle-van": vehicleBlueVanIconUrl,
  "vehicle-motorcycle": vehicleBlueMotorcycleIconUrl,
  "vehicle-machinery": vehicleYellowMachineryIconUrl,
  "vehicle-trailer": vehicleBlueTrailerIconUrl,
}

const MARKER_ICON_CACHE_BY_LEAFLET = new WeakMap()
const CLUSTER_ICON_CACHE_BY_LEAFLET = new WeakMap()

const IMAGE_MARKER_NORMAL_SIZE = [38, 30]
const IMAGE_MARKER_SELECTED_SIZE = [48, 38]
const IMAGE_MARKER_SIZE_BY_KEY = {
  "vehicle-bus": {
    normal: [44, 40],
    selected: [54, 49],
  },
}
const IMAGE_MARKER_PLATE_HEIGHT = 17
const IMAGE_MARKER_SELECTED_PLATE_HEIGHT = 18
const IMAGE_MARKER_PLATE_GAP = 3

export const ASSET_MARKER_STATUS_CLASSES = [
  "marker-moving",
  "marker-idle",
  "marker-stopped",
  "marker-offline",
]

const getLeafletIconCache = (cacheByLeaflet, L) => {
  let cache = cacheByLeaflet.get(L)

  if (!cache) {
    cache = new Map()
    cacheByLeaflet.set(L, cache)
  }

  return cache
}

const getCachedDivIcon = ({ cacheByLeaflet, L, cacheKey, createIcon }) => {
  const cache = getLeafletIconCache(cacheByLeaflet, L)
  const cachedIcon = cache.get(cacheKey)

  if (cachedIcon) return cachedIcon

  const icon = createIcon()

  cache.set(cacheKey, icon)

  return icon
}

const markerClass = (estado) => {
  const classes = {
    moving: "marker-moving",
    idle: "marker-idle",
    stopped: "marker-stopped",
    offline: "marker-offline",
  }

  return classes[estado] || "marker-offline"
}

const escapeIconUrl = (value) => {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
}

const escapeMarkerHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export const getAssetMarkerStatusClass = markerClass

export const getAssetMarkerPlateLabel = (activo) => {
  return String(
    activo?.patente || activo?.patent || activo?.licensePlate || activo?.plate || "",
  ).trim()
}

export const getAssetImageMarkerKey = (activo) => {
  const iconKey =
    activo?.mapIcon ||
    activo?.markerIcon ||
    activo?.iconType ||
    getAssetTypeMapIcon(activo?.assetType || activo?.tipoActivo)

  if (ASSET_IMAGE_MARKER_ICONS[iconKey]) return iconKey

  const fallbackIconKey = getAssetTypeMapIcon(activo?.assetType || activo?.tipoActivo)

  return ASSET_IMAGE_MARKER_ICONS[fallbackIconKey] ? fallbackIconKey : ""
}

export const hasAssetImageMarker = (activo) => {
  return Boolean(getAssetImageMarkerKey(activo))
}

export const getAssetImageMarkerVariant = (activo) => {
  const imageMarkerKey = getAssetImageMarkerKey(activo)
  const imageMarkerUrl = ASSET_IMAGE_MARKER_ICONS[imageMarkerKey]

  if (!imageMarkerUrl) return null

  return {
    key: imageMarkerKey,
    url: imageMarkerUrl,
    signature: `${imageMarkerKey}:rect-div:${imageMarkerUrl}`,
  }
}

export const getAssetImageMarkerSignature = (activo) => {
  return getAssetImageMarkerVariant(activo)?.signature || ""
}

const getAssetImageMarkerSize = ({ imageMarkerKey, isSelected }) => {
  const sizeByState = IMAGE_MARKER_SIZE_BY_KEY[imageMarkerKey]

  if (sizeByState) {
    return isSelected ? sizeByState.selected : sizeByState.normal
  }

  return isSelected ? IMAGE_MARKER_SELECTED_SIZE : IMAGE_MARKER_NORMAL_SIZE
}

const getAssetImageMarkerLayout = ({ imageMarkerKey, isSelected, plateLabel }) => {
  const [imageWidth, imageHeight] = getAssetImageMarkerSize({
    imageMarkerKey,
    isSelected,
  })
  const hasPlateLabel = Boolean(plateLabel)
  const plateHeight = isSelected ? IMAGE_MARKER_SELECTED_PLATE_HEIGHT : IMAGE_MARKER_PLATE_HEIGHT
  const plateWidth = hasPlateLabel
    ? Math.min(96, Math.max(imageWidth + 14, plateLabel.length * 7 + 18, 56))
    : 0
  const width = hasPlateLabel ? Math.max(imageWidth, plateWidth) : imageWidth
  const height = hasPlateLabel ? imageHeight + plateHeight + IMAGE_MARKER_PLATE_GAP : imageHeight

  return {
    width,
    height,
    imageWidth,
    imageHeight,
    anchorX: width / 2,
    anchorY: hasPlateLabel
      ? plateHeight + IMAGE_MARKER_PLATE_GAP + imageHeight / 2
      : imageHeight / 2,
  }
}

export const syncAssetImageMarkerState = (marker, activo, { isSelected = false } = {}) => {
  const markerElement = marker?.getElement?.()
  const vehicleElement = markerElement?.classList?.contains("sinergy-vehicle-marker")
    ? markerElement
    : markerElement?.querySelector?.(".sinergy-vehicle-marker")

  if (!vehicleElement) return

  vehicleElement.classList.remove(...ASSET_MARKER_STATUS_CLASSES, "selected")
  vehicleElement.classList.add(markerClass(activo?.estado))

  if (isSelected) {
    vehicleElement.classList.add("selected")
  }
}

export const createMarkerIcon = ({ L, activo, isSelected }) => {
  const imageMarkerVariant = getAssetImageMarkerVariant(activo)

  if (imageMarkerVariant) {
    const statusClass = markerClass(activo.estado)
    const selectedClass = isSelected ? "selected" : ""
    const plateLabel = getAssetMarkerPlateLabel(activo)
    const escapedPlateLabel = escapeMarkerHtml(plateLabel)
    const { width, height, imageWidth, imageHeight, anchorX, anchorY } = getAssetImageMarkerLayout({
      imageMarkerKey: imageMarkerVariant.key,
      isSelected,
      plateLabel,
    })
    const imageUrl = escapeIconUrl(imageMarkerVariant.url)
    const cacheKey = [
      isSelected ? "image-selected" : "image-normal",
      imageMarkerVariant.signature,
      selectedClass,
      plateLabel,
      width,
      height,
      imageWidth,
      imageHeight,
    ].join(":")

    return getCachedDivIcon({
      cacheByLeaflet: MARKER_ICON_CACHE_BY_LEAFLET,
      L,
      cacheKey,
      createIcon: () => {
        return L.divIcon({
          className: "",
          html: `
            <div
              class="sinergy-vehicle-marker ${statusClass} ${selectedClass}"
              style="--vehicle-image-width:${imageWidth}px;--vehicle-image-height:${imageHeight}px;"
            >
              ${
                plateLabel
                  ? `<span class="sinergy-vehicle-marker__plate" title="${escapedPlateLabel}">${escapedPlateLabel}</span>`
                  : ""
              }
              <span
                class="sinergy-vehicle-marker__image"
                style="background-image:url(&quot;${imageUrl}&quot;);"
              ></span>
            </div>
          `,
          iconSize: [width, height],
          iconAnchor: [anchorX, anchorY],
        })
      },
    })
  }

  const statusClass = markerClass(activo.estado)
  const selectedClass = isSelected ? "selected" : ""
  const size = isSelected ? 30 : 22
  const halfSize = size / 2
  const cacheKey = ["default", statusClass, selectedClass, size].join(":")

  return getCachedDivIcon({
    cacheByLeaflet: MARKER_ICON_CACHE_BY_LEAFLET,
    L,
    cacheKey,
    createIcon: () =>
      L.divIcon({
        className: "",
        html: `
          <div class="sinergy-marker ${statusClass} ${selectedClass}">
            <span></span>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [halfSize, halfSize],
      }),
  })
}

export const createClusterIcon = ({ L, count }) => {
  const size = count >= 100 ? 50 : count >= 10 ? 44 : 38
  const half = size / 2
  const label = count > 999 ? "999+" : count

  return getCachedDivIcon({
    cacheByLeaflet: CLUSTER_ICON_CACHE_BY_LEAFLET,
    L,
    cacheKey: ["cluster", size, label].join(":"),
    createIcon: () =>
      L.divIcon({
        className: "",
        html: `
          <div
            class="sinergy-marker-cluster"
            style="width:${size}px;height:${size}px;"
          >
            <span class="sinergy-marker-cluster__count">${label}</span>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [half, half],
      }),
  })
}
