export const unreportedAssetImageKey = (company, imei) => JSON.stringify([company, String(imei)])

export const buildUnreportedAssetImageIndex = (assets, companies) => {
  const companyIds = new Set(companies.map((company) => String(company.id)))
  const index = new Map()
  for (const asset of assets) {
    const company = companyIds.has(String(asset.companyId)) ? String(asset.companyId) : ""
    const imei = String(asset.imei || asset.deviceId || "").trim()
    if (!company || !imei) continue
    const key = unreportedAssetImageKey(company, imei)
    index.set(key, index.has(key) ? null : asset)
  }
  return index
}
