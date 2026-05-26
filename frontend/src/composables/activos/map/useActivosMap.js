import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import L from "leaflet"

import { createGeofenceMapController } from "./useMapGeofences.js"
import { createItineraryMapController } from "./useMapItinerary.js"

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

export function useActivosMap({ props, emit, mapRef }) {
  const drawMode = ref(null)
  const draftPolygonPoints = ref([])
  const draftRoutePoints = ref([])
  const draftCircleCenter = ref(null)
  const editingDraft = ref(null)
  const editAddPoint = ref(false)

  let map = null
  let currentTileLayer = null
  let itineraryRenderer = null

  const layers = {
    markerLayer: null,
    geofenceLayer: null,
    itineraryLayer: null,
    draftLayer: null,
    editLayer: null,
  }

  const selectedActivo = computed(() => {
    return (props.activos || []).find((activo) => activo.id === props.selectedId) || null
  })

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
      keepBuffer: 2,
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

  const markerClass = (estado) => {
    const classes = {
      moving: "marker-moving",
      idle: "marker-idle",
      stopped: "marker-stopped",
      offline: "marker-offline",
    }

    return classes[estado] || "marker-offline"
  }

  const createMarkerIcon = (activo) => {
    const isSelected = activo.id === props.selectedId

    return L.divIcon({
      className: "",
      html: `
        <div class="sinergy-marker ${markerClass(activo.estado)} ${isSelected ? "selected" : ""}">
          <span></span>
        </div>
      `,
      iconSize: isSelected ? [30, 30] : [22, 22],
      iconAnchor: isSelected ? [15, 15] : [11, 11],
    })
  }

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

  const renderMarkers = () => {
    if (!map || !layers.markerLayer) return

    layers.markerLayer.clearLayers()

    const bounds = []

    ;(props.activos || []).forEach((activo) => {
      const activoLatLng = getActivoLatLng(activo)

      if (!activoLatLng) return

      const marker = L.marker(activoLatLng, {
        icon: createMarkerIcon(activo),
      })

      marker.on("click", () => {
        if (drawMode.value || editingDraft.value) return
        emit("select", activo.id)
      })

      marker.bindTooltip(activo.vehiculo || activo.patente || activo.name || "Activo", {
        permanent: activo.id === props.selectedId,
        direction: "top",
        offset: [0, -12],
        className: "sinergy-tooltip",
      })

      marker.addTo(layers.markerLayer)
      bounds.push(activoLatLng)
    })

    if (bounds.length && !props.selectedId && !props.itineraryRoute) {
      map.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: 14,
      })
    }
  }

  const centerSelected = () => {
    if (!map || !selectedActivo.value) return

    const activoLatLng = getActivoLatLng(selectedActivo.value)

    if (!activoLatLng) return

    map.invalidateSize()

    map.flyTo(activoLatLng, 15, {
      duration: 0.45,
    })
  }

  const handleResize = () => {
    if (!map) return
    map.invalidateSize()
  }

  onMounted(async () => {
    await nextTick()

    itineraryMap.ensureItineraryMapStyles()

    map = L.map(mapRef.value, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    }).setView([-33.4489, -70.6693], 13)

    itineraryRenderer = L.svg({
      padding: 0.5,
    })

    L.control.zoom({
      position: "bottomright",
    }).addTo(map)

    layers.markerLayer = L.layerGroup().addTo(map)
    layers.geofenceLayer = L.featureGroup().addTo(map)
    layers.itineraryLayer = L.featureGroup().addTo(map)
    layers.draftLayer = L.featureGroup().addTo(map)
    layers.editLayer = L.featureGroup().addTo(map)

    applyTileLayer()

    map.on("click", geofenceMap.handleMapClick)
    map.on("mousemove", geofenceMap.handleMapMouseMove)
    map.on("dblclick", geofenceMap.handleMapDoubleClick)

    geofenceMap.renderGeofences()

    itineraryMap.renderItineraryRoute({
      fit: Boolean(props.itineraryRoute),
    })

    renderMarkers()
    centerSelected()

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
    }

    geofenceMap.cancelAll()
    itineraryMap.clearItineraryRoute()

    if (currentTileLayer) {
      currentTileLayer.remove()
      currentTileLayer = null
    }

    if (map) {
      map.remove()
      map = null
    }

    itineraryRenderer = null
  })

  watch(
    () => props.mapType,
    () => {
      applyTileLayer()
    },
  )

  watch(
    () => props.activos,
    () => {
      renderMarkers()

      if (props.selectedId) {
        centerSelected()
      }
    },
    { deep: true },
  )

  watch(
    () => props.selectedId,
    () => {
      renderMarkers()
      centerSelected()
    },
  )

  watch(
    () => props.geofences,
    () => {
      geofenceMap.syncAndRenderGeofences()
    },
    { deep: true },
  )

  watch(
    () => props.itineraryRoute,
    () => {
      itineraryMap.renderItineraryRoute({
        fit: Boolean(props.itineraryRoute),
      })
    },
    { deep: true },
  )

  watch(
    () => props.selectedItineraryPoint,
    () => {
      itineraryMap.renderItineraryRoute()
      itineraryMap.centerItineraryPoint()
    },
    { deep: true },
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
  }
}
