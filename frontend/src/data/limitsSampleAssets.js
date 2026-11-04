const sampleAssetIds = new Set(["asset-001", "asset-002"])

// Retire only the previous sample state; keep subsequent user corrections.
export function restoreLimitsSampleType(asset) {
  if (!sampleAssetIds.has(asset.id) || asset.limitsSampleTypeVersion !== 1) return asset
  const next = { ...asset }
  delete next.limitsSampleTypeVersion
  if (next.assetType === "unassigned" && next.tipoActivo === "unassigned") {
    next.assetType = "car"
    next.tipoActivo = "car"
    next.assetTypeLabel = "Automovil"
    next.tipoActivoLabel = "Automovil"
  }
  return next
}
