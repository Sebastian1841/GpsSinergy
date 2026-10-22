export const unreportedAssetImageKey = (company, imei) => JSON.stringify([company, String(imei)])

export const buildUnreportedAssetImageIndex = (assets, companies) => {
  const names = new Map()
  const counts = new Map()
  for (const company of companies) counts.set(company.name, (counts.get(company.name) || 0) + 1)
  for (const company of companies) {
    if (counts.get(company.name) === 1) names.set(String(company.id), company.name)
  }
  const index = new Map()
  for (const asset of assets) {
    const company = names.get(String(asset.companyId))
    const imei = String(asset.imei || asset.deviceId || "").trim()
    if (!company || !imei) continue
    const key = unreportedAssetImageKey(company, imei)
    index.set(key, index.has(key) ? null : asset)
  }
  return index
}
