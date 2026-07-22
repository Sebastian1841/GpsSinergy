# Report Composables

Estado Vue reutilizable para reportes.

## Archivos

- `useReportTemplates.js`: persistencia local y normalizacion de plantillas.
- `useReportEventRules.js`: persistencia local y normalizacion de reglas.
- `useReportBuilder.js`: estado de formulario para crear/editar plantillas.
- `useAssetReportExecution.js`: seleccion de activos, ejecucion y exportacion de reportes.
- `useGeneratedReportEvents.js`: eventos calculados desde telemetria.
- `useRouteTripMapPreview.js`: generacion cancelable del preview de mapa de viajes.

## Tests

- `useReportTemplates.test.js`
- `useGeneratedReportEvents.test.js`

## Criterio

Los composables pueden usar Vue. La logica sin estado Vue debe moverse a `../../utils/reports`.
