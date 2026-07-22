# Fleet Composables

Estado y comportamiento de flota.

## Archivos

- `useFleetColumns.js`: columnas visibles, orden y definicion de tabla.
- `useFleetColumns.test.js`: pruebas de columnas de flota.
- `useFleetCreateForm.js`: estado del formulario de creacion.
- `useFleetDeviceContextMenu.js`: estado del menu contextual de activos.
- `useFleetEditForm.js`: estado del formulario de edicion.
- `useFleetFormWizard.js`: pasos del asistente de formulario.
- `useFleetSorting.js`: ordenamiento de tabla.
- `useFleetTelemetry.js`: preparacion de telemetria de flota.
- `useFleetTelemetry.test.js`: pruebas de telemetria de flota.
- `useFleetTerminal.js`: estado y comandos de terminal.
- `useFleetTerminalModal.js`: apertura, cierre y layout del modal de terminal.
- `usePersistedFleetLayout.js`: persistencia local de layout de flota.
- `usePersonalAssetGroups.js`: grupos personales de activos.
- `useSucursalesFlota.js`: relacion entre sucursales y flota.
- `useTelemetryHistory.js`: historial de pulsos y reportes de telemetria.

## Regla de mantenimiento

Mantener aqui estado y efectos Vue. Calculos reutilizables deben moverse a `utils/activos`.
