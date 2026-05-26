import { computed } from "vue"
import L from "leaflet"

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

const normalizePoint = (point) => ({
  lat: Number(point.lat.toFixed(7)),
  lng: Number(point.lng.toFixed(7)),
})

const toRad = (value) => (value * Math.PI) / 180
const toDeg = (value) => (value * 180) / Math.PI

const cloneGeofence = (geofence) => JSON.parse(JSON.stringify(geofence))

const makeGeofenceId = () => {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `geofence-${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
}

const getNumber = (value, fallback) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

const getFallbackGeofenceName = (props, type) => {
  const nextNumber = (props.geofences || []).length + 1

  if (type === "route") return `Ruta ${nextNumber}`

  return `Geocerca ${nextNumber}`
}

const getDraftGeofenceOptions = (props, type) => {
  const options = props.draftGeofenceOptions || {}
  const fallbackName = getFallbackGeofenceName(props, type)

  const strokeColor = options.strokeColor || options.color || geofenceStyle.color
  const fillColor = options.fillColor || strokeColor || geofenceStyle.fillColor

  return {
    name: String(options.name || fallbackName).trim() || fallbackName,
    strokeColor,
    fillColor,
    fillOpacity: getNumber(options.fillOpacity, geofenceStyle.fillOpacity),
  }
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

const getCircleEdgeLatLng = (center, radiusMeters) => {
  const earthRadius = 6378137
  const bearing = toRad(90)

  const lat1 = toRad(center.lat)
  const lng1 = toRad(center.lng)
  const distance = radiusMeters / earthRadius

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance) +
      Math.cos(lat1) * Math.sin(distance) * Math.cos(bearing),
  )

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(distance) * Math.cos(lat1),
      Math.cos(distance) - Math.sin(lat1) * Math.sin(lat2),
    )

  return L.latLng(toDeg(lat2), toDeg(lng2))
}

const createVertexIcon = (active = false) => {
  return L.divIcon({
    className: "",
    html: `<div class="${active ? "geofence-vertex active" : "geofence-vertex"}"></div>`,
    iconSize: active ? [18, 18] : [14, 14],
    iconAnchor: active ? [9, 9] : [7, 7],
  })
}

export function createGeofenceMapController({
  props,
  emit,
  getMap,
  layers,
  state,
}) {
  const {
    drawMode,
    draftPolygonPoints,
    draftRoutePoints,
    draftCircleCenter,
    editingDraft,
    editAddPoint,
  } = state

  const geofences = computed(() => props.geofences || [])

  const canSavePolygon = computed(() => {
    return draftPolygonPoints.value.length >= 3
  })

  const canSaveRoute = computed(() => {
    return draftRoutePoints.value.length >= 2
  })

  const helperTitle = computed(() => {
    if (editingDraft.value) return `Editando ${editingDraft.value.name}`
    if (drawMode.value === "circle") return "Nueva geocerca por radio"
    if (drawMode.value === "polygon") return "Nueva geocerca poligonal"
    if (drawMode.value === "route") return "Nueva geocerca de ruta"
    return ""
  })

  const helperText = computed(() => {
    if (editingDraft.value?.type === "circle") {
      return "Arrastra el punto central para moverla o el punto exterior para cambiar el radio."
    }

    if (editingDraft.value?.type === "polygon") {
      if (editAddPoint.value) return "Haz clic en el mapa para agregar un nuevo punto."
      return "Arrastra los puntos para ajustar la forma. También puedes agregar o quitar puntos."
    }

    if (editingDraft.value?.type === "route") {
      if (editAddPoint.value) return "Haz clic en el mapa para agregar un nuevo punto a la ruta."
      return "Arrastra los puntos para ajustar el recorrido. También puedes agregar o quitar puntos."
    }

    if (drawMode.value === "circle") {
      return draftCircleCenter.value
        ? "Haz clic en el borde para definir el tamaño."
        : "Haz clic en el centro de la geocerca."
    }

    if (drawMode.value === "polygon") {
      const points = draftPolygonPoints.value.length

      if (points === 0) return "Haz clic en el mapa para marcar el primer punto."
      if (points < 3) return `Marca mínimo 3 puntos. Actual: ${points}.`
      return "Haz clic en el primer punto para cerrar, doble clic o presiona ✓ para guardar."
    }

    if (drawMode.value === "route") {
      const points = draftRoutePoints.value.length

      if (points === 0) return "Haz clic en el mapa para marcar el inicio de la ruta."
      if (points < 2) return `Marca mínimo 2 puntos. Actual: ${points}.`
      return "Sigue marcando el recorrido o presiona ✓ para guardar la ruta."
    }

    return ""
  })

  const clearDraftLayers = () => {
    layers.draftLayer?.clearLayers()
  }

  const clearEditLayers = () => {
    layers.editLayer?.clearLayers()
  }

  const resetDraftState = () => {
    draftPolygonPoints.value = []
    draftRoutePoints.value = []
    draftCircleCenter.value = null
    clearDraftLayers()
  }

  const activateDrawCursor = () => {
    const map = getMap()

    map?.getContainer()?.classList.add("geofence-draw-active")
    map?.doubleClickZoom?.disable()
  }

  const deactivateDrawCursor = () => {
    const map = getMap()

    map?.getContainer()?.classList.remove("geofence-draw-active")
    map?.doubleClickZoom?.enable()
  }

  const renderGeofences = () => {
    const map = getMap()

    if (!map || !layers.geofenceLayer) return

    layers.geofenceLayer.clearLayers()

    ;(props.geofences || []).forEach((geofence) => {
      if (editingDraft.value?.id === geofence.id) return

      let layer = null

      if (geofence.type === "circle") {
        layer = L.circle([geofence.center.lat, geofence.center.lng], {
          ...getShapeStyle(geofence),
          radius: geofence.radius,
        })
      }

      if (geofence.type === "polygon") {
        layer = L.polygon(
          geofence.coordinates.map((point) => [point.lat, point.lng]),
          getShapeStyle(geofence),
        )
      }

      if (geofence.type === "route") {
        layer = L.polyline(
          geofence.coordinates.map((point) => [point.lat, point.lng]),
          getRouteStyle(geofence),
        )
      }

      if (!layer) return

      layer.bindTooltip(`${geofence.name} · clic para editar`, {
        direction: "top",
        sticky: true,
        className: "sinergy-geofence-tooltip",
      })

      layer.on("click", () => {
        if (drawMode.value) return
        startEditGeofence(geofence.id)
      })

      layer.addTo(layers.geofenceLayer)
    })
  }

  const stopEditing = () => {
    editingDraft.value = null
    editAddPoint.value = false
    clearEditLayers()
    renderGeofences()
  }

  const startPolygonDraw = () => {
    stopEditing()
    resetDraftState()
    drawMode.value = "polygon"
    activateDrawCursor()
  }

  const startRouteDraw = () => {
    stopEditing()
    resetDraftState()
    drawMode.value = "route"
    activateDrawCursor()
  }

  const startCircleDraw = () => {
    stopEditing()
    resetDraftState()
    drawMode.value = "circle"
    activateDrawCursor()
  }

  const cancelDraw = () => {
    drawMode.value = null
    deactivateDrawCursor()
    resetDraftState()
  }

  const cancelAll = () => {
    cancelDraw()
    stopEditing()
  }

  const undoPolygonPoint = () => {
    draftPolygonPoints.value.pop()
    redrawDraftPolygon()
  }

  const undoRoutePoint = () => {
    draftRoutePoints.value.pop()
    redrawDraftRoute()
  }

  const finishPolygon = () => {
    if (draftPolygonPoints.value.length < 3) return

    const options = getDraftGeofenceOptions(props, "polygon")

    emit("geofence-created", {
      id: makeGeofenceId(),
      name: options.name,
      type: "polygon",
      strokeColor: options.strokeColor,
      fillColor: options.fillColor,
      fillOpacity: options.fillOpacity,
      color: options.strokeColor,
      coordinates: draftPolygonPoints.value.map((point) => normalizePoint(point)),
      createdAt: new Date().toISOString(),
    })

    cancelDraw()
  }

  const finishRoute = () => {
    if (draftRoutePoints.value.length < 2) return

    const options = getDraftGeofenceOptions(props, "route")

    emit("geofence-created", {
      id: makeGeofenceId(),
      name: options.name,
      type: "route",
      strokeColor: options.strokeColor,
      color: options.strokeColor,
      toleranceMeters: 100,
      coordinates: draftRoutePoints.value.map((point) => normalizePoint(point)),
      createdAt: new Date().toISOString(),
    })

    cancelDraw()
  }

  const finishCircle = (center, edge) => {
    const radius = Math.round(center.distanceTo(edge))

    if (radius < 10) return

    const options = getDraftGeofenceOptions(props, "circle")

    emit("geofence-created", {
      id: makeGeofenceId(),
      name: options.name,
      type: "circle",
      strokeColor: options.strokeColor,
      fillColor: options.fillColor,
      fillOpacity: options.fillOpacity,
      color: options.strokeColor,
      center: normalizePoint(center),
      radius,
      createdAt: new Date().toISOString(),
    })

    cancelDraw()
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
        if (canClose) finishPolygon()
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

  const startEditGeofence = (geofenceId) => {
    const map = getMap()

    cancelDraw()

    const geofence = (props.geofences || []).find((item) => item.id === geofenceId)
    if (!geofence) return

    editingDraft.value = cloneGeofence(geofence)
    editAddPoint.value = false

    renderGeofences()
    redrawEditLayer()

    if (geofence.type === "circle") {
      map?.flyTo([geofence.center.lat, geofence.center.lng], map.getZoom(), {
        duration: 0.35,
      })
    }

    if (geofence.type === "polygon" || geofence.type === "route") {
      const bounds = L.latLngBounds(
        geofence.coordinates.map((point) => [point.lat, point.lng]),
      )

      if (bounds.isValid()) {
        map?.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 16,
        })
      }
    }
  }

  const emitUpdatedGeofence = () => {
    if (!editingDraft.value) return
    emit("geofence-updated", cloneGeofence(editingDraft.value))
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
      const currentCenter = L.latLng(
        editingDraft.value.center.lat,
        editingDraft.value.center.lng,
      )

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

        polygon.setLatLngs(
          editingDraft.value.coordinates.map((item) => [item.lat, item.lng]),
        )
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

        route.setLatLngs(
          editingDraft.value.coordinates.map((item) => [item.lat, item.lng]),
        )
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

  const deleteGeofence = (id) => {
    if (editingDraft.value?.id === id) stopEditing()
    emit("geofence-deleted", id)
  }

  const handleMapClick = (event) => {
    if (
      (editingDraft.value?.type === "polygon" || editingDraft.value?.type === "route") &&
      editAddPoint.value
    ) {
      editingDraft.value.coordinates.push(normalizePoint(event.latlng))

      editAddPoint.value = false
      emitUpdatedGeofence()
      redrawEditLayer()
      return
    }

    if (!drawMode.value) return

    if (drawMode.value === "polygon") {
      draftPolygonPoints.value.push(event.latlng)
      redrawDraftPolygon()
      return
    }

    if (drawMode.value === "route") {
      draftRoutePoints.value.push(event.latlng)
      redrawDraftRoute()
      return
    }

    if (drawMode.value === "circle") {
      if (!draftCircleCenter.value) {
        draftCircleCenter.value = event.latlng
        redrawDraftCircle()
        return
      }

      finishCircle(draftCircleCenter.value, event.latlng)
    }
  }

  const handleMapMouseMove = (event) => {
    if (drawMode.value !== "circle" || !draftCircleCenter.value || !layers.draftLayer) return
    redrawDraftCircle(event.latlng)
  }

  const handleMapDoubleClick = () => {
    if (drawMode.value === "polygon" && draftPolygonPoints.value.length >= 3) {
      finishPolygon()
    }

    if (drawMode.value === "route" && draftRoutePoints.value.length >= 2) {
      finishRoute()
    }
  }

  const syncAndRenderGeofences = () => {
    if (editingDraft.value) {
      const updated = (props.geofences || []).find((item) => item.id === editingDraft.value.id)

      if (updated) {
        editingDraft.value = cloneGeofence(updated)
        redrawEditLayer()
      }
    }

    renderGeofences()
  }

  return {
    geofences,
    canSavePolygon,
    canSaveRoute,
    helperTitle,
    helperText,

    startCircleDraw,
    startPolygonDraw,
    startRouteDraw,

    finishPolygon,
    finishRoute,

    undoPolygonPoint,
    undoRoutePoint,
    cancelAll,

    renderGeofences,
    syncAndRenderGeofences,

    startEditGeofence,
    stopEditing,
    removeLastEditPoint,
    deleteGeofence,
    updateEditingGeofenceMeta,

    handleMapClick,
    handleMapMouseMove,
    handleMapDoubleClick,
  }
}