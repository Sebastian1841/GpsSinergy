import { ROUTE_COLORS, getRouteTripMapRoutes } from "./routeTripMapRouteUtils.js"
import { drawRouteTripMapChrome } from "./routeTripMapLegendUtils.js"
import { createRouteTripMapProjection } from "./routeTripMapProjectionUtils.js"
import { drawTiles } from "./routeTripMapTileUtils.js"

const DEFAULT_MAP_WIDTH = 1100
const DEFAULT_MAP_HEIGHT = 360

export { getRouteTripMapRoutes }

const canUseCanvas = () => {
  return (
    typeof document !== "undefined" &&
    typeof Image !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined"
  )
}

const drawFallbackMapBase = ({ context, width, height }) => {
  context.fillStyle = "#dbe5f0"
  context.fillRect(0, 0, width, height)

  context.strokeStyle = "rgba(16, 35, 114, 0.1)"
  context.lineWidth = 1

  for (let x = 0; x <= width; x += 64) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, height)
    context.stroke()
  }

  for (let y = 0; y <= height; y += 64) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  }

  context.strokeStyle = "rgba(255, 255, 255, 0.64)"
  context.lineWidth = 9
  ;[
    [
      [0, height * 0.28],
      [width * 0.32, height * 0.22],
      [width, height * 0.34],
    ],
    [
      [width * 0.12, height],
      [width * 0.46, height * 0.62],
      [width * 0.82, 0],
    ],
    [
      [0, height * 0.78],
      [width * 0.44, height * 0.66],
      [width, height * 0.76],
    ],
  ].forEach((line) => {
    context.beginPath()
    line.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    })
    context.stroke()
  })
}

const drawRoutePath = ({ context, route, projectPoint, strokeStyle, lineWidth, alpha = 1 }) => {
  if (!route.points.length) return

  context.save()
  context.globalAlpha = alpha
  context.strokeStyle = strokeStyle
  context.lineWidth = lineWidth
  context.lineCap = "round"
  context.lineJoin = "round"

  context.beginPath()
  route.points.forEach((point, index) => {
    const projectedPoint = projectPoint(point)

    if (index === 0) context.moveTo(projectedPoint.x, projectedPoint.y)
    else context.lineTo(projectedPoint.x, projectedPoint.y)
  })
  context.stroke()
  context.restore()
}

const drawRouteLine = ({ context, routes, projectPoint }) => {
  routes.forEach((route) => {
    drawRoutePath({
      context,
      route,
      projectPoint,
      strokeStyle: "rgba(255, 255, 255, 0.82)",
      lineWidth: 9,
    })
  })

  routes.forEach((route) => {
    drawRoutePath({
      context,
      route,
      projectPoint,
      strokeStyle: route.color || ROUTE_COLORS[0],
      lineWidth: 4.6,
      alpha: 0.96,
    })
  })
}

const drawMarkers = ({ context, routes, projectPoint }) => {
  routes.forEach((route) => {
    const startPoint = projectPoint(route.points[0])
    const endPoint = projectPoint(route.points.at(-1))

    ;[
      [startPoint, "#22c55e"],
      [endPoint, "#38bdf8"],
    ].forEach(([point, fillStyle]) => {
      context.beginPath()
      context.arc(point.x, point.y, 10, 0, Math.PI * 2)
      context.fillStyle = fillStyle
      context.fill()
      context.lineWidth = 4
      context.strokeStyle = "#ffffff"
      context.stroke()
    })
  })
}

const drawMapOverlay = ({ context, width, height }) => {
  context.fillStyle = "rgba(255, 255, 255, 0.13)"
  context.fillRect(0, 0, width, height)
}

const createCanvas = ({ width, height }) => {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) return null

  canvas.width = width
  canvas.height = height

  return {
    canvas,
    context,
  }
}

const drawRouteMap = async ({ routes, width, height, useTiles = true }) => {
  const canvasContext = createCanvas({ width, height })

  if (!canvasContext) return ""

  const { canvas, context } = canvasContext
  const projection = createRouteTripMapProjection({
    routes,
    width,
    height,
  })

  if (!projection) return ""

  const { center, projectPoint, zoom } = projection

  drawFallbackMapBase({ context, width, height })

  let usedTiles = false

  if (useTiles) {
    usedTiles = await drawTiles({
      context,
      center,
      zoom,
      width,
      height,
    })
  }

  drawMapOverlay({ context, width, height })
  drawRouteLine({ context, routes, projectPoint })
  drawMarkers({ context, routes, projectPoint })
  drawRouteTripMapChrome({ context, routes, width, height, usedTiles })

  return canvas.toDataURL("image/png")
}

export const buildRouteTripMapImageDataUrl = async (
  reportRows = [],
  { width = DEFAULT_MAP_WIDTH, height = DEFAULT_MAP_HEIGHT } = {},
) => {
  const routes = getRouteTripMapRoutes(reportRows)

  if (!routes.length || !canUseCanvas()) return ""

  try {
    return await drawRouteMap({
      routes,
      width,
      height,
      useTiles: true,
    })
  } catch {
    try {
      return await drawRouteMap({
        routes,
        width,
        height,
        useTiles: false,
      })
    } catch {
      return ""
    }
  }
}
