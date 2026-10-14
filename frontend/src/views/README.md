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
- `UnreportedView.vue`: Sin reportar con listado y graficos mock, filtros, paginacion 10/20/50 y exportacion Excel de todas las filas filtradas. Sigue sin una fuente de telemetria operativa.
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

El seguimiento se separa en Sin reportar y Recuperados.
Notas (contador) abre el panel de notas del equipo: consulta y agregado con fecha
y autor. Se conserva la falla previa como primera nota y se elimina su texto
del cuerpo de la tabla; el diagnostico GPS permanece independiente.
En escritorio la altura queda acotada al contenedor: cabecera y paginacion
visibles y filas con desplazamiento independiente cuando no caben.
Filtros compactos en escritorio, sin scroll interno y con ambos botones visibles.
Panel con separacion uniforme de 14 px, controles de 36 px en escritorio y
estados de igual ancho sin saltos de linea.
Tabla con cinco equipos por pagina inicialmente y filas de al menos 80 px,
distribuidas en la altura disponible para mejorar lectura sin cortar la ultima.
Las filas respetan la altura minima del contenido al registrar fallas, con
padding vertical y ajuste de palabras; textos y responsables no invaden otra fila.
Estados en dos columnas (Nunca reporto ocupa ambas), fechas Desde/Hasta y
orden/umbral en una fila compartida; buscador con icono del sistema.
Orden y umbral alineados abajo, etiquetas en una linea; acciones de las filas
lado a lado para evitar altura innecesaria y mostrar mas equipos.
En movil se mantiene el desplazamiento de pagina.
Registrar/editar falla guarda texto, fecha y responsable sin cambiar seguimiento;
se muestra aparte del diagnostico GPS y permanece al recuperarse. Se migran los
retiros antiguos conservando su informacion; ya no hay pestaña de retiro ni reactivar.
La columna Datos al desconectarse muestra etiqueta breve y datos del motivo, sin
explicaciones largas ni hipotesis. Un voltaje anterior solo se muestra si existe;
reportes nuevos no vuelven actuales lecturas viejas.
La libreta de notas fue retirada a pedido del usuario. La recuperacion se prueba
con Simular reporte (demo), no con telemetria real. KPI y listas usan el alcance
de empresas autorizadas y los resultados del seguimiento, no conteos fijos.

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
