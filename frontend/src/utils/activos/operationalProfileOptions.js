import { DEFAULT_ASSET_TYPE, getAssetTypeOption } from "./assetTypeOptions.js"

const createProfile = ({
  id,
  label,
  summary,
  reports = [],
  kpis = [],
  columnKeys = [],
  eventRuleIds = [],
}) => ({
  id,
  label,
  summary,
  reports,
  reportTypeIds: reports.map((report) => report.id),
  kpis,
  columnKeys,
  eventRuleIds,
})

export const operationalProfileOptions = {
  car: createProfile({
    id: "car",
    label: "Supervision liviana",
    summary: "Prioriza viajes, kilometraje, velocidad y disponibilidad GPS.",
    reports: [
      { id: "route-history", label: "Viajes" },
      { id: "mileage", label: "Kilometraje" },
      { id: "speed", label: "Velocidad" },
      { id: "gps-signal", label: "Senal GPS" },
    ],
    kpis: ["Estado", "Velocidad", "Ultimo dato", "Kilometraje"],
    columnKeys: ["estado", "velocidad", "ultimoDato", "odometro", "gpsSignal"],
    eventRuleIds: ["movement", "speeding", "gpsSignal"],
  }),
  pickup: createProfile({
    id: "pickup",
    label: "Operacion tecnica",
    summary: "Combina viajes, zonas, detenciones y control de velocidad.",
    reports: [
      { id: "route-history", label: "Viajes" },
      { id: "mileage", label: "Kilometraje" },
      { id: "geofences", label: "Geocercas" },
      { id: "speed", label: "Velocidad" },
      { id: "stops", label: "Detenciones" },
    ],
    kpis: ["Estado", "Velocidad", "Geocerca", "Ultimo dato"],
    columnKeys: ["estado", "velocidad", "geocerca", "ultimoDato", "odometro"],
    eventRuleIds: ["movement", "geofence", "speeding", "stops"],
  }),
  truck: createProfile({
    id: "truck",
    label: "Carga y distribucion",
    summary: "Prioriza viajes, detenciones, ralenti, combustible y horas motor.",
    reports: [
      { id: "route-history", label: "Viajes" },
      { id: "mileage", label: "Kilometraje" },
      { id: "stops", label: "Detenciones" },
      { id: "idle-time", label: "Ralenti" },
      { id: "fuel", label: "Combustible" },
      { id: "engine-hours", label: "Horas motor" },
      { id: "geofences", label: "Geocercas" },
      { id: "speed", label: "Velocidad" },
    ],
    kpis: ["Velocidad", "Combustible", "Ralenti", "Horas motor"],
    columnKeys: ["estado", "velocidad", "combustible", "horometro", "ignition", "ultimoDato"],
    eventRuleIds: ["movement", "stops", "idle", "fuel", "engine", "geofence", "speeding"],
  }),
  bus: createProfile({
    id: "bus",
    label: "Transporte de pasajeros",
    summary: "Enfocado en viajes, paradas, velocidad, zonas y senal GPS.",
    reports: [
      { id: "route-history", label: "Viajes" },
      { id: "stops", label: "Paradas" },
      { id: "speed", label: "Velocidad" },
      { id: "geofences", label: "Geocercas" },
      { id: "gps-signal", label: "Senal GPS" },
    ],
    kpis: ["Estado", "Velocidad", "Paradas", "Ultimo dato"],
    columnKeys: ["estado", "velocidad", "geocerca", "ultimoDato", "odometro"],
    eventRuleIds: ["movement", "stops", "speeding", "geofence", "gpsSignal"],
  }),
  van: createProfile({
    id: "van",
    label: "Reparto cerrado",
    summary: "Prioriza viajes, kilometraje, detenciones, zonas y velocidad.",
    reports: [
      { id: "route-history", label: "Viajes" },
      { id: "mileage", label: "Kilometraje" },
      { id: "stops", label: "Detenciones" },
      { id: "geofences", label: "Geocercas" },
      { id: "speed", label: "Velocidad" },
    ],
    kpis: ["Estado", "Velocidad", "Geocerca", "Kilometraje"],
    columnKeys: ["estado", "velocidad", "geocerca", "odometro", "ultimoDato"],
    eventRuleIds: ["movement", "stops", "geofence", "speeding"],
  }),
  motorcycle: createProfile({
    id: "motorcycle",
    label: "Patrulla liviana",
    summary: "Enfocado en ubicacion, viajes, velocidad y senal GPS.",
    reports: [
      { id: "route-history", label: "Viajes" },
      { id: "mileage", label: "Kilometraje" },
      { id: "speed", label: "Velocidad" },
      { id: "gps-signal", label: "Senal GPS" },
      { id: "geofences", label: "Geocercas" },
    ],
    kpis: ["Estado", "Velocidad", "Senal GPS", "Ultimo dato"],
    columnKeys: ["estado", "velocidad", "gpsSignal", "ultimoDato", "coordinates"],
    eventRuleIds: ["movement", "speeding", "gpsSignal", "geofence"],
  }),
  machinery: createProfile({
    id: "machinery",
    label: "Maquinaria y faena",
    summary: "Prioriza horas motor, encendido, ralenti, combustible y geocercas.",
    reports: [
      { id: "engine-hours", label: "Horas motor" },
      { id: "ignition", label: "Encendido" },
      { id: "idle-time", label: "Ralenti" },
      { id: "fuel", label: "Combustible" },
      { id: "geofences", label: "Geocercas" },
      { id: "gps-signal", label: "Senal GPS" },
    ],
    kpis: ["Horas motor", "Encendido", "Ralenti", "Combustible"],
    columnKeys: ["estado", "ignition", "horometro", "combustible", "geocerca", "ultimoDato"],
    eventRuleIds: ["engine", "ignition", "idle", "fuel", "geofence", "gpsSignal"],
  }),
  trailer: createProfile({
    id: "trailer",
    label: "Remolque monitoreado",
    summary: "Enfocado en ubicacion, zonas, viajes asociados y disponibilidad GPS.",
    reports: [
      { id: "geofences", label: "Geocercas" },
      { id: "gps-signal", label: "Senal GPS" },
      { id: "route-history", label: "Viajes" },
      { id: "mileage", label: "Kilometraje" },
    ],
    kpis: ["Ubicacion", "Geocerca", "Senal GPS", "Ultimo dato"],
    columnKeys: ["estado", "geocerca", "gpsSignal", "ultimoDato", "coordinates"],
    eventRuleIds: ["geofence", "gpsSignal", "movement"],
  }),
}

const fallbackOperationalProfile = operationalProfileOptions[DEFAULT_ASSET_TYPE]

const normalizeReportTypeId = (value) => {
  return String(value || "").trim()
}

const getProfileIdFromAsset = (asset = {}) => {
  return (
    asset.operationalProfileId ||
    asset.assetType ||
    asset.tipoActivo ||
    asset.mapIcon ||
    asset.markerIcon ||
    asset.iconType
  )
}

export const getOperationalProfile = (assetType) => {
  const assetTypeOption = getAssetTypeOption(assetType)

  return operationalProfileOptions[assetTypeOption.value] || fallbackOperationalProfile
}

export const getOperationalProfileForAsset = (asset = {}) => {
  return getOperationalProfile(getProfileIdFromAsset(asset))
}

export const getOperationalProfilesForAssets = (assets = []) => {
  if (!Array.isArray(assets) || !assets.length) {
    return [fallbackOperationalProfile]
  }

  const profilesById = new Map()

  assets.forEach((asset) => {
    const profile = getOperationalProfileForAsset(asset)

    profilesById.set(profile.id, profile)
  })

  return Array.from(profilesById.values())
}

export const getOperationalProfileReportTypeIdsForAssets = (assets = []) => {
  const reportTypeIds = []

  getOperationalProfilesForAssets(assets).forEach((profile) => {
    profile.reportTypeIds.forEach((reportTypeId) => {
      if (!reportTypeIds.includes(reportTypeId)) {
        reportTypeIds.push(reportTypeId)
      }
    })
  })

  return reportTypeIds
}

export const isOperationalProfileReport = ({ reportTypeId, assets = [] } = {}) => {
  const normalizedReportTypeId = normalizeReportTypeId(reportTypeId)

  if (!normalizedReportTypeId) return false

  return getOperationalProfileReportTypeIdsForAssets(assets).includes(normalizedReportTypeId)
}

export const getOperationalProfileReportPriority = ({ reportTypeId, assets = [] } = {}) => {
  const recommendedReportTypeIds = getOperationalProfileReportTypeIdsForAssets(assets)
  const reportIndex = recommendedReportTypeIds.indexOf(normalizeReportTypeId(reportTypeId))

  return reportIndex >= 0 ? reportIndex : recommendedReportTypeIds.length + 100
}
