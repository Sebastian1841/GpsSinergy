const escapeHtml = (value) => {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }

    return entities[character]
  })
}

const toFiniteNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

const toRad = (value) => {
  return (Number(value) * Math.PI) / 180
}

const SNAPSHOT_WIDTH = 900
const SNAPSHOT_HEIGHT = 320
const SNAPSHOT_PADDING = 34
const SNAPSHOT_POINT_LIMIT = 280
const SNAPSHOT_DEVIATION_POINT_LIMIT = 80
const SNAPSHOT_TILE_SIZE = 256
const SNAPSHOT_MIN_ZOOM = 3
const SNAPSHOT_MAX_ZOOM = 17
const SNAPSHOT_MAX_MERCATOR_LAT = 85.05112878
const SNAPSHOT_TILE_SUBDOMAINS = ["a", "b", "c", "d"]

const hasCoordinates = (point) => {
  return toFiniteNumber(point?.lat) !== null && toFiniteNumber(point?.lng) !== null
}

const normalizeSnapshotPoint = (point) => {
  return {
    ...point,
    lat: Number(point.lat),
    lng: Number(point.lng),
  }
}

const getSnapshotPoints = (points = []) => {
  return points.filter(hasCoordinates).map(normalizeSnapshotPoint)
}

const sampleSnapshotPoints = (points = [], limit = SNAPSHOT_POINT_LIMIT) => {
  const validPoints = getSnapshotPoints(points)

  if (validPoints.length <= limit) return validPoints
  if (limit <= 2) return [validPoints[0], validPoints[validPoints.length - 1]]

  const lastIndex = validPoints.length - 1
  const step = lastIndex / (limit - 1)

  return Array.from({ length: limit }, (_item, index) => {
    return validPoints[Math.round(index * step)]
  })
}

const getDeviationSnapshotPoints = (deviations = []) => {
  return deviations.flatMap((deviation) => {
    return [deviation.startPoint, deviation.maxPoint, deviation.endPoint].filter(hasCoordinates)
  })
}

const getSnapshotBounds = (points = []) => {
  const validPoints = getSnapshotPoints(points)

  if (!validPoints.length) return null

  const bounds = validPoints.reduce(
    (currentBounds, point) => {
      return {
        minLat: Math.min(currentBounds.minLat, point.lat),
        maxLat: Math.max(currentBounds.maxLat, point.lat),
        minLng: Math.min(currentBounds.minLng, point.lng),
        maxLng: Math.max(currentBounds.maxLng, point.lng),
      }
    },
    {
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
      minLng: Number.POSITIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY,
    },
  )

  const latSpan = bounds.maxLat - bounds.minLat
  const lngSpan = bounds.maxLng - bounds.minLng
  const fallbackSpan = 0.002

  return {
    minLat: latSpan === 0 ? bounds.minLat - fallbackSpan : bounds.minLat,
    maxLat: latSpan === 0 ? bounds.maxLat + fallbackSpan : bounds.maxLat,
    minLng: lngSpan === 0 ? bounds.minLng - fallbackSpan : bounds.minLng,
    maxLng: lngSpan === 0 ? bounds.maxLng + fallbackSpan : bounds.maxLng,
  }
}

const clampNumber = (value, min, max) => {
  return Math.min(max, Math.max(min, value))
}

const latLngToWorldPixel = (point, zoom) => {
  const scale = SNAPSHOT_TILE_SIZE * 2 ** zoom
  const lat = clampNumber(Number(point.lat), -SNAPSHOT_MAX_MERCATOR_LAT, SNAPSHOT_MAX_MERCATOR_LAT)
  const lng = Number(point.lng)
  const sinLat = Math.sin(toRad(lat))

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  }
}

const getSnapshotZoom = (bounds) => {
  const innerWidth = SNAPSHOT_WIDTH - SNAPSHOT_PADDING * 2
  const innerHeight = SNAPSHOT_HEIGHT - SNAPSHOT_PADDING * 2

  for (let zoom = SNAPSHOT_MAX_ZOOM; zoom >= SNAPSHOT_MIN_ZOOM; zoom -= 1) {
    const northWest = latLngToWorldPixel(
      {
        lat: bounds.maxLat,
        lng: bounds.minLng,
      },
      zoom,
    )
    const southEast = latLngToWorldPixel(
      {
        lat: bounds.minLat,
        lng: bounds.maxLng,
      },
      zoom,
    )
    const width = Math.abs(southEast.x - northWest.x)
    const height = Math.abs(southEast.y - northWest.y)

    if (width <= innerWidth && height <= innerHeight) {
      return zoom
    }
  }

  return SNAPSHOT_MIN_ZOOM
}

const getSnapshotCenter = (bounds, zoom) => {
  const northWest = latLngToWorldPixel(
    {
      lat: bounds.maxLat,
      lng: bounds.minLng,
    },
    zoom,
  )
  const southEast = latLngToWorldPixel(
    {
      lat: bounds.minLat,
      lng: bounds.maxLng,
    },
    zoom,
  )

  return {
    x: (northWest.x + southEast.x) / 2,
    y: (northWest.y + southEast.y) / 2,
  }
}

const createSnapshotProjector = ({ center, zoom }) => {
  return (point) => {
    const projectedPoint = latLngToWorldPixel(point, zoom)

    return {
      x: SNAPSHOT_WIDTH / 2 + (projectedPoint.x - center.x),
      y: SNAPSHOT_HEIGHT / 2 + (projectedPoint.y - center.y),
    }
  }
}

const getSnapshotTileUrl = ({ x, y, zoom }) => {
  const subdomain = SNAPSHOT_TILE_SUBDOMAINS[Math.abs(x + y) % SNAPSHOT_TILE_SUBDOMAINS.length]

  return `https://${subdomain}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png`
}

const buildSnapshotTileImages = ({ center, zoom }) => {
  const tileCount = 2 ** zoom
  const minPixelX = center.x - SNAPSHOT_WIDTH / 2
  const maxPixelX = center.x + SNAPSHOT_WIDTH / 2
  const minPixelY = center.y - SNAPSHOT_HEIGHT / 2
  const maxPixelY = center.y + SNAPSHOT_HEIGHT / 2
  const minTileX = Math.floor(minPixelX / SNAPSHOT_TILE_SIZE)
  const maxTileX = Math.floor(maxPixelX / SNAPSHOT_TILE_SIZE)
  const minTileY = Math.max(0, Math.floor(minPixelY / SNAPSHOT_TILE_SIZE))
  const maxTileY = Math.min(tileCount - 1, Math.floor(maxPixelY / SNAPSHOT_TILE_SIZE))
  const tiles = []

  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    const normalizedTileX = ((tileX % tileCount) + tileCount) % tileCount

    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      tiles.push(`
        <image
          class="snapshot-tile"
          crossorigin="anonymous"
          href="${getSnapshotTileUrl({
            x: normalizedTileX,
            y: tileY,
            zoom,
          })}"
          x="${(tileX * SNAPSHOT_TILE_SIZE - minPixelX).toFixed(1)}"
          y="${(tileY * SNAPSHOT_TILE_SIZE - minPixelY).toFixed(1)}"
          width="${SNAPSHOT_TILE_SIZE}"
          height="${SNAPSHOT_TILE_SIZE}"
          preserveAspectRatio="none"
        />
      `)
    }
  }

  return tiles.join("")
}

const buildSnapshotPolyline = ({ points, projectPoint, className }) => {
  if (points.length < 2) return ""

  const pointList = points
    .map((point) => {
      const projectedPoint = projectPoint(point)

      return `${projectedPoint.x.toFixed(1)},${projectedPoint.y.toFixed(1)}`
    })
    .join(" ")

  return `<polyline class="${className}" points="${pointList}" />`
}

const buildOffRouteSnapshotSegments = (actualPoints = []) => {
  const segments = []
  let currentSegment = []

  getSnapshotPoints(actualPoints).forEach((point) => {
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

  return segments
}

const buildSnapshotMarkers = ({ points, projectPoint, className, label }) => {
  return points
    .filter(hasCoordinates)
    .map((point) => {
      const projectedPoint = projectPoint(normalizeSnapshotPoint(point))

      return `
        <g>
          <circle class="${className}" cx="${projectedPoint.x.toFixed(1)}" cy="${projectedPoint.y.toFixed(
            1,
          )}" r="5.5" />
          ${
            label
              ? `<text class="snapshot-marker-label" x="${(projectedPoint.x + 8).toFixed(
                  1,
                )}" y="${(projectedPoint.y - 8).toFixed(1)}">${escapeHtml(label)}</text>`
              : ""
          }
        </g>
      `
    })
    .join("")
}

const buildSnapshotGrid = () => {
  const verticalLines = Array.from({ length: 9 }, (_item, index) => {
    const x = SNAPSHOT_PADDING + ((SNAPSHOT_WIDTH - SNAPSHOT_PADDING * 2) / 8) * index

    return `<line class="snapshot-grid-line" x1="${x.toFixed(1)}" y1="${SNAPSHOT_PADDING}" x2="${x.toFixed(
      1,
    )}" y2="${SNAPSHOT_HEIGHT - SNAPSHOT_PADDING}" />`
  }).join("")

  const horizontalLines = Array.from({ length: 5 }, (_item, index) => {
    const y = SNAPSHOT_PADDING + ((SNAPSHOT_HEIGHT - SNAPSHOT_PADDING * 2) / 4) * index

    return `<line class="snapshot-grid-line" x1="${SNAPSHOT_PADDING}" y1="${y.toFixed(
      1,
    )}" x2="${SNAPSHOT_WIDTH - SNAPSHOT_PADDING}" y2="${y.toFixed(1)}" />`
  }).join("")

  return `${verticalLines}${horizontalLines}`
}

export const buildRouteComparisonSnapshotSvg = (comparison = {}) => {
  const plannedPoints = sampleSnapshotPoints(comparison.plannedPoints || [])
  const actualPoints = sampleSnapshotPoints(comparison.actualPoints || [])
  const deviationPoints = sampleSnapshotPoints(
    getDeviationSnapshotPoints(comparison.deviations || []),
    SNAPSHOT_DEVIATION_POINT_LIMIT,
  )
  const allPoints = [...plannedPoints, ...actualPoints, ...deviationPoints]
  const bounds = getSnapshotBounds(allPoints)

  if (!bounds) {
    return `
      <svg class="snapshot-map" viewBox="0 0 ${SNAPSHOT_WIDTH} ${SNAPSHOT_HEIGHT}" role="img" aria-label="Comparación de rutas">
        <rect class="snapshot-background" x="0" y="0" width="${SNAPSHOT_WIDTH}" height="${SNAPSHOT_HEIGHT}" rx="14" />
        <text class="snapshot-empty" x="${SNAPSHOT_WIDTH / 2}" y="${SNAPSHOT_HEIGHT / 2}">
          No hay coordenadas suficientes para dibujar la comparación.
        </text>
      </svg>
    `
  }

  const zoom = getSnapshotZoom(bounds)
  const center = getSnapshotCenter(bounds, zoom)
  const projectPoint = createSnapshotProjector({
    center,
    zoom,
  })
  const offRouteSegments = buildOffRouteSnapshotSegments(actualPoints)
  const startPoint = plannedPoints[0] || actualPoints[0]
  const endPoint = plannedPoints[plannedPoints.length - 1] || actualPoints[actualPoints.length - 1]

  return `
    <svg class="snapshot-map" viewBox="0 0 ${SNAPSHOT_WIDTH} ${SNAPSHOT_HEIGHT}" role="img" aria-label="Comparación de rutas">
      <rect class="snapshot-background" x="0" y="0" width="${SNAPSHOT_WIDTH}" height="${SNAPSHOT_HEIGHT}" rx="14" />
      <clipPath id="snapshot-map-clip">
        <rect x="0" y="0" width="${SNAPSHOT_WIDTH}" height="${SNAPSHOT_HEIGHT}" rx="14" />
      </clipPath>
      <g clip-path="url(#snapshot-map-clip)">
        ${buildSnapshotTileImages({
          center,
          zoom,
        })}
      </g>
      <rect class="snapshot-map-soft-overlay" x="0" y="0" width="${SNAPSHOT_WIDTH}" height="${SNAPSHOT_HEIGHT}" rx="14" />
      ${buildSnapshotGrid()}
      ${buildSnapshotPolyline({
        points: plannedPoints,
        projectPoint,
        className: "snapshot-route-planned",
      })}
      ${buildSnapshotPolyline({
        points: actualPoints,
        projectPoint,
        className: "snapshot-route-actual",
      })}
      ${offRouteSegments
        .map((segment) => {
          return buildSnapshotPolyline({
            points: segment,
            projectPoint,
            className: "snapshot-route-deviation",
          })
        })
        .join("")}
      ${buildSnapshotMarkers({
        points: deviationPoints,
        projectPoint,
        className: "snapshot-marker-deviation",
      })}
      ${startPoint ? buildSnapshotMarkers({ points: [startPoint], projectPoint, className: "snapshot-marker-start", label: "Inicio" }) : ""}
      ${endPoint ? buildSnapshotMarkers({ points: [endPoint], projectPoint, className: "snapshot-marker-end", label: "Fin" }) : ""}
      <text class="snapshot-attribution" x="${SNAPSHOT_WIDTH - 12}" y="${SNAPSHOT_HEIGHT - 10}">
        &copy; OpenStreetMap &copy; CARTO
      </text>
    </svg>
  `
}
