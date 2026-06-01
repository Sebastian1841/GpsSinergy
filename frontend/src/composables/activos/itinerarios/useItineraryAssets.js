import { computed, ref, watch } from "vue"

const getFirstDefined = (...values) => {
  return values.find((value) => {
    return value !== undefined && value !== null && value !== ""
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

  const normalizedAssets = computed(() => {
    const fromProps = (props.activos || []).map((activo) => ({
      id: activo.id,
      patente: activo.vehiculo || activo.patente || activo.name || `Activo ${activo.id}`,
      deviceId: activo.imei || activo.deviceId || activo.identificador || "Sin dispositivo",
      conductor: activo.conductor || activo.ibutton_name || activo.ibuttonName || "Sin conductor",
      estado: activo.estado || "offline",

      lat: getFirstDefined(activo.lat, activo.latitude, activo.latitud),
      lng: getFirstDefined(activo.lng, activo.lon, activo.longitude, activo.longitud),
      speed: getFirstDefined(activo.speed, activo.velocidad, activo.velocidad_kmh, 0),
      direccion: getFirstDefined(activo.direccion, activo.address, activo.direccion_actual),
      lastReport: getFirstDefined(
        activo.last_report,
        activo.lastReport,
        activo.timestamp,
        activo.updated_at,
        activo.datosUlt,
      ),
      odometer: getFirstDefined(activo.odometer, activo.odometro, activo.kilometraje),
    }))

    return mockItineraryAssets.map((itineraryAsset) => {
      const matchingCurrentAsset = fromProps.find((activo) => {
        const samePatente = normalizeText(activo.patente) === normalizeText(itineraryAsset.patente)
        const sameDevice = normalizeText(activo.deviceId) === normalizeText(itineraryAsset.deviceId)

        return samePatente || sameDevice
      })

      if (!matchingCurrentAsset) {
        return itineraryAsset
      }

      return {
        ...itineraryAsset,

        id: itineraryAsset.id,
        activoId: matchingCurrentAsset.id,

        patente: itineraryAsset.patente,
        deviceId: itineraryAsset.deviceId,
        conductor: itineraryAsset.conductor,

        estado: matchingCurrentAsset.estado || itineraryAsset.estado,
        lat: matchingCurrentAsset.lat,
        lng: matchingCurrentAsset.lng,
        speed: matchingCurrentAsset.speed,
        direccion: matchingCurrentAsset.direccion || itineraryAsset.direccion,
        lastReport: matchingCurrentAsset.lastReport || itineraryAsset.last_report,
        odometer: matchingCurrentAsset.odometer,
      }
    })
  })

  const filteredAssets = computed(() => {
    const term = normalizeText(searchTerm.value)

    if (!term) return normalizedAssets.value

    return normalizedAssets.value.filter((asset) => {
      return (
        normalizeText(asset.patente).includes(term) ||
        normalizeText(asset.deviceId).includes(term) ||
        normalizeText(asset.conductor).includes(term)
      )
    })
  })

  const selectedAssets = computed(() => {
    const selected = new Set(selectedAssetIds.value)

    return normalizedAssets.value.filter((asset) => selected.has(asset.id))
  })

  const selectedAssetsSummary = computed(() => {
    if (!selectedAssets.value.length) {
      return "Seleccionar dispositivos"
    }

    if (selectedAssets.value.length === 1) {
      const asset = selectedAssets.value[0]

      return `${asset.patente} · ${asset.deviceId}`
    }

    const labels = selectedAssets.value
      .slice(0, 2)
      .map((asset) => asset.patente)
      .join(", ")

    const remaining = selectedAssets.value.length - 2

    return remaining > 0 ? `${labels} +${remaining} más` : labels
  })

  const primarySelectedAsset = computed(() => {
    return selectedAssets.value[0] || filteredAssets.value[0] || null
  })

  const isAssetSelected = (assetId) => {
    return selectedAssetIds.value.includes(assetId)
  }

  const toggleAsset = (asset) => {
    formError.value = ""

    if (isAssetSelected(asset.id)) {
      selectedAssetIds.value = selectedAssetIds.value.filter((id) => id !== asset.id)
      return
    }

    selectedAssetIds.value = [...selectedAssetIds.value, asset.id]
  }

  const selectAllVisibleAssets = () => {
    const ids = filteredAssets.value.map((asset) => asset.id)

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
        selectedAssetIds.value = []
        return
      }

      const availableIds = new Set(normalizedAssets.value.map((asset) => asset.id))

      selectedAssetIds.value = selectedAssetIds.value.filter((id) => availableIds.has(id))

      if (!selectedAssetIds.value.length) {
        selectedAssetIds.value = [assets[0].id]
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
