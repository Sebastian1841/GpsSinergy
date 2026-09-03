import assert from "node:assert/strict"
import { test } from "node:test"

import { createCleanScope, normalizeAccess } from "./userAccessStateUtils.js"

const modules = [{ id: "assets" }]
const moduleFunctions = [{ id: "gps", moduleId: "assets" }]

test("createCleanScope migrates legacy sucursal scope to selected assets", () => {
  const scope = {
    type: "sucursal",
    sucursalIds: ["north", "south", "north", ""],
    assetIds: ["manual-asset", "asset-001"],
    assetTagIds: ["legacy-tag"],
  }

  const assets = [
    {
      id: "asset-001",
      applicationId: "app-001",
      sucursalId: "north",
    },
    {
      id: "asset-002",
      applicationId: "app-001",
      sucursalId: "south",
    },
    {
      id: "asset-003",
      applicationId: "app-002",
      sucursalId: "north",
    },
    {
      id: "asset-004",
      applicationId: "app-001",
      sucursalId: "inactive",
    },
  ]

  assert.deepEqual(
    createCleanScope(scope, {
      assets,
      applicationId: "app-001",
      validSucursalIds: ["north", "south"],
    }),
    {
      type: "selected-assets",
      sucursalIds: [],
      assetIds: ["manual-asset", "asset-001", "asset-002"],
      assetTagIds: [],
    },
  )
})

test("createCleanScope does not keep legacy sucursal scope without assets", () => {
  assert.deepEqual(
    createCleanScope({
      type: "sucursal",
      sucursalIds: ["north"],
      assetIds: ["asset-001"],
      assetTagIds: ["legacy-tag"],
    }),
    {
      type: "selected-assets",
      sucursalIds: [],
      assetIds: ["asset-001"],
      assetTagIds: [],
    },
  )
})

test("normalizeAccess migrates legacy sucursal scope before permissions use it", () => {
  const access = normalizeAccess({
    access: {
      id: "access-legacy",
      applicationId: "app-001",
      role: "viewer",
      functions: [
        {
          functionId: "gps",
          enabled: true,
          permissions: {
            view: true,
          },
        },
      ],
      scope: {
        type: "sucursal",
        sucursalIds: ["north"],
      },
    },
    modules,
    moduleFunctions,
    assets: [
      {
        id: "asset-001",
        applicationId: "app-001",
        sucursalId: "north",
      },
      {
        id: "asset-002",
        applicationId: "app-001",
        sucursalId: "south",
      },
    ],
    validSucursalIds: ["north", "south"],
  })

  assert.equal(access.scope.type, "selected-assets")
  assert.deepEqual(access.scope.sucursalIds, [])
  assert.deepEqual(access.scope.assetIds, ["asset-001"])
})
