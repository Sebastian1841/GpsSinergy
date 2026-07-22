# Map Geofence Composables

Geocercas dentro del mapa.

## Archivos

- `geofenceCreation.js`: helpers de creacion.
- `geofenceFocus.js`: foco y encuadre de geocercas.
- `geofenceMapStyles.js`: estilos de capas de geocerca.
- `useGeofenceDrawing.js`: dibujo interactivo.
- `useGeofenceEditing.js`: edicion interactiva.
- `useGeofenceRenderer.js`: renderizado de capas.
- `useMapGeofences.js`: coordinador principal.
- `useMapPanelGeofenceActions.js`: acciones desde panel de mapa.
- `useMapPanelGeofenceModals.js`: estado de modales relacionados.
- `useMapPanelGeofenceState.js`: estado compartido de geocercas.

## Regla de mantenimiento

Mantener aqui solo integracion con mapa y estado Vue. Calculos geometricos reutilizables deben quedar en `utils`.
