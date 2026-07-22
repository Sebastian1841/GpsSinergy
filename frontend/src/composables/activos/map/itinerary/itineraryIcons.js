const itineraryIconStyles = {
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

export const createItineraryIcon = ({ L, type = "point", label = "", selected = false } = {}) => {
  const current = selected
    ? itineraryIconStyles.selected
    : itineraryIconStyles[type] || itineraryIconStyles.point
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

export const createRouteArrowIcon = ({ L, color, angle }) => {
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
