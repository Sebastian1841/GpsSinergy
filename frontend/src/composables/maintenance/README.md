# Maintenance Composables

Estado y coordinacion del prototipo de mantenciones.

## Archivos

- `useMaintenanceModule.js`: orquesta el modulo completo desde Vue. Recibe `assets`, `companies` y `route`, arma vehiculos visibles por empresa, filtros, resumen, ordenes de trabajo, calendario, historial, costos, modales y acciones locales. No persiste en backend ni en `localStorage`; todo lo que se crea queda en refs temporales del prototipo.
- `useMaintenanceCompanyScope.js`: resuelve empresa actual, activos visibles por empresa y nombre de empresa para las filas.
- `useMaintenanceDerivedData.js`: agrupa datos derivados del modulo que no mutan estado principal: KPI de ordenes, KPI activo segun pestana, proximas ordenes, calendario visual, historial demo y costos/facturas visibles.
- `useMaintenanceFilters.js`: concentra busqueda, filtros, listas visibles y KPI del resumen y de ordenes de trabajo. Los buscadores de mantenciones y OT filtran con debounce para no recalcular tablas, KPI derivados y listas visibles en cada tecla.
- `useMaintenanceRouteTarget.js`: interpreta `route.query` para abrir mantenciones de un vehiculo desde el menu de activos.

## Criterio de uso

`useMaintenanceModule.js` sigue siendo el orquestador, pero no debe recuperar logica ya separada. Si vuelve a crecer, el siguiente corte natural es separar por dominio: `useMaintenanceVehicles`, `useMaintenanceWorkOrders`, `useMaintenancePlans` y `useMaintenanceModals`.
