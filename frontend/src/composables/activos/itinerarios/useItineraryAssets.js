import { computed, ref, watch } from "vue"
import { useDebouncedValue } from "../../ui/useDebouncedValue.js"
import { parseNumberFromLabel } from "../../../utils/numberUtils.js"
import { normalizeTelemetryReports } from "../../../utils/telemetryUtils.js"

const getFirstDefined = (...values) => {
  return values.find((value) => {
    return value !== undefined && value !== null && value !== ""
  })
}

const getDisplayName = (activo) => {
  return (
    activo.vehiculo ||
    activo.nombrePantalla ||
    activo.displayName ||
    activo.name ||
    activo.patente ||
    activo.patent ||
    `Activo ${activo.id}`
  )
}

const normalizeAssetId = (asset) => {
  return String(
    getFirstDefined(
      asset?.id,
      asset?.activoId,
      asset?.deviceId,
      asset?.imei,
      asset?.patente,
      asset?.patent,
      "",
    ),
  )
}

const normalizeTimestamp = (activo) => {
  return getFirstDefined(
    activo.timestamp,
    activo.lastReport,
    activo.last_report,
    activo.reportedAt,
    activo.lastReportAt,
    activo.fechaHora,
    activo.fechaUltimoReporte,
    activo.updatedAt,
    activo.updated_at,
    activo.datosUlt,
  )
}

const areStringArraysEqual = (firstArray = [], secondArray = []) => {
  if (firstArray.length !== secondArray.length) return false

  return firstArray.every((value, index) => {
    return String(value) === String(secondArray[index])
  })
}

export function useItineraryAssets({
  props,
  searchTerm,
  formError,
  normalizeText,
  mockItineraryAssets,
}) {
  const selectedAssetIds = ref([])
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 120)

  const normalizedAssets = computed(() => {
    const sourceAssets = props.activos?.length ? props.activos : mockItineraryAssets

    const fromProps = sourceAssets.map((activo) => {
      const id = normalizeAssetId(activo)
      const timestamp = normalizeTimestamp(activo)
      const speedValue = parseNumberFromLabel(
        getFirstDefined(activo.speed, activo.velocidad_kmh, activo.velocidad, 0),
      )

      return {
        id,
        activoId: getFirstDefined(activo.activoId, activo.id, id),

        displayName: getDisplayName(activo),
        patente:
          activo.patente || activo.patent || activo.vehiculo || activo.name || `Activo ${id}`,

        deviceId: activo.imei || activo.deviceId || activo.identificador || "Sin dispositivo",
        conductor: activo.conductor || activo.ibutton_name || activo.ibuttonName || "Sin conductor",
        estado: activo.estado || "offline",

        lat: getFirstDefined(activo.lat, activo.latitude, activo.latitud),
        lng: getFirstDefined(activo.lng, activo.lon, activo.longitude, activo.longitud),

        speed: speedValue,
        velocidad: getFirstDefined(activo.velocidad, `${speedValue} km/h`),
        velocidad_kmh: speedValue,

        direccion: getFirstDefined(activo.direccion, activo.address, activo.direccion_actual),
        address: getFirstDefined(activo.address, activo.direccion, activo.direccion_actual),

        timestamp,
        lastReport: timestamp,
        last_report: activo.last_report,
        reportedAt: activo.reportedAt || timestamp,
        lastReportAt: activo.lastReportAt || timestamp,
        fechaHora: activo.fechaHora,
        fechaUltimoReporte: activo.fechaUltimoReporte,
        updated_at: activo.updated_at,
        updatedAt: activo.updatedAt || timestamp,
        datosUlt: activo.datosUlt,

        odometer: getFirstDefined(activo.odometer, activo.odometro, activo.kilometraje),
        odometro: getFirstDefined(activo.odometro, activo.odometer, activo.kilometraje),

        telemetryReports: normalizeTelemetryReports(activo.telemetryReports),
      }
    })

    return fromProps.map((currentAsset) => {
      const itineraryAsset = mockItineraryAssets.find((asset) => {
        const sameId = String(asset.id) === String(currentAsset.id)
        const sameActivoId = String(asset.id) === String(currentAsset.activoId)
        const samePatente = normalizeText(asset.patente) === normalizeText(currentAsset.patente)
        const sameDevice = normalizeText(asset.deviceId) === normalizeText(currentAsset.deviceId)

        return sameId || sameActivoId || samePatente || sameDevice
      })

      const timestamp = getFirstDefined(
        currentAsset.timestamp,
        currentAsset.lastReport,
        currentAsset.reportedAt,
        currentAsset.lastReportAt,
        currentAsset.updatedAt,
        currentAsset.datosUlt,
        itineraryAsset?.timestamp,
        itineraryAsset?.lastReport,
        itineraryAsset?.last_report,
      )

      const speedValue = parseNumberFromLabel(
        getFirstDefined(
          currentAsset.speed,
          currentAsset.velocidad_kmh,
          currentAsset.velocidad,
          itineraryAsset?.speed,
          itineraryAsset?.velocidad_kmh,
          itineraryAsset?.velocidad,
          0,
        ),
      )

      return {
        ...itineraryAsset,

        id: currentAsset.id,
        activoId: currentAsset.activoId,

        displayName: currentAsset.displayName || itineraryAsset?.displayName,
        patente: currentAsset.patente || itineraryAsset?.patente,
        deviceId: currentAsset.deviceId || itineraryAsset?.deviceId,
        conductor: currentAsset.conductor || itineraryAsset?.conductor,
        estado: currentAsset.estado || itineraryAsset?.estado || "offline",

        lat: currentAsset.lat ?? itineraryAsset?.lat,
        lng: currentAsset.lng ?? itineraryAsset?.lng,

        speed: speedValue,
        velocidad: currentAsset.velocidad || `${speedValue} km/h`,
        velocidad_kmh: speedValue,

        direccion: currentAsset.direccion || itineraryAsset?.direccion,
        address: currentAsset.address || currentAsset.direccion || itineraryAsset?.direccion,

        timestamp,
        lastReport: timestamp,
        last_report: currentAsset.last_report || itineraryAsset?.last_report,

        reportedAt: currentAsset.reportedAt || timestamp,
        lastReportAt: currentAsset.lastReportAt || timestamp,
        fechaHora: currentAsset.fechaHora || itineraryAsset?.fechaHora,
        fechaUltimoReporte: currentAsset.fechaUltimoReporte || itineraryAsset?.fechaUltimoReporte,
        updated_at: currentAsset.updated_at || itineraryAsset?.updated_at,
        updatedAt: currentAsset.updatedAt || timestamp,
        datosUlt: currentAsset.datosUlt || itineraryAsset?.datosUlt,

        odometer: currentAsset.odometer ?? itineraryAsset?.odometer,
        odometro: currentAsset.odometro ?? itineraryAsset?.odometro ?? itineraryAsset?.odometer,

        telemetryReports: normalizeTelemetryReports(currentAsset.telemetryReports),
      }
    })
  })

  const filteredAssets = computed(() => {
    const term = normalizeText(debouncedSearchTerm.value)

    if (!term) return normalizedAssets.value

    return normalizedAssets.value.filter((asset) => {
      return (
        normalizeText(asset.displayName).includes(term) ||
        normalizeText(asset.patente).includes(term) ||
        normalizeText(asset.deviceId).includes(term) ||
        normalizeText(asset.conductor).includes(term)
      )
    })
  })

  const selectedAssets = computed(() => {
    const selected = new Set(
      selectedAssetIds.value.map((assetId) => {
        return String(assetId)
      }),
    )

    return normalizedAssets.value.filter((asset) => {
      return selected.has(String(asset.id))
    })
  })

  const selectedAssetsSummary = computed(() => {
    if (!selectedAssets.value.length) {
      return "Seleccionar dispositivos"
    }

    if (selectedAssets.value.length === 1) {
      const asset = selectedAssets.value[0]
      const label = asset.displayName || asset.patente

      return `${label} - ${asset.deviceId}`
    }

    const labels = selectedAssets.value
      .slice(0, 2)
      .map((asset) => asset.displayName || asset.patente)
      .join(", ")

    const remaining = selectedAssets.value.length - 2

    return remaining > 0 ? `${labels} +${remaining} mas` : labels
  })

  const primarySelectedAsset = computed(() => {
    return selectedAssets.value[0] || filteredAssets.value[0] || null
  })

  const isAssetSelected = (assetId) => {
    return selectedAssetIds.value.includes(String(assetId))
  }

  const toggleAsset = (asset) => {
    formError.value = ""

    const assetId = String(asset.id)

    if (isAssetSelected(assetId)) {
      selectedAssetIds.value = selectedAssetIds.value.filter((id) => {
        return String(id) !== assetId
      })
      return
    }

    selectedAssetIds.value = [...selectedAssetIds.value, assetId]
  }

  const selectAllVisibleAssets = () => {
    const ids = filteredAssets.value.map((asset) => {
      return String(asset.id)
    })

    selectedAssetIds.value = [...new Set([...selectedAssetIds.value, ...ids])]
    formError.value = ""
  }

  const clearSelectedAssets = () => {
    selectedAssetIds.value = []
    formError.value = ""
  }

  watch(
    filteredAssets,
    (assets) => {
      if (!assets.length) {
        if (selectedAssetIds.value.length) {
          selectedAssetIds.value = []
        }

        return
      }

      const availableIds = new Set(
        normalizedAssets.value.map((asset) => {
          return String(asset.id)
        }),
      )

      const nextSelectedAssetIds = selectedAssetIds.value.filter((id) => {
        return availableIds.has(String(id))
      })

      if (!nextSelectedAssetIds.length) {
        nextSelectedAssetIds.push(String(assets[0].id))
      }

      if (!areStringArraysEqual(selectedAssetIds.value, nextSelectedAssetIds)) {
        selectedAssetIds.value = nextSelectedAssetIds
      }
    },
    {
      immediate: true,
    },
  )

  return {
    selectedAssetIds,
    normalizedAssets,
    filteredAssets,
    selectedAssets,
    selectedAssetsSummary,
    primarySelectedAsset,

    toggleAsset,
    isAssetSelected,
    selectAllVisibleAssets,
    clearSelectedAssets,
  }
}
