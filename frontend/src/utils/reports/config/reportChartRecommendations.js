const DEFAULT_RECOMMENDATION_LIMIT = 4

const normalizeId = (value) => String(value || "").trim()

const normalizeSet = (values = []) => {
  return new Set((Array.isArray(values) ? values : [values]).map(normalizeId).filter(Boolean))
}

const scoreByMatches = (sourceSet, candidateIds = [], weight = 1) => {
  return candidateIds.reduce((score, candidateId) => {
    return sourceSet.has(normalizeId(candidateId)) ? score + weight : score
  }, 0)
}

const REPORT_CHART_RECOMMENDATIONS = [
  {
    id: "speed",
    label: "Velocidad",
    detail: "Evolucion de km/h por punto reportado.",
    variableKey: "speed",
    variableLabel: "Velocidad",
    chartTypeLabel: "Linea",
    reportTypeIds: ["speed", "route-history", "mileage"],
    eventRuleIds: ["movement", "speeding"],
    columnIds: ["velocidad", "speed"],
  },
  {
    id: "speedLimit",
    label: "Limite configurado",
    detail: "Referencia del umbral usado para exceso.",
    variableKey: "speedLimit",
    variableLabel: "Limite de velocidad",
    chartTypeLabel: "Linea",
    reportTypeIds: ["speed"],
    eventRuleIds: ["speeding"],
    columnIds: ["speedLimit"],
  },
  {
    id: "speedingDelta",
    label: "Sobre limite",
    detail: "Diferencia entre velocidad y limite.",
    variableKey: "speedingDelta",
    variableLabel: "Sobre limite",
    chartTypeLabel: "Barras",
    reportTypeIds: ["speed", "alerts"],
    eventRuleIds: ["speeding", "alerts"],
    columnIds: ["speedingDelta"],
  },
  {
    id: "accumulatedDistanceKm",
    label: "Distancia acumulada",
    detail: "Progreso del recorrido durante el periodo.",
    variableKey: "accumulatedDistanceKm",
    variableLabel: "Distancia acumulada",
    chartTypeLabel: "Linea",
    reportTypeIds: ["route-history", "mileage"],
    eventRuleIds: ["movement"],
    columnIds: ["accumulatedDistanceKm", "odometro"],
  },
  {
    id: "duration",
    label: "Duracion",
    detail: "Tiempo asociado a detenciones, ralenti o geocercas.",
    variableKey: "durationMinutes",
    variableLabel: "Duracion",
    chartTypeLabel: "Barras",
    reportTypeIds: ["stops", "idle-time", "geofences"],
    eventRuleIds: ["stops", "idle", "geofence"],
    columnIds: ["duracion"],
  },
  {
    id: "gpsSatellites",
    label: "Satelites GPS",
    detail: "Calidad de recepcion GPS por reporte.",
    variableKey: "gpsSatellites",
    variableLabel: "Satelites GPS",
    chartTypeLabel: "Barras",
    reportTypeIds: ["gps-signal", "route-history"],
    eventRuleIds: ["gpsSignal"],
    columnIds: ["gpsSatellites"],
  },
  {
    id: "gpsSignal",
    label: "Senal GPS",
    detail: "Porcentaje de senal reportado por equipo.",
    variableKey: "gpsSignal",
    variableLabel: "Senal GPS",
    chartTypeLabel: "Linea",
    reportTypeIds: ["gps-signal"],
    eventRuleIds: ["gpsSignal"],
    columnIds: ["gpsSignal"],
  },
  {
    id: "fuelPercent",
    label: "Combustible",
    detail: "Nivel de combustible en el periodo.",
    variableKey: "fuelPercent",
    variableLabel: "Nivel de combustible",
    chartTypeLabel: "Linea",
    reportTypeIds: ["fuel"],
    eventRuleIds: ["fuel"],
    columnIds: ["combustible"],
  },
  {
    id: "engineHours",
    label: "Horometro",
    detail: "Horas acumuladas de motor por activo.",
    variableKey: "engineHours",
    variableLabel: "Horometro total",
    chartTypeLabel: "Barras",
    reportTypeIds: ["engine-hours"],
    eventRuleIds: ["engine"],
    columnIds: ["horometro", "horometroTotal"],
  },
  {
    id: "ignition",
    label: "Encendido",
    detail: "Cambios de contacto como 1 encendido y 0 apagado.",
    variableKey: "ignition",
    variableLabel: "Encendido",
    chartTypeLabel: "Linea",
    reportTypeIds: ["ignition", "engine-hours", "idle-time"],
    eventRuleIds: ["ignition", "engine", "idle"],
    columnIds: ["ignition", "ignicion", "contacto"],
  },
  {
    id: "canRpm",
    label: "RPM",
    detail: "Regimen del motor recibido por CAN.",
    variableKey: "canRpm",
    variableLabel: "RPM del motor",
    chartTypeLabel: "Linea",
    reportTypeIds: ["can"],
    eventRuleIds: ["can", "engine"],
    columnIds: ["canRpm", "canSummary"],
  },
  {
    id: "canEngineTemp",
    label: "Temperatura motor",
    detail: "Temperatura recibida por CAN.",
    variableKey: "canEngineTemp",
    variableLabel: "Temperatura del motor",
    chartTypeLabel: "Linea",
    reportTypeIds: ["can", "engine-hours"],
    eventRuleIds: ["can", "engine"],
    columnIds: ["canEngineTemp", "canSummary"],
  },
  {
    id: "status",
    label: "Estado operativo",
    detail: "Distribucion de movimiento, detenido y sin senal.",
    variableKey: "status",
    variableLabel: "Estado operativo",
    chartTypeLabel: "Dona",
    reportTypeIds: ["mileage", "route-history", "gps-signal"],
    eventRuleIds: ["movement", "stops", "idle", "gpsSignal"],
    columnIds: ["estado", "evento"],
  },
]

const DEFAULT_RECOMMENDATIONS = ["speed", "gpsSatellites", "status"]

export const getReportChartRecommendations = ({
  reportTypeId = "",
  eventRuleIds = [],
  columnIds = [],
  category = "",
  limit = DEFAULT_RECOMMENDATION_LIMIT,
} = {}) => {
  const reportTypeSet = normalizeSet(reportTypeId)
  const eventRuleSet = normalizeSet(eventRuleIds)
  const columnSet = normalizeSet(columnIds)
  const categorySet = normalizeSet(category)
  const normalizedLimit = Math.max(1, Number(limit) || DEFAULT_RECOMMENDATION_LIMIT)

  const scoredRecommendations = REPORT_CHART_RECOMMENDATIONS.map((recommendation, index) => {
    const score =
      scoreByMatches(reportTypeSet, recommendation.reportTypeIds, 5) +
      scoreByMatches(eventRuleSet, recommendation.eventRuleIds, 3) +
      scoreByMatches(columnSet, recommendation.columnIds, 2) +
      scoreByMatches(categorySet, recommendation.categoryIds, 1)

    return {
      ...recommendation,
      index,
      score,
    }
  })
    .filter((recommendation) => recommendation.score > 0)
    .sort((first, second) => second.score - first.score || first.index - second.index)

  const sourceRecommendations = scoredRecommendations.length
    ? scoredRecommendations
    : DEFAULT_RECOMMENDATIONS.map((recommendationId) => {
        return REPORT_CHART_RECOMMENDATIONS.find((recommendation) => {
          return recommendation.id === recommendationId
        })
      }).filter(Boolean)

  return sourceRecommendations
    .slice(0, normalizedLimit)
    .map(({ index: _index, score: _score, ...recommendation }) => {
      return recommendation
    })
}
