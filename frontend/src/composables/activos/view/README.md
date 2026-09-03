# Activos View Composables

Composables que descomponen `ActivosView.vue`.

## Archivos

- `useActivosCrud.js`: acciones de creacion, edicion y eliminacion.
- `useActivosDeviceActions.js`: acciones cruzadas del menu contextual de
  activos. Abre itinerarios, resumen diario, agrega activos al resumen y navega
  al modulo de mantenciones para el vehiculo seleccionado.
- `useActivosFilters.js`: filtros de activos. El texto visible del buscador se
  actualiza inmediato, pero la lista/tabla/mapa filtran con debounce para no
  recalcular la flota en cada tecla.
- `useActivosFleetModals.js`: estado de modales de flota. Define los modales
  como async components y los precarga con `preloadWhenIdle` despues de montar
  Activos, para que crear/editar/terminal no castiguen el render inicial ni el
  primer click.
- `useActivosGeofenceActions.js`: acciones de geocercas conectadas con la vista
  principal. Coordina seleccion, edicion en mapa, creacion, actualizacion,
  eliminacion, grupos de geocercas y auditoria. En importaciones, responde el
  resultado al panel despues de guardar y refrescar el mapa para cerrar la barra
  de progreso con un mensaje real de exito o error.
- `useActivosLayout.js`: layout principal de la vista. Controla el divisor entre
  el panel de flota y el mapa, manteniendo un minimo de `300px` para la tabla y
  `260px` para que el mapa no colapse al mover el separador.
- `useActivosMapTelemetryBridge.js`: puente entre la telemetria viva y el panel
  de mapa. Guarda temporalmente el ultimo lote si el mapa aun no esta montado y
  lo aplica cuando la referencia queda disponible.
- `useActivosPermissions.js`: permisos aplicados a activos. Expone permisos de
  GPS, reportes, itinerarios, mantenciones y geocercas para que la vista pueda
  habilitar acciones cruzadas sin mezclar permisos de edicion.
- `useActivosSelection.js`: seleccion de activo actual.
- `useActivosTelemetrySync.js`: sincronizacion entre telemetria viva, mapa y tabla.
- `useActivosTelemetrySync.test.js`: pruebas de sincronizacion.
- `useActivosWorkspacePersistence.js`: persistencia de preferencias por espacio
  de trabajo, incluyendo filtros visuales de ciudad y grupo de vehiculos sin
  mezclarlos con permisos.

## Regla de mantenimiento

Esta carpeta es la capa de orquestacion de la vista. No debe contener UI ni acceso directo a almacenamiento si puede delegarlo a servicios.

La vista de Activos debe partir siempre desde `visibleAssets`, que ya aplica
permisos y etiquetas de acceso. Los grupos de vehiculos gestionados desde el
header y las ciudades son filtros organizativos posteriores y solo pueden
reducir ese universo visible.
