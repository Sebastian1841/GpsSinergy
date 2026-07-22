export const REPORT_OUTPUT_OPTION_IDS = {
  excelExport: "excelExport",
  pdfExport: "pdfExport",
  previewTripMap: "previewTripMap",
  pdfTripMap: "pdfTripMap",
  excelTripMap: "excelTripMap",
}

export const DEFAULT_REPORT_OUTPUT_OPTIONS = {
  [REPORT_OUTPUT_OPTION_IDS.excelExport]: true,
  [REPORT_OUTPUT_OPTION_IDS.pdfExport]: true,
  [REPORT_OUTPUT_OPTION_IDS.previewTripMap]: true,
  [REPORT_OUTPUT_OPTION_IDS.pdfTripMap]: true,
  [REPORT_OUTPUT_OPTION_IDS.excelTripMap]: true,
}

export const REPORT_OUTPUT_OPTION_GROUPS = [
  {
    id: "exports",
    label: "Exportacion",
    description: "Formatos disponibles al ejecutar el reporte.",
    options: [
      {
        id: REPORT_OUTPUT_OPTION_IDS.excelExport,
        label: "Excel",
        description: "Permite descargar el reporte como planilla.",
      },
      {
        id: REPORT_OUTPUT_OPTION_IDS.pdfExport,
        label: "PDF",
        description: "Permite descargar el reporte como documento.",
      },
    ],
  },
  {
    id: "tripMap",
    label: "Mapa de viajes",
    description: "Imagen del recorrido para reportes de viajes.",
    reportTypeIds: ["route-history"],
    options: [
      {
        id: REPORT_OUTPUT_OPTION_IDS.previewTripMap,
        label: "Vista previa",
        description: "Muestra el mapa al generar el reporte en pantalla.",
      },
      {
        id: REPORT_OUTPUT_OPTION_IDS.pdfTripMap,
        label: "PDF",
        description: "Incluye el mapa en el PDF exportado.",
      },
      {
        id: REPORT_OUTPUT_OPTION_IDS.excelTripMap,
        label: "Excel",
        description: "Incluye el mapa en el Excel exportado.",
      },
    ],
  },
]

export const normalizeReportOutputOptions = (outputOptions = {}) => {
  return Object.fromEntries(
    Object.entries(DEFAULT_REPORT_OUTPUT_OPTIONS).map(([optionId, defaultValue]) => {
      const sourceValue = outputOptions?.[optionId]

      return [optionId, sourceValue === undefined ? defaultValue : Boolean(sourceValue)]
    }),
  )
}

export const isReportOutputOptionEnabled = (template = {}, optionId) => {
  return normalizeReportOutputOptions(template?.outputOptions)[optionId] === true
}
