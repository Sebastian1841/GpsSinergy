import assert from "node:assert/strict"
import test from "node:test"

import { compareRouteAgainstPlan } from "./routeComparisonUtils.js"

const buildStraightRoutePoints = (count = 900) => {
  return Array.from({ length: count }, (_item, index) => {
    return {
      lat: -33.45,
      lng: -70.7 + index * 0.00005,
    }
  })
}

test("compareRouteAgainstPlan handles dense expected routes without false deviations", () => {
  const plannedPoints = buildStraightRoutePoints(900)
  const actualPoints = Array.from({ length: 1800 }, (_item, index) => {
    const plannedIndex = Math.min(plannedPoints.length - 1, Math.floor(index / 2))

    return {
      ...plannedPoints[plannedIndex],
      timestamp: `2026-07-10T12:${String(index % 60).padStart(2, "0")}:00.000Z`,
    }
  })

  const result = compareRouteAgainstPlan({
    plannedPoints,
    actualPoints,
    toleranceMeters: 200,
  })

  assert.equal(result.plannedPoints.length, 900)
  assert.equal(result.actualPoints.length, 1800)
  assert.equal(result.summary.offRoutePointsCount, 0)
  assert.equal(Math.round(result.summary.compliance), 100)
})

test("compareRouteAgainstPlan refines the nearest segment after a route jump", () => {
  const plannedPoints = buildStraightRoutePoints(900)
  const actualPoints = [
    plannedPoints[0],
    plannedPoints[860],
    plannedPoints[861],
    plannedPoints[862],
  ]

  const result = compareRouteAgainstPlan({
    plannedPoints,
    actualPoints,
    toleranceMeters: 200,
  })

  assert.equal(result.summary.offRoutePointsCount, 0)
  assert.equal(Math.round(result.summary.compliance), 100)
})

test("compareRouteAgainstPlan exposes deviation distance details", () => {
  const plannedPoints = buildStraightRoutePoints(80)
  const actualPoints = [
    plannedPoints[0],
    {
      lat: plannedPoints[20].lat + 0.01,
      lng: plannedPoints[20].lng,
      timestamp: "2026-07-10T12:10:00.000Z",
    },
    {
      lat: plannedPoints[21].lat + 0.012,
      lng: plannedPoints[21].lng,
      timestamp: "2026-07-10T12:12:00.000Z",
    },
    plannedPoints[40],
  ]

  const result = compareRouteAgainstPlan({
    plannedPoints,
    actualPoints,
    toleranceMeters: 200,
  })

  assert.equal(result.deviations.length, 1)
  assert.equal(result.summary.offRoutePointsCount, 2)
  assert.ok(result.summary.maxDeviationMeters > 1000)
  assert.ok(result.summary.averageDeviationMeters > 1000)
  assert.ok(result.deviations[0].maxPoint)
  assert.match(result.deviations[0].maxDistanceLabel, /m$/)
  assert.match(result.deviations[0].averageDistanceLabel, /m$/)
})
