import { computed, ref } from "vue"

import { doesReportMatchEventRule } from "../../utils/reports/event-rules/reportEventRuleEngine.js"
import {
  getActiveReportEventRulesSnapshot,
  getReportEventRulesByIdSnapshot,
} from "./useReportEventRules.js"

const GENERATED_REPORT_EVENTS_LIMIT = 10000

const generatedReportEvents = ref([])
const generatedReportEventIds = new Set()
const delayedReportEventStates = new Map()

const normalizeId = (value) => {
  return String(value ?? "").trim()
}

const normalizeIdentityList = (values = []) => {
  return Array.from(
    new Set(
      values
        .map(normalizeId)
        .filter(Boolean)
        .filter((value) => value !== "null" && value !== "undefined"),
    ),
  )
}

const getAssetIdentityValues = (source = {}) => {
  if (typeof source !== "object" || source === null) {
    return normalizeIdentityList([source])
  }

  return normalizeIdentityList([
    source.assetId,
    source.id,
    source.activoId,
    source.deviceId,
    source.device_id,
    source.imei,
    source.patente,
    source.patent,
  ])
}

const getReportAssetId = (report = {}) => {
  return (
    normalizeId(report.assetId) ||
    normalizeId(report.id) ||
    normalizeId(report.activoId) ||
    normalizeId(report.deviceId) ||
    normalizeId(report.imei) ||
    normalizeId(report.patente) ||
    normalizeId(report.patent)
  )
}

const getReportTimestamp = (report = {}) => {
  return (
    report.timestamp ||
    report.lastReport ||
    report.reportedAt ||
    report.lastReportAt ||
    report.updatedAt ||
    report.datosUlt ||
    new Date().toISOString()
  )
}

const getReportTimestampMs = (report = {}) => {
  const timestamp = getReportTimestamp(report)
  const parsedTime = new Date(timestamp).getTime()

  return Number.isFinite(parsedTime) ? parsedTime : Date.now()
}

const getReportEventSourceKey = (report = {}) => {
  return [
    report.id,
    report.assetId,
    report.timestamp,
    report.lat,
    report.lng,
    report.speed,
    report.velocidad_kmh,
  ]
    .map((value) => String(value ?? ""))
    .join("|")
}

export const getReportEventSourceKeyForReport = (report = {}) => {
  return getReportEventSourceKey(report)
}

const buildGeneratedReportEventId = ({ ruleId, report }) => {
  return [ruleId, getReportAssetId(report), getReportEventSourceKey(report)]
    .map((value) => String(value ?? ""))
    .join("|")
}

const getReportGroupId = ({ report = {}, asset = {} }) => {
  return (
    report.sucursalId ||
    report.groupId ||
    report.tagId ||
    report.branchId ||
    asset.sucursalId ||
    asset.groupId ||
    asset.tagId ||
    asset.branchId ||
    null
  )
}

const getRuleAlertType = (rule = {}) => {
  const alertType = String(rule.alertType || rule.severity || "").trim()

  return alertType || "info"
}

const getRuleNotifications = (rule = {}) => {
  return Array.isArray(rule.notifications)
    ? rule.notifications
        .filter((notification) => notification?.enabled !== false)
        .map((notification) => ({
          id: String(notification.id || ""),
          type: notification.type || "text",
          target: notification.target || "",
          message: notification.message || "",
        }))
    : []
}

const normalizeRuleIdSet = (ruleIds = []) => {
  if (!Array.isArray(ruleIds) || !ruleIds.length) return null

  const ids = new Set(ruleIds.map(normalizeId).filter(Boolean))

  return ids.size ? ids : null
}

const getRulesForRequestedIds = ({ rulesById, ruleIds = [] }) => {
  const requestedRuleIds = normalizeRuleIdSet(ruleIds)
  const rules = Array.from(rulesById.values()).filter((rule) => rule.active !== false)

  if (!requestedRuleIds) return rules

  return rules.filter((rule) => requestedRuleIds.has(normalizeId(rule.id)))
}

const buildGeneratedReportEvent = ({ rule, report, asset = {} }) => {
  const assetId = getReportAssetId(report)
  const timestamp = getReportTimestamp(report)
  const groupId = getReportGroupId({ report, asset })
  const alertType = getRuleAlertType(rule)
  const notifications = getRuleNotifications(rule)
  const enrichedReport = {
    ...report,
    sucursalId: report.sucursalId || groupId,
    groupId: report.groupId || groupId,
    tagId: report.tagId || asset.tagId || null,
    branchId: report.branchId || asset.branchId || null,
    event: rule.label,
    evento: rule.label,
    alerta: rule.label,
    alertType,
    severity: alertType,
    notifications,
  }

  return {
    id: buildGeneratedReportEventId({
      ruleId: rule.id,
      report,
    }),
    ruleId: rule.id,
    ruleLabel: rule.label,
    ruleDescription: rule.description || "",
    assetId,
    timestamp,
    companyId: report.companyId || null,
    applicationId: report.applicationId || null,
    sucursalId: groupId,
    groupId,
    tagId: enrichedReport.tagId || null,
    branchId: enrichedReport.branchId || null,
    alertType,
    severity: alertType,
    notifications,
    message: `${rule.label} detectado`,
    sourceReportKey: getReportEventSourceKey(report),
    activation: rule.activation || null,
    report: enrichedReport,
  }
}

const sortEventsNewestFirst = (events = []) => {
  return [...events].sort((firstEvent, secondEvent) => {
    const firstTime = new Date(firstEvent.timestamp || 0).getTime()
    const secondTime = new Date(secondEvent.timestamp || 0).getTime()

    return secondTime - firstTime
  })
}

const shouldEventComeFirst = (firstEvent = {}, secondEvent = {}) => {
  const firstTime = new Date(firstEvent.timestamp || 0).getTime()
  const secondTime = new Date(secondEvent.timestamp || 0).getTime()

  return firstTime >= secondTime
}

const mergeEventsNewestFirst = (currentEvents = [], appendedEvents = []) => {
  const sortedAppendedEvents = sortEventsNewestFirst(appendedEvents)
  const mergedEvents = []
  let currentIndex = 0
  let appendedIndex = 0

  while (currentIndex < currentEvents.length || appendedIndex < sortedAppendedEvents.length) {
    const currentEvent = currentEvents[currentIndex]
    const appendedEvent = sortedAppendedEvents[appendedIndex]

    if (!currentEvent) {
      mergedEvents.push(appendedEvent)
      appendedIndex += 1
      continue
    }

    if (!appendedEvent) {
      mergedEvents.push(currentEvent)
      currentIndex += 1
      continue
    }

    if (shouldEventComeFirst(currentEvent, appendedEvent)) {
      mergedEvents.push(currentEvent)
      currentIndex += 1
    } else {
      mergedEvents.push(appendedEvent)
      appendedIndex += 1
    }
  }

  return mergedEvents
}

const appendGeneratedReportEvents = (events = []) => {
  if (!Array.isArray(events) || !events.length) return []

  const appendedEvents = []

  events.forEach((event) => {
    if (!event?.id || generatedReportEventIds.has(event.id)) return

    generatedReportEventIds.add(event.id)
    appendedEvents.push(event)
  })

  if (!appendedEvents.length) return []

  const nextEvents = mergeEventsNewestFirst(generatedReportEvents.value, appendedEvents)

  if (nextEvents.length > GENERATED_REPORT_EVENTS_LIMIT) {
    const keptEvents = nextEvents.slice(0, GENERATED_REPORT_EVENTS_LIMIT)
    const keptEventIds = new Set(keptEvents.map((event) => event.id))

    generatedReportEventIds.clear()
    keptEvents.forEach((event) => {
      generatedReportEventIds.add(event.id)
    })

    generatedReportEvents.value = keptEvents
    return appendedEvents.filter((event) => keptEventIds.has(event.id))
  }

  generatedReportEvents.value = nextEvents

  return appendedEvents
}

const normalizeReportItems = (reports = []) => {
  return reports.map((item) => {
    if (item?.report) {
      return {
        report: item.report,
        asset: item.asset || item.report,
      }
    }

    return {
      report: item,
      asset: item,
    }
  })
}

const getRuleActivation = (rule = {}) => {
  const delayMinutes = Number(rule.activation?.delayMinutes)

  return {
    mode: rule.activation?.mode === "delayed" ? "delayed" : "immediate",
    delayMinutes: Number.isFinite(delayMinutes) && delayMinutes > 0 ? delayMinutes : 1,
    autoExecuteAfterDelay: rule.activation?.autoExecuteAfterDelay === true,
  }
}

const getDelayedRuleStateKey = ({ rule, report }) => {
  return [rule.id, getReportAssetId(report)].map((value) => String(value ?? "")).join("|")
}

const createGeneratedEventFromState = (state) => {
  if (!state?.rule || !state?.report) return null

  return buildGeneratedReportEvent({
    rule: state.rule,
    report: state.report,
    asset: state.asset,
  })
}

const applyImmediateRule = ({ rule, report, asset }) => {
  if (
    !doesReportMatchEventRule({
      report,
      asset,
      rule,
    })
  ) {
    return []
  }

  return [
    buildGeneratedReportEvent({
      rule,
      report,
      asset,
    }),
  ]
}

const applyDelayedRule = ({ rule, report, asset, delayedStateMap }) => {
  const activation = getRuleActivation(rule)
  const stateKey = getDelayedRuleStateKey({ rule, report })
  const previousState = delayedStateMap.get(stateKey)
  const reportTimestampMs = getReportTimestampMs(report)
  const delayMs = activation.delayMinutes * 60 * 1000
  const matchesRule = doesReportMatchEventRule({
    report,
    asset,
    rule,
  })

  if (!matchesRule) {
    if (!previousState) return []

    delayedStateMap.delete(stateKey)

    const elapsedMs = previousState.lastTimestampMs - previousState.startTimestampMs

    if (activation.autoExecuteAfterDelay || elapsedMs < delayMs) return []

    const generatedEvent = createGeneratedEventFromState({
      ...previousState,
      rule,
    })

    return generatedEvent ? [generatedEvent] : []
  }

  const nextState = {
    rule,
    report,
    asset,
    assetId: getReportAssetId(report),
    ruleId: rule.id,
    startTimestampMs: previousState?.startTimestampMs ?? reportTimestampMs,
    lastTimestampMs: reportTimestampMs,
    hasAutoExecuted: previousState?.hasAutoExecuted === true,
  }

  delayedStateMap.set(stateKey, nextState)

  const elapsedMs = reportTimestampMs - nextState.startTimestampMs

  if (!activation.autoExecuteAfterDelay || elapsedMs < delayMs || nextState.hasAutoExecuted) {
    return []
  }

  nextState.hasAutoExecuted = true
  delayedStateMap.set(stateKey, nextState)

  return [
    buildGeneratedReportEvent({
      rule,
      report,
      asset,
    }),
  ]
}

const applyRuleToReportItem = ({ rule, report, asset, delayedStateMap }) => {
  const activation = getRuleActivation(rule)

  if (activation.mode !== "delayed") {
    return applyImmediateRule({
      rule,
      report,
      asset,
    })
  }

  return applyDelayedRule({
    rule,
    report,
    asset,
    delayedStateMap,
  })
}

const sortReportItemsOldestFirst = (reportItems = []) => {
  return [...reportItems].sort((firstItem, secondItem) => {
    return getReportTimestampMs(firstItem.report) - getReportTimestampMs(secondItem.report)
  })
}

const getRuleGroupIds = (rule = {}) => {
  return Array.isArray(rule.groupIds) ? rule.groupIds.map(normalizeId).filter(Boolean) : []
}

const createRuleResolver = (rules = []) => {
  const globalRules = []
  const rulesByGroupId = new Map()

  rules.forEach((rule) => {
    const groupIds = getRuleGroupIds(rule)

    if (!groupIds.length) {
      globalRules.push(rule)
      return
    }

    groupIds.forEach((groupId) => {
      const groupedRules = rulesByGroupId.get(groupId) || []

      groupedRules.push(rule)
      rulesByGroupId.set(groupId, groupedRules)
    })
  })

  return ({ report, asset }) => {
    const groupId = normalizeId(getReportGroupId({ report, asset }))

    if (!groupId) return globalRules

    const groupedRules = rulesByGroupId.get(groupId) || []

    return groupedRules.length ? [...globalRules, ...groupedRules] : globalRules
  }
}

const buildEventsForReports = ({
  reports = [],
  rules = getActiveReportEventRulesSnapshot(),
  delayedStateMap = new Map(),
}) => {
  const reportItems = sortReportItemsOldestFirst(normalizeReportItems(reports))

  if (!reportItems.length) return []

  const enabledRules = rules.filter((rule) => rule.id !== "all" && rule.active !== false)
  const getRulesForReport = createRuleResolver(enabledRules)

  return reportItems.flatMap(({ report, asset }) => {
    return getRulesForReport({ report, asset }).flatMap((rule) => {
      return applyRuleToReportItem({
        rule,
        report,
        asset,
        delayedStateMap,
      })
    })
  })
}

export const appendReportEventsFromTelemetryReports = (reports = []) => {
  return appendGeneratedReportEvents(
    buildEventsForReports({
      reports,
      delayedStateMap: delayedReportEventStates,
    }),
  )
}

export const ensureReportEventsForReports = ({
  reports = [],
  eventRulesById = null,
  eventRuleIds = [],
} = {}) => {
  const rulesById = eventRulesById || getReportEventRulesByIdSnapshot()
  const rules = getRulesForRequestedIds({
    rulesById,
    ruleIds: eventRuleIds,
  })

  return appendGeneratedReportEvents(
    buildEventsForReports({
      reports,
      rules,
    }),
  )
}

export const ensureReportEventsForAssets = ({
  assets = [],
  getReportsForAsset,
  eventRulesById = null,
  eventRuleIds = [],
} = {}) => {
  if (typeof getReportsForAsset !== "function") return []

  const reports = assets.flatMap((asset) => {
    return getReportsForAsset(asset).map((report) => ({
      report,
      asset,
    }))
  })

  return ensureReportEventsForReports({
    reports,
    eventRulesById,
    eventRuleIds,
  })
}

export const getReportEventsForAsset = (asset) => {
  const identityValues = getAssetIdentityValues(asset)

  if (!identityValues.length) return []

  const identitySet = new Set(identityValues)

  return sortEventsNewestFirst(
    generatedReportEvents.value.filter((event) => {
      return identitySet.has(normalizeId(event.assetId))
    }),
  )
}

export const clearReportEventsForAsset = (asset) => {
  const identityValues = getAssetIdentityValues(asset)

  if (!identityValues.length) return

  const identitySet = new Set(identityValues)

  generatedReportEvents.value = generatedReportEvents.value.filter((event) => {
    const shouldKeep = !identitySet.has(normalizeId(event.assetId))

    if (!shouldKeep) {
      generatedReportEventIds.delete(event.id)
    }

    return shouldKeep
  })

  Array.from(delayedReportEventStates.entries()).forEach(([stateKey, state]) => {
    if (identitySet.has(normalizeId(state.assetId))) {
      delayedReportEventStates.delete(stateKey)
    }
  })
}

export const clearReportEventsForSourceKeys = (sourceReportKeys = []) => {
  const sourceReportKeySet = new Set(
    (Array.isArray(sourceReportKeys) ? sourceReportKeys : [sourceReportKeys])
      .map(normalizeId)
      .filter(Boolean),
  )

  if (!sourceReportKeySet.size) return

  generatedReportEvents.value = generatedReportEvents.value.filter((event) => {
    const shouldKeep = !sourceReportKeySet.has(normalizeId(event.sourceReportKey))

    if (!shouldKeep) {
      generatedReportEventIds.delete(event.id)
    }

    return shouldKeep
  })
}

export const clearGeneratedReportEvents = () => {
  generatedReportEvents.value = []
  generatedReportEventIds.clear()
  delayedReportEventStates.clear()
}

export function useGeneratedReportEvents() {
  const reportEvents = computed(() => generatedReportEvents.value)

  return {
    reportEvents,
    getReportEventsForAsset,
    clearReportEventsForAsset,
    clearGeneratedReportEvents,
  }
}
