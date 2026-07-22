export const DEFAULT_ASSET_TYPE = "car"
export const DEFAULT_ASSET_MAP_ICON = "vehicle-car"

export const assetTypeOptions = [
  {
    value: "car",
    label: "Automovil",
    shortLabel: "Auto",
    mapIcon: "vehicle-car",
    description: "Vehiculo liviano o de supervision.",
  },
  {
    value: "pickup",
    label: "Camioneta",
    shortLabel: "Pickup",
    mapIcon: "vehicle-pickup",
    description: "Camioneta operativa o tecnica.",
  },
  {
    value: "truck",
    label: "Camion",
    shortLabel: "Camion",
    mapIcon: "vehicle-truck",
    description: "Camion de reparto, carga o faena.",
  },
  {
    value: "bus",
    label: "Bus",
    shortLabel: "Bus",
    mapIcon: "vehicle-bus",
    description: "Transporte de pasajeros.",
  },
  {
    value: "van",
    label: "Furgon",
    shortLabel: "Furgon",
    mapIcon: "vehicle-van",
    description: "Furgon o vehiculo cerrado.",
  },
  {
    value: "motorcycle",
    label: "Moto",
    shortLabel: "Moto",
    mapIcon: "vehicle-motorcycle",
    description: "Motocicleta o patrulla liviana.",
  },
  {
    value: "machinery",
    label: "Maquinaria",
    shortLabel: "Maquinaria",
    mapIcon: "vehicle-machinery",
    description: "Equipo pesado o maquinaria movil.",
  },
  {
    value: "trailer",
    label: "Remolque",
    shortLabel: "Remolque",
    mapIcon: "vehicle-trailer",
    description: "Rampla, carro o remolque monitoreado.",
  },
]

const assetTypeByValue = new Map(assetTypeOptions.map((option) => [option.value, option]))
const assetTypeByMapIcon = new Map(assetTypeOptions.map((option) => [option.mapIcon, option]))

export const getAssetTypeOption = (value) => {
  return (
    assetTypeByValue.get(value) ||
    assetTypeByMapIcon.get(value) ||
    assetTypeByValue.get(DEFAULT_ASSET_TYPE)
  )
}

export const getAssetTypeMapIcon = (value) => {
  return getAssetTypeOption(value)?.mapIcon || DEFAULT_ASSET_MAP_ICON
}

export const getAssetTypeLabel = (value) => {
  return getAssetTypeOption(value)?.label || getAssetTypeOption(DEFAULT_ASSET_TYPE).label
}
