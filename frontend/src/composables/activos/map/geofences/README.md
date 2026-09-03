# Map Geofence Composables

Geocercas dentro del mapa.

## Archivos

- `geofenceCreation.js`: helpers de creacion.
- `geofenceFocus.js`: foco y encuadre de geocercas.
- `geofenceMapStyles.js`: estilos de capas de geocerca.
- `useGeofenceDrawing.js`: dibujo interactivo.
- `useGeofenceEditing.js`: edicion interactiva.
- `useGeofenceRenderer.js`: renderizado de capas. Muestra el nombre de cada
  geocerca en tooltip y no abre edicion al hacer click sobre la capa del mapa.
- `useMapGeofences.js`: coordinador principal.
- `useMapPanelGeofenceActions.js`: acciones desde panel de mapa.
- `useMapPanelGeofenceState.js`: estado compartido de geocercas visibles,
  seleccion activa y datos del borrador de creacion/edicion. El mapa ya no
  monta modales de selector o historial de geocercas.

## Regla de mantenimiento

Mantener aqui solo integracion con mapa y estado Vue. Calculos geometricos
reutilizables deben quedar en `utils`. La edicion de geocercas debe abrirse
desde controles explicitos del panel/listado, no por seleccion directa de la
capa en el mapa ni por un selector modal del boton flotante del mapa. Ese boton
solo redirige a la seccion lateral `geocercas`. El historial de geocercas no se
expone desde la barra flotante del mapa.
