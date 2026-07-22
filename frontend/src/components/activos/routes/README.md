# Route Components

Componentes de rutas planificadas y comparacion de recorridos.

## Archivos

- `RouteComparisonMap.vue`: mapa de comparacion entre ruta esperada y ruta real.
- `RouteComparisonModal.vue`: modal de revision de comparacion.
- `RouteDeviationList.vue`: lista de desvios detectados.
- `RoutePlanConfiguratorModal.vue`: configurador de ruta planificada.

## Regla de mantenimiento

La generacion de documentos y calculos de desviacion debe quedar fuera de la UI, en `composables/activos/routes` y `utils/activos/routes`.
