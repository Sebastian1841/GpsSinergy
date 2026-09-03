# Report Composables

Estado Vue reutilizable para reportes.

## Archivos

- `useReportTemplates.js`: persistencia local y normalizacion de plantillas.
- `useReportEventRules.js`: persistencia local y normalizacion de reglas.
- `useReportEventRuleFormDraft.js`: estado editable del formulario de reglas, incluyendo condiciones, notificaciones, calendario, activacion y alcance por grupos de vehiculos. Ese alcance funciona como filtro de reglas/reportes sobre activos ya autorizados; no entrega ni quita permisos reales.
- `useReportBuilder.js`: estado de formulario para crear/editar plantillas.
  Normaliza presets por tipo de reporte, reglas, filtros obligatorios,
  columnas obligatorias, widgets, comportamiento especial y opciones de exportacion.
  Expone `availableFilters`, `selectedFiltersCount` y `selectedColumnsCount`
  para que el modal guiado muestre avances sin duplicar logica. Las vistas de
  resumen de `Vista` y `Exportacion` deben derivarse desde este borrador y no
  crear estados locales paralelos.
- `useAssetReportExecution.js`: seleccion de activos, ejecucion y exportacion de reportes.
- `useGeneratedReportEvents.js`: eventos calculados desde telemetria.
- `useRouteTripMapPreview.js`: generacion cancelable del preview de mapa para viajes y detenciones.

## Tests

- `useReportTemplates.test.js`
- `useGeneratedReportEvents.test.js`

## Criterio

Los composables pueden usar Vue. La logica sin estado Vue debe moverse a `../../utils/reports`.

El builder es la fuente del borrador editable de plantillas. Si se agrega un
paso visual nuevo al modal, primero revisar si realmente necesita nuevo estado;
si solo es presentacion, derivarlo desde `reportDraft` para no crear estados
paralelos que puedan guardar distinto entre crear y editar.
