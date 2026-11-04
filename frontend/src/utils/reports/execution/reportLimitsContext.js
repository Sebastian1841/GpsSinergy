import {
  LIMIT_TYPES,
  limitAssetType,
  readLimitsConfiguration,
} from "../../layout/limitsConfiguration.js"

export const fuelPriceStorageKey = (companyId) => `sinergy-last-fuel-price-v1:${companyId}`
export function readLastFuelPrice(read, companyId) {
  try {
    const value = JSON.parse(read(fuelPriceStorageKey(companyId)) || "null")
    return value &&
      Number.isFinite(value.price) &&
      value.price > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(value.date)
      ? value
      : null
  } catch {
    return null
  }
}

// Snapshot once per company, not once per telemetry sample.
export function createReportLimitsContext({ read, manualSpeedLimit = "", fuelPrice = "" }) {
  if (manualSpeedLimit !== "" && (!Number.isInteger(Number(manualSpeedLimit)) || Number(manualSpeedLimit) < 1 || Number(manualSpeedLimit) > 300)) throw Error("Limite de velocidad invalido.")
  if (fuelPrice !== "" && (!Number.isFinite(Number(fuelPrice)) || Number(fuelPrice) <= 0)) throw Error("Precio por litro invalido.")
  const platform = readLimitsConfiguration(read)
  const companies = new Map()
  const prices = new Map()
  return (asset) => {
    const companyId = String(asset.companyId || "")
    if (!companies.has(companyId))
      companies.set(companyId, companyId ? readLimitsConfiguration(read, companyId) : platform)
    const own = companies.get(companyId)
    const type = LIMIT_TYPES.find((item) => item.id === limitAssetType(asset))
    const speed = !type
      ? null
      : manualSpeedLimit !== ""
        ? Number(manualSpeedLimit)
        : (own.speed[type.id] ?? platform.speed[type.id] ?? type.speed)
    if (!prices.has(companyId)) prices.set(companyId, readLastFuelPrice(read, companyId))
    const lastPrice = prices.get(companyId)
    return {
      ...asset,
      configuredSpeedLimit: speed,
      limitsSpeedUnavailable: speed === null,
      configuredIdleConsumption: type
        ? (own.idle[type.id] ?? platform.idle[type.id] ?? type.idle)
        : null,
      reportFuelPrice: fuelPrice !== "" ? Number(fuelPrice) : (lastPrice?.price ?? null),
    }
  }
}

export function getIdleFuelAmounts({ report = {}, asset = {} }) {
  report ||= {}
  const rate = asset.configuredIdleConsumption
  if (rate === null || rate === undefined) return { liters: null, cost: null }
  let hours = null
  for (const [key, divisor] of [
    ["durationMs", 3600000],
    ["durationMilliseconds", 3600000],
    ["durationSeconds", 3600],
    ["durationMinutes", 60],
  ]) {
    if (
      report[key] !== undefined &&
      Number.isFinite(Number(report[key])) &&
      Number(report[key]) >= 0
    ) {
      hours = Number(report[key]) / divisor
      break
    }
  }
  if (hours === null) {
    const label = String(report.duracion || report.duration || "").toLowerCase()
    const matches = [
      ...label.matchAll(/(\d+(?:[.,]\d+)?)\s*(h(?:oras?)?|min(?:utos?)?|seg(?:undos?)?|s)\b/g),
    ]
    if (matches.length)
      hours = matches.reduce(
        (sum, match) =>
          sum +
          Number(match[1].replace(",", ".")) /
            (match[2].startsWith("h") ? 1 : match[2].startsWith("min") ? 60 : 3600),
        0,
      )
  }
  if (hours === null) return { liters: null, cost: null }
  const liters = hours * rate
  return {
    liters,
    cost:
      asset.reportFuelPrice === null || asset.reportFuelPrice === undefined
        ? null
        : liters * asset.reportFuelPrice,
  }
}
