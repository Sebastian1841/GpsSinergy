import { normalizeReportId } from "./assetReportColumnUtils.js"
import { doesReportMatchEventRule } from "../event-rules/reportEventRuleEngine.js"

export const getReportEventSourceKey = (report = {}) => {
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

export const getEventRuleIds = (template = {}) => {
  const sourceIds = Array.isArray(template?.eventRuleIds)
    ? template.eventRuleIds
    : template?.eventRuleId
      ? [template.eventRuleId]
      : []

  const cleanIds = Array.from(new Set(sourceIds.map(String).filter(Boolean)))

  return cleanIds.filter((eventRuleId) => eventRuleId !== "all")
}

const getRuleGroupIds = (rule = {}) => {
  return Array.isArray(rule.groupIds) ? rule.groupIds.map(normalizeReportId).filter(Boolean) : []
}

const getReportGroupId = ({ report = {}, asset = {} }) => {
  return normalizeReportId(
    report.sucursalId ||
      report.groupId ||
      report.tagId ||
      report.branchId ||
      asset.sucursalId ||
      asset.groupId ||
      asset.tagId ||
      asset.branchId,
  )
}

export const doesRuleApplyToAssetGroup = ({ rule, report, asset }) => {
  const groupIds = getRuleGroupIds(rule)

  if (!groupIds.length) return true

  const groupId = getReportGroupId({ report, asset })

  return Boolean(groupId && groupIds.includes(groupId))
}

export const doesTimelineItemMatchRule = ({ item, asset, rule }) => {
  if (
    !doesRuleApplyToAssetGroup({
      report: item.report,
      asset,
      rule,
    })
  ) {
    return false
  }

  return doesReportMatchEventRule({
    report: item.report,
    asset,
    rule,
  })
}
