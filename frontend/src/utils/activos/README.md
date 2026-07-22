# Activos Utils

Funciones puras del dominio de activos.

## Archivos

- `assetCityUtils.js`: resolucion de ciudad o zona del activo.
- `assetTypeOptions.js`: opciones de tipos de activos.
- `fleetAssetFormUtils.js`: helpers de formularios de activos.
- `fleetTelemetryColumns.js`: definiciones de columnas de telemetria.
- `fleetTerminalRows.js`: construccion de filas de terminal.
- `fleetTerminalRows.test.js`: pruebas de filas de terminal.
- `geofenceHistoryUtils.js`: helpers para historial de geocercas.
- `geofenceMembershipUtils.js`: pertenencia de activos a geocercas.
- `geofenceMembershipUtils.test.js`: pruebas de pertenencia a geocercas.
- `itineraryTableColumns.js`: columnas de tabla de itinerarios.
- `routeComparisonUtils.js`: calculos de comparacion de rutas.
- `routeComparisonUtils.test.js`: pruebas de comparacion de rutas.
- `routes/`: documentos y snapshots de desviacion de ruta.

## Regla de mantenimiento

Mantener aqui reglas testeables que no necesiten Vue. Servicios externos deben quedar en `services`.
