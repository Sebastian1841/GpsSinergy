import assert from "node:assert/strict"
import test from "node:test"

import { createRouteTripMapProjection } from "./routeTripMapProjectionUtils.js"

test("route map projection keeps extra context around short trips", () => {
  const projection = createRouteTripMapProjection({
    width: 1100,
    height: 360,
    routes: [
      {
        points: [
          { lat: -33.442, lng: -70.662 },
          { lat: -33.443, lng: -70.663 },
        ],
      },
    ],
  })

  assert.ok(projection)
  assert.equal(projection.zoom, 17)
})
