# Views

Pantallas principales conectadas al router.

## Archivos

- `SupportView.vue`: Panel de soporte en /soporte; listado filtrado/paginado,
  formulario de solicitud y detalle con conversacion, adjuntos y eventos.
  Clientes consultan empresas autorizadas; administrador de plataforma y rol
  tecnico gestionan estados/responsables/fecha dentro de su alcance. Datos locales.

- `a.html`: documentacion HTML auxiliar usada aparte por el usuario. Debe mantenerse sincronizada con los cambios grandes de arquitectura, flujos, reportes y organizacion del frontend. No eliminar sin confirmacion explicita.
- `b.html`: documentacion HTML auxiliar sobre mejora del sistema de mantenciones. No esta conectada al router y debe tratarse como informe de referencia, no como vista Vue.
- `ActivosView.vue`: vista principal de monitoreo de activos. Tambien acepta `?activoId=`, `?assetId=` o `?asset=` para seleccionar un activo desde navegacion externa, como el buscador global del header. Si la URL incluye `section=itinerarios`, `date` y `alarmId`, abre Itinerarios, selecciona el activo autorizado, genera el recorrido del dia y destaca la alerta sobre el punto GPS mas cercano. Cuando la URL trae un activo, limpia filtros visuales de busqueda/estado/ciudad/grupo y prioriza ese activo sobre el workspace guardado. El activo solo se fuerza si ya pertenece al universo autorizado por `visibleAssets`; no salta permisos. El panel lateral de Fleet incluye `Alertas` como historial por empresa y activos autorizados, con accion para abrir el recorrido del dia. El menu contextual de cada activo puede abrir `Itinerarios` dentro del mismo panel lateral, generar el recorrido del vehiculo, mostrar el resumen diario de solo ese activo o agregarlo al resumen diario actual. La accion `Agregar a resumen diario` se expone solo despues de iniciar un resumen diario, usando el estado `hasActiveDailySummary`, para evitar que aparezca antes de existir un resumen al cual sumar activos. Tambien puede navegar a `Mantenciones` con `assetId`, `patente` y `open=maintenance-detail` para abrir las mantenciones del vehiculo seleccionado. En la seccion `Geocercas`, coordina importacion/exportacion KML, KMZ, GeoJSON, CSV y XML, creacion/renombrado/eliminacion de grupos, auditoria y refresco del mapa. Los grupos se gestionan solo en el panel lateral; el editor del mapa solo los selecciona desde dropdown o deja la geocerca sin grupo.
- `AlarmsView.vue`: vista principal de alertas operativas. Toma alertas desde
  `useAlarmsService`, cruza cada alerta contra `visibleAssets` antes de
  renderizar y luego aplica filtros visuales por busqueda, estado, empresa y
  fecha. Se divide en dos paneles: `Historial`, que lista alertas ya activadas,
  y `Configuracion`, que administra reglas automaticas con tabla y modal de
  creacion/edicion. La configuracion de reglas de geocerca recibe geocercas y grupos
  reales desde `useGeofences` para aplicar por todas, por grupo o por seleccion
  especifica. En historial usa tabs superiores `Historial/Activas/Resueltas`,
  bandeja de filas a la izquierda y panel de detalle a la derecha para resolver,
  reabrir y navegar al recorrido del dia de la alerta con
  `section=itinerarios`, `activoId`, `date`, `from=alertas` y `alarmId`, sin
  exponer alertas de activos no autorizados.
- `AuditView.vue`: vista de auditoria.
- `CompanyManagementView.vue`: vista de administracion de empresas. Usa el
  layout global, cabecera simple del modulo, filtros laterales, resumen superior
  y catalogo central con tabla como vista principal. El catalogo mantiene cambio
  tabla/grilla, ordenamiento, paginacion y acceso al panel de configuracion de
  cada empresa.
- `LoginView.vue`: vista de inicio de sesion.
- `MaintenanceView.vue`: vista visual de mantenciones. Conecta router, servicio de acceso, componentes visuales y `useMaintenanceModule`; las pestanas grandes, paneles reutilizables y modal operativo viven en `frontend/src/components/maintenance`. Acepta `assetId`, `activoId`, `asset`, `patente`, `plate` o `ppu` en query para seleccionar un vehiculo; con `open=maintenance-detail` abre directamente el modal de mantenciones del vehiculo.
- `NoAccessView.vue`: vista de acceso denegado.
- `UnreportedView.vue`: Sin reportar con listado mock, filtros, paginacion 5/10/20/50 y exportacion Excel de todas las filas filtradas. Se retiro la seccion Graficos de este modulo. Sigue sin una fuente de telemetria operativa.
- `ReportsView.vue`: vista de reportes. Usa formato de biblioteca con cabecera,
  busqueda, acciones de reglas/programados/nuevo, tabs `Todos/Creados/Base`,
  filtros de categoria y orden, vista por cards como modo principal, lista
  secundaria y paginacion sin cambiar los modales ni la logica de plantillas.
  Las cards deben mantenerse compactas y mostrar solo identidad, descripcion,
  evento, estado y acciones principales para editar o ejecutar. Al ejecutar
  desde esta vista se debe reutilizar `ReportExecutionModal`, con activos
  filtrados por permisos y por la empresa actual cuando exista `empresaId` en la
  ruta, para mantener el mismo comportamiento de ejecucion que Fleet sin tocar
  `FleetReportsPanel.vue`. Para aprovechar el espacio libre, aumentar
  la cantidad visible por pagina antes que agregar paneles secundarios o inflar
  las tarjetas, pero manteniendo la paginacion visible. La grilla debe usar altura natural y `content-start`; no forzar
  `h-full` ni filas fijas en escritorio grande porque agranda las cards
  innecesariamente. Si no caben todas, es preferible scroll normal antes que
  cortar eventos, estado o accion.
- `UserManagementView.vue`: vista de administracion de usuarios. Orquesta un
  panel administrativo: topbar con buscador, KPIs filtrables sin iconos, filtros
  superiores, directorio con ordenamiento, cambio lista/cards, paginacion y
  drawer de detalle con tabs.

## Regla de mantenimiento

Sin reportar es una bandeja global de empresas autorizadas; la empresa aparece
bajo el equipo. Conectividad (Sin reportar/Nunca reporto/Recuperado) independiente
de la decision humana (Pendiente de confirmar/Revision en terreno/Sin revision
por ahora). Registrar consulta captura situacion informada por empresa y decision
de visita, observacion, fecha y autor. Recuperacion mantiene notas y consultas;
una nueva interrupcion reinicia la decision pendiente sin borrar el historial.
Notas retiradas de la interfaz: no tab, contador ni acciones; datos antiguos
conservados en almacenamiento para reversion, sin mostrar ni exportar.

Panel simple: buscador, empresa, ultima consulta, revision en terreno y tiempo
sin reportar (todos, mas de 3/7/15 dias). Ultima consulta filtra solo la situacion
del registro mas reciente, incluyendo Sin consultar. Sin fechas, orden,
conectividad ni umbral como controles operativos. Se conserva la configuracion
de umbral existente, sin modificarla. Las tarjetas aun permiten Nunca reporto.
Filtros reinician paginacion y aplican a Excel.
Exportar a Excel y Actualizar estan arriba a la derecha junto a las pestanas,
fuera de los filtros, con estados de carga y errores de exportacion visibles.
Layout segun referencia: indicadores a todo el ancho arriba; debajo filtros a
la izquierda y pestanas/acciones sobre tabla. Filas con icono de equipo, textos
mas legibles, fecha/hora separadas y cinco filas iniciales.
Columnas reutiliza useFleetColumns del proyecto: menu de checkboxes para ocultar
campos opcionales y restablecerlos; equipo/acciones bloqueados visibles. No altera
exportacion completa, consultas ni persistencia; seleccion local a esta vista.
Miniaturas usan los mismos PNG de auto/camion y criterio por nombre de Mantenciones.
Precarga/decodificacion de ambos recursos, tamaño fijo de 48 px y respaldo con
icono ante error. Son imagenes representativas, no fotos reales por IMEI.
Filas de minimo 92 px ajustadas al contenido, sin estirarse para llenar la tabla.
Con pocos resultados permanecen arriba y el espacio sobrante queda debajo.
Orden fijo: requieren terreno, pendientes por mayor tiempo conocido y finalmente
no requieren por ahora. Nunca reporto no recibe duracion inventada; dentro del
grupo va despues de los tiempos conocidos. Historial se ordena por ultima
recuperacion mas reciente. Tiempo en filas con tipografia mas visible.
KPI y contadores de secciones
respetan empresa seleccionada. Se restauro el resumen anterior con cuatro
tarjetas: Sin reportar, Pendientes de confirmar, Revision en terreno y Nunca
reporto. Pestanas Sin reportar/Historial debajo.
Revisar equipo es la unica accion de fila: Resumen (datos GPS/ubicacion/decision),
Consultas (historial de llamadas) e Historial (interrupciones del equipo). La tabla
muestra ultima consulta y decision de revision. Modal estable de 680 x 600 px maximo, acotado
a pantalla. Simular reporte (demo) solo en desarrollo y dentro del resumen.

En escritorio tabla acotada, cabecera/paginacion visibles, cinco filas iniciales
de al menos 80 px y scroll interno si no caben; filtros compactos sin scroll
interno. En movil se mantiene desplazamiento de pagina. Datos actuales mock y
persistencia local; no hay una fuente operativa global GPS conectada.
El Excel incluye todos los filtrados con conectividad, decision, GPS y consultas, sin notas.
Historial muestra una fila por equipo con cantidad de interrupciones, ultima
recuperacion y estado actual. Se conserva al volver a fallar, con buscador/empresa
como filtros principales. Ver historial abre directamente fechas, duraciones y
consultas de cada episodio. No borra ni reemplaza episodios previos.
Equipos ausentes de la fuente actual se conservan para consulta historica con
Sin dato actual; no generan nuevas incidencias ni permiten consultas actuales.
Excel de Historial tiene resumen por equipo y hoja Historial de reportes.
UnreportedView.test.js valida las variantes de cabecera sin texto suelto que
genere celdas adicionales y desplace Acciones a otra fila.

Las vistas deben orquestar componentes y composables. Si una vista crece demasiado, extraer secciones visuales a `components` y estado a `composables`.

Los modales pesados de vistas principales deben cargarse con `defineAsyncComponent`
y montarse con `v-if` solo cuando se abren. Evitar precargarlos por defecto si
contienen preview, formularios grandes, graficos, mapas o exportacion; usar
`preloadWhenIdle` solo para modales pequenos donde el primer click sea mas
importante que el costo de descarga en segundo plano.

`LoginView.vue` usa `frontend/public/login-dashboard-hero.jpg` como hero visual activo. Es una version optimizada del PNG original para bajar la carga inicial del login. La imagen se mantiene completa con `background-size: contain` y alineada a la derecha para evitar espacio negro en el borde derecho; el sobrante queda bajo la zona del formulario. El logo del login se carga desde `frontend/public/logo-sinergy.html` mediante un `iframe` dentro de `.login-logo-frame`, para usar la animacion HTML local sin duplicarla dentro de la vista; el iframe se desplaza levemente dentro del marco para compensar el margen transparente interno del SVG y alinear el borde visual del logo con el formulario. Si se cambia esa imagen o animacion, el archivo referenciado en `LoginView.vue` debe existir realmente en `public` y se debe actualizar el query de cache en `loginHeroImagePath` cuando corresponda.

Los iconos del formulario de login se fuerzan con `z-index`, color corporativo y `:deep(svg)` para mantener buen contraste dentro de los inputs oscuros, incluso cuando `SvgIcon.vue` renderiza el SVG como componente hijo. Los iconos de usuario y contrasena comparten el mismo contenedor; el SVG de usuario recibe una compensacion leve de tamano y brillo porque su arte interno pesa menos visualmente que el candado.

Cuando se actualice una vista o documentacion relacionada con el funcionamiento general del frontend, revisar si `a.html` y `frontend/docs` tambien deben reflejar el cambio.

En `a.html`, la seccion de cuellos de botella debe mostrar solo deudas vigentes; los puntos ya mitigados deben moverse a notas de mantenimiento o eliminarse de esa lista.

`AuditView.vue` usa una base gris/azul suave para reducir fatiga visual en tablas largas. La composicion superior sigue el orden filtros, KPI y tabla, apoyandose en el header global para el contexto principal de la vista. Sus controles y KPI deben mantenerse compactos para no empujar la tabla hacia abajo. Sus componentes refuerzan la identidad visual con azul corporativo en encabezados y naranjo en acciones o seleccion; el detalle de la paleta esta en `frontend/src/components/audit/README.md`. La vista pagina la tabla en bloques de 150 registros sin afectar filtros, KPI ni exportacion CSV. Tambien filtra por accion, por rango de fechas `Desde`/`Hasta` de forma inclusiva por dia completo y permite buscar fechas desde la barra general con formatos comunes.

## Mantenciones Vigentes

`MaintenanceView.vue` muestra Flota, Analisis y Ordenes. Los codigos internos
overview/costs/orders no representan pestanas Resumen/Costos antiguas.
El estado operativo persiste por secciones en localStorage; las evidencias
viven en IndexedDB. No hay backend, correo ni automatizacion externa.

El tipo define Odometro, Horometro o Tiempo. Crear y editar planes comparten
formulario; crear plan no crea OT. Una OT finalizada conserva cierre, lectura,
responsable y costos, y deja el plan vinculado Sin renovar. Renovar confirma
el siguiente ciclo y permite editar antes. La tabla y el detalle deben ofrecer
acciones consistentes para el mismo estado.

Flota exporta PDF/Excel desde un modal de filtros y seleccion, incluyendo
solo planes coincidentes. Historial vive dentro del detalle del vehiculo:
filtra y pagina ejecuciones finalizadas; Exportar historial descarga todas
las filas filtradas mediante un menu Excel/PDF, sin otro modal.
El header de Historial sustituye Agregar mantencion/Nuevo tipo por Exportar
historial; el pie del detalle solo muestra Cerrar.

Analisis usa OT finalizadas con fecha de cierre para costos y ejecuciones
con fecha limite para cumplimiento. Los planes actuales alimentan vencimientos;
no confundir esos conteos con historicos de ejecucion.
Los fixtures siguen activos; el modulo completa aproximadamente 10 vehiculos
si la fuente contiene menos, sin eliminar activos reales adicionales.

Consultar los README de components/maintenance, composables/maintenance,
services/maintenance, utils/maintenance y fixtures para contratos y limites.

`UserManagementView.vue` bloquea el filtro de empresa cuando entra desde
`/app/:empresaId/usuarios`, para mantener el contexto del panel de Fleet. El
layout se divide en topbar/KPIs, filtros, directorio y detalle con tabs. El
directorio permite ordenar, paginar y cambiar entre lista y cards sin modificar
el resultado filtrado ni la apertura del drawer. El detalle visual del modulo
esta documentado en `frontend/src/components/users/README.md` y la logica de
filtros en `frontend/src/composables/users/README.md`.
# Historial Simplificado (2026-10-15)

Historial muestra una fila por interrupcion: equipo/empresa, dejo de reportar,
volvio a reportar y duracion. Los episodios abiertos indican Sigue sin reportar.
Busqueda por equipo/IMEI y empresa, orden mas reciente primero; contador de
interrupciones registradas junto al equipo. Sin estados de seguimiento, consultas
ni modal intermedio en esta vista. Sin reportar conserva Revisar equipo y llamadas.
Exportar deduplica equipos para no duplicar episodios en el Excel existente.
La fecha inicial corresponde al ultimo reporte conocido, no a una falla fisica comprobada.
# Vista Simplificada Para Lectura (2026-10-15)

Equipos sin reportar conserva casos actuales y orden por urgencia. Historial de
desconexiones muestra solo episodios recuperados; los abiertos no se eliminan del
almacenamiento, simplemente siguen en la vista operativa. Excel historico tambien
excluye abiertos y deduplica equipos antes de construir las hojas.
Filtros principales: buscar, empresa y tiempo sin reportar. Consultas y decision
de visita permanecen bajo Mas filtros, cerrado inicialmente y con aviso de filtros
aplicados. Quitados indicadores superiores y selector de columnas. Texto mayor,
datos de equipo sin truncamiento y foco visible para controles. Llamadas intactas.
Las secciones anteriores describen iteraciones previas; esta entrada las reemplaza.
# Motivos Por Interrupcion (2026-10-15)

Historial conserva una fila por episodio terminado y agrega diagnostico GPS propio
y llamadas de ese episodio desplegables. No utiliza la telemetria actual para
explicar desconexiones anteriores. Historial (N) junto a Revisar equipo abre todos
los episodios del equipo, incluido el abierto. Sin diagnostico guardado indica
Diagnostico no registrado; no reconstruye fechas o causas inexistentes.
# Unico Acceso Al Historial (2026-10-15)

Historial de desconexiones es el unico acceso al historial. Se elimina el enlace
Historial (N) de cada fila. Fechas, duracion, diagnostico y llamadas por episodio
permanecen en la tabla historica. No se modifica almacenamiento ni exportaciones.
Revisar equipo abre solo Resumen y Consultas, sin pestaña historica duplicada.
Esta entrada reemplaza las referencias anteriores al acceso Historial de cada fila.
# Contador Coherente Del Historial (2026-10-15)

Cada equipo indica desconexiones terminadas, usando exactamente los episodios que
se muestran en la tabla. El episodio abierto no suma en ese contador; si el equipo
esta activo y presente en la fuente se muestra Actualmente sin reportar por separado.
Vista y exportacion comparten completedInterruptions para seleccionar terminados.
# Orden Desde Encabezados (2026-10-15)

Encabezados pulsables en ambas tablas, salvo Acciones. Ciclo ascendente,
descendente y orden original; flecha y aria-sort indican el orden elegido.
Orden inicial operativo por urgencia e historico por fecha mas reciente conservados.
Al cambiar pestaña o limpiar filtros se restaura ese orden; ordenar reinicia pagina.
Se ordenan todas las filas filtradas antes de paginar y exportar, no solo las visibles.
Comparacion pura en utils/unreported/unreportedSorting.js con fechas/numeros reales
y datos ausentes al final en ambos sentidos. No requiere levantar otro servidor.
# Buscador Historico Por Equipo (2026-10-15)

Historial ahora lista una fila por equipo: cantidad de desconexiones terminadas,
ultima desconexion y Ver desconexiones. Busqueda por nombre/patente/IMEI y empresa.
Filtro fecha inicial de desconexion en Chile: Todo el historial (inicial), ultimos
30/90 dias o rango inclusivo; intervalo invalido muestra error y ningun resultado.
groupHistoryEquipment agrupa sin borrar originales y deja solo episodios/llamadas
del periodo; total encontrado y total absoluto diferenciados. Exportacion usa el
periodo actual y, dentro de ficha, solo el equipo seleccionado.
Ficha inline UnreportedHistoryDetail con fechas, duracion, diagnostico y llamadas,
ordenamiento y paginacion independientes. Volver a resultados conserva busqueda,
orden y pagina del listado; cambiar filtros vuelve al listado.
No se agrega otro acceso al historial en Revisar equipo. Sin reportar sin cambios.
Persistencia local: escala productiva requiere API paginada y busqueda de servidor.
Esta entrada reemplaza la lista anterior de una fila por episodio.
# Botones De Fila (2026-10-15)

Revisar equipo y Ver desconexiones usan row-action-button: texto en una linea,
centrado flex, altura estable 44 px, padding horizontal 12 px y peso 700.
Columna de acciones operativa de 160 px evita saltos del texto. Prueba de plantilla
y estilos cubre este ajuste. No modifica acciones ni almacenamiento.
# Ejemplos Para Probar Historial (2026-10-15)

En desarrollo se agregan en memoria 12 equipos (DEMO) con 59 episodios, en las tres
empresas mock existentes y respetando permisos. No entran a la tabla Sin reportar
ni al lifecycle store: no reemplazan ni escriben registros del usuario. Se suman
solo al origen del buscador historico. JSFG-74 (DEMO) tiene ocho casos para paginar.
Produccion no agrega estos equipos. Exportaciones conservan marcadores DEMO.
# Tablas Al Reducir La Ventana (2026-10-15)

Equipos e historial comparten scroll vertical/horizontal para cabecera y filas,
sin incluir la paginacion. Columnas fr usan minmax(ancho minimo,fr); ancho minimo
de contenido suma columnas, separaciones y padding, evitando compresion excesiva.
Filas usan flujo de bloques, altura automatica y minimo 92 px, sin pistas de grid
que puedan resultar menores que texto envuelto. Footer adapta controles en varias
lineas si falta espacio. Contenedor raiz conserva altura acotada en todos los anchos.
Debajo de 1280 px, filtros plegados con Mostrar/Ocultar filtros, sin perder valores;
al abrir ocupan una banda con altura maxima y scroll propio, no quitan ancho a tabla.
Pruebas verifican minimo de columnas, flujo y paginacion fuera del scroll.
Esta entrada reemplaza las indicaciones anteriores de filas grid-auto-rows.
# Limpiar Filtros Sin Icono

El boton Limpiar filtros muestra solo texto, sin X. Su accion no cambia.
# Error Al Exportar Historial Corregido

Preparacion de filas movida a prepareUnreportedExcelRows del servicio. Se ejecuta
dentro del try/finally del boton: errores durante preparacion o importacion tambien
restauran isExporting y muestran alerta. No requiere diagnostico actual para equipos
historicos/DEMO; se conserva evidencia propia de cada episodio en el detalle Excel.
# Contexto Del Excel Formateado

Exportar captura empresa, busqueda, fechas y ancho disponible antes de la importacion
asincrona. El reporte principal nuevo muestra ese contexto y conserva seleccion de
equipo/periodo. Sin cambios a filtros, orden, navegacion ni almacenamiento.
# Ancho Del Reporte Para Excel

El contexto de exportacion toma screen.availWidth (fallback innerWidth), con minimo
de 1800 px. Evita que exportar desde navegador estrecho reduzca la tabla al abrir
Excel maximizado. No afecta tamano ni comportamiento de las tablas de la pagina.
# Ancho Completo Para Margenes Del Excel

Punto 5 (2026-10-16): Actualizar elimina la espera artificial de 800 ms. Usa solo
nextTick para aplicar estado de boton ocupado antes de recalcular datos locales;
previene doble ejecucion y libera estado con finally. Limpia avisos anteriores y
muestra Listado actualizado solo si observeReports no informo error. No consulta
API ni solicita telemetria al GPS. Monitoreo automatico de 60 segundos sin cambios.
Prueba ejecuta handler con dependencias controladas: exito, error, doble clic y
liberacion incluso ante excepcion inesperada; no usa temporizadores reales.

Desde punto 4 (2026-10-16), UnreportedView carga unreportedExcelWorkerClient.js
para exportar: mismo contexto/filtros y try/finally; generacion/compresion en worker
temporal. No inicia servidores. Preparacion inicial de filas sigue en interfaz.

El contexto envia screen.availWidth (fallback innerWidth) sin descontar 48 px.
El exportador ya reserva sus margenes internos simetricos; descontarlos de nuevo
dejaba un sobrante mayor a la derecha. Minimo 1800 px conservado.
# Optimizacion Del Historial: Punto 1 (2026-10-16)

historySourceRows conserva metadata/records autorizados sin depender del reloj ni
preparar diagnosticos actuales. Contador de pestaña usa countHistoryEquipment por
empresa/periodo, sin invocar historyRows. Igual que antes, ese contador no depende
de busqueda textual. historyRows retorna vacio fuera de Historial; dentro filtra
empresa/busqueda antes de agrupar. Evita repetir esos filtros despues de agrupar.
trackedRows ya no recorre interrupciones para calcular resumen de recuperaciones
en cada refresco; esa informacion se prepara al exportar. Sin cambios visuales,
de permisos, datos, paginacion o persistencia. No abarca los puntos 2 a 5 del analisis.
# Seguimiento Del Caso Actual (2026-10-19)

trackedRows usa currentConsultations para ultima consulta, responsable y filtros.
No hereda la llamada de una desconexion terminada al abrir otra. Ultima consulta
muestra proxima llamada y resultado de visita cuando existen. Fecha de llamada
hoy/vencida se marca Llamada pendiente en rojo; no hay notificaciones automaticas.
Estructura de pagina, filtros y prioridad previos conservados. Historico sin borrar.
# Contacto Compartido De Empresa (2026-10-19)

Revisar equipo recibe operationCompanyContact calculado reactivamente desde
companyRecords de useCompaniesService. Solo consulta empresa autorizada del equipo
seleccionado. Cambios de Empresas se reflejan sin crear copias en lifecycle.
# Simulacion Abre El Caso Recuperado (2026-10-19)

Simular reporte verifica recepcion, limpia errores previos y filtros historicos,
busca por IMEI/empresa y abre directamente la ficha tras nextTick para que watchers
no borren seleccion. Conserva aviso de demostracion. Errores no muestran exito.
# Historial Por Recuperacion Reciente (2026-10-19)

Listado historico ordena por lastRecoveryAt descendente: quien volvio a reportar
mas recientemente va primero aunque su corte empezara antes. Columna Volvio a
reportar muestra esa misma fecha y ordena por ella. Orden manual sigue disponible;
simular reporte restablece orden predeterminado. Filtros y paginacion sin cambios.
# Imagenes Iguales A Activos (2026-10-19)

Sin reportar consulta activos de useActivosService y usa el mismo selector visual
del mapa de Activos. Indice reactivo por empresa/IMEI, precarga fuentes configuradas
y mantiene fallback neutro ante falta de activo o error de imagen. No deduce camion
por nombre. Registros demo sin correspondencia real no reciben imagen inventada.
# Respaldo Visual Para Registros No Vinculados (2026-10-19)

Sin coincidencia empresa/IMEI, usa imagen predeterminada del selector de Activos,
tambien precargada. Icono neutro solo ante fallo real de imagen. No afirma vinculo
real para registros demo; cuando existe activo coincidente respeta su configuracion.
Esta entrada reemplaza el fallback neutro por ausencia de activo indicado antes.
# Origen Actual De Sin Reportar (2026-10-19)

Se elimina sourceRows fijo y la inyeccion de createDemoHistoryEquipment en historial.
sourceEquipment usa visibleAssets y accessibleCompanies de control de acceso,
adaptados por buildUnreportedEquipment. Nombre, patente, IMEI, ubicacion, tipo,
icono y ultimo reporte provienen del catalogo actual de Activos, reactivamente.
Registros previos no se borran; equipo ausente queda archivado y fuera de bandeja
actual. Historial archivado solo se incorpora para administrador de plataforma,
evitando exponer equipos no visibles a usuarios con alcance por activo.
Horas sin fecha no se convierten a hoy. Offline sin fecha muestra Fecha de reporte
desconocida; activos con solo hora y estado no offline no se declaran desconectados
ni se observan como incidencia. Un timestamp fechado permite calculo normal.
Fuente sigue siendo servicio del emulador, no una nueva conexion GPS/backend.
# Simular Reincidencia (2026-10-19)

Desde ficha de historial, boton demo abre segundo caso y muestra bandeja filtrada
por empresa/IMEI. El antecedente terminado no desaparece; nueva recuperacion genera
segunda entrada terminada. Simulacion requiere accion del usuario en su navegador.
# Consulta Con Interlocutor (2026-10-19)

Contrato de formulario probado: persona/cargo opcionales, limites 100/80 y presencia
en modal/historial. La vista pasa payload a addConsultation existente sin alterar
contacto de empresa, autor del registro, permisos, filtros o columnas de tabla.
# Formulario Sin Programacion De Llamada (2026-10-19)

Contrato probado exige ausencia del editor nextCallDate y boton Llamar manana.
Solo se retiran controles de nuevas consultas; antecedentes existentes compatibles.
# Tabla Sin Conectividad Redundante

Equipos sin reportar omite la columna Conectividad. El ancho minimo y la grilla
compartida se calculan para las seis columnas restantes. El estado se conserva
en el resumen de Revisar equipo; no cambia la deteccion ni el historial.

# Prioridad De Salida De Taller

Desde el lunes de la semana de salida estimada, casos activos con ultima consulta
En taller aparecen primero dentro de los filtros actuales. Se indica Pronto a salir
de taller o Fecha estimada de salida cumplida. No altera la pestaña de historial.

# Filtros Adicionales Del Historial

Mas filtros ofrece motivo informado, duracion superior a 1/3/7/15 dias y revision
en terreno. Se aplican por desconexion y se conservan en detalle y exportacion;
limpiar reinicia todo. Sin consulta no se considera decision de no visitar.

# Empresas Con Equipos Sin Reportar

En la pestaña activa el selector incluye solo empresas autorizadas con casos
activos sin reportar, sin depender de busqueda u otros filtros. Historial conserva
sus empresas. Una seleccion sin opciones vigentes vuelve a Todas las empresas.

# Umbral De Tiempo Sin Reportar

Selector Sin reportar desde hace con minimos inclusivos de 1/3/7/15 dias, plazo
personalizado entero de 1 a 3650 dias y Sin fecha conocida. No altera orden de
prioridad. Limpiar restablece el plazo y la exportacion describe el filtro aplicado.

# Mantenciones: Conductores

Pestana Conductores cargada bajo demanda y remontada al cambiar de empresa para
aislar formularios, archivos y registros. No muestra controles de planes/OT en
esta pestaña. Mantiene el resto de vistas y flujos de mantenciones sin cambios.

# Carga De Mantenciones

Analisis, ordenes, calendario, historial y conductores se cargan bajo demanda con
placeholder y precarga al enfocar/apuntar una pestaña. Conductores se conserva
solo para la empresa actual con KeepAlive max=1. Bundle MaintenanceView medido
antes 137499 bytes JS, despues 94982 bytes (sin comprimir; vistas separadas aparte).

# Navegacion De Conductores

Flota, Analisis, Ordenes y Conductores se cargan con MaintenanceView para evitar
espera de importacion y placeholder al abrirlas. Calendario e historial conservan
su carga bajo demanda.

MaintenanceView sincroniza la pestana con query.tab. Cambiar empresa desde
Conductores mantiene esa pestana y elimina el contexto de activo anterior.

