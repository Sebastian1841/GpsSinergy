# Maintenance Composables

La eliminacion confirmada de un plan retira sus OT vinculadas (por plan,
vehiculo y empresa) mediante deletedAt y archiva costos relacionados. Limpia
estado de renovacion sin tocar otros planes. activeCostRows excluye archivos
de vistas operativas; las secciones persistidas conservan los registros.

Estado y coordinacion del prototipo de mantenciones.

## Archivos

- `legacyOrderReviewRows`: referencias tecnicas antiguas pendientes de verificar,
  derivadas del estado conservado. Se muestran solo en Ordenes, independientes
  de mensajes de exito. No se modifican ni se reasignan registros al consultarlos.

- `useFleetOrderNavigation.js`: abre la OT vinculada desde Flota y conserva el
  origen para volver al plan, restaurando scroll sin limpiar filtros ni pagina.
  No abre otra OT si la solicitada no esta en la empresa actual. El origen se
  descarta al cambiar de empresa. Pruebas en su archivo `.test.js`.

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

Editar planificacion reutiliza reprogram-order como ID interno. Guarda fechas,
hora, responsable/taller/prioridad en una operacion, sin forzar scheduled ni
tocar startedAt o waitingReason. Valida OT abierta, fecha limite, inicio no
posterior al limite y asignacion. Auditoria Planificacion actualizada; vuelve al
detalle al guardar/cancelar. Prueba `maintenanceOrderPlanningFlow.test.js`.

Audit Programada de nuevas OT registra el instante de la accion; la fecha
planificada queda en detail. No se altera el historial almacenado previamente.

openVehicleMaintenancePlans acepta planId opcional: valida pertenencia al vehiculo
y precarga el detalle exacto. Sin planId conserva acceso general. El modal usa
ese ID al abrir; un ID ajeno no abre otro plan por fallback.

Operaciones abiertas desde detalle pasan returnTo order-detail. Guardar o
cancelar vuelve a cargar el detalle de la OT seleccionada, con datos actuales.
Desde la tabla se mantiene cierre normal del modal. Regresion en
`workOrderDetailActions.test.js`.

La confirmacion de inicio/reanudacion no edita asignacion. Al confirmar se
conservan responsable/taller/prioridad del borrador; feedback distingue iniciar,
reanudar y esperar. La auditoria identifica Trabajo reanudado al retomar espera.

Transiciones operativas: openWorkOrderActionModal precarga estado y transitionLabel
para iniciar, esperar o reanudar. Es solo borrador hasta submit; espera requiere
motivo. La etiqueta no modifica reglas de cierre, renovacion ni catalogos.
Prueba de cancelar/someter transiciones en `workOrderNextAction.test.js`.

Alta global inicia sin vehiculo; solo el origen maintenance-detail precarga el
vehiculo contextual. Sincronizacion de tipo/vehiculo, duplicados y guardado del
plan resuelven IDs exactos sin fallback al primero o ultimo seleccionado.
Regresion: `maintenancePlanVehicleSelection.test.js`.

`maintenanceFeedbackAction` contiene el siguiente destino concreto del resultado
(OT creada, renovacion pendiente o planes del vehiculo). Se limpia al reemplazar
el mensaje; la vista lo descarta tambien al cambiar de empresa. La renovacion
sigue requiriendo confirmacion. Regresion: `maintenanceWorkflowResults.test.js`.

Al abrir Crear OT con un plan que ya tiene OT abierta se muestra el detalle de
esa orden; se mantiene tambien la validacion de duplicados al guardar.

Los planes manuales recalculan lectura, faltante y estado desde el vehiculo al
consultar, tanto en tabla como en detalle. El criterio calendario usa un reloj
reactivo de un minuto, liberado al destruir el scope. Cero es una lectura valida.

Las OT derivadas usan `OT-BASE:<empresa>:<vehiculo>` con IDs codificados, no indices de listas.
Las que tienen modificaciones/costos no desaparecen al crear un plan manual.
`maintenanceOrderIdentity.js` migra IDs antiguos solo con referencia guardada
verificable al vehiculo. Los datos ambiguos se conservan sin asociarlos por
posicion y se avisa al usuario. Pruebas cubren reordenamiento, creacion de
planes y lecturas cambiantes.

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

Guardado entre ventanas (2026-11-04): stateStorage combina cambios independientes
por registro y rechaza conflictos del mismo registro antes de escribir. El aviso
distingue conflicto de fallo de almacenamiento y pide conservar los pendientes
antes de recargar. Los datos externos no se incorporan automaticamente a los refs
de la vista; no tratar una lectura auxiliar de limpieza como una recarga del editor.

`maintenanceStatePersistence.js` agrupa escrituras durante 350 ms y vacia los cambios pendientes al salir del modulo o esconder la pagina. Los adjuntos nuevos se guardan como archivos en `maintenance-documents/evidence` antes de incorporarlos a la OT; el estado solo contiene `storageId`, nombre, tipo y tamano.

El estado se guarda por secciones en `localStorage`. Cada accion reemplaza la coleccion modificada; el observador no recorre objetos anidados y solo se serializan las secciones con una nueva referencia. Al agregar acciones, no mutar registros persistidos directamente: reemplazar la coleccion correspondiente. `maintenanceStateStorage.js` escribe nuevas versiones de las secciones y activa todas mediante un manifiesto; si falla una escritura, conserva la version anterior. El formato antiguo se migra al primer guardado correcto.

Los documentos antiguos en base64 se migran al cargar el modulo. El estado anterior solo se reemplaza despues de confirmar el guardado de los archivos. Si la migracion falla, se conserva la copia anterior y se muestra un aviso. La migracion pendiente puede no terminar si se cierra el navegador inmediatamente; se reintentara al volver a abrir el modulo. Los datos siguen siendo locales al navegador, no una copia de respaldo.

## Criterio de Uso

`useMaintenanceModule.js` sigue siendo el orquestador, pero no debe recuperar logica ya separada. Si vuelve a crecer, el siguiente corte natural es separar por dominio: `useMaintenanceVehicles`, `useMaintenanceWorkOrders`, `useMaintenancePlans` y `useMaintenanceModals`.
# Referencia Historica De Inicio

Nueva OT usa workOrderCreationContext separado del borrador persistible para
fijar vehiculo/plan al iniciar desde fila. Guardado revalida los tres pasos y
rechaza cambios de ese contexto; nueva apertura global lo limpia. Se conservan
guardas de alcance, plan existente y OT abierta duplicada.

Planes vienen solo de registros guardados. Eliminada generacion de planes base
por indice/conteo, y de OT sinteticas para activos sin cambios persistidos.
Sin historial de OT generado por demostracion. Se conservan OT/planes
guardados; nuevas altas requieren nombre/tipo, criterio, aviso y objetivo valido.

Modal maintenance-detail retirado. openVehicleMaintenancePlans selecciona el
vehiculo y solicita expansion en Flota; con planId abre edicion directa validando
pertenencia. Regresos heredados cierran modal y vuelven a Flota, sin reabrir detalle.

Planes base sin intervalo/referencia reales no usan fechas de ejemplo ni
estados por indice. getVehicleMaintenancePlans los evalua como Sin configurar;
editar no inventa objetivo ni servicio anterior. Planes manuales conservados.

getMaintenanceReadingAtDate resuelve activo dentro de scopedAssets y consulta
getReportsForAsset por identidad tipada/empresa. Hoy usa la lectura actual;
pasado usa ultima lectura explicita del dia chileno. Guarda fecha/hora de
referencia sin mover objetivo absoluto. No existe endpoint historico conectado.

