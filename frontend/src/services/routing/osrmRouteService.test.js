import assert from "node:assert/strict"
import test from "node:test"

import {
  buildRoutingStopsSignature,
  calculateOsrmRoute,
  snapOsrmPointToRoad,
} from "./osrmRouteService.js"

test("buildRoutingStopsSignature normalizes route stop coordinates", () => {
  assert.equal(
    buildRoutingStopsSignature([
      { lat: "-33.4489", lng: "-70.6693" },
      { lat: -33.4295, lng: -70.625 },
    ]),
    "-33.448900:-70.669300|-33.429500:-70.625000",
  )
})

test("calculateOsrmRoute requests full GeoJSON geometry and parses route points", async () => {
  const originalFetch = globalThis.fetch
  let requestedUrl = ""

  globalThis.fetch = async (url) => {
    requestedUrl = String(url)

    return {
      ok: true,
      async json() {
        return {
          code: "Ok",
          routes: [
            {
              distance: 1234.5,
              duration: 240,
              geometry: {
                type: "LineString",
                coordinates: [
                  [-70.6693, -33.4489],
                  [-70.65, -33.44],
                  [-70.625, -33.4295],
                ],
              },
            },
          ],
        }
      },
    }
  }

  try {
    const result = await calculateOsrmRoute({
      points: [
        { lat: -33.4489, lng: -70.6693 },
        { lat: -33.4295, lng: -70.625 },
      ],
    })

    assert.equal(result.provider, "osrm")
    assert.equal(result.distanceMeters, 1234.5)
    assert.equal(result.durationSeconds, 240)
    assert.deepEqual(result.points, [
      { lat: -33.4489, lng: -70.6693 },
      { lat: -33.44, lng: -70.65 },
      { lat: -33.4295, lng: -70.625 },
    ])
    assert.match(requestedUrl, /\/route\/v1\/driving\//)
    assert.match(requestedUrl, /overview=full/)
    assert.match(requestedUrl, /geometries=geojson/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("snapOsrmPointToRoad returns the nearest allowed street point", async () => {
  const originalFetch = globalThis.fetch
  let requestedUrl = ""

  globalThis.fetch = async (url) => {
    requestedUrl = String(url)

    return {
      ok: true,
      async json() {
        return {
          code: "Ok",
          waypoints: [
            {
              name: "Av. Principal",
              distance: 14.2,
              location: [-70.669, -33.449],
            },
          ],
        }
      },
    }
  }

  try {
    const result = await snapOsrmPointToRoad({
      point: { lat: -33.4489, lng: -70.6693 },
    })

    assert.equal(result.provider, "osrm")
    assert.equal(result.name, "Av. Principal")
    assert.equal(result.distanceMeters, 14.2)
    assert.deepEqual(
      {
        lat: result.lat,
        lng: result.lng,
      },
      {
        lat: -33.449,
        lng: -70.669,
      },
    )
    assert.match(requestedUrl, /\/nearest\/v1\/driving\//)
    assert.match(requestedUrl, /number=1/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("snapOsrmPointToRoad rejects points too far from an allowed street", async () => {
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => {
    return {
      ok: true,
      async json() {
        return {
          code: "Ok",
          waypoints: [
            {
              distance: 120,
              location: [-70.669, -33.449],
            },
          ],
        }
      },
    }
  }

  try {
    await assert.rejects(
      snapOsrmPointToRoad({
        point: { lat: -33.4489, lng: -70.6693 },
      }),
      /calle habilitada/,
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
