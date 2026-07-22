export const REPORT_BEHAVIOR_OPTION_IDS = {
  resolveAddresses: "resolveAddresses",
  resolveTripEndpoints: "resolveTripEndpoints",
  reverseGeocodeExportLimit: "reverseGeocodeExportLimit",
  groupGeofenceSessions: "groupGeofenceSessions",
  routeTripIncludeStopEvents: "routeTripIncludeStopEvents",
  routeTripIncludeIdleEvents: "routeTripIncludeIdleEvents",
}

export const DEFAULT_REPORT_REVERSE_GEOCODE_EXPORT_LIMIT = 8

export const DEFAULT_REPORT_BEHAVIOR_OPTIONS = {
  [REPORT_BEHAVIOR_OPTION_IDS.resolveAddresses]: true,
  [REPORT_BEHAVIOR_OPTION_IDS.resolveTripEndpoints]: true,
  [REPORT_BEHAVIOR_OPTION_IDS.reverseGeocodeExportLimit]:
    DEFAULT_REPORT_REVERSE_GEOCODE_EXPORT_LIMIT,
  [REPORT_BEHAVIOR_OPTION_IDS.groupGeofenceSessions]: true,
  [REPORT_BEHAVIOR_OPTION_IDS.routeTripIncludeStopEvents]: true,
  [REPORT_BEHAVIOR_OPTION_IDS.routeTripIncludeIdleEvents]: true,
}

const NUMBER_OPTION_LIMITS = {
  [REPORT_BEHAVIOR_OPTION_IDS.reverseGeocodeExportLimit]: {
    min: 0,
    max: 120,
    step: 1,
  },
}

export const REPORT_BEHAVIOR_OPTION_GROUPS = [
  {
    id: "addresses",
    label: "Direcciones",
    description: "Controla si el reporte transforma coordenadas en ubicaciones legibles.",
    options: [
      {
        id: REPORT_BEHAVIOR_OPTION_IDS.resolveAddresses,
        type: "checkbox",
        label: "Resolver direcciones",
        description: "Convierte coordenadas de posicion en direccion cuando exista esa columna.",
      },
      {
        id: REPORT_BEHAVIOR_OPTION_IDS.resolveTripEndpoints,
        type: "checkbox",
        label: "Origen y destino",
        description: "Resuelve direcciones exactas para inicio y fin de cada viaje.",
        reportTypeIds: ["route-history"],
      },
      {
        id: REPORT_BEHAVIOR_OPTION_IDS.reverseGeocodeExportLimit,
        type: "number",
        label: "Direcciones por exportacion",
        description:
          "Maximo de direcciones nuevas que PDF y Excel intentan resolver por ejecucion.",
        ...NUMBER_OPTION_LIMITS[REPORT_BEHAVIOR_OPTION_IDS.reverseGeocodeExportLimit],
      },
    ],
  },
  {
    id: "trips",
    label: "Viajes",
    description: "Reglas usadas para crear cada viaje dentro de una misma patente.",
    reportTypeIds: ["route-history"],
    options: [
      {
        id: REPORT_BEHAVIOR_OPTION_IDS.routeTripIncludeStopEvents,
        type: "checkbox",
        label: "Contar detenciones",
        description: "Incluye paradas dentro del resumen de eventos del viaje.",
      },
      {
        id: REPORT_BEHAVIOR_OPTION_IDS.routeTripIncludeIdleEvents,
        type: "checkbox",
        label: "Contar ralenti",
        description: "Incluye periodos de ralenti dentro del resumen del viaje.",
      },
    ],
  },
  {
    id: "geofences",
    label: "Geocercas",
    description: "Controla como se compactan las entradas y permanencias.",
    reportTypeIds: ["geofences"],
    options: [
      {
        id: REPORT_BEHAVIOR_OPTION_IDS.groupGeofenceSessions,
        type: "checkbox",
        label: "Agrupar permanencias",
        description: "Une puntos consecutivos dentro de la misma geocerca en un solo registro.",
      },
    ],
  },
]

const BOOLEAN_OPTION_IDS = new Set(
  Object.entries(DEFAULT_REPORT_BEHAVIOR_OPTIONS)
    .filter(([, value]) => typeof value === "boolean")
    .map(([key]) => key),
)

const clampNumber = (value, min, max) => {
  return Math.min(max, Math.max(min, value))
}

export const normalizeReportBehaviorOptions = (behaviorOptions = {}) => {
  return Object.fromEntries(
    Object.entries(DEFAULT_REPORT_BEHAVIOR_OPTIONS).map(([optionId, defaultValue]) => {
      const sourceValue = behaviorOptions?.[optionId]

      if (BOOLEAN_OPTION_IDS.has(optionId)) {
        return [optionId, sourceValue === undefined ? defaultValue : Boolean(sourceValue)]
      }

      const numberLimits = NUMBER_OPTION_LIMITS[optionId]

      if (numberLimits) {
        const number = Number(sourceValue === undefined ? defaultValue : sourceValue)
        const normalizedNumber = Number.isFinite(number) ? number : defaultValue

        return [
          optionId,
          clampNumber(Math.round(normalizedNumber), numberLimits.min, numberLimits.max),
        ]
      }

      return [optionId, sourceValue === undefined ? defaultValue : sourceValue]
    }),
  )
}

export const isReportBehaviorOptionEnabled = (template = {}, optionId) => {
  return normalizeReportBehaviorOptions(template?.behaviorOptions)[optionId] === true
}

export const getReportBehaviorOptionValue = (template = {}, optionId) => {
  return normalizeReportBehaviorOptions(template?.behaviorOptions)[optionId]
}
