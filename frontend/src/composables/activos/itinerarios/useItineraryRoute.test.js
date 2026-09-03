import assert from "node:assert/strict"
import test from "node:test"
import { ref } from "vue"

import { useItineraryRoute } from "./useItineraryRoute.js"

const buildRoute = ({ asset, points }) => {
  return {
    id: `route-${asset.id}`,
    asset,
    rows: points.map((point, index) => ({
      ...point,
      id: point.id || `point-${index + 1}`,
      index: index + 1,
    })),
    summary: {
      pointsCount: points.length,
      distanceLabel: "1,0 km",
      movingLabel: "10 min",
    },
  }
}

test("useItineraryRoute keeps fallback route points when appending current location", () => {
  const emitted = []
  const asset = {
    id: "asset-with-current-location",
    displayName: "Activo actual",
    patente: "TEST12",
    lat: -33.45,
    lng: -70.66,
    speed: 12,
    timestamp: "2026-07-10T15:00:00.000",
  }
  const selectedAssetIds = ref([asset.id])
  const filteredAssets = ref([asset])
  const selectedAssets = ref([asset])
  const primarySelectedAsset = ref(asset)
  const showDeviceList = ref(true)
  const fromDate = ref("2026-07-10")
  const toDate = ref("2026-07-10")
  const formError = ref("")

  const { routeResult, handleGenerateRoute } = useItineraryRoute({
    emit: (event, payload) => emitted.push({ event, payload }),
    latestDate: "2026-07-10",
    selectedAssetIds,
    filteredAssets,
    selectedAssets,
    primarySelectedAsset,
    showDeviceList,
    fromDate,
    toDate,
    formError,
    applyDateRange: () => {},
    filterItineraryPoints: () => [
      {
        id: "fallback-1",
        assetId: asset.id,
        timestamp: "2026-07-10T08:00:00.000",
        lat: -33.46,
        lng: -70.67,
        speed: 20,
      },
      {
        id: "fallback-2",
        assetId: asset.id,
        timestamp: "2026-07-10T09:00:00.000",
        lat: -33.455,
        lng: -70.665,
        speed: 18,
      },
    ],
    buildItineraryResult: buildRoute,
  })

  handleGenerateRoute()

  assert.equal(formError.value, "")
  assert.equal(routeResult.value.rows.length, 3)
  assert.equal(routeResult.value.rows.at(-1).isCurrentLocation, true)
  assert.equal(showDeviceList.value, false)
  assert.equal(emitted.at(-1).event, "route-selected")
})

test("useItineraryRoute can disable fallback route points for daily summaries", () => {
  const emitted = []
  const asset = {
    id: "asset-without-history",
    displayName: "Activo sin historial",
    patente: "NOHIST",
    lat: -33.45,
    lng: -70.66,
    speed: 0,
    timestamp: "2026-07-10T15:00:00.000",
  }
  const selectedAssetIds = ref([asset.id])
  const filteredAssets = ref([asset])
  const selectedAssets = ref([asset])
  const primarySelectedAsset = ref(asset)
  const showDeviceList = ref(true)
  const fromDate = ref("2026-07-09")
  const toDate = ref("2026-07-09")
  const formError = ref("")

  const { routeResult, handleGenerateRoute } = useItineraryRoute({
    emit: (event, payload) => emitted.push({ event, payload }),
    latestDate: "2026-07-10",
    selectedAssetIds,
    filteredAssets,
    selectedAssets,
    primarySelectedAsset,
    showDeviceList,
    fromDate,
    toDate,
    formError,
    applyDateRange: () => {},
    allowFallbackPoints: false,
    filterItineraryPoints: () => [
      {
        id: "fallback-yesterday",
        assetId: asset.id,
        timestamp: "2026-07-09T08:00:00.000",
        lat: -33.46,
        lng: -70.67,
        speed: 20,
      },
    ],
    buildItineraryResult: buildRoute,
  })

  handleGenerateRoute()

  assert.equal(formError.value, "")
  assert.equal(routeResult.value.rows.length, 0)
  assert.equal(showDeviceList.value, false)
  assert.equal(emitted.at(-1).event, "route-selected")
})
