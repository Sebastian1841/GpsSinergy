export const FLEET_TELEMETRY_COLUMNS = [
  { key: "estado", label: "Estado", width: "92px", locked: true },
  { key: "vehiculo", label: "Activo", width: "160px", locked: true },
  { key: "ignition", label: "Encendido", width: "104px" },
  { key: "velocidad", label: "Vel.", width: "82px", align: "right" },
  { key: "combustible", label: "Comb.", width: "86px", align: "right" },
  { key: "gpsSatellites", label: "Satelites", width: "90px", align: "right" },
  { key: "lat", label: "Lat.", width: "96px", align: "right" },
  { key: "lng", label: "Long.", width: "96px", align: "right" },
  { key: "lastPosition", label: "Direccion", width: "240px" },
  { key: "datosUlt", label: "Ult. reporte", width: "110px" },
  { key: "canRpm", label: "RPM", width: "90px", align: "right" },
  {
    key: "canEngineTemp",
    label: "Temp. motor",
    width: "105px",
    align: "right",
  },
  {
    key: "canBatteryVoltage",
    label: "Voltaje",
    width: "90px",
    align: "right",
  },
  {
    key: "canEngineLoad",
    label: "Carga motor",
    width: "105px",
    align: "right",
  },
  { key: "canSummary", label: "Resumen CAN", width: "175px", defaultVisible: false },
  {
    key: "gpsSignal",
    label: "Senal GPS",
    width: "95px",
    align: "right",
    defaultVisible: false,
  },
  { key: "coordinates", label: "Coord.", width: "145px", defaultVisible: false },
  {
    key: "horometroTotal",
    label: "Horometro",
    width: "105px",
    align: "right",
    defaultVisible: false,
  },
  {
    key: "odometro",
    label: "Odometro",
    width: "112px",
    align: "right",
    defaultVisible: false,
  },
  {
    key: "horometroDiario",
    label: "Hor. diario",
    width: "100px",
    align: "right",
    defaultVisible: false,
  },
  { key: "gpsFix", label: "Fix GPS", width: "90px", defaultVisible: false },
  {
    key: "canThrottle",
    label: "Acelerador",
    width: "105px",
    align: "right",
    defaultVisible: false,
  },
  {
    key: "canFuelRate",
    label: "Cons. L/h",
    width: "95px",
    align: "right",
    defaultVisible: false,
  },
  {
    key: "canFuelUsed",
    label: "Comb. usado",
    width: "112px",
    align: "right",
    defaultVisible: false,
  },
  {
    key: "canOilPressure",
    label: "Pres. aceite",
    width: "108px",
    align: "right",
    defaultVisible: false,
  },
  {
    key: "canAdBlueLevel",
    label: "AdBlue",
    width: "88px",
    align: "right",
    defaultVisible: false,
  },
  {
    key: "canDtcCount",
    label: "DTC",
    width: "76px",
    align: "right",
    defaultVisible: false,
  },
  {
    key: "digitalInput1",
    label: "Entrada 1",
    width: "96px",
    defaultVisible: false,
  },
  {
    key: "digitalInput2",
    label: "Entrada 2",
    width: "96px",
    defaultVisible: false,
  },
  {
    key: "trackerModelLabel",
    label: "Modelo GPS",
    width: "135px",
    defaultVisible: false,
  },
  { key: "imei", label: "IMEI", width: "140px", defaultVisible: false },
  { key: "protocol", label: "Protocolo", width: "90px", defaultVisible: false },
  { key: "fechaIngreso", label: "Ingreso", width: "105px", defaultVisible: false },
]

export const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

const getNestedValue = (row, path) => {
  return path.split(".").reduce((value, key) => value?.[key], row)
}

const getFirstDefined = (...values) => {
  return values.find((value) => value !== null && value !== undefined && value !== "")
}

const parseTelemetryNumber = (value, fallback = null) => {
  if (Number.isFinite(Number(value))) return Number(value)

  const match = String(value ?? "").match(/-?\d[\d.,]*/)

  if (!match) return fallback

  const rawNumber = match[0]
  const hasComma = rawNumber.includes(",")
  const hasDot = rawNumber.includes(".")
  const normalizedNumber =
    hasComma && hasDot
      ? rawNumber.replace(/\./g, "").replace(",", ".")
      : hasComma
        ? rawNumber.replace(",", ".")
        : hasDot && (rawNumber.split(".").length > 2 || rawNumber.split(".").at(-1)?.length === 3)
          ? rawNumber.replace(/\./g, "")
          : rawNumber
  const parsedValue = Number(normalizedNumber)

  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

const formatTelemetryPercent = (value) => {
  const numberValue = parseTelemetryNumber(value)

  if (numberValue === null) return "-"

  return `${Math.round(numberValue)}%`
}

const formatTelemetryKilometers = (value) => {
  const numberValue = parseTelemetryNumber(value)

  if (numberValue === null) return "-"

  return `${Number(numberValue.toFixed(1)).toLocaleString("es-CL")} km`
}

const formatTelemetryHours = (value) => {
  const numberValue = parseTelemetryNumber(value)

  if (numberValue === null) return "-"

  return `${Number(numberValue.toFixed(1)).toLocaleString("es-CL")} h`
}

const formatTelemetryLiters = (value) => {
  const numberValue = parseTelemetryNumber(value)

  if (numberValue === null) return "-"

  return `${Number(numberValue.toFixed(1)).toLocaleString("es-CL")} L`
}

const formatTelemetryLitersPerHour = (value) => {
  const numberValue = parseTelemetryNumber(value)

  if (numberValue === null) return "-"

  return `${Number(numberValue.toFixed(1)).toLocaleString("es-CL")} L/h`
}

const formatTelemetryPsi = (value) => {
  const numberValue = parseTelemetryNumber(value)

  if (numberValue === null) return "-"

  return `${Math.round(numberValue)} psi`
}

const ACTIVE_STATE_VALUES = new Set([
  "1",
  "true",
  "on",
  "si",
  "yes",
  "active",
  "activo",
  "activa",
  "encendido",
  "encendida",
])

const INACTIVE_STATE_VALUES = new Set([
  "0",
  "false",
  "off",
  "no",
  "inactive",
  "inactivo",
  "inactiva",
  "apagado",
  "apagada",
])

const normalizeTelemetryStateText = (value) => {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const formatTelemetryState = (
  value,
  { activeLabel = "Activa", inactiveLabel = "Inactiva" } = {},
) => {
  const resolvedValue = getFirstDefined(value)

  if (resolvedValue === undefined) return "-"
  if (typeof resolvedValue === "boolean") return resolvedValue ? activeLabel : inactiveLabel

  const numberValue = Number(resolvedValue)

  if (Number.isFinite(numberValue)) return numberValue > 0 ? activeLabel : inactiveLabel

  const normalizedValue = normalizeTelemetryStateText(resolvedValue)

  if (ACTIVE_STATE_VALUES.has(normalizedValue)) return activeLabel
  if (INACTIVE_STATE_VALUES.has(normalizedValue)) return inactiveLabel

  return String(resolvedValue)
}

const formatCoordinates = (activo) => {
  const lat = parseTelemetryNumber(getFirstDefined(activo.lat, activo.latitude, activo.latitud))
  const lng = parseTelemetryNumber(
    getFirstDefined(activo.lng, activo.lon, activo.longitude, activo.longitud),
  )

  if (lat === null || lng === null) return "-"

  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

const formatCoordinateValue = (value) => {
  const coordinate = parseTelemetryNumber(value)

  if (coordinate === null) return "-"

  return coordinate.toFixed(6)
}

const formatLastPosition = (activo) => {
  return (
    getFirstDefined(
      activo.resolvedAddress,
      activo.address,
      activo.direccion,
      activo.lastPosition,
      activo.ultimaPosicion,
      activo.location,
    ) || "-"
  )
}

const formatCanSummary = (activo) => {
  if (activo.canSummary) return String(activo.canSummary)

  const rpm = parseTelemetryNumber(activo.canRpm)
  const temp = parseTelemetryNumber(activo.canEngineTemp)
  const load = parseTelemetryNumber(activo.canEngineLoad)

  if (rpm === null && temp === null && load === null) return activo.canStatus || "-"

  return `RPM ${rpm === null ? "-" : Math.round(rpm).toLocaleString("es-CL")} / ${
    temp === null ? "-" : `${Math.round(temp)} C`
  } / ${load === null ? "-" : `${Math.round(load)}%`}`
}

export const getCellValue = (activo, column) => {
  if (typeof column.formatter === "function") {
    return column.formatter(activo)
  }

  if (column.key === "ignition") {
    return formatTelemetryState(
      getFirstDefined(activo.ignition, activo.ignicion, activo.contacto, activo.ignitionStatus),
      {
        activeLabel: "true",
        inactiveLabel: "false",
      },
    )
  }

  if (column.key === "digitalInput1") {
    return formatTelemetryState(getFirstDefined(activo.digitalInput1, activo.input1, activo.di1))
  }

  if (column.key === "digitalInput2") {
    return formatTelemetryState(getFirstDefined(activo.digitalInput2, activo.input2, activo.di2))
  }

  if (column.key === "lat") {
    return formatCoordinateValue(getFirstDefined(activo.lat, activo.latitude, activo.latitud))
  }

  if (column.key === "lng") {
    return formatCoordinateValue(
      getFirstDefined(activo.lng, activo.lon, activo.longitude, activo.longitud),
    )
  }

  if (column.key === "lastPosition") return formatLastPosition(activo)

  if (column.key === "coordinates") return formatCoordinates(activo)

  if (column.key === "velocidad") {
    const value = getFirstDefined(activo.velocidad, activo.velocidad_kmh, activo.speed)
    const numberValue = parseTelemetryNumber(value)

    if (numberValue === null) return value || "-"

    return `${Number(numberValue.toFixed(1)).toLocaleString("es-CL")} km/h`
  }

  if (column.key === "gpsSignal") {
    return formatTelemetryPercent(getFirstDefined(activo.gpsSignal, activo.gpsSignalLabel))
  }

  if (column.key === "gpsSatellites") {
    const value = parseTelemetryNumber(
      getFirstDefined(activo.gpsSatellites, activo.satellites, activo.satelites),
    )

    return value === null ? "-" : `${Math.round(value)} sat`
  }

  if (column.key === "combustible") {
    return formatTelemetryPercent(
      getFirstDefined(activo.fuelPercent, activo.combustibleNivel, activo.combustible),
    )
  }

  if (column.key === "canSummary") return formatCanSummary(activo)

  if (column.key === "canRpm") {
    const value = parseTelemetryNumber(getFirstDefined(activo.canRpm, activo.rpm))

    return value === null ? "-" : `${Math.round(value).toLocaleString("es-CL")} rpm`
  }

  if (column.key === "canEngineTemp") {
    const value = parseTelemetryNumber(
      getFirstDefined(activo.canEngineTemp, activo.temperaturaMotor),
    )

    return value === null ? "-" : `${Math.round(value)} C`
  }

  if (column.key === "canBatteryVoltage") {
    const value = parseTelemetryNumber(
      getFirstDefined(activo.canBatteryVoltage, activo.batteryVoltage, activo.voltajeBateria),
    )

    return value === null ? "-" : `${Number(value.toFixed(1)).toLocaleString("es-CL")} V`
  }

  if (column.key === "canEngineLoad") {
    return formatTelemetryPercent(getFirstDefined(activo.canEngineLoad, activo.engineLoad))
  }

  if (column.key === "canThrottle") {
    return formatTelemetryPercent(getFirstDefined(activo.canThrottle, activo.throttle))
  }

  if (column.key === "canFuelRate") {
    return formatTelemetryLitersPerHour(getFirstDefined(activo.canFuelRate, activo.fuelRate))
  }

  if (column.key === "canFuelUsed") {
    return formatTelemetryLiters(getFirstDefined(activo.canFuelUsed, activo.fuelUsed))
  }

  if (column.key === "canOilPressure") {
    return formatTelemetryPsi(getFirstDefined(activo.canOilPressure, activo.oilPressure))
  }

  if (column.key === "canAdBlueLevel") {
    return formatTelemetryPercent(getFirstDefined(activo.canAdBlueLevel, activo.adBlueLevel))
  }

  if (column.key === "canDtcCount") {
    const value = parseTelemetryNumber(activo.canDtcCount)

    return value === null ? "-" : `${Math.round(value)}`
  }

  if (column.key === "horometroDiario") {
    return formatTelemetryHours(getFirstDefined(activo.engineHoursDaily, activo.horometroDiario))
  }

  if (column.key === "horometroTotal") {
    return formatTelemetryHours(getFirstDefined(activo.engineHours, activo.horometroTotal))
  }

  if (column.key === "odometro") {
    return formatTelemetryKilometers(getFirstDefined(activo.odometer, activo.odometro))
  }

  const value = getNestedValue(activo, column.key)

  if (value === null || value === undefined || value === "") {
    return "-"
  }

  return String(value)
}
