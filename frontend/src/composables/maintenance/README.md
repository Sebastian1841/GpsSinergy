# Maintenance Composables

Estado y coordinacion del prototipo de mantenciones.

## Archivos

- `useMaintenanceModule.js`: orquesta el modulo completo desde Vue. Recibe `assets`, `companies` y `route`, arma vehiculos visibles por empresa, filtros, resumen, ordenes de trabajo, calendario, historial, costos, modales y acciones locales. Persiste metadatos en `localStorage` y documentos en IndexedDB; no persiste en backend.
- `useMaintenanceCompanyScope.js`: resuelve empresa actual, activos visibles por empresa y nombre de empresa para las filas.
- `useMaintenanceDerivedData.js`: agrupa datos derivados sin mutar estado principal: resumen de OT, proximas ordenes, calendario, historial y costos visibles. Reutiliza helpers de resumen para evitar recorridos separados por cada KPI.
- `useMaintenanceFilters.js`: concentra busqueda, filtros, listas visibles y KPI del resumen y de ordenes de trabajo. Los buscadores de mantenciones y OT filtran con debounce para no recalcular tablas, KPI derivados y listas visibles en cada tecla.
- `useMaintenanceRouteTarget.js`: interpreta `route.query` para abrir mantenciones de un vehiculo desde el menu de activos.
- `useMaintenanceTypeCatalog.js`: busqueda, filtros, orden y paginacion del catalogo de tipos.
- `useMaintenanceVehicleHistory.js`: ejecuciones finalizadas del vehiculo, filtros por mantencion y fechas, orden y paginacion. Separa lista filtrada completa de pagina visible.
- `useFleetExportSelection.js`: seleccion de vehiculos y filtros sobre sus planes. Los filtros de estado/criterio/OT deben coincidir en el mismo plan; solo se exporta la interseccion de filas filtradas y seleccionadas.
- `useHistoryExportSelection.js`: seleccion para el modal de exportacion historica conservado. No se usa en la descarga directa vigente desde el detalle del vehiculo.

## Ciclo Del Plan

Crear un plan no crea una OT automaticamente. La OT registra ejecucion, lectura,
costos y cierre; cerrar una OT vinculada deja una propuesta de proximo ciclo en
estado pending-renewal (Sin renovar). Renovar confirma el siguiente ciclo, con
opcion de editar antes. La OT finalizada permanece en el historial. Planes base
y creados por usuario deben mantener la misma decision operativa en tabla y detalle.

Los criterios actuales son Odometro, Horometro y Fecha/Hora. Los registros
antiguos de Valor manual pasan por maintenanceReadingSourceMigration.js.
Los datos sinteticos y sus banderas viven en ../../fixtures/maintenanceDemoData.js.

Las pruebas de catalogo, historial y seleccion estan junto a sus composables.

## Persistencia Local

`maintenanceStatePersistence.js` agrupa escrituras durante 350 ms y vacia los cambios pendientes al salir del modulo o esconder la pagina. Los adjuntos nuevos se guardan como archivos en `maintenance-documents/evidence` antes de incorporarlos a la OT; el estado solo contiene `storageId`, nombre, tipo y tamano.

El estado se guarda por secciones en `localStorage`. Cada accion reemplaza la coleccion modificada; el observador no recorre objetos anidados y solo se serializan las secciones con una nueva referencia. Al agregar acciones, no mutar registros persistidos directamente: reemplazar la coleccion correspondiente. `maintenanceStateStorage.js` escribe nuevas versiones de las secciones y activa todas mediante un manifiesto; si falla una escritura, conserva la version anterior. El formato antiguo se migra al primer guardado correcto.

Los documentos antiguos en base64 se migran al cargar el modulo. El estado anterior solo se reemplaza despues de confirmar el guardado de los archivos. Si la migracion falla, se conserva la copia anterior y se muestra un aviso. La migracion pendiente puede no terminar si se cierra el navegador inmediatamente; se reintentara al volver a abrir el modulo. Los datos siguen siendo locales al navegador, no una copia de respaldo.

## Criterio de Uso

`useMaintenanceModule.js` sigue siendo el orquestador, pero no debe recuperar logica ya separada. Si vuelve a crecer, el siguiente corte natural es separar por dominio: `useMaintenanceVehicles`, `useMaintenanceWorkOrders`, `useMaintenancePlans` y `useMaintenanceModals`.
