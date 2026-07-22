import assert from "node:assert/strict"
import test from "node:test"

import {
  getContainingGeofence,
  getGeofenceLocationLabelForAsset,
  withGeofenceLocationAddress,
} from "./geofenceMembershipUtils.js"

test("geofence membership returns the group name for assets inside grouped geofences", () => {
  const asset = {
    id: "asset-1",
    lat: -33.4489,
    lng: -70.6693,
    direccion: "Direccion real",
  }
  const geofences = [
    {
      id: "peaje-1",
      name: "Peaje Alameda norte",
      groupName: "PEAJE",
      type: "circle",
      center: {
        lat: -33.4489,
        lng: -70.6693,
      },
      radius: 120,
    },
  ]

  assert.equal(getGeofenceLocationLabelForAsset(asset, geofences), "PEAJE")
  assert.equal(getContainingGeofence(asset, geofences)?.id, "peaje-1")

  const resolvedAsset = withGeofenceLocationAddress(asset, geofences)

  assert.equal(resolvedAsset.address, "PEAJE")
  assert.equal(resolvedAsset.direccion, "PEAJE")
  assert.equal(resolvedAsset.lastPosition, "PEAJE")
  assert.equal(resolvedAsset.geofenceName, "Peaje Alameda norte")
  assert.equal(resolvedAsset.geofenceGroupName, "PEAJE")
})

test("geofence membership can keep the original address when address replacement is disabled", () => {
  const asset = {
    id: "asset-1",
    lat: -33.4489,
    lng: -70.6693,
    address: "Direccion real",
    direccion: "Direccion real",
    lastPosition: "Direccion real",
  }
  const geofences = [
    {
      id: "peaje-1",
      name: "Peaje Alameda norte",
      groupName: "PEAJE",
      type: "circle",
      center: {
        lat: -33.4489,
        lng: -70.6693,
      },
      radius: 120,
    },
  ]

  const resolvedAsset = withGeofenceLocationAddress(asset, geofences, {
    replaceAddress: false,
  })

  assert.equal(getGeofenceLocationLabelForAsset(asset, geofences, { enabled: false }), "")
  assert.equal(resolvedAsset.address, "Direccion real")
  assert.equal(resolvedAsset.direccion, "Direccion real")
  assert.equal(resolvedAsset.lastPosition, "Direccion real")
  assert.equal(resolvedAsset.geofenceLocationLabel, "PEAJE")
})

test("geofence membership falls back to the geofence name when no group exists", () => {
  const asset = {
    id: "asset-1",
    lat: -33.45,
    lng: -70.67,
  }
  const geofences = [
    {
      id: "zone-1",
      name: "Base Santiago",
      type: "polygon",
      coordinates: [
        { lat: -33.451, lng: -70.671 },
        { lat: -33.451, lng: -70.669 },
        { lat: -33.449, lng: -70.669 },
        { lat: -33.449, lng: -70.671 },
      ],
    },
  ]

  assert.equal(getGeofenceLocationLabelForAsset(asset, geofences), "Base Santiago")
})

test("geofence membership preserves the original asset when it is outside all geofences", () => {
  const asset = {
    id: "asset-1",
    lat: -33.48,
    lng: -70.7,
    direccion: "Direccion real",
  }
  const geofences = [
    {
      id: "peaje-1",
      name: "Peaje Alameda norte",
      groupName: "PEAJE",
      type: "circle",
      center: {
        lat: -33.4489,
        lng: -70.6693,
      },
      radius: 120,
    },
  ]

  assert.equal(getGeofenceLocationLabelForAsset(asset, geofences), "")
  assert.equal(withGeofenceLocationAddress(asset, geofences), asset)
})
