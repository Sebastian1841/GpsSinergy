import test from "node:test"
import assert from "node:assert/strict"
import { withSampleAssetTags } from "./sampleAssetTags.js"

test("sample assignments use existing same-company tags and preserve later edits", () => {
  const tags = [{ id: "asset-tag-001", companyId: "one" }]
  const source = { id: "asset-001", companyId: "one", assetTagIds: ["custom"] }
  const next = withSampleAssetTags(source, tags)
  assert.deepEqual(next.assetTagIds, ["custom", "asset-tag-001"])
  const edited = { ...next, assetTagIds: [] }
  assert.equal(withSampleAssetTags(edited, tags), edited)
  assert.deepEqual(withSampleAssetTags({ ...source, companyId: "two" }, tags).assetTagIds, ["custom"])
  assert.deepEqual(withSampleAssetTags(source, []).assetTagIds, ["custom"])
  const other = { id: "not-sample" }
  assert.equal(withSampleAssetTags(other, tags), other)
})
