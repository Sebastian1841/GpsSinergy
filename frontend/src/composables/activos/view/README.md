# Activos View Composables

Composables que descomponen `ActivosView.vue`.

## Archivos

- `useActivosCrud.js`: acciones de creacion, edicion y eliminacion.
- `useActivosFilters.js`: filtros de activos.
- `useActivosFleetModals.js`: estado de modales de flota.
- `useActivosLayout.js`: layout principal de la vista.
- `useActivosPermissions.js`: permisos aplicados a activos.
- `useActivosSelection.js`: seleccion de activo actual.
- `useActivosTelemetrySync.js`: sincronizacion entre telemetria viva, mapa y tabla.
- `useActivosTelemetrySync.test.js`: pruebas de sincronizacion.
- `useActivosWorkspacePersistence.js`: persistencia de preferencias por espacio de trabajo.

## Regla de mantenimiento

Esta carpeta es la capa de orquestacion de la vista. No debe contener UI ni acceso directo a almacenamiento si puede delegarlo a servicios.
