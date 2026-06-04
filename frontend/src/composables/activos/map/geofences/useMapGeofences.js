import { computed } from "vue"
import L from "leaflet"

import {
  cloneGeofence,
  makeGeofenceId,
  normalizePoint,
} from "../../../../utils/geofenceMapUtils.js"

import { getFallbackGeofenceName } from "../../../../utils/geofenceUtils.js"
import { normalizeId } from "../../../../utils/idUtils.js"

import { createGeofenceDrawingController } from "./useGeofenceDrawing.js"
import { createGeofenceEditingController } from "./useGeofenceEditing.js"
import { createGeofenceRendererController } from "./useGeofenceRenderer.js"

import { geofenceStyle, getGeofenceMapColor } from "./geofenceMapStyles.js"

const getDraftGeofenceOptions = (props, type) => {
  const options = props.draftGeofenceOptions || {}
  const fallbackName = getFallbackGeofenceName(props.geofences || [], type)
  const color = getGeofenceMapColor(options, geofenceStyle.color)

  return {
    name: String(options.name || fallbackName).trim() || fallbackName,
    color,
  }
}

export function createGeofenceMapController({ props, emit, getMap, layers, state }) {
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

  const drawing = createGeofenceDrawingController({
    props,
    layers,
    state: {
      draftPolygonPoints,
      draftRoutePoints,
      draftCircleCenter,
    },
    onFinishPolygon: () => finishPolygon(),
  })

  const editing = createGeofenceEditingController({
    props,
    emit,
    layers,
    editingDraft,
    editAddPoint,
    createVertexIcon: drawing.createVertexIcon,
  })

  const renderer = createGeofenceRendererController({
    props,
    getMap,
    layers,
    editingDraft,
    drawMode,
    normalizeId,
    onStartEditGeofence: (id) => startEditGeofence(id),
  })

  const resetDraftState = () => {
    draftPolygonPoints.value = []
    draftRoutePoints.value = []
    draftCircleCenter.value = null
    drawing.clearDraftLayers()
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

  const stopEditing = () => {
    editingDraft.value = null
    editAddPoint.value = false
    editing.clearEditLayers()
    renderer.renderGeofences()
  }

  const startPolygonDraw = () => {
    if (props.canEditGeofences === false) return

    stopEditing()
    resetDraftState()
    drawMode.value = "polygon"
    activateDrawCursor()
  }

  const startRouteDraw = () => {
    if (props.canEditGeofences === false) return

    stopEditing()
    resetDraftState()
    drawMode.value = "route"
    activateDrawCursor()
  }

  const startCircleDraw = () => {
    if (props.canEditGeofences === false) return

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
    drawing.redrawDraftPolygon()
  }

  const undoRoutePoint = () => {
    draftRoutePoints.value.pop()
    drawing.redrawDraftRoute()
  }

  const finishPolygon = () => {
    if (draftPolygonPoints.value.length < 3) return

    const options = getDraftGeofenceOptions(props, "polygon")

    emit("geofence-created", {
      id: makeGeofenceId(),
      name: options.name,
      type: "polygon",
      color: options.color,
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
      color: options.color,
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
      color: options.color,
      center: normalizePoint(center),
      radius,
      createdAt: new Date().toISOString(),
    })

    cancelDraw()
  }

  const startEditGeofence = (geofenceId) => {
    if (props.canEditGeofences === false) return

    const map = getMap()

    cancelDraw()

    const geofence = (props.geofences || []).find((item) => {
      return normalizeId(item.id) === normalizeId(geofenceId)
    })

    if (!geofence) return

    editingDraft.value = cloneGeofence(geofence)
    editAddPoint.value = false

    renderer.renderGeofences()
    editing.redrawEditLayer()

    if (geofence.type === "circle") {
      map?.flyTo([geofence.center.lat, geofence.center.lng], map.getZoom(), {
        duration: 0.35,
      })
    }

    if (geofence.type === "polygon" || geofence.type === "route") {
      const bounds = L.latLngBounds(geofence.coordinates.map((point) => [point.lat, point.lng]))

      if (bounds.isValid()) {
        map?.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 16,
        })
      }
    }
  }

  const deleteGeofence = (id) => {
    if (props.canEditGeofences === false) return

    if (normalizeId(editingDraft.value?.id) === normalizeId(id)) {
      stopEditing()
    }

    renderer.removeCachedGeofenceLayer(normalizeId(id))
    emit("geofence-deleted", id)
  }

  const handleMapClick = (event) => {
    if (props.canEditGeofences === false) return

    if (
      (editingDraft.value?.type === "polygon" || editingDraft.value?.type === "route") &&
      editAddPoint.value
    ) {
      editing.addEditPoint(event.latlng)
      return
    }

    if (!drawMode.value) return

    if (drawMode.value === "polygon") {
      draftPolygonPoints.value.push(event.latlng)
      drawing.redrawDraftPolygon()
      return
    }

    if (drawMode.value === "route") {
      draftRoutePoints.value.push(event.latlng)
      drawing.redrawDraftRoute()
      return
    }

    if (drawMode.value === "circle") {
      if (!draftCircleCenter.value) {
        draftCircleCenter.value = event.latlng
        drawing.redrawDraftCircle()
        return
      }

      finishCircle(draftCircleCenter.value, event.latlng)
    }
  }

  const handleMapMouseMove = (event) => {
    if (drawMode.value !== "circle" || !draftCircleCenter.value || !layers.draftLayer) return

    drawing.redrawDraftCircle(event.latlng)
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
      const updated = (props.geofences || []).find((item) => {
        return normalizeId(item.id) === normalizeId(editingDraft.value.id)
      })

      if (updated) {
        editingDraft.value = cloneGeofence(updated)
        editing.redrawEditLayer()
      }
    }

    renderer.renderGeofences()
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

    renderGeofences: renderer.renderGeofences,
    syncAndRenderGeofences,
    clearGeofenceCache: renderer.clearGeofenceCache,

    startEditGeofence,
    stopEditing,
    removeLastEditPoint: editing.removeLastEditPoint,
    deleteGeofence,
    updateEditingGeofenceMeta: editing.updateEditingGeofenceMeta,

    handleMapClick,
    handleMapMouseMove,
    handleMapDoubleClick,
  }
}
