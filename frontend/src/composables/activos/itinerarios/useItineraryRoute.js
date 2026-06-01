import { ref } from "vue"

const parseNumberFromLabel = (label) => {
  if (!label) return 0

  const value = String(label)
    .replace(",", ".")
    .match(/[\d.]+/)

  return value ? Number(value[0]) || 0 : 0
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

const areSameCoordinates = (pointA, pointB) => {
  if (!pointA || !pointB) return false

  const latA = Number(pointA.lat)
  const lngA = Number(pointA.lng)
  const latB = Number(pointB.lat)
  const lngB = Number(pointB.lng)

  if (![latA, lngA, latB, lngB].every(Number.isFinite)) return false

  return Math.abs(latA - latB) < 0.000001 && Math.abs(lngA - lngB) < 0.000001
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
    return latestDate
  }

  const isCurrentDateInsideRange = () => {
    const currentDate = getCurrentReferenceDate()

    return fromDate.value <= currentDate && currentDate <= toDate.value
  }

  const shouldAppendCurrentLocation = (asset) => {
    return isCurrentDateInsideRange() && hasValidAssetLocation(asset)
  }

  const getCurrentLocationTimestamp = (asset) => {
    const currentDate = getCurrentReferenceDate()
    const fallbackTimestamp = `${currentDate}T23:59:59`

    if (!asset?.lastReport) return fallbackTimestamp

    const lastReportDate = new Date(asset.lastReport)

    if (Number.isNaN(lastReportDate.getTime())) {
      return fallbackTimestamp
    }

    const assetReportDay = String(asset.lastReport).slice(0, 10)

    if (assetReportDay < currentDate) {
      return fallbackTimestamp
    }

    return asset.lastReport
  }

  const buildCurrentLocationPoint = (asset) => {
    return {
      id: `${asset.id}-current-location`,
      assetId: asset.id,
      timestamp: getCurrentLocationTimestamp(asset),
      lat: Number(asset.lat),
      lng: Number(asset.lng),
      speed: Number(asset.speed) || 0,
      address: asset.direccion || "Ubicación actual",
      event: "Ubicación actual",
      odometer: asset.odometer || null,
      isCurrentLocation: true,
    }
  }

  const appendCurrentLocationIfNeeded = ({ asset, points }) => {
    if (!shouldAppendCurrentLocation(asset)) return points

    const currentPoint = buildCurrentLocationPoint(asset)
    const lastPoint = points[points.length - 1]

    if (areSameCoordinates(lastPoint, currentPoint)) {
      return [
        ...points.slice(0, -1),
        {
          ...lastPoint,
          ...currentPoint,
        },
      ]
    }

    return [...points, currentPoint]
  }

  const getRoutePointsForAsset = (asset) => {
    const historicalPoints = filterItineraryPoints({
      assetId: asset.id,
      fromDate: fromDate.value,
      toDate: toDate.value,
    })

    return appendCurrentLocationIfNeeded({
      asset,
      points: historicalPoints,
    })
  }

  const buildMultipleRouteResult = (assets) => {
    const routes = assets.map((asset) => {
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

    const primaryAsset = assets[0]

    if (assets.length === 1) {
      return routes[0]
    }

    return {
      id: `multi-${assets.map((asset) => asset.id).join("-")}`,
      asset: {
        ...primaryAsset,
        id: primaryAsset.id,
        patente: `${assets.length} dispositivos`,
        deviceId: "Selección múltiple",
        conductor: `${assets.length} rutas combinadas`,
        estado: "moving",
      },
      assets,
      routes,
      rows,
      summary: {
        ...(routes[0]?.summary || {}),
        distanceLabel: formatDistance(totalDistance),
        movingLabel: formatMinutes(totalMovingMinutes),
        pointsCount: rows.length,
        assetsCount: assets.length,
      },
    }
  }

  const emitRouteToMap = () => {
    if (!routeResult.value) return

    emit("route-selected", routeResult.value)
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

    const assets = selectedAssets.value.length
      ? selectedAssets.value
      : [primarySelectedAsset.value].filter(Boolean)

    routeResult.value = buildMultipleRouteResult(assets)
    selectedPointId.value = null
    showDeviceList.value = false

    emitRouteToMap()
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
    handleSelectPoint,
    handleClearRoute,
  }
}
