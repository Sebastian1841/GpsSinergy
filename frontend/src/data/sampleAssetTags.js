const assignments = {
  "asset-001": ["asset-tag-001"],
  "asset-002": ["asset-tag-002"],
  "asset-003": ["asset-tag-001", "asset-tag-002"],
  "asset-004": ["asset-tag-002"],
  "asset-005": ["asset-tag-002"],
  "asset-006": ["asset-tag-003"],
  "asset-007": ["asset-tag-003"],
}

export function withSampleAssetTags(asset, tags) {
  if (!assignments[asset.id] || asset.sampleTagAssignmentsVersion === 1) return asset
  const allowed = new Set(tags.filter(tag => String(tag.companyId) === String(asset.companyId)).map(tag => String(tag.id)))
  const ids = assignments[asset.id].filter(id => allowed.has(id))
  return {
    ...asset,
    assetTagIds: [...new Set([...(asset.assetTagIds || []), ...ids])],
    sampleTagAssignmentsVersion: 1,
  }
}
