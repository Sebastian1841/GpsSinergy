# Route Components

Componentes de rutas planificadas y comparacion de recorridos.

## Archivos

- `RouteComparisonMap.vue`: mapa de comparacion entre ruta esperada y ruta real.
- `RouteComparisonModal.vue`: modal de revision de comparacion.
- `RouteDeviationList.vue`: lista de desvios detectados.
- `RoutePlanConfiguratorModal.vue`: configurador de ruta planificada.

El comparador recibe rutas ya autorizadas desde ItineraryPanel; no consulta un
catalogo global. Configurar requiere canManageRoutes tanto en boton como handler.
El configurador recibe saveRoutes y saveError: cierra/emite seleccion solo cuando
el callback confirma persistencia; un fallo conserva el borrador y muestra error.
Permite eliminar la ultima ruta y guardar el catalogo vacio sin restaurar ejemplos.

## Regla de mantenimiento

La generacion de documentos y calculos de desviacion debe quedar fuera de la UI, en `composables/activos/routes` y `utils/activos/routes`.
