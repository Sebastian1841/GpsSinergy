# Report Execution

Construccion de datos operativos para reportes de activos.

## Archivos

- `assetReportExecutionUtils.js`: orquestacion de filtros, reglas y filas resultantes.
- `assetReportRowBuilderUtils.js`: construccion base de filas.
- `assetReportRowPostProcessingUtils.js`: deduplicacion, orden y ajustes posteriores.
- `assetReportRuleUtils.js`: aplicacion de reglas sobre eventos o telemetria.
- `assetReportTripUtils.js`: agrupacion de viajes y eventos de ruta.
- `assetReportColumnUtils.js`: columnas y llaves de reporte.
- `assetReportAssetUtils.js`: labels, busqueda e IDs de activos.
- `assetReportDateUtils.js`: fechas y rangos.
- `assetReportValueUtils.js`: valores derivados de telemetria.

## Tests

- `assetReportExecutionUtils.test.js`

## Criterio

Esta capa no exporta archivos ni renderiza UI. Solo prepara datos.
