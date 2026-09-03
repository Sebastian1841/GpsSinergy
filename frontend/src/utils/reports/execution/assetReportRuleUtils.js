import { normalizeReportId } from "./assetReportColumnUtils.js"
import { assetMatchesVehicleGroup } from "./assetReportVehicleGroupUtils.js"

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

  const cleanIds = Array.from(
    new Set(sourceIds.map(String).filter(Boolean)),
  )

  return cleanIds.filter((eventRuleId) => eventRuleId !== "all")
}

/*
 * Internamente las reglas trabajan exclusivamente
 * con grupos vehiculares.
 *
 * groupIds se conserva temporalmente como compatibilidad
 * con reglas antiguas.
 */
export const getRuleVehicleGroupIds = (rule = {}) => {
  const sourceIds = Array.isArray(rule.vehicleGroupIds)
    ? rule.vehicleGroupIds
    : Array.isArray(rule.groupIds)
      ? rule.groupIds
      : []

  return Array.from(
    new Set(
      sourceIds
        .map(normalizeReportId)
        .filter(Boolean),
    ),
  )
}

/*
 * Una regla sin grupos vehiculares aplica a cualquier activo.
 *
 * Cuando existen grupos configurados, el activo debe pertenecer
 * al menos a uno de ellos.
 *
 * No intervienen:
 * - sucursalId
 * - branchId
 * - tagId
 * - etiquetas
 * - labels
 */
export const doesRuleApplyToAssetVehicleGroup = ({
  rule,
  asset,
}) => {
  const vehicleGroupIds = getRuleVehicleGroupIds(rule)

  if (!vehicleGroupIds.length) {
    return true
  }

  return vehicleGroupIds.some((vehicleGroupId) => {
    return assetMatchesVehicleGroup(
      asset,
      vehicleGroupId,
    )
  })
}

/*
 * Alias temporal para evitar romper imports existentes.
 *
 * Los consumidores nuevos deben usar:
 * doesRuleApplyToAssetVehicleGroup()
 */
export const doesRuleApplyToAssetGroup =
  doesRuleApplyToAssetVehicleGroup

export const doesTimelineItemMatchRule = ({
  item,
  asset,
  rule,
}) => {
  if (
    !doesRuleApplyToAssetVehicleGroup({
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