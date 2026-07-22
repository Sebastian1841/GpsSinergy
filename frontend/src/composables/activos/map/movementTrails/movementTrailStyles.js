const MOVEMENT_TRAIL_COLOR = "#FF6600"
const MOVEMENT_TRAIL_HALO_COLOR = "#102372"
const MOVEMENT_TRAIL_WEIGHT = 3
const MOVEMENT_TRAIL_HALO_WEIGHT = 7

const MOVEMENT_TRAIL_SATELLITE_HALO_COLOR = "#ffffff"
const MOVEMENT_TRAIL_SATELLITE_CORE_COLOR = "#FF7A1A"

export function createMovementTrailStyleController({ L, getMapType }) {
  let cachedStartIcon = null
  let cachedStartIconSignature = ""

  const getMovementTrailStyle = () => {
    const isSatellite = getMapType() === "satellite"

    if (isSatellite) {
      return {
        haloColor: MOVEMENT_TRAIL_SATELLITE_HALO_COLOR,
        haloWeight: 9,
        haloOpacity: 0.72,
        coreColor: MOVEMENT_TRAIL_SATELLITE_CORE_COLOR,
        coreWeight: 4,
        coreOpacity: 0.95,
        startBorderColor: MOVEMENT_TRAIL_SATELLITE_CORE_COLOR,
        startBackground: "#ffffff",
        startShadow: "0 2px 8px rgba(0, 0, 0, 0.45)",
      }
    }

    return {
      haloColor: MOVEMENT_TRAIL_HALO_COLOR,
      haloWeight: MOVEMENT_TRAIL_HALO_WEIGHT,
      haloOpacity: 0.1,
      coreColor: MOVEMENT_TRAIL_COLOR,
      coreWeight: MOVEMENT_TRAIL_WEIGHT,
      coreOpacity: 0.68,
      startBorderColor: MOVEMENT_TRAIL_COLOR,
      startBackground: "#ffffff",
      startShadow: "0 2px 6px rgba(16, 35, 114, 0.22)",
    }
  }

  const getTrailStyleSignature = (trailStyle) => {
    return [
      trailStyle.haloColor,
      trailStyle.haloWeight,
      trailStyle.haloOpacity,
      trailStyle.coreColor,
      trailStyle.coreWeight,
      trailStyle.coreOpacity,
      trailStyle.startBorderColor,
      trailStyle.startBackground,
      trailStyle.startShadow,
      getMapType(),
    ].join(":")
  }

  const getTrailStartIcon = (trailStyle, styleSignature) => {
    if (cachedStartIcon && cachedStartIconSignature === styleSignature) {
      return cachedStartIcon
    }

    const size = getMapType() === "satellite" ? 12 : 10
    const half = size / 2

    cachedStartIcon = L.divIcon({
      className: "",
      html: `
        <div
          style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 999px;
            background: ${trailStyle.startBackground};
            border: 2px solid ${trailStyle.startBorderColor};
            box-shadow: ${trailStyle.startShadow};
          "
        ></div>
      `,
      iconSize: [size, size],
      iconAnchor: [half, half],
    })

    cachedStartIconSignature = styleSignature

    return cachedStartIcon
  }

  return {
    getMovementTrailStyle,
    getTrailStartIcon,
    getTrailStyleSignature,
  }
}
