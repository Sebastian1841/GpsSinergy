# Maintenance Components

UI del modulo de mantenciones. `MaintenanceView.vue` conecta estas piezas con
`useMaintenanceModule.js`; los datos y cambios operativos no se guardan en los
componentes de tabla.

## Pantallas En Uso

- `MaintenanceFleetTab.vue`: Flota, filtros laterales, listado ordenable,
  columnas configurables, paginacion y planes expandibles por vehiculo. Expone
  `getExportRows` para el reporte de flota.
- `fleetOrderIndex.js`: indice de OT abiertas por vehiculo y plan/nombre.
  Evita buscar todas las OT al renderizar cada plan; pruebas en su archivo test.
- `MaintenanceWorkOrdersTab.vue`: OT y pendientes de OT, KPI, filtros, tabla
  con scroll interno y paginacion. Recibe acciones desde la vista.
- `MaintenanceCostsTab.vue`: pestana Analisis; proyeccion por uso, costos,
  pendientes sin OT, cumplimiento, vencimientos, composicion y ranking.
  Usa ejecuciones cerradas para costos/cumplimiento, no porcentajes de muestra.
- `MaintenanceActionModal.vue`: formularios y detalle del vehiculo, cargado
  bajo demanda. Crear y editar planes comparten el mismo flujo. El catalogo de
  tipos tiene busqueda, criterio, origen, orden y paginacion.

## Detalle Del Vehiculo

- Planes: plan principal y listado de otras mantenciones; filtros incluyen
  Sin renovar. Las acciones dependen del plan y de su OT asociada.
- Historial: ejecuciones finalizadas del vehiculo, fechas, responsable, lectura
  y costo real. Tiene filtros, orden por encabezado y paginacion.
- En Historial, el header reemplaza Agregar mantencion/Nuevo tipo por
  Exportar historial. Un menu Excel/PDF descarga todos los registros filtrados,
  no solo la pagina, sin abrir otro modal.
- El pie del detalle tiene Cerrar; ya no navega al listado general de OT.
  Ver OT sigue disponible por ejecucion.
- El tamano exterior del modal se conserva al alternar Planes/Historial.

## Exportacion

- `MaintenanceFleetExportModal.vue`: modal activo de seleccion de vehiculos y
  filtros de empresa, estado de plan, criterio y OT. Exporta solo los planes
  que coinciden con los filtros y los vehiculos seleccionados.
- `MaintenanceHistoryExportModal.vue`: implementacion conservada pero no
  utilizada por el flujo actual. No confundirla con el menu de descarga directa.

## Componentes Conservados

`MaintenanceCalendarTab.vue`, `MaintenanceHistoryTab.vue`,
`MaintenanceUpcomingOrdersPanel.vue` y `MaintenanceVehicleHeaderCard.vue`
siguen en la carpeta. No representan pestanas principales adicionales del
flujo actual Flota/Analisis/Ordenes. `MaintenanceOverviewTab.vue` fue reemplazado
por `MaintenanceFleetTab.vue` y ya no existe.

`maintenance.css` concentra estilos compartidos, altura y scroll de tablas.
Los iconos se obtienen de `../icons/SvgIcon.vue`.

## Validacion

Las reglas de negocio tienen pruebas en composables, utils y services;
`fleetOrderIndex.test.js` cubre el indice de OT. Build/lint no sustituyen una
revision visual de tablas, tooltips, PDF y Excel en sus aplicaciones reales.
