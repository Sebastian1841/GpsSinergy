# Activos Utils

Funciones puras del dominio de activos.

## Archivos

- `assetCityUtils.js`: resolucion de ciudad o zona del activo.
- `assetVehicleGroupUtils.js`: construccion de grupos de vehiculos para filtros
  visuales. Recibe activos ya autorizados y definiciones de grupos propias del
  modulo, y devuelve grupos con `assetIds` recortados a ese universo. No usa
  sucursales, empresas ni campos legacy del activo como fuente de grupos.
- `assetVehicleGroupUtils.test.js`: prueba que un grupo no incorpore activos
  fuera del arreglo autorizado recibido y que los campos legacy de grupo no
  creen agrupaciones editables.
- `assetTypeOptions.js`: opciones de tipos de activos.
- `fleetAssetFormUtils.js`: helpers de formularios de activos.
- `fleetTelemetryColumns.js`: definiciones de columnas de telemetria.
- `fleetTerminalRows.js`: construccion de filas de terminal.
- `fleetTerminalRows.test.js`: pruebas de filas de terminal.
- `geofenceHistoryUtils.js`: helpers para historial de geocercas.
- `geofenceMembershipUtils.js`: pertenencia de activos a geocercas.
- `geofenceMembershipUtils.test.js`: pruebas de pertenencia a geocercas.
- `itineraryTableColumns.js`: columnas de tabla de itinerarios.
- `operationalProfileOptions.js`: perfiles operativos por tipo de activo. Define
  reportes, KPIs, columnas y reglas sugeridas para cada tipo de vehiculo.
- `operationalProfileOptions.test.js`: pruebas del resolver de perfiles
  operativos y prioridad de reportes recomendados.
- `routeComparisonUtils.js`: calculos de comparacion de rutas.
- `routeComparisonUtils.test.js`: pruebas de comparacion de rutas.
- `routes/`: documentos y snapshots de desviacion de ruta.

## Regla de mantenimiento

Mantener aqui reglas testeables que no necesiten Vue. Servicios externos deben quedar en `services`.

Los helpers de estado deben tratar `stopped` como `Detenido`. No usar rojo ni
texto de alerta salvo que exista una alerta real separada del estado operativo.
