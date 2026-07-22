import assert from "node:assert/strict"
import test from "node:test"

import {
  clearGeneratedReportEvents,
  ensureReportEventsForAssets,
  getReportEventsForAsset,
} from "./useGeneratedReportEvents.js"

test("report event backfill only evaluates the requested template rules", () => {
  clearGeneratedReportEvents()

  const asset = {
    id: "asset-1",
    patente: "TEST-01",
    speedLimit: 80,
  }
  const report = {
    assetId: "asset-1",
    timestamp: "2026-07-07T10:00:00.000Z",
    lat: -33.45,
    lng: -70.66,
    speed: 95,
    fuelPercent: 44,
  }
  const eventRulesById = new Map([
    [
      "speeding",
      {
        id: "speeding",
        label: "Exceso de velocidad",
        active: true,
        conditions: [
          {
            field: "speed",
            operator: "greaterThan",
            value: "80",
          },
        ],
      },
    ],
    [
      "fuel",
      {
        id: "fuel",
        label: "Combustible",
        active: true,
        conditions: [
          {
            field: "fuel",
            operator: "exists",
            value: "",
          },
        ],
      },
    ],
  ])

  ensureReportEventsForAssets({
    assets: [asset],
    getReportsForAsset: () => [report],
    eventRulesById,
    eventRuleIds: ["speeding"],
  })

  const events = getReportEventsForAsset(asset)

  assert.deepEqual(
    events.map((event) => event.ruleId),
    ["speeding"],
  )

  clearGeneratedReportEvents()
})
