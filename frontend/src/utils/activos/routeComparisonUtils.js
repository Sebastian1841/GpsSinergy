const EARTH_RADIUS_METERS = 6371000
const DISTANCE_SEARCH_WINDOW = 36
const COARSE_SEGMENT_TARGET = 120

const toRad = (value) => (Number(value) * Math.PI) / 180

const isValidPoint = (point) => {
  return Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng))
}

export const haversineDistanceMeters = (pointA, pointB) => {
  if (!isValidPoint(pointA) || !isValidPoint(pointB)) return 0

  const lat1 = toRad(pointA.lat)
  const lat2 = toRad(pointB.lat)
  const deltaLat = toRad(pointB.lat - pointA.lat)
  const deltaLng = toRad(pointB.lng - pointA.lng)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const getRouteDistanceKm = (points = []) => {
  const validPoints = points.filter(isValidPoint)
  let distanceMeters = 0

  for (let index = 1; index < validPoints.length; index += 1) {
    distanceMeters += haversineDistanceMeters(validPoints[index - 1], validPoints[index])
  }

  return distanceMeters / 1000
}

const projectToMeters = (point, origin) => {
  const lat = Number(point.lat)
  const lng = Number(point.lng)
  const originLat = Number(origin.lat)
  const originLng = Number(origin.lng)
  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos(toRad(originLat))

  return {
    x: (lng - originLng) * metersPerDegreeLng,
    y: (lat - originLat) * metersPerDegreeLat,
  }
}

const distanceToSegmentMeters = (point, segmentStart, segmentEnd) => {
  const origin = segmentStart
  const projectedPoint = projectToMeters(point, origin)
  const projectedStart = { x: 0, y: 0 }
  const projectedEnd = projectToMeters(segmentEnd, origin)
  const segmentDx = projectedEnd.x - projectedStart.x
  const segmentDy = projectedEnd.y - projectedStart.y
  const segmentLengthSquared = segmentDx * segmentDx + segmentDy * segmentDy

  if (!segmentLengthSquared) {
    return haversineDistanceMeters(point, segmentStart)
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((projectedPoint.x - projectedStart.x) * segmentDx +
        (projectedPoint.y - projectedStart.y) * segmentDy) /
        segmentLengthSquared,
    ),
  )

  const closestPoint = {
    x: projectedStart.x + t * segmentDx,
    y: projectedStart.y + t * segmentDy,
  }

  return Math.hypot(projectedPoint.x - closestPoint.x, projectedPoint.y - closestPoint.y)
}

const distanceToProjectedSegmentMeters = (projectedPoint, segment) => {
  const segmentDx = segment.end.x - segment.start.x
  const segmentDy = segment.end.y - segment.start.y
  const segmentLengthSquared = segmentDx * segmentDx + segmentDy * segmentDy

  if (!segmentLengthSquared) {
    return Math.hypot(projectedPoint.x - segment.start.x, projectedPoint.y - segment.start.y)
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((projectedPoint.x - segment.start.x) * segmentDx +
        (projectedPoint.y - segment.start.y) * segmentDy) /
        segmentLengthSquared,
    ),
  )

  const closestPoint = {
    x: segment.start.x + t * segmentDx,
    y: segment.start.y + t * segmentDy,
  }

  return Math.hypot(projectedPoint.x - closestPoint.x, projectedPoint.y - closestPoint.y)
}

const buildProjectedRouteSegments = (routePoints = []) => {
  if (routePoints.length < 2) return []

  const origin = routePoints[0]
  const projectedPoints = routePoints.map((point) => projectToMeters(point, origin))

  return projectedPoints.slice(1).map((point, index) => {
    return {
      index,
      start: projectedPoints[index],
      end: point,
    }
  })
}

const findClosestProjectedSegment = ({ projectedPoint, segments, startIndex, endIndex }) => {
  let closestDistance = Number.POSITIVE_INFINITY
  let closestIndex = Math.max(0, startIndex)
  const normalizedStartIndex = Math.max(0, startIndex)
  const normalizedEndIndex = Math.min(segments.length - 1, endIndex)

  for (let index = normalizedStartIndex; index <= normalizedEndIndex; index += 1) {
    const distance = distanceToProjectedSegmentMeters(projectedPoint, segments[index])

    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  }

  return {
    distance: closestDistance,
    index: closestIndex,
  }
}

const findClosestCoarseProjectedSegment = (projectedPoint, segments = []) => {
  const step = Math.max(1, Math.floor(segments.length / COARSE_SEGMENT_TARGET))
  let closestDistance = Number.POSITIVE_INFINITY
  let closestIndex = 0

  for (let index = 0; index < segments.length; index += step) {
    const distance = distanceToProjectedSegmentMeters(projectedPoint, segments[index])

    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  }

  const lastIndex = segments.length - 1
  const lastDistance = distanceToProjectedSegmentMeters(projectedPoint, segments[lastIndex])

  if (lastDistance < closestDistance) {
    closestDistance = lastDistance
    closestIndex = lastIndex
  }

  return {
    distance: closestDistance,
    index: closestIndex,
  }
}

const createRouteDistanceResolver = ({ routePoints = [], toleranceMeters = 300 } = {}) => {
  const validRoutePoints = routePoints.filter(isValidPoint)

  if (validRoutePoints.length === 0) {
    return () => 0
  }

  if (validRoutePoints.length === 1) {
    return (point) => {
      return isValidPoint(point) ? haversineDistanceMeters(point, validRoutePoints[0]) : 0
    }
  }

  const origin = validRoutePoints[0]
  const segments = buildProjectedRouteSegments(validRoutePoints)
  let lastNearestSegmentIndex = 0
  const fallbackTriggerMeters = Math.max(120, Number(toleranceMeters || 0) * 0.85)

  return (point) => {
    if (!isValidPoint(point)) return 0

    const projectedPoint = projectToMeters(point, origin)

    if (segments.length <= DISTANCE_SEARCH_WINDOW * 2 + 1) {
      return findClosestProjectedSegment({
        projectedPoint,
        segments,
        startIndex: 0,
        endIndex: segments.length - 1,
      }).distance
    }

    const localResult = findClosestProjectedSegment({
      projectedPoint,
      segments,
      startIndex: lastNearestSegmentIndex - DISTANCE_SEARCH_WINDOW,
      endIndex: lastNearestSegmentIndex + DISTANCE_SEARCH_WINDOW,
    })

    let bestResult = localResult

    if (localResult.distance > fallbackTriggerMeters) {
      const coarseResult = findClosestCoarseProjectedSegment(projectedPoint, segments)
      const refinedResult = findClosestProjectedSegment({
        projectedPoint,
        segments,
        startIndex: coarseResult.index - DISTANCE_SEARCH_WINDOW,
        endIndex: coarseResult.index + DISTANCE_SEARCH_WINDOW,
      })

      if (refinedResult.distance < bestResult.distance) {
        bestResult = refinedResult
      }
    }

    lastNearestSegmentIndex = bestResult.index

    return bestResult.distance
  }
}

export const getDistanceToRouteMeters = (point, routePoints = []) => {
  const validRoutePoints = routePoints.filter(isValidPoint)

  if (!isValidPoint(point) || validRoutePoints.length === 0) return 0
  if (validRoutePoints.length === 1) return haversineDistanceMeters(point, validRoutePoints[0])

  return validRoutePoints.slice(1).reduce((closestDistance, routePoint, index) => {
    const distance = distanceToSegmentMeters(point, validRoutePoints[index], routePoint)

    return Math.min(closestDistance, distance)
  }, Number.POSITIVE_INFINITY)
}

const formatKm = (value) => `${Number(value || 0).toFixed(1)} km`
const formatMeters = (value) => `${Math.round(Number(value) || 0)} m`

const formatMinutes = (minutes) => {
  const normalizedMinutes = Math.max(0, Math.round(Number(minutes) || 0))
  const hours = Math.floor(normalizedMinutes / 60)
  const remainder = normalizedMinutes % 60

  if (!hours) return `${remainder} min`
  if (!remainder) return `${hours} h`

  return `${hours} h ${remainder} min`
}

const getMinutesBetween = (start, end) => {
  const startTime = new Date(start || "").getTime()
  const endTime = new Date(end || "").getTime()

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return 0

  return Math.max(0, (endTime - startTime) / 60000)
}

const buildDeviationGroups = (annotatedPoints = []) => {
  const groups = []
  let currentGroup = null

  annotatedPoints.forEach((point) => {
    if (!point.offRoute) {
      if (currentGroup) {
        groups.push(currentGroup)
        currentGroup = null
      }
      return
    }

    if (!currentGroup) {
      currentGroup = {
        id: `deviation-${groups.length + 1}`,
        points: [],
      }
    }

    currentGroup.points.push(point)
  })

  if (currentGroup) {
    groups.push(currentGroup)
  }

  return groups.map((group, index) => {
    const firstPoint = group.points[0]
    const lastPoint = group.points[group.points.length - 1]
    const maxPoint = group.points.reduce((currentMaxPoint, point) => {
      return Number(point.distanceToRouteMeters || 0) >
        Number(currentMaxPoint.distanceToRouteMeters || 0)
        ? point
        : currentMaxPoint
    }, firstPoint)
    const maxDistanceMeters = Number(maxPoint?.distanceToRouteMeters || 0)
    const averageDistanceMeters =
      group.points.reduce((total, point) => {
        return total + Number(point.distanceToRouteMeters || 0)
      }, 0) / Math.max(1, group.points.length)
    const durationMinutes = getMinutesBetween(firstPoint?.timestamp, lastPoint?.timestamp)

    return {
      id: group.id,
      label: `Desvio ${index + 1}`,
      startTime: firstPoint?.timeLabel || "-",
      endTime: lastPoint?.timeLabel || firstPoint?.timeLabel || "-",
      startPoint: firstPoint
        ? {
            lat: firstPoint.lat,
            lng: firstPoint.lng,
            timestamp: firstPoint.timestamp,
            timeLabel: firstPoint.timeLabel,
            distanceToRouteMeters: firstPoint.distanceToRouteMeters,
          }
        : null,
      endPoint: lastPoint
        ? {
            lat: lastPoint.lat,
            lng: lastPoint.lng,
            timestamp: lastPoint.timestamp,
            timeLabel: lastPoint.timeLabel,
            distanceToRouteMeters: lastPoint.distanceToRouteMeters,
          }
        : null,
      maxPoint: maxPoint
        ? {
            lat: maxPoint.lat,
            lng: maxPoint.lng,
            timestamp: maxPoint.timestamp,
            timeLabel: maxPoint.timeLabel,
            distanceToRouteMeters: maxPoint.distanceToRouteMeters,
          }
        : null,
      pointsCount: group.points.length,
      maxDistanceMeters,
      maxDistanceLabel: formatMeters(maxDistanceMeters),
      averageDistanceMeters,
      averageDistanceLabel: formatMeters(averageDistanceMeters),
      durationMinutes,
      durationLabel: formatMinutes(durationMinutes),
      severity:
        maxDistanceMeters >= 650 ? "critical" : maxDistanceMeters >= 400 ? "warning" : "low",
    }
  })
}

const addTimeLabel = (point) => {
  const date = new Date(point.timestamp || "")

  return {
    ...point,
    timeLabel: Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
  }
}

export const compareRouteAgainstPlan = ({
  plannedPoints = [],
  actualPoints = [],
  toleranceMeters = 300,
} = {}) => {
  const expectedRoute = plannedPoints.filter(isValidPoint)
  const realRoute = actualPoints.filter(isValidPoint).map(addTimeLabel)
  const resolveDistanceToRoute = createRouteDistanceResolver({
    routePoints: expectedRoute,
    toleranceMeters,
  })
  const annotatedActualPoints = realRoute.map((point) => {
    const distanceToRouteMeters = resolveDistanceToRoute(point)

    return {
      ...point,
      distanceToRouteMeters,
      offRoute: distanceToRouteMeters > toleranceMeters,
    }
  })
  const deviationGroups = buildDeviationGroups(annotatedActualPoints)
  const plannedDistanceKm = getRouteDistanceKm(expectedRoute)
  const actualDistanceKm = getRouteDistanceKm(realRoute)
  const offRoutePoints = annotatedActualPoints.filter((point) => point.offRoute)
  const maxDeviationMeters = offRoutePoints.length
    ? Math.max(...offRoutePoints.map((point) => Number(point.distanceToRouteMeters || 0)))
    : 0
  const averageDeviationMeters = offRoutePoints.length
    ? offRoutePoints.reduce((total, point) => {
        return total + Number(point.distanceToRouteMeters || 0)
      }, 0) / offRoutePoints.length
    : 0
  const compliance =
    annotatedActualPoints.length > 0
      ? Math.max(0, 100 - (offRoutePoints.length / annotatedActualPoints.length) * 100)
      : 0
  const offRouteShare =
    annotatedActualPoints.length > 0
      ? (offRoutePoints.length / annotatedActualPoints.length) * 100
      : 0

  return {
    plannedPoints: expectedRoute,
    actualPoints: annotatedActualPoints,
    deviations: deviationGroups,
    summary: {
      plannedDistanceKm,
      plannedDistanceLabel: formatKm(plannedDistanceKm),
      actualDistanceKm,
      actualDistanceLabel: formatKm(actualDistanceKm),
      differenceKm: actualDistanceKm - plannedDistanceKm,
      differenceLabel: formatKm(actualDistanceKm - plannedDistanceKm),
      compliance,
      complianceLabel: `${Math.round(compliance)}%`,
      offRoutePointsCount: offRoutePoints.length,
      offRouteShare,
      offRouteShareLabel: `${Math.round(offRouteShare)}%`,
      maxDeviationMeters,
      maxDeviationLabel: formatMeters(maxDeviationMeters),
      averageDeviationMeters,
      averageDeviationLabel: formatMeters(averageDeviationMeters),
      toleranceMeters,
      toleranceLabel: `${toleranceMeters} m`,
    },
  }
}
