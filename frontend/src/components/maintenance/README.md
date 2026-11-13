# Maintenance Components

Avisos pendientes: lista consultable desde cabecera. Mostrar/cerrar toast solo
registra shown; reviewed requiere Marcar revisado o Marcar todos revisados.
Se recuperan avisos del tracker anterior como mostrados, no revisados.
Notificaciones por licencia en alta/edicion/renovacion: Email y WhatsApp con
destinatarios validados. Configuracion local preparada para futura integracion
n8n; no hay webhook, envios ni cambios de backend. Estado Integracion pendiente.
Renovacion valida fecha no anterior a la ultima registrada (min en formulario
y validacion en store). Horas pasadas muestran Confirmar resultado y filtro
propio, conservando cita original; no se presume asistencia ni renovacion.

Licencias incluye Gestion independiente de vigencia: Sin gestionar,
Sin respuesta, Avisado, Hora agendada y En tramite. Registrar desde la celda
abre formulario con observacion, fecha agendada cuando aplica e historial
de la licencia actual. Consulta disponible en lectura; guardar requiere editar.
Avisar con (dias) configurable en alta/edicion/renovacion, por defecto 30.
Avisos internos al cargar o cambiar dia/datos, deduplicados por empresa,
usuario, licencia, vencimiento y etapa (plazo configurado, 15/7 dias, hoy,
vencida). Son avisos dentro de Conductores, no correos ni tareas en servidor.
Gestion se reinicia con cada nueva licencia; conserva gestiones anteriores.

Renovacion con frente y reverso nuevos guarda directamente, sin revision
intermedia. Solo fotos faltantes activan confirmacion con Volver o Guardar
con fotos pendientes. Validaciones preceden subida de archivos y persistencia.

Renovaciones anticipadas permitidas para licencias vigentes, proximas o
vencidas: nuevo vencimiento posterior al anterior y no vencido. Fotos nuevas
se pueden cambiar/quitar antes de guardar; confirmacion enumera fotos faltantes.
Historial usa snapshot de la licencia renovada y deja la anterior separada.
Registros previos se resuelven por vencimiento exacto, sin reutilizar fotos
anteriores como nuevas. Almacenamiento sigue local: este repo no incluye API.

Registrar renovacion permite subir frente/reverso nuevos con vista previa,
separados del comprobante. Actualizan fotos de licencia actual y archivan las
anteriores; historial permite ver fotos incluso si existe un comprobante.

Datos solicitados para probar Licencias: en desarrollo, Transportes San Pedro
tambien carga los 15 conductores DEMO existentes, con clases variadas,
vigentes/por vencer/vencidos e historial. Carga aditiva e idempotente, sin
reemplazar conductores reales; requiere permiso de edicion. No en produccion.

Espaciado de Licencias: controles con 20px interiores, 20px entre cabecera
y filtros y 12px antes de tabla; filas de 64px y celdas de 12px/18px.
Acciones separadas 12px, sin salto de linea en escritorio.

Modales de referencia independientes: Registrar renovacion (800px) e
Historial de renovaciones (900px), cabecera blanca sin borde exterior,
icono y resumen del conductor. Renovacion en dos columnas con fecha real,
nuevo vencimiento, clases, comprobante PDF/JPG/PNG hasta 5 MB y observaciones.
Guarda metadatos y comprobante en historial; conserva licencia/fotos previas,
autor, fecha de registro y confirmacion. Historial permite descargar recibo.
Renovacion agrupa fechas y clase primero, luego Fotografias de la nueva
licencia en dos paneles Frente/Reverso con preview y boton de carga; despues
comprobante adicional en banda completa y observaciones. Conserva estilo
blanco/navy existente sin decoracion de ondas ni encabezado sobredimensionado.

Licencias de conducir: tabla con Conductor/RUT/Clase/Vencimiento/Dias
restantes/Ultima renovacion/Estado/Acciones, siguiendo referencia visual.
Ultima renovacion proviene del historial real, sin datos inventados.
Historial abre directamente Licencias anteriores; pulsar el nombre abre
la licencia. Solo Registrar renovacion e Historial en acciones, sin icono
adicional ni tres puntos. Colgroup de nueve columnas con proporciones
explicitas y RUT/estado/acciones sin saltos de linea en escritorio.
Renovacion valida fechas y permisos, incluyendo licencias vigentes.

Conductores agrupa titulo, acciones y filtros en una barra compacta.
Estado desplegable Todos/Por vencer/Vencidos/Vigentes. Exportar junto a los
filtros, tabla ajustada al contenido e historial tabular con fotos anteriores.
Sin boton de renovacion en cabecera. Registrar renovacion esta disponible
desde la fila para licencias con fecha valida y con permiso
de edicion; reutiliza formulario, confirmacion y controles existentes.

Barra de Ordenes agrupada: secciones Abiertas/Historial, filtros y estados
en un bloque compacto. Estados: Todas, Por iniciar, En ejecucion, En espera;
conteos separados y subrayado naranja para la seleccion activa.

Ordenes abiertas separadas del Historial (solo finalizadas). Las abiertas
no filtran por fecha. Historial muestra Fecha de cierre desde/Hasta y filtra
closedAt, no scheduledDate; campos vacios incluyen todos los cierres.
Limpiar mantiene la seccion y los extremos del rango son inclusivos.

Planes sin OT incluye exclusivamente proximas y vencidas sin orden abierta.
Pestanas Todas/Proximas/Vencidas, con conteos sobre ese mismo conjunto.
Los planes al dia no aparecen aqui y se siguen consultando desde Flota.

Crear OT solo esta disponible para planes reales proximos o vencidos.
Selector y guardas del modulo rechazan cualquier otro estado del plan.

Planes al dia no muestran Crear OT. La creacion esta bloqueada tambien
en el modulo y en el selector de planes, no solo visualmente.

Cabecera de Planes sin OT: titulo con conteo, filtros en fila propia y estados
alineados al inicio con subrayado naranja. Sin Exportar ni datos de muestra.

Planes sin OT pagina 10 filas por defecto, con opciones 10/25/50 y numeros
de pagina. Pie visible y rango mostrado; solo el cuerpo de la tabla se desplaza
si no cabe en la pantalla. Filtros/tamano reinician la pagina y bajas la ajustan.

No hay boton Nueva OT superior; las acciones reales siguen en cada plan.

Planes sin OT: titulo con conteo en primera fila; filtros debajo.
Sin horizonte de 90 dias; lectura actual solo para km/horas. Vencimientos
por tiempo con ano completo, filas compactas y pie sin controles innecesarios
cuando los resultados caben en una pagina.

Eliminar mantencion no tiene borde exterior; usa azul corporativo y boton
naranja #ff6600. Advertencia de vinculacion naranja, sin superficies rojas.

Confirmacion de eliminar mantencion con encabezado azul corporativo, fondo
blanco y banda azul clara de identidad del plan
y vehiculo con icono, aviso rojo solo con OT vinculadas y lista de sus estados.
Sin panel rosado completo ni textos duplicados; conserva alcance y confirmacion.

OT canceladas/anuladas se retiran de todas las listas y de la confirmacion
de eliminar mantencion, incluyendo las antiguas. No hay pestana Canceladas.
Se conserva constancia interna y sus costos dejan de mostrarse operativamente.

Eliminar mantencion requiere confirmacion que enumera las OT vinculadas y
sus estados. La eliminacion incluye todas esas OT y archiva sus costos,
retirandolos de listas operativas. Datos internos conservados para auditoria;
no afecta otras mantenciones. Si cambian las OT, exige confirmar de nuevo.

Detalle de OT incluye Iniciar OT como accion primaria naranja, solo si esta
programada y sin fecha de inicio. Usa el inicio directo existente y mantiene
abierto el detalle actualizado de la misma orden; desaparece tras iniciar.

Planes sin OT muestra solo la tabla a todo el ancho. Busqueda, filtros,
exportacion y estados estan integrados en la cabecera; activo y mantencion
comparten columna. Conserva prioridad por urgencia, lectura y objetivo reales,
paginacion 20/50 y estado vacio. Sin indicadores, grafico ni datos de muestra.

Eliminar OT solo aparece sin iniciar, sin evidencias/trabajo y sin costos
registrados. Requiere motivo y confirmacion; la baja se conserva internamente
sin aparecer en listas ni reutilizar el numero. Con actividad se ofrece
Anular OT con motivo. Deshacer inicio se mantiene como accion independiente.

Deshacer inicio en el detalle deshace un inicio accidental desde En
proceso o En espera. Conserva la OT, asignacion, fechas y costos; limpia
lectura/fecha de inicio y permite iniciarla de nuevo. No es una cancelacion.

Cancelacion de OT: contexto de orden/vehiculo/trabajo visible, motivo vacio
y obligatorio, Volver para salir y Cancelar OT en rojo. Sin selector de
notificaciones no implementadas; los datos y costos se conservan.

Iniciar/Reanudar trabajo aplica el cambio directamente desde el boton,
sin confirmacion intermedia. Espera sigue requiriendo motivo; cierre y
cancelacion conservan sus formularios. Se evita iniciar una OT ya iniciada.

Detalle de OT: encabezado corporativo azul y resumen persistente arriba.
Informacion general y costos se muestran juntos, sin pestanas ni scroll
interno: cuatro columnas de datos y cinco de costos, adaptadas a movil.
Se conservan evidencias, cierre/cancelacion y acciones operativas existentes.
La trazabilidad no se muestra en el modal; los datos historicos se conservan.

Editar plan abre Configuracion con los valores existentes, no el selector de
creacion. Cancelar sale del editor; desde Confirmar se vuelve a Configuracion.

Las herramientas editar/eliminar tienen su propia columna Gestion, separada
de Siguiente accion. Botones sin salto de linea y ancho minimo de tabla.

Editar tambien esta visible en cada fila mediante un lapiz junto a la
papelera; ambos controles tienen etiqueta accesible y titulo al pasar el cursor.

Cada fila de plan incluye una papelera con etiqueta accesible para eliminar
directamente desde Flota. Reutiliza la confirmacion existente, sin abrir edicion.

Nueva OT: contexto de vehiculo y mantencion arriba, campos en dos columnas
y confirmacion agrupada por trabajo y programacion.

Nueva OT comparte el estilo del asistente de mantencion: encabezado azul,
contenido blanco y el mismo ancho de modal (900px).
El flujo tiene tres pasos: Datos de la OT, Adicionales y Revisar y crear. Un indicador
horizontal reemplaza la barra lateral para aprovechar el ancho. Trabajo,
fechas y responsables se completan juntos en grupos de dos columnas.
Ambos pasos validan todos los campos requeridos antes de avanzar o guardar.
La confirmacion agrupa datos del trabajo y programacion en dos secciones,
con encabezados claros, paso activo resaltado y opcionales compactos.
Presupuesto y notas tienen pantalla propia sin desplegables que agranden
la confirmacion. La altura base es 700px y no usa desplazamiento interno.
En pantallas pequenas se desplaza el overlay completo, no paneles del modal.

UI del modulo de mantenciones. `MaintenanceView.vue` conecta estas piezas con
`useMaintenanceModule.js`; los datos y cambios operativos no se guardan en los
componentes de tabla.

## Pantallas En Uso

Detalle de OT (2026-11-06): ancho 1080px, resumen de activo/mantencion/estado/fecha
sin prioridad ni fecha duplicadas. Gestion en franja superior, sin participar
en la cuadricula. Columnas normales: trabajo/asignacion y evidencia/resultado a
izquierda; costos e historial a derecha. Sin display:contents ni comentarios
vacios que duplicaban eventos. Presupuesto separado de total real registrado.
Fechas calendario sin conversion horaria y eventos solo de datos registrados;
no se inventan pasos en espera ni se usa vencimiento como fecha de cierre.

Paginacion de Ordenes: anterior/siguiente reales, rango de filas, pagina/total y
tamanos 10/25/50. Cambiar filtros/pestana/tamano reinicia pagina; si disminuye
el total se ajusta al ultimo indice valido. Alta real vuelve a primera pagina.
Acceso contextual localiza la pagina exacta de la OT, incluso mas alla de 50
filas y con busqueda debounced; no fuerza otro tamano. Vacio muestra 0 a 0.

Ordenes inicia en Abiertas (programadas, en ejecucion y en espera). Finalizadas
y Canceladas estan separadas. Limpiar filtros y crear OT vuelven a Abiertas;
acceder expresamente a una OT terminal abre su pestana. Los filtros no cambian
de pestana por el mero aumento de resultados; contador del pie usa lista activa.

Limpieza de Ordenes (2026-11-06): cuatro KPI operativos sin subtitulos repetidos
(abiertas, vencidas, ejecucion, espera). Patente sin mantencion duplicada. Costo
real por fila; desglose en detalle. Tabla de OT con Prioridad siempre visible y columnas fijas,
sin selector Columnas; conserva Ampliar tabla. Analisis conserva promedio/cumplimiento/costo de OT finalizadas
en el periodo seleccionado, mediante summarizeMaintenanceOrders.

Iniciar/Reanudar trabajo usa confirmacion compacta: OT en titulo, vehiculo,
trabajo, responsable y taller existentes, sin campos editables ni selector de
estado. Cancelar conserva el estado. Espera mantiene motivo obligatorio; cierre
no cambia. La asignacion se edita dentro de Editar planificacion.

Acciones de OT (2026-11-06): se sustituye selector de estados por Iniciar trabajo
(programada), Cerrar OT (en proceso) o Reanudar trabajo (en espera). Ver OT sigue
disponible. Sin menu secundario en filas: Editar planificacion (reune fechas,
hora, responsable, taller y prioridad) y Poner en espera solo en proceso se
ubican en Gestion del detalle; Agregar costos
junto a Costos y Cancelar OT en el pie. Al guardar o cancelar estas operaciones
se vuelve al detalle de la misma OT. Detalle de cierre solo para OT terminales.
Modales de transicion muestran titulo
y confirmacion de la accion elegida, con estado destino de solo lectura; no
cambian la OT hasta confirmar. Planificacion conserva el estado operativo, inicio
real y motivo de espera; valida fechas y asignacion y retorna al detalle.

Ordenes: Ampliar tabla ocupa el viewport y oculta temporalmente KPI/filtros;
conserva filtros aplicados, pagina, scroll y acciones de OT. Salir de pantalla
completa o Escape restaura la vista. Se desactiva al salir de la pestana y no
intercepta Escape de modales. No usa permisos del fullscreen del navegador.

Claridad de Flota (2026-11-06): Planes por vehiculo, Estado del plan y Mantencion
prioritaria describen la fila agregada y su plan mas urgente. El resumen separa
pendientes sin OT, planes con OT abierta, por renovar y por configurar; no mezcla
trabajo programado con decisiones pendientes. Calculo cacheado en fleetRows.

Flota simplificada (2026-11-06): fila con un solo Ver planes/Ocultar planes, sin
chevron duplicado ni acceso directo a OT desde el agregado. La columna Acciones
permanece visible para no perder el acceso al plegado. Dentro de cada plan:
Crear OT, Ver OT o Renovar plan segun estado. Sin Continuar OT ni Ver detalle
completo; el nombre abre el plan exacto. Sin planes, Agregar primer plan dentro
del desplegable. Los datos y contadores existentes no cambian.

Tipo y nombre (2026-11-06): seleccionar tipo completa automaticamente el nombre
del plan, de solo lectura en configuracion/edicion. Confirmacion muestra ambos.
El catalogo de tipos sigue siendo editable; no se migran nombres historicos.
Ultima lectura se etiqueta segun criterio: kilometraje, horometro (horas) o fecha
de la ultima mantencion, en formulario y confirmacion. Sin resaltado amarillo
temporal; retirado por solicitud nutella.

Nuevo plan: el paso 1 muestra un selector de vehiculo. Sin seleccion no muestra
tipos como Ya configurada ni permite avanzar. Desde una fila conserva el vehiculo
explicitamente y lo muestra en el selector; no usa selectedVehicle como fallback.

Pasos 3-5 (2026-11-05): resultados persistentes y descartables en todas las
pestanas, con Ver OT creada, Revisar renovacion o Ver planes del vehiculo segun
la operacion. Sin renovacion automatica. Ordenes conserva Nueva OT y Planes sin
OT; configuracion de planes/tipos permanece en Flota. Flota omite vencimientos
repetidos y conteos de cero pendientes. El detalle de OT abierta muestra fecha
limite y estado abierto, no una falsa fecha de cierre.

Desde un plan de Flota, Ver/Continuar OT abre directamente su detalle. El modal
y la cabecera de Ordenes ofrecen Volver al plan en Flota. KeepAlive conserva los
filtros, pagina y vehiculos desplegados; la tabla expone captura/restauracion de
scroll. El detalle existente ya muestra activo y tipo de mantencion asociado.

El boton principal del modal usa inline-flex y centrado vertical; la flecha de
Siguiente tiene dimensiones fijas de 16px para no desalinearse con el texto.

Estado visual de cabeceras (2026-11-04): la navegacion principal contiene solo
Flota/Analisis/Ordenes/Conductores. Flota y Analisis tienen barra contextual debajo,
igual nivel de acciones que la cabecera de Ordenes. Botones, selector de periodo
y filtros compartidos de 38px; texto secundario de 11-12px sin peso excesivo.
Creacion conserva naranja; Exportar de Analisis conserva azul. Conductores
mantiene controles propios y no muestra acciones de planes/OT.
`MaintenanceView.test.js` cubre separacion de barras y handlers conservados.

- `MaintenanceFleetTab.vue`: Flota, filtros laterales, listado ordenable,
  columnas configurables, paginacion y planes expandibles por vehiculo. Expone
  `getExportRows` para el reporte de flota.
  El panel de filtros reserva cabecera fija y cuerpo con altura minima cero y
  scroll vertical propio cuando no caben los campos. Espaciado compacto sin
  ocultar fechas ni extender la pagina al reducir la altura de ventana.
  Paginacion real 10/20/50 (20 iniciales), aplicada despues de filtros/orden.
  Solo se dibuja la pagina visible; exportacion mantiene todos los resultados.
  Cambiar filtros/orden/tamano vuelve a pagina1 y conserva indices de fila globales.
- `fleetVehicleAction.js`: accion contextual de cada fila de Flota. Sin planes
  ofrece Configurar mantencion con el vehiculo de la fila. Los demas casos
  despliegan los planes sin elegir uno ni ejecutar operaciones automaticamente:
  revisar pendientes sin OT, renovaciones, configuracion o trabajos abiertos.
  Distingue OT programadas, en proceso y en espera; no llama trabajo en curso
  a una OT que todavia no comenzo. Casos mixtos priorizan decisiones pendientes.
  Clasificacion calculada junto al indice de filas, sin nuevas busquedas por render.
  Siete pruebas cubren estados, conteos, cambios reactivos y conexion del boton.
- `fleetOrderIndex.js`: indice de OT abiertas por vehiculo y plan/nombre.
  Evita buscar todas las OT al renderizar cada plan; pruebas en su archivo test.
- `MaintenanceWorkOrdersTab.vue`: OT y pendientes de OT, KPI, filtros, tabla
  con scroll interno y paginacion. Recibe acciones desde la vista; la seccion
  sin OT reutiliza MaintenanceCostsTab con modo especifico y cache independiente.
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

La interfaz actual no expone Contactos ni Ultima gestion. Los registros anteriores
se conservan como datos legacy, sin mostrarlos como acciones vigentes.
Renovar compara fechas y clases en un paso de confirmacion antes de subir archivos
o guardar. Se muestra Vencio hace/Vence en segun fecha.

# Diseno Y Fluidez De Conductores

Banda de vencimientos, filtros alineados y tabla de seis columnas con identidad
agrupada, clases y tiempo al vencimiento. En movil las filas se apilan con etiquetas,
sin scroll horizontal. Paginacion automatica o de 5/10/20/50. Busqueda con debounce
de 120ms e indice calculado solo al cambiar registros o dia.
La vista se conserva con KeepAlive limitado a una empresa; al desactivarse cierra
modales y detiene temporizador. Una subida cancelada no guarda datos al volver.

# Presentacion De Conductores

Guardado incremental en IndexedDB: alta, edicion, renovacion y datos demo esperan
confirmacion de transaccion. Solo entonces se cierra el formulario y se consideran
confirmadas las fotos; un fallo conserva formulario/datos y limpia adjuntos nuevos.

Adjuntar frente/reverso muestra vistas previas independientes junto a cada campo,
sin reemplazar la del otro lado. URLs temporales se liberan al cambiar archivos,
cerrar formulario o desmontar; cancelar selector conserva la seleccion anterior.

Renovar aparece tambien para licencias vigentes. La validacion compartida
exige que el vencimiento nuevo sea posterior al anterior y no vencido.

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

Panel lateral de filtros vuelve a cubrir toda la altura de la tabla, sin mover
controles: fondo blanco continuo hasta abajo, contenido alineado al inicio.

Filtros en panel lateral compacto. Experimento de franja superior revertido
por solicitud del usuario; se conservan los controles y comportamientos previos.

Ver planes funciona como acordeon: solo un vehiculo expandido. Al abrirlo o
regresar a sus planes se desplaza el scroll interno hasta su fila, dejando
cabecera visible. Espera al render, respeta movimiento reducido y descarta
enfoques anteriores al cambiar rapido de vehiculo o salir de la pestana.

Planes expandidos ordenados por urgencia: vencida, proxima, sin renovar,
en taller, sin lectura, al dia. En empate urgente, primero sin OT abierta.
Empates restantes conservan orden; no compara km con dias/horas. Mantencion
prioritaria de la fila principal usa el primer plan de ese mismo orden.

Panel de filtros compacto: busqueda/tipo, estados y fechas. Alto por contenido
con limite al viewport y scroll interno cuando hace falta, sin relleno vertical.
Fechas en filas separadas con etiquetas Desde/Hasta para no cortar el calendario.

Filtros de Flota para cliente: busqueda, estado, tipo de mantencion y fechas.
Retirados Empresa y Tipo de vehiculo, junto con su estado local. El alcance de
empresa sigue delimitado por ruta/permisos, no por un filtro seleccionable.

Solo se listan planes configurados y guardados. No se generan planes base ni
filas de respaldo por cantidad de activos/tipos. Vehiculo sin planes: contador
cero, Sin configurar y Agregar primer plan; no una mantencion incompleta.

Se elimina el modal Mantenciones del vehiculo. Flota mantiene la tabla expandida;
pulsar un plan abre directamente el formulario de edicion. Configurar plan usa
ese mismo acceso. Guardar/cancelar vuelve a Flota; eliminar sigue disponible en
edicion de planes manuales. Historial operativo permanece en Ordenes.

Planes base sin configuracion real muestran Sin configurar, sin fechas de
ejemplo ni estado Al dia prefijado. Comparten evaluador con planes guardados.
Configurar plan abre el detalle exacto para editarlo, sin crear duplicados.

Por fecha tambien usa objetivo exacto: Fecha de la proxima mantencion, calendario
vacio y obligatorio. Fecha de inicio precargada hoy, aviso en dias. Resumen
muestra fecha elegida y dias restantes; se traduce al intervalo para persistir.

Horometro GPS usa engineHours/horometroTotal del activo, ademas de aliases
hourMeterHours/horometro. No confunde horas diarias con acumuladas ni inventa
lecturas ausentes. Numeros decimales y cero real se conservan.

Horometro igual que odometro: objetivo absoluto Proxima mantencion a las (horas),
vacio y obligatorio al crear. No usa Cada ni relleno de plantilla. Fecha de
inicio consulta lectura horaria; resumen muestra objetivo y horas restantes.

Proxima mantencion por kilometraje obligatoria: asterisco, required, mensaje
visible si falta, Siguiente/Crear bloqueados y validacion al guardar.

Confirmacion incluye Umbral restante: objetivo menos lectura actual del GPS,
o dias hasta vencimiento. No resta aviso previo ni usa lectura historica como
actual. Distingue faltante, vencida y ausencia de lectura; aviso es independiente.

Paso Configuracion ordenado: tipo como identidad unica, criterio + fecha de
inicio, banda con lectura de esa fecha y hora de registro, objetivo + aviso.
Sin nombre repetido ni fecha debajo del objetivo. Notas en desplegable secundario.
Sin datos de prueba ni bloqueo de demostracion. Grilla de dos columnas, una en movil.

La banda azul de lectura muestra el dato de la fecha seleccionada, con fecha
en el titulo. Hoy usa lectura actual reactiva;
pasado usa referencia historica, sin repetir kilometrajes distintos en dos bloques.

Fecha de inicio (sustituye Actualizar): hoy usa lectura actual; un dia anterior
usa el ultimo reporte explicito del dia en America/Santiago, mostrando su hora.
Sin registro queda Sin lectura para esta fecha y no se permite guardar referencia
vacia. Conserva objetivo absoluto al cambiar fecha, guarda startDate/referenceReadingAt.
La lectura GPS actual sigue reactiva y no desplaza referencias guardadas.
Historico limitado a getReportsForAsset del activo/empresa; sin consulta backend,
sin interpolacion ni reutilizar lecturas actuales en dias pasados.

Proxima mantencion por odometro empieza vacia en nuevos planes, sin objetivo
sugerido por plantilla. Solo el usuario establece ese kilometraje. Editar un
plan conserva su objetivo guardado; Actualizar no rellena uno vacio.

Decision final de kilometraje: Proxima mantencion a los (km) recibe objetivo
absoluto, no Cada. Lectura GPS en banda informativa y aviso en km. Se oculta
ultimo servicio en este criterio y el resumen confirma el objetivo absoluto.
Actualizar conserva el objetivo; internamente intervalo = objetivo - referencia.

Lista de tipos de nuevo plan: nombre y criterio (tiempo, odometro u horometro),
o Ya configurada cuando corresponde. No muestra intervalo del catalogo.
Criterio, intervalo y aviso siguen editables en Configuracion; seleccionar un
tipo no modifica los valores del catalogo al guardar el plan.

Nuevo plan bloquea todos los tipos hasta elegir un vehiculo valido. No hay
seleccion activa ni mensaje Ya configurada antes de elegirlo; Siguiente permanece
bloqueado. Despues se aplica el bloqueo de tipos existentes del vehiculo.

Actualizar en lectura GPS copia al campo del ultimo servicio la ultima lectura
del activo disponible en la pagina, tanto al crear como al editar. Sin lectura
queda deshabilitado. No ejecuta peticiones remotas ni guarda sin confirmar.
Muestra circulo y Actualizando durante la accion local (minimo visual 350ms),
bloquea clics repetidos y descarta la copia si cambia el borrador/vehiculo/criterio.

Configuracion por odometro/horometro: lectura actual del activo solo informativa,
sin boton para copiarla. En nuevos planes la referencia del ultimo servicio
se precarga con el GPS al elegir vehiculo/tipo/criterio, editable para correccion;
si falta lectura permanece vacia. No se sobreescriben planes existentes. Se configura ultimo servicio,
intervalo y anticipacion; objetivo = ultimo servicio + intervalo. Lecturas ausentes
no se reemplazan por cero ni valores de ejemplo: estado Sin lectura. Fecha sin cambios.

Nuevo plan: tipos existentes del vehiculo se bloquean incluso si quedo un
planId/modo de edicion en el borrador. Al cambiar vehiculo se selecciona un tipo
libre, sin mostrar seleccionado uno bloqueado. Exclusion del propio plan solo
en edit-maintenance.

Nueva OT en tres pasos: Trabajo, Programacion, Confirmar. Trabajo contiene
vehiculo/plan, titulo y prioridad; desde una fila, vehiculo/plan son datos fijos.
Programacion pide fechas/responsable/taller. Confirmar muestra resumen y opcionales
plegables de presupuesto/descripcion/observaciones. Volver conserva el borrador;
solo Crear OT del ultimo paso emite guardado. Validacion independiente por paso.
Fecha inicial usa el dia actual en America/Santiago, sin vencimiento ficticio.
Crear OT mantiene validacion de campos y prevencion de OT abierta duplicada.

Todos los modales comparten ancho maximo de 900px: formularios, detalles,
catalogo, confirmaciones, exportacion y revision de referencias antiguas.
Todos se limitan al viewport, con altura segun contenido y scroll interno.

Editar planificacion usa cabecera blanca compacta con OT, activo y mantencion.
Fechas y Asignacion se presentan en dos filas de tres campos sin tarjetas
anidadas; en ventanas estrechas pasan a una columna con pie visible.
Los errores de validacion se identifican como alertas, sin modificar el flujo.

Flota, Ordenes, Analisis, pendientes sin OT, calendario e historial se conservan
al visitarse en KeepAlive (maximo seis instancias, reiniciado al cambiar empresa).
Analisis y pendientes tienen claves distintas para no compartir estado local.
No se montan pestanas por anticipado. Los imports principales siguen directos
para no reintroducir el indicador Cargando al navegar. Esto evita remontajes,
pero no reduce por si solo el bundle inicial. Al desactivar se retiran listeners
globales y se cierran menus o graficos expandidos. Conductores mantiene su cache
independiente de una empresa y su ciclo de persistencia existente.

### Simplificacion de licencias (2026-11-12)

Avisos pendientes abre el modal de licencias por vencer o vencidas.
Se revirtieron el filtro Requieren atencion y su franja superior.
Vigencia automatica y Seguimiento manual se presentan como conceptos separados.
Fecha agendada registra solo una fecha, no una hora. Las gestiones anteriores
se consultan dentro del historial de la licencia a la que pertenecen.
Renovar hereda anticipacion y destinatarios; solo pide los datos de la nueva
licencia. Comprobante y observaciones quedan en Informacion adicional.
Email/WhatsApp estan deshabilitados hasta completar la integracion; la
anticipacion permanece editable al agregar o editar conductor. Sin backend.
Los avisos flotantes recuerdan mostrados, no ocultan pendientes operativos.

Ficha y renovacion usan el mismo contenedor de 800px y cabecera compacta.
Desde ficha, cancelar vuelve a ella; guardar vuelve con los datos actualizados.
Avisos permite abrir renovacion directamente, sin pasar por la ficha.
Editar permite corregir fecha/clases con motivo y confirmacion: se conserva
licenseId y se agrega auditoria en corrections, nunca una renovacion ficticia.
Las correcciones se consultan en historial. Seguimientos identicos sin nueva
observacion no se guardan. Canales de envio quedan deshabilitados y separados
de la anticipacion operativa; no existe envio ni integracion de backend.

Solo cinco vistas modales: Licencia actual, Registrar renovacion, Historial,
Avisos pendientes y Agregar conductor. DriverCurrentLicense reemplaza la ficha
antigua y presenta vencimiento, estado, plazos, fotos y seguimiento. Editar y
gestionar son secciones internas de Licencia actual y vuelven a ella al guardar.
Se eliminaron markup, tarjetas y estilos de la ficha antigua, no se oculta otra
version del mismo modal. El visor de fotos sigue dentro del dialogo actual.

Actualizacion: Avisos pendientes se retira a peticion del usuario. Quedan
Licencia actual, Registrar renovacion, Historial y Agregar conductor. Se retiran
columna y filtro Seguimiento de la tabla; sigue accesible dentro de la ficha.
Un unico filtro Vencimiento combina estados y plazos con contadores calculados
segun busqueda y clase. Por vencer respeta anticipacion configurada; proximos
7/30 dias son plazos de calendario desde manana, excluyendo vencidas y hoy.
Alertas flotantes aplican Requieren atencion en la tabla; sin franja ni modal.

El nombre del conductor no es interactivo. Ver licencia es una accion visible
por fila para consultar la licencia actual, tambien para usuarios de solo lectura.

Las correcciones respetan la ultima fecha de renovacion. La misma validacion
se aplica antes de subir documentos y al guardar; cambiar clases exige auditoria
tambien en el store. Registros antiguos con fecha corregida resuelven documentos
por la identidad registrada en corrections, no solo por coincidencia de fecha.

### Logica De Analisis

Avance del ciclo utiliza cycleProgressPercent y remainingValue calculados desde
el intervalo y lectura del plan. Un plan por activo, vencidos primero; sin
porcentajes de riesgo ficticios ni conversion de unidades a dias.
Vencimientos por fecha incluye solo Fecha/Hora y rangos calendario hasta 90 dias,
incluso fuera del umbral de aviso. Rangos informativos sin navegacion enganosa
por un estado generico que no representa el rango.
Todos los graficos historicos comparten periodAnalysis, con OT finalizadas entre
el inicio del periodo y el corte actual, fechas Chile y exclusion de futuros.
KPIs de flota y ciclos describen el estado actual; costos y cumplimiento son del
periodo elegido. Las barras de costo comparten escala con el eje y cero es cero.

Actualizacion de presentacion: Analisis conserva costo total registrado, cantidad
de OT finalizadas y cumplimiento con cantidad de OT evaluadas. Debajo quedan
costo mensual, composicion y ranking de activos con costo positivo. Se retiran
indicadores operativos y graficos de avance, vencimientos y cumplimiento por
activo de esta vista, sin alterar las otras pestanas. Periodo unico arriba.
Vacios sin ejes ni leyendas ficticias; sin datos evaluables no se muestra 0%.

En desarrollo, MaintenanceAnalysisPreviewControl activa datos ficticios para
probar los graficos: ocho activos y doce meses con costos y cumplimiento variados.
Al desmarcar vuelve a los datos reales. No persiste ni combina muestras con OT
reales; tampoco cambia las fuentes de planes sin OT. Produccion no lo habilita.

