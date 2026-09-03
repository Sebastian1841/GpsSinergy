import assert from "node:assert/strict"
import test from "node:test"

import {
  assetMatchesTagIds,
  buildAssetTagOptions,
  getAssetTagIds,
  groupAssetTagsByCompany,
  normalizeAssetTagId,
} from "./userAssetTagUtils.js"

test("asset tag ids are normalized consistently", () => {
  assert.equal(normalizeAssetTagId("Faena Norte"), "faena-norte")
  assert.equal(normalizeAssetTagId("  Area_1  "), "area-1")
})

test("asset scope matches assets with selected tag ids", () => {
  const asset = {
    assetTagIds: ["asset-tag-001", "faena-norte"],
  }

  assert.deepEqual(getAssetTagIds(asset), ["asset-tag-001", "faena-norte"])
  assert.equal(assetMatchesTagIds(asset, ["asset-tag-001"]), true)
  assert.equal(assetMatchesTagIds(asset, ["Faena Norte"]), true)
  assert.equal(assetMatchesTagIds(asset, ["otra-etiqueta"]), false)
})

test("asset tag options count tagged assets", () => {
  const options = buildAssetTagOptions([
    {
      id: "asset-1",
      assetTagIds: ["norte", "faena"],
    },
    {
      id: "asset-2",
      assetTagIds: ["norte"],
    },
  ])

  assert.deepEqual(
    options.map((tag) => ({
      id: tag.id,
      assetCount: tag.assetCount,
    })),
    [
      {
        id: "faena",
        assetCount: 1,
      },
      {
        id: "norte",
        assetCount: 2,
      },
    ],
  )
})

test("asset tags are grouped by company for global views", () => {
  const groups = groupAssetTagsByCompany([
    {
      id: "tag-1",
      companyId: "company-002",
      companyName: "Transportes",
      name: "Ruta sur",
    },
    {
      id: "tag-2",
      companyId: "company-001",
      companyName: "Constructora",
      name: "Faena norte",
    },
    {
      id: "tag-3",
      companyId: "company-001",
      companyName: "Constructora",
      name: "Contratistas",
    },
  ])

  assert.deepEqual(
    groups.map((group) => ({
      key: group.key,
      label: group.label,
      tagIds: group.tags.map((tag) => tag.id),
    })),
    [
      {
        key: "company-001",
        label: "Constructora",
        tagIds: ["tag-2", "tag-3"],
      },
      {
        key: "company-002",
        label: "Transportes",
        tagIds: ["tag-1"],
      },
    ],
  )
})
