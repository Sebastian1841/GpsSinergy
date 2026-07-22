import { normalizeSignatureValue } from "../../../../utils/mapSignatureUtils.js"
import { getGeofenceLocationLabelForAsset } from "../../../../utils/activos/geofenceMembershipUtils.js"
import {
  formatFallbackCoordinateAddress,
  getCachedReverseGeocodeAddress,
  getReverseGeocodeCoordinates,
  getReverseGeocodeKey,
  isResolvableAddressPlaceholder,
  reverseGeocodeCoordinates,
} from "../../../../services/location/reverseGeocodingService.js"

const TOOLTIP_ADDRESS_FAILED_RETRY_MS = 30 * 1000

const pendingTooltipAddressKeys = new Set()
const failedTooltipAddressByKey = new Map()

const getActivoTooltipLabel = (activo) => {
  return (
    activo.nombrePantalla ||
    activo.displayName ||
    activo.vehiculo ||
    activo.patente ||
    activo.patent ||
    activo.name ||
    "Activo"
  )
}

const getActivoStatusLabel = (estado) => {
  const labels = {
    moving: "Ruta",
    idle: "Espera",
    stopped: "Alerta",
    offline: "Offline",
  }

  return labels[estado] || "Sin estado"
}

const getActivoSpeedLabel = (activo) => {
  const speedValue = activo.velocidad ?? activo.velocidad_kmh ?? activo.speed

  if (speedValue === null || speedValue === undefined || speedValue === "") return "0 km/h"

  const speedText = String(speedValue)

  if (speedText.toLowerCase().includes("km/h")) return speedText

  const numericSpeed = Number(speedValue)

  if (!Number.isFinite(numericSpeed)) return speedText

  return `${numericSpeed.toFixed(1)} km/h`
}

const getActivoLastReportLabel = (activo) => {
  const rawValue =
    activo.datosUlt ||
    activo.lastTelemetryAt ||
    activo.lastReport ||
    activo.lastReportAt ||
    activo.reportedAt ||
    activo.timestamp

  if (!rawValue) return "-"

  const rawText = String(rawValue)
  const parsedDate = new Date(rawText)

  if (Number.isNaN(parsedDate.getTime()) || !rawText.includes("T")) return rawText

  return parsedDate.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

const getActivoCoordinateLabel = (value) => {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) return "-"

  return numericValue.toFixed(5)
}

const getActivoAddressLabel = (
  activo,
  geofences = [],
  { useGeofenceLocationAddress = true } = {},
) => {
  const geofenceLocationLabel = getGeofenceLocationLabelForAsset(activo, geofences, {
    enabled: useGeofenceLocationAddress,
  })

  if (geofenceLocationLabel) return geofenceLocationLabel

  const existingAddress =
    activo.resolvedAddress ||
    activo.address ||
    activo.direccion ||
    activo.lastPosition ||
    activo.ubicacion ||
    ""

  if (!isResolvableAddressPlaceholder(existingAddress)) return existingAddress

  const coordinates = getReverseGeocodeCoordinates(activo)
  const cachedAddress = getCachedReverseGeocodeAddress(coordinates)

  if (cachedAddress) return cachedAddress

  return formatFallbackCoordinateAddress(coordinates)
}

const escapeTooltipHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

const getActivoTooltipContent = (
  activo,
  geofences = [],
  { useGeofenceLocationAddress = true } = {},
) => {
  const label = escapeTooltipHtml(getActivoTooltipLabel(activo))
  const patent = escapeTooltipHtml(activo.patente || activo.patent || "Sin patente")
  const status = escapeTooltipHtml(getActivoStatusLabel(activo.estado))
  const speed = escapeTooltipHtml(getActivoSpeedLabel(activo))
  const lastReport = escapeTooltipHtml(getActivoLastReportLabel(activo))
  const address = escapeTooltipHtml(
    getActivoAddressLabel(activo, geofences, {
      useGeofenceLocationAddress,
    }),
  )
  const lat = escapeTooltipHtml(getActivoCoordinateLabel(activo.lat))
  const lng = escapeTooltipHtml(getActivoCoordinateLabel(activo.lng))

  return `
      <div class="min-w-[190px] max-w-[280px] text-left leading-tight">
        <div class="font-black">${label}</div>
        <div class="mt-0.5 text-[10px] font-bold opacity-80">${patent} - ${status}</div>
        <div class="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10px] font-bold opacity-90">
          <span class="opacity-70">Vel.</span><span>${speed}</span>
          <span class="opacity-70">Ult.</span><span>${lastReport}</span>
          <span class="opacity-70">Dir.</span><span class="whitespace-normal leading-snug">${address}</span>
          <span class="opacity-70">GPS</span><span>${lat}, ${lng}</span>
        </div>
      </div>
    `
}

export function createAssetMarkerTooltipController({
  normalizeId,
  latestActivosById,
  getMarkerKind,
  getGeofences = () => [],
  getUseGeofenceLocationAddress = () => true,
}) {
  const bindActivoTooltipWithAddress = (marker, activo, { permanent = false, address } = {}) => {
    bindActivoTooltip(
      marker,
      address
        ? {
            ...activo,
            address,
            direccion: address,
            lastPosition: address,
            resolvedAddress: address,
          }
        : activo,
      {
        permanent,
      },
    )
  }

  const shouldRetryAddressResolve = (key) => {
    const failedAt = failedTooltipAddressByKey.get(key)

    return !failedAt || Date.now() - failedAt >= TOOLTIP_ADDRESS_FAILED_RETRY_MS
  }

  const resolveTooltipAddress = async (marker, activo, { permanent = false } = {}) => {
    const existingAddress = getActivoAddressLabel(activo, getGeofences(), {
      useGeofenceLocationAddress: getUseGeofenceLocationAddress(),
    })

    if (!isResolvableAddressPlaceholder(existingAddress)) return

    const coordinates = getReverseGeocodeCoordinates(activo)
    const key = getReverseGeocodeKey(coordinates)

    if (!key || pendingTooltipAddressKeys.has(key) || !shouldRetryAddressResolve(key)) return

    const cachedAddress = getCachedReverseGeocodeAddress(coordinates)

    if (cachedAddress) {
      bindActivoTooltipWithAddress(marker, activo, {
        permanent,
        address: cachedAddress,
      })
      return
    }

    pendingTooltipAddressKeys.add(key)

    try {
      const address = await reverseGeocodeCoordinates(coordinates)

      if (!address) {
        failedTooltipAddressByKey.set(key, Date.now())
        return
      }

      failedTooltipAddressByKey.delete(key)
      bindActivoTooltipWithAddress(marker, activo, {
        permanent,
        address,
      })
    } finally {
      pendingTooltipAddressKeys.delete(key)
    }
  }

  const buildMarkerTooltipSignature = (activo) => {
    const geofenceLocationLabel = getGeofenceLocationLabelForAsset(activo, getGeofences(), {
      enabled: getUseGeofenceLocationAddress(),
    })

    return [
      getMarkerKind(activo),
      activo.id,
      activo.vehiculo,
      activo.nombrePantalla,
      activo.displayName,
      activo.patente,
      activo.patent,
      activo.name,
      activo.estado,
      activo.velocidad,
      activo.velocidad_kmh,
      activo.speed,
      activo.datosUlt,
      activo.timestamp,
      activo.lastTelemetryAt,
      activo.lastReport,
      activo.address,
      activo.direccion,
      activo.lastPosition,
      activo.ubicacion,
      activo.resolvedAddress,
      geofenceLocationLabel,
      activo.lat,
      activo.lng,
    ]
      .map(normalizeSignatureValue)
      .join(":")
  }

  const bindActivoTooltip = (marker, activo, { permanent = false } = {}) => {
    const content = getActivoTooltipContent(activo, getGeofences(), {
      useGeofenceLocationAddress: getUseGeofenceLocationAddress(),
    })
    const currentTooltip = marker.getTooltip?.()

    if (currentTooltip) {
      currentTooltip.setContent(content)
      return
    }

    marker.bindTooltip(content, {
      permanent,
      direction: "top",
      sticky: !permanent,
      offset: permanent ? [0, -12] : [0, -8],
      className: "sinergy-tooltip",
    })
  }

  const bindActivoTooltipOpenRefresh = (marker, activo, { permanent = false } = {}) => {
    marker.on("tooltipopen", () => {
      const markerId = normalizeId(activo?.id)
      const latestActivo = latestActivosById.get(markerId) || activo

      bindActivoTooltip(marker, latestActivo, {
        permanent,
      })
      resolveTooltipAddress(marker, latestActivo, {
        permanent,
      })
    })
  }

  const bindLazyActivoTooltip = (marker, activo) => {
    marker.on("mouseover", () => {
      const markerId = normalizeId(activo?.id)
      const latestActivo = latestActivosById.get(markerId) || activo

      bindActivoTooltip(marker, latestActivo)
      marker.openTooltip?.()
      resolveTooltipAddress(marker, latestActivo)
    })
  }

  const bindSelectedActivoTooltip = (marker, activo) => {
    bindActivoTooltip(marker, activo, {
      permanent: true,
    })
    resolveTooltipAddress(marker, activo, {
      permanent: true,
    })
  }

  return {
    buildMarkerTooltipSignature,
    bindActivoTooltip,
    bindActivoTooltipOpenRefresh,
    bindLazyActivoTooltip,
    bindSelectedActivoTooltip,
  }
}
