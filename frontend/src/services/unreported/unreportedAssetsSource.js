import { parseUnreportedTimestamp } from "./unreportedLifecycleStore.js"

const reportTimestamp = (asset) => {
  const value =
    asset.lastTelemetryAt ||
    asset.timestamp ||
    asset.lastReport ||
    asset.lastReportAt ||
    asset.reportedAt ||
    asset.datosUlt
  if (!value || /^\d{1,2}:\d{2}(?::\d{2})?$/.test(String(value).trim())) return null
  return parseUnreportedTimestamp(value)
}

export const buildUnreportedEquipment = (assets, companies) => {
  const companyById = new Map(companies.map((company) => [String(company.id), company.name]))
  const identities = new Set()
  return assets.flatMap((asset) => {
    const company = companyById.get(String(asset.companyId))
    const imei = String(asset.imei || asset.deviceId || "").trim()
    if (!company || !imei) return []
    const key = JSON.stringify([company, imei])
    if (identities.has(key)) return []
    identities.add(key)
    const lastReport = reportTimestamp(asset) || reportTimestamp(asset.telemetry || {})
    const rawTelemetry = asset.telemetry || asset
    const telemetryDate = reportTimestamp(rawTelemetry)
    return [
      {
        id: asset.id,
        companyId: asset.companyId,
        company,
        imei,
        name: asset.nombrePantalla || asset.name || asset.vehiculo || asset.patente || imei,
        plate: asset.patente || asset.patent || "",
        lastReport,
        hasUndatedReport:
          !lastReport && /^\d{1,2}:\d{2}(?::\d{2})?$/.test(String(asset.datosUlt || "").trim()),
        sourceStatus: asset.estado || asset.status,
        location: asset.direccion || asset.address || "Sin posicion conocida",
        mapIcon: asset.mapIcon,
        assetType: asset.assetType || asset.tipoActivo,
        telemetry: {
          ...rawTelemetry,
          reportedAt: telemetryDate,
        },
      },
    ]
  })
}
