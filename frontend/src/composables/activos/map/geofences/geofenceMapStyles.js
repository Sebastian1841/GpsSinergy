import {
  DEFAULT_GEOFENCE_COLOR,
  getGeofenceColor,
  normalizeGeofenceColor,
} from "../../../../utils/geofenceUtils.js"

const DEFAULT_DRAFT_COLOR = "#102372"
const DEFAULT_FILL_OPACITY = 0.12
const DEFAULT_DRAFT_FILL_OPACITY = 0.08
const DEFAULT_EDIT_FILL_OPACITY = 0.14

const geofenceStyle = {
  color: DEFAULT_GEOFENCE_COLOR,
  weight: 2,
  opacity: 0.95,
  fillColor: DEFAULT_GEOFENCE_COLOR,
  fillOpacity: DEFAULT_FILL_OPACITY,
}

const routeStyle = {
  color: DEFAULT_GEOFENCE_COLOR,
  weight: 5,
  opacity: 0.95,
}

const draftStyle = {
  color: DEFAULT_DRAFT_COLOR,
  weight: 2,
  opacity: 0.95,
  fillColor: DEFAULT_DRAFT_COLOR,
  fillOpacity: DEFAULT_DRAFT_FILL_OPACITY,
  dashArray: "6 5",
}

const draftRouteStyle = {
  color: DEFAULT_DRAFT_COLOR,
  weight: 4,
  opacity: 0.95,
  dashArray: "6 5",
}

const editStyle = {
  color: DEFAULT_DRAFT_COLOR,
  weight: 3,
  opacity: 0.95,
  fillColor: DEFAULT_GEOFENCE_COLOR,
  fillOpacity: DEFAULT_EDIT_FILL_OPACITY,
}

const editRouteStyle = {
  color: DEFAULT_DRAFT_COLOR,
  weight: 5,
  opacity: 0.95,
}

const normalizeColor = normalizeGeofenceColor

const getGeofenceMapColor = (geofence = {}, fallback = DEFAULT_GEOFENCE_COLOR) => {
  return getGeofenceColor(geofence, fallback)
}

const getShapeStyle = (geofence = {}) => {
  const color = getGeofenceMapColor(geofence, geofenceStyle.color)

  return {
    ...geofenceStyle,
    color,
    fillColor: color,
    fillOpacity: DEFAULT_FILL_OPACITY,
  }
}

const getRouteStyle = (geofence = {}) => {
  const color = getGeofenceMapColor(geofence, routeStyle.color)

  return {
    ...routeStyle,
    color,
  }
}

const getDraftShapeStyle = (props) => {
  const options = props.draftGeofenceOptions || {}
  const color = getGeofenceMapColor(options, draftStyle.color)

  return {
    ...draftStyle,
    color,
    fillColor: color,
    fillOpacity: DEFAULT_DRAFT_FILL_OPACITY,
  }
}

const getDraftRouteStyle = (props) => {
  const options = props.draftGeofenceOptions || {}
  const color = getGeofenceMapColor(options, draftRouteStyle.color)

  return {
    ...draftRouteStyle,
    color,
  }
}

const getEditShapeStyle = (geofence = {}) => {
  const color = getGeofenceMapColor(geofence, editStyle.fillColor)

  return {
    ...editStyle,
    color,
    fillColor: color,
    fillOpacity: DEFAULT_EDIT_FILL_OPACITY,
  }
}

const getEditRouteStyle = (geofence = {}) => {
  const color = getGeofenceMapColor(geofence, editRouteStyle.color)

  return {
    ...editRouteStyle,
    color,
  }
}

export {
  DEFAULT_GEOFENCE_COLOR,
  DEFAULT_DRAFT_COLOR,
  DEFAULT_FILL_OPACITY,
  DEFAULT_DRAFT_FILL_OPACITY,
  DEFAULT_EDIT_FILL_OPACITY,
  geofenceStyle,
  routeStyle,
  draftStyle,
  draftRouteStyle,
  editStyle,
  editRouteStyle,
  normalizeColor,
  getGeofenceMapColor,
  getShapeStyle,
  getRouteStyle,
  getDraftShapeStyle,
  getDraftRouteStyle,
  getEditShapeStyle,
  getEditRouteStyle,
}
