import { ref, unref } from "vue"
import { parseNumberFromLabel } from "../../../utils/numberUtils.js"
import { getReportsForAsset } from "../fleet/useTelemetryHistory.js"

const padTimePart = (value, size = 2) => {
  return String(value).padStart(size, "0")
}

const parseMinutesFromLabel = (label) => {
  if (!label) return 0

  const text = String(label).toLowerCase()
  const hours = text.match(/(\d+(?:[.,]\d+)?)\s*h/)
  const minutes = text.match(/(\d+(?:[.,]\d+)?)\s*min/)

  const parsedHours = hours ? Number(hours[1].replace(",", ".")) || 0 : 0
  const parsedMinutes = minutes ? Number(minutes[1].replace(",", ".")) || 0 : 0

  if (!hours && !minutes) {
    return parseNumberFromLabel(text)
  }

  return parsedHours * 60 + parsedMinutes
}

const formatDistance = (value) => {
  return `${value.toFixed(1).replace(".", ",")} km`
}

const formatMinutes = (value) => {
  const total = Math.round(value)
  const hours = Math.floor(total / 60)
  const minutes = total % 60

  if (hours <= 0) return `${minutes} min`
  if (minutes <= 0) return `${hours} h`

  return `${hours} h ${minutes} min`
}

const hasValidAssetLocation = (asset) => {
  const lat = Number(asset?.lat)
  const lng = Number(asset?.lng)

  return Number.isFinite(lat) && Number.isFinite(lng)
}

const hasValidPointLocation = (point) => {
  const lat = Number(point?.lat)
  const lng = Number(point?.lng)

  return Number.isFinite(lat) && Number.isFinite(lng)
}

const normalizeAssetId = (asset) => {
  return String(asset?.id || asset?.activoId || asset?.deviceId || asset?.patente || "")
}

const normalizePointKey = (point) => {
  return [
    point?.assetId,
    point?.timestamp,
    point?.lat,
    point?.lng,
    point?.speed,
    point?.isLiveTelemetry ? "live" : "historical",
  ]
    .map((value) => String(value ?? ""))
    .join("|")
}

const sortPointsByTimestamp = (points = []) => {
  return [...points].sort((firstPoint, secondPoint) => {
    const firstTime = new Date(firstPoint.timestamp || 0).getTime()
    const secondTime = new Date(secondPoint.timestamp || 0).getTime()

    return firstTime - secondTime
  })
}

const mergeRoutePoints = (...pointLists) => {
  const pointsByKey = new Map()

  pointLists.flat().forEach((point) => {
    if (!point?.timestamp) return

    pointsByKey.set(normalizePointKey(point), point)
  })

  return sortPointsByTimestamp(Array.from(pointsByKey.values()))
}

const normalizeDateOnly = (value) => {
  const rawValue = unref(value)

  if (!rawValue) {
    const now = new Date()

    return [now.getFullYear(), padTimePart(now.getMonth() + 1), padTimePart(now.getDate())].join(
      "-",
    )
  }

  const rawText = String(rawValue)

  if (/^\d{4}-\d{2}-\d{2}/.test(rawText)) {
    return rawText.slice(0, 10)
  }

  const date = new Date(rawText)

  if (Number.isNaN(date.getTime())) {
    const now = new Date()

    return [now.getFullYear(), padTimePart(now.getMonth() + 1), padTimePart(now.getDate())].join(
      "-",
    )
  }

  return [date.getFullYear(), padTimePart(date.getMonth() + 1), padTimePart(date.getDate())].join(
    "-",
  )
}

const isTimeOnlyValue = (value) => {
  return /^\d{1,2}:\d{2}(:\d{2})?(\.\d{1,3})?$/.test(String(value || "").trim())
}

const buildDateFromTimeOnly = ({ dateString, timeValue }) => {
  const cleanTime = String(timeValue || "").trim()
  const [hours = "00", minutes = "00", rawSeconds = "00"] = cleanTime.split(":")
  const [seconds = "00", rawMilliseconds = "000"] = String(rawSeconds).split(".")

  return new Date(
    `${dateString}T${padTimePart(hours)}:${padTimePart(minutes)}:${padTimePart(seconds)}.${padTimePart(
      rawMilliseconds,
      3,
    )}`,
  )
}

const parseAssetReportDate = ({ asset, referenceDate }) => {
  const candidates = [
    asset?.timestamp,
    asset?.lastReport,
    asset?.reportedAt,
    asset?.lastReportAt,
    asset?.fechaHora,
    asset?.fechaUltimoReporte,
    asset?.updatedAt,
    asset?.updated_at,
    asset?.datosUlt,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue

    if (isTimeOnlyValue(candidate)) {
      const timeOnlyDate = buildDateFromTimeOnly({
        dateString: referenceDate,
        timeValue: candidate,
      })

      if (!Number.isNaN(timeOnlyDate.getTime())) {
        return timeOnlyDate
      }
    }

    const date = new Date(candidate)

    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  return new Date()
}

const buildTimestampOnReferenceDate = ({ source, referenceDate }) => {
  const reportDate = parseAssetReportDate({
    asset: source,
    referenceDate,
  })

  const reportTime = [
    padTimePart(reportDate.getHours()),
    padTimePart(reportDate.getMinutes()),
    padTimePart(reportDate.getSeconds()),
  ].join(":")

  const milliseconds = padTimePart(reportDate.getMilliseconds(), 3)

  return `${referenceDate}T${reportTime}.${milliseconds}`
}

const getTimestampCandidates = (source = {}) => {
  return [
    source.timestamp,
    source.lastReport,
    source.reportedAt,
    source.lastReportAt,
    source.fechaHora,
    source.fechaUltimoReporte,
    source.updatedAt,
    source.updated_at,
    source.datosUlt,
  ]
}

const normalizeReportTimestamp = ({ source, referenceDate }) => {
  const candidates = getTimestampCandidates(source)

  for (const candidate of candidates) {
    if (!candidate) continue

    const rawText = String(candidate).trim()

    if (isTimeOnlyValue(rawText)) {
      return buildTimestampOnReferenceDate({
        source: {
          timestamp: rawText,
        },
        referenceDate,
      })
    }

    const date = new Date(rawText)

    if (Number.isNaN(date.getTime())) continue

    if (/^\d{4}-\d{2}-\d{2}/.test(rawText)) {
      return rawText
    }

    return [date.getFullYear(), padTimePart(date.getMonth() + 1), padTimePart(date.getDate())].join(
      "-",
    )
  }

  return buildTimestampOnReferenceDate({
    source,
    referenceDate,
  })
}

const isPointInsideDateRange = ({ point, fromDate, toDate }) => {
  const date = String(point?.timestamp || "").slice(0, 10)

  return date >= fromDate && date <= toDate
}

export function useItineraryRoute({
  emit,
  latestDate,
  selectedAssetIds,
  filteredAssets,
  selectedAssets,
  primarySelectedAsset,
  showDeviceList,
  fromDate,
  toDate,
  formError,
  applyDateRange,
  filterItineraryPoints,
  buildItineraryResult,
}) {
  const routeResult = ref(null)
  const selectedPointId = ref(null)

  const validateSearch = () => {
    formError.value = ""

    if (!selectedAssetIds.value.length && !filteredAssets.value.length) {
      formError.value = "Selecciona al menos un dispositivo disponible."
      return false
    }

    if (!fromDate.value || !toDate.value) {
      formError.value = "Selecciona una fecha de inicio y término."
      return false
    }

    if (fromDate.value > toDate.value) {
      formError.value = "La fecha inicial no puede ser mayor que la fecha final."
      return false
    }

    return true
  }

  const getCurrentReferenceDate = () => {
    return normalizeDateOnly(latestDate)
  }

  const isCurrentDateInsideRange = () => {
    const currentDate = getCurrentReferenceDate()

    return fromDate.value <= currentDate && currentDate <= toDate.value
  }

  const shouldAppendCurrentLocation = (asset) => {
    return isCurrentDateInsideRange() && hasValidAssetLocation(asset)
  }

  const getCurrentLocationTimestamp = (asset) => {
    return buildTimestampOnReferenceDate({
      source: asset,
      referenceDate: getCurrentReferenceDate(),
    })
  }

  const buildCurrentLocationPoint = (asset) => {
    const timestamp = getCurrentLocationTimestamp(asset)
    const assetId = normalizeAssetId(asset)
    const cleanTimestamp = timestamp.replace(/\D/g, "")

    return {
      ...asset,
      id: `${assetId}-live-current-${cleanTimestamp}`,
      assetId,
      timestamp,
      lat: Number(asset.lat),
      lng: Number(asset.lng),
      speed: parseNumberFromLabel(asset.speed ?? asset.velocidad ?? asset.velocidad_kmh),
      address: asset.direccion || asset.address || "Ubicacion actual",
      event: "Reporte GPS",
      odometer: asset.odometer || asset.odometro || null,
      ignition: asset.ignition ?? asset.ignicion ?? asset.contacto ?? null,
      ignicion: asset.ignicion ?? asset.ignition ?? asset.contacto ?? null,
      contacto: asset.contacto ?? asset.ignition ?? asset.ignicion ?? null,
      digitalInput1: asset.digitalInput1 ?? asset.input1 ?? asset.di1 ?? null,
      digitalInput2: asset.digitalInput2 ?? asset.input2 ?? asset.di2 ?? null,
      gpsSatellites: asset.gpsSatellites ?? asset.satellites ?? asset.satelites ?? null,
      isCurrentLocation: true,
      isLiveTelemetry: true,
    }
  }

  const getCurrentLocationPointForAsset = (asset) => {
    if (!shouldAppendCurrentLocation(asset)) return []

    return [buildCurrentLocationPoint(asset)]
  }

  const normalizeTelemetryReportPoint = ({ asset, report, index }) => {
    const referenceDate = getCurrentReferenceDate()
    const timestamp = normalizeReportTimestamp({
      source: report,
      referenceDate,
    })

    const assetId = normalizeAssetId(asset)
    const cleanTimestamp = String(timestamp).replace(/\D/g, "")

    return {
      ...report,
      id: report.id || `${assetId}-live-history-${cleanTimestamp}-${index}`,
      assetId,
      timestamp,
      lat: Number(report.lat ?? asset.lat),
      lng: Number(report.lng ?? asset.lng),
      speed: parseNumberFromLabel(report.speed ?? report.velocidad ?? report.velocidad_kmh),
      speedLabel: report.speedLabel || report.velocidad || null,
      timeLabel: report.timeLabel || report.datosUlt || null,
      address: report.address || report.direccion || asset.direccion || "Ubicacion actual",
      event: report.event || "Reporte GPS",
      odometer: report.odometer || report.odometro || asset.odometer || asset.odometro || null,
      ignition: report.ignition ?? report.ignicion ?? report.contacto ?? asset.ignition ?? null,
      ignicion: report.ignicion ?? report.ignition ?? report.contacto ?? asset.ignicion ?? null,
      contacto: report.contacto ?? report.ignition ?? report.ignicion ?? asset.contacto ?? null,
      digitalInput1:
        report.digitalInput1 ?? report.input1 ?? report.di1 ?? asset.digitalInput1 ?? null,
      digitalInput2:
        report.digitalInput2 ?? report.input2 ?? report.di2 ?? asset.digitalInput2 ?? null,
      gpsSatellites:
        report.gpsSatellites ??
        report.satellites ??
        report.satelites ??
        asset.gpsSatellites ??
        asset.satellites ??
        asset.satelites ??
        null,
      isCurrentLocation: Boolean(report.isCurrentLocation),
      isLiveTelemetry: report.isLiveTelemetry ?? true,
    }
  }

  const buildRouteQueryKey = (assets = []) => {
    return [
      fromDate.value,
      toDate.value,
      ...assets.map((asset) => {
        return normalizeAssetId(asset)
      }),
    ]
      .map((value) => String(value ?? ""))
      .join("|")
  }

  const getTelemetryReportsForAsset = (asset) => {
    const assetId = normalizeAssetId(asset)
    const reports = getReportsForAsset(assetId)

    if (!reports.length) return []

    return reports
      .map((report, index) => {
        return normalizeTelemetryReportPoint({
          asset,
          report,
          index,
        })
      })
      .filter((point) => {
        return hasValidPointLocation(point)
      })
      .filter((point) => {
        return isPointInsideDateRange({
          point,
          fromDate: fromDate.value,
          toDate: toDate.value,
        })
      })
  }

  const getRoutePointsForAsset = (asset) => {
    const telemetryReports = getTelemetryReportsForAsset(asset)
    const currentLocationPoints = getCurrentLocationPointForAsset(asset)

    /*
      Itinerarios lee el historial GPS separado solo cuando presionas Buscar o Actualizar.
      Esto evita que la tabla se actualice automáticamente en cada pulso GPS.
    */
    if (telemetryReports.length) {
      return mergeRoutePoints(telemetryReports, currentLocationPoints)
    }

    const fallbackPoints = filterItineraryPoints({
      assetId: normalizeAssetId(asset),
      asset,
      fromDate: fromDate.value,
      toDate: toDate.value,
    })

    return mergeRoutePoints(fallbackPoints, currentLocationPoints)
  }

  const buildMultipleRouteResult = (assets) => {
    const cleanAssets = assets.filter(Boolean)

    if (!cleanAssets.length) return null

    const routes = cleanAssets.map((asset) => {
      const points = getRoutePointsForAsset(asset)

      return buildItineraryResult({
        asset,
        points,
      })
    })

    const rows = routes
      .flatMap((route) => {
        return route.rows.map((row) => ({
          ...row,
          id: `${route.asset.id}-${row.id}`,
          assetId: route.asset.id,
          assetDisplayName: route.asset.displayName,
          assetPatente: route.asset.patente,
          assetDeviceId: route.asset.deviceId,
        }))
      })
      .sort((a, b) => {
        const dateA = new Date(a.timestamp || a.date || a.fecha || 0).getTime()
        const dateB = new Date(b.timestamp || b.date || b.fecha || 0).getTime()

        return dateA - dateB
      })

    const totalDistance = routes.reduce((total, route) => {
      return total + parseNumberFromLabel(route.summary?.distanceLabel)
    }, 0)

    const totalMovingMinutes = routes.reduce((total, route) => {
      return total + parseMinutesFromLabel(route.summary?.movingLabel)
    }, 0)

    const primaryAsset = cleanAssets[0]

    if (cleanAssets.length === 1) {
      return routes[0]
    }

    return {
      id: `multi-${cleanAssets.map((asset) => asset.id).join("-")}`,
      asset: {
        ...primaryAsset,
        id: primaryAsset.id,
        patente: `${cleanAssets.length} dispositivos`,
        deviceId: "Selección múltiple",
        conductor: `${cleanAssets.length} rutas combinadas`,
        estado: "moving",
      },
      assets: cleanAssets,
      routes,
      rows,
      summary: {
        ...(routes[0]?.summary || {}),
        distanceLabel: formatDistance(totalDistance),
        movingLabel: formatMinutes(totalMovingMinutes),
        pointsCount: rows.length,
        assetsCount: cleanAssets.length,
      },
    }
  }

  const emitRouteToMap = () => {
    if (!routeResult.value) return

    emit("route-selected", routeResult.value)
  }

  const rebuildRouteResult = ({ resetSelectedPoint = false } = {}) => {
    const assets = selectedAssets.value.length
      ? selectedAssets.value
      : [primarySelectedAsset.value].filter(Boolean)

    const nextRouteResult = buildMultipleRouteResult(assets)

    if (!nextRouteResult) return

    routeResult.value = {
      ...nextRouteResult,
      queryKey: buildRouteQueryKey(assets),
      updatedAt: new Date().toISOString(),
    }

    if (resetSelectedPoint) {
      selectedPointId.value = null
    }

    showDeviceList.value = false

    emitRouteToMap()
  }

  const handleGenerateRoute = () => {
    applyDateRange()

    if (!selectedAssetIds.value.length && filteredAssets.value.length) {
      selectedAssetIds.value = [filteredAssets.value[0].id]
    }

    if (!validateSearch()) {
      routeResult.value = null
      selectedPointId.value = null
      emit("clear-route")
      return
    }

    rebuildRouteResult({
      resetSelectedPoint: true,
    })
  }

  const handleRefreshRoute = () => {
    applyDateRange()

    if (!validateSearch()) {
      return
    }

    rebuildRouteResult()
  }

  const handleSelectPoint = (point) => {
    selectedPointId.value = point.id

    emit("point-selected", {
      point,
      route: routeResult.value,
    })
  }

  const handleClearRoute = () => {
    routeResult.value = null
    selectedPointId.value = null
    formError.value = ""

    emit("clear-route")
  }

  return {
    routeResult,
    selectedPointId,

    handleGenerateRoute,
    handleRefreshRoute,
    handleSelectPoint,
    handleClearRoute,
  }
}
