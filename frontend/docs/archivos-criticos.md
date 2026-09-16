# Archivos criticos del frontend

Estos archivos no son necesariamente los mas largos, sino los que mas impacto tienen si cambian mal.

## Autenticacion y permisos

### `frontend/src/composables/auth/useAuthSession.js`

Responsabilidad:

- Mantener usuario autenticado.
- Manejar login/logout.
- Manejar suplantacion.
- Calcular usuario efectivo.
- Registrar auditoria de sesion.

Funciones criticas:

- `login`
- `logout`
- `startImpersonation`
- `stopImpersonation`
- `clearSession`
- `recordAuthAudit`

Riesgo:

- Puede dejar usuarios con rutas incorrectas o permisos visuales equivocados.

Cuando modificar:

- Cambios de flujo de login.
- Nuevas reglas de sesion.
- Cambio de impersonacion.

### `frontend/src/composables/auth/useAccessControl.js`

Responsabilidad:

- Decidir empresas visibles.
- Decidir modulos y funciones disponibles.
- Filtrar activos segun alcance.
- Aplicar etiquetas de acceso como restriccion real de visibilidad de activos.

Funciones criticas:

- `canAccessCompany`
- `canAccessModule`
- `canAccessFunction`
- `accessAllowsAsset`
- `visibleAssets`

Riesgo:

- Un error aqui puede mostrar datos de una empresa o activo que no corresponde.

Regla:

- La cadena correcta es permisos/etiquetas de acceso -> `visibleAssets` ->
  filtros visuales de ciudad o grupos de vehiculos. Los grupos de vehiculos no
  deben entregar ni quitar permisos.

### `frontend/src/composables/search/useGlobalSearch.js`

Responsabilidad:

- Construir resultados del buscador global.
- Aplicar filtro por tipo antes del limite global.
- Exponer solo rutas permitidas para empresas, activos, reportes, usuarios,
  auditoria y espacios.

Funciones criticas:

- `useGlobalSearch`
- `globalSearchResults`
- `globalSearchGroups`
- `primaryGlobalSearchResult`

Riesgo:

- Si filtra solo en el componente, una busqueda por empresas o activos puede
  perder resultados validos por el limite de resultados de `Todo`.
- Si no usa `visibleAssets` y permisos de modulo, puede mostrar rutas que el
  usuario no deberia abrir.

## Datos mock y servicios

### `frontend/src/composables/mock/useMockDatabase.js`

Responsabilidad:

- Simular base de datos local.
- Normalizar empresas, usuarios, accesos y activos.
- Persistir cambios del prototipo.

Funciones criticas:

- `readPersistedDatabase`
- `persistDatabase`
- `schedulePersistDatabase`
- `normalizeCompany`
- `normalizeAsset`
- `normalizeUser`
- `normalizeAccess`
- `createCompany`
- `createUser`
- `createAccess`
- `createAsset`
- `updateAsset`
- `createAssetTag`
- `updateAssetTag`
- `deleteAssetTag`

Riesgo:

- Como centraliza el mock, cualquier cambio puede afectar varios modulos.

Regla:

- No agregar logica visual aqui. Solo datos y normalizacion.
- Si se agregan empresas o aplicaciones, los usuarios `isPlatformAdmin` deben
  conservar acceso total normalizado.

### `frontend/src/services/storage/browserStorage.js`

Responsabilidad:

- Leer, escribir y borrar storage de forma segura.
- Leer y escribir JSON con fallback.

Funciones criticas:

- `readStorageValue`
- `writeStorageValue`
- `removeStorageValue`
- `readJsonStorage`
- `writeJsonStorage`

Riesgo:

- Si se rompe, fallan workspaces, auditoria, mocks y preferencias.

## Activos y telemetria

### `frontend/src/views/ActivosView.vue`

Responsabilidad:

- Orquestar la pantalla principal de monitoreo.
- Conectar flota, mapa, geocercas, itinerarios, rutas, reportes y workspaces.

Riesgo:

- Es una vista controladora. Cambios grandes deben extraerse a composables para no aumentar el acoplamiento.

Cuando modificar:

- Conectar nuevos paneles.
- Cambiar flujo general de la vista.
- Integrar nuevos eventos globales de activos.

### `frontend/src/components/Layout/HeaderFleetAssetFilterMenu.vue`

Responsabilidad:

- Centralizar filtros visuales de ciudad y grupos de vehiculos para Activos.
- Crear, eliminar y asignar vehiculos a grupos organizativos.
- Trabajar solo con activos ya autorizados por permisos/etiquetas.

Riesgo:

- Si este menu vuelve a mezclarse con permisos o con empresas, se pierde la
  separacion entre organizacion de flota y alcance real de usuarios.

### `frontend/src/utils/activos/assetVehicleGroupUtils.js`

Responsabilidad:

- Construir grupos de vehiculos desde definiciones propias del modulo.
- Recortar `assetIds` contra el arreglo autorizado recibido.
- Evitar que campos legacy de activo o sucursal creen permisos implicitos.

Funciones criticas:

- `createVehicleAssetGroups`
- normalizadores de IDs de grupo y activos

Riesgo:

- Un grupo nunca debe incorporar activos fuera del universo autorizado. Si lo
  hace, el filtro visual puede convertirse en fuga de datos.

### `frontend/src/composables/activos/view/useActivosTelemetrySync.js`

Responsabilidad:

- Separar telemetria viva del mapa y snapshot amortiguado de tabla.
- Coordinar mock telemetry con visibilidad de pestaña.
- Mantener historial para reportes.

Funciones criticas:

- `handleTelemetryBatch`
- `scheduleTableActivosSync`
- `flushTableActivosSync`
- `syncTableActivosIncrementally`
- `cleanupTelemetrySync`

Codigo mental:

```js
batch -> onTelemetryBatch(map)
batch -> appendTelemetryPulses(terminal)
batch -> appendTelemetryReports(history)
batch -> scheduleTableActivosSync(table)
```

Riesgo:

- Si la tabla se sincroniza demasiado seguido, se laguea.
- Si no se limpian timers/listeners, quedan procesos vivos.

### `frontend/src/composables/activos/fleet/useTelemetryHistory.js`

Responsabilidad:

- Guardar historial limitado por activo.
- Entregar eventos a reportes.

Funciones criticas:

- `appendTelemetryReports`
- `getReportsForAsset`

Riesgo:

- Si el historial se corta mal, los reportes pierden datos.

## Mapa

### `frontend/src/composables/activos/map/useActivosMap.js`

Responsabilidad:

- Inicializar y controlar Leaflet.
- Coordinar capas de activos, geocercas, itinerarios y trazas.

Funciones criticas:

- `useActivosMap`
- controladores internos de montaje y limpieza.

Riesgo:

- Listeners o capas sin limpiar generan bugs visuales y consumo de memoria.

### `frontend/src/composables/activos/map/useMapAssetMarkers.js`

Responsabilidad:

- Crear, actualizar y eliminar marcadores.
- Aplicar telemetria incremental.
- Coordinar cache, iconos, tooltips y clusters.

Funciones criticas:

- `createAssetMarkerController`

Riesgo:

- Recrear markers completos por cada pulso degrada el mapa.

### `frontend/src/composables/activos/map/assetMarkers/assetMarkerClusters.js`

Responsabilidad:

- Agrupar marcadores segun zoom y viewport.

Funciones criticas:

- `createAssetMarkerClusterController`

Riesgo:

- Mucho clustering oculta detalle; poco clustering causa lag.

## Geocercas

### `frontend/src/composables/activos/geocercas/useGeofences.js`

Responsabilidad:

- Persistir geocercas y grupos de geocercas por empresa en el prototipo.
- Normalizar circulos, poligonos, rutas, colores y grupos.
- Crear, actualizar, eliminar, importar y renombrar grupos sin borrar zonas.

Funciones criticas:

- `useGeofences`
- acciones de crear, actualizar, eliminar e importar geocercas
- acciones de crear, renombrar y eliminar grupos de geocercas

Riesgo:

- Borrar un grupo debe dejar las geocercas como `Sin grupo`, no eliminarlas.
- Si una importacion solo parsea pero no persiste, la UI dira que leyo el
  archivo sin agregar nada al mapa.

### `frontend/src/utils/geofenceImportExportUtils.js`

Responsabilidad:

- Convertir geocercas desde y hacia KML, KMZ, GeoJSON, CSV y XML.
- Soportar XML flexible, KML con extension `.xml`, GPX, WKT y grupos GpsGate.
- Preparar archivos exportables por uno, varios o todos los grupos visibles.

Funciones criticas:

- `parseGeofenceImportFile`
- `parseGeofenceImportFileAsync`
- `buildGeofenceExportFile`
- `buildGeofenceExportFileAsync`
- importadores/exportadores por formato

Riesgo:

- El orden de coordenadas cambia por formato. Mezclar lat/lng con lng/lat puede
  dibujar zonas en otro lugar.
- KMZ es KML comprimido; no tratarlo como texto plano.

## Mantenciones

### `frontend/src/composables/maintenance/useMaintenanceModule.js`

Responsabilidad:

- Orquestar resumen, ordenes de trabajo, calendario, historial, costos,
  seleccion de vehiculo y modal operativo de mantenciones.
- Mantener acciones locales del prototipo en refs temporales.
- Distinguir mantencion como plan y OT como ejecucion concreta.

Funciones criticas:

- apertura/cierre de modales de mantencion y OT
- creacion/edicion/eliminacion de planes manuales
- creacion/reprogramacion/asignacion/cancelacion/cierre de OT
- registro de costos y seleccion de vehiculo

Riesgo:

- Crear una mantencion no debe crear una OT automaticamente.
- No presentar acciones locales como persistencia real de backend.

## Alertas

### `frontend/src/views/AlarmsView.vue`

Responsabilidad:

- Orquestar el modulo de alertas.
- Aplicar alcance real desde `visibleAssets`.
- Conectar filtros, resumen, tabla, detalle y acciones de estado.
- Navegar a Itinerarios con `section=itinerarios`, `activoId`, `date` y
  `alarmId` para revisar el recorrido del dia de la alerta.
- Alternar entre historial de alertas ocurridas y configuracion de reglas
  automaticas sin mezclar ambos flujos.
- Entregar geocercas y grupos desde `useGeofences` al panel de configuracion
  para que las reglas de tipo geocerca usen selecciones reales.

Riesgo:

- Si se filtra por empresa sin cruzar contra activos autorizados, un usuario
  podria ver alertas de vehiculos fuera de sus etiquetas de acceso.
- La navegacion al recorrido debe seguir validando el activo en `ActivosView.vue`
  y no confiar solo en los parametros de URL.

### `frontend/src/utils/alarms/alarmUtils.js`

Responsabilidad:

- Construir filas de alerta desde alertas, activos y empresas.
- Recortar alertas contra activos autorizados.
- Aplicar filtros visuales, orden y resumen.

Funciones criticas:

- `getAuthorizedAlarmRows`
- `filterAlarmRows`
- `sortAlarmRows`
- `buildAlarmSummary`

Riesgo:

- El orden correcto es `visibleAssets` primero y filtros despues. No usar
  `companyId` como unica condicion de visibilidad.

### `frontend/src/services/alarms/useAutomaticAlertRulesService.js`

Responsabilidad:

- Persistir reglas automaticas mock en `localStorage`.
- Crear, actualizar, activar/pausar y eliminar reglas.

Riesgo:

- No debe crear alertas directamente. La evaluacion real de condiciones pertenece
  a backend/telemetria.

### `frontend/src/utils/alarms/automaticAlertRuleUtils.js`

Responsabilidad:

- Normalizar reglas automaticas.
- Resolver empresa, activos afectados, etiquetas de acceso, horario,
  notificaciones y resumen.
- Filtrar y ordenar reglas dentro del alcance disponible.

Riesgo:

- Las reglas automaticas deben mantenerse separadas de permisos reales. Definen
  condiciones operativas, no acceso a activos.
- Las reglas de geocerca deben guardar alcance estructurado (`all`, `group` o
  `specific`) y no volver a texto libre.

## Reportes

### `frontend/src/composables/reports/useReportTemplates.js`

Responsabilidad:

- Manejar plantillas base y custom.
- Sincronizar plantillas con reglas.
- Permitir crear, editar y eliminar.

Funciones criticas:

- `useReportTemplates`
- `createReportTemplate`
- `updateReportTemplate`
- `deleteReportTemplate`
- `mergeStoredDefaultTemplate`

Riesgo:

- Las plantillas base deben poder modificarse/eliminarse sin perder compatibilidad con seeds.

### `frontend/src/composables/reports/useReportEventRules.js`

Responsabilidad:

- Manejar reglas de evento que componen reportes.
- Normalizar condiciones, calendarios, activacion y notificaciones.

Funciones criticas:

- `useReportEventRules`
- `createEventRule`
- `updateEventRule`
- `deleteEventRule`

Riesgo:

- Si una regla queda mal normalizada, puede dejar de generar reportes o generar demasiados.

### `frontend/src/utils/reports/event-rules/reportEventRuleEngine.js`

Responsabilidad:

- Evaluar si un evento/reporte cumple una regla.

Funciones criticas:

- `doesReportMatchEventRule`
- `doesReportMatchEventRules`
- `compareCondition`
- `doesRuleApplyToSchedule`
- `doesRuleApplyToGroup`

Codigo mental:

```js
rule active
  && group matches
  && schedule matches
  && default signal matches
  && all conditions match
```

Riesgo:

- Es core del comportamiento de reportes. Cambiar `some`/`every`, horarios o señales cambia resultados.

### `frontend/src/composables/reports/useAssetReportExecution.js`

Responsabilidad:

- Ejecutar reportes sobre activos seleccionados.
- Capturar snapshots reactivos.
- Procesar por lotes.
- Exportar Excel/PDF desde las mismas filas.

Funciones criticas:

- `executeReport`
- `exportExcel`
- `exportPdf`
- `resetExecution`
- `toggleAsset`

Codigo mental:

```js
if canExecuteReport:
  snapshot inputs
  process assets in batches
  build rows
  replace reportRows
```

Riesgo:

- Si no usa snapshots, cambios de UI durante ejecucion pueden mezclar resultados.
- Si no usa lotes, puede congelar UI.

### `frontend/src/utils/reports/export/assetReportExportUtils.js`

Responsabilidad:

- Orquestar exportacion PDF/Excel de reportes de activos desde las mismas filas
  ejecutadas.
- Mantener mapa, metricas, branding y columnas seleccionadas alineadas con la
  vista previa.
- Abrir Excel en una hoja `Reporte` tipo informe y dejar el detalle completo en
  hojas auxiliares para analisis.

Funciones criticas:

- `exportAssetReportExcel`
- `exportAssetReportPdf`
- `createAssetReportExcelWorkbook`

Riesgo:

- Excel debe conservar todas las columnas seleccionadas.
- PDF debe mantener legibilidad: columnas principales en la tabla visible y el
  resto en `Detalle adicional`.

### `frontend/src/services/itinerarios/itineraryExportService.js`

Responsabilidad:

- Construir PDF/Excel de itinerarios y reportes compatibles con el layout
  corporativo.
- Ordenar la hoja principal de Excel como la vista previa: datos generales,
  resumen, mapa, graficos y tablas.
- Separar columnas adicionales de PDF cuando no caben legibles.

Funciones criticas:

- `exportItineraryPdfReport`
- `createItineraryExcelWorkbook`
- helpers internos de `Detalle adicional`

Riesgo:

- Si PDF y Excel no usan el mismo dataset, el usuario vera menos datos en un
  formato sin entender que las columnas restantes siguen disponibles.
- Si el inyector de graficos nativos no reutiliza dibujos existentes, un Excel
  con mapa y graficos puede quedar sin graficos o fallar al exportar.

### `frontend/src/utils/reports/execution/assetReportExecutionUtils.js`

Responsabilidad:

- Construir filas finales de reporte.

Funciones criticas:

- `buildAssetReportRows`
- `buildAssetReportRowsFromHistory`
- `buildGeofenceRuleRows`
- `buildIdleRuleRows`
- `createReportColumns`

Riesgo:

- Es punto de consistencia entre preview, PDF y Excel.

### `frontend/src/utils/reports/execution/assetReportTripUtils.js`

Responsabilidad:

- Convertir historial en viajes.

Funciones criticas:

- `buildRouteHistoryTripRows`
- `buildRouteHistoryTrips`
- `isMovingTimelineItem`
- `isTripEndTimelineItem`
- `getTripDistanceKm`
- `getTripMapPoints`

Codigo mental:

```js
timeline ordenado
  -> detectar movimiento
  -> abrir viaje
  -> detectar fin de viaje
  -> cerrar viaje
  -> generar fila
```

Riesgo:

- Define que cuenta como viaje. Cambios aqui impactan reportes operativos.

### `frontend/src/utils/reports/route-map/routeTripMapImageUtils.js`

Responsabilidad:

- Generar imagen de mapa para PDF/Excel de viajes.

Funciones criticas:

- `buildRouteTripMapImageDataUrl`
- `drawRouteLine`
- `drawMarkers`
- `createCanvas`

Riesgo:

- Bounds, aspecto y puntos deben coincidir con las filas del reporte.

## Workspaces

### `frontend/src/composables/workspaces/useWorkspaces.js`

Responsabilidad:

- Crear, guardar, seleccionar, eliminar y compartir espacios de trabajo.

Funciones criticas:

- `createWorkspace`
- `updateWorkspace`
- `deleteWorkspace`
- `saveCurrentWorkspaceView`
- `shareWorkspace`
- `buildCurrentViewSnapshot`

Riesgo:

- Un workspace debe guardar visualizacion, no datos operativos.

### `frontend/src/composables/workspaces/useWorkspaceViewState.js`

Responsabilidad:

- Estado visual persistible de una vista.

Riesgo:

- Si el snapshot queda incompleto, al cambiar workspace no se restaura la vista.

## Auditoria

### `frontend/src/composables/audit/useAuditTrail.js`

Responsabilidad:

- Wrapper para registrar auditoria con usuario y empresa resueltos.

Funciones criticas:

- `recordAudit`

Riesgo:

- Si cada vista usa `appendAuditLog` directo, se duplican criterios.

### `frontend/src/services/audit/useAuditService.js`

Responsabilidad:

- Normalizar, guardar y exponer registros de auditoria.

Funciones criticas:

- `appendAuditLog`
- `normalizeAuditRecord`
- `persistAuditRecords`
- `resetAuditLog`

Riesgo:

- Auditoria local no es prueba confiable en produccion.

## Direcciones y geocoding

### `frontend/src/services/location/reverseGeocodingService.js`

Responsabilidad:

- Resolver coordenadas a direcciones.
- Enriquecer origen y destino de viajes.

Funciones criticas:

- `reverseGeocodeCoordinates`
- `resolveReverseGeocodedSources`
- `withResolvedRouteTripEndpointAddresses`
- `shouldResolveReverseGeocode`

Riesgo:

- Muchas llamadas sin cache pueden hacer lenta la UI o agotar limites.
