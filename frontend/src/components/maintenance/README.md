# Maintenance Components

UI del modulo de mantenciones. `MaintenanceView.vue` conecta estas piezas con
`useMaintenanceModule.js`; los datos y cambios operativos no se guardan en los
componentes de tabla.

## Pantallas En Uso

- `MaintenanceFleetTab.vue`: Flota, filtros laterales, listado ordenable,
  columnas configurables, paginacion y planes expandibles por vehiculo. Expone
  `getExportRows` para el reporte de flota.
  Paginacion real 10/20/50 (20 iniciales), aplicada despues de filtros/orden.
  Solo se dibuja la pagina visible; exportacion mantiene todos los resultados.
  Cambiar filtros/orden/tamano vuelve a pagina1 y conserva indices de fila globales.
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
# Conductores Y Licencias

MaintenanceDriversTab agrega registro por persona en la empresa actual, busqueda
nombre/RUT, clases, estados de vencimiento (30 dias inclusivos), orden por fecha y
paginacion. Ver licencia ofrece edicion, fotos e historial de renovaciones.
Las fotos JPG/PNG/WebP (maximo 5 MB por lado) usan el servicio IndexedDB existente;
se liberan URLs temporales y se limpian subidas si falla el guardado.
Ver requiere maintenance-view; editar usa maintenance-plans/edit. Sin bloqueo de
vehiculos. No hay datos personales demo agregados al almacenamiento del usuario.

# Gestiones Y Confirmacion De Renovacion

La ficha separa Gestiones y Licencias anteriores. Registrar gestion permite sin
contacto, avisado, hora para renovar (fecha obligatoria desde hoy) y tramite.
No modifica vigencia. Ultima gestion muestra solo la licencia actual; anteriores
siguen visibles en historial. Renovar compara fechas y clases en paso de confirmacion
antes de subir archivos o guardar. Se muestra Vencio hace/Vence en segun fecha.

# Diseno Y Fluidez De Conductores

Banda de vencimientos, filtros alineados y tabla de seis columnas con identidad
agrupada, clases y tiempo al vencimiento. En movil las filas se apilan con etiquetas,
sin scroll horizontal. Paginacion de 10/20/50. Busqueda con debounce de 120ms e indice
calculado solo al cambiar registros o dia. No se recalculan gestiones por pulsacion.
La vista se conserva con KeepAlive limitado a una empresa; al desactivarse cierra
modales y detiene temporizador. Una subida cancelada no guarda datos al volver.

# Presentacion De Conductores

Guardado incremental en IndexedDB: alta, edicion, renovacion y datos demo esperan
confirmacion de transaccion. Solo entonces se cierra el formulario y se consideran
confirmadas las fotos; un fallo conserva formulario/datos y limpia adjuntos nuevos.

Adjuntar frente/reverso muestra vistas previas independientes junto a cada campo,
sin reemplazar la del otro lado. URLs temporales se liberan al cambiar archivos,
cerrar formulario o desmontar; cancelar selector conserva la seleccion anterior.

Renovar solo aparece para licencias por vencer (hasta 30 dias) o vencidas. La
validacion compartida del guardado tambien rechaza renovar licencias vigentes.

Tabla con columna Acciones de 170px, boton alineado a la derecha y espacio restante
distribuido entre datos, sin reservar un porcentaje amplio para una sola accion.

Exportar abre opciones Excel/PDF. Ambos usan todos los resultados filtrados y
ordenados con licencias anteriores; carga de librerias solo al elegir formato.

Conductores se importa junto con MaintenanceView, sin placeholder Cargando al
abrir la pestana. KeepAlive conserva la vista y la activacion inicial no se duplica
entre mounted y activated; al volver solo se reactiva si habia sido desactivada.

Las filas no se estiran para rellenar el viewport: encabezado de 44px y altura
base de fila de 58px. El filtro de clases se limita a 260px en escritorio.
Franja compacta con 8px de margen interior vertical; el selector se identifica
como Clase de licencia: Todas/A1/etc., sin etiqueta exterior que rompa la fila.

Historial de renovaciones en filas abiertas con clases, vencimiento, fecha y autor;
acciones de frente/reverso directas. Si falta foto el boton queda deshabilitado con
titulo Sin imagen. En pantallas pequenas los datos y acciones se reorganizan.
La ficha conserva 1120x800px maximos al alternar pestanas, limitada al viewport
menos 32px. Solo el contenido central tiene scroll; encabezado y pie no cambian.

Ficha visual de 1120px maximo con pestanas subrayadas en naranja, dos paneles
de identidad/licencia y miniaturas reales independientes para frente y reverso.
Al pulsar se abre visor ampliado con imagen completa, cambio de lado y cierre
independiente; Escape cierra primero la imagen. Faltantes indican Sin imagen.
Las URLs temporales de miniaturas se liberan al cambiar conductor o cerrar ficha.

Vista cliente limitada a conductor, licencia actual, fotos e historial de licencias.
La ficha abre en Licencia actual; Licencias anteriores es una pestana independiente.
No hay Contactos ni columna Ultima gestion. Los registros de contacto previos se
conservan en almacenamiento sin mostrarlos ni permitir nuevos desde esta vista.
Al cambiar pestana se limpia la foto abierta.

Alta con modal de 1120px maximo: informacion personal y licencia en dos columnas,
documentos debajo y clases como checkboxes visuales. En movil se apila en una
columna y mantiene scroll interno y acciones visibles. Las validaciones no cambian.
Cancelar el selector de archivos no cierra el dialog ni reinicia campos; su evento
se detiene y el manejador de cancel del dialog solo acepta eventos propios.

Estados y acciones comparten una fila flex alineada al centro, con salto en movil.
La tabla inicia en Automatico y calcula las filas segun alto disponible/alto real
de filas con ResizeObserver. En movil usa cinco. El selector permite 5/10/20/50
y vuelve a la primera pagina al cambiar. En movil se conserva el desplazamiento
natural sin recortar datos.
En escritorio la tabla se extiende al alto disponible y el pie deja 12px inferiores.
El cuerpo tiene scroll propio con encabezados sticky de 44px; filtros y paginacion
permanecen fuera del area desplazable.

Sin titulo ni subtitulo duplicados; la ubicacion se identifica en el encabezado global.
Botones con bordes, peso tipografico y color primario del resto de los modulos.
Las pestanas inactivas son transparentes.
Filtros de 38px y columnas proporcionadas mantienen la densidad de la referencia.

Pestanas compactas con contadores, franja de filtros, encabezados ordenables y
paginacion numerada. Tabla solo con Ver licencia. Ficha con resumen unico de
estado/clases/vencimiento/dias, datos y acciones Renovar/Editar sin duplicarlas en
pie ni tabla. Editar no expone vencimiento/clases. El store tambien rechaza
cambios de vencimiento sin renovacion. Renovar usa formulario
independiente de vencimiento/clases/fotos nuevas, sin repetir datos personales ni
checkbox; exige confirmar y conserva la licencia anterior con sus fotos.
No hay filtro de empresa en la vista del cliente;
la empresa de la ruta y sus permisos delimitan todos los registros.

# Cache De Pestanas

Flota, Ordenes, Analisis, pendientes sin OT, calendario e historial se conservan
al visitarse en KeepAlive (maximo seis instancias, reiniciado al cambiar empresa).
Analisis y pendientes tienen claves distintas para no compartir estado local.
No se montan pestanas por anticipado. Los imports principales siguen directos
para no reintroducir el indicador Cargando al navegar. Esto evita remontajes,
pero no reduce por si solo el bundle inicial. Al desactivar se retiran listeners
globales y se cierran menus o graficos expandidos. Conductores mantiene su cache
independiente de una empresa y su ciclo de persistencia existente.

