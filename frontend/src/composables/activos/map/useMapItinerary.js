import L from "leaflet"

import { endDevMeasure, startDevMeasure } from "../../../utils/performanceUtils.js"
import {
  ITINERARY_MAX_ROUTE_ARROWS,
  ITINERARY_MAX_STOP_MARKERS,
  ITINERARY_MIN_DETAIL_ZOOM,
  RENDER_ITINERARY_ROUTE_MEASURE,
} from "./itinerary/itineraryConstants.js"
import {
  buildRenderableItineraryPoints,
  getBearing,
  isValidLatLng,
  toLatLng,
} from "./itinerary/itineraryGeometry.js"
import { createItineraryIcon, createRouteArrowIcon } from "./itinerary/itineraryIcons.js"
import {
  createItineraryRouteStyles,
  ensureItineraryMapStyles,
  getItineraryRoutePalette,
} from "./itinerary/itineraryStyles.js"

const buildItineraryTooltip = (point, label = "Punto") => {
  const time = point.timeLabel || "-"
  const speed = point.speedLabel || `${point.speed || 0} km/h`
  const address = point.address || "Sin dirección"

  return `
    <div>
      <strong>${label}</strong><br />
      ${time} · ${speed}<br />
      ${address}
    </div>
  `
}

export function createItineraryMapController({ props, getMap, getRenderer, layers }) {
  const routeLayers = []
  let selectedItineraryPointLayer = null

  const getItineraryRoutes = () => {
    const route = props.itineraryRoute

    if (!route) return []

    const sourceRoutes = Array.isArray(route.routes) && route.routes.length ? route.routes : [route]

    return sourceRoutes
      .map((item, index) => {
        const rawPoints = (item.points || item.rows || []).filter(isValidLatLng)
        const points = buildRenderableItineraryPoints(rawPoints)

        return {
          ...item,
          index,
          rawPoints,
          points,
          asset: item.asset || route.asset,
          summary: item.summary || route.summary,
        }
      })
      .filter((item) => item.points.length)
  }

  const addRouteLayer = (layer) => {
    if (!layer || !layers.itineraryLayer) return layer

    routeLayers.push(layer)
    layer.addTo(layers.itineraryLayer)

    return layer
  }

  const clearItineraryRouteLayers = () => {
    if (!layers.itineraryLayer) {
      routeLayers.length = 0
      return
    }

    routeLayers.forEach((layer) => {
      layers.itineraryLayer.removeLayer(layer)
    })

    routeLayers.length = 0
  }

  const clearSelectedItineraryPoint = () => {
    if (!layers.itineraryLayer || !selectedItineraryPointLayer) {
      selectedItineraryPointLayer = null
      return
    }

    layers.itineraryLayer.removeLayer(selectedItineraryPointLayer)
    selectedItineraryPointLayer = null
  }

  const clearItineraryRoute = () => {
    clearItineraryRouteLayers()
    clearSelectedItineraryPoint()
  }

  const renderRouteDirectionArrows = ({ points, routeColor }) => {
    if (!layers.itineraryLayer) return
    if (!points.length || points.length < 3) return

    const step = Math.max(2, Math.floor(points.length / (ITINERARY_MAX_ROUTE_ARROWS + 1)))

    for (let index = step; index < points.length - 1; index += step) {
      const previousPoint = points[index - 1]
      const currentPoint = points[index]

      if (!isValidLatLng(previousPoint) || !isValidLatLng(currentPoint)) continue

      const angle = getBearing(previousPoint, currentPoint)

      addRouteLayer(
        L.marker(toLatLng(currentPoint), {
          icon: createRouteArrowIcon({
            L,
            color: routeColor,
            angle,
          }),
          interactive: false,
          zIndexOffset: 760,
        }),
      )
    }
  }

  const renderSelectedItineraryPoint = () => {
    if (!layers.itineraryLayer) return

    clearSelectedItineraryPoint()

    const selectedPoint = props.selectedItineraryPoint

    if (!isValidLatLng(selectedPoint)) return

    selectedItineraryPointLayer = L.marker(toLatLng(selectedPoint), {
      icon: createItineraryIcon({
        L,
        type: "selected",
        label: selectedPoint.index ?? "•",
        selected: true,
      }),
      zIndexOffset: 1200,
    }).bindTooltip(buildItineraryTooltip(selectedPoint, "Punto seleccionado"), {
      direction: "top",
      className: "sinergy-geofence-tooltip",
    })

    selectedItineraryPointLayer.addTo(layers.itineraryLayer)
  }

  const renderMovingRoutePoints = ({ points, routeColor }) => {
    if (!layers.itineraryLayer) return
    if (!points.length || points.length > 120) return

    points.forEach((point, pointIndex) => {
      const isIntermediate = pointIndex > 0 && pointIndex < points.length - 1
      const isMoving = Number(point.speed) > 0

      if (!isIntermediate || !isMoving) return

      addRouteLayer(
        L.circleMarker(toLatLng(point), {
          radius: 2.6,
          color: "#ffffff",
          weight: 1.2,
          fillColor: routeColor,
          fillOpacity: 0.78,
          opacity: 1,
          interactive: false,
          renderer: getRenderer(),
        }),
      )
    })
  }

  const renderStopMarkers = ({ points, firstPoint, lastPoint }) => {
    if (!layers.itineraryLayer) return

    points
      .filter((point) => {
        const isFirst = point.id === firstPoint?.id
        const isLast = point.id === lastPoint?.id
        const isStop = Number(point.speed) === 0

        return isStop && !isFirst && !isLast
      })
      .slice(0, ITINERARY_MAX_STOP_MARKERS)
      .forEach((point) => {
        addRouteLayer(
          L.marker(toLatLng(point), {
            icon: createItineraryIcon({
              L,
              type: "stop",
              label: "",
            }),
            zIndexOffset: 850,
          }).bindTooltip(buildItineraryTooltip(point, "Parada"), {
            direction: "top",
            className: "sinergy-geofence-tooltip",
          }),
        )
      })
  }

  const renderRouteEndpointMarkers = ({ firstPoint, lastPoint }) => {
    if (firstPoint) {
      addRouteLayer(
        L.marker(toLatLng(firstPoint), {
          icon: createItineraryIcon({
            L,
            type: "start",
            label: "I",
          }),
          zIndexOffset: 900,
        }).bindTooltip(buildItineraryTooltip(firstPoint, "Inicio"), {
          direction: "top",
          className: "sinergy-geofence-tooltip",
        }),
      )
    }

    if (lastPoint && lastPoint.id !== firstPoint?.id) {
      addRouteLayer(
        L.marker(toLatLng(lastPoint), {
          icon: createItineraryIcon({
            L,
            type: "end",
            label: "F",
          }),
          zIndexOffset: 900,
        }).bindTooltip(buildItineraryTooltip(lastPoint, "Fin"), {
          direction: "top",
          className: "sinergy-geofence-tooltip",
        }),
      )
    }
  }

  const renderItineraryRoute = ({ fit = false } = {}) => {
    const measure = startDevMeasure(RENDER_ITINERARY_ROUTE_MEASURE)

    try {
      const map = getMap()

      if (!map || !layers.itineraryLayer) return

      clearItineraryRouteLayers()

      const route = props.itineraryRoute
      const routes = getItineraryRoutes()

      if (!route || !routes.length) {
        clearSelectedItineraryPoint()
        return
      }

      const zoom = map.getZoom?.() ?? 0
      const showRouteDetails = zoom >= ITINERARY_MIN_DETAIL_ZOOM
      const allLatLngs = []

      routes.forEach((currentRoute, routeIndex) => {
        const points = currentRoute.points
        const latLngs = points.map(toLatLng)
        const routePalette = getItineraryRoutePalette(routeIndex)
        const routeColor = routePalette.main
        const routeFlowColor = routePalette.flow

        allLatLngs.push(...latLngs)

        if (latLngs.length >= 2) {
          const styles = createItineraryRouteStyles({
            index: routeIndex,
            renderer: getRenderer(),
          })

          addRouteLayer(L.polyline(latLngs, styles.halo))
          addRouteLayer(L.polyline(latLngs, styles.base))
          addRouteLayer(L.polyline(latLngs, styles.main))
          addRouteLayer(L.polyline(latLngs, styles.flow))

          if (showRouteDetails) {
            renderRouteDirectionArrows({
              points,
              routeColor: routeFlowColor,
            })

            renderMovingRoutePoints({
              points,
              routeColor,
            })
          }
        }

        const firstPoint = points[0]
        const lastPoint = points[points.length - 1]

        renderRouteEndpointMarkers({
          firstPoint,
          lastPoint,
        })

        if (showRouteDetails) {
          renderStopMarkers({
            points,
            firstPoint,
            lastPoint,
          })
        }
      })

      renderSelectedItineraryPoint()

      if (fit && allLatLngs.length) {
        if (allLatLngs.length === 1) {
          map.setView(allLatLngs[0], 16, {
            animate: false,
          })

          return
        }

        const bounds = L.latLngBounds(allLatLngs)

        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [45, 45],
            maxZoom: 16,
            animate: false,
          })
        }
      }
    } finally {
      endDevMeasure(measure)
    }
  }

  const centerItineraryPoint = () => {
    const map = getMap()

    if (!map || !isValidLatLng(props.selectedItineraryPoint)) return

    map.flyTo(toLatLng(props.selectedItineraryPoint), 16, {
      duration: 0.25,
    })
  }

  return {
    ensureItineraryMapStyles,
    clearItineraryRoute,
    renderItineraryRoute,
    renderSelectedItineraryPoint,
    centerItineraryPoint,
  }
}
