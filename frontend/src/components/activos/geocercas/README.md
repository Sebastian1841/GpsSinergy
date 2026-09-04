# Geocerca Components

Componentes para administrar geocercas desde activos.

## Archivos

- `GeofenceEditorPanel.vue`: panel de creacion y edicion de geocercas. El
  campo `Grupo` es un dropdown alimentado por los grupos creados en la seccion
  `Geocercas` del panel lateral; permite `Sin grupo`, pero no crea grupos desde
  el mapa para evitar duplicados o nombres libres. En modo edicion trabaja con
  un borrador: `Guardar` confirma cambios y `Cancelar` descarta lo modificado
  antes de cerrar. El panel flota sobre el mapa con limites responsive para no
  salirse en pantallas angostas.
- `GeofenceHistoryModal.vue`: modal de historial de eventos de geocerca.
- `GeofenceSelectorModal.vue`: selector de geocercas disponibles.
- `history/`: piezas internas de la vista de historial.

## Regla de mantenimiento

Las operaciones sobre geometria o pertenencia deben vivir en `utils/`, no dentro de los componentes.
