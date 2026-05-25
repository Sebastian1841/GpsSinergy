import L from "leaflet"

const itineraryRoutePalette = [
  {
    main: "#102372",
    flow: "#FF6600",
  },
  {
    main: "#1e3a8a",
    flow: "#FF6600",
  },
  {
    main: "#334155",
    flow: "#FF6600",
  },
  {
    main: "#475569",
    flow: "#FF6600",
  },
  {
    main: "#0f172a",
    flow: "#FF6600",
  },
  {
    main: "#1d4ed8",
    flow: "#FF6600",
  },
]

const toRad = (value) => (value * Math.PI) / 180
const toDeg = (value) => (value * 180) / Math.PI

const isValidLatLng = (point) => {
  if (!point) return false

  const lat = Number(point.lat)
  const lng = Number(point.lng)

  return Number.isFinite(lat) && Number.isFinite(lng)
}

const toLatLng = (point) => {
  return [Number(point.lat), Number(point.lng)]
}

const getBearing = (fromPoint, toPoint) => {
  const lat1 = toRad(Number(fromPoint.lat))
  const lat2 = toRad(Number(toPoint.lat))
  const deltaLng = toRad(Number(toPoint.lng) - Number(fromPoint.lng))

  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

const getItineraryRoutePalette = (index = 0) => {
  return itineraryRoutePalette[index % itineraryRoutePalette.length]
}

const getItineraryRouteColor = (index = 0) => {
  return getItineraryRoutePalette(index).main
}

const createItineraryIcon = ({
  type = "point",
  label = "",
  selected = false,
} = {}) => {
  const styles = {
    start: {
      bg: "#16a34a",
      color: "#ffffff",
      border: "#ffffff",
      shadow: "rgba(22, 163, 74, 0.35)",
    },
    end: {
      bg: "#ef4444",
      color: "#ffffff",
      border: "#ffffff",
      shadow: "rgba(239, 68, 68, 0.35)",
    },
    stop: {
      bg: "#FF6600",
      color: "#ffffff",
      border: "#ffffff",
      shadow: "rgba(255, 102, 0, 0.28)",
    },
    point: {
      bg: "#102372",
      color: "#ffffff",
      border: "#ffffff",
      shadow: "rgba(16, 35, 114, 0.35)",
    },
    selected: {
      bg: "#ffffff",
      color: "#102372",
      border: "#FF6600",
      shadow: "rgba(255, 102, 0, 0.5)",
    },
  }

  const current = selected ? styles.selected : styles[type] || styles.point
  const size = selected ? 30 : type === "stop" ? 16 : 26
  const fontSize = selected ? 12 : type === "stop" ? 0 : 11
  const pulseClass = selected ? "sinergy-itinerary-selected-point" : ""

  return L.divIcon({
    className: "",
    html: `
      <div
        class="${pulseClass}"
        style="
          width:${size}px;
          height:${size}px;
          border-radius:999px;
          background:${current.bg};
          color:${current.color};
          border:${type === "stop" ? 2 : 3}px solid ${current.border};
          box-shadow:0 8px 20px ${current.shadow};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${fontSize}px;
          font-weight:900;
          line-height:1;
        "
      >
        ${label}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const createRouteArrowIcon = (color, angle) => {
  return L.divIcon({
    className: "",
    html: `
      <div
        class="sinergy-route-arrow"
        style="
          --route-color:${color};
          transform:rotate(${angle}deg);
        "
      ></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

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

export function createItineraryMapController({
  props,
  getMap,
  getRenderer,
  layers,
}) {
  const createItineraryRouteStyles = (index = 0) => {
    const palette = getItineraryRoutePalette(index)
    const renderer = getRenderer()

    return {
      halo: {
        color: "#0f172a",
        weight: 11,
        opacity: 0.11,
        lineCap: "round",
        lineJoin: "round",
        smoothFactor: 1.4,
        interactive: false,
        renderer,
      },
      base: {
        color: "#ffffff",
        weight: 8,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
        smoothFactor: 1.4,
        interactive: false,
        renderer,
      },
      main: {
        color: palette.main,
        weight: 4.8,
        opacity: 0.96,
        lineCap: "round",
        lineJoin: "round",
        smoothFactor: 1.4,
        interactive: false,
        className: "sinergy-itinerary-route-main",
        renderer,
      },
      flow: {
        color: palette.flow,
        weight: 2.25,
        opacity: 0.9,
        dashArray: "2 15",
        lineCap: "round",
        lineJoin: "round",
        smoothFactor: 1.4,
        interactive: false,
        className: "sinergy-itinerary-route-flow",
        renderer,
      },
    }
  }

  const ensureItineraryMapStyles = () => {
    const styleId = "sinergy-itinerary-map-styles"
    let style = document.getElementById(styleId)

    if (!style) {
      style = document.createElement("style")
      style.id = styleId
      document.head.appendChild(style)
    }

    style.textContent = `
      @keyframes sinergyRouteFlow {
        from { stroke-dashoffset: 0; }
        to { stroke-dashoffset: -52; }
      }

      @keyframes sinergySelectedPulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 102, 0, 0.42); }
        70% { transform: scale(1.04); box-shadow: 0 0 0 10px rgba(255, 102, 0, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 102, 0, 0); }
      }

      .sinergy-itinerary-route-main {
        filter: drop-shadow(0 2px 5px rgba(15, 23, 42, 0.18));
        pointer-events: none;
      }

      .sinergy-itinerary-route-flow {
        animation: sinergyRouteFlow 1.15s linear infinite;
        pointer-events: none;
      }

      .sinergy-route-arrow {
        width: 16px;
        height: 16px;
        border-radius: 999px;
        background: #ffffff;
        box-shadow: 0 6px 14px rgba(15, 23, 42, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sinergy-route-arrow::before {
        content: "";
        width: 0;
        height: 0;
        margin-left: 2px;
        border-left: 7px solid var(--route-color);
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
      }

      .sinergy-itinerary-selected-point {
        animation: sinergySelectedPulse 1.35s ease-out infinite;
      }
    `
  }

  const getItineraryRoutes = () => {
    const route = props.itineraryRoute

    if (!route) return []

    const sourceRoutes = Array.isArray(route.routes) && route.routes.length
      ? route.routes
      : [route]

    return sourceRoutes
      .map((item, index) => {
        const points = (item.points || item.rows || []).filter(isValidLatLng)

        return {
          ...item,
          index,
          points,
          asset: item.asset || route.asset,
          summary: item.summary || route.summary,
        }
      })
      .filter((item) => item.points.length)
  }

  const clearItineraryRoute = () => {
    layers.itineraryLayer?.clearLayers()
  }

  const renderRouteDirectionArrows = ({ points, routeColor }) => {
    if (!layers.itineraryLayer) return
    if (!points.length || points.length < 3) return

    const maxArrows = 4
    const step = Math.max(2, Math.floor(points.length / (maxArrows + 1)))

    for (let index = step; index < points.length - 1; index += step) {
      const previousPoint = points[index - 1]
      const currentPoint = points[index]

      if (!isValidLatLng(previousPoint) || !isValidLatLng(currentPoint)) continue

      const angle = getBearing(previousPoint, currentPoint)

      L.marker(toLatLng(currentPoint), {
        icon: createRouteArrowIcon(routeColor, angle),
        interactive: false,
        zIndexOffset: 760,
      }).addTo(layers.itineraryLayer)
    }
  }

  const renderItineraryRoute = ({ fit = false } = {}) => {
    const map = getMap()

    if (!map || !layers.itineraryLayer) return

    layers.itineraryLayer.clearLayers()

    const route = props.itineraryRoute
    const routes = getItineraryRoutes()

    if (!route || !routes.length) return

    const allLatLngs = []

    routes.forEach((currentRoute, routeIndex) => {
      const points = currentRoute.points
      const latLngs = points.map(toLatLng)
      const routePalette = getItineraryRoutePalette(routeIndex)
      const routeColor = routePalette.main
      const routeFlowColor = routePalette.flow

      allLatLngs.push(...latLngs)

      if (latLngs.length >= 2) {
        const styles = createItineraryRouteStyles(routeIndex)

        L.polyline(latLngs, styles.halo).addTo(layers.itineraryLayer)
        L.polyline(latLngs, styles.base).addTo(layers.itineraryLayer)
        L.polyline(latLngs, styles.main).addTo(layers.itineraryLayer)
        L.polyline(latLngs, styles.flow).addTo(layers.itineraryLayer)

        renderRouteDirectionArrows({
          points,
          routeColor: routeFlowColor,
        })

        if (points.length <= 120) {
          points.forEach((point, pointIndex) => {
            const isIntermediate = pointIndex > 0 && pointIndex < points.length - 1
            const isMoving = Number(point.speed) > 0

            if (!isIntermediate || !isMoving) return

            L.circleMarker(toLatLng(point), {
              radius: 2.6,
              color: "#ffffff",
              weight: 1.2,
              fillColor: routeColor,
              fillOpacity: 0.78,
              opacity: 1,
              interactive: false,
              renderer: getRenderer(),
            }).addTo(layers.itineraryLayer)
          })
        }
      }

      const firstPoint = points[0]
      const lastPoint = points[points.length - 1]

      if (firstPoint) {
        L.marker(toLatLng(firstPoint), {
          icon: createItineraryIcon({
            type: "start",
            label: "I",
          }),
          zIndexOffset: 900,
        })
          .bindTooltip(buildItineraryTooltip(firstPoint, "Inicio"), {
            direction: "top",
            className: "sinergy-geofence-tooltip",
          })
          .addTo(layers.itineraryLayer)
      }

      if (lastPoint && lastPoint.id !== firstPoint?.id) {
        L.marker(toLatLng(lastPoint), {
          icon: createItineraryIcon({
            type: "end",
            label: "F",
          }),
          zIndexOffset: 900,
        })
          .bindTooltip(buildItineraryTooltip(lastPoint, "Fin"), {
            direction: "top",
            className: "sinergy-geofence-tooltip",
          })
          .addTo(layers.itineraryLayer)
      }

      points.forEach((point) => {
        const isFirst = point.id === firstPoint?.id
        const isLast = point.id === lastPoint?.id
        const isStop = Number(point.speed) === 0

        if (!isStop || isFirst || isLast) return

        L.marker(toLatLng(point), {
          icon: createItineraryIcon({
            type: "stop",
            label: "",
          }),
          zIndexOffset: 850,
        })
          .bindTooltip(buildItineraryTooltip(point, "Parada"), {
            direction: "top",
            className: "sinergy-geofence-tooltip",
          })
          .addTo(layers.itineraryLayer)
      })
    })

    const selectedPoint = props.selectedItineraryPoint

    if (isValidLatLng(selectedPoint)) {
      L.marker(toLatLng(selectedPoint), {
        icon: createItineraryIcon({
          type: "selected",
          label: selectedPoint.index || "•",
          selected: true,
        }),
        zIndexOffset: 1200,
      })
        .bindTooltip(buildItineraryTooltip(selectedPoint, "Punto seleccionado"), {
          direction: "top",
          className: "sinergy-geofence-tooltip",
        })
        .addTo(layers.itineraryLayer)
    }

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
    centerItineraryPoint,
  }
}