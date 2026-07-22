import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import L from "leaflet"

import { normalizeId } from "../../../utils/idUtils.js"

import { createGeofenceMapController } from "./geofences/useMapGeofences.js"
import { createItineraryMapController } from "./useMapItinerary.js"
import { createMovementTrailController } from "./useMapMovementTrails.js"
import { createAssetMarkerController } from "./useMapAssetMarkers.js"
import { createPlannedRouteMapEditorController } from "./useMapPlannedRouteEditor.js"
import { usePlannedRouteMapEditor } from "../routes/usePlannedRouteMapEditor.js"

import {
  buildGeofencesSignature,
  buildItineraryRouteSignature,
  buildSelectedItineraryPointSignature,
} from "./mapSignatures.js"
import { normalizeSignatureValue } from "../../../utils/mapSignatureUtils.js"

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

const getItineraryRouteAssetIds = (route) => {
  if (!route) return []

  const routeItems = Array.isArray(route.routes) ? route.routes : []
  const routeAssets = Array.isArray(route.assets) ? route.assets : []
  const assetIds = new Set()

  const addAssetId = (assetId) => {
    const normalizedAssetId = normalizeId(assetId)

    if (normalizedAssetId) {
      assetIds.add(normalizedAssetId)
    }
  }

  addAssetId(route.asset?.id)
  addAssetId(route.asset?.activoId)

  routeAssets.forEach((asset) => {
    addAssetId(asset?.id)
    addAssetId(asset?.activoId)
  })

  routeItems.forEach((item) => {
    addAssetId(item.asset?.id)
    addAssetId(item.asset?.activoId)
    addAssetId(item.id)
  })

  if (assetIds.size) {
    return Array.from(assetIds)
  }

  if (Array.isArray(route.rows)) {
    route.rows.forEach((row) => {
      addAssetId(row.assetId)
      addAssetId(row.asset?.id)
      addAssetId(row.asset?.activoId)
    })
  }

  return Array.from(assetIds)
}

export function useActivosMap({ props, emit, mapRef }) {
  const drawMode = ref(null)
  const draftPolygonPoints = ref([])
  const draftRoutePoints = ref([])
  const draftCircleCenter = ref(null)
  const editingDraft = ref(null)
  const editAddPoint = ref(false)
  const leafletMap = ref(null)
  const { isEditingPlannedRouteOnMap } = usePlannedRouteMapEditor()

  let map = null
  let currentTileLayer = null
  let itineraryRenderer = null
  let lastItineraryFitKey = ""
  let needsTileLayerRefresh = false

  const layers = {
    markerLayer: null,
    movementTrailLayer: null,
    geofenceLayer: null,
    itineraryLayer: null,
    draftLayer: null,
    editLayer: null,
    plannedRouteEditLayer: null,
  }

  const activosMarkerMetadataSignature = computed(() => {
    const geofenceAddressMode = normalizeSignatureValue(props.useGeofenceLocationAddress !== false)
    const assetSignature = (props.activos || [])
      .map((activo) => {
        return [
          normalizeId(activo?.id),
          activo?.vehiculo,
          activo?.patente,
          activo?.patent,
          activo?.name,
          activo?.nombrePantalla,
          activo?.displayName,
          activo?.deviceId,
          activo?.imei,
          activo?.trackerModelLabel,
          activo?.trackerManufacturer,
          activo?.protocol,
          activo?.sucursalId,
          activo?.driver,
          activo?.assetType,
          activo?.tipoActivo,
          activo?.mapIcon,
          activo?.markerIcon,
          activo?.iconType,
        ]
          .map(normalizeSignatureValue)
          .join(":")
      })
      .join("|")

    return [geofenceAddressMode, assetSignature].join("|")
  })

  const getActivoLatLng = (activo) => {
    if (!activo) return null

    const lat = Number(activo.lat)
    const lng = Number(activo.lng)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

    return [lat, lng]
  }

  const focusedRouteActivoIds = computed(() => {
    if (!isEditingPlannedRouteOnMap.value) return []

    const itineraryAssetIds = getItineraryRouteAssetIds(props.itineraryRoute)

    if (itineraryAssetIds.length) return itineraryAssetIds
    if (props.selectedId) return [props.selectedId]

    return []
  })

  const focusedRouteActivoSignature = computed(() => {
    return focusedRouteActivoIds.value.map(normalizeId).sort().join("|")
  })

  const getSafeMapType = () => {
    return MAP_TILE_LAYERS[props.mapType] ? props.mapType : "standard"
  }

  const isBackgroundPaused = () => {
    return Boolean(props.backgroundPaused)
  }

  const setMapInteractionPaused = (paused) => {
    if (!map) return

    const method = paused ? "disable" : "enable"
    const handlers = [
      map.dragging,
      map.touchZoom,
      map.doubleClickZoom,
      map.scrollWheelZoom,
      map.boxZoom,
      map.keyboard,
      map.tap,
    ]

    handlers.forEach((handler) => {
      handler?.[method]?.()
    })
  }

  const refreshMapAfterBackgroundPause = () => {
    if (!map || isBackgroundPaused()) return

    if (needsTileLayerRefresh) {
      applyTileLayer()
      needsTileLayerRefresh = false
    }

    map.invalidateSize({
      pan: false,
    })

    assetMarkers.syncActivoMarkers(props.activos, {
      fit: false,
      trackTrail: false,
    })
    movementTrails.redrawAllMovementTrails()
    geofenceMap.syncAndRenderGeofences()

    const nextItineraryFitKey = buildItineraryFitKey(props.itineraryRoute)

    lastItineraryFitKey = nextItineraryFitKey
    itineraryMap.renderItineraryRoute({
      fit: false,
    })
    itineraryMap.renderSelectedItineraryPoint()
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
    getFocusedActivoIds: () => focusedRouteActivoIds.value,
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
    getFocusedActivoIds: () => focusedRouteActivoIds.value,
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

  const plannedRouteMapEditor = createPlannedRouteMapEditorController({
    L,
    getMap: () => map,
    layers,
  })

  const handleMapZoomEnd = () => {
    if (isBackgroundPaused()) return

    assetMarkers.refreshActivoMarkers()
    itineraryMap.renderItineraryRoute()
  }

  const handleMapMoveEnd = () => {
    if (isBackgroundPaused()) return

    setLayerGroupVisibility(layers.movementTrailLayer, true)
    setLayerGroupVisibility(layers.itineraryLayer, true)

    assetMarkers.refreshActivoMarkers()
    itineraryMap.renderItineraryRoute()
  }

  const handleMapMoveStart = () => {
    if (isBackgroundPaused()) return

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
    layers.plannedRouteEditLayer = L.featureGroup().addTo(map)

    applyTileLayer()

    map.on("click", geofenceMap.handleMapClick)
    map.on("click", plannedRouteMapEditor.handleMapClick)
    map.on("mousemove", geofenceMap.handleMapMouseMove)
    map.on("dblclick", geofenceMap.handleMapDoubleClick)
    map.on("zoomend", handleMapZoomEnd)
    map.on("movestart", handleMapMoveStart)
    map.on("moveend", handleMapMoveEnd)

    geofenceMap.renderGeofences()
    plannedRouteMapEditor.renderPlannedRouteEditor()

    lastItineraryFitKey = buildItineraryFitKey(props.itineraryRoute)

    itineraryMap.renderItineraryRoute({
      fit: Boolean(props.itineraryRoute),
    })

    assetMarkers.syncActivoMarkers(props.activos, {
      fit: true,
    })

    assetMarkers.centerSelected()

    setMapInteractionPaused(isBackgroundPaused())

    setTimeout(() => {
      map?.invalidateSize()
    }, 200)

    window.addEventListener("resize", handleResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener("resize", handleResize)

    if (map) {
      map.off("click", geofenceMap.handleMapClick)
      map.off("click", plannedRouteMapEditor.handleMapClick)
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
    plannedRouteMapEditor.cleanupPlannedRouteEditor()
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
      if (isBackgroundPaused()) {
        needsTileLayerRefresh = true
        return
      }

      applyTileLayer()
      movementTrails.refreshMovementTrailStyle()
      itineraryMap.renderItineraryRoute()
    },
  )

  /*
    Importante:
    No observar props.activos completo, porque cambia con cada pulso GPS.
    El batch incremental ya mueve marcadores por applyActivoTelemetryBatch().
    Este full sync queda solo para cambios estructurales o metadatos visibles:
    - cambia la cantidad de activos visibles
    - cambia el conjunto de IDs visibles
    - cambia filtro/grupo/empresa y por eso cambia la lista de IDs
    - cambia nombre, patente, dispositivo, modelo o sucursal del activo
  */
  watch(activosMarkerMetadataSignature, () => {
    if (isBackgroundPaused()) return

    assetMarkers.syncActivoMarkers(props.activos, {
      fit: false,
      trackTrail: false,
    })
  })

  watch(focusedRouteActivoSignature, () => {
    if (isBackgroundPaused()) return

    assetMarkers.syncActivoMarkers(props.activos, {
      fit: false,
      trackTrail: false,
    })
    movementTrails.refreshMovementTrailVisibility()
  })

  watch(
    () => props.selectedId,
    (selectedId, previousSelectedId) => {
      if (isBackgroundPaused()) return

      const hasSelectedActivo = Boolean(normalizeId(selectedId))

      assetMarkers.refreshActivoMarkers()

      if (hasSelectedActivo) {
        assetMarkers.centerSelected()
      }

      movementTrails.refreshMovementTrailSelection({
        previousId: previousSelectedId,
        nextId: selectedId,
      })
    },
  )

  watch(
    () => buildGeofencesSignature(props.geofences),
    () => {
      if (isBackgroundPaused()) return

      geofenceMap.syncAndRenderGeofences()
      assetMarkers.refreshActivoMarkers()
    },
  )

  watch(
    () => buildItineraryRouteSignature(props.itineraryRoute),
    () => {
      if (isBackgroundPaused()) return

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
      if (isBackgroundPaused()) return

      itineraryMap.renderSelectedItineraryPoint()
      itineraryMap.centerItineraryPoint()
    },
  )

  watch(
    () => props.backgroundPaused,
    (isPaused) => {
      setMapInteractionPaused(isPaused)

      if (isPaused) return

      refreshMapAfterBackgroundPause()
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
    focusGeofence: geofenceMap.focusGeofence,
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
