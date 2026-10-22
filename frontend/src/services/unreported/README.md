# Unreported Services

## Flujo Vigente

## Historial Persistente

interruptions conserva cada episodio por empresa/IMEI, con ID estable, ultimo
reporte antes del corte, deteccion, recuperacion y duracion. Umbral vigente define
silencio; no es la hora exacta de una falla electrica ni un diagnostico de causa.
observe/receiveReport capturan reincidencias y no duplican reportes repetidos.
observe recibe snapshots actuales: dos consultas lejanas con datos frescos no
prueban una interrupcion intermedia y no generan un episodio ficticio. receiveReport
debe recibir eventos reales de un flujo completo, no snapshots esporadicos.
Paquetes atrasados dentro del umbral corrigen el ultimo reporte sin inventar
otra recuperacion. Nunca reporto no cuenta como interrupcion sin reporte previo.
Consultas nuevas guardan interruptionId; las anteriores se vinculan por fechas.

Migracion no destructiva: importa solo la ultima recuperacion anterior cuando
existe duracion suficiente para determinar el reporte previo. No reconstruye
otras interrupciones sin datos. equipment conserva identidad para buscar equipos
fuera de la fuente actual; no se inventa su estado actual ni nuevas incidencias.
Guardado atomico y alcance de empresas se mantienen.

Excel history=true genera Resumen de equipos y Historial de reportes, incluyendo
consultas de cada episodio. Exportacion normal conserva sus columnas y agrega
detalle historico cuando existe. Nombre historial-de-equipos.xlsx en modo historial.
La fuente y persistencia siguen locales/mock. Produccion requiere historico/API
con eventos de comunicacion del servidor y evaluacion independiente del navegador.
Fechas de recuperacion son las registradas con la informacion recibida, no una
reconstruccion del primer paquete de intervalos que la fuente no proporciona.

Consultas reemplazan las notas en UI y Excel. Notas anteriores permanecen en
sinergy-unreported-lifecycle-v1 y sus helpers legacy para compatibilidad/reversion;
no se muestran ni exportan ni se borra almacenamiento. Excel tiene 16 columnas,
con historial de consultas al final y autofiltro A1:P1.

`unreportedExcelExportService.js` carga ExcelJS bajo demanda y descarga
equipos-sin-reporte.xlsx. Incluye equipo, IMEI, empresa, estado, tiempo sin
reportar, ultimo reporte, condicion al cortarse y ubicacion.
Los IMEI se mantienen como texto; la cabecera tiene autofiltro y esta congelada.
La vista envia todas las filas filtradas, independientemente de la pagina.
`unreportedExcelExportService.test.js` prueba el contenido del libro.
La fuente de filas sigue siendo local/mock; no hay API de telemetria en este servicio.

El Excel incluye etiqueta breve y voltajes calculados por
utils/unreported/unreportedDiagnosis.js. Se retiraron las hipotesis largas
tanto de la tabla como de la exportacion.

La libreta de notas y su servicio se retiraron. La clave antigua
sinergy-unreported-notes-v1 no se lee ni escribe; los datos ya guardados no se
eliminan del navegador en esta retirada. El seguimiento permanece independiente.

## Ciclo De Seguimiento

`unreportedLifecycleStore.js` guarda estado por empresa/IMEI en
sinergy-unreported-lifecycle-v1. Tiene Sin reportar (active), Recuperados
(recovered). reporting es un estado interno
para equipos recientes sin incidencia previa: no se inventa una recuperacion.

- observe compara reportes y umbral; ignora datos atrasados/futuros y cambia el
  seguimiento al volver a transmitir o superar otra vez el umbral.
- receiveReport permite integrar un paquete nuevo y tambien la simulacion demo.
- Su quinto argumento opcional recibe diagnosticos normalizados del paquete:
  voltajes, SIM, registro movil, intensidad de senal y posicion GPS. Se guardan
  solo campos escalares permitidos con la fecha del paquete. Sin diagnosticos
  nuevos no se actualiza la fecha de las mediciones anteriores.
- observe tambien acepta row.telemetry con reportedAt igual a la fecha del
  reporte entrante. Datos atrasados/futuros no justifican un fallo actual.
- saveFault registra/edita fault, faultAt y faultBy sin retirar el equipo.
- La falla anterior se conserva en notas; el Excel actual muestra seguimiento
  y notas separados del ultimo dato GPS, no columnas de fallas editables.
- observe migra retiros legacy a seguimiento segun ultimo reporte y umbral,
  conservando motivo, fecha y responsable como falla registrada.
- Registro local, editable, no historial de versiones ni confirmacion de reparacion.
- Flujo actual: addNote agrega notas independientes con ID, fecha y autor sin
  sobrescribir anteriores. observe convierte la falla anterior en una nota una
  sola vez; tambien se conservan al recuperar el equipo. Exportacion incluye notas.
- saveFault queda como compatibilidad de registros anteriores, no accion de UI.
- editNote/deleteNote validan alcance de empresa e ID existente y guardan de
  forma atomica. Editar conserva creacion/autor y agrega updatedAt/updatedBy.
  Borrar una nota migrada no vuelve a importarla al observar nuevos reportes.
- setFollowUp guarda pending/in_progress y fecha/responsable, con permisos por
  empresa y guardado atomico. Solo modifica equipos active; no conectividad.
- Al recuperarse conserva seguimiento y notas. Si vuelve a superar el umbral,
  observe/receiveReport restablecen pending sin inventar un responsable manual.
  Registros antiguos sin followUp aparecen como pendientes, sin borrar datos.
- Excel incluye seguimiento, responsable/fecha y notas; excluye columnas legacy
  de falla para que una nota eliminada no reaparezca en la exportacion.
- Flujo actual: addConsultation valida situacion (working/not_in_use/workshop/
  not_contacted) y decision (pending/field_review/no_visit), guarda observacion,
  fecha y autor en historial append-only sin alterar conectividad. Solo active.
  Recuperacion y reincidencia conservan consultas; reincidencia vuelve a pending.
  setFollowUp queda como compatibilidad del flujo anterior, no accion de UI.
  Excel incluye historial de consultas y ultima decision. Sin API real conectada.

La vista revisa cada minuto mientras esta abierta y al pulsar Actualizar.
Umbral local de 1/6/12/24 horas, persistido como preferencia. No hay API ni stream
GPS real conectado: Simular reporte (demo) es explicito y no confirma una
reparacion ni una conexion real. Para produccion, usar IDs estables, datos reales,
permisos de servidor y una evaluacion independiente de una pestaña abierta.
`unreportedLifecycleStore.test.js` cubre transiciones, persistencia, fechas y fallos.
# Preservacion De Causas Historicas

El ciclo captura telemetria por episodio antes de reemplazarla con un reporte nuevo.
Los episodios cerrados no se modifican con diagnosticos actuales. Datos antiguos
sin copia no se rellenan con datos posteriores. Excel agrega diagnostico y evidencia
GPS propios a cada fila de Historial de reportes; llamadas siguen asociadas al caso.
Esto conserva episodios observados en almacenamiento local: no reemplaza una API
de historial GPS para consultar interrupciones anteriores nunca registradas.
# Preparacion Segura De Exportacion

prepareUnreportedExcelRows centraliza conversion de fechas, episodios terminados
y diagnostico actual opcional. Equipos DEMO/historicos no necesariamente tienen
diagnosis: ausencia se informa sin tomar causas de otro episodio ni lanzar error.
La vista prepara e importa dentro de try/finally para liberar siempre el boton.
Pruebas generan XLSX de los 12 equipos/59 episodios y de una ficha filtrada.
# Excel Con Formato De Plataforma (2026-10-15)

Reporte es la primera hoja del libro, creada por unreportedReportSheet.js. Reutiliza
el PNG oficial y patron de mantenciones: logo 160x51, titulo, fecha Chile, separador
azul/naranja, margenes iguales, bandas por equipo y encabezados azul/blanco.
Filas alternadas, evidencia y llamadas completas con altura calculada y texto envuelto.
Historial tiene una fila por episodio y llamadas numeradas en columnas alineadas;
equipo/empresa/IMEI en cada banda. Sin reportar muestra estado y consultas registradas.
Ancho se adapta al solicitado sin agrandar tipografia; zoom 85%, impresion horizontal
y area delimitada con margenes simetricos. Conservadas hojas de datos con filtros,
IMEI texto y encabezado congelado; tambien con bandas/ajuste de texto.
La vista captura filtro/periodo/ancho antes de importar exportador. Logo opcional con
fallback textual, sin impedir descarga. Pruebas guardan y reabren XLSX con imagen.
# Equipos Sin Reportar: Tabla Continua (2026-10-16)

La hoja Reporte operativa usa unreportedContinuousReportSheet.js: logo reducido
120x38, titulo/subtitulo compactos, total/contexto a izquierda y fecha Chile a derecha.
Un solo encabezado en B6:K6, una fila por equipo desde fila 7 y diez columnas:
equipo, empresa, tiempo, ultimo reporte, diagnostico/evidencia GPS, ultima llamada,
situacion, decision y observaciones. Nombre e IMEI en texto enriquecido en la misma
celda, conservando ceros; no hay bandas individuales, Conectividad ni filas vacias.
Ultima consulta seleccionada por fecha sin mutar consultas; todas siguen en hojas
de datos. Sin consulta, situacion/decision/observacion usan guion largo. Evidencia
solo cambia separadores por saltos de linea, sin eliminar datos o atribuir causas.
Filtro B6:Kultima, congelado hasta fila 6, texto centrado verticalmente, altura segun
contenido, alternancia casi blanca, bordes solo horizontales y avisos GPS suaves.
Columnas proporcionales normalizadas con minimos legibles y margenes iguales.
Impresion horizontal delimitada. Historial conserva formato por equipo anterior.
Esta entrada reemplaza el formato operativo por bloques descrito mas abajo.
# Ancho Operativo Sin Corte Negro (2026-10-16)

Reporte operativo conserva columnas posteriores visibles: ocultar M:XFD producia
el fondo negro de Excel al terminar la hoja. Area de impresion sigue delimitada A:L
con margenes simetricos. Ancho operativo minimo 1800 px evita heredar ventana web
estrecha; contexto de vista toma pantalla disponible, no solo ancho del navegador.
No modifica zoom, filas, tipografia ni datos. Historial conserva su ocultacion previa.
# Texto Mayor En Reporte Operativo (2026-10-16)

Hoja continua: datos, nombre y encabezados de tabla a 12 pt, IMEI secundario 11 pt,
titulo 17 pt. Metadatos tambien 12 pt. Alturas de cabecera y filas ajustadas al texto
mayor; calculo de lineas considera proporcion de fuente de 12 frente a ancho Excel.
Minimo de fila 44 pt. Sin cambios a datos, zoom, filtros o formato de historial.
# Margenes Y Logo Ajustados Al Espacio (2026-10-16)

Reporte operativo usa una misma constante para margenes de columna A/L, incluye
ambos en calculo de ancho y centra horizontalmente el area de impresion. La vista
usa ancho disponible de pantalla sin restar 48 px adicionales al documento.
Logo deja de tener 120x38 fijo: se ajusta y centra dentro de B1:B2 con proporcion
real 2800:900 del PNG, manteniendo pequenos resguardos y sin deformar la imagen.
Altura de dos filas superiores se adapta al logo con limite compacto; fuente de
tabla y datos sin cambios. Columnas posteriores siguen visibles, sin corte negro.
# Logo Reducido Manteniendo Centrado

Logo operativo al 85% del tamano ajustado a B1:B2, con ancla recalculada para seguir
centrado en ambos ejes. Altura de cabecera, margenes y proporcion sin cambios.
# Resumen Historico Bajo Demanda

prepareUnreportedExcelRows calcula interruptionSummary al exportar equipos operativos,
en lugar de pedir que la vista lo recalcule en cada refresco. Conserva contador y
ultima recuperacion previos; grupos historicos siguen usando resumen del periodo.
No cambia estructura o presentacion del Excel ni escritura de almacenamiento.
# Eficiencia Punto 2: Persistencia Por Equipo (2026-10-16)

unreportedStateStorage.js adapta el almacen de colecciones existente del proyecto:
un registro por clave empresa/IMEI y un manifiesto de punteros, bajo el prefijo
sinergy-unreported-lifecycle-v1. Lifecycle pasa changedKeys explicitas; observar sin
cambios no escribe. Tras migrar, una llamada escribe solo su equipo y el manifiesto,
sin serializar los historiales de otras empresas. No se modifico storage compartido.
Lectura compatible con snapshot plano anterior. Primera escritura migra todos los
equipos una sola vez; snapshot antiguo se elimina solo tras confirmar el manifiesto.
Fallo por cuota o manifiesto conserva version anterior y memoria sin cambios. La
migracion necesita espacio temporal para copias; no elimina datos para liberar cuota.
Datos ilegibles o secciones faltantes bloquean escritura para no reemplazar historial
por estado vacio; no constituye reparacion automatica. Limpieza fallida no invalida commit.
La lectura inicial sigue cargando todos los registros; datos siguen locales, misma
cuota y no compartidos entre usuarios/dispositivos. Produccion requiere API/BD.
Pruebas cubren migracion, escrituras parciales/atomicas, permisos, recarga, fallos y
equipos no modificados sin serializar. No cambia esquema de episodios ni consultas.

# Eficiencia Punto 4: Exportacion En Worker (2026-10-16)

La vista importa unreportedExcelWorkerClient.js: prepara snapshot sin proxies Vue,
carga logo en navegador y envia datos a unreportedExcelWorker.js. Este reutiliza
createUnreportedExcelWorkbook, genera todas las hojas y comprime fuera del hilo de
interfaz; devuelve ArrayBuffer transferible y termina al recibir resultado/error.
No hay servidor ni proceso persistente. Navegadores sin Worker usan ruta anterior;
errores reales del worker se informan sin regenerar silenciosamente en interfaz.
createUnreportedExcelWorkbook acepta brandImage opcional para no acceder al DOM o
filesystem desde worker. Diagnostico de hoja de datos se calcula una vez por episodio.
Reporte historico deja de crear/ocultar columnas L:XFD: conserva A:K, margenes,
logo, textos, hojas y area de impresion. Columnas externas quedan visibles como
en reporte operativo; elimina el corte oscuro por columnas ocultas.
Snapshot/preparacion inicial y descarga siguen en interfaz; no es exportacion por
streaming y sigue requiriendo memoria proporcional al historial seleccionado.
Produccion: desplegar dist completo, incluido asset unreportedExcelWorker-*.js;
si hay CSP debe permitir workers del mismo origen (worker-src 'self').
Pruebas validan proxies anidados, ceros/IMEI, errores y cierre, buffer reabrible,
hojas/diagnosticos/llamadas y numero acotado de columnas. Sin prueba visual/browser.
# Seguimiento De Consultas Y Visitas (2026-10-19)

addConsultation admite nextCallDate, visitResult y visitDate opcionales, conservados
en cada consulta ligada al episodio. Valida fecha real: llamada hoy/futuro y visita
realizada no futura con resultado conocido. Datos opcionales ausentes son compatibles.
Guarda mediante commit existente; una visita no recupera GPS ni elimina antecedentes.
Exportacion operativa selecciona ultima consulta del episodio actual (ignora fallback
antiguo en equipos activos); hoja de datos sigue conservando todas las consultas.
Proxima llamada/resultado se agregan a Observaciones y textos de llamadas existentes,
sin nuevas columnas. Reporte historico conserva cada registro y campos de seguimiento.
# Recepcion Inicial Visible En Historial (2026-10-19)

La ruta comun de cierre de historial conserva primer reporte de equipos sin dato
previo como first_report, con inicio/duracion desconocidos y consultas vinculadas.
Incluye simulacion y observacion real de reportes. Exportadores identifican Sin
reporte previo, no una fecha supuesta; mantienen evidencia y llamadas del caso.
# Adaptador Desde Activos (2026-10-19)

unreportedAssetsSource.js transforma activos visibles en equipos de Sin reportar:
empresa desde companyId, IMEI textual, nombre/patente, direccion, icono/tipo y
timestamp explicito (o datosUlt con fecha). Hora sola no establece fecha de corte.
No toma updatedAt administrativo como reporte, no genera duracion ni diagnostico
por nombre/estado. Telemetria se conserva con fecha propia para que store aplique
sus controles de correspondencia; no equipara bateria CAN a alimentacion externa.
Sin IMEI/empresa no genera identidad inventada; duplicados empresa/IMEI se omiten.
Pruebas de alcance, datos faltantes y recuperacion con evidencia historica preservada.
# Nueva Desconexion De Demostracion (2026-10-19)

simulateDisconnection requiere allowSimulation explicito, acceso y equipo previamente
recuperado/reportando. Crea caso abierto marcado demo sin falsear fecha del ultimo
reporte; omite umbral solo en ese caso para probar sin esperar seis horas. Observe
lo mantiene hasta reporte posterior; al reconectar se cierra aun con duracion corta.
Diagnostico explicito Desconexion simulada, no causa real. Historial/consultas previos
intactos; decision actual vuelve a pendiente. Singleton habilita solo import.meta.env.DEV.
# Prueba Del Equipo 868123450009 (2026-10-19)

Prueba del adaptador usa Maquinaria forestal del catalogo actual: recuperacion,
segunda desconexion, observacion y busqueda activa por IMEI. Comprueba una fila,
un episodio terminado y otro abierto. No modifica localStorage del usuario.
# Excel Historico Con Mismo Formato Operativo (2026-10-19)

unreportedReportSheet.js delega ambos modos al generador continuous compartido.
Historial reemplaza bloques por equipo por tabla continua B6:L con una fila por
episodio cerrado. Logo centrado proporcional, titulo/fecha, fuente 12, margenes
simetricos A/M, bandas suaves, congelado 6 filas, filtros y formato de impresion
compartidos con operativo. Columnas historicas conservan inicio/retorno/duracion,
diagnostico y evidencia propios; todas las consultas del episodio van numeradas
y alineadas en llamadas/situacion/decision/observaciones, incluidos seguimiento y visita.
Primer reporte mantiene inicio desconocido. No toma diagnostico actual ni omite
consultas anteriores. Hojas de resumen/datos y worker siguen presentes. Esta entrada
reemplaza descripciones anteriores del formato historico por bloques.
# Historial Separado Por Equipo (2026-10-19)

Se conserva generador/estilo compartido con operativo, pero historial se organiza
en bloques: banda nombre/IMEI/empresa/contador, encabezados propios y filas de sus
desconexiones, con separacion de 16 pt entre equipos. No repite identidad en cada
episodio; 9 columnas B:J, margenes A/K. Mantiene fuentes grandes, logo centrado,
fecha, evidencias y todas las llamadas, visitas y proximas llamadas del caso.
Cabecera general 1:5 se repite/congela sin fijar identidad del primer equipo.
Reporte agrupado no usa filtro global que mezclaria cabeceras y casos; filtros de
hojas auxiliares siguen disponibles. Operativo permanece continuo sin cambios.
Esta entrada reemplaza la tabla plana historica documentada en la entrada anterior.
# Persona Contactada En Consultas (2026-10-19)

addConsultation guarda contactedPerson/contactedRole opcionales, recorta espacios y
valida maximos 100/80 antes de commit. author sigue siendo operador que registra,
no interlocutor. Compatible con registros anteriores sin esos campos; conserva
asociacion al episodio y guardado atomico. Formateador compartido incorpora nombre
y cargo en Observaciones/texto de llamadas de Excel operativo, historico y hojas
auxiliares, sin sumar columnas ni modificar contacto maestro de Empresas.
# Prueba De Migracion De Fixture Sin Fecha (2026-10-19)

Prueba de adaptador/lifecycle conserva consulta existente al adoptar fecha antigua
del mock, manteniendo desconexion abierta y sin una recuperacion ficticia.
# Dias De Taller

Las nuevas consultas pueden guardar `workshopDays` entero entre 1 y 3650 si estan
En taller. Se conserva compatibilidad con consultas antiguas sin plazo.

# Validacion Del Flujo De Consulta

Nuevas consultas En taller requieren dias enteros de 1 a 3650. La decision se
deriva de la situacion tambien al guardar: working -> field_review, resto pending.
Los registros antiguos siguen siendo legibles sin modificar sus datos.

# Modificacion De Consultas

editConsultation y deleteConsultation validan acceso y existencia, persistiendo antes
de actualizar memoria. Recalculan revision con la ultima consulta del caso actual;
correcciones historicas no afectan una nueva desconexion. Editar conserva autor,
fecha e interruptionId y agrega updatedAt/editedBy. Eliminar no borra la desconexion.

