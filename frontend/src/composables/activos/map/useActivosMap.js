import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import L from "leaflet"

import { normalizeId } from "../../../utils/idUtils.js"

import { createGeofenceMapController } from "./geofences/useMapGeofences.js"
import { createItineraryMapController } from "./useMapItinerary.js"
import { createMovementTrailController } from "./useMapMovementTrails.js"
import { createAssetMarkerController } from "./useMapAssetMarkers.js"

import {
  buildGeofencesSignature,
  buildItineraryRouteSignature,
  buildSelectedItineraryPointSignature,
} from "./mapSignatures.js"

const MAP_TILE_LAYERS = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    },
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 19,
      attribution: "Tiles &copy; Esri",
    },
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    options: {
      maxZoom: 20,
      attribution: "&copy; OpenStreetMap &copy; CARTO",
    },
  },
  voyager: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    options: {
      maxZoom: 20,
      attribution: "&copy; OpenStreetMap &copy; CARTO",
    },
  },
  hot: {
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors, Tiles style by HOT",
    },
  },
}

const buildItineraryFitKey = (route) => {
  if (!route) return ""

  const sourceRoutes = Array.isArray(route.routes) && route.routes.length ? route.routes : [route]
  const routeIds = sourceRoutes
    .map((item) => {
      return item.asset?.id || item.asset?.activoId || item.id || ""
    })
    .join("|")

  return [route.queryKey, route.id, route.asset?.id, route.asset?.activoId, routeIds]
    .map((value) => String(value ?? ""))
    .join(":")
}

export function useActivosMap({ props, emit, mapRef }) {
  const drawMode = ref(null)
  const draftPolygonPoints = ref([])
  const draftRoutePoints = ref([])
  const draftCircleCenter = ref(null)
  const editingDraft = ref(null)
  const editAddPoint = ref(false)
  const leafletMap = ref(null)

  let map = null
  let currentTileLayer = null
  let itineraryRenderer = null
  let lastItineraryFitKey = ""

  const layers = {
    markerLayer: null,
    movementTrailLayer: null,
    geofenceLayer: null,
    itineraryLayer: null,
    draftLayer: null,
    editLayer: null,
  }

  const getActivoLatLng = (activo) => {
    if (!activo) return null

    const lat = Number(activo.lat)
    const lng = Number(activo.lng)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

    return [lat, lng]
  }

  const getSafeMapType = () => {
    return MAP_TILE_LAYERS[props.mapType] ? props.mapType : "standard"
  }

  const createTileLayer = () => {
    const selectedMapType = getSafeMapType()
    const tileConfig = MAP_TILE_LAYERS[selectedMapType]

    return L.tileLayer(tileConfig.url, {
      ...tileConfig.options,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 4,
    })
  }

  const applyTileLayer = () => {
    if (!map) return

    if (currentTileLayer) {
      map.removeLayer(currentTileLayer)
      currentTileLayer = null
    }

    currentTileLayer = createTileLayer()
    currentTileLayer.addTo(map)
    currentTileLayer.bringToBack()

    map.invalidateSize()
  }

  const handleResize = () => {
    if (!map) return

    map.invalidateSize()
  }

  const setLayerGroupVisibility = (layer, visible) => {
    if (!layer?.eachLayer) return

    layer.eachLayer((childLayer) => {
      const element = childLayer.getElement?.()

      if (element) {
        element.classList.toggle("sinergy-map-layer-hidden", !visible)
      }

      setLayerGroupVisibility(childLayer, visible)
    })
  }

  const movementTrails = createMovementTrailController({
    L,
    getMap: () => map,
    getMapType: () => props.mapType,
    layers,
    getActivoLatLng,
    normalizeId,
    getSelectedActivoId: () => props.selectedId,
  })

  const assetMarkers = createAssetMarkerController({
    L,
    props,
    emit,
    getMap: () => map,
    layers,
    getActivoLatLng,
    normalizeId,
    movementTrails,
    drawMode,
    editingDraft,
  })

  const geofenceMap = createGeofenceMapController({
    props,
    emit,
    getMap: () => map,
    layers,
    state: {
      drawMode,
      draftPolygonPoints,
      draftRoutePoints,
      draftCircleCenter,
      editingDraft,
      editAddPoint,
    },
  })

  const itineraryMap = createItineraryMapController({
    props,
    getMap: () => map,
    getRenderer: () => itineraryRenderer,
    layers,
  })

  const handleMapZoomEnd = () => {
    assetMarkers.refreshActivoMarkers()
    itineraryMap.renderItineraryRoute()
  }

  const handleMapMoveEnd = () => {
    setLayerGroupVisibility(layers.movementTrailLayer, true)
    setLayerGroupVisibility(layers.itineraryLayer, true)

    assetMarkers.refreshActivoMarkers()
    itineraryMap.renderItineraryRoute()
  }

  const handleMapMoveStart = () => {
    setLayerGroupVisibility(layers.movementTrailLayer, false)
    setLayerGroupVisibility(layers.itineraryLayer, false)
  }

  onMounted(async () => {
    await nextTick()

    itineraryMap.ensureItineraryMapStyles()

    map = L.map(mapRef.value, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      inertia: true,
      inertiaDeceleration: 2600,
      inertiaMaxSpeed: 1600,
      easeLinearity: 0.22,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: false,
    }).setView([-33.4489, -70.6693], 13)

    leafletMap.value = map

    itineraryRenderer = L.svg({
      padding: 0.5,
    })

    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map)

    movementTrails.ensureMovementTrailPane()

    layers.movementTrailLayer = L.layerGroup().addTo(map)
    layers.markerLayer = L.layerGroup().addTo(map)
    layers.geofenceLayer = L.featureGroup().addTo(map)
    layers.itineraryLayer = L.featureGroup().addTo(map)
    layers.draftLayer = L.featureGroup().addTo(map)
    layers.editLayer = L.featureGroup().addTo(map)

    applyTileLayer()

    map.on("click", geofenceMap.handleMapClick)
    map.on("mousemove", geofenceMap.handleMapMouseMove)
    map.on("dblclick", geofenceMap.handleMapDoubleClick)
    map.on("zoomend", handleMapZoomEnd)
    map.on("movestart", handleMapMoveStart)
    map.on("moveend", handleMapMoveEnd)

    geofenceMap.renderGeofences()

    lastItineraryFitKey = buildItineraryFitKey(props.itineraryRoute)

    itineraryMap.renderItineraryRoute({
      fit: Boolean(props.itineraryRoute),
    })

    assetMarkers.syncActivoMarkers(props.activos, {
      fit: true,
    })

    assetMarkers.centerSelected()

    setTimeout(() => {
      map?.invalidateSize()
    }, 200)

    window.addEventListener("resize", handleResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener("resize", handleResize)

    if (map) {
      map.off("click", geofenceMap.handleMapClick)
      map.off("mousemove", geofenceMap.handleMapMouseMove)
      map.off("dblclick", geofenceMap.handleMapDoubleClick)
      map.off("zoomend", handleMapZoomEnd)
      map.off("movestart", handleMapMoveStart)
      map.off("moveend", handleMapMoveEnd)
    }

    assetMarkers.clearMarkerCache()
    movementTrails.cleanupMovementTrails()
    geofenceMap.cancelAll()
    geofenceMap.clearGeofenceCache?.()
    itineraryMap.clearItineraryRoute()

    if (currentTileLayer) {
      currentTileLayer.remove()
      currentTileLayer = null
    }

    if (map) {
      map.remove()
      map = null
    }

    leafletMap.value = null
    itineraryRenderer = null
  })

  watch(
    () => props.mapType,
    () => {
      applyTileLayer()
      movementTrails.redrawAllMovementTrails()
      itineraryMap.renderItineraryRoute()
    },
  )

  watch(
    () => props.activos,
    (activos) => {
      assetMarkers.syncActivoMarkers(activos)
    },
    {
      deep: false,
    },
  )

  watch(
    () => props.selectedId,
    () => {
      assetMarkers.refreshActivoMarkers()
      assetMarkers.centerSelected()
      movementTrails.redrawAllMovementTrails()
    },
  )

  watch(
    () => buildGeofencesSignature(props.geofences),
    () => {
      geofenceMap.syncAndRenderGeofences()
    },
  )

  watch(
    () => buildItineraryRouteSignature(props.itineraryRoute),
    () => {
      const nextItineraryFitKey = buildItineraryFitKey(props.itineraryRoute)
      const shouldFit = Boolean(props.itineraryRoute) && nextItineraryFitKey !== lastItineraryFitKey

      lastItineraryFitKey = nextItineraryFitKey

      itineraryMap.renderItineraryRoute({
        fit: shouldFit,
      })
    },
  )

  watch(
    () => buildSelectedItineraryPointSignature(props.selectedItineraryPoint),
    () => {
      itineraryMap.renderSelectedItineraryPoint()
      itineraryMap.centerItineraryPoint()
    },
  )

  return {
    geofences: geofenceMap.geofences,
    drawMode,
    draftPolygonPoints,
    draftRoutePoints,
    editingDraft,
    editAddPoint,

    canSavePolygon: geofenceMap.canSavePolygon,
    canSaveRoute: geofenceMap.canSaveRoute,

    helperTitle: geofenceMap.helperTitle,
    helperText: geofenceMap.helperText,

    startCircleDraw: geofenceMap.startCircleDraw,
    startPolygonDraw: geofenceMap.startPolygonDraw,
    startRouteDraw: geofenceMap.startRouteDraw,

    finishPolygon: geofenceMap.finishPolygon,
    finishRoute: geofenceMap.finishRoute,

    undoPolygonPoint: geofenceMap.undoPolygonPoint,
    undoRoutePoint: geofenceMap.undoRoutePoint,

    cancelAll: geofenceMap.cancelAll,

    startEditGeofence: geofenceMap.startEditGeofence,
    stopEditing: geofenceMap.stopEditing,
    removeLastEditPoint: geofenceMap.removeLastEditPoint,
    deleteGeofence: geofenceMap.deleteGeofence,
    updateEditingGeofenceMeta: geofenceMap.updateEditingGeofenceMeta,

    syncActivoMarkers: assetMarkers.syncActivoMarkers,
    applyActivoTelemetryBatch: assetMarkers.applyActivoTelemetryBatch,
    upsertActivoMarker: assetMarkers.upsertActivoMarker,
    removeActivoMarker: assetMarkers.removeActivoMarker,

    leafletMap,
    mapInstance: leafletMap,

    showMovementTrails: movementTrails.showMovementTrails,
    toggleMovementTrails: movementTrails.toggleMovementTrails,
    clearMovementTrails: movementTrails.clearMovementTrails,
  }
}
