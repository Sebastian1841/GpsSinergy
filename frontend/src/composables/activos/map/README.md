# Map Composables

Integracion del mapa de activos con Leaflet.

## Archivos

- `mapSignatures.js`: firmas para detectar cambios relevantes.
- `useActivosMap.js`: inicializacion y ciclo de vida del mapa.
- `useMapAssetMarkers.js`: coordinacion de marcadores de activos.
- `useMapItinerary.js`: capa de itinerarios en mapa.
- `useMapMovementTrails.js`: trazas de movimiento.
- `useMapPanelFullscreen.js`: estado de pantalla completa.
- `useMapPanelGeofences.js`: geocercas visibles en mapa.
- `useMapPlannedRouteEditor.js`: editor de rutas planificadas.

## Subcarpetas

- `assetMarkers/`: construccion, cache, clustering y visibilidad de marcadores.
- `geofences/`: render, edicion y foco de geocercas.
- `itinerary/`: constantes, geometria, iconos y estilos de itinerario.
- `movementTrails/`: datos, estilos y viewport de trazas.

## Regla de mantenimiento

Encapsular Leaflet aqui para que los componentes no manipulen capas directamente.
