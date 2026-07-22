import {
  DEFAULT_ASSET_TYPE,
  assetTypeOptions,
  getAssetTypeLabel,
  getAssetTypeMapIcon,
  getAssetTypeOption,
} from "./assetTypeOptions.js"

export const fleetAssetFormSteps = [
  {
    key: "asset",
    label: "Activo",
    helper: "Nombre",
    eyebrow: "Módulo 01",
    title: "Datos del activo",
  },
  {
    key: "device",
    label: "Dispositivo",
    helper: "GPS / IMEI",
    eyebrow: "Módulo 02",
    title: "Dispositivo GPS",
  },
  {
    key: "admin",
    label: "Fechas",
    helper: "Ciclo",
    eyebrow: "Módulo 03",
    title: "Fechas administrativas",
  },
  {
    key: "metrics",
    label: "Métricas",
    helper: "Iniciales",
    eyebrow: "Módulo 04",
    title: "Métricas del activo",
  },
]

export const fleetCreateFormSteps = fleetAssetFormSteps.map((step) => {
  if (step.key !== "metrics") return step

  return {
    ...step,
    title: "Métricas iniciales",
  }
})

export const fleetTrackerModelOptions = [
  {
    value: "teltonika-fmb920",
    manufacturer: "Teltonika",
    label: "FMB920",
    description: "Equipo compacto para vehículos livianos.",
  },
  {
    value: "teltonika-fmc130",
    manufacturer: "Teltonika",
    label: "FMC130",
    description: "GPS LTE con entradas/salidas vehiculares.",
  },
  {
    value: "concox-gt06n",
    manufacturer: "Concox",
    label: "GT06N",
    description: "Rastreador estándar para monitoreo vehicular.",
  },
  {
    value: "queclink-gv300",
    manufacturer: "Queclink",
    label: "GV300",
    description: "Equipo profesional para flota y telemetría básica.",
  },
  {
    value: "ruptela-eco5",
    manufacturer: "Ruptela",
    label: "Eco5",
    description: "Dispositivo GPS para gestión de flota.",
  },
]

export const fleetAssetTypeOptions = assetTypeOptions

export const createEmptyFleetEditForm = () => ({
  assetType: DEFAULT_ASSET_TYPE,
  assetTypeLabel: getAssetTypeLabel(DEFAULT_ASSET_TYPE),
  mapIcon: getAssetTypeMapIcon(DEFAULT_ASSET_TYPE),
  sucursalId: "",
  trackerModel: "",
  trackerModelLabel: "",
  trackerManufacturer: "",
  imei: "",
  protocol: "tcp",
  name: "",
  displayName: "",
  description: "",
  entryDate: "",
  deactivationDate: "",
  suspensionDate: "",
  dailyHourmeter: "",
  totalHourmeter: "",
  odometer: "",
})

export const createEmptyFleetCreateForm = () => ({
  assetType: DEFAULT_ASSET_TYPE,
  assetTypeLabel: getAssetTypeLabel(DEFAULT_ASSET_TYPE),
  mapIcon: getAssetTypeMapIcon(DEFAULT_ASSET_TYPE),
  sucursalId: "",
  trackerModel: "",
  imei: "",
  protocol: "tcp",
  name: "",
  displayName: "",
  description: "",
  entryDate: new Date().toISOString().slice(0, 10),
  deactivationDate: "",
  suspensionDate: "",
  dailyHourmeter: "",
  totalHourmeter: "",
  odometer: "",
})

export const normalizeFleetAssetDate = (value) => {
  if (!value || value === "-") return ""

  const text = String(value)

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10)
  }

  return ""
}

export const extractFleetAssetNumber = (value) => {
  if (!value || value === "-") return ""

  const match = String(value)
    .replace(/\./g, "")
    .replace(",", ".")
    .match(/-?\d+(\.\d+)?/)

  return match ? match[0] : ""
}

export const toFleetNumberOrEmpty = (value) => {
  if (value === "" || value === null || value === undefined) return ""

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : ""
}

export const findFleetTrackerModel = (activo, trackerModelOptions = fleetTrackerModelOptions) => {
  if (!activo) return ""

  if (activo.trackerModel) {
    const exists = trackerModelOptions.some((option) => option.value === activo.trackerModel)

    if (exists) return activo.trackerModel
  }

  const label = String(activo.trackerModelLabel || "").toLowerCase()

  const option = trackerModelOptions.find((item) => {
    return (
      item.label.toLowerCase() === label ||
      `${item.manufacturer} ${item.label}`.toLowerCase() === label
    )
  })

  return option?.value || ""
}

export const createFleetEditFormFromActivo = (
  activo = {},
  trackerModelOptions = fleetTrackerModelOptions,
) => {
  const assetTypeOption = getAssetTypeOption(
    activo.assetType || activo.tipoActivo || activo.mapIcon || activo.markerIcon || activo.iconType,
  )

  return {
    assetType: assetTypeOption.value,
    assetTypeLabel: activo.assetTypeLabel || activo.tipoActivoLabel || assetTypeOption.label,
    mapIcon: activo.mapIcon || activo.markerIcon || activo.iconType || assetTypeOption.mapIcon,
    sucursalId: activo.sucursalId || "",

    trackerModel: findFleetTrackerModel(activo, trackerModelOptions),
    trackerModelLabel:
      activo.trackerModelLabel && activo.trackerModelLabel !== "-"
        ? String(activo.trackerModelLabel)
        : "",
    trackerManufacturer:
      activo.trackerManufacturer && activo.trackerManufacturer !== "-"
        ? String(activo.trackerManufacturer)
        : "",

    imei: activo.imei && activo.imei !== "-" ? String(activo.imei) : "",
    protocol:
      activo.protocol && activo.protocol !== "-" ? String(activo.protocol).toLowerCase() : "tcp",

    name:
      activo.name && activo.name !== "-"
        ? String(activo.name)
        : String(activo.vehiculo || activo.nombrePantalla || ""),

    displayName:
      activo.nombrePantalla && activo.nombrePantalla !== "-"
        ? String(activo.nombrePantalla)
        : String(activo.vehiculo || activo.displayName || activo.name || ""),

    description:
      activo.descripcion && activo.descripcion !== "-"
        ? String(activo.descripcion)
        : String(activo.description || ""),

    entryDate: normalizeFleetAssetDate(activo.fechaIngreso || activo.entryDate),
    deactivationDate: normalizeFleetAssetDate(activo.fechaBaja || activo.deactivationDate),
    suspensionDate: normalizeFleetAssetDate(activo.fechaSuspension || activo.suspensionDate),

    dailyHourmeter: extractFleetAssetNumber(activo.horometroDiario ?? activo.dailyHourmeter),
    totalHourmeter: extractFleetAssetNumber(activo.horometroTotal ?? activo.totalHourmeter),
    odometer: extractFleetAssetNumber(activo.odometro ?? activo.odometer),
  }
}

export const buildFleetEditPayload = ({
  form,
  activo,
  selectedTrackerModel,
  selectedTrackerModelLabel,
}) => {
  const displayName = form.displayName.trim()
  const name = form.name.trim() || displayName
  const description = form.description.trim()
  const assetTypeOption = getAssetTypeOption(form.assetType || form.mapIcon)

  return {
    assetType: assetTypeOption.value,
    assetTypeLabel: assetTypeOption.label,
    tipoActivo: assetTypeOption.value,
    tipoActivoLabel: assetTypeOption.label,
    mapIcon: assetTypeOption.mapIcon,
    markerIcon: assetTypeOption.mapIcon,
    iconType: assetTypeOption.mapIcon,
    sucursalId: form.sucursalId || null,

    vehiculo: displayName || "Activo sin nombre",
    name: name || "Activo sin nombre",
    nombrePantalla: displayName || name || "Activo sin nombre",
    displayName: displayName || name || "Activo sin nombre",

    trackerModel: form.trackerModel || activo?.trackerModel || "-",
    trackerModelLabel:
      selectedTrackerModelLabel || form.trackerModelLabel || activo?.trackerModelLabel || "-",
    trackerManufacturer:
      selectedTrackerModel?.manufacturer ||
      form.trackerManufacturer ||
      activo?.trackerManufacturer ||
      "-",

    imei: form.imei.trim() || "-",
    protocol: form.protocol || "tcp",

    descripcion: description || "-",
    description,

    fechaIngreso: form.entryDate || "-",
    entryDate: form.entryDate,

    fechaBaja: form.deactivationDate || "-",
    deactivationDate: form.deactivationDate,

    fechaSuspension: form.suspensionDate || "-",
    suspensionDate: form.suspensionDate,

    horometroDiario: toFleetNumberOrEmpty(form.dailyHourmeter),
    dailyHourmeter: toFleetNumberOrEmpty(form.dailyHourmeter),

    horometroTotal: toFleetNumberOrEmpty(form.totalHourmeter),
    totalHourmeter: toFleetNumberOrEmpty(form.totalHourmeter),

    odometro: toFleetNumberOrEmpty(form.odometer),
    odometer: toFleetNumberOrEmpty(form.odometer),

    connectionStatus: "updated",
  }
}

export const buildFleetCreatePayload = ({
  form,
  selectedTrackerModel,
  selectedTrackerModelLabel,
}) => {
  const assetTypeOption = getAssetTypeOption(form.assetType || form.mapIcon)

  return {
    assetType: assetTypeOption.value,
    assetTypeLabel: assetTypeOption.label,
    tipoActivo: assetTypeOption.value,
    tipoActivoLabel: assetTypeOption.label,
    mapIcon: assetTypeOption.mapIcon,
    markerIcon: assetTypeOption.mapIcon,
    iconType: assetTypeOption.mapIcon,
    sucursalId: form.sucursalId || null,
    trackerModel: form.trackerModel,
    trackerModelLabel: selectedTrackerModelLabel,
    trackerManufacturer: selectedTrackerModel?.manufacturer || "",
    imei: form.imei.trim(),
    protocol: form.protocol || "tcp",
    name: form.name.trim(),
    displayName: form.displayName.trim(),
    description: form.description.trim(),
    entryDate: form.entryDate,
    deactivationDate: form.deactivationDate,
    suspensionDate: form.suspensionDate,
    dailyHourmeter: toFleetNumberOrEmpty(form.dailyHourmeter),
    totalHourmeter: toFleetNumberOrEmpty(form.totalHourmeter),
    odometer: toFleetNumberOrEmpty(form.odometer),
    connectionStatus: "pending",
  }
}
