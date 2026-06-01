const markerClass = (estado) => {
  const classes = {
    moving: "marker-moving",
    idle: "marker-idle",
    stopped: "marker-stopped",
    offline: "marker-offline",
  }

  return classes[estado] || "marker-offline"
}

export const createMarkerIcon = ({ L, activo, isSelected }) => {
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

export const createClusterIcon = ({ L, count }) => {
  const size = count >= 100 ? 50 : count >= 10 ? 44 : 38
  const half = size / 2
  const label = count > 999 ? "999+" : count

  return L.divIcon({
    className: "",
    html: `
      <div
        class="sinergy-marker-cluster"
        style="width:${size}px;height:${size}px;"
      >
        <span class="sinergy-marker-cluster__count">${label}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [half, half],
  })
}
