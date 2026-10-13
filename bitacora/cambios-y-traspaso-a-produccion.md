# Mantenciones: Cambios Y Traspaso A Produccion

Documento de entrega del **modulo de mantenciones**, actualizado el **2026-10-13**.

## 1. Alcance

Este documento incluye exclusivamente Flota, planes, tipos de mantencion,
ordenes de trabajo (OT), analisis, historial, evidencias y exportaciones del
modulo. No incluye los cambios de Empresas, Usuarios, Alertas, Geocercas,
Reportes generales ni Sin reportar.

Resume las iteraciones disponibles en la conversacion, la recuperacion documental
y el codigo vigente. No hay una fecha individual verificable para cada cambio
de mantenciones; por eso se agrupan por funcionalidad, no por fechas inventadas.
Se describe el resultado final y no cada ajuste visual descartado.

Las rutas son relativas a la raiz del repositorio. Los requisitos de produccion
son trabajo pendiente, no funcionalidades que ya existan en backend.

## 2. Resultado Final Del Modulo

La navegacion principal quedo en **Flota, Analisis y Ordenes**.

| Concepto   | Que representa                                                                    |
| ---------- | --------------------------------------------------------------------------------- |
| Tipo       | Categoria de trabajo y criterio base: odometro, horometro o tiempo.               |
| Plan       | Regla de seguimiento de una mantencion para un vehiculo.                          |
| OT         | Orden concreta para programar, ejecutar y registrar el trabajo.                   |
| Ejecucion  | Resultado del cierre de una OT: fecha, lectura, responsable, costos y evidencias. |
| Renovacion | Confirmacion del siguiente ciclo del plan despues del cierre.                     |
| Historial  | Ejecuciones finalizadas del vehiculo; no el estado actual de sus planes.          |

**Crear un plan no crea automaticamente una OT. Cerrar la OT no borra el plan
ni su historial. El siguiente ciclo se confirma mediante Renovar.**

## 3. Cambios De Flota Y Listado De Mantenciones

### Que se hizo

- Se reemplazo el componente de Resumen por una vista de Flota operativa.
- Se ordenaron filtros, listado y acciones para revisar planes del vehiculo.
- Los vehiculos permiten desplegar sus mantenciones y entrar al detalle.
- Se agregaron orden por encabezados, columnas configurables y paginacion.
- Se ajustaron alturas y scroll para mantener tabla y paginacion accesibles.
- Los avisos de resultado desaparecen despues de un intervalo.
- Se incorporo Sin renovar a los filtros de estado.
- Se alinearon las decisiones operativas de tabla y detalle para evitar que
  un mismo plan ofreciera acciones contradictorias.
- La asociacion de planes y OT abiertas se indexo para no recorrer todas
  las ordenes al renderizar cada fila.

### Archivos que intervenir

- `frontend/src/views/MaintenanceView.vue`: conecta la pantalla con el estado.
- `frontend/src/components/maintenance/MaintenanceFleetTab.vue`: listado, filtros, columnas y planes desplegables.
- `frontend/src/components/maintenance/fleetOrderIndex.js`: busqueda de OT abiertas por vehiculo y plan.
- `frontend/src/composables/maintenance/useMaintenanceFilters.js`: filtros y resultados.
- `frontend/src/utils/maintenance/maintenancePlanIndex.js`: indice de planes.
- `frontend/src/components/maintenance/maintenance.css`: alturas y estilos compartidos.

MaintenanceOverviewTab.vue fue retirado. No usarlo como referencia del flujo actual.

## 4. Tipos, Creacion Y Edicion De Planes

### Que se hizo

- El catalogo de tipos quedo en un modal con busqueda, criterio, origen,
  orden y paginacion.
- Se corrigieron sus iconos: reloj para tiempo, medidor para odometro y reloj
  de arena para horometro.
- Crear y editar planes comparten el formulario en lugar de mantener
  dos experiencias diferentes.
- Se conservaron tres criterios: **Odometro, Horometro y Tiempo**.
- Valor manual dejo de ser un criterio. Los registros anteriores se migran
  preservando identificadores, evidencias y referencias a OT.
- Cuando el plan antiguo no permite establecer un intervalo valido,
  queda pendiente de configuracion; no se inventa un intervalo.
- Se mantuvo la relacion del plan con vehiculo y empresa.

### Archivos que intervenir

- `frontend/src/components/maintenance/MaintenanceActionModal.vue`: catalogo y formulario.
- `frontend/src/composables/maintenance/useMaintenanceTypeCatalog.js`: filtros/orden/paginacion del catalogo.
- `frontend/src/composables/maintenance/useMaintenanceModule.js`: creacion, edicion y reglas del plan.
- `frontend/src/utils/maintenance/maintenanceModuleConfig.js`: tipos, criterios y configuracion.
- `frontend/src/utils/maintenance/maintenanceReadingSourceMigration.js`: migracion de Valor manual.
- `frontend/src/utils/maintenance/maintenanceFormatUtils.js` y `frontend/src/utils/maintenance/maintenanceUiUtils.js`: formatos y etiquetas.
- `frontend/src/components/icons/SvgIcon.vue`: iconos compartidos usados por el catalogo.

La palabra manual puede seguir describiendo un plan creado por usuario.
Eso no significa que exista un cuarto criterio de lectura.

## 5. Ordenes De Trabajo Y Renovacion

### Que se hizo

- Se organizaron Ordenes de trabajo y Pendientes de OT dentro de Ordenes.
- Se ajustaron indicadores, filtros, tabla, acciones, paginacion y scroll interno.
- Se mantuvieron acciones de programar, asignar, reprogramar, cancelar,
  ejecutar y cerrar una OT.
- El cierre registra trabajo, responsable, lectura, fecha, costos y evidencias.
- Para una OT vinculada, el cierre prepara el siguiente ciclo del plan y
  deja el estado **Sin renovar**.
- Renovar confirma el siguiente ciclo con opcion de editar antes.
- La OT finalizada permanece como ejecucion historica; renovar no la reutiliza
  ni la borra.
- Se simplifico la presentacion de la relacion plan/OT para evitar confundir
  una orden finalizada con la orden activa.
- El detalle del vehiculo ya no tiene Ir a ordenes; el pie solo muestra Cerrar.

### Archivos que intervenir

- `frontend/src/components/maintenance/MaintenanceWorkOrdersTab.vue`: tabla y pendientes.
- `frontend/src/components/maintenance/MaintenanceActionModal.vue`: formularios y confirmaciones.
- `frontend/src/composables/maintenance/useMaintenanceModule.js`: transiciones, cierre y renovacion.
- `frontend/src/composables/maintenance/useMaintenanceDerivedData.js`: indicadores y datos derivados.
- `frontend/src/utils/maintenance/maintenanceOrderSummary.js`: resumen de estados, fechas y costos.
- `frontend/src/utils/maintenance/maintenanceOrderCosts.js`: desglose y normalizacion.

## 6. Analisis Y Graficos

### Que se hizo

- Se reorganizo la vista para separar estado de planes, urgencia y resultados
  de ejecuciones; se agregaron filtros y ampliacion de graficos.
- Los costos mensuales y su composicion se alimentan de OT finalizadas.
- El cumplimiento compara fecha de cierre y fecha limite de las ejecuciones
  medibles dentro del periodo.
- Los activos sin casos medibles se excluyen del ranking de cumplimiento;
  no deben confundirse con activos con ejecuciones atrasadas.
- Vencimientos y proyeccion por uso se basan en los planes actuales.
- Se agregaron/corrigieron tooltips, incluidos porcentaje y monto de cada
  componente del costo.
- Se reutilizan indices y agregaciones para evitar recorridos completos
  independientes por cada grafico.

### Archivos que intervenir

- `frontend/src/components/maintenance/MaintenanceCostsTab.vue`: UI de Analisis.
- `frontend/src/utils/maintenance/maintenanceAnalysisData.js`: indice de ejecuciones y agregacion del periodo.
- `frontend/src/utils/maintenance/maintenanceOrderSummary.js`: criterios de fechas y resumen.
- `frontend/src/composables/maintenance/useMaintenanceDerivedData.js`: datos compartidos.
- `frontend/src/composables/maintenance/useMaintenanceModule.js`: fuente de planes y OT.

**Ejemplo:** 1 ejecucion dentro de fecha de 1 medible significa 100%.
0 dentro de fecha de 3 medibles significa 0%. No tener ejecuciones medibles
no significa 0% de cumplimiento operativo.

## 7. Detalle E Historial Del Vehiculo

### Que se hizo

- El detalle separa Planes e Historial sin cambiar el tamano exterior del modal.
- Historial muestra ejecuciones finalizadas del vehiculo.
- Incluye fecha, mantencion, OT, lectura de cierre, responsable y costo real.
- Tiene filtros de mantencion/fechas, orden por encabezado y paginacion.
- Ver OT abre la orden concreta; no exige ir al listado general.
- En Historial, el header sustituye Agregar mantencion/Nuevo tipo por
  Exportar historial.
- La exportacion se hace desde un menu Excel/PDF, sin abrir otro modal
  con filtros duplicados.
- La descarga incluye **todas las ejecuciones filtradas**, no solo la pagina visible.

### Archivos que intervenir

- `frontend/src/components/maintenance/MaintenanceActionModal.vue`: detalle, tabs y descarga.
- `frontend/src/composables/maintenance/useMaintenanceVehicleHistory.js`: filtros, orden y paginacion.
- `frontend/src/services/maintenance/maintenanceHistoryExportService.js`: generacion de archivos.

MaintenanceHistoryExportModal.vue y useHistoryExportSelection.js permanecen
en el codigo, pero no participan en la descarga directa vigente.
Los componentes conservados de calendario/historial tampoco representan
pestanas principales nuevas. Revisar referencias antes de eliminarlos o conectarlos.

## 8. Exportaciones PDF Y Excel

### Flota: cambios realizados

- Exportar abre un modal para elegir vehiculos y aplicar filtros de planes.
- Empresa, estado, criterio y OT recortan lo exportado.
- Los filtros deben coincidir en el mismo plan; elegir Proximas no incluye
  automaticamente todas las mantenciones del vehiculo.
- Excel tiene Reporte agrupado por vehiculo, Resumen, Vehiculos y Planes.
- Se ajustaron logo, titulo, fecha de generacion, margenes, escala, ancho
  de columnas y separacion entre vehiculos.
- PDF horizontal con bloques de vehiculos, cabeceras repetidas y paginacion.

### Historial: cambios realizados

- Excel/PDF con ejecuciones filtradas, lecturas, criterio, responsable,
  taller, costos y fecha limite.
- Encabezado alineado al estilo del reporte de flota.
- Fechas de cierre legibles en America/Santiago, no cadenas ISO tecnicas.
- Costos numericos en Excel y espacio interior para separarlos de las fechas.
- Cabeceras del PDF con texto blanco sobre azul y repeticion en cada pagina.

### Archivos que intervenir

- `frontend/src/components/maintenance/MaintenanceFleetExportModal.vue`: seleccion visual.
- `frontend/src/composables/maintenance/useFleetExportSelection.js`: interseccion seleccion/filtros.
- `frontend/src/services/maintenance/maintenanceFleetExportService.js`: libro Excel.
- `frontend/src/services/maintenance/maintenanceFleetReportSheet.js`: hoja agrupada y estilo.
- `frontend/src/services/maintenance/maintenanceFleetPdfExportService.js`: PDF de flota.
- `frontend/src/services/maintenance/maintenanceHistoryExportService.js`: historial.
- `frontend/src/services/maintenance/workOrderExportService.js`: PDF de una OT.

El ancho de Excel se aproxima al generar el archivo; no se adapta
automaticamente cuando se cambia de monitor o zoom.
Las bibliotecas pesadas se importan al solicitar la descarga.

El flujo generico de exportacion de Analisis no debe considerarse aprobado
solo porque existe un boton: revisar su contrato y descarga por separado.
Este documento acredita los flujos de flota, historial y OT descritos, no
una validacion integral de todos los botones de exportacion.

## 9. Persistencia, Evidencias Y Rendimiento

### Que se hizo

- Se incorporo persistencia local de estado de mantenciones, antes temporal.
- El estado se guarda por secciones versionadas y manifiesto; una escritura
  fallida no activa un conjunto parcial.
- Los cambios se agrupan durante 350 ms y se vacian al salir/ocultar la pagina.
- Los adjuntos se guardan en IndexedDB; el estado conserva metadatos/storageId.
- Se migra base64 anterior y se limpian temporales sin borrar archivos
  aun referenciados.
- Se separaron helpers y composables, se indexaron planes/OT y se redujeron
  calculos repetidos.
- Modal operativo y bibliotecas PDF/Excel se cargan bajo demanda.

### Archivos que intervenir

- `frontend/src/services/maintenance/maintenanceStateStorage.js`: almacenamiento versionado.
- `frontend/src/services/maintenance/maintenanceStatePersistence.js`: agrupacion de escrituras.
- `frontend/src/services/maintenance/maintenanceEvidenceStorage.js`: archivos y migracion.
- `frontend/src/services/maintenance/maintenanceEvidenceSession.js`: carga y limpieza.
- `frontend/src/composables/maintenance/useMaintenanceModule.js`: coordina cambios persistidos.
- `frontend/src/components/maintenance/fleetOrderIndex.js` y `frontend/src/utils/maintenance/maintenancePlanIndex.js`: indices.

El almacenamiento usa como base maintenance-module-state-v1.
Los archivos/localStorage son locales al navegador: no hay sincronizacion
multiusuario, respaldo central ni API productiva de mantenciones.

## 10. Datos De Demostracion Que Hay Que Retirar

Archivo: `frontend/src/fixtures/maintenanceDemoData.js`.

- Las banderas de demo de mantenciones e historial siguen activas.
- El modulo completa aproximadamente 10 vehiculos cuando la fuente tiene menos;
  no elimina activos originales adicionales.
- El historial demo agrega ejecuciones sinteticas a los primeros dos vehiculos.
- El limite de OT base demo es 6.

**Para produccion:** desactivar fixtures, sustituir planes/lecturas sinteticos
por datos reales y revisar semillas/fallbacks de useMaintenanceModule.
No importar OT-DEMO ni snapshots de navegadores automaticamente.
Desactivar las banderas no borra por si solo datos persistidos.

## 11. Modelo Minimo Para Produccion

Propuesta a acordar con backend; no es un esquema ya implementado.

| Entidad    | Datos esenciales                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------- |
| Tipo       | ID estable, nombre, criterio, origen y empresa cuando corresponda.                                  |
| Plan       | ID, vehiculo/empresa, tipo, unidad, intervalo, alerta, lectura base, estado y version/ciclo.        |
| OT         | ID, empresa/vehiculo, plan si corresponde, trabajo, estado, prioridad, responsable/taller y fechas. |
| Ejecucion  | OT, fecha real de cierre, lectura final, responsable y trabajo realizado.                           |
| Renovacion | Ciclo anterior, propuesta, confirmacion y nueva base/vencimiento.                                   |
| Costos     | OT, montos numericos y desglose de mano de obra/repuestos/otros.                                    |
| Evidencias | OT, referencia de archivo, tipo, tamano, propietario y permisos.                                    |
| Auditoria  | Actor, empresa, entidad/accion, resultado e instante.                                               |

Reutilizar los IDs de empresa/activo del sistema real. No usar indice de fila,
patente o nombre de mantencion como clave principal de relaciones.

## 12. Que Falta Y Donde Hacerlo

| Pendiente                           | Punto principal del frontend                                 | Requisito de servidor                                                               |
| ----------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Consultar planes, tipos y OT reales | useMaintenanceModule.js y sus fuentes                        | API con alcance por empresa/activo y consultas paginadas.                           |
| Crear/editar planes y tipos         | useMaintenanceModule.js; MaintenanceActionModal.vue          | Validacion y persistencia; respuesta confirmada antes de actualizar UI.             |
| Ejecutar/cerrar OT                  | useMaintenanceModule.js                                      | Transiciones autorizadas y cierre atomico, seguro ante reintentos.                  |
| Renovar plan                        | useMaintenanceModule.js                                      | Una confirmacion por ciclo, control de version y concurrencia.                      |
| Lecturas actuales                   | fuente de vehiculos del modulo                               | Integracion con inventario/telemetria, unidad, calidad y fecha de lectura.          |
| Costos/evidencias                   | services/maintenance y formularios                           | Costos persistidos; archivos con acceso autorizado, limites y limpieza.             |
| Historial/analisis                  | useMaintenanceVehicleHistory.js y maintenanceAnalysisData.js | Fechas completas y fuente consistente de ejecuciones/costos.                        |
| Exportaciones                       | exportadores de services/maintenance                         | Snapshot autorizado; filtros/totales consistentes; generacion pesada si hace falta. |
| Recuperacion y trazabilidad         | persistencia local a sustituir                               | Respaldo restaurable y auditoria de operaciones confirmadas.                        |

Los nuevos servicios HTTP de mantenciones **todavia deben crearse**.
No asumir que cambiar maintenanceStateStorage por una URL convierte en API
todas las mutaciones del orquestador.

## 13. Orden De Traspaso

### Primero: contratos y permisos

Acordar modelo, IDs, estados, criterios, unidades y zona horaria.
Cada consulta/archivo/mutacion debe validar en servidor empresa, usuario y activo.
Ocultar una accion en Vue no impide una llamada no autorizada.

### Segundo: datos y operaciones

Crear servicios API del modulo y conectarlos al orquestador manteniendo la UI.
Persistir plan, OT, cierre y renovacion con operaciones atomicas.
Usar control de version o equivalente para impedir sobrescrituras y doble renovacion.
Un reintento de cierre no debe crear dos ejecuciones.

### Tercero: lecturas, costos y archivos

Conectar lecturas reales; validar que criterio y unidad coincidan.
Persistir desglose de costos. Subir evidencias a almacenamiento central autorizado
con validacion y limites, conservando metadatos y limpieza segura.
No depender de IndexedDB para compartir documentos entre usuarios.

### Cuarto: historicos, calculos y exportaciones

Alimentar historial/analisis desde la misma fuente confirmada.
Separar cierre, fecha limite, ultima lectura y proximo vencimiento.
Conservar filtros en descargas; consultar todas las paginas necesarias.
Evaluar generacion de archivos del lado servidor solo si el volumen lo exige.

### Quinto: limpieza y salida

Retirar fixtures/fallbacks operativos y revisar componentes antiguos sin uso.
Definir migracion explicita si existen datos reales que conservar.
Probar en ambiente de integracion, preparar respaldos/rollback y aprobar
el ciclo completo con usuarios operativos antes de publicar.

## 14. Pruebas De Aceptacion Del Modulo

- Crear tipo/plan y editar sin duplicar ni generar OT automaticamente.
- Comparar acciones del mismo plan en tabla y detalle.
- Programar OT, poner en espera, ejecutar, cancelar y cerrar con validaciones.
- Cerrar deja historial y Sin renovar; renovar crea un unico siguiente ciclo.
- Editar antes de renovar conserva lectura/ciclo y propuesta coherentes.
- Reintentar o cerrar/renovar desde dos sesiones no duplica ni pierde cambios.
- Usuario restringido no consulta ni descarga activos/archivos de otra empresa.
- Subir archivo, cancelar y fallar no borra evidencias usadas ni deja temporales sin control.
- Verificar cumplimiento con casos a tiempo, atrasados y sin fechas medibles.
- Filtrar Proximas y comprobar solo planes proximos en Excel/PDF.
- Exportar historial incluye todas las filas filtradas, no solo la pagina.
- Comparar costos/totales/fechas entre pantalla y archivos; abrir Excel y PDF
  reales para revisar logos, margenes, cabeceras y saltos de pagina.
- Comprobar tablas/modal/tooltip en escritorio y movil, errores de API y recuperacion.

Pruebas automatizadas relevantes estan junto a sus implementaciones:
fleetOrderIndex, useMaintenanceTypeCatalog, useMaintenanceVehicleHistory,
useFleetExportSelection, maintenancePlanIndex, maintenanceAnalysisData,
maintenanceOrderSummary, maintenanceOrderCosts, maintenanceReadingSourceMigration
y los servicios de almacenamiento/evidencias/exportacion.

## 15. Validacion Conocida Y Limites

El 2026-10-13, la suite **general** del frontend paso 252 pruebas y el build
termino correctamente. Esa cifra no es el numero de pruebas exclusivas de mantenciones
ni certifica el modulo en produccion.

Antes de integrar, ejecutar npm run validate desde frontend y los recorridos
anteriores contra API real. No hay constancia aqui de validacion visual completa,
carga productiva, concurrencia real ni autorizacion backend.
La exportacion generica de Analisis requiere revisar su alcance real antes de aprobarla.

Este documento reemplaza la version anterior de alcance general. Solo documenta
mantenciones y sus dependencias directas; no modifica codigo funcional.
