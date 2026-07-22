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

Funciones criticas:

- `canAccessCompany`
- `canAccessModule`
- `canAccessFunction`
- `accessAllowsAsset`
- `visibleAssets`

Riesgo:

- Un error aqui puede mostrar datos de una empresa o activo que no corresponde.

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

Riesgo:

- Como centraliza el mock, cualquier cambio puede afectar varios modulos.

Regla:

- No agregar logica visual aqui. Solo datos y normalizacion.

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
