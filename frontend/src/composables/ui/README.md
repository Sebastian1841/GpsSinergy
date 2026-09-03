# UI Composables

Estado reutilizable de interfaz.

## Archivos

- `useConfirmDialog.js`: control de dialogos de confirmacion.
- `useDebouncedValue.js`: valor reactivo con debounce. Se usa en buscadores
  de listas grandes para mantener el input inmediato y retrasar solo el
  recalculo de filtros.
- `useFloatingModal.js`: posicion y tamano de modales flotantes.
- `useIdlePreload.js`: precarga componentes o tareas livianas cuando el navegador
  queda libre. Se usa para modales async: la vista no paga el costo en el bundle
  inicial, pero el primer click normalmente encuentra el componente ya descargado.

## Regla de mantenimiento

Estos composables deben ser independientes del dominio para poder usarse en varias pantallas.

Los modales grandes deben preferir `defineAsyncComponent` mas `preloadWhenIdle`.
Si el modal esta cerrado, montarlo con `v-if` desde el padre para evitar ejecutar
su `setup` y watchers antes de que el usuario lo abra.
