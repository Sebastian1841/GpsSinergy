# Activos Composables

Estado y coordinacion del modulo de activos.

## Carpetas

- `fleet/`: tabla, columnas, formularios, terminal, telemetria y grupos.
- `geocercas/`: geocercas e historial.
- `itinerarios/`: filtros, rutas y filas de itinerarios.
- `map/`: Leaflet, marcadores, geocercas, rutas y trazas.
- `routes/`: catalogo y documentos de rutas planificadas.
- `view/`: orquestacion de la vista principal `ActivosView.vue`.

## Regla de mantenimiento

Esta carpeta debe mantener los flujos de activos desacoplados de componentes grandes. La UI importa composables, no al reves.
