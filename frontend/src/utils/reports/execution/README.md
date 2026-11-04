# Report Execution

Construccion de datos operativos para reportes de activos.

## Archivos

- `assetReportExecutionUtils.js`: orquestacion de filtros, reglas y filas resultantes. En detenciones agrupa pulsos `stopped` consecutivos como una sola parada, ignora microdetenciones de menos de 30 segundos y adjunta el recorrido completo del activo dentro del rango para que el mapa pueda mostrar ruta + paradas. En geocercas agrupa posiciones consecutivas dentro de una misma zona y expone hora de entrada, hora de salida y duracion de la sesion.
- `assetReportRenderModelUtils.js`: modelo comun para vista previa y exportacion. Centraliza titulos, rango, activos incluidos, metricas, columnas visibles, recorte compacto de PDF, filas normalizadas y datos base de la hoja para que el preview, PDF y Excel no calculen versiones distintas del mismo reporte. Acepta columnas normalizadas por ejecucion (`key`) y columnas del builder de plantillas (`id`).
- `assetReportRowBuilderUtils.js`: construccion base de filas.
- `assetReportRowPostProcessingUtils.js`: deduplicacion, orden y ajustes posteriores.
- `assetReportRuleUtils.js`: aplicacion de reglas sobre eventos o telemetria.
- `assetReportTripUtils.js`: agrupacion de viajes y eventos de ruta.
- `assetReportVehicleGroupUtils.js`: normalizacion de grupos de vehiculos para
  reportes. Lee solo ids explicitos de grupo vehicular y se usa como filtro
  posterior a permisos; no interpreta sucursales, etiquetas de acceso ni campos
  legacy como alcance real.
- `assetReportColumnUtils.js`: columnas y llaves de reporte. Las plantillas especiales mantienen columnas obligatorias para construir detalle y mapa, pero ya no descartan las columnas adicionales elegidas por el usuario. Tambien expone el corte compacto de columnas para PDF: las primeras van a la tabla principal y las restantes se muestran en `Detalle adicional`; la vista de ejecucion conserva el detalle completo y Excel lo deja disponible en hojas auxiliares.
- `assetReportAssetUtils.js`: labels, busqueda e IDs de activos.
- `assetReportDateUtils.js`: fechas y rangos.
- `assetReportValueUtils.js`: valores derivados de telemetria.

## Tests

- `assetReportExecutionUtils.test.js`
- `assetReportRenderModelUtils.test.js`

## Criterio

Esta capa no exporta archivos ni renderiza UI. Solo prepara datos.
## Limites Y Consumo Configurados

reportLimitsContext.js prepara una instantanea por empresa de velocidad, consumo
al ralenti y ultimo precio. Prioridad: limite indicado para esa ejecucion,
empresa, plataforma y valor base del tipo. Sin tipo no se incluyen excesos.
No muta los activos originales ni relee JSON por muestra. Una configuracion
corrupta detiene la ejecucion en vez de producir un informe con limites falsos.
Las filas idle calculan litros y CLP a partir de su duracion real; no se calcula
consumo al ralenti sobre filas de motor en marcha. Falta de duracion, tipo o
precio produce valores ausentes, no ceros inventados. Cero consumo es valido.
Horas motor agrega sesiones idle si esa regla esta activa. Las columnas forman
parte de la vista previa y las exportaciones normales.

La instantanea produce configuredSpeedLimit, limitsSpeedUnavailable,
configuredIdleConsumption y reportFuelPrice sin mutar el activo original.
`assetReportValueUtils.js` prioriza el limite configurado y el motor de eventos
consume ese mismo contexto. No mezclar aqui el editor de reglas automaticas ni
scripts de Variables. Pruebas especificas: reportLimitsContext.test.js.
