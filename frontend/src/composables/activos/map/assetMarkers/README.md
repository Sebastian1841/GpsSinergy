# Asset Marker Composables

Funciones auxiliares para marcadores de activos en mapa.

## Archivos

- `assetMarkerAppearance.js`: apariencia visual segun estado del activo.
- `assetMarkerCache.js`: cache de marcadores y elementos asociados.
- `assetMarkerClusterConfig.js`: configuracion de clustering.
- `assetMarkerClusterData.js`: datos derivados para clusters.
- `assetMarkerClusterFocus.js`: foco y navegacion hacia clusters.
- `assetMarkerClusters.js`: creacion y actualizacion de clusters.
- `assetMarkerClusterSignatures.js`: firmas para evitar renders innecesarios.
- `assetMarkerClusterUtils.js`: helpers puros de clustering.
- `assetMarkerIcons.js`: resolucion de iconos por tipo de activo.
- `assetMarkerTelemetry.js`: datos de telemetria para marcadores.
- `assetMarkerTooltips.js`: contenido de tooltips.
- `assetMarkerVisibility.js`: reglas de visibilidad.

## Regla de mantenimiento

Separar rendering de calculos. Lo que no dependa de Leaflet debe mantenerse como helper puro y testeable.
