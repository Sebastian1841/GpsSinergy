import { normalizeReportId } from "./assetReportColumnUtils.js"

export const normalizeReportText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export const getAssetLabel = (asset) => {
  return (
    asset?.nombrePantalla ||
    asset?.vehiculo ||
    asset?.name ||
    asset?.patente ||
    asset?.patent ||
    `Activo ${asset?.id || ""}`
  )
}

export const getAssetSearchText = (asset, companyName) => {
  return normalizeReportText(
    [
      getAssetLabel(asset),
      asset?.patente,
      asset?.patent,
      asset?.imei,
      asset?.conductor,
      asset?.estado,
      companyName,
    ]
      .filter(Boolean)
      .join(" "),
  )
}

export const getAssetHistoryId = (asset) => {
  return normalizeReportId(
    asset.id || asset.activoId || asset.deviceId || asset.patente || asset.patent,
  )
}
