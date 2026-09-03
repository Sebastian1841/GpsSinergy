# Report Execution

Construccion de datos operativos para reportes de activos.

## Archivos

- `assetReportExecutionUtils.js`: orquestacion de filtros, reglas y filas resultantes. En detenciones agrupa pulsos `stopped` consecutivos como una sola parada, ignora microdetenciones de menos de 30 segundos y adjunta el recorrido completo del activo dentro del rango para que el mapa pueda mostrar ruta + paradas. En geocercas agrupa posiciones consecutivas dentro de una misma zona y expone hora de entrada, hora de salida y duracion de la sesion.
- `assetReportRowBuilderUtils.js`: construccion base de filas.
- `assetReportRowPostProcessingUtils.js`: deduplicacion, orden y ajustes posteriores.
- `assetReportRuleUtils.js`: aplicacion de reglas sobre eventos o telemetria.
- `assetReportTripUtils.js`: agrupacion de viajes y eventos de ruta.
- `assetReportColumnUtils.js`: columnas y llaves de reporte. Las plantillas especiales mantienen columnas obligatorias para construir detalle y mapa, pero ya no descartan las columnas adicionales elegidas por el usuario. Tambien expone el corte compacto de columnas para PDF: las primeras van a la tabla principal y las restantes se muestran en `Detalle adicional`; la vista de ejecucion conserva el detalle completo y Excel lo deja disponible en hojas auxiliares.
- `assetReportAssetUtils.js`: labels, busqueda e IDs de activos.
- `assetReportDateUtils.js`: fechas y rangos.
- `assetReportValueUtils.js`: valores derivados de telemetria.

## Tests

- `assetReportExecutionUtils.test.js`

## Criterio

Esta capa no exporta archivos ni renderiza UI. Solo prepara datos.
