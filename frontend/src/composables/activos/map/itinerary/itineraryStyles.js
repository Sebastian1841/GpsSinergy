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

export const getItineraryRoutePalette = (index = 0) => {
  return itineraryRoutePalette[index % itineraryRoutePalette.length]
}

export const createItineraryRouteStyles = ({ index = 0, renderer = null } = {}) => {
  const palette = getItineraryRoutePalette(index)

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

export const ensureItineraryMapStyles = () => {
  if (typeof document === "undefined") return

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
