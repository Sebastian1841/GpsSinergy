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
7. Si el alcance operativo usa etiquetas de acceso, `visibleAssets` se recorta
   por `assetTagIds`. Los grupos de vehiculos no participan en permisos: solo
   filtran despues de calcular los activos autorizados.

Archivos clave:

- `frontend/src/views/LoginView.vue`
- `frontend/src/composables/auth/useAuthSession.js`
- `frontend/src/composables/auth/useAccessControl.js`
- `frontend/src/services/auth/useAuthService.js`
- `frontend/src/services/access/useAccessService.js`
- `frontend/src/router/index.js`

Modelo mental:

```js
login -> auth service -> session -> access control -> visibleAssets -> router guard -> vista permitida
```

Riesgo:

- Los permisos frontend solo protegen experiencia visual. En produccion, el backend debe validar de nuevo.
- La cadena correcta para activos es siempre permisos/etiquetas primero y
  filtros visuales despues.

## 3. Navegacion por empresa y modulo

Entrada:

- Header y sidebar.

Flujo:

1. `AppHeader.vue` muestra empresa actual, usuario y controles globales.
2. `useGlobalSearch.js` arma resultados para el buscador global con empresas,
   activos, reportes, usuarios, auditoria y espacios permitidos.
3. El filtro de tipo del buscador se aplica dentro del composable antes del
   limite global de resultados.
4. `AppSidebar.vue` muestra modulos disponibles.
5. El router recibe `empresaId`.
6. Las vistas filtran datos por empresa actual.
7. Los permisos se calculan segun usuario y empresa.

Archivos clave:

- `frontend/src/components/Layout/AppHeader.vue`
- `frontend/src/components/Layout/AppSidebar.vue`
- `frontend/src/composables/search/useGlobalSearch.js`
- `frontend/src/router/index.js`
- `frontend/src/composables/auth/useAccessControl.js`

Riesgo:

- Si una vista ignora `empresaId`, puede mezclar datos entre empresas.
- Si el buscador filtra por tipo solo en el template, puede ocultar empresas o
  activos validos porque el limite global ya se aplico antes.

## 4. Activos, flota y telemetria

Entrada:

- `frontend/src/views/ActivosView.vue`

Flujo:

1. La vista obtiene empresa, permisos y activos base.
2. `visibleAssets` queda como universo autorizado por permisos y etiquetas.
3. El header puede aplicar filtros visuales de ciudad o grupos de vehiculos
   sobre ese universo, sin ampliar permisos.
4. `useFleetTelemetry.js` mantiene snapshot de activos con telemetria.
5. `useActivosTelemetrySync.js` separa dos ritmos:
   - mapa con telemetria viva
   - tabla con snapshot amortiguado
6. `useTelemetryHistory.js` guarda historial limitado para reportes.
7. Componentes de flota renderizan tabla, paneles, terminal y acciones.

Archivos clave:

- `frontend/src/views/ActivosView.vue`
- `frontend/src/composables/activos/view/useActivosTelemetrySync.js`
- `frontend/src/composables/activos/fleet/useFleetTelemetry.js`
- `frontend/src/composables/activos/fleet/useTelemetryHistory.js`
- `frontend/src/components/activos/fleet/FleetTable.vue`
- `frontend/src/components/activos/fleet/FleetListPanel.vue`
- `frontend/src/components/Layout/HeaderFleetAssetFilterMenu.vue`
- `frontend/src/composables/activos/fleet/useAssetCityFilter.js`
- `frontend/src/composables/activos/fleet/useAssetVehicleGroupFilter.js`
- `frontend/src/composables/activos/fleet/useAssetVehicleGroupManagement.js`

Modelo mental:

```js
assets -> visibleAssets -> city/group filters
telemetry batch
  -> mapa inmediato
  -> terminal inmediato
  -> historial de reportes
  -> tabla diferida por intervalo
```

Riesgo:

- Re-renderizar toda la tabla por cada pulso de telemetria causa lag.
- Usar grupos de vehiculos como permisos mezclaria organizacion visual con
  seguridad. El filtro de grupos debe partir siempre desde `visibleAssets`.

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

1. `useGeofences.js` carga geocercas y grupos de geocercas por empresa.
2. `FleetGeofencePanel.vue` administra busqueda, listado, grupos y el switch
   `Usar geocerca como direccion`.
3. La importacion/exportacion usa `utils/geofenceImportExportUtils.js` para
   KML, KMZ, GeoJSON, CSV y XML.
4. `useActivosGeofenceActions.js` guarda importaciones por lote, audita el
   resultado y devuelve exito/error al panel para cerrar la barra de carga.
5. `useMapGeofences.js` coordina render en mapa.
6. `useGeofenceDrawing.js` crea geometria nueva.
7. `useGeofenceEditing.js` modifica geometria existente.
8. El editor del mapa no crea grupos: solo selecciona un grupo existente desde
   dropdown o deja la geocerca sin grupo.
9. La tabla de activos puede reemplazar la direccion por el nombre/grupo de la
   geocerca donde esta el vehiculo si el switch esta activo.

Archivos clave:

- `frontend/src/composables/activos/geocercas/useGeofences.js`
- `frontend/src/components/activos/fleet/FleetGeofencePanel.vue`
- `frontend/src/composables/activos/view/useActivosGeofenceActions.js`
- `frontend/src/composables/activos/map/geofences/useMapGeofences.js`
- `frontend/src/composables/activos/map/geofences/useGeofenceDrawing.js`
- `frontend/src/composables/activos/map/geofences/useGeofenceEditing.js`
- `frontend/src/utils/geofenceImportExportUtils.js`
- `frontend/src/utils/geofenceUtils.js`
- `frontend/src/utils/geofenceMapUtils.js`

Riesgo:

- Geocercas reales deben persistir en backend. En frontend solo son confiables para prototipo.
- Leer un archivo no basta: despues de parsear se debe insertar en
  `useGeofences`, refrescar el mapa y mostrar feedback real de carga.

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
3. `ReportTemplateModal.vue` crea o modifica plantillas con flujo guiado:
   `Tipo`, `Datos`, `Eventos`, `Vista`, `Exportacion` y `Resumen`.
4. El tipo elegido aplica presets de reglas, columnas, widgets y exportacion;
   luego el usuario ajusta solo lo necesario.
5. `useReportEventRules.js` maneja reglas de evento.
6. `ReportSchedulesModal.vue` y `reportScheduleUtils.js` manejan programaciones.

Flujo de ejecucion:

1. `ReportExecutionModal.vue` abre una plantilla.
2. `useAssetReportExecution.js` selecciona activos, fechas, grupo y reglas.
3. `executeReport` captura snapshots reactivos.
4. `buildAssetReportRows` arma filas.
5. `doesReportMatchEventRules` decide si un evento entra.
6. La vista previa y Excel mantienen todas las columnas seleccionadas.
7. Excel abre en una hoja `Reporte` tipo informe y conserva los datos completos
   en hojas auxiliares.
8. PDF usa una tabla principal compacta y envia las columnas restantes a
   `Detalle adicional` para no romper el ancho del informe.
9. `exportExcel` y `exportPdf` usan las mismas filas generadas.

Archivos clave:

- `frontend/src/views/ReportsView.vue`
- `frontend/src/components/reports/ReportTemplateModal.vue`
- `frontend/src/components/reports/ReportExecutionModal.vue`
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
- Si una regla expone campos nuevos, tambien deben existir columnas
  configurables equivalentes en la plantilla para que el usuario pueda verlos.

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

## 11. Mantenciones

Entrada:

- `frontend/src/views/MaintenanceView.vue`

Flujo:

1. La ruta resuelve empresa y vehiculo objetivo si vienen `empresaId`,
   `assetId`, `activoId`, `asset`, `patente`, `plate` o `ppu`.
2. `useMaintenanceModule.js` arma vehiculos visibles, resumen, ordenes,
   calendario, historial, costos y modal operativo.
3. `useMaintenanceCompanyScope.js` recorta vehiculos por empresa cuando la ruta
   entra desde una empresa especifica.
4. `useMaintenanceFilters.js` aplica busqueda/filtros con debounce para no
   recalcular listas y KPI en cada tecla.
5. La mantencion representa un plan o regla de seguimiento; la orden de trabajo
   representa la ejecucion concreta.
6. Las acciones del prototipo quedan en refs temporales: no hay backend ni
   `localStorage` nuevo para mantenciones.

Archivos clave:

- `frontend/src/views/MaintenanceView.vue`
- `frontend/src/composables/maintenance/useMaintenanceModule.js`
- `frontend/src/composables/maintenance/useMaintenanceCompanyScope.js`
- `frontend/src/composables/maintenance/useMaintenanceFilters.js`
- `frontend/src/composables/maintenance/useMaintenanceRouteTarget.js`
- `frontend/src/components/maintenance/MaintenanceActionModal.vue`
- `frontend/src/utils/maintenance/maintenanceModuleConfig.js`

Modelo mental:

```js
asset + template/lectura -> plan de mantencion -> decision operativa -> orden de trabajo -> cierre/historial/costos
```

Riesgo:

- Crear una mantencion no debe generar automaticamente una OT.
- Mientras sea prototipo local, no presentar automatizaciones de backend,
  correo, WhatsApp o n8n como integraciones reales.

## 12. Espacios de trabajo

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

## 13. Auditoria

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

## 14. Mocks, storage y servicios

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
