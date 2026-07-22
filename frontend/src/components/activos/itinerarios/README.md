# Itinerario Components

Componentes visuales de itinerarios.

## Archivos

- `ItineraryCharts.vue`: graficos del comportamiento del itinerario.
- `ItineraryDaySummary.vue`: resumen diario.
- `ItineraryPanel.vue`: panel principal de itinerarios.
- `ItinerarySummary.vue`: metricas generales.
- `ItineraryTable.vue`: tabla de recorridos y eventos.

## Regla de mantenimiento

Los componentes consumen datos ya preparados desde composables. Transformaciones de filas o rutas deben estar en `composables/activos/itinerarios` o `utils/activos`.
