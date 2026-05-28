const geofenceStyle = {
  color: "#FF6600",
  weight: 2,
  opacity: 0.95,
  fillColor: "#FF6600",
  fillOpacity: 0.12,
}

const routeStyle = {
  color: "#FF6600",
  weight: 5,
  opacity: 0.95,
}

const draftStyle = {
  color: "#102372",
  weight: 2,
  opacity: 0.95,
  fillColor: "#102372",
  fillOpacity: 0.08,
  dashArray: "6 5",
}

const draftRouteStyle = {
  color: "#102372",
  weight: 4,
  opacity: 0.95,
  dashArray: "6 5",
}

const editStyle = {
  color: "#102372",
  weight: 3,
  opacity: 0.95,
  fillColor: "#FF6600",
  fillOpacity: 0.14,
}

const editRouteStyle = {
  color: "#102372",
  weight: 5,
  opacity: 0.95,
}

const getNumber = (value, fallback) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

const getShapeStyle = (geofence = {}) => {
  const strokeColor = geofence.strokeColor || geofence.color || geofenceStyle.color
  const fillColor = geofence.fillColor || strokeColor || geofenceStyle.fillColor

  return {
    ...geofenceStyle,
    color: strokeColor,
    fillColor,
    fillOpacity: getNumber(geofence.fillOpacity, geofenceStyle.fillOpacity),
  }
}

const getRouteStyle = (geofence = {}) => ({
  ...routeStyle,
  color: geofence.strokeColor || geofence.color || routeStyle.color,
})

const getDraftShapeStyle = (props) => {
  const options = props.draftGeofenceOptions || {}
  const strokeColor = options.strokeColor || draftStyle.color
  const fillColor = options.fillColor || strokeColor || draftStyle.fillColor

  return {
    ...draftStyle,
    color: strokeColor,
    fillColor,
    fillOpacity: getNumber(options.fillOpacity, draftStyle.fillOpacity),
  }
}

const getDraftRouteStyle = (props) => {
  const options = props.draftGeofenceOptions || {}

  return {
    ...draftRouteStyle,
    color: options.strokeColor || options.color || draftRouteStyle.color,
  }
}

const getEditShapeStyle = (geofence = {}) => {
  const strokeColor = geofence.strokeColor || geofence.color || editStyle.color
  const fillColor = geofence.fillColor || strokeColor || editStyle.fillColor

  return {
    ...editStyle,
    color: strokeColor,
    fillColor,
    fillOpacity: getNumber(geofence.fillOpacity, editStyle.fillOpacity),
  }
}

const getEditRouteStyle = (geofence = {}) => ({
  ...editRouteStyle,
  color: geofence.strokeColor || geofence.color || editRouteStyle.color,
})

export {
  geofenceStyle,
  routeStyle,
  draftStyle,
  draftRouteStyle,
  editStyle,
  editRouteStyle,
  getNumber,
  getShapeStyle,
  getRouteStyle,
  getDraftShapeStyle,
  getDraftRouteStyle,
  getEditShapeStyle,
  getEditRouteStyle,
}