# Map Components

Componentes visuales del mapa de activos.

## Archivos

- `ActivosMapPanel.vue`: contenedor del mapa Leaflet y sus capas.
- `MapFloatingTools.vue`: controles flotantes del mapa.
- `TopStatsBar.vue`: barra superior de indicadores.

## Regla de mantenimiento

La manipulacion directa de Leaflet debe quedar encapsulada en composables de mapa para evitar que el componente principal crezca.
