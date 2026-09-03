import assert from "node:assert/strict"
import test from "node:test"

import {
  getOperationalProfile,
  getOperationalProfileForAsset,
  getOperationalProfileReportPriority,
  getOperationalProfileReportTypeIdsForAssets,
  isOperationalProfileReport,
} from "./operationalProfileOptions.js"

test("operational profiles resolve defaults by asset type", () => {
  const truckProfile = getOperationalProfile("truck")

  assert.equal(truckProfile.id, "truck")
  assert.ok(truckProfile.reportTypeIds.includes("route-history"))
  assert.ok(truckProfile.reportTypeIds.includes("fuel"))
  assert.ok(truckProfile.reportTypeIds.includes("engine-hours"))
})

test("operational profiles resolve from asset map icon aliases", () => {
  const machineryProfile = getOperationalProfileForAsset({
    mapIcon: "vehicle-machinery",
  })

  assert.equal(machineryProfile.id, "machinery")
  assert.deepEqual(machineryProfile.reportTypeIds.slice(0, 2), ["engine-hours", "ignition"])
})

test("operational profiles merge report recommendations for mixed assets", () => {
  const reportTypeIds = getOperationalProfileReportTypeIdsForAssets([
    {
      assetType: "truck",
    },
    {
      assetType: "bus",
    },
  ])

  assert.equal(reportTypeIds[0], "route-history")
  assert.ok(reportTypeIds.includes("fuel"))
  assert.ok(reportTypeIds.includes("gps-signal"))
})

test("operational profile report priority keeps recommendations first", () => {
  const assets = [
    {
      assetType: "machinery",
    },
  ]

  assert.equal(isOperationalProfileReport({ reportTypeId: "engine-hours", assets }), true)
  assert.equal(isOperationalProfileReport({ reportTypeId: "speed", assets }), false)
  assert.ok(
    getOperationalProfileReportPriority({
      reportTypeId: "engine-hours",
      assets,
    }) <
      getOperationalProfileReportPriority({
        reportTypeId: "speed",
        assets,
      }),
  )
})
