# Auditoria Integral Del Frontend

Fecha: 2026-11-04. Revision del estado local, incluidos cambios aun no publicados.
Esta pasada documenta hallazgos; no incorpora correcciones funcionales.

## Alcance Y Evidencia

- Barrido de 563 archivos de codigo y estilos: 136 Vue, 424 JavaScript y 3 CSS.
- Compilacion estatica de los 136 componentes y analisis sintactico de los 424 JavaScript sin errores.
- Resolucion estatica de imports locales de los 428 archivos de ejecucion Vue/JS: sin rutas faltantes.
- Identificados 132 archivos de pruebas dentro del barrido.
- Revision manual de puntos de entrada, servicios y flujos por dominio; no lectura manual linea por linea de todos los archivos.
- Reproducciones aisladas en memoria, sin modificar datos del navegador ni consultar servicios externos.
- No se ejecutaron recorridos visuales, pruebas E2E en navegador, integraciones de backend ni auditoria de vulnerabilidades de dependencias.

Por tanto, esta revision no certifica que todos los flujos o permisos funcionen en produccion.
Que las pruebas pasen no descarta los problemas descritos abajo.

## Cobertura Por Area

| Area | Revision realizada | Limite de la validacion |
| --- | --- | --- |
| Arranque y herramientas | App, entrada, scripts, Vite, ESLint e imports | Sin despliegue real ni revision de secretos |
| Autenticacion y acceso | Sesion local, impersonacion, guardas y alcance de permisos | Autenticacion mock; sin autorizacion de servidor |
| Layout y navegacion | Sidebar, header, busqueda y vistas guardadas | Sin inspeccion visual responsive |
| Empresas y Usuarios | Altas, edicion, estado, borradores y empresa/aplicacion destino | Sin concurrencia de backend |
| Activos | CRUD, normalizacion, seleccion, acciones y sincronizacion | Sin equipos reales |
| Telemetria | Identidad, alias, deduplicacion e historial | Reproduccion de mezcla entre activos |
| Mapa | Controladores Leaflet, capas, tooltips y limpieza | Sin render o ejecucion de payload en navegador |
| Geocercas | Normalizacion, altas, grupos, importacion y persistencia | Sin prueba de archivos comprimidos extremos |
| Itinerarios y rutas | Filtros, catalogo, comparacion, edicion y servicio de rutas | Sin llamadas reales a OSRM |
| Reportes | Plantillas, reglas, generacion, cancelacion y snapshots | Sin programador de trabajos de backend |
| Exportaciones | Contexto, filas, Excel, PDF, mapas, imagenes y caches | Sin validar visualmente cada archivo exportado |
| Configuracion | Limites, Etiquetas, Alertas, Variables y Ajustes avanzados | Motor de scripts pendiente de integracion |
| Bandeja de alertas | Creacion, actualizacion, atencion y resolucion | Reproduccion de guardado fallido |
| Mantenciones | Planes, OT, identidades, calculos, migracion y almacenamiento | Reproduccion de dos lectores con estado desactualizado |
| Conductores | Repositorio, transacciones, normalizacion, fotos e historial | Sin sesion IndexedDB de navegador en esta pasada |
| Sin Reportar | Fuente, identidad, ciclo de vida, consultas, historial y exportacion | Benchmark sintetico, sin worker real de navegador |
| Auditoria | Registro, persistencia estricta/no estricta y filtros | Historial local, no auditoria centralizada |
| Soporte | Almacenamiento, borradores, adjuntos y cambios de sesion | Sin servidor de tickets |
| UI compartida | Modales, confirmaciones, debounce y tareas diferidas | Comprobacion estatica, no todas las interacciones |
| Documentacion y recursos | README, bitacora, fixtures y scripts de comprobacion | No certifica exactitud visual de todos los recursos |

## Hallazgos Priorizados

P1: corregir antes de confiar en aislamiento o integridad de datos.
P2: corregir para evitar incoherencias funcionales o problemas de resiliencia.
Las rutas siguientes son relativas a `frontend/src/`.

### 1. P1 - Telemetria Mezclada Entre Activos

Estado posterior: corregido el 2026-11-04 en `useTelemetryHistory.js`, con
pruebas de regresion en `useTelemetryHistory.test.js`. La evidencia siguiente
describe el fallo previo, no el comportamiento corregido.

Ubicacion: `composables/activos/fleet/useTelemetryHistory.js`, funciones
`resolveCanonicalAssetId`, `registerAssetAliases`, `appendTelemetryReports` y `getReportsForAsset`.

Los alias incluyen patente sin descartar el valor `-`, sin tipo de identificador
ni alcance de empresa. Un alias compartido puede hacer que un segundo activo
herede el ID canonico del primero.

Reproduccion: dos activos con IDs e IMEI distintos, empresas A/B y patente `-`.
Consultar cualquiera devuelve las dos lecturas, y la segunda queda identificada
con el ID del primer activo. Puede contaminar historiales, itinerarios y reportes.

Modificar: dar prioridad al ID estable, excluir placeholders, separar tipos y
alcances de alias y rechazar asociaciones ambiguas. Agregar prueba de regresion.

### 2. P1 - Nombres Editables Llegan A HTML De Leaflet

Estado posterior: corregido el 2026-11-04. Ambos consumidores entregan un nodo
DOM con textContent mediante `plainTextTooltipContent.js`, con pruebas dedicadas.
La evidencia siguiente corresponde al estado anterior.

Ubicaciones: `composables/activos/map/geofences/useGeofenceRenderer.js:88` y
`composables/activos/map/useMapPlannedRouteEditor.js:233`.

Se entrega el nombre de geocerca/parada directamente a `bindTooltip`. La version
instalada de Leaflet asigna contenido string mediante `innerHTML`; normalizar con
String/trim no escapa HTML. Existe una ruta de riesgo de XSS almacenado desde
nombres editados o importados. No se ejecuto un exploit en navegador.

Modificar: construir contenido con `textContent` o escapar de forma centralizada;
probar nombres con etiquetas y atributos. Los tooltips de marcadores de activos
ya tienen un helper de escape que sirve como referencia local.

### 3. P1 - Alertas Operativas Confirman Guardados Fallidos

Estado posterior: corregido el 2026-11-04. El servicio publica solo despues de
persistir; atencion y reapertura de grupos usan una escritura. La UI conserva
nota/seleccion al fallar y no registra exito. Pruebas en useAlarmsService.test.js.

Ubicacion: `services/alarms/useAlarmsService.js:71`, `updateAlarm` y `resolveAlarm`.

Se modifica el estado reactivo y se ignora el resultado de persistencia.
Reproduccion con almacenamiento que lanza error: resolver devuelve `resolved`,
pero no existe escritura confirmada. Al recargar puede reaparecer pendiente.

Modificar: publicar el cambio solo tras confirmar la escritura y devolver error
al consumidor. Esto afecta la bandeja operativa, no es el mismo servicio que
las reglas automaticas de Configuracion corregidas anteriormente.

### 4. P1 - Mantenciones Puede Sobrescribir Cambios De Otra Ventana

Estado posterior: corregido el 2026-11-04 mediante comparacion de tres versiones
por registro (listas con ID y mapas de OT). Los conflictos rechazan todo el lote;
el modulo muestra aviso de conflicto. Proteccion optimista de localStorage, no
garantia transaccional entre procesos. La evidencia siguiente describe el fallo previo.

Ubicacion: `services/maintenance/maintenanceStateStorage.js:21`, `writeSections`.

El manifiesto confirma secciones completas, pero no detecta que sus registros
proceden de una lectura antigua. Leer el ultimo manifiesto no combina registros.
Reproduccion: dos lectores de planes A/B; uno modifica A y otro modifica B desde
su snapshot antiguo. El resultado conserva B nuevo y restaura A antiguo.

Modificar: detectar conflictos por version/base o combinar registros de cada
seccion antes de confirmar. La atomicidad del puntero no evita esta perdida.

### 5. P1 - Catalogo De Rutas Sin Aislamiento Por Empresa

Estado posterior: corregido el 2026-11-04. Catalogo v2 por empresa y activos
autorizados; lectura/edicion exigen itineraries/view/edit, respectivamente.
Guardado valida alcance y conserva registros ocultos. Legacy sin empresa
verificable queda intacto, no se muestra ni se asigna por suposicion.

Ubicaciones: `composables/activos/routes/usePlannedRouteCatalog.js`,
`components/activos/routes/RouteComparisonModal.vue` y consumidores de ItineraryPanel.

El catalogo usa estado global y la clave `activos.planned-routes.v1`, sin contexto
obligatorio de empresa/usuario. Los consumidores ofrecen el catalogo sin filtrar
por activos autorizados y el flujo de edicion revisado no exige permiso de escritura.
El riesgo es ver o modificar rutas de otro contexto en el mismo navegador.
Confirmado por inspeccion del flujo; no se simularon dos sesiones visuales.

Modificar: almacenar contexto estable, filtrar lectura y validar permisos/alcance
al guardar. Migrar los registros antiguos sin asignarlos arbitrariamente.

### 6. P2 - Eliminar Todas Las Rutas Restaura Ejemplos

Estado posterior: corregido junto al quinto hallazgo el 2026-11-04: el catalogo
v2 no inyecta semillas y conserva [] al guardar/recargar, con prueba de regresion.

Ubicacion: `composables/activos/routes/usePlannedRouteCatalog.js:211` y `:222`.

Reproduccion: `savePlannedRoutes([])` produce tres rutas iniciales, no un catalogo
vacio. La carga tambien confunde un array vacio valido con ausencia de datos.

Modificar: distinguir primera carga de vacio intencional. Los ejemplos deben
depender de una accion explicita, no de borrar todos los registros.

### 7. P2 - Otros Guardados Publican Exito Sin Persistencia

Estado posterior: corregido el 2026-11-05 en los cuatro caminos indicados.
Geocercas/grupos, vistas guardadas, plantillas y reglas confirman escritura antes
de publicar. Formularios y mapa conservan borradores al fallar, muestran error y
no registran exito. Claves relacionadas usan rollback de mejor esfuerzo, no una
transaccion entre ventanas ni una garantia ante cierre del proceso.

Areas: Geocercas (`useGeofences.js`), vistas guardadas (`useWorkspaces.js`),
plantillas (`useReportTemplates.js`) y reglas de Reportes (`useReportEventRules.js`).

Los caminos revisados mutan estado e ignoran el resultado de escribir. Se
reprodujo el problema con storage bloqueado en Geocercas, vistas guardadas y
plantillas; las reglas presentan el mismo patron por inspeccion estatica.
El usuario puede creer que guardo algo que desaparece al recargar.

Modificar: devolver resultado verificable, conservar borradores y mostrar error;
no registrar una operacion como confirmada antes de persistirla.

### 8. P2 - Sin Reportar Usa El Nombre De Empresa Como Identidad

Estado posterior: corregido el 2026-11-05. Clave por companyId/IMEI y autorizacion
por IDs en la vista. Migracion conserva respaldo de originales, rechaza identidades
ambiguas y no sobrescribe historiales existentes. Imagen, contacto y archivo
usan IDs; registros no atribuibles quedan conservados sin reasignacion arbitraria.

Ubicacion: `services/unreported/unreportedLifecycleStore.js:16`, `equipmentKey`;
fuente de activos y filtros de contexto asociados.

La clave combina nombre de empresa e IMEI aunque la fuente dispone de companyId.
Cambiar el nombre altera la identidad y deja historial/consultas anteriores sin
asociacion con la fila actual. Se comprobo el cambio de clave para el mismo ID e IMEI.

Modificar: usar companyId estable y migrar claves antiguas conservando el historial.
No depender del texto visible para filtrar pertenencia.

### 9. P2 - Una Peticion De Direccion Puede Bloquear La Cola

Estado posterior: corregido el 2026-11-05. Timeout de 10 segundos para fetch/JSON,
cancelacion por consumidor y presupuesto de 20 segundos para resolver un lote.
La cola continua aun si fetch ignora abort; se conserva el intervalo y la cache
no recibe resultados tardios. Exportaciones usan coordenadas de respaldo. Pruebas
con reloj controlado, sin peticiones reales ni validacion visual del proveedor.

Ubicacion: `services/location/reverseGeocodingService.js:375` y `:413`.

La cola global espera cada fetch sin timeout ni cancelacion. Si una peticion no
termina, las siguientes quedan esperando; tambien puede afectar exportaciones
que aguardan direcciones. Es un riesgo confirmado por estructura de control,
no una interrupcion de proveedor observada en esta pasada.

Modificar: timeout acotado, cancelacion y salida con coordenadas cuando falle.
Conservar el intervalo de peticiones; eliminarlo no resuelve el bloqueo.

## Verificaciones Ejecutadas

| Comprobacion | Resultado |
| --- | --- |
| `npm run test` | 595 aprobadas, 0 fallidas |
| `npm run lint` | 0 errores, 547 advertencias |
| `npm run format:check` | Falla: diferencias en 102 archivos |
| `npm run build` | Correcto, 5.68 s |
| Compilacion Vue / sintaxis JS / imports locales | Sin errores en el barrido descrito |

Benchmarks sinteticos ejecutados con los scripts existentes:

- Conductores: 10.000 registros / 9 consultas; consultas previas 151.85 ms,
  indexadas 5.88 ms; construir el indice 130.48 ms.
- Historial Sin Reportar: mediana 18.8 ms para 10.000 episodios / 30.000 consultas;
  94.05 ms para 50.000 episodios / 150.000 consultas.

Son mediciones de funciones en Node, no de FPS, memoria ni tiempo total de la app.
No hay evidencia suficiente para atribuir lentitud general a un unico modulo.

## Pendientes De Validacion

- Recorridos E2E de permisos, cambio de empresa/usuario y edicion concurrente.
- Verificacion visual desktop/mobile, modales, tablas, mapa y exportaciones.
- Fallos/cuotas de almacenamiento en navegador e IndexedDB, recarga y recuperacion.
- Red lenta, cancelaciones, servicios de mapas y direcciones no disponibles.
- Revision de dependencias, despliegue, CSP y autorizacion de servidor.
- Motor de scripts y trabajos programados: pendientes de backend; no inventar resultados.

Las correcciones anteriores siguen requiriendo sus propias pruebas. Esta pasada
encontro caminos adicionales y no permite afirmar que el proyecto este libre de errores.
