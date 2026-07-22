import { MOVEMENT_TRAIL_VIEWPORT_PADDING } from "./movementTrailConstants.js"

export function createMovementTrailViewportController({ getMap, scheduleRender }) {
  let boundViewportMap = null

  const getViewportBounds = () => {
    const map = getMap()
    const bounds = map?.getBounds?.()

    if (!bounds) return null

    if (typeof bounds.pad === "function") {
      return bounds.pad(MOVEMENT_TRAIL_VIEWPORT_PADDING)
    }

    return bounds
  }

  const trailHasPointInsideViewport = (trail, viewportBounds) => {
    if (!trail || !viewportBounds) return true

    const points = trail.renderPoints?.length ? trail.renderPoints : trail.rawPoints

    if (!points?.length) return false

    const lastPoint = points[points.length - 1]

    if (lastPoint && viewportBounds.contains(lastPoint)) {
      return true
    }

    return points.some((point) => viewportBounds.contains(point))
  }

  const bindMovementTrailViewportEvents = (map) => {
    if (!map || boundViewportMap === map) return

    if (boundViewportMap) {
      boundViewportMap.off("moveend zoomend resize", scheduleRender)
    }

    boundViewportMap = map
    boundViewportMap.on("moveend zoomend resize", scheduleRender)
  }

  const unbindMovementTrailViewportEvents = () => {
    if (!boundViewportMap) return

    boundViewportMap.off("moveend zoomend resize", scheduleRender)
    boundViewportMap = null
  }

  return {
    bindMovementTrailViewportEvents,
    getViewportBounds,
    trailHasPointInsideViewport,
    unbindMovementTrailViewportEvents,
  }
}
