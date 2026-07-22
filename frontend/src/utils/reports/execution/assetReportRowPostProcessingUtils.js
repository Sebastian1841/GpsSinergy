import { getAssetHistoryId, normalizeReportText } from "./assetReportAssetUtils.js"
import { SESSION_AGGREGATED_EVENT_RULE_IDS, normalizeReportId } from "./assetReportColumnUtils.js"
import { getReportEventSourceKey } from "./assetReportRuleUtils.js"
import {
  formatDistanceLabel,
  haversineDistanceKm,
  parseReportNumber,
} from "./assetReportValueUtils.js"

const getReportRowTimestampMs = (row = {}) => {
  const timestamp = new Date(
    row.timestamp ||
      row.report?.timestamp ||
      row.generatedEvent?.timestamp ||
      row.generatedEvent?.report?.timestamp ||
      0,
  ).getTime()

  return Number.isFinite(timestamp) ? timestamp : 0
}

const getReportRowVehicleSortKey = (row = {}) => {
  return normalizeReportText(
    row.values?.patente ||
      row.values?.vehiculo ||
      row.values?.deviceId ||
      row.report?.patente ||
      row.report?.patent ||
      row.report?.deviceId ||
      row.asset?.patente ||
      row.asset?.patent ||
      row.asset?.nombrePantalla ||
      row.asset?.name ||
      row.asset?.deviceId ||
      row.asset?.imei ||
      row.itineraryRow?.assetPatente ||
      row.itineraryRow?.assetDisplayName ||
      "",
  )
}

export const sortAssetReportRowsByVehicle = (rows = []) => {
  if (!Array.isArray(rows) || rows.length < 2) {
    return Array.isArray(rows) ? rows : []
  }

  const rowsWithMetadata = rows.map((row, index) => ({
    row,
    index,
    timestamp: getReportRowTimestampMs(row),
    vehicleKey: getReportRowVehicleSortKey(row),
  }))
  const vehicleCount = new Set(rowsWithMetadata.map((item) => item.vehicleKey).filter(Boolean)).size

  return rowsWithMetadata
    .sort((firstItem, secondItem) => {
      if (vehicleCount > 1 && firstItem.vehicleKey !== secondItem.vehicleKey) {
        if (!firstItem.vehicleKey) return 1
        if (!secondItem.vehicleKey) return -1

        return firstItem.vehicleKey.localeCompare(secondItem.vehicleKey, "es", {
          numeric: true,
          sensitivity: "base",
        })
      }

      if (firstItem.timestamp !== secondItem.timestamp) {
        return secondItem.timestamp - firstItem.timestamp
      }

      return firstItem.index - secondItem.index
    })
    .map((item) => item.row)
}

const getReportRowDeduplicationKey = (row = {}) => {
  const report = row.report || row.generatedEvent?.report || {}
  const assetId =
    row.itineraryRow?.assetId ||
    getAssetHistoryId(row.asset || {}) ||
    normalizeReportId(row.generatedEvent?.assetId || report.assetId)
  const ruleId = normalizeReportId(row.generatedEvent?.ruleId || row.generatedEvent?.id || "")
  const sourceReportKey = row.generatedEvent?.sourceReportKey || getReportEventSourceKey(report)

  return [assetId, ruleId, sourceReportKey].map((value) => String(value ?? "")).join("|")
}

export const dedupeReportRows = (rows = []) => {
  const rowsByKey = new Map()

  rows.forEach((row) => {
    const key = getReportRowDeduplicationKey(row)

    if (!key.replace(/\|/g, "")) return
    if (!rowsByKey.has(key)) rowsByKey.set(key, row)
  })

  return Array.from(rowsByKey.values())
}

export const getAggregatedHistoryRuleKey = ({ asset, ruleId }) => {
  return [getAssetHistoryId(asset || {}), normalizeReportId(ruleId)]
    .map((value) => String(value ?? ""))
    .join("|")
}

export const getAggregatedHistoryRuleKeys = (rows = []) => {
  const keys = new Set()

  rows.forEach((row) => {
    const ruleId = normalizeReportId(row.generatedEvent?.ruleId)

    if (!SESSION_AGGREGATED_EVENT_RULE_IDS.has(ruleId)) return

    keys.add(
      getAggregatedHistoryRuleKey({
        asset: row.asset,
        ruleId,
      }),
    )
  })

  return keys
}

const hasSpeedingText = (value) => {
  const text = normalizeReportText(value)

  return text.includes("exceso") && text.includes("velocidad")
}

const isSpeedingReportRow = (row = {}) => {
  return (
    row.generatedEvent?.ruleId === "speeding" ||
    hasSpeedingText(
      [
        row.generatedEvent?.ruleLabel,
        row.values?.evento,
        row.values?.event,
        row.report?.event,
        row.report?.evento,
        row.report?.alerta,
        row.report?.alert,
      ]
        .filter(Boolean)
        .join(" "),
    )
  )
}

const hasPositiveSpeedingDelta = (row = {}) => {
  const explicitDelta = parseReportNumber(
    row.values?.speedingDelta ??
      row.report?.speedingDelta ??
      row.report?.speedOverLimit ??
      row.report?.excesoVelocidad,
    null,
  )

  if (explicitDelta !== null) return explicitDelta > 0

  const speed = parseReportNumber(
    row.values?.velocidad ?? row.values?.speed ?? row.report?.speed ?? row.report?.velocidad,
    null,
  )
  const speedLimit = parseReportNumber(
    row.values?.speedLimit ??
      row.asset?.speedLimit ??
      row.asset?.limiteVelocidad ??
      row.asset?.velocidadLimite ??
      row.report?.speedLimit ??
      row.report?.limiteVelocidad ??
      row.report?.velocidadLimite,
    80,
  )

  return speed !== null && speedLimit !== null && speed > speedLimit
}

export const filterInvalidSpeedingRows = (rows = []) => {
  return rows.filter((row) => {
    return !isSpeedingReportRow(row) || hasPositiveSpeedingDelta(row)
  })
}

export const addAccumulatedRouteMetrics = (rows = []) => {
  const nextRows = rows.map((row) => ({
    ...row,
    values: {
      ...(row.values || {}),
    },
    itineraryRow: {
      ...(row.itineraryRow || {}),
    },
  }))
  const rowsByAssetId = new Map()

  nextRows.forEach((row) => {
    const assetId = row.itineraryRow.assetId || getAssetHistoryId(row.asset)
    const assetRows = rowsByAssetId.get(assetId) || []

    assetRows.push(row)
    rowsByAssetId.set(assetId, assetRows)
  })

  rowsByAssetId.forEach((assetRows) => {
    let accumulatedDistanceKm = 0
    let previousRow = null

    assetRows
      .sort((firstRow, secondRow) => {
        const firstTime = new Date(firstRow.timestamp || 0).getTime()
        const secondTime = new Date(secondRow.timestamp || 0).getTime()

        return firstTime - secondTime
      })
      .forEach((row) => {
        if (previousRow) {
          accumulatedDistanceKm += haversineDistanceKm(previousRow.itineraryRow, row.itineraryRow)
        }

        const distanceLabel = formatDistanceLabel(accumulatedDistanceKm)

        row.accumulatedDistanceKm = accumulatedDistanceKm
        row.accumulatedDistanceLabel = distanceLabel
        row.itineraryRow.accumulatedDistanceKm = accumulatedDistanceKm
        row.itineraryRow.accumulatedDistanceLabel = distanceLabel

        if (Object.hasOwn(row.values, "accumulatedDistanceKm")) {
          row.values.accumulatedDistanceKm = distanceLabel
        }

        previousRow = row
      })
  })

  return nextRows
}
