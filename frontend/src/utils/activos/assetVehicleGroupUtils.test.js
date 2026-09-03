import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  UNASSIGNED_VEHICLE_GROUP_ID,
  createVehicleAssetGroups,
  createVehicleAssetGroupId,
} from "./assetVehicleGroupUtils.js"

describe("assetVehicleGroupUtils", () => {
  it("creates vehicle groups only from provided authorized assets", () => {
    const groups = createVehicleAssetGroups({
      groups: [
        {
          id: "north",
          name: "Zona Norte",
          assetIds: ["asset-1", "asset-2"],
        },
      ],
      assets: [
        {
          id: "asset-1",
        },
      ],
    })

    assert.deepEqual(
      groups.map((group) => group.id),
      [createVehicleAssetGroupId("north")],
    )
    assert.deepEqual(groups[0].assetIds, ["asset-1"])
  })

  it("creates an unassigned group for authorized assets without group", () => {
    const groups = createVehicleAssetGroups({
      assets: [
        {
          id: "asset-1",
        },
      ],
    })

    assert.equal(groups.length, 1)
    assert.equal(groups[0].id, UNASSIGNED_VEHICLE_GROUP_ID)
    assert.deepEqual(groups[0].assetIds, ["asset-1"])
  })

  it("does not infer editable vehicle groups from asset legacy group fields", () => {
    const groups = createVehicleAssetGroups({
      assets: [
        {
          id: "asset-1",
          groupId: "legacy-group",
          vehicleGroupName: "Grupo legado",
        },
      ],
    })

    assert.equal(groups.length, 1)
    assert.equal(groups[0].id, UNASSIGNED_VEHICLE_GROUP_ID)
    assert.deepEqual(groups[0].assetIds, ["asset-1"])
  })
})
