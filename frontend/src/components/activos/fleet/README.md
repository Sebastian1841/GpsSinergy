# Fleet Components

Componentes de la vista de flota dentro de activos.

## Archivos

- `AddActivoModal.vue`: modal para crear un activo.
- `FleetContextMenu.vue`: menu contextual de acciones sobre activos.
- `FleetEditModal.vue`: modal para editar un activo existente.
- `FleetGeofencePanel.vue`: panel de geocercas asociadas a flota.
- `FleetListPanel.vue`: contenedor principal del listado lateral de activos.
- `FleetPanelHeader.vue`: cabecera del panel de flota.
- `FleetReportsPanel.vue`: panel de reportes relacionados con flota.
- `FleetSectionContent.vue`: cambia el contenido segun seccion activa.
- `FleetTable.vue`: tabla de activos y telemetria.
- `FleetTerminalModal.vue`: terminal visual de telemetria.
- `terminal/`: piezas internas de la terminal.

## Regla de mantenimiento

Los componentes no deben decidir reglas de negocio de telemetria. Para eso usar `composables/activos/fleet` y `utils/activos`.
