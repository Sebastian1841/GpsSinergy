export const REPORT_PREVIEW_LIMIT = 200
export const REPORT_ADDRESS_PREVIEW_RESOLVE_LIMIT = 40
export const REPORT_CHART_LIMIT = 300
export const REPORT_MAP_PREVIEW_LIMIT = 80

const normalizeEmptyReportKey = (value = "") => {
  return String(value || "")
    .trim()
    .toLowerCase()
}

export const getEmptyReportContext = (template = {}) => {
  const reportTypeId = normalizeEmptyReportKey(template?.reportTypeId)
  const eventRuleIds = Array.isArray(template?.eventRuleIds)
    ? template.eventRuleIds
    : template?.eventRuleId
      ? [template.eventRuleId]
      : []
  const eventRuleSet = new Set(eventRuleIds.map(normalizeEmptyReportKey))

  const hasRule = (...ruleIds) => {
    return ruleIds.some((ruleId) => eventRuleSet.has(normalizeEmptyReportKey(ruleId)))
  }

  if (reportTypeId === "speed" || hasRule("speeding")) {
    return {
      title: "No se han encontrado excesos de velocidad",
      detail: "El rango y los activos seleccionados no tienen eventos sobre el limite configurado.",
    }
  }

  if (reportTypeId === "geofences" || hasRule("geofence")) {
    return {
      title: "No se han encontrado pasos por geocerca",
      detail: "No hay entradas, salidas o permanencias en geocercas para la seleccion actual.",
    }
  }

  if (reportTypeId === "idle-time" || hasRule("idle")) {
    return {
      title: "No se han encontrado eventos de ralenti",
      detail: "No hay periodos con motor encendido y velocidad baja para la seleccion actual.",
    }
  }

  if (reportTypeId === "stops" || hasRule("stops")) {
    return {
      title: "No se han encontrado detenciones",
      detail: "No hay paradas registradas para el rango y activos seleccionados.",
    }
  }

  if (reportTypeId === "route-history" || reportTypeId === "mileage" || hasRule("movement")) {
    return {
      title: "No se han encontrado recorridos",
      detail: "No hay posiciones o eventos de movimiento para el rango seleccionado.",
    }
  }

  if (reportTypeId === "alerts" || hasRule("alerts")) {
    return {
      title: "No se han encontrado alertas",
      detail: "No hay alertas operativas para el rango y activos seleccionados.",
    }
  }

  if (reportTypeId === "gps-signal" || hasRule("gpssignal")) {
    return {
      title: "No se han encontrado eventos de senal GPS",
      detail: "No hay eventos de perdida o recuperacion de senal en la seleccion actual.",
    }
  }

  if (reportTypeId === "fuel" || hasRule("fuel")) {
    return {
      title: "No se han encontrado eventos de combustible",
      detail: "No hay variaciones o registros de combustible para la seleccion actual.",
    }
  }

  if (reportTypeId === "can" || hasRule("can")) {
    return {
      title: "No se han encontrado datos CAN",
      detail: "No hay telemetria CAN disponible para el rango y activos seleccionados.",
    }
  }

  if (reportTypeId === "engine-hours" || hasRule("engine")) {
    return {
      title: "No se han encontrado eventos de motor",
      detail: "No hay actividad de motor para el rango y activos seleccionados.",
    }
  }

  if (reportTypeId === "ignition" || hasRule("ignition")) {
    return {
      title: "No se han encontrado cambios de encendido",
      detail: "No hay cambios de contacto para el rango y activos seleccionados.",
    }
  }

  return {
    title: "No se han encontrado datos",
    detail: `No hay resultados para ${template?.name || "este reporte"} con la seleccion actual.`,
  }
}

export const isRouteHistoryReport = (template = {}) => {
  return normalizeEmptyReportKey(template?.reportTypeId) === "route-history"
}

export const getReportBusyTitle = ({ isExportingExcel = false, isExportingPdf = false } = {}) => {
  if (isExportingExcel) return "Exportando Excel"
  if (isExportingPdf) return "Exportando PDF"

  return "Generando reporte"
}

export const getReportBusyDetail = ({ isExportingExcel = false, isExportingPdf = false } = {}) => {
  if (isExportingExcel) {
    return "Preparando el archivo con todos los datos y graficos configurados."
  }

  if (isExportingPdf) {
    return "Creando el PDF con la misma estructura del reporte de itinerario."
  }

  return "Aplicando reglas de evento y preparando la vista previa."
}

export const parseReportMetricNumber = (value) => {
  const match = String(value ?? "").match(/-?\d[\d.,]*/)

  if (!match) return 0

  const rawNumber = match[0]
  const normalizedNumber =
    rawNumber.includes(",") && rawNumber.includes(".")
      ? rawNumber.replace(/\./g, "").replace(",", ".")
      : rawNumber.replace(",", ".")
  const number = Number(normalizedNumber)

  return Number.isFinite(number) ? number : 0
}

export const formatTripDistance = (value) => {
  return `${Number(Number(value || 0).toFixed(1)).toLocaleString("es-CL")} km`
}

export const formatTripDuration = (milliseconds) => {
  const totalMinutes = Math.max(0, Math.round(Number(milliseconds || 0) / 60000))

  if (!totalMinutes) return "0 min"

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) return `${hours} h ${minutes} min`

  return `${minutes} min`
}

export const getTripRowAssetKey = (row = {}) => {
  return String(
    row.asset?.id || row.asset?.patente || row.values?.patente || row.values?.vehiculo || row.id,
  )
}

export const getTripRowDurationMs = (row = {}) => {
  const start = new Date(row.routeTrip?.startTimestamp || 0).getTime()
  const end = new Date(row.routeTrip?.endTimestamp || 0).getTime()

  return Number.isFinite(start) && Number.isFinite(end) && end > start ? end - start : 0
}

export const buildTripPreviewSummary = (rows = []) => {
  const distanceKm = rows.reduce((total, row) => {
    return (
      total +
      (Number(row.routeTrip?.distanceKm) || parseReportMetricNumber(row.values?.tripDistanceKm))
    )
  }, 0)
  const durationMs = rows.reduce((total, row) => total + getTripRowDurationMs(row), 0)
  const assetCount = new Set(rows.map(getTripRowAssetKey).filter(Boolean)).size

  return {
    trips: rows.length,
    distanceLabel: formatTripDistance(distanceKm),
    durationLabel: formatTripDuration(durationMs),
    assets: assetCount,
  }
}

export const getEmptyExportCharts = () => {
  return {
    enabled: false,
    items: [],
  }
}
