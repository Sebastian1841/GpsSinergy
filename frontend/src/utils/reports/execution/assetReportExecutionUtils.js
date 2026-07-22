import { normalizeReportText } from "./assetReportAssetUtils.js"
import { SESSION_AGGREGATED_EVENT_RULE_IDS, normalizeReportId } from "./assetReportColumnUtils.js"
import {
  getCurrentDateOnly,
  getSourceDateOnly,
  getSourceTimestamp,
  isDateInsideRange,
} from "./assetReportDateUtils.js"
import { buildReportRow, buildRuleReportRow } from "./assetReportRowBuilderUtils.js"
import {
  addAccumulatedRouteMetrics,
  dedupeReportRows,
  filterInvalidSpeedingRows,
  getAggregatedHistoryRuleKey,
  getAggregatedHistoryRuleKeys,
  sortAssetReportRowsByVehicle,
} from "./assetReportRowPostProcessingUtils.js"
import {
  doesRuleApplyToAssetGroup,
  doesTimelineItemMatchRule,
  getEventRuleIds,
} from "./assetReportRuleUtils.js"
import { buildRouteHistoryTripRows } from "./assetReportTripUtils.js"
import {
  REPORT_BEHAVIOR_OPTION_IDS,
  isReportBehaviorOptionEnabled,
} from "../config/reportBehaviorOptions.js"
import {
  buildReportTimeline,
  getExistingDurationLabel,
  getReportDurationLabel,
  getTimelineDurationLabel,
  isTimelineItemInsideRange,
} from "./assetReportValueUtils.js"
import { doesReportMatchEventRule } from "../event-rules/reportEventRuleEngine.js"
import {
  getAssetGeofencePoint,
  getContainingGeofence,
  getGeofenceGroupName,
  getGeofenceLocationLabel,
} from "../../activos/geofenceMembershipUtils.js"

export {
  getAssetHistoryId,
  getAssetLabel,
  getAssetSearchText,
  normalizeReportText,
} from "./assetReportAssetUtils.js"
export {
  ASSET_REPORT_COLUMN_LABELS,
  DEFAULT_ASSET_REPORT_COLUMNS,
  REPORT_AUTO_COLUMN_KEYS,
  REPORT_REALTIME_COLUMN_KEYS,
  createReportColumns,
  normalizeReportId,
} from "./assetReportColumnUtils.js"
export { getCurrentDateOnly, toDateInputValue } from "./assetReportDateUtils.js"
export { sortAssetReportRowsByVehicle } from "./assetReportRowPostProcessingUtils.js"

const getHistoricalReportEventsForAsset = ({
  asset,
  dateFrom,
  dateTo,
  getReportEventsForAsset,
  template,
  eventRulesById,
}) => {
  if (typeof getReportEventsForAsset !== "function") return []

  const eventRuleIds = getEventRuleIds(template)
  const eventRuleIdSet = new Set(eventRuleIds)

  return getReportEventsForAsset(asset)
    .map((event, index) => ({
      event,
      index,
      timestamp: getSourceTimestamp({
        source: event,
        fallbackSource: event.report || asset,
        referenceDate: dateTo || getCurrentDateOnly(),
      }),
      dateOnly: getSourceDateOnly({
        source: event,
        fallbackSource: event.report || asset,
        referenceDate: dateTo || getCurrentDateOnly(),
      }),
    }))
    .filter(({ event, timestamp, dateOnly }) => {
      const rule = eventRulesById?.get?.(String(event.ruleId))
      const ruleExists = !eventRulesById || Boolean(rule)
      const matchesRule = ruleExists
        ? doesReportMatchEventRule({
            report: event.report,
            asset,
            rule,
          }) &&
          doesRuleApplyToAssetGroup({
            report: event.report,
            asset,
            rule,
          })
        : true

      return (
        eventRuleIdSet.has(String(event.ruleId)) &&
        ruleExists &&
        matchesRule &&
        isDateInsideRange({
          date: timestamp,
          dateOnly,
          fromDate: dateFrom,
          toDate: dateTo,
        })
      )
    })
    .sort((firstItem, secondItem) => {
      return secondItem.timestamp.getTime() - firstItem.timestamp.getTime()
    })
}

const buildIdleRuleRows = ({
  asset,
  reportTimeline,
  rule,
  ruleIndex,
  referenceDate,
  dateFrom,
  dateTo,
  reportColumns,
  companyNameById,
}) => {
  const rows = []
  let activeSession = []

  const pushSessionRow = (endItem = null) => {
    if (!activeSession.length) return

    const startItem = activeSession[0]
    const lastItem = activeSession[activeSession.length - 1]

    if (isTimelineItemInsideRange({ item: startItem, dateFrom, dateTo })) {
      rows.push(
        buildRuleReportRow({
          asset,
          report: startItem.report,
          reportIndex: startItem.reportIndex,
          rule,
          ruleIndex,
          referenceDate,
          durationLabel:
            getExistingDurationLabel(startItem.report) ||
            getTimelineDurationLabel({
              startItem,
              endItem: endItem || lastItem,
            }),
          reportColumns,
          companyNameById,
          dateTo,
        }),
      )
    }

    activeSession = []
  }

  reportTimeline.forEach((item) => {
    const matchesRule = doesTimelineItemMatchRule({ item, asset, rule })

    if (!matchesRule) {
      pushSessionRow(item)
      return
    }

    const existingDuration = getExistingDurationLabel(item.report)

    if (existingDuration && existingDuration !== "-") {
      pushSessionRow()

      if (isTimelineItemInsideRange({ item, dateFrom, dateTo })) {
        rows.push(
          buildRuleReportRow({
            asset,
            report: item.report,
            reportIndex: item.reportIndex,
            rule,
            ruleIndex,
            referenceDate,
            durationLabel: existingDuration,
            reportColumns,
            companyNameById,
            dateTo,
          }),
        )
      }

      return
    }

    activeSession.push(item)
  })

  pushSessionRow()

  return rows
}

const getExplicitGeofenceText = (source = {}) => {
  const explicitText =
    source.geofenceLocationLabel ||
    source.geofenceGroupName ||
    source.geofenceGroup ||
    source.grupoGeocerca ||
    source.geocerca ||
    source.geofence ||
    source.geofenceName ||
    ""
  const normalizedText = String(explicitText || "").trim()

  if (!normalizedText || normalizedText === "-") return ""

  return normalizedText
}

const hasExplicitGeofenceEventText = (source = {}) => {
  const eventText = normalizeReportText(
    [source.event, source.evento, source.alerta, source.alert].filter(Boolean).join(" "),
  )

  return (
    eventText.includes("geocerca") ||
    eventText.includes("entrada") ||
    eventText.includes("salida") ||
    eventText.includes("permanencia")
  )
}

const getExplicitTimelineGeofence = (source = {}) => {
  const label = getExplicitGeofenceText(source)

  if (!label && !hasExplicitGeofenceEventText(source)) return null

  const fallbackLabel = label || "Geocerca detectada"
  const groupName = String(
    source.geofenceGroupName || source.geofenceGroup || source.grupoGeocerca || "",
  ).trim()

  return {
    id: `explicit-${normalizeReportId(fallbackLabel)}`,
    name: source.geofenceName || fallbackLabel,
    groupName: groupName || fallbackLabel,
  }
}

const getTimelineGeofence = ({ item, asset, geofences }) => {
  const reportPoint = getAssetGeofencePoint(item.report)
  const source = reportPoint ? item.report : item.report === asset ? asset : null

  if (source && Array.isArray(geofences) && geofences.length) {
    const containingGeofence = getContainingGeofence(source, geofences)

    if (containingGeofence) return containingGeofence
  }

  return getExplicitTimelineGeofence(item.report)
}

const getGeofenceSessionKey = (geofence = {}) => {
  const sourceGeofence = geofence || {}

  return normalizeReportId(
    getGeofenceGroupName(sourceGeofence) ||
      sourceGeofence.id ||
      sourceGeofence.name ||
      sourceGeofence.label,
  )
}

const buildGeofenceSessionReport = ({ session, endItem }) => {
  const startItem = session.items[0]
  const lastItem = session.items[session.items.length - 1]
  const locationLabel = getGeofenceLocationLabel(session.geofence)
  const groupName = getGeofenceGroupName(session.geofence)
  const durationLabel =
    getExistingDurationLabel(startItem.report) ||
    getTimelineDurationLabel({
      startItem,
      endItem: endItem || lastItem,
    })

  return {
    ...startItem.report,
    geocerca: locationLabel,
    geofence: locationLabel,
    geofenceName: session.geofence?.name || locationLabel,
    geofenceGroupName: groupName,
    event: "Paso por geocerca",
    evento: "Paso por geocerca",
    duracion: durationLabel,
    duration: durationLabel,
  }
}

const buildGeofenceRuleRows = ({
  asset,
  reportTimeline,
  rule,
  ruleIndex,
  referenceDate,
  dateFrom,
  dateTo,
  reportColumns,
  companyNameById,
  geofences,
}) => {
  const rows = []
  let activeSession = null

  const pushSessionRow = (endItem = null) => {
    if (!activeSession?.items?.length) return

    const startItem = activeSession.items[0]
    const sessionReport = buildGeofenceSessionReport({
      session: activeSession,
      endItem,
    })

    if (
      isTimelineItemInsideRange({ item: startItem, dateFrom, dateTo }) &&
      doesRuleApplyToAssetGroup({
        report: sessionReport,
        asset,
        rule,
      }) &&
      doesReportMatchEventRule({
        report: sessionReport,
        asset,
        rule,
      })
    ) {
      rows.push(
        buildRuleReportRow({
          asset,
          report: sessionReport,
          reportIndex: startItem.reportIndex,
          rule: {
            ...rule,
            label: sessionReport.evento || "Paso por geocerca",
          },
          ruleIndex,
          referenceDate,
          durationLabel: "",
          reportColumns,
          companyNameById,
          dateTo,
        }),
      )
    }

    activeSession = null
  }

  reportTimeline.forEach((item) => {
    const geofence = getTimelineGeofence({ item, asset, geofences })
    const geofenceKey = getGeofenceSessionKey(geofence)

    if (!geofenceKey) {
      pushSessionRow(item)
      return
    }

    if (!activeSession) {
      activeSession = {
        geofence,
        key: geofenceKey,
        items: [item],
      }
      return
    }

    if (activeSession.key !== geofenceKey) {
      pushSessionRow(item)
      activeSession = {
        geofence,
        key: geofenceKey,
        items: [item],
      }
      return
    }

    activeSession.items.push(item)
  })

  pushSessionRow()

  return rows
}

const ROUTE_HISTORY_REPORT_TYPE_ID = "route-history"

const isRouteHistoryReportTemplate = (template = {}) => {
  return normalizeReportId(template.reportTypeId) === ROUTE_HISTORY_REPORT_TYPE_ID
}

const buildAssetReportRowsFromHistory = ({
  selectedAssets,
  reportColumns,
  companyNameById,
  dateFrom,
  dateTo,
  getReportsForAsset,
  template,
  eventRulesById,
  geofences = [],
}) => {
  if (typeof getReportsForAsset !== "function") return null

  const eventRuleIds = getEventRuleIds(template)

  if (!eventRuleIds.length) return []

  const rows = selectedAssets.flatMap((asset) => {
    const assetReports = getReportsForAsset(asset)
    const sourceReports =
      Array.isArray(assetReports) && assetReports.length ? assetReports : [asset]
    const referenceDate = dateTo || getCurrentDateOnly()
    const reportTimeline = buildReportTimeline({
      sourceReports,
      asset,
      referenceDate,
    })

    if (isRouteHistoryReportTemplate(template)) {
      return buildRouteHistoryTripRows({
        asset,
        reportTimeline,
        dateFrom,
        dateTo,
        reportColumns,
        companyNameById,
        eventRulesById,
        template,
      })
    }

    return eventRuleIds.flatMap((ruleId, ruleIndex) => {
      const rule = eventRulesById?.get?.(String(ruleId))

      if (!rule) return []

      if (
        String(rule.id) === "geofence" &&
        isReportBehaviorOptionEnabled(template, REPORT_BEHAVIOR_OPTION_IDS.groupGeofenceSessions)
      ) {
        return buildGeofenceRuleRows({
          asset,
          reportTimeline,
          rule,
          ruleIndex,
          referenceDate,
          dateFrom,
          dateTo,
          reportColumns,
          companyNameById,
          geofences,
        })
      }

      if (String(rule.id) === "idle") {
        return buildIdleRuleRows({
          asset,
          reportTimeline,
          rule,
          ruleIndex,
          referenceDate,
          dateFrom,
          dateTo,
          reportColumns,
          companyNameById,
        })
      }

      return reportTimeline.flatMap((item) => {
        if (!isTimelineItemInsideRange({ item, dateFrom, dateTo })) return []
        if (!doesTimelineItemMatchRule({ item, asset, rule })) return []

        return buildRuleReportRow({
          asset,
          report: item.report,
          reportIndex: item.reportIndex,
          rule,
          ruleIndex,
          referenceDate,
          durationLabel: getReportDurationLabel({
            report: item.report,
            reportIndex: item.reportIndex,
            reportTimeline,
          }),
          reportColumns,
          companyNameById,
          dateTo,
        })
      })
    })
  })

  return rows
}

export const buildAssetReportRows = ({
  selectedAssets,
  reportColumns,
  companyNameById,
  dateFrom,
  dateTo,
  getReportsForAsset,
  getReportEventsForAsset,
  template,
  eventRulesById,
  geofences = [],
}) => {
  const historyRows =
    buildAssetReportRowsFromHistory({
      selectedAssets,
      reportColumns,
      companyNameById,
      dateFrom,
      dateTo,
      getReportsForAsset,
      template,
      eventRulesById,
      geofences,
    }) || []

  const eventRuleIds = getEventRuleIds(template)

  if (!eventRuleIds.length) return []

  if (isRouteHistoryReportTemplate(template)) {
    return sortAssetReportRowsByVehicle(historyRows)
  }

  const aggregatedHistoryRuleKeys = getAggregatedHistoryRuleKeys(historyRows)

  const eventRows = selectedAssets.flatMap((asset) => {
    const historicalEvents = getHistoricalReportEventsForAsset({
      asset,
      dateFrom,
      dateTo,
      getReportEventsForAsset,
      template,
      eventRulesById,
    })

    return historicalEvents.flatMap(({ event, index }) => {
      const ruleId = normalizeReportId(event.ruleId)

      if (
        SESSION_AGGREGATED_EVENT_RULE_IDS.has(ruleId) &&
        aggregatedHistoryRuleKeys.has(
          getAggregatedHistoryRuleKey({
            asset,
            ruleId,
          }),
        )
      ) {
        return []
      }

      const rule = eventRulesById?.get?.(String(event.ruleId)) || null

      return [
        buildReportRow({
          asset,
          generatedEvent: event,
          rule,
          index,
          reportColumns,
          companyNameById,
          dateTo,
        }),
      ]
    })
  })

  return sortAssetReportRowsByVehicle(
    filterInvalidSpeedingRows(
      addAccumulatedRouteMetrics(dedupeReportRows([...historyRows, ...eventRows])),
    ),
  )
}
