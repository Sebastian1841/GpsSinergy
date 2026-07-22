<template>
  <div
    class="route-comparison-map relative h-[420px] min-h-[360px] overflow-hidden rounded-xl bg-[#dbe3ee] ring-1 ring-slate-200"
    @wheel.stop
  >
    <div ref="mapRef" class="absolute inset-0"></div>

    <div class="pointer-events-none absolute left-3 top-3 z-[520] flex flex-wrap gap-2">
      <span
        class="rounded-md bg-[#102372] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white shadow-sm"
      >
        Ruta esperada
      </span>

      <span
        class="rounded-md bg-[#ff6600] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white shadow-sm"
      >
        Ruta real
      </span>

      <span
        v-if="hasOffRoutePoints"
        class="rounded-md bg-red-600 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white shadow-sm"
      >
        Desvio
      </span>
    </div>

    <div
      v-if="!hasRenderablePoints"
      class="absolute inset-0 z-[510] flex items-center justify-center bg-white/80 px-6 text-center"
    >
      <div>
        <p class="text-[13px] font-black text-[#102372]">Sin recorrido para comparar</p>
        <p class="mt-1 text-[11px] font-semibold text-slate-500">
          Selecciona una ruta esperada y un recorrido real con coordenadas.
        </p>
      </div>
    </div>

    <div class="pointer-events-none absolute right-3 top-3 z-[520] grid w-[170px] gap-1.5">
      <div
        v-for="metric in mapMetrics"
        :key="metric.label"
        class="rounded-lg bg-white/92 px-2.5 py-1.5 shadow-lg ring-1 ring-slate-200/80 backdrop-blur"
      >
        <p class="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
          {{ metric.label }}
        </p>
        <p class="mt-0.5 text-[12px] font-black" :class="metric.valueClass">
          {{ metric.value }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const MAX_POLYLINE_POINTS = 180
const MAX_DEVIATION_SEGMENT_POINTS = 55
const MAX_DEVIATION_MARKERS = 10
const MAX_BOUNDS_POINTS = 90
const DEFAULT_CENTER = [-33.4489, -70.6693]
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
const TILE_OPTIONS = {
  attribution: "&copy; OpenStreetMap &copy; CARTO",
  detectRetina: false,
  keepBuffer: 1,
  maxNativeZoom: 19,
  maxZoom: 20,
  noWrap: true,
  updateInterval: 260,
  updateWhenIdle: true,
  updateWhenZooming: false,
}

const props = defineProps({
  plannedPoints: {
    type: Array,
    default: () => [],
  },
  actualPoints: {
    type: Array,
    default: () => [],
  },
  deviations: {
    type: Array,
    default: () => [],
  },
  summary: {
    type: Object,
    default: () => ({}),
  },
})

const mapRef = ref(null)

let map = null
let tileLayer = null
let plannedLayer = null
let actualLayer = null
let deviationLayer = null
let markerLayer = null
let canvasRenderer = null
let renderFrame = 0

const hasValidCoordinates = (point) => {
  return Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng))
}

const normalizePoint = (point = {}) => {
  return {
    ...point,
    lat: Number(point.lat),
    lng: Number(point.lng),
  }
}

const getValidPoints = (points = []) => {
  return points.filter(hasValidCoordinates).map(normalizePoint)
}

const samplePoints = (points = [], limit = MAX_POLYLINE_POINTS) => {
  const validPoints = getValidPoints(points)

  if (validPoints.length <= limit) return validPoints
  if (limit <= 2) return [validPoints[0], validPoints[validPoints.length - 1]]

  const lastIndex = validPoints.length - 1
  const step = lastIndex / (limit - 1)

  return Array.from({ length: limit }, (_item, index) => {
    return validPoints[Math.round(index * step)]
  })
}

const toLatLng = (point) => [Number(point.lat), Number(point.lng)]

const plannedRoutePoints = computed(() => samplePoints(props.plannedPoints, MAX_POLYLINE_POINTS))
const actualRoutePoints = computed(() => samplePoints(props.actualPoints, MAX_POLYLINE_POINTS))

const hasRenderablePoints = computed(() => {
  return plannedRoutePoints.value.length >= 2 || actualRoutePoints.value.length >= 2
})

const hasOffRoutePoints = computed(() => {
  return Number(props.summary?.offRoutePointsCount || 0) > 0 || props.deviations.length > 0
})

const mapMetrics = computed(() => {
  return [
    {
      label: "Cumplimiento",
      value: props.summary?.complianceLabel || "0%",
      valueClass: Number(props.summary?.compliance || 0) < 80 ? "text-[#ff6600]" : "text-[#102372]",
    },
    {
      label: "Max desvio",
      value: props.summary?.maxDeviationLabel || "0 m",
      valueClass: hasOffRoutePoints.value ? "text-red-600" : "text-emerald-600",
    },
    {
      label: "Promedio desvio",
      value: props.summary?.averageDeviationLabel || "0 m",
      valueClass: hasOffRoutePoints.value ? "text-[#ff6600]" : "text-emerald-600",
    },
    {
      label: "Tolerancia",
      value: props.summary?.toleranceLabel || "-",
      valueClass: "text-[#102372]",
    },
  ]
})

const buildPointsSignature = (points = []) => {
  const validPoints = getValidPoints(points)

  if (!validPoints.length) return "0"

  const firstPoint = validPoints[0]
  const middlePoint = validPoints[Math.floor(validPoints.length / 2)]
  const lastPoint = validPoints[validPoints.length - 1]
  const offRouteCount = validPoints.filter((point) => point.offRoute).length

  return [
    validPoints.length,
    offRouteCount,
    firstPoint.lat.toFixed(5),
    firstPoint.lng.toFixed(5),
    middlePoint.lat.toFixed(5),
    middlePoint.lng.toFixed(5),
    lastPoint.lat.toFixed(5),
    lastPoint.lng.toFixed(5),
  ].join(":")
}

const renderSignature = computed(() => {
  return [
    buildPointsSignature(props.plannedPoints),
    buildPointsSignature(props.actualPoints),
    props.summary?.offRoutePointsCount || 0,
    props.summary?.maxDeviationMeters || 0,
    props.summary?.toleranceMeters || "",
  ].join("|")
})

const buildOffRouteSegments = (points = []) => {
  const segments = []
  let currentSegment = []

  getValidPoints(points).forEach((point) => {
    if (point.offRoute) {
      currentSegment.push(point)
      return
    }

    if (currentSegment.length >= 2) {
      segments.push(currentSegment)
    }

    currentSegment = []
  })

  if (currentSegment.length >= 2) {
    segments.push(currentSegment)
  }

  return segments.map((segment, index) => ({
    id: `map-deviation-${index + 1}`,
    points: segment,
  }))
}

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

const buildDeviationTooltip = (deviation = {}) => {
  return [
    `<strong>${escapeHtml(deviation.label || "Desvio")}</strong>`,
    `Maximo: ${escapeHtml(deviation.maxDistanceLabel || "0 m")}`,
    deviation.averageDistanceLabel ? `Promedio: ${escapeHtml(deviation.averageDistanceLabel)}` : "",
    deviation.startTime || deviation.endTime
      ? `${escapeHtml(deviation.startTime || "-")} a ${escapeHtml(deviation.endTime || "-")}`
      : "",
    deviation.durationLabel ? `Duracion: ${escapeHtml(deviation.durationLabel)}` : "",
    deviation.pointsCount ? `${Number(deviation.pointsCount)} puntos fuera` : "",
  ]
    .filter(Boolean)
    .join("<br>")
}

const getDeviationMarkerItems = () => {
  const validItems = props.deviations.filter((deviation) => hasValidCoordinates(deviation.maxPoint))

  if (validItems.length <= MAX_DEVIATION_MARKERS) return validItems

  return validItems
    .slice()
    .sort((leftDeviation, rightDeviation) => {
      return (
        Number(rightDeviation.maxDistanceMeters || 0) - Number(leftDeviation.maxDistanceMeters || 0)
      )
    })
    .slice(0, MAX_DEVIATION_MARKERS)
}

const clearLayers = () => {
  plannedLayer?.clearLayers()
  actualLayer?.clearLayers()
  deviationLayer?.clearLayers()
  markerLayer?.clearLayers()
}

const cancelScheduledRender = () => {
  if (!renderFrame) return

  window.cancelAnimationFrame(renderFrame)
  renderFrame = 0
}

const fitMapBounds = () => {
  if (!map || !hasRenderablePoints.value) {
    map?.setView(DEFAULT_CENTER, 12, {
      animate: false,
    })
    return
  }

  const allPoints = [
    ...samplePoints(props.plannedPoints, MAX_BOUNDS_POINTS),
    ...samplePoints(props.actualPoints, MAX_BOUNDS_POINTS),
  ]
  const bounds = L.latLngBounds(allPoints.map(toLatLng))

  if (!bounds.isValid()) {
    map.setView(DEFAULT_CENTER, 12, {
      animate: false,
    })
    return
  }

  map.fitBounds(bounds, {
    animate: false,
    maxZoom: 15,
    paddingTopLeft: [42, 42],
    paddingBottomRight: [42, 92],
  })
}

const drawEndpoint = ({ point, color, label }) => {
  const layer = L.circleMarker(toLatLng(point), {
    renderer: canvasRenderer,
    radius: 7,
    color: "#ffffff",
    interactive: false,
    opacity: 1,
    weight: 2,
    fill: true,
    fillColor: color,
    fillOpacity: 0.95,
  }).addTo(markerLayer)

  layer.bindTooltip(label, {
    direction: "top",
    permanent: false,
    sticky: true,
    className: "route-comparison-tooltip",
  })
}

const renderComparisonMap = () => {
  if (!map) return

  clearLayers()
  map.invalidateSize({
    animate: false,
    pan: false,
  })

  if (plannedRoutePoints.value.length >= 2) {
    L.polyline(plannedRoutePoints.value.map(toLatLng), {
      color: "#102372",
      interactive: false,
      lineCap: "round",
      lineJoin: "round",
      opacity: 0.88,
      renderer: canvasRenderer,
      smoothFactor: 1.8,
      weight: 5,
    }).addTo(plannedLayer)
  }

  if (actualRoutePoints.value.length >= 2) {
    L.polyline(actualRoutePoints.value.map(toLatLng), {
      color: "#ff6600",
      interactive: false,
      lineCap: "round",
      lineJoin: "round",
      opacity: 0.92,
      renderer: canvasRenderer,
      smoothFactor: 1.8,
      weight: 4,
    }).addTo(actualLayer)
  }

  const deviationLatLngSegments = buildOffRouteSegments(actualRoutePoints.value)
    .map((segment) => samplePoints(segment.points, MAX_DEVIATION_SEGMENT_POINTS).map(toLatLng))
    .filter((segmentPoints) => segmentPoints.length >= 2)

  if (deviationLatLngSegments.length) {
    L.polyline(deviationLatLngSegments, {
      color: "#dc2626",
      interactive: false,
      lineCap: "round",
      lineJoin: "round",
      opacity: 0.95,
      renderer: canvasRenderer,
      smoothFactor: 1.8,
      weight: 7,
    }).addTo(deviationLayer)
  }

  getDeviationMarkerItems().forEach((deviation) => {
    const layer = L.circleMarker(toLatLng(deviation.maxPoint), {
      renderer: canvasRenderer,
      radius: 7,
      color: "#ffffff",
      opacity: 1,
      weight: 2,
      fill: true,
      fillColor: "#dc2626",
      fillOpacity: 0.95,
      interactive: true,
    }).addTo(markerLayer)

    const detail = buildDeviationTooltip(deviation)

    layer.bindTooltip(detail, {
      sticky: true,
      direction: "top",
      className: "route-comparison-tooltip",
    })
  })

  const startPoint = plannedRoutePoints.value[0] || actualRoutePoints.value[0]
  const endPoint =
    plannedRoutePoints.value[plannedRoutePoints.value.length - 1] ||
    actualRoutePoints.value[actualRoutePoints.value.length - 1]

  if (startPoint) {
    drawEndpoint({
      point: startPoint,
      color: "#22c55e",
      label: "Inicio",
    })
  }

  if (endPoint) {
    drawEndpoint({
      point: endPoint,
      color: "#38bdf8",
      label: "Fin",
    })
  }

  fitMapBounds()
}

const scheduleRenderComparisonMap = () => {
  cancelScheduledRender()

  renderFrame = window.requestAnimationFrame(() => {
    renderFrame = 0
    renderComparisonMap()
  })
}

onMounted(async () => {
  await nextTick()

  if (!mapRef.value) return

  canvasRenderer = L.canvas({
    padding: 0.12,
    tolerance: 8,
  })

  map = L.map(mapRef.value, {
    attributionControl: false,
    doubleClickZoom: true,
    fadeAnimation: false,
    inertia: false,
    keyboard: false,
    markerZoomAnimation: false,
    preferCanvas: true,
    renderer: canvasRenderer,
    scrollWheelZoom: true,
    wheelDebounceTime: 72,
    wheelPxPerZoomLevel: 150,
    zoomAnimation: false,
    zoomControl: true,
    zoomSnap: 1,
  }).setView(DEFAULT_CENTER, 12)

  tileLayer = L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map)
  plannedLayer = L.layerGroup().addTo(map)
  actualLayer = L.layerGroup().addTo(map)
  deviationLayer = L.layerGroup().addTo(map)
  markerLayer = L.layerGroup().addTo(map)

  scheduleRenderComparisonMap()

  window.setTimeout(() => {
    map?.invalidateSize({
      animate: false,
      pan: false,
    })
    fitMapBounds()
  }, 80)
})

onBeforeUnmount(() => {
  cancelScheduledRender()
  clearLayers()

  tileLayer?.remove()
  tileLayer = null

  if (map) {
    map.remove()
    map = null
  }

  plannedLayer = null
  actualLayer = null
  deviationLayer = null
  markerLayer = null
  canvasRenderer = null
})

watch(renderSignature, () => {
  scheduleRenderComparisonMap()
})
</script>

<style scoped>
.route-comparison-map {
  contain: layout paint style;
}

.route-comparison-map :deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  background: #dbe3ee;
  cursor: grab;
  font-family: inherit;
  touch-action: none;
}

.route-comparison-map :deep(.leaflet-container:active) {
  cursor: grabbing;
}

.route-comparison-map :deep(.leaflet-pane),
.route-comparison-map :deep(.leaflet-tile-container) {
  will-change: transform;
}

.route-comparison-map :deep(.leaflet-control-zoom) {
  overflow: hidden;
  border: 1px solid rgba(16, 35, 114, 0.16);
  border-radius: 10px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
}

.route-comparison-map :deep(.leaflet-control-zoom a) {
  border: none;
  color: #102372;
  font-weight: 900;
}

.route-comparison-map :deep(.leaflet-control-zoom a:hover) {
  background: #fff3eb;
  color: #ff6600;
}

.route-comparison-map :deep(.route-comparison-tooltip) {
  border: none;
  border-radius: 9px;
  background: #102372;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.45;
  padding: 7px 9px;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.3);
}

.route-comparison-map :deep(.route-comparison-tooltip::before) {
  border-top-color: #102372;
}
</style>
