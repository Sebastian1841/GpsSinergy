# Geocerca Components

Componentes para administrar geocercas desde activos.

## Archivos

- `GeofenceEditorPanel.vue`: panel de creacion y edicion de geocercas.
- `GeofenceHistoryModal.vue`: modal de historial de eventos de geocerca.
- `GeofenceSelectorModal.vue`: selector de geocercas disponibles.
- `history/`: piezas internas de la vista de historial.

## Regla de mantenimiento

Las operaciones sobre geometria o pertenencia deben vivir en `utils/`, no dentro de los componentes.
