import { normalizeId } from "../idUtils.js"

export const CITY_ASSET_GROUP_TYPE = "city"
export const CITY_ASSET_GROUP_ID_PREFIX = "city-view:"

const DEFAULT_CITY_RADIUS_KM = 75

const CITY_CATALOG = [
  { id: "arica", name: "Arica", region: "Arica y Parinacota", lat: -18.4783, lng: -70.3126 },
  { id: "iquique", name: "Iquique", region: "Tarapaca", lat: -20.2133, lng: -70.1524 },
  { id: "calama", name: "Calama", region: "Antofagasta", lat: -22.4544, lng: -68.9294 },
  {
    id: "antofagasta",
    name: "Antofagasta",
    region: "Antofagasta",
    lat: -23.6509,
    lng: -70.3975,
  },
  { id: "copiapo", name: "Copiapo", region: "Atacama", lat: -27.3668, lng: -70.3323 },
  { id: "la-serena", name: "La Serena", region: "Coquimbo", lat: -29.9027, lng: -71.2519 },
  { id: "coquimbo", name: "Coquimbo", region: "Coquimbo", lat: -29.9533, lng: -71.3395 },
  { id: "valparaiso", name: "Valparaiso", region: "Valparaiso", lat: -33.0472, lng: -71.6127 },
  { id: "vina-del-mar", name: "Vina del Mar", region: "Valparaiso", lat: -33.0153, lng: -71.55 },
  {
    id: "santiago",
    name: "Santiago",
    region: "Metropolitana",
    lat: -33.4489,
    lng: -70.6693,
    radiusKm: 90,
  },
  { id: "rancagua", name: "Rancagua", region: "O'Higgins", lat: -34.1708, lng: -70.7444 },
  { id: "talca", name: "Talca", region: "Maule", lat: -35.4264, lng: -71.6554 },
  { id: "chillan", name: "Chillan", region: "Nuble", lat: -36.6066, lng: -72.1034 },
  { id: "concepcion", name: "Concepcion", region: "Biobio", lat: -36.8201, lng: -73.0444 },
  { id: "los-angeles", name: "Los Angeles", region: "Biobio", lat: -37.4697, lng: -72.3537 },
  { id: "angol", name: "Angol", region: "Araucania", lat: -37.8014, lng: -72.7162 },
  { id: "temuco", name: "Temuco", region: "Araucania", lat: -38.7359, lng: -72.5904 },
  { id: "valdivia", name: "Valdivia", region: "Los Rios", lat: -39.8142, lng: -73.2459 },
  { id: "osorno", name: "Osorno", region: "Los Lagos", lat: -40.5749, lng: -73.1337 },
  {
    id: "puerto-montt",
    name: "Puerto Montt",
    region: "Los Lagos",
    lat: -41.4693,
    lng: -72.9424,
  },
  { id: "coyhaique", name: "Coyhaique", region: "Aysen", lat: -45.5712, lng: -72.0685 },
  {
    id: "punta-arenas",
    name: "Punta Arenas",
    region: "Magallanes",
    lat: -53.1638,
    lng: -70.9171,
  },
]

const toNumber = (value) => {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

const toRad = (value) => (value * Math.PI) / 180

const getDistanceKm = (from, to) => {
  const earthRadiusKm = 6371
  const deltaLat = toRad(to.lat - from.lat)
  const deltaLng = toRad(to.lng - from.lng)
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)

  const haversine =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export const getAssetCoordinates = (asset) => {
  const lat = toNumber(asset?.lat ?? asset?.latitude ?? asset?.position?.lat)
  const lng = toNumber(asset?.lng ?? asset?.lon ?? asset?.longitude ?? asset?.position?.lng)

  if (lat === null || lng === null) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null

  return { lat, lng }
}

export const resolveAssetCity = (asset) => {
  const coordinates = getAssetCoordinates(asset)

  if (!coordinates) return null

  let nearestCity = null
  let nearestDistance = Infinity

  CITY_CATALOG.forEach((city) => {
    const distanceKm = getDistanceKm(coordinates, city)

    if (distanceKm < nearestDistance) {
      nearestCity = city
      nearestDistance = distanceKm
    }
  })

  if (!nearestCity) return null

  const maxDistanceKm = nearestCity.radiusKm || DEFAULT_CITY_RADIUS_KM

  if (nearestDistance > maxDistanceKm) return null

  return {
    ...nearestCity,
    distanceKm: nearestDistance,
  }
}

export const createCityAssetGroupId = (cityId) => {
  return `${CITY_ASSET_GROUP_ID_PREFIX}${normalizeId(cityId)}`
}

export const isCityAssetGroupId = (groupId) => {
  return normalizeId(groupId).startsWith(CITY_ASSET_GROUP_ID_PREFIX)
}

export const createCityAssetGroups = (assets = []) => {
  const groupsByCityId = new Map()

  assets.forEach((asset) => {
    const city = resolveAssetCity(asset)
    const assetId = normalizeId(asset?.id)

    if (!city || !assetId) return

    if (!groupsByCityId.has(city.id)) {
      groupsByCityId.set(city.id, {
        id: createCityAssetGroupId(city.id),
        type: CITY_ASSET_GROUP_TYPE,
        readonly: true,
        name: `Ciudad: ${city.name}`,
        description: city.region,
        assetIds: [],
      })
    }

    groupsByCityId.get(city.id).assetIds.push(assetId)
  })

  return Array.from(groupsByCityId.values())
    .map((group) => ({
      ...group,
      assetIds: Array.from(new Set(group.assetIds)),
    }))
    .sort((firstGroup, secondGroup) => {
      return String(firstGroup.name || "").localeCompare(String(secondGroup.name || ""), "es")
    })
}
