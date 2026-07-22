# Flujos principales del frontend

Este documento explica como se conecta el frontend por comportamiento, no por carpetas.

## 1. Arranque de la aplicacion

Entrada:

- `frontend/src/main.js`

Flujo:

1. Vite carga `main.js`.
2. Vue monta `App.vue`.
3. Se registra Vue Router.
4. `App.vue` decide si muestra una ruta publica o el layout privado.

Archivos clave:

- `frontend/src/main.js`
- `frontend/src/App.vue`
- `frontend/src/router/index.js`
- `frontend/src/components/Layout/AppHeader.vue`
- `frontend/src/components/Layout/AppSidebar.vue`

Riesgo:

- `main.js` debe mantenerse liviano. Si se llena de logica de negocio, la app queda dificil de mantener.

## 2. Login, sesion y permisos

Entrada:

- `frontend/src/views/LoginView.vue`

Flujo:

1. El usuario escribe credenciales.
2. `LoginView.vue` llama a `useAuthSession().login`.
3. `useAuthSession.js` valida contra `useAuthService`.
4. Se guarda sesion y se calcula ruta inicial.
5. `router.beforeEach` valida cada navegacion.
6. `useAccessControl.js` decide empresas, modulos, funciones y activos visibles.

Archivos clave:

- `frontend/src/views/LoginView.vue`
- `frontend/src/composables/auth/useAuthSession.js`
- `frontend/src/composables/auth/useAccessControl.js`
- `frontend/src/services/auth/useAuthService.js`
- `frontend/src/services/access/useAccessService.js`
- `frontend/src/router/index.js`

Modelo mental:

```js
login -> auth service -> session -> access control -> router guard -> vista permitida
```

Riesgo:

- Los permisos frontend solo protegen experiencia visual. En produccion, el backend debe validar de nuevo.

## 3. Navegacion por empresa y modulo

Entrada:

- Header y sidebar.

Flujo:

1. `AppHeader.vue` muestra empresa actual, usuario y controles globales.
2. `AppSidebar.vue` muestra modulos disponibles.
3. El router recibe `empresaId`.
4. Las vistas filtran datos por empresa actual.
5. Los permisos se calculan segun usuario y empresa.

Archivos clave:

- `frontend/src/components/Layout/AppHeader.vue`
- `frontend/src/components/Layout/AppSidebar.vue`
- `frontend/src/router/index.js`
- `frontend/src/composables/auth/useAccessControl.js`

Riesgo:

- Si una vista ignora `empresaId`, puede mezclar datos entre empresas.

## 4. Activos, flota y telemetria

Entrada:

- `frontend/src/views/ActivosView.vue`

Flujo:

1. La vista obtiene empresa, permisos y activos base.
2. `useFleetTelemetry.js` mantiene snapshot de activos con telemetria.
3. `useActivosTelemetrySync.js` separa dos ritmos:
   - mapa con telemetria viva
   - tabla con snapshot amortiguado
4. `useTelemetryHistory.js` guarda historial limitado para reportes.
5. Componentes de flota renderizan tabla, paneles, terminal y acciones.

Archivos clave:

- `frontend/src/views/ActivosView.vue`
- `frontend/src/composables/activos/view/useActivosTelemetrySync.js`
- `frontend/src/composables/activos/fleet/useFleetTelemetry.js`
- `frontend/src/composables/activos/fleet/useTelemetryHistory.js`
- `frontend/src/components/activos/fleet/FleetTable.vue`
- `frontend/src/components/activos/fleet/FleetListPanel.vue`

Modelo mental:

```js
telemetry batch
  -> mapa inmediato
  -> terminal inmediato
  -> historial de reportes
  -> tabla diferida por intervalo
```

Riesgo:

- Re-renderizar toda la tabla por cada pulso de telemetria causa lag.

## 5. Mapa de activos

Entrada:

- `frontend/src/components/activos/map/ActivosMapPanel.vue`

Flujo:

1. El componente monta el contenedor del mapa.
2. `useActivosMap.js` inicializa Leaflet.
3. `useMapAssetMarkers.js` crea y actualiza marcadores.
4. `assetMarkerCache.js` evita recrear markers.
5. `assetMarkerClusters.js` agrupa activos cuando corresponde.
6. Composables de geocercas, itinerarios y trazas agregan capas.

Archivos clave:

- `frontend/src/components/activos/map/ActivosMapPanel.vue`
- `frontend/src/composables/activos/map/useActivosMap.js`
- `frontend/src/composables/activos/map/useMapAssetMarkers.js`
- `frontend/src/composables/activos/map/assetMarkers/assetMarkerClusters.js`
- `frontend/src/composables/activos/map/geofences/useMapGeofences.js`
- `frontend/src/composables/activos/map/useMapMovementTrails.js`

Riesgo:

- El mapa es sensible a listeners, capas sin limpiar y recreacion masiva de marcadores.

## 6. Geocercas

Entrada:

- Paneles de geocercas y herramientas del mapa.

Flujo:

1. `useGeofences.js` carga geocercas por empresa.
2. `useMapGeofences.js` coordina render en mapa.
3. `useGeofenceDrawing.js` crea geometria nueva.
4. `useGeofenceEditing.js` modifica geometria existente.
5. `utils/geofenceUtils.js` y `utils/geofenceMapUtils.js` calculan geometria.

Archivos clave:

- `frontend/src/composables/activos/geocercas/useGeofences.js`
- `frontend/src/composables/activos/map/geofences/useMapGeofences.js`
- `frontend/src/composables/activos/map/geofences/useGeofenceDrawing.js`
- `frontend/src/composables/activos/map/geofences/useGeofenceEditing.js`
- `frontend/src/utils/geofenceUtils.js`
- `frontend/src/utils/geofenceMapUtils.js`

Riesgo:

- Geocercas reales deben persistir en backend. En frontend solo son confiables para prototipo.

## 7. Itinerarios

Entrada:

- Panel de itinerarios dentro de activos.

Flujo:

1. `useItineraryAssets.js` define activos elegibles.
2. `useItineraryFilters.js` maneja rango de fechas.
3. `useItineraryRoute.js` construye puntos y ruta.
4. `useItineraryTableRows.js` arma filas de tabla.
5. Servicios de itinerarios exportan Excel/PDF cuando corresponde.

Archivos clave:

- `frontend/src/components/activos/itinerarios/ItineraryPanel.vue`
- `frontend/src/composables/activos/itinerarios/useItineraryAssets.js`
- `frontend/src/composables/activos/itinerarios/useItineraryFilters.js`
- `frontend/src/composables/activos/itinerarios/useItineraryRoute.js`
- `frontend/src/composables/activos/itinerarios/useItineraryTableRows.js`
- `frontend/src/services/itinerarios/itineraryExportService.js`

Riesgo:

- Si la fuente del historial cambia, itinerarios y reportes deben seguir usando criterios compatibles.

## 8. Rutas planificadas y desvios

Entrada:

- Modales de rutas dentro de activos.

Flujo:

1. `usePlannedRouteCatalog.js` guarda rutas planificadas.
2. `usePlannedRouteMapEditor.js` permite editar puntos en mapa.
3. `RouteComparisonModal.vue` muestra comparacion entre esperado y real.
4. `useRouteDeviationDocument.js` arma documento.
5. `buildRouteDeviationDocument.js` genera HTML imprimible.

Archivos clave:

- `frontend/src/components/activos/routes/RoutePlanConfiguratorModal.vue`
- `frontend/src/components/activos/routes/RouteComparisonModal.vue`
- `frontend/src/composables/activos/routes/usePlannedRouteCatalog.js`
- `frontend/src/composables/activos/routes/useRouteDeviationDocument.js`
- `frontend/src/utils/activos/routes/buildRouteDeviationDocument.js`

Riesgo:

- PDF, vista previa y datos de tabla deben venir de la misma comparacion para evitar inconsistencias.

## 9. Reportes

Entrada:

- `frontend/src/views/ReportsView.vue`
- `frontend/src/components/reports/ReportExecutionModal.vue`

Flujo de administracion:

1. `ReportsView.vue` lista plantillas.
2. `useReportTemplates.js` maneja plantillas base y personalizadas.
3. `ReportTemplateModal.vue` crea o modifica plantillas.
4. `useReportEventRules.js` maneja reglas de evento.
5. `ReportSchedulesModal.vue` y `reportScheduleUtils.js` manejan programaciones.

Flujo de ejecucion:

1. `ReportExecutionModal.vue` abre una plantilla.
2. `useAssetReportExecution.js` selecciona activos, fechas, grupo y reglas.
3. `executeReport` captura snapshots reactivos.
4. `buildAssetReportRows` arma filas.
5. `doesReportMatchEventRules` decide si un evento entra.
6. `exportExcel` y `exportPdf` usan las mismas filas generadas.

Archivos clave:

- `frontend/src/views/ReportsView.vue`
- `frontend/src/composables/reports/useReportTemplates.js`
- `frontend/src/composables/reports/useReportEventRules.js`
- `frontend/src/composables/reports/useAssetReportExecution.js`
- `frontend/src/utils/reports/execution/assetReportExecutionUtils.js`
- `frontend/src/utils/reports/execution/assetReportTripUtils.js`
- `frontend/src/utils/reports/event-rules/reportEventRuleEngine.js`
- `frontend/src/utils/reports/export/assetReportExportUtils.js`

Modelo mental:

```js
template + assets + date range + event rules
  -> executeReport
  -> buildAssetReportRows
  -> reportRows
  -> preview / Excel / PDF
```

Riesgo:

- Si preview, PDF y Excel calculan cada uno por separado, van a diferir. La regla es generar una vez y exportar desde `reportRows`.

## 10. Reporte de viajes y mapa exportable

Entrada:

- Plantilla de viajes.

Flujo:

1. `buildAssetReportRows` detecta plantilla de ruta/historial.
2. `buildRouteHistoryTripRows` separa historial en viajes.
3. Las reglas de movimiento, parada, ralenti y fin de viaje influyen en la separacion.
4. `routeTripMapImageUtils.js` genera imagen de mapa para PDF/Excel.
5. `reverseGeocodingService.js` puede enriquecer origen/destino.

Archivos clave:

- `frontend/src/utils/reports/execution/assetReportTripUtils.js`
- `frontend/src/utils/reports/route-map/routeTripMapImageUtils.js`
- `frontend/src/utils/reports/route-map/routeTripMapProjectionUtils.js`
- `frontend/src/services/location/reverseGeocodingService.js`

Riesgo:

- La definicion de viaje debe ser consistente. Si se cambia la regla de cierre de viaje, cambia todo el reporte.

## 11. Espacios de trabajo

Entrada:

- `WorkspaceSelector.vue` y estado de vistas.

Flujo:

1. La vista publica un snapshot visual.
2. `useWorkspaces.js` guarda workspaces por usuario.
3. `useWorkspaceViewState.js` mantiene estado de la vista actual.
4. Al cambiar workspace se aplica configuracion de filtros, columnas, layout y modulo.

Archivos clave:

- `frontend/src/components/Layout/WorkspaceSelector.vue`
- `frontend/src/composables/workspaces/useWorkspaces.js`
- `frontend/src/composables/workspaces/useWorkspaceViewState.js`
- `frontend/src/composables/activos/view/useActivosWorkspacePersistence.js`

Riesgo:

- Un workspace debe modificar la visualizacion, no los datos operativos.

## 12. Auditoria

Entrada:

- Acciones de usuario en vistas y composables.

Flujo:

1. Una accion llama a `useAuditTrail().recordAudit`.
2. `useAuditTrail.js` agrega usuario, empresa, estado y severidad.
3. `useAuditService.js` normaliza y guarda el registro.
4. `AuditView.vue` muestra, filtra y exporta registros.

Archivos clave:

- `frontend/src/composables/audit/useAuditTrail.js`
- `frontend/src/services/audit/useAuditService.js`
- `frontend/src/views/AuditView.vue`
- `frontend/src/components/audit/AuditActivityTable.vue`
- `frontend/src/components/audit/AuditDetailModal.vue`

Riesgo:

- Auditoria local no es confiable para produccion. Sirve como modulo visual de prototipo.

## 13. Mocks, storage y servicios

Entrada:

- Servicios `useXService`.

Flujo:

1. La UI llama composables.
2. Los composables llaman services.
3. Los services usan adapters mock o storage.
4. `useMockDatabase.js` centraliza datos maestros del prototipo.
5. `browserStorage.js` encapsula acceso a storage.

Archivos clave:

- `frontend/src/composables/mock/useMockDatabase.js`
- `frontend/src/services/storage/browserStorage.js`
- `frontend/src/services/*/use*Service.js`
- `frontend/src/services/*/mock*Adapter.js`

Riesgo:

- No usar `localStorage` directo desde componentes. Eso complica migrar a backend.
