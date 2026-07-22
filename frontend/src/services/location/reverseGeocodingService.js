import { readJsonStorage, writeJsonStorage } from "../storage/browserStorage.js"

const CACHE_KEY = "sinergy-reverse-geocoding-cache-v1"
const PROVIDER_OVERRIDE_KEY = "sinergy-reverse-geocoding-url"
const DEFAULT_PROVIDER_URL = "https://nominatim.openstreetmap.org/reverse"
const REQUEST_INTERVAL_MS = 1100
const MAX_CACHE_ENTRIES = 800
const COORDINATE_CACHE_DECIMALS = 4
const DEFAULT_SOURCE_RESOLVE_LIMIT = 60

export const REVERSE_GEOCODING_ATTRIBUTION = "Direcciones por OpenStreetMap"

let memoryCache = null
let lastRequestAt = 0
let requestQueue = Promise.resolve()
const pendingRequests = new Map()

const wait = (milliseconds) => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

const readCache = () => {
  if (memoryCache) return memoryCache

  memoryCache = readJsonStorage(CACHE_KEY, {})

  return memoryCache
}

const persistCache = () => {
  const entries = Object.entries(memoryCache || {})

  if (entries.length > MAX_CACHE_ENTRIES) {
    memoryCache = Object.fromEntries(entries.slice(entries.length - MAX_CACHE_ENTRIES))
  }

  writeJsonStorage(CACHE_KEY, memoryCache || {})
}

const getRuntimeProviderUrl = () => {
  if (typeof window === "undefined") return DEFAULT_PROVIDER_URL

  return (
    window.__SINERGY_REVERSE_GEOCODING_URL__ ||
    window.localStorage?.getItem(PROVIDER_OVERRIDE_KEY) ||
    import.meta.env?.VITE_REVERSE_GEOCODING_URL ||
    DEFAULT_PROVIDER_URL
  )
}

export const isReverseGeocodingEnabled = () => {
  return import.meta.env?.VITE_REVERSE_GEOCODING_ENABLED !== "false"
}

const parseCoordinate = (value) => {
  if (Number.isFinite(Number(value))) return Number(value)

  const match = String(value ?? "").match(/-?\d+(?:[.,]\d+)?/)

  if (!match) return null

  const parsedValue = Number(match[0].replace(",", "."))

  return Number.isFinite(parsedValue) ? parsedValue : null
}

export const getReverseGeocodeCoordinates = (source = {}) => {
  const values = source.values || {}
  const report = source.report || source.generatedEvent?.report || {}
  const itineraryRow = source.itineraryRow || {}
  const asset = source.asset || {}
  const lat = parseCoordinate(
    source.lat ??
      source.latitude ??
      source.latitud ??
      itineraryRow.lat ??
      itineraryRow.latitude ??
      itineraryRow.latitud ??
      report.lat ??
      report.latitude ??
      report.latitud ??
      asset.lat ??
      asset.latitude ??
      asset.latitud ??
      values.lat ??
      values.latitude ??
      values.latitud,
  )
  const lng = parseCoordinate(
    source.lng ??
      source.lon ??
      source.longitude ??
      source.longitud ??
      itineraryRow.lng ??
      itineraryRow.lon ??
      itineraryRow.longitude ??
      itineraryRow.longitud ??
      report.lng ??
      report.lon ??
      report.longitude ??
      report.longitud ??
      asset.lng ??
      asset.lon ??
      asset.longitude ??
      asset.longitud ??
      values.lng ??
      values.lon ??
      values.longitude ??
      values.longitud,
  )

  if (lat === null || lng === null) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null

  return { lat, lng }
}

export const getReverseGeocodeKey = (coordinates) => {
  const lat = parseCoordinate(coordinates?.lat)
  const lng = parseCoordinate(coordinates?.lng)

  if (lat === null || lng === null) return ""

  return `${lat.toFixed(COORDINATE_CACHE_DECIMALS)},${lng.toFixed(COORDINATE_CACHE_DECIMALS)}`
}

export const formatFallbackCoordinateAddress = (coordinates) => {
  const key = getReverseGeocodeKey(coordinates)

  return key ? `Coordenadas ${key.replace(",", ", ")}` : "Sin direccion"
}

export const getCachedReverseGeocodeAddress = (coordinates) => {
  const key = getReverseGeocodeKey(coordinates)

  if (!key) return ""

  return readCache()[key] || ""
}

const withResolvedAddressValue = (source = {}, address = "") => {
  const values = source.values ? { ...source.values } : null
  const itineraryRow = source.itineraryRow ? { ...source.itineraryRow, address } : null

  if (values) {
    values.address = address
    if (Object.hasOwn(values, "lastPosition")) values.lastPosition = address
  }

  return {
    ...source,
    address,
    direccion: address,
    lastPosition: address,
    resolvedAddress: address,
    ...(values ? { values } : {}),
    ...(itineraryRow ? { itineraryRow } : {}),
  }
}

export const isResolvableAddressPlaceholder = (value) => {
  const rawText = String(value ?? "").trim()
  const text = rawText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (!text || text === "-") return true

  const coordinateValues = rawText.match(/-?\d+(?:[.,]\d+)?/g)
  const coordinateOnlyText = rawText.replace(/[0-9.,\-\s()]/g, "")

  if (coordinateValues?.length === 2 && !coordinateOnlyText) return true

  return [
    "sin direccion",
    "ubicacion actual",
    "ubicacion pendiente",
    "ubicacion pendiente de reporte gps",
    "ultima ubicacion registrada",
    "ultima ubicacion",
    "reporte gps",
    "coordenadas",
  ].some((placeholder) => text.includes(placeholder))
}

const normalizeCoordinates = ({ lat, lng } = {}) => {
  const parsedLat = parseCoordinate(lat)
  const parsedLng = parseCoordinate(lng)

  if (parsedLat === null || parsedLng === null) return null
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return null

  return {
    lat: parsedLat,
    lng: parsedLng,
  }
}

export const getRouteTripEndpointCoordinates = (source = {}, endpoint = "start") => {
  const values = source.values || {}
  const report = source.report || source.generatedEvent?.report || {}
  const points = Array.isArray(source.routeTrip?.points) ? source.routeTrip.points : []
  const routePoint = endpoint === "end" ? points.at(-1) : points[0]
  const pointCoordinates = normalizeCoordinates(routePoint)

  if (pointCoordinates) return pointCoordinates

  if (endpoint === "end") {
    return normalizeCoordinates({
      lat:
        source.destinationLat ??
        source.endLat ??
        report.destinationLat ??
        report.endLat ??
        values.destinationLat ??
        values.endLat,
      lng:
        source.destinationLng ??
        source.destinationLon ??
        source.endLng ??
        source.endLon ??
        report.destinationLng ??
        report.destinationLon ??
        report.endLng ??
        report.endLon ??
        values.destinationLng ??
        values.destinationLon ??
        values.endLng ??
        values.endLon,
    })
  }

  return normalizeCoordinates({
    lat: source.startLat ?? report.startLat ?? values.startLat ?? source.lat ?? report.lat,
    lng:
      source.startLng ??
      source.startLon ??
      report.startLng ??
      report.startLon ??
      values.startLng ??
      values.startLon ??
      source.lng ??
      source.lon ??
      report.lng ??
      report.lon,
  })
}

export const getRouteTripEndpointAddressValue = (source = {}, endpoint = "start") => {
  const values = source.values || {}
  const report = source.report || source.generatedEvent?.report || {}

  if (endpoint === "end") {
    return (
      source.routeTrip?.endAddress ||
      values.tripDestination ||
      report.tripDestination ||
      source.tripDestination ||
      ""
    )
  }

  return (
    source.routeTrip?.startAddress ||
    values.tripOrigin ||
    report.tripOrigin ||
    source.tripOrigin ||
    ""
  )
}

export const shouldResolveRouteTripEndpointReverseGeocode = (source = {}, endpoint = "start") => {
  if (!isResolvableAddressPlaceholder(getRouteTripEndpointAddressValue(source, endpoint))) {
    return false
  }

  return Boolean(getRouteTripEndpointCoordinates(source, endpoint))
}

export const withResolvedRouteTripEndpointAddresses = (
  source = {},
  { startAddress = "", endAddress = "" } = {},
) => {
  const values = source.values ? { ...source.values } : null
  const report = source.report ? { ...source.report } : null
  const routeTrip = source.routeTrip ? { ...source.routeTrip } : null

  if (startAddress) {
    if (values) values.tripOrigin = startAddress
    if (report) report.tripOrigin = startAddress
    if (routeTrip) routeTrip.startAddress = startAddress
  }

  if (endAddress) {
    if (values) values.tripDestination = endAddress
    if (report) report.tripDestination = endAddress
    if (routeTrip) routeTrip.endAddress = endAddress
  }

  return {
    ...source,
    ...(values ? { values } : {}),
    ...(report ? { report } : {}),
    ...(routeTrip ? { routeTrip } : {}),
  }
}

export const getExistingAddressValue = (source = {}) => {
  const values = source.values || {}
  const report = source.report || source.generatedEvent?.report || {}
  const itineraryRow = source.itineraryRow || {}
  const asset = source.asset || {}

  return (
    source.resolvedAddress ||
    source.address ||
    source.direccion ||
    source.lastPosition ||
    itineraryRow.address ||
    values.address ||
    values.lastPosition ||
    report.address ||
    report.direccion ||
    report.lastPosition ||
    asset.address ||
    asset.direccion ||
    asset.lastPosition ||
    ""
  )
}

export const shouldResolveReverseGeocode = (source = {}) => {
  if (!isResolvableAddressPlaceholder(getExistingAddressValue(source))) return false

  return Boolean(getReverseGeocodeCoordinates(source))
}

const buildProviderUrl = (coordinates) => {
  const providerUrl = getRuntimeProviderUrl()
  const baseUrl = typeof window === "undefined" ? DEFAULT_PROVIDER_URL : window.location.origin
  const url = new URL(providerUrl, baseUrl)

  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("lat", String(coordinates.lat))
  url.searchParams.set("lon", String(coordinates.lng))
  url.searchParams.set("zoom", "18")
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("accept-language", "es")

  return url
}

const buildAddressLabel = (payload = {}) => {
  const address = payload.address || {}
  const road = address.road || address.pedestrian || address.footway || address.path
  const houseNumber = address.house_number
  const street = [road, houseNumber].filter(Boolean).join(" ")
  const locality =
    address.neighbourhood ||
    address.suburb ||
    address.city_district ||
    address.city ||
    address.town ||
    address.village ||
    address.municipality
  const region = address.state || address.region || address.county
  const label = [street, locality, region].filter(Boolean).join(", ")

  return label || payload.display_name || ""
}

const runQueuedRequest = async (request) => {
  requestQueue = requestQueue
    .catch(() => null)
    .then(async () => {
      const elapsed = Date.now() - lastRequestAt

      if (elapsed < REQUEST_INTERVAL_MS) {
        await wait(REQUEST_INTERVAL_MS - elapsed)
      }

      lastRequestAt = Date.now()

      return request()
    })

  return requestQueue
}

export const reverseGeocodeCoordinates = async (coordinates) => {
  if (
    !isReverseGeocodingEnabled() ||
    typeof window === "undefined" ||
    typeof fetch !== "function"
  ) {
    return null
  }

  const key = getReverseGeocodeKey(coordinates)

  if (!key) return null

  const cache = readCache()

  if (cache[key]) return cache[key]
  if (pendingRequests.has(key)) return pendingRequests.get(key)

  const request = runQueuedRequest(async () => {
    try {
      const response = await fetch(buildProviderUrl(coordinates), {
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) return null

      const payload = await response.json()
      const address = buildAddressLabel(payload)

      if (!address) return null

      memoryCache = {
        ...readCache(),
        [key]: address,
      }
      persistCache()

      return address
    } catch {
      return null
    } finally {
      pendingRequests.delete(key)
    }
  })

  pendingRequests.set(key, request)

  return request
}

export const resolveReverseGeocodedSources = async (
  sources = [],
  {
    limit = DEFAULT_SOURCE_RESOLVE_LIMIT,
    fetchMissing = true,
    enabled = true,
    resolveAddresses = true,
    resolveTripEndpoints = false,
  } = {},
) => {
  const rows = Array.isArray(sources) ? sources : []

  if (enabled === false || !isReverseGeocodingEnabled()) {
    return rows
  }

  const resolvedAddressByKey = new Map()
  const resolveLimit = Math.max(0, Number(limit) || 0)
  let resolvedMissingCount = 0

  const resolveAddress = async ({ existingAddress = "", coordinates = null } = {}) => {
    if (!isResolvableAddressPlaceholder(existingAddress)) {
      return existingAddress
    }

    if (!coordinates) return existingAddress || "Sin direccion"

    const key = getReverseGeocodeKey(coordinates)

    if (!key) return existingAddress || "Sin direccion"
    if (resolvedAddressByKey.has(key)) return resolvedAddressByKey.get(key)

    const cachedAddress = getCachedReverseGeocodeAddress(coordinates)

    if (cachedAddress) {
      resolvedAddressByKey.set(key, cachedAddress)
      return cachedAddress
    }

    if (fetchMissing && resolvedMissingCount < resolveLimit) {
      resolvedMissingCount += 1
      const address = await reverseGeocodeCoordinates(coordinates)

      if (address) {
        resolvedAddressByKey.set(key, address)
        return address
      }
    }

    const fallbackAddress = formatFallbackCoordinateAddress(coordinates)

    resolvedAddressByKey.set(key, fallbackAddress)
    return fallbackAddress
  }

  const resolvedRows = []

  for (const source of rows) {
    let resolvedRow = source

    if (resolveAddresses) {
      const address = await resolveAddress({
        existingAddress: getExistingAddressValue(source),
        coordinates: getReverseGeocodeCoordinates(source),
      })

      resolvedRow = withResolvedAddressValue(resolvedRow, address)
    }

    if (resolveTripEndpoints) {
      const startAddress = await resolveAddress({
        existingAddress: getRouteTripEndpointAddressValue(source, "start"),
        coordinates: getRouteTripEndpointCoordinates(source, "start"),
      })
      const endAddress = await resolveAddress({
        existingAddress: getRouteTripEndpointAddressValue(source, "end"),
        coordinates: getRouteTripEndpointCoordinates(source, "end"),
      })

      resolvedRow = withResolvedRouteTripEndpointAddresses(resolvedRow, {
        startAddress,
        endAddress,
      })
    }

    resolvedRows.push(resolvedRow)
  }

  return resolvedRows
}
