import { normalizeSignatureValue } from "../../../../utils/mapSignatureUtils.js"
import {
  getAssetMarkerPlateLabel,
  getAssetImageMarkerKey,
  getAssetImageMarkerSignature,
  hasAssetImageMarker,
} from "./assetMarkerIcons.js"

const NORMAL_MARKER_RADIUS = 6
const NORMAL_MARKER_SELECTED_RADIUS = 8
const NORMAL_MARKER_STROKE_COLOR = "#ffffff"

const statusMarkerStyles = {
  moving: {
    fillColor: "#10b981",
    color: "#047857",
  },
  idle: {
    fillColor: "#0ea5e9",
    color: "#0369a1",
  },
  stopped: {
    fillColor: "#ef4444",
    color: "#b91c1c",
  },
  offline: {
    fillColor: "#94a3b8",
    color: "#64748b",
  },
}

const defaultMarkerStyle = {
  fillColor: "#FF6600",
  color: "#102372",
}

export function createAssetMarkerAppearanceController({ isActivoSelected }) {
  const getMarkerKind = (activo) => {
    return isActivoSelected(activo) ? "selected" : "normal"
  }

  const getMarkerRenderMode = (activo) => {
    return getMarkerKind(activo) === "selected" || hasAssetImageMarker(activo) ? "icon" : "circle"
  }

  const getNormalMarkerStyle = (activo) => {
    const statusStyle = statusMarkerStyles[activo?.estado] || defaultMarkerStyle
    const selected = isActivoSelected(activo)

    return {
      radius: selected ? NORMAL_MARKER_SELECTED_RADIUS : NORMAL_MARKER_RADIUS,
      color: NORMAL_MARKER_STROKE_COLOR,
      weight: selected ? 3 : 2,
      opacity: 1,
      fillColor: statusStyle.fillColor,
      fillOpacity: selected ? 1 : 0.9,
      interactive: true,
    }
  }

  const buildMarkerPositionSignature = (activoLatLng) => {
    return [activoLatLng?.[0], activoLatLng?.[1]].map(normalizeSignatureValue).join(":")
  }

  const buildMarkerIconSignature = (activo) => {
    const markerRenderMode = getMarkerRenderMode(activo)
    const markerKind = getMarkerKind(activo)
    const isImageMarker = markerRenderMode === "icon" && hasAssetImageMarker(activo)

    return [
      markerKind,
      markerRenderMode,
      getAssetImageMarkerKey(activo),
      getAssetImageMarkerSignature(activo),
      getAssetMarkerPlateLabel(activo),
      activo.id,
      isImageMarker ? "" : activo.estado,
      isActivoSelected(activo),
    ]
      .map(normalizeSignatureValue)
      .join(":")
  }

  const buildMarkerStyleSignature = (activo) => {
    const style = getNormalMarkerStyle(activo)

    return [
      getMarkerKind(activo),
      getMarkerRenderMode(activo),
      activo?.estado,
      style.radius,
      style.color,
      style.weight,
      style.fillColor,
      style.fillOpacity,
    ]
      .map(normalizeSignatureValue)
      .join(":")
  }

  return {
    getMarkerKind,
    getMarkerRenderMode,
    getNormalMarkerStyle,
    buildMarkerPositionSignature,
    buildMarkerIconSignature,
    buildMarkerStyleSignature,
  }
}
