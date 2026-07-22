# Route Utils

Funciones puras para documentos y snapshots de rutas.

## Archivos

- `buildRouteDeviationDocument.js`: construye el HTML del informe de desvio de ruta.
- `buildRouteDeviationDocument.test.js`: pruebas del documento de desvio.
- `routeDeviationSnapshotUtils.js`: helpers de snapshot visual de ruta.

## Regla de mantenimiento

El HTML generado debe mantenerse aislado de componentes Vue para poder probar y exportar sin montar UI.
