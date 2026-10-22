# Unreported Utils

unreportedHistory.js administra episodios, migracion conocida, consultas por
episodio, resumen por equipo, identidades historicas y formato de duracion.
Su prueba cubre idempotencia, reincidencia, datos previos limitados y ausencia
de reportes. No fabrica interrupciones ni causas a partir de voltajes.

`unreportedFlow.js` separa etiqueta de conectividad del seguimiento humano;
no utiliza voltajes, causas ni notas para asignar el estado de comunicacion.
`unreportedFlow.test.js` cubre estos contratos.
Tambien define situaciones informadas por empresa y decisiones de visita para
usar el mismo vocabulario en validacion, formulario, listado y exportacion.
matchesConsultation filtra por ultima situacion o ausencia de consultas;
las situaciones historicas no alteran el resultado actual.
matchesSilenceDays y compareUnreportedPriority implementan los filtros simplificados
de 3/7/15 dias y el orden por necesidad de terreno, decision pendiente y no visita.
No inventan duraciones para Nunca reporto; recuperados usan fecha mas reciente.

`unreportedDiagnosis.js` transforma lecturas en etiqueta breve y valores.
Recibe voltajes estructurados y fechas del reporte y de la
medicion; parseUnreportedPower es un adaptador del texto de las filas mock.
No interpreta datos ausentes como 0 V ni muestra hipotesis de bateria/fusible/SIM.
Acepta simStatus (absent/error/pin_required), mobileRegistered,
mobileRegistration y mobileSignalDbm para mostrar fallos expresamente reportados.
gpsFixValid, gpsFix y satellites describen posicion GPS, no prueban la causa
de una interrupcion de comunicacion. La intensidad de senal sola tampoco la prueba.
Solo atribuye una condicion al ultimo reporte cuando coincide su timestamp
con el de las mediciones. Sin evidencia suficiente muestra Causa no determinada.
Los mocks actuales no aportan estados SIM/modem/GPS; no se inventan estos datos.
Sin comunicacion muestra solo SIM/red/senal, sin voltajes ni posicion GPS.
Sin campos de conexion muestra Sin datos de conexion y Causa no determinada.
Los fallos de SIM y registro movil tampoco incluyen voltajes ajenos al motivo.
Si un reporte nuevo no aporta nuevas mediciones, las
lecturas antiguas no se reutilizan como prueba de un corte actual.

Tambien distingue recuperacion, ausencia de reportes y retiro manual.
previousExternalVoltage permite mostrar valor anterior -> ultimo valor solo si
el dato anterior existe. Las filas mock actuales no tienen voltaje externo
anterior al corte; el valor habitual de bateria interna no se usa como reemplazo.
`unreportedDiagnosis.test.js` valida estos limites. Para produccion, enviar
campos de telemetria numericos y timestamps desde API, no etiquetas de texto.

# Diagnostico Historico Por Episodio

unreportedHistory.js captura telemetria solo del episodio abierto y cuando su fecha
coincide con el ultimo reporte antes del corte. La copia queda en interruptions[].telemetry.
interruptionDiagnosis usa exclusivamente esa copia; sin ella devuelve Diagnostico
no registrado. Corregir fecha por paquete atrasado invalida la copia anterior.
Consultas se relacionan por interruptionId o ventana temporal para registros legados.

# Episodios Terminados

completedInterruptions selecciona unicamente episodios con recoveredAt. La vista
historica, contador por equipo y preparacion del Excel usan esta misma seleccion,
sin borrar ni modificar los episodios abiertos del almacenamiento.

# Orden De Columnas

unreportedSorting.js compara columnas operativas e historicas: texto con Intl.Collator
es/numerico, fechas ISO y duraciones numericas. Datos faltantes al final tanto en
ascendente como descendente. Motivo historico usa solo diagnostico del episodio.
Pruebas en unreportedSorting.test.js.

# Busqueda Historica Agrupada

unreportedHistorySearch.js agrupa episodios terminados por equipo, ordena nuevos
primero y filtra por fecha de inicio (America/Santiago) con limites inclusivos.
Conserva total absoluto, contador filtrado, ultima desconexion/recuperacion del
periodo y llamadas de los episodios seleccionados. Rango invertido sin resultados.
No muta ni elimina registros originales. Probado con fechas limites y episodios
abiertos excluidos. Sorting agrega historyTotal y historyLatest para lista agrupada.

# Datos De Ejemplo Del Historial

unreportedHistoryDemo.js genera 12 equipos y 59 episodios terminados con fechas
relativas a la carga, causas variadas/repetidas, evidencia y llamadas por episodio.
Nombre (DEMO) e IMEI DEMO- separan ejemplos de datos reales. Primera ficha con ocho
episodios para probar paginacion. Datos en memoria, sin escrituras ni migracion.
Caller en UnreportedView restringe a import.meta.env.DEV y empresas autorizadas.

# Optimizacion Del Historial: Punto 1 (2026-10-16)

filterHistoryEquipment aplica empresa y busqueda antes de agrupar episodios.
countHistoryEquipment cuenta equipos con al menos un caso del periodo, sin ordenar
ni leer consultas; se detiene al primer caso valido por equipo. Rango y validez de
fechas coinciden con groupHistoryEquipment. Sin filtro de fecha no formatea cada
episodio a fecha Chile, solo valida su timestamp. Cuando hay rango sigue usando Chile.
Agrupacion selecciona consultas por Set de IDs en una pasada. Legados sin ID usan
ventanas inclusivas de fecha, preservando orden, duplicados y reglas anteriores.
No muta datos. Pruebas cubren equivalencia con selector anterior y costo de acceso.

# Consultas Por Caso Y Seguimiento (2026-10-19)

unreportedFlow.currentConsultations selecciona el episodio abierto por ID; llamadas
legacy sin ID usan rango temporal del episodio. Nunca reporto conserva consultas
sin episodio, sin inventar una fecha. No borra llamadas ni altera historial cerrado.
Filtro Sin consultar usa ese mismo alcance. localFollowUpDate trabaja en calendario
Chile; fechas de proxima llamada/visita son YYYY-MM-DD sin conversion UTC de dia.
Helpers de etiquetas y consultationFollowUpText comparten presentacion con Excel.

# Contacto De Empresa (2026-10-19)

unreportedCompanyContact.js resuelve nombre y telefono del catalogo compartido por
nombre exacto de empresa. Sin coincidencia unica muestra datos vacios, sin tomar
otro contacto. Mantiene numero visible; genera tel: solo para numeros validos.
No escribe ni duplica contactos por equipo. Pruebas de faltantes, ambiguedad y enlaces.

# Primer Reporte Sin Inicio Conocido (2026-10-19)

closeInterruption registra kind first_report cuando dispositivo activo sin reporte
previo recibe uno: recoveredAt real, lastReportAt/duracion null. Asocia consultas
sin ID anteriores a recepcion. No inventa una desconexion fechada. Historial filtra
este caso por fecha de recepcion; conserva consultas por ID y contador visible.
ensureInterruptionHistory recupera una sola vez antecedentes ya inicializados con
modo recovered, fecha de recepcion valida, duracion null y ningun episodio previo.
No modifica historiales fechados ni crea episodios para quien aun nunca reporta.

# Orden De Recuperacion (2026-10-19)

historyLatest en unreportedSorting usa lastRecoveryAt, no latestDisconnectionAt.
Asi el equipo que vuelve hoy precede a recuperaciones anteriores. Fechas ausentes
quedan al final en ambas direcciones. Prueba con fechas de corte y retorno opuestas.

# Imagen Asociada A Activos (2026-10-19)

unreportedAssetImages.js indexa activos autorizados por nombre de empresa resuelto
desde companyId e IMEI textual. Nunca vincula por nombre del vehiculo; duplicados
ambiguos no se enlazan. La vista reutiliza getAssetImageMarkerVariant de Activos,
incluyendo mapIcon y tipo configurado; sin enlace se usa icono neutro.

# Respaldo Visual Compartido (2026-10-19)

La vista usa imagen predeterminada de Activos si el indice no encuentra coincidencia;
no cambia indexado ni vincula registros demo por nombre. Neutro solo si imagen falla.

# Episodio De Demostracion (2026-10-19)

Episodio marcado demo puede abrir/cerrar sin superar umbral, con fechas reales del
reporte observado. Su diagnostico indica Desconexion simulada; cortes normales
conservan umbral y tratamiento de paquetes tardios. No retrocede reloj del equipo.

# Etiqueta De Persona Contactada (2026-10-19)

consultationContactLabel genera Hablo con: nombre (cargo), o Cargo si solo existe
ese dato; vacio para consulta antigua. consultationFollowUpText lo incluye junto
con proxima llamada/visita para exportaciones consistentes. Pruebas de opcionales.

# Fecha Antigua Recibida Al Completar Un Fixture (2026-10-19)

Primer reporte con inicio desconocido solo genera recuperacion si es reciente
respecto al umbral. Completar una fecha antigua en un activo previamente sin fecha
adopta el ultimo reporte y abre caso vigente, sin inventar reconexion historica.

# Evidencia Del Ultimo Reporte

`unreportedEvidence.js` presenta solo lecturas de alimentacion y bateria sin
coercion ni inferencia causal. La fecha corresponde solo a `telemetry.reportedAt`.
# Recuperacion Tras Sin Uso

Los casos con motivo `not_in_use` tambien se guardan, muestran y cuentan en historial
y exportaciones. La antigua marca `excludedFromHistory` se ignora para recuperar
la visibilidad de casos anteriores sin borrar consultas.

# Plazos De Taller

`unreportedWorkshop.js` calcula dias calendario desde la consulta en Chile y el
lunes de su semana de salida. Solo la ultima consulta del caso activo genera aviso.

# Filtrado Historico Por Caso

groupHistoryEquipment y countHistoryEquipment aceptan filtros de situacion,
duracion y revision por episodio. Motivo coincide con cualquier consulta del caso;
revision Si indica que se solicito en alguna consulta, No que no se solicito y hay
consulta registrada. Casos sin inicio conocido no cumplen duracion minima.

# Orden De Prioridad Offline

compareUnreportedPriority situa primero avisos de salida de taller y luego mayor
tiempo sin reportar en cada grupo. Revision en terreno, pendiente y no_visit no
modifican el orden. Duracion desconocida queda despues de conocidas; desempata nombre.

# Rendimiento De Filtros Historicos

Los filtros indexan consultas por interruptionId una vez por equipo y consulta de
historial, en lugar de recorrerlas por cada desconexion. Consultas antiguas sin id
usan indice temporal ordenado y limites inclusivos. El indice se crea solo si el
filtro necesita consultas y no se conserva entre ejecuciones para evitar datos viejos.

Benchmark reproducible: `node scripts/benchmark-unreported-history.mjs` desde frontend.
Datos sinteticos en memoria, sin acceso al storage del usuario. En esta maquina,
50000 desconexiones/150000 consultas: mediana antes 576 ms, despues 128.59 ms
(tres muestras tras calentamiento). Mide agrupacion y contador, no renderizado ni red.

# Minimo De Dias Offline

matchesSilenceDays usa >= en dias de 24 horas, permite custom entero entre 1 y 3650
y separa duraciones desconocidas sin asignarles una antiguedad artificial.

