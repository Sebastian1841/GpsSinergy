import { formatTelemetryTime } from "../../../../utils/telemetryUtils.js"

export const isValidTelemetryNumber = (value) => {
  return Number.isFinite(Number(value))
}

export const formatTelemetrySpeed = (value) => {
  if (!isValidTelemetryNumber(value)) return null

  return `${Number(value).toFixed(1)} km/h`
}

export const getTelemetryUpdateMarkerId = (update = {}, normalizeId) => {
  return normalizeId(update?.id || update?.activo?.id || update?.assetId)
}

export const getChangedTelemetryIdsFromUpdates = (updates = [], normalizeId) => {
  return [
    ...new Set(
      updates
        .map((update) => {
          return getTelemetryUpdateMarkerId(update, normalizeId)
        })
        .filter(Boolean),
    ),
  ]
}

export const normalizeTelemetryBatchPayload = (payload = [], normalizeId) => {
  if (Array.isArray(payload)) {
    return {
      updates: payload,
      changedIds: getChangedTelemetryIdsFromUpdates(payload, normalizeId),
    }
  }

  const updates = Array.isArray(payload?.updates)
    ? payload.updates
    : Array.isArray(payload?.batch)
      ? payload.batch
      : Array.isArray(payload?.appliedUpdates)
        ? payload.appliedUpdates
        : []

  const changedIds = Array.isArray(payload?.changedIds)
    ? [
        ...new Set(
          payload.changedIds
            .map((id) => {
              return normalizeId(id)
            })
            .filter(Boolean),
        ),
      ]
    : getChangedTelemetryIdsFromUpdates(updates, normalizeId)

  return {
    updates,
    changedIds,
  }
}

export const mergeTelemetryUpdateIntoActivo = (activo = {}, update = {}) => {
  const sourceUpdate = update?.activo
    ? {
        ...update.activo,
        id: update.activo.id ?? update.id,
      }
    : update

  const timestamp =
    sourceUpdate.timestamp ||
    sourceUpdate.updatedAt ||
    sourceUpdate.updated_at ||
    sourceUpdate.lastReport ||
    sourceUpdate.lastTelemetryAt ||
    activo.timestamp ||
    activo.lastTelemetryAt

  const speedValue = sourceUpdate.velocidad ?? sourceUpdate.velocidad_kmh ?? sourceUpdate.speed
  const speedLabel = formatTelemetrySpeed(speedValue)
  const timeLabel = formatTelemetryTime(timestamp, {
    fallback: null,
  })

  return {
    ...activo,
    ...sourceUpdate,

    id: activo.id ?? sourceUpdate.id,

    lat: sourceUpdate.lat ?? activo.lat,
    lng: sourceUpdate.lng ?? activo.lng,

    estado: sourceUpdate.estado || sourceUpdate.status || activo.estado,
    heading:
      sourceUpdate.heading ??
      sourceUpdate.course ??
      sourceUpdate.bearing ??
      sourceUpdate.rumbo ??
      activo.heading,

    speed: isValidTelemetryNumber(speedValue) ? Number(speedValue) : activo.speed,
    velocidad: speedLabel || sourceUpdate.velocidad || activo.velocidad,
    velocidad_kmh: isValidTelemetryNumber(speedValue) ? Number(speedValue) : activo.velocidad_kmh,

    timestamp: timestamp || activo.timestamp,
    lastTelemetryAt: timestamp || activo.lastTelemetryAt,
    datosUlt: timeLabel || sourceUpdate.datosUlt || activo.datosUlt,
  }
}
