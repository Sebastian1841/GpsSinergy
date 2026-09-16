# Map Composables

Integracion del mapa de activos con Leaflet.

## Archivos

- `mapSignatures.js`: firmas para detectar cambios relevantes.
- `useActivosMap.js`: inicializacion y ciclo de vida del mapa.
- `useMapAssetMarkers.js`: coordinacion de marcadores de activos.
- `useMapItinerary.js`: capa de itinerarios en mapa. Tambien muestra tooltip
  especial cuando el punto seleccionado viene desde una alerta activada, abre el
  tooltip automaticamente y muestra el motivo de activacion recibido desde
  Alertas.
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

## Rendimiento

- `useActivosMap.js` agrupa sincronizaciones y refrescos de marcadores con `requestAnimationFrame`.
- `useMapAssetMarkers.js` mantiene cache por activo y aplica telemetria por lote, sin redibujar toda la flota por cada pulso.
- El clustering trabaja sobre los activos visibles ya calculados para evitar recorridos duplicados de la flota.
