import assert from "node:assert/strict"
import test from "node:test"

import {
  isResolvableAddressPlaceholder,
  resolveReverseGeocodedSources,
  shouldResolveReverseGeocode,
} from "./reverseGeocodingService.js"

test("coordinate fallback addresses remain eligible for reverse geocoding", () => {
  assert.equal(isResolvableAddressPlaceholder("Coordenadas -33.4480, -70.6702"), true)
  assert.equal(isResolvableAddressPlaceholder("-33.4480, -70.6702"), true)
  assert.equal(
    shouldResolveReverseGeocode({
      direccion: "Coordenadas -33.4480, -70.6702",
      lat: -33.448,
      lng: -70.6702,
    }),
    true,
  )
})

test("real addresses are not reprocessed by reverse geocoding", () => {
  assert.equal(isResolvableAddressPlaceholder("Av. Providencia, Santiago"), false)
  assert.equal(
    shouldResolveReverseGeocode({
      direccion: "Av. Providencia, Santiago",
      lat: -33.426,
      lng: -70.617,
    }),
    false,
  )
})

test("reverse geocoding can be disabled without mutating source rows", async () => {
  const rows = [
    {
      id: "row-1",
      direccion: "Coordenadas -33.4480, -70.6702",
      lat: -33.448,
      lng: -70.6702,
    },
  ]

  const resolvedRows = await resolveReverseGeocodedSources(rows, {
    enabled: false,
  })

  assert.equal(resolvedRows, rows)
  assert.equal(resolvedRows[0].direccion, "Coordenadas -33.4480, -70.6702")
  assert.equal(resolvedRows[0].resolvedAddress, undefined)
})

test("reverse geocoding export limit controls missing address fetches", async () => {
  const originalWindow = globalThis.window
  const originalFetch = globalThis.fetch
  const storageValues = new Map()
  let fetchCalls = 0

  globalThis.window = {
    setTimeout: globalThis.setTimeout,
    location: {
      origin: "http://localhost",
    },
    localStorage: {
      getItem: (key) => storageValues.get(key) || null,
      setItem: (key, value) => {
        storageValues.set(key, value)
      },
      removeItem: (key) => {
        storageValues.delete(key)
      },
    },
  }
  globalThis.fetch = async () => {
    fetchCalls += 1

    return {
      ok: true,
      json: async () => ({
        address: {
          road: `Calle ${fetchCalls}`,
          city: "Santiago",
          state: "RM",
        },
      }),
    }
  }

  try {
    const resolvedRows = await resolveReverseGeocodedSources(
      [
        {
          id: "row-1",
          values: {
            address: "Sin direccion",
          },
          lat: -33.4481,
          lng: -70.6701,
        },
        {
          id: "row-2",
          values: {
            address: "Sin direccion",
          },
          lat: -33.4492,
          lng: -70.6703,
        },
      ],
      {
        limit: 1,
        resolveAddresses: true,
      },
    )

    assert.equal(fetchCalls, 1)
    assert.equal(resolvedRows[0].values.address, "Calle 1, Santiago, RM")
    assert.equal(resolvedRows[1].values.address, "Coordenadas -33.4492, -70.6703")
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = originalWindow
    }

    if (originalFetch === undefined) {
      delete globalThis.fetch
    } else {
      globalThis.fetch = originalFetch
    }
  }
})

test("route trip endpoints can be resolved from their own coordinates", async () => {
  const rows = [
    {
      id: "trip-row-1",
      values: {
        tripOrigin: "-33.448900, -70.669300",
        tripDestination: "Sin direccion",
      },
      routeTrip: {
        points: [
          {
            lat: -33.4489,
            lng: -70.6693,
          },
          {
            lat: -33.4295,
            lng: -70.625,
          },
        ],
      },
    },
  ]

  const resolvedRows = await resolveReverseGeocodedSources(rows, {
    fetchMissing: false,
    resolveAddresses: false,
    resolveTripEndpoints: true,
  })

  assert.equal(resolvedRows[0].values.tripOrigin, "Coordenadas -33.4489, -70.6693")
  assert.equal(resolvedRows[0].values.tripDestination, "Coordenadas -33.4295, -70.6250")
  assert.equal(resolvedRows[0].routeTrip.startAddress, "Coordenadas -33.4489, -70.6693")
  assert.equal(resolvedRows[0].routeTrip.endAddress, "Coordenadas -33.4295, -70.6250")
  assert.equal(resolvedRows[0].address, undefined)
})
