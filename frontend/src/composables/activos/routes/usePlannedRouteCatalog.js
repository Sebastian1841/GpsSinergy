import { ref } from "vue"

import { mockPlannedRoutes } from "../../../data/mockPlannedRoutes.js"
import { readJsonStorage, writeJsonStorage } from "../../../services/storage/browserStorage.js"

const ROUTE_PLAN_STORAGE_KEY = "activos.planned-routes.v1"
const DEFAULT_TOLERANCE_METERS = 300
const ROUTE_POINT_SAMPLE_LIMIT = 8
const ROUTE_GEOMETRY_POINT_LIMIT = 900
const DEFAULT_ROUTE_CENTER = {
  lat: -33.4489,
  lng: -70.6693,
}
const EMPTY_ROUTE_STOP_OFFSET = 0.004

const createId = (prefix) => {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const hasValidCoordinates = (point) => {
  return Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng))
}

const normalizeRouteStop = (stop = {}, index = 0) => {
  return {
    id: stop.id || createId(`stop-${index + 1}`),
    name: String(stop.name || stop.address || `Parada ${index + 1}`).trim(),
    lat: Number(stop.lat),
    lng: Number(stop.lng),
  }
}

const normalizeActualPoint = (point = {}) => {
  return {
    ...point,
    lat: Number(point.lat),
    lng: Number(point.lng),
  }
}

const normalizeFiniteNumber = (value, fallback = 0) => {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : fallback
}

const getRouteSeedPoint = (point) => {
  if (!hasValidCoordinates(point)) return DEFAULT_ROUTE_CENTER

  return {
    lat: Number(point.lat),
    lng: Number(point.lng),
  }
}

const firstText = (...values) => {
  return values.map((value) => String(value ?? "").trim()).find((value) => value && value !== "-")
}

const getAssetId = (asset) => {
  if (asset && typeof asset !== "object") {
    return String(asset).trim()
  }

  return firstText(asset?.id, asset?.activoId, asset?.deviceId, asset?.patente)
}

const getAssetLabel = (asset) => {
  if (!asset || typeof asset !== "object") return ""

  const name = firstText(asset.displayName, asset.nombrePantalla, asset.name, asset.deviceId)
  const plate = firstText(asset.patente, asset.plate, asset.licensePlate)

  if (!name) return plate || ""
  if (!plate || name.toLowerCase().includes(plate.toLowerCase())) return name

  return `${name} - ${plate}`
}

export const normalizePlannedRoute = (route = {}, index = 0) => {
  const stops = Array.isArray(route.stops) ? route.stops : []
  const actualPoints = Array.isArray(route.actualPoints) ? route.actualPoints : []
  const routePoints = Array.isArray(route.routePoints) ? route.routePoints : []
  const toleranceMeters = Number(route.toleranceMeters)
  const assetId = firstText(route.assetId, route.routeAssetId, getAssetId(route.asset))

  return {
    id: route.id || createId(`planned-route-${index + 1}`),
    name: String(route.name || `Ruta esperada ${index + 1}`).trim(),
    corridorLabel: String(route.corridorLabel || "Corredor operativo").trim(),
    toleranceMeters: Number.isFinite(toleranceMeters) ? toleranceMeters : DEFAULT_TOLERANCE_METERS,
    assetId,
    assetLabel: firstText(route.assetLabel, route.routeAssetLabel, getAssetLabel(route.asset)),
    stops: stops.map(normalizeRouteStop).filter(hasValidCoordinates),
    routePoints: routePoints.map(normalizeActualPoint).filter(hasValidCoordinates),
    routingStopsSignature: String(route.routingStopsSignature || ""),
    routingProvider: String(route.routingProvider || ""),
    routingDistanceMeters: normalizeFiniteNumber(route.routingDistanceMeters),
    routingDurationSeconds: normalizeFiniteNumber(route.routingDurationSeconds),
    actualPoints: actualPoints.map(normalizeActualPoint).filter(hasValidCoordinates),
  }
}

export const normalizePlannedRoutes = (routes = []) => {
  return routes.map(normalizePlannedRoute).filter((route) => route.name && route.stops.length >= 2)
}

export const clonePlannedRoutes = (routes = []) => {
  return normalizePlannedRoutes(routes).map((route) => ({
    ...route,
    stops: route.stops.map((stop) => ({ ...stop })),
    routePoints: route.routePoints.map((point) => ({ ...point })),
    actualPoints: route.actualPoints.map((point) => ({ ...point })),
  }))
}

export const createEmptyPlannedRoute = ({
  centerPoint = null,
  asset = null,
  assetId = "",
  assetLabel = "",
} = {}) => {
  const origin = getRouteSeedPoint(centerPoint)
  const destination = {
    lat: Number((origin.lat + EMPTY_ROUTE_STOP_OFFSET).toFixed(6)),
    lng: Number((origin.lng + EMPTY_ROUTE_STOP_OFFSET).toFixed(6)),
  }

  return {
    id: createId("planned-route"),
    name: "Nueva ruta esperada",
    corridorLabel: "Corredor operativo",
    toleranceMeters: DEFAULT_TOLERANCE_METERS,
    assetId: firstText(assetId, getAssetId(asset)),
    assetLabel: firstText(assetLabel, getAssetLabel(asset)),
    stops: [
      { id: createId("stop"), name: "Origen", lat: origin.lat, lng: origin.lng },
      { id: createId("stop"), name: "Destino", lat: destination.lat, lng: destination.lng },
    ],
    routePoints: [],
    routingStopsSignature: "",
    routingProvider: "",
    routingDistanceMeters: 0,
    routingDurationSeconds: 0,
    actualPoints: [],
  }
}

const sampleRoutePoints = (points = [], limit = ROUTE_POINT_SAMPLE_LIMIT) => {
  const validPoints = points.filter(hasValidCoordinates)

  if (validPoints.length <= limit) return validPoints

  const lastIndex = validPoints.length - 1
  const step = lastIndex / (limit - 1)

  return Array.from({ length: limit }, (_, index) => {
    return validPoints[Math.round(index * step)]
  })
}

const buildRoutePointsSignature = (points = []) => {
  return points
    .filter(hasValidCoordinates)
    .map((point) => {
      return `${Number(point.lat).toFixed(6)}:${Number(point.lng).toFixed(6)}`
    })
    .join("|")
}

export const createPlannedRouteFromPoints = ({
  points = [],
  name = "Ruta desde itinerario",
  corridorLabel = "Recorrido capturado",
  toleranceMeters = DEFAULT_TOLERANCE_METERS,
  includeRoutePoints = false,
  asset = null,
  assetId = "",
  assetLabel = "",
} = {}) => {
  const sampledPoints = sampleRoutePoints(points)
  const routePoints = includeRoutePoints
    ? sampleRoutePoints(points, ROUTE_GEOMETRY_POINT_LIMIT).map((point) => ({
        lat: Number(point.lat),
        lng: Number(point.lng),
      }))
    : []

  return {
    id: createId("planned-route"),
    name,
    corridorLabel,
    toleranceMeters,
    assetId: firstText(assetId, getAssetId(asset)),
    assetLabel: firstText(assetLabel, getAssetLabel(asset)),
    stops: sampledPoints.map((point, index) => ({
      id: createId("stop"),
      name: point.name || point.address || point.direccion || `Punto ${index + 1}`,
      lat: Number(point.lat),
      lng: Number(point.lng),
    })),
    routePoints,
    routingStopsSignature: includeRoutePoints ? buildRoutePointsSignature(sampledPoints) : "",
    routingProvider: includeRoutePoints ? "captured" : "",
    routingDistanceMeters: 0,
    routingDurationSeconds: 0,
    actualPoints: [],
  }
}

const loadPlannedRoutes = () => {
  const storedRoutes = normalizePlannedRoutes(readJsonStorage(ROUTE_PLAN_STORAGE_KEY, []))

  if (storedRoutes.length) return storedRoutes

  return clonePlannedRoutes(mockPlannedRoutes)
}

const plannedRoutes = ref(loadPlannedRoutes())

export const usePlannedRouteCatalog = () => {
  const savePlannedRoutes = (routes = []) => {
    const normalizedRoutes = normalizePlannedRoutes(routes)

    plannedRoutes.value = normalizedRoutes.length
      ? normalizedRoutes
      : clonePlannedRoutes(mockPlannedRoutes)

    writeJsonStorage(ROUTE_PLAN_STORAGE_KEY, plannedRoutes.value)
  }

  const resetPlannedRoutes = () => {
    plannedRoutes.value = clonePlannedRoutes(mockPlannedRoutes)
    writeJsonStorage(ROUTE_PLAN_STORAGE_KEY, plannedRoutes.value)
  }

  return {
    plannedRoutes,
    savePlannedRoutes,
    resetPlannedRoutes,
  }
}
