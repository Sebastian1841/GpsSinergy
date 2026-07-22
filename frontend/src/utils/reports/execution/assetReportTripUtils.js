import { normalizeReportText } from "./assetReportAssetUtils.js"
import { normalizeReportId } from "./assetReportColumnUtils.js"
import { formatTimestamp } from "./assetReportDateUtils.js"
import { buildReportRow } from "./assetReportRowBuilderUtils.js"
import { doesTimelineItemMatchRule } from "./assetReportRuleUtils.js"
import {
  REPORT_BEHAVIOR_OPTION_IDS,
  isReportBehaviorOptionEnabled,
} from "../config/reportBehaviorOptions.js"
import {
  formatDistanceLabel,
  formatDurationLabel,
  formatSpeed,
  getCoordinateValue,
  haversineDistanceKm,
  isTimelineItemInsideRange,
  parseReportNumber,
} from "./assetReportValueUtils.js"

const ROUTE_TRIP_MOVING_SPEED_THRESHOLD = 3

const firstReportValue = (...values) => {
  return values.find((value) => {
    if (value === 0 || value === false) return true
    if (value === null || value === undefined) return false

    return String(value).trim() !== ""
  })
}

const firstReportText = (...values) => {
  const value = firstReportValue(...values)
  const text = String(value ?? "").trim()

  return text && text !== "-" ? text : ""
}

const formatReportTimeLabel = (timestamp) => {
  const formattedTimestamp = formatTimestamp(timestamp)

  return formattedTimestamp.includes(" ")
    ? formattedTimestamp.split(" ").at(-1) || formattedTimestamp
    : formattedTimestamp
}

const formatCountLabel = (count, singular, plural) => {
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0

  return safeCount === 1 ? `1 ${singular}` : `${safeCount} ${plural}`
}

const getTimelineItemSpeed = (item = {}) => {
  const report = item.report || {}

  return parseReportNumber(
    firstReportValue(report.speed, report.velocidad, report.velocidad_kmh, report.speedLabel),
    0,
  )
}

const getTimelineItemPoint = (item = {}) => {
  const report = item.report || {}
  const lat = getCoordinateValue(firstReportValue(report.lat, report.latitude))
  const lng = getCoordinateValue(firstReportValue(report.lng, report.lon, report.longitude))

  if (lat === null || lng === null) return null

  return { lat, lng }
}

const formatTimelinePointLabel = (point) => {
  if (!point) return ""

  return `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`
}

const getTimelineItemLocation = (item = {}) => {
  const report = item.report || {}
  const location = firstReportText(
    report.address,
    report.direccion,
    report.lastPosition,
    report.locationLabel,
    report.locationName,
  )
  const point = getTimelineItemPoint(item)
  const pointLabel = formatTimelinePointLabel(point)

  if (location && pointLabel && !location.includes(pointLabel)) {
    return `${location} (${pointLabel})`
  }

  return location || pointLabel || "Sin direccion"
}

const doesTimelineItemMatchOptionalRule = ({ item, asset, rule }) => {
  return rule ? doesTimelineItemMatchRule({ item, asset, rule }) : false
}

const isMovingTimelineItem = ({ item, asset, movementRule }) => {
  if (movementRule) {
    return doesTimelineItemMatchOptionalRule({ item, asset, rule: movementRule })
  }

  if (getTimelineItemSpeed(item) > ROUTE_TRIP_MOVING_SPEED_THRESHOLD) return true

  const report = item.report || {}
  const normalizedStatus = normalizeReportText(
    firstReportText(report.estado, report.status, report.event, report.evento),
  )

  return normalizedStatus === "moving" || normalizedStatus.includes("mov")
}

const isTripEndTimelineItem = ({ item, asset, tripEndRule }) => {
  return doesTimelineItemMatchOptionalRule({ item, asset, rule: tripEndRule })
}

const isStopTimelineItem = ({ item, asset, movementRule, stopsRule }) => {
  if (doesTimelineItemMatchOptionalRule({ item, asset, rule: stopsRule })) return true

  return !isMovingTimelineItem({ item, asset, movementRule })
}

const isIdleTimelineItem = ({ item, asset, idleRule }) => {
  return doesTimelineItemMatchOptionalRule({ item, asset, rule: idleRule })
}

const countTimelineSessions = (items = [], predicate) => {
  let sessionCount = 0
  let isInsideSession = false

  items.forEach((item) => {
    const matches = predicate(item)

    if (matches && !isInsideSession) {
      sessionCount += 1
    }

    isInsideSession = matches
  })

  return sessionCount
}

const getTripDistanceKm = (items = []) => {
  let previousPoint = null
  let distanceKm = 0

  items.forEach((item) => {
    const point = getTimelineItemPoint(item)

    if (!point) return

    if (previousPoint) {
      distanceKm += haversineDistanceKm(previousPoint, point)
    }

    previousPoint = point
  })

  return distanceKm
}

const getTripMaxSpeed = (items = []) => {
  return Math.max(0, ...items.map(getTimelineItemSpeed))
}

const getTripMapPoints = (items = []) => {
  return items
    .map((item) => {
      const point = getTimelineItemPoint(item)

      if (!point) return null

      return {
        ...point,
        timestamp: item.timestamp.toISOString(),
        speed: getTimelineItemSpeed(item),
      }
    })
    .filter(Boolean)
}

const getTripStopSessionCount = ({ items, asset, movementRule, stopsRule }) => {
  return countTimelineSessions(items, (item) => {
    return isStopTimelineItem({ item, asset, movementRule, stopsRule })
  })
}

const getTripIdleSessionCount = ({ items, asset, idleRule }) => {
  return countTimelineSessions(items, (item) => {
    return isIdleTimelineItem({ item, asset, idleRule })
  })
}

const getTripEventSummary = ({ items, asset, movementRule, stopsRule, idleRule, template }) => {
  const includeStopEvents = isReportBehaviorOptionEnabled(
    template,
    REPORT_BEHAVIOR_OPTION_IDS.routeTripIncludeStopEvents,
  )
  const includeIdleEvents = isReportBehaviorOptionEnabled(
    template,
    REPORT_BEHAVIOR_OPTION_IDS.routeTripIncludeIdleEvents,
  )
  const stopSessions = includeStopEvents
    ? getTripStopSessionCount({
        items,
        asset,
        movementRule,
        stopsRule,
      })
    : 0
  const idleSessions = includeIdleEvents ? getTripIdleSessionCount({ items, asset, idleRule }) : 0
  const events = []

  if (stopSessions > 0) {
    events.push(formatCountLabel(stopSessions, "detencion", "detenciones"))
  }

  if (idleSessions > 0) {
    events.push(formatCountLabel(idleSessions, "ralenti", "ralentis"))
  }

  return events.length ? events.join(" / ") : "Sin eventos"
}

const buildRouteHistoryTrips = ({
  reportTimeline,
  asset,
  dateFrom,
  dateTo,
  movementRule,
  tripEndRule,
}) => {
  const trips = []
  let activeTrip = null

  const pushActiveTrip = () => {
    if (activeTrip?.movingItems?.length) {
      trips.push(activeTrip)
    }

    activeTrip = null
  }

  reportTimeline
    .filter((item) => isTimelineItemInsideRange({ item, dateFrom, dateTo }))
    .forEach((item) => {
      const endsTrip = isTripEndTimelineItem({ item, asset, tripEndRule })

      if (endsTrip) {
        if (activeTrip) {
          activeTrip.items.push(item)
          pushActiveTrip()
        }

        return
      }

      const moving = isMovingTimelineItem({ item, asset, movementRule })

      if (moving) {
        if (!activeTrip) {
          activeTrip = {
            items: [],
            movingItems: [],
            startItem: item,
            lastMovingItem: item,
          }
        }

        activeTrip.items.push(item)
        activeTrip.movingItems.push(item)
        activeTrip.lastMovingItem = item

        return
      }

      if (!activeTrip) return

      activeTrip.items.push(item)
    })

  pushActiveTrip()

  return trips
}

const buildRouteHistoryTripReport = ({
  asset,
  trip,
  tripIndex,
  movementRule,
  stopsRule,
  idleRule,
  template,
}) => {
  const startItem = trip.startItem
  const endItem = trip.items.at(-1) || trip.lastMovingItem || startItem
  const startPoint = getTimelineItemPoint(startItem)
  const endPoint = getTimelineItemPoint(endItem)
  const distanceKm = getTripDistanceKm(trip.items)
  const distanceLabel = formatDistanceLabel(distanceKm)
  const maxSpeed = Math.round(getTripMaxSpeed(trip.items))
  const maxSpeedLabel = formatSpeed(maxSpeed)
  const stopSessions = isReportBehaviorOptionEnabled(
    template,
    REPORT_BEHAVIOR_OPTION_IDS.routeTripIncludeStopEvents,
  )
    ? getTripStopSessionCount({
        items: trip.items,
        asset,
        movementRule,
        stopsRule,
      })
    : 0
  const origin = getTimelineItemLocation(startItem)
  const destination = getTimelineItemLocation(endItem)
  const durationLabel = formatDurationLabel(
    endItem.timestamp.getTime() - startItem.timestamp.getTime(),
  )

  return {
    ...startItem.report,
    id: `trip-${normalizeReportId(asset.id || asset.deviceId || asset.patente)}-${tripIndex + 1}`,
    timestamp: startItem.timestamp.toISOString(),
    reportedAt: startItem.timestamp.toISOString(),
    timeLabel: formatReportTimeLabel(startItem.timestamp),
    tripStart: formatReportTimeLabel(startItem.timestamp),
    tripEnd: formatReportTimeLabel(endItem.timestamp),
    tripDuration: durationLabel,
    tripOrigin: origin,
    tripDestination: destination,
    tripDistanceKm: distanceLabel,
    tripMaxSpeed: maxSpeedLabel,
    tripStops: formatCountLabel(stopSessions, "parada", "paradas"),
    tripEvents: getTripEventSummary({
      items: trip.items,
      asset,
      movementRule,
      stopsRule,
      idleRule,
      template,
    }),
    event: "Viaje",
    evento: "Viaje",
    duracion: durationLabel,
    duration: durationLabel,
    speed: maxSpeed,
    velocidad: maxSpeedLabel,
    speedLabel: maxSpeedLabel,
    accumulatedDistanceKm: distanceKm,
    accumulatedDistanceLabel: distanceLabel,
    address: origin === destination ? origin : `${origin} -> ${destination}`,
    direccion: origin === destination ? origin : `${origin} -> ${destination}`,
    estado: "moving",
    status: "moving",
    lat: startPoint?.lat ?? endPoint?.lat,
    lng: startPoint?.lng ?? endPoint?.lng,
    destinationLat: endPoint?.lat ?? startPoint?.lat,
    destinationLng: endPoint?.lng ?? startPoint?.lng,
  }
}

export const buildRouteHistoryTripRows = ({
  asset,
  reportTimeline,
  dateFrom,
  dateTo,
  reportColumns,
  companyNameById,
  eventRulesById,
  template,
}) => {
  const movementRule = eventRulesById?.get?.("movement") || null
  const stopsRule = eventRulesById?.get?.("stops") || null
  const idleRule = eventRulesById?.get?.("idle") || null
  const tripEndRule = eventRulesById?.get?.("tripEnd") || null
  const trips = buildRouteHistoryTrips({
    reportTimeline,
    asset,
    dateFrom,
    dateTo,
    movementRule,
    tripEndRule,
    template,
  })

  return trips.map((trip, tripIndex) => {
    const tripReport = buildRouteHistoryTripReport({
      asset,
      trip,
      tripIndex,
      movementRule,
      stopsRule,
      idleRule,
      template,
    })
    const row = buildReportRow({
      asset,
      report: tripReport,
      rule: {
        id: "route-trip",
        label: "Viaje",
      },
      index: tripIndex,
      reportColumns,
      companyNameById,
      dateTo,
    })
    const tripValues = {
      tripStart: tripReport.tripStart,
      tripEnd: tripReport.tripEnd,
      tripDuration: tripReport.tripDuration,
      tripOrigin: tripReport.tripOrigin,
      tripDestination: tripReport.tripDestination,
      tripDistanceKm: tripReport.tripDistanceKm,
      tripMaxSpeed: tripReport.tripMaxSpeed,
      tripStops: tripReport.tripStops,
      tripEvents: tripReport.tripEvents,
    }

    return {
      ...row,
      event: "Viaje",
      evento: "Viaje",
      accumulatedDistanceKm: tripReport.accumulatedDistanceKm,
      accumulatedDistanceLabel: tripReport.accumulatedDistanceLabel,
      values: {
        ...row.values,
        ...tripValues,
      },
      itineraryRow: {
        ...row.itineraryRow,
        event: "Viaje",
        evento: "Viaje",
        speedLabel: tripReport.tripMaxSpeed,
        accumulatedDistanceKm: tripReport.accumulatedDistanceKm,
        accumulatedDistanceLabel: tripReport.tripDistanceKm,
        address: tripReport.address,
        direccion: tripReport.address,
        lat: tripReport.lat,
        lng: tripReport.lng,
      },
      routeTrip: {
        index: tripIndex + 1,
        startTimestamp: trip.startItem.timestamp.toISOString(),
        endTimestamp: (trip.items.at(-1) || trip.lastMovingItem).timestamp.toISOString(),
        startAddress: tripReport.tripOrigin,
        endAddress: tripReport.tripDestination,
        points: getTripMapPoints(trip.items),
        pointCount: trip.items.length,
        movingPoints: trip.movingItems.length,
        distanceKm: tripReport.accumulatedDistanceKm,
        distanceLabel: tripReport.tripDistanceKm,
        maxSpeedLabel: tripReport.tripMaxSpeed,
      },
    }
  })
}
