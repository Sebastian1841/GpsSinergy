import {
  MOVEMENT_TRAIL_MAX_BACKGROUND_RAW_POINTS,
  MOVEMENT_TRAIL_MAX_RENDER_POINTS,
} from "./movementTrailConstants.js"

export const buildRenderableTrailPoints = (points = []) => {
  if (!Array.isArray(points)) return []

  if (points.length <= MOVEMENT_TRAIL_MAX_RENDER_POINTS) {
    return [...points]
  }

  const renderPoints = []
  const lastIndex = points.length - 1
  const step = lastIndex / (MOVEMENT_TRAIL_MAX_RENDER_POINTS - 1)

  for (let index = 0; index < MOVEMENT_TRAIL_MAX_RENDER_POINTS; index += 1) {
    const pointIndex = Math.round(index * step)
    const point = points[pointIndex]

    if (point) {
      renderPoints.push(point)
    }
  }

  return renderPoints
}

export const trimRawTrailPoints = (
  points = [],
  maxPoints = MOVEMENT_TRAIL_MAX_BACKGROUND_RAW_POINTS,
) => {
  if (!Array.isArray(points)) return []

  if (points.length <= maxPoints) {
    return points
  }

  points.splice(0, points.length - maxPoints)

  return points
}
