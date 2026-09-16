# UI Composables

Estado reutilizable de interfaz.

## Archivos

- `useConfirmDialog.js`: control de dialogos de confirmacion.
- `useDebouncedValue.js`: valor reactivo con debounce. Se usa en buscadores
  de listas grandes para mantener el input inmediato y retrasar solo el
  recalculo de filtros.
- `useFloatingModal.js`: posicion y tamano de modales flotantes.
- `useIdlePreload.js`: precarga componentes o tareas livianas cuando el navegador
  queda libre. Usa una espera conservadora, respeta ahorro de datos y se reserva
  para modales async que no deben entrar al bundle inicial.

## Regla de mantenimiento

Estos composables deben ser independientes del dominio para poder usarse en varias pantallas.

Los modales grandes deben preferir `defineAsyncComponent` y `v-if` desde el
padre. Usar `preloadWhenIdle` solo cuando el primer click sea importante y el
chunk no sea tan pesado como para competir con mapa, tablas o exportaciones.
