import assert from "node:assert/strict"
import test from "node:test"

import { createEmptyPlannedRoute, createPlannedRouteFromPoints } from "./usePlannedRouteCatalog.js"

const buildRoutePoints = (count = 30) => {
  return Array.from({ length: count }, (_item, index) => ({
    lat: -33.45 + index * 0.0002,
    lng: -70.67 + index * 0.00025,
  }))
}

test("createPlannedRouteFromPoints keeps captured geometry when requested", () => {
  const points = buildRoutePoints()
  const route = createPlannedRouteFromPoints({
    points,
    includeRoutePoints: true,
  })

  assert.equal(route.stops.length, 8)
  assert.equal(route.routePoints.length, points.length)
  assert.equal(route.routingProvider, "captured")
  assert.ok(route.routingStopsSignature.length > 0)
})

test("createPlannedRouteFromPoints only creates stops by default", () => {
  const route = createPlannedRouteFromPoints({
    points: buildRoutePoints(),
  })

  assert.equal(route.stops.length, 8)
  assert.equal(route.routePoints.length, 0)
  assert.equal(route.routingProvider, "")
  assert.equal(route.routingStopsSignature, "")
})

test("createPlannedRouteFromPoints stores the source asset when provided", () => {
  const route = createPlannedRouteFromPoints({
    points: buildRoutePoints(),
    asset: {
      id: "asset-12",
      displayName: "Camion norte",
      patente: "AA-BB-12",
    },
  })

  assert.equal(route.assetId, "asset-12")
  assert.equal(route.assetLabel, "Camion norte - AA-BB-12")
})

test("createEmptyPlannedRoute seeds stops from the current GPS position", () => {
  const route = createEmptyPlannedRoute({
    centerPoint: {
      lat: -29.902669,
      lng: -71.25201,
    },
    asset: {
      id: "asset-18",
      displayName: "Camion La Serena",
      patente: "LS-001",
    },
  })

  assert.equal(route.assetId, "asset-18")
  assert.equal(route.assetLabel, "Camion La Serena - LS-001")
  assert.equal(route.stops[0].lat, -29.902669)
  assert.equal(route.stops[0].lng, -71.25201)
  assert.equal(route.stops[1].lat, -29.898669)
  assert.equal(route.stops[1].lng, -71.24801)
})
