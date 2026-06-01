import L from "leaflet"

import { getDraftRouteStyle, getDraftShapeStyle } from "./geofenceMapStyles.js"

const createVertexIcon = (active = false) => {
  return L.divIcon({
    className: "",
    html: `<div class="${active ? "geofence-vertex active" : "geofence-vertex"}"></div>`,
    iconSize: active ? [18, 18] : [14, 14],
    iconAnchor: active ? [9, 9] : [7, 7],
  })
}

export function createGeofenceDrawingController({ props, layers, state, onFinishPolygon }) {
  const { draftPolygonPoints, draftRoutePoints, draftCircleCenter } = state

  const clearDraftLayers = () => {
    layers.draftLayer?.clearLayers()
  }

  const redrawDraftPolygon = () => {
    if (!layers.draftLayer) return

    layers.draftLayer.clearLayers()

    const currentDraftStyle = getDraftShapeStyle(props)

    if (draftPolygonPoints.value.length >= 2) {
      L.polyline(draftPolygonPoints.value, currentDraftStyle).addTo(layers.draftLayer)
    }

    if (draftPolygonPoints.value.length >= 3) {
      L.polygon(draftPolygonPoints.value, currentDraftStyle).addTo(layers.draftLayer)
    }

    draftPolygonPoints.value.forEach((point, index) => {
      const isFirst = index === 0
      const canClose = isFirst && draftPolygonPoints.value.length >= 3

      const marker = L.marker(point, {
        draggable: true,
        icon: createVertexIcon(canClose),
      })

      marker.on("dragend", (event) => {
        draftPolygonPoints.value[index] = event.target.getLatLng()
        redrawDraftPolygon()
      })

      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event.originalEvent)

        if (canClose) {
          onFinishPolygon()
        }
      })

      marker
        .bindTooltip(canClose ? "Cerrar geocerca" : `Punto ${index + 1}`, {
          direction: "top",
          className: "sinergy-geofence-tooltip",
        })
        .addTo(layers.draftLayer)
    })
  }

  const redrawDraftRoute = () => {
    if (!layers.draftLayer) return

    layers.draftLayer.clearLayers()

    if (draftRoutePoints.value.length >= 2) {
      L.polyline(draftRoutePoints.value, getDraftRouteStyle(props)).addTo(layers.draftLayer)
    }

    draftRoutePoints.value.forEach((point, index) => {
      const marker = L.marker(point, {
        draggable: true,
        icon: createVertexIcon(index === 0),
      })

      marker.on("dragend", (event) => {
        draftRoutePoints.value[index] = event.target.getLatLng()
        redrawDraftRoute()
      })

      marker
        .bindTooltip(index === 0 ? "Inicio de ruta" : `Punto ${index + 1}`, {
          direction: "top",
          className: "sinergy-geofence-tooltip",
        })
        .addTo(layers.draftLayer)
    })
  }

  const redrawDraftCircle = (edge = null) => {
    if (!layers.draftLayer || !draftCircleCenter.value) return

    layers.draftLayer.clearLayers()

    const center = draftCircleCenter.value
    const radius = edge ? center.distanceTo(edge) : 1

    L.circle(center, {
      ...getDraftShapeStyle(props),
      radius,
    }).addTo(layers.draftLayer)

    L.marker(center, {
      draggable: false,
      icon: createVertexIcon(true),
    })
      .bindTooltip("Centro", {
        direction: "top",
        className: "sinergy-geofence-tooltip",
      })
      .addTo(layers.draftLayer)
  }

  return {
    clearDraftLayers,
    redrawDraftPolygon,
    redrawDraftRoute,
    redrawDraftCircle,
    createVertexIcon,
  }
}
