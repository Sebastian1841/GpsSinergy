import L from "leaflet"

import {
  cloneGeofence,
  getCircleEdgePoint,
  normalizePoint,
} from "../../../../utils/geofenceMapUtils.js"

import {
  geofenceStyle,
  getEditRouteStyle,
  getEditShapeStyle,
  getNumber,
} from "./geofenceMapStyles.js"

const getCircleEdgeLatLng = (center, radiusMeters) => {
  const edgePoint = getCircleEdgePoint(center, radiusMeters)

  return L.latLng(edgePoint.lat, edgePoint.lng)
}

const getFallbackGeofenceName = (props, type) => {
  const nextNumber = (props.geofences || []).length + 1

  if (type === "route") return `Ruta ${nextNumber}`

  return `Geocerca ${nextNumber}`
}

export function createGeofenceEditingController({
  props,
  emit,
  layers,
  editingDraft,
  editAddPoint,
  createVertexIcon,
}) {
  const clearEditLayers = () => {
    layers.editLayer?.clearLayers()
  }

  const emitUpdatedGeofence = () => {
    if (!editingDraft.value) return

    emit("geofence-updated", cloneGeofence(editingDraft.value))
  }

  const redrawEditCircle = () => {
    const center = L.latLng(editingDraft.value.center.lat, editingDraft.value.center.lng)
    const radius = Number(editingDraft.value.radius) || 10
    const edgeLatLng = getCircleEdgeLatLng(center, radius)

    const circle = L.circle(center, {
      ...getEditShapeStyle(editingDraft.value),
      radius,
    }).addTo(layers.editLayer)

    const centerMarker = L.marker(center, {
      draggable: true,
      icon: createVertexIcon(true),
    }).bindTooltip("Mover centro", {
      direction: "top",
      className: "sinergy-geofence-tooltip",
    })

    const radiusMarker = L.marker(edgeLatLng, {
      draggable: true,
      icon: createVertexIcon(),
    }).bindTooltip("Cambiar radio", {
      direction: "top",
      className: "sinergy-geofence-tooltip",
    })

    centerMarker.on("drag", (event) => {
      const nextCenter = event.target.getLatLng()
      const currentRadius = Number(editingDraft.value.radius) || 10

      editingDraft.value.center = normalizePoint(nextCenter)

      circle.setLatLng(nextCenter)
      radiusMarker.setLatLng(getCircleEdgeLatLng(nextCenter, currentRadius))
    })

    centerMarker.on("dragend", () => {
      emitUpdatedGeofence()
    })

    radiusMarker.on("drag", (event) => {
      const nextEdge = event.target.getLatLng()
      const currentCenter = L.latLng(editingDraft.value.center.lat, editingDraft.value.center.lng)

      const nextRadius = Math.max(10, Math.round(currentCenter.distanceTo(nextEdge)))

      editingDraft.value.radius = nextRadius
      circle.setRadius(nextRadius)
    })

    radiusMarker.on("dragend", () => {
      emitUpdatedGeofence()
    })

    centerMarker.addTo(layers.editLayer)
    radiusMarker.addTo(layers.editLayer)
    circle.bringToBack?.()
  }

  const redrawEditPolygon = () => {
    const points = editingDraft.value.coordinates.map((point) => [point.lat, point.lng])
    const polygon = L.polygon(points, getEditShapeStyle(editingDraft.value)).addTo(layers.editLayer)

    editingDraft.value.coordinates.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        draggable: true,
        icon: createVertexIcon(index === 0),
      })

      marker.on("drag", (event) => {
        const next = event.target.getLatLng()

        editingDraft.value.coordinates[index] = normalizePoint(next)

        polygon.setLatLngs(editingDraft.value.coordinates.map((item) => [item.lat, item.lng]))
      })

      marker.on("dragend", () => {
        emitUpdatedGeofence()
      })

      marker
        .bindTooltip(`Mover punto ${index + 1}`, {
          direction: "top",
          className: "sinergy-geofence-tooltip",
        })
        .addTo(layers.editLayer)
    })
  }

  const redrawEditRoute = () => {
    const points = editingDraft.value.coordinates.map((point) => [point.lat, point.lng])
    const route = L.polyline(points, getEditRouteStyle(editingDraft.value)).addTo(layers.editLayer)

    editingDraft.value.coordinates.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        draggable: true,
        icon: createVertexIcon(index === 0),
      })

      marker.on("drag", (event) => {
        const next = event.target.getLatLng()

        editingDraft.value.coordinates[index] = normalizePoint(next)

        route.setLatLngs(editingDraft.value.coordinates.map((item) => [item.lat, item.lng]))
      })

      marker.on("dragend", () => {
        emitUpdatedGeofence()
      })

      marker
        .bindTooltip(index === 0 ? "Mover inicio" : `Mover punto ${index + 1}`, {
          direction: "top",
          className: "sinergy-geofence-tooltip",
        })
        .addTo(layers.editLayer)
    })
  }

  const redrawEditLayer = () => {
    if (!layers.editLayer || !editingDraft.value) return

    layers.editLayer.clearLayers()

    if (editingDraft.value.type === "circle") {
      redrawEditCircle()
    }

    if (editingDraft.value.type === "polygon") {
      redrawEditPolygon()
    }

    if (editingDraft.value.type === "route") {
      redrawEditRoute()
    }
  }

  const updateEditingGeofenceMeta = (updates = {}) => {
    if (!editingDraft.value) return

    const currentType = editingDraft.value.type
    const fallbackName = getFallbackGeofenceName(props, currentType)

    const nextStrokeColor =
      updates.strokeColor ||
      updates.color ||
      editingDraft.value.strokeColor ||
      editingDraft.value.color ||
      geofenceStyle.color

    const nextFillColor =
      updates.fillColor ||
      editingDraft.value.fillColor ||
      nextStrokeColor ||
      geofenceStyle.fillColor

    editingDraft.value = {
      ...editingDraft.value,
      ...updates,
      name:
        updates.name !== undefined
          ? String(updates.name).trim() || fallbackName
          : editingDraft.value.name,
      strokeColor: nextStrokeColor,
      color: nextStrokeColor,
      fillColor: currentType === "route" ? undefined : nextFillColor,
      fillOpacity: getNumber(
        updates.fillOpacity,
        getNumber(editingDraft.value.fillOpacity, geofenceStyle.fillOpacity),
      ),
    }

    emitUpdatedGeofence()
    redrawEditLayer()
  }

  const removeLastEditPoint = () => {
    if (!editingDraft.value) return

    if (editingDraft.value.type === "polygon") {
      if (editingDraft.value.coordinates.length <= 3) return
    } else if (editingDraft.value.type === "route") {
      if (editingDraft.value.coordinates.length <= 2) return
    } else {
      return
    }

    editingDraft.value.coordinates.pop()
    emitUpdatedGeofence()
    redrawEditLayer()
  }

  const addEditPoint = (latlng) => {
    if (!editingDraft.value) return

    if (editingDraft.value.type !== "polygon" && editingDraft.value.type !== "route") return

    editingDraft.value.coordinates.push(normalizePoint(latlng))

    editAddPoint.value = false
    emitUpdatedGeofence()
    redrawEditLayer()
  }

  return {
    clearEditLayers,
    redrawEditLayer,
    updateEditingGeofenceMeta,
    removeLastEditPoint,
    emitUpdatedGeofence,
    addEditPoint,
  }
}