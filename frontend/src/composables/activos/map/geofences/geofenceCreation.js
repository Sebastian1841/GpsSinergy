import { makeGeofenceId, normalizePoint } from "../../../../utils/geofenceMapUtils.js"
import { getFallbackGeofenceName } from "../../../../utils/geofenceUtils.js"

import { geofenceStyle, getGeofenceMapColor } from "./geofenceMapStyles.js"

const getDraftGeofenceOptions = (props, type) => {
  const options = props.draftGeofenceOptions || {}
  const fallbackName = getFallbackGeofenceName(props.geofences || [], type)
  const color = getGeofenceMapColor(options, geofenceStyle.color)

  return {
    name: String(options.name || fallbackName).trim() || fallbackName,
    groupName: String(options.groupName || "").trim(),
    color,
  }
}

export const createPolygonGeofence = ({ props, points }) => {
  const options = getDraftGeofenceOptions(props, "polygon")

  return {
    id: makeGeofenceId(),
    name: options.name,
    groupName: options.groupName,
    type: "polygon",
    color: options.color,
    coordinates: points.map((point) => normalizePoint(point)),
    createdAt: new Date().toISOString(),
  }
}

export const createRouteGeofence = ({ props, points }) => {
  const options = getDraftGeofenceOptions(props, "route")

  return {
    id: makeGeofenceId(),
    name: options.name,
    groupName: options.groupName,
    type: "route",
    color: options.color,
    toleranceMeters: 100,
    coordinates: points.map((point) => normalizePoint(point)),
    createdAt: new Date().toISOString(),
  }
}

export const createCircleGeofence = ({ props, center, edge }) => {
  const radius = Math.round(center.distanceTo(edge))

  if (radius < 10) return null

  const options = getDraftGeofenceOptions(props, "circle")

  return {
    id: makeGeofenceId(),
    name: options.name,
    groupName: options.groupName,
    type: "circle",
    color: options.color,
    center: normalizePoint(center),
    radius,
    createdAt: new Date().toISOString(),
  }
}
