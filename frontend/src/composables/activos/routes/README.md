# Route Composables

Estado y flujos de rutas planificadas.

## Archivos

- `usePlannedRouteCatalog.js`: catalogo de rutas planificadas.
  Clave v2 por empresa; requiere sesion, permiso itineraries/view y activo
  autorizado de esa empresa. Guardar requiere itineraries/edit y vuelve a validar
  todos los IDs. Una edicion parcial conserva rutas de activos no visibles y no
  permite reemplazarlas por ID. Lectura v1 solo recupera rutas con empresa explicita;
  las no atribuibles se conservan intactas en v1, sin asignacion automatica.
  No se inyectan ejemplos y [] es un catalogo valido. Fallar escritura devuelve
  null, mantiene borrador y expone catalogError. No hay autorizacion de servidor.
  contextKey identifica usuario, empresa, permisos y activos autorizados para
  invalidar un editor abierto cuando cambia su alcance. Eventos storage refrescan
  catalogos montados; no implementa resolucion de ediciones concurrentes.
- `usePlannedRouteCatalog.test.js`: pruebas del catalogo.
- `usePlannedRouteMapEditor.js`: estado del editor de ruta en mapa.
- `useRouteComparisonUiState.js`: estado visual de comparacion.
- `useRouteDeviationDocument.js`: generacion del documento de desvio.

## Regla de mantenimiento

Mantener aqui la coordinacion Vue. El HTML y SVG del documento viven en `utils/activos/routes`.
