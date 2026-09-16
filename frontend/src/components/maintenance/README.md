# Maintenance Components

Componentes visuales del modulo de mantenciones. La regla es mantener aqui render, props y eventos; la logica de negocio se coordina desde `frontend/src/composables/maintenance/useMaintenanceModule.js`.

## Archivos

- `MaintenanceOverviewTab.vue`: renderiza la pestana `Resumen`: KPI por estado, filtros compactos, tabla de vehiculos y acciones para abrir mantenciones o costos del activo. No calcula estados; recibe listas, funciones de clases y handlers desde la vista.
- `MaintenanceWorkOrdersTab.vue`: renderiza la pestana `Ordenes de trabajo`: cabecera, KPI de OT, filtros especificos, tabla de ordenes y panel lateral de detalle. Emite acciones para crear, editar, reprogramar, asignar, cancelar o cerrar OT, pero no modifica el estado directamente.
- `MaintenanceCalendarTab.vue`: renderiza `Calendario OT`: grilla mensual, eventos por dia y panel lateral de proximas ordenes. Recibe dias ya calculados y no decide agenda.
- `MaintenanceHistoryTab.vue`: renderiza `Historial`: ficha del vehiculo, trazabilidad del ciclo y tabla historica de servicios. Emite navegacion a OT, costos o exportacion.
- `MaintenanceCostsTab.vue`: renderiza `Costos y facturas`: formulario visual de costo, KPI financieros y tabla de facturas. Emite la apertura del modal de costo o exportacion.
- `MaintenanceActionModal.vue`: modal unico para crear/editar mantenciones, crear
  tipos, ver planes del vehiculo, crear/editar/reprogramar/asignar/cancelar/cerrar
  OT, registrar costos y exportar. Mantiene solo render y eventos; la mutacion
  real sigue en la vista. Se carga async desde `MaintenanceView.vue` y se descarga
  bajo demanda al abrir una accion para no cargar varios formularios al entrar al
  modulo.
- `MaintenanceUpcomingOrdersPanel.vue`: panel compacto de proximas ordenes usado por el calendario. Solo lista eventos ya preparados por la vista.
- `MaintenanceVehicleHeaderCard.vue`: ficha reutilizable del vehiculo seleccionado para `Historial` y `Costos y facturas`. Expone accesos a ordenes y costos mediante eventos.
- `maintenance.css`: estilos compartidos del modulo. Se mantiene separado para evitar duplicar los mismos selectores en cada tab extraida y para conservar una sola fuente visual.

## Criterio de uso

Si una seccion visual de `MaintenanceView.vue` crece o se repite, debe moverse a esta carpeta. Si una funcion calcula reglas de mantencion, estados, fechas, costos u ordenes, debe pasar primero a un composable o util antes de mezclarla con componentes.
