import test from "node:test"
import assert from "node:assert/strict"
import { restoreLimitsSampleType } from "./limitsSampleAssets.js"

test("retired sample types restore defaults and preserve user corrections", () => {
  for (const id of ["asset-001", "asset-002"]) {
    const sample = { id, limitsSampleTypeVersion: 1, assetType: "unassigned", tipoActivo: "unassigned" }
    const restored = restoreLimitsSampleType(sample)
    assert.equal(restored.assetType, "car")
    assert.equal(restored.limitsSampleTypeVersion, undefined)
    assert.equal(restoreLimitsSampleType(restored), restored)
    const corrected = restoreLimitsSampleType({ ...sample, assetType: "truck", tipoActivo: "truck" })
    assert.equal(corrected.assetType, "truck")
    assert.equal(corrected.tipoActivo, "truck")
  }
  const unrelated = { id: "other", assetType: "unassigned" }
  assert.equal(restoreLimitsSampleType(unrelated), unrelated)
})

