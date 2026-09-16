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
  como async components y los monta bajo demanda cuando se abre crear, editar o
  terminal, para no descargar formularios ni terminal antes del primer uso.
- `useActivosGeofenceActions.js`: acciones de geocercas conectadas con la vista
  principal. Coordina seleccion, edicion en mapa, creacion, actualizacion,
  eliminacion simple o multiple, grupos de geocercas y auditoria. En
  importaciones, responde el resultado al panel despues de guardar y refrescar el
  mapa para cerrar la barra de progreso con un mensaje real de exito o error.
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
  mezclarlos con permisos. Si la ruta trae `activoId`, `assetId` o `asset`,
  respeta esa seleccion por encima del activo, filtros y seccion guardados en el
  workspace. Si ademas la ruta trae `section=itinerarios`, mantiene abierta esa
  seccion para no volver automaticamente a la tabla de activos.

## Regla de mantenimiento

Esta carpeta es la capa de orquestacion de la vista. No debe contener UI ni acceso directo a almacenamiento si puede delegarlo a servicios.

La vista de Activos debe partir siempre desde `visibleAssets`, que ya aplica
permisos y etiquetas de acceso. Los grupos de vehiculos gestionados desde el
header y las ciudades son filtros organizativos posteriores y solo pueden
reducir ese universo visible.

Las navegaciones externas hacia un activo concreto pueden limpiar filtros
visuales para que el usuario vea el activo solicitado. Ese foco nunca debe
buscar en todos los activos de la empresa: solo puede resolver contra listas ya
autorizadas por la vista.

Cuando la navegacion externa viene desde Alertas, `ActivosView.vue` crea un
`itineraryContextRequest` con empresa, activo, fecha y alerta. Itinerarios
genera el recorrido del dia y el mapa usa `selectedItineraryPoint` para mostrar
la ocurrencia con tooltip sobre el punto GPS mas cercano.
