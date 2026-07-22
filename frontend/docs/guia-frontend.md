# Guia tecnica del frontend

## Indice recomendado

Esta guia es la referencia extensa. Para una lectura mas ordenada:

- `README.md`: indice general de documentacion.
- `flujos-principales.md`: explicacion por flujo funcional.
- `archivos-criticos.md`: archivos que requieren mas cuidado al modificar.
- `criterios-arquitectura.md`: reglas para ubicar codigo nuevo.

## Estado general

El frontend es una SPA hecha con Vue 3, Vue Router, Vite y Tailwind. La app esta organizada en capas:

- `views`: pantallas principales y orquestacion de modulos.
- `components`: piezas visuales reutilizables.
- `composables`: estado reactivo, reglas de negocio del cliente y coordinacion entre componentes.
- `services`: adaptadores de datos. Hoy muchos servicios apuntan a datos mock/localStorage.
- `utils`: funciones puras para calculos, formateo, exportacion, mapas y reportes.
- `data`: semillas mock usadas por el prototipo.
- `router`: definicion de rutas y guardas de acceso.

Actualmente `frontend/src` tiene 274 archivos. La distribucion principal es:

- `components`: 77 archivos.
- `composables`: 96 archivos.
- `utils`: 48 archivos.
- `services`: 24 archivos.
- `views`: 8 archivos.
- `data`: 7 archivos.
- `router`: 1 archivo.
- `assets`: 10 archivos.

Hay 19 archivos de test `*.test.js`. Estan concentrados en logica pura, no tanto en flujos visuales completos.

## Arranque de la app

### `frontend/src/main.js`

Responsabilidad:

- Crea la app Vue.
- Monta `App.vue`.
- Registra el router.
- Importa `style.css`.

Razonamiento:

- Es un punto de entrada simple y correcto.
- No deberia crecer demasiado. Configuraciones globales, plugins o providers pueden agregarse aqui, pero la logica de negocio no deberia vivir en este archivo.

### `frontend/src/App.vue`

Responsabilidad:

- Decide si la ruta es publica o privada.
- En rutas publicas muestra solo `router-view`.
- En rutas privadas monta shell principal:
  - `AppHeader`
  - `ImpersonationBanner`
  - `AppSidebar`
  - contenido de la ruta actual.

Funciones y estado:

- `isPublicRoute`: revisa `route.meta.public`.
- `showSidebar`: controla apertura del sidebar.
- `toggleSidebar`: alterna el sidebar.

Razonamiento:

- `App.vue` funciona como layout root.
- Esta bien que tenga solo estado visual global. Si empezara a manejar permisos, datos de activos o reportes, se ensuciaria.

## Rutas y seguridad del cliente

### `frontend/src/router/index.js`

Responsabilidad:

- Define rutas publicas y privadas.
- Carga vistas con lazy imports.
- Redirige rutas antiguas.
- Aplica guardas de autenticacion y permisos.
- Recuerda la ultima empresa usada en `sinergy-last-company-id`.

Funciones principales:

- `readLastCompanyId`: lee empresa cacheada.
- `persistLastCompanyId`: guarda o limpia la empresa activa.
- `getLastAccessibleAssetsCompany`: busca la empresa accesible preferida para entrar a activos.
- `beforeEach`: valida sesion, permisos por modulo, permisos por funcion y redirecciones.

Razonamiento:

- El router protege visualmente las rutas, pero no reemplaza seguridad backend.
- Las reglas de acceso en frontend sirven para experiencia de usuario. En produccion, el backend debe repetir la validacion.

Rutas principales:

- `/login`: login publico.
- `/sin-acceso`: pantalla de bloqueo por permisos.
- `/app/:empresaId/activos`: modulo de activos por empresa.
- `/app/:empresaId/reportes`: modulo de reportes por empresa.
- `/app/:empresaId/auditoria`: modulo de auditoria por empresa.
- `/app/:empresaId/usuarios`: gestion de usuarios por empresa.
- `/empresas`: administracion general de empresas.

## Autenticacion y permisos

### `frontend/src/composables/auth/useAuthSession.js`

Responsabilidad:

- Maneja sesion actual.
- Maneja suplantacion de usuario.
- Calcula usuario activo.
- Registra auditoria de login, logout e impersonation.
- Calcula ruta inicial despues de login.

Funciones principales:

- `login`: valida usuario/password contra el servicio actual, guarda sesion y audita.
- `logout`: limpia sesion y audita salida.
- `startImpersonation`: permite a admin ver como otro usuario.
- `stopImpersonation`: termina suplantacion.
- `canImpersonateUser`: valida si el usuario autenticado puede suplantar.
- `clearSession`: limpia sesion y datos relacionados.
- `clearImpersonation`: limpia solo la suplantacion.
- `recordAuthAudit`: registra evento de auditoria de autenticacion.

Computed principales:

- `authenticatedUser`: usuario logueado real.
- `impersonatedUser`: usuario suplantado.
- `currentUser`: usuario efectivo usado por la plataforma.
- `currentAccesses`: accesos activos del usuario.
- `authenticatedUserIsPlatformAdmin`: si el usuario real es admin.
- `isPlatformAdmin`: si el usuario efectivo es admin.
- `isImpersonating`: si hay suplantacion activa.
- `currentRole`: rol principal calculado por prioridad.
- `isAuthenticated`: sesion valida.
- `defaultAuthenticatedRoute`: ruta inicial segun permisos.

Razonamiento:

- Centraliza sesion y evita que cada vista implemente login/permisos.
- Hoy trabaja contra datos mock. En produccion debe conectarse a backend con token, refresh token, expiracion y validacion server-side.

### `frontend/src/composables/auth/useAccessControl.js`

Responsabilidad:

- Calcula permisos del usuario actual.
- Decide empresas accesibles.
- Decide activos visibles.
- Decide si se puede acceder a modulos o funciones.

Funciones principales:

- `canAccessCompany`: valida acceso a empresa.
- `canAccessModule`: valida acceso a modulo.
- `canAccessFunction`: valida funcion y permiso (`view`, `edit`, `admin`).
- `getAccessesForCompany`: filtra accesos por empresa.
- `accessHasModule`: revisa modulo habilitado.
- `accessHasFunction`: revisa funcion habilitada y permiso especifico.
- `accessAllowsAsset`: aplica alcance de activos (`all-assets`, `sucursal`, `selected-assets`).

Computed principales:

- `accessibleCompanies`: empresas visibles.
- `visibleAssets`: activos visibles segun permisos.
- `canViewUsers`, `canCreateUsers`, `canEditUsers`, `canManageUserPermissions`: permisos especificos de usuarios.

Razonamiento:

- Esta capa es necesaria para no repetir permisos en componentes.
- En produccion debe consumir permisos desde backend, pero puede seguir existiendo como capa de presentacion.

## Servicios y datos

### `frontend/src/composables/mock/useMockDatabase.js`

Responsabilidad:

- Simula una base de datos en memoria/localStorage.
- Normaliza empresas, usuarios, accesos, aplicaciones y activos.
- Persiste cambios con debounce.
- Expone operaciones CRUD usadas por servicios.

Funciones principales:

- Normalizadores:
  - `normalizeCompany`
  - `normalizeApplicationDefinition`
  - `normalizeAsset`
  - `normalizeUser`
  - `normalizeAccess`
  - `normalizeAccessScope`
  - `normalizeAccessModules`
  - `normalizeAccessFunctions`
- Indices:
  - `companiesById`
  - `usersById`
  - `usersByUsername`
  - `usersByEmail`
  - `accessesById`
  - `applicationDefinitionsById`
  - `assetsByCompanyId`
  - `assetStatsByCompanyId`
  - `sucursalesById`
- Persistencia:
  - `readPersistedDatabase`
  - `persistDatabase`
  - `schedulePersistDatabase`
  - `handleBeforeUnloadPersist`
- CRUD:
  - `createCompany`
  - `updateCompany`
  - `createUser`
  - `updateUser`
  - `createAccess`
  - `deleteAccess`
  - `createAsset`
  - `updateAsset`
  - `deleteAsset`
  - `addSucursal`
  - `updateSucursal`
  - `deleteSucursal`

Razonamiento:

- Es util para prototipo.
- Es uno de los mayores candidatos a backend. En produccion no deberia haber reglas criticas, contrasenas, permisos ni datos maestros persistiendo solo en localStorage.

### Servicios `frontend/src/services`

Patron usado:

- `useXService.js`: fachada que consume un adapter.
- `mockXAdapter.js`: adaptador mock que llama a `useMockDatabase`.

Servicios actuales:

- `auth`: usuarios/login mock.
- `access`: empresas, accesos, aplicaciones, funciones.
- `activos`: CRUD de activos.
- `companies`: CRUD de empresas/sucursales.
- `users`: usuarios y accesos.
- `reports`: reportes/plantillas.
- `audit`: auditoria local.
- `location`: reverse geocoding.
- `routing`: OSRM/rutas.
- `storage`: local/session storage.
- `itinerarios`: exportaciones de itinerarios.

Razonamiento:

- Esta division es buena porque permite reemplazar mocks por API real sin reescribir todas las vistas.
- El paso profesional seria crear adapters HTTP por modulo y dejar los mock adapters solo para dev/test.

## Layout y navegacion

### `frontend/src/components/Layout`

Archivos:

- `AppHeader.vue`
- `AppSidebar.vue`
- `WorkspaceSelector.vue`
- `HeaderPersonalAssetGroupsMenu.vue`
- `PersonalAssetGroupModal.vue`

Responsabilidad:

- Mostrar barra superior.
- Cambiar empresa.
- Cambiar modulo.
- Manejar espacios de trabajo.
- Manejar grupos personales de activos.
- Mostrar usuario actual y estado.

Razonamiento:

- Es correcto que el layout no calcule reportes ni telemetria.
- El header puede consultar estado global/composables, pero debe evitar hacer procesamiento pesado.

## Login

### `frontend/src/views/LoginView.vue`

Responsabilidad:

- Renderiza login.
- Usa imagen corporativa de `public`.
- Muestra logo desde `public/logo-sinergy.html`.
- Captura usuario y contrasena.
- Llama a `useAuthSession().login`.
- Redirige al destino original o ruta por defecto.

Razonamiento:

- Debe mantenerse visualmente profesional pero liviano.
- Evitar animaciones pesadas y fondos recreados con CSS complejo, porque el login debe cargar rapido.
- En produccion debe llamar al backend, no validar passwords en el cliente.

## Modulo Activos

### `frontend/src/views/ActivosView.vue`

Responsabilidad:

- Orquesta el modulo mas grande de la plataforma.
- Une filtros, tabla, mapa, geocercas, itinerarios, rutas, reportes, telemetria y espacios de trabajo.
- Controla modales principales de activos.

Funciones y bloques importantes:

- `activeCompanyId`: empresa actual desde la ruta.
- `baseMockActivos`: activos base segun empresa/permisos.
- `currentUserId`: usuario actual para preferencias.
- `cityAssetGroups`: grupos dinamicos por ciudad.
- `permittedGeofences`: geocercas filtradas por empresa.
- `setUseGeofenceLocationAddress`: activa/desactiva direcciones en geocercas.
- `startMockTelemetry` / `stopMockTelemetry`: controlan stream mock.
- `applyMapTelemetryBatch`: aplica lote directo al mapa.
- `buildActivosWorkspaceSettings`: captura configuracion actual de la vista.
- `publishActivosWorkspaceState`: publica snapshot para espacios de trabajo.
- `applyActivosWorkspaceSettings`: restaura filtros, sidebar, columnas, mapa y seleccion desde workspace.
- `handleSidebarGeofenceSelected`: enfoca geocerca seleccionada.
- `handleSidebarGeofenceEdit`: abre edicion de geocerca.
- `openAddActivoModal`: abre creacion de activo.
- `handleAddActivo`: crea activo y audita.
- `handleUpdateActivo`: edita activo y audita.
- `handleDeviceAction`: acciones desde menu contextual.
- `handleAlternarSucursalesFlotaHabilitadas`: activa/desactiva sucursales de flota.
- `handleAgregarSucursalFlota`: crea sucursal.
- `handleActualizarNombreSucursalFlota`: renombra sucursal.
- `handleAlternarEstadoSucursalFlota`: activa/desactiva sucursal.
- `handleEliminarSucursalFlota`: elimina sucursal.
- `handleGeofenceCreated`: crea geocerca y audita.
- `handleGeofenceUpdated`: actualiza geocerca y audita.
- `handleGeofenceDeleted`: elimina geocerca y audita.

Razonamiento:

- `ActivosView` esta actuando como controlador de pantalla.
- El trabajo pesado ya se fue dividiendo en composables, pero la vista sigue siendo grande.
- Para mantenerlo profesional conviene seguir moviendo handlers por submodulo cuando se estabilicen.

### Composables de vista de activos

`frontend/src/composables/activos/view`

- `useActivosPermissions`: concentra permisos del modulo activos.
- `useActivosFilters`: maneja busqueda, tabs, filtros por estado y cambios de vista.
- `useActivosLayout`: controla ancho de sidebar y limites del panel.
- `useActivosSelection`: seleccion de activo y sincronizacion con mapa/tabla.
- `useActivosCrud`: arma payloads y operaciones CRUD de activos.
- `useActivosFleetModals`: lazy loading de modales de flota.
- `useActivosTelemetrySync`: separa telemetria viva del mapa y snapshot amortiguado de tabla.

Razonamiento:

- Esta capa existe para que `ActivosView` no tenga todo el codigo.
- La separacion de telemetria mapa/tabla es importante: el mapa necesita datos vivos, pero la tabla no debe re-renderizarse por cada pulso.

### Telemetria y flota

`frontend/src/composables/activos/fleet`

- `useFleetTelemetry`: aplica telemetria live/mock a activos.
- `useTelemetryHistory`: acumula historial limitado por activo para reportes.
- `useFleetColumns`: columnas visibles, orden y normalizacion.
- `useFleetSorting`: ordenamiento de tabla.
- `usePersistedFleetLayout`: persistencia local de layout.
- `usePersonalAssetGroups`: grupos personales y compartibles.
- `useSucursalesFlota`: agrupacion por sucursales.
- `useFleetTerminal`: historial/logica de terminal.
- `useFleetCreateForm` y `useFleetEditForm`: formularios de alta/edicion de activos.
- `useFleetFormWizard`: pasos de formularios.
- `useFleetDeviceContextMenu`: menu contextual.

Razonamiento:

- La telemetria es un cuello de botella natural.
- La tabla debe depender de snapshots y cambios incrementales.
- El historial de telemetria usado por reportes deberia pasar a backend si se quiere consistencia real.

## Mapa

### `frontend/src/components/activos/map`

Componentes:

- `ActivosMapPanel.vue`: componente visual principal del mapa.
- `MapFloatingTools.vue`: herramientas flotantes.
- `TopStatsBar.vue`: resumen superior del mapa.

### `frontend/src/composables/activos/map`

Responsabilidad:

- Crear y controlar Leaflet.
- Renderizar marcadores.
- Renderizar geocercas.
- Renderizar itinerarios.
- Renderizar trazas de movimiento.
- Manejar fullscreen y herramientas del mapa.

Funciones principales:

- `useActivosMap`: inicializa mapa, capas base, cambio de tipo de mapa y fit de rutas.
- `createAssetMarkerController`: sincroniza marcadores con activos y telemetria.
- `createAssetMarkerCacheController`: cachea marcadores para no recrearlos siempre.
- `createAssetMarkerClusterController`: agrupa marcadores si hay muchos activos.
- `shouldClusterAssetMarkers`: decide si conviene agrupar.
- `getClusteredActivos`: crea agrupaciones de activos por viewport/zoom.
- `createAssetMarkerTooltipController`: arma tooltips de activos.
- `createMovementTrailController`: dibuja recorrido reciente.
- `buildRenderableTrailPoints`: recorta/simplifica puntos renderizables.
- `createItineraryMapController`: dibuja rutas de itinerario.
- `buildRenderableItineraryPoints`: normaliza puntos de ruta.
- `createGeofenceMapController`: coordina geocercas.
- `createGeofenceRendererController`: dibuja geocercas.
- `createGeofenceDrawingController`: creacion interactiva.
- `createGeofenceEditingController`: edicion interactiva.
- `focusGeofenceOnMap`: centra mapa en geocerca.

Razonamiento:

- Esta es una de las zonas mejor separadas.
- Hay limites de render para evitar lag: clusters, maximos de puntos, firmas de cambio y requestAnimationFrame.
- Lo que deberia ir al backend no es el render, sino calculo masivo de rutas, historiales, geocercas y eventos.

## Geocercas

### `frontend/src/composables/activos/geocercas/useGeofences.js`

Responsabilidad:

- Persiste geocercas por empresa.
- Normaliza circulos, poligonos y rutas.
- Evita duplicados.
- Expone CRUD de geocercas.

Funciones principales:

- `normalizeGeofence`
- `normalizeCoordinates`
- `buildGeofenceDuplicateKey`
- `preferCompanyScopedGeofence`
- `normalizeGeofences`
- `readStoredGeofences`
- `persistGeofences`
- `useGeofences`

Razonamiento:

- Funciona como repositorio local.
- En produccion debe ser backend porque las geocercas son datos compartidos, auditables y multiusuario.

### Historial de geocercas

- `useGeofenceHistoryRows`: filtra, ordena y prepara filas de historial.
- `mockGeofenceHistoryData.js`: datos falsos para prototipo.

Razonamiento:

- El historial real debe venir de backend/telemetria, no del frontend.

## Itinerarios

### `frontend/src/composables/activos/itinerarios`

Responsabilidad:

- Seleccionar activos con datos de ruta.
- Construir rutas desde reportes/historial.
- Aplicar filtros de fecha.
- Preparar tabla y resumen.

Funciones principales:

- `useItineraryAssets`: activos elegibles para itinerario.
- `useItineraryFilters`: estado de filtros de fecha/rango.
- `useItineraryRoute`: normaliza puntos, timestamps, distancia y ruta.
- `useItineraryTableRows`: filas ordenables de itinerario.
- `normalizeReportTimestamp`: interpreta timestamps de diferentes fuentes.
- `mergeRoutePoints`: junta puntos evitando duplicados.
- `isPointInsideDateRange`: filtra puntos por rango.

Razonamiento:

- El frontend puede visualizar itinerarios.
- Generar viajes confiables, calculo de distancia y eventos por periodo deberia estar en backend si es informacion operativa oficial.

## Rutas planificadas y desviaciones

### `frontend/src/composables/activos/routes`

Responsabilidad:

- Crear catalogo de rutas planificadas.
- Editar rutas sobre mapa.
- Comparar ruta esperada vs real.
- Generar informe de desvio en PDF.

Funciones principales:

- `normalizePlannedRoute`: normaliza ruta guardada.
- `createEmptyPlannedRoute`: crea ruta vacia.
- `createPlannedRouteFromPoints`: crea ruta desde puntos.
- `usePlannedRouteCatalog`: CRUD local de rutas planificadas.
- `usePlannedRouteMapEditor`: estado compartido del editor de rutas.
- `useRouteComparisonUiState`: apertura/cierre modal comparacion.
- `useRouteDeviationDocument`: renderiza documento HTML y captura PDF.

Razonamiento:

- El editor visual pertenece al frontend.
- La persistencia, comparacion historica oficial, tolerancias y evidencia PDF deberian quedar en backend para trazabilidad.

## Reportes

### `frontend/src/views/ReportsView.vue`

Responsabilidad:

- Lista plantillas de reporte.
- Filtra por tipo.
- Pagina resultados.
- Abre modales de crear/editar reportes, reglas y programaciones.
- Registra auditoria de cambios.

Funciones importantes:

- `reportRows`: arma filas visibles de reportes.
- `filteredReportRows`: aplica busqueda/filtro.
- `visibleReportRows`: pagina.
- `openCreateModal`, `openEditModal`, `closeReportModal`: control modal.
- `saveReport`: crea o actualiza plantilla.
- `deleteReport`: elimina plantilla.
- `openRulesModal`: abre reglas.
- `openSchedulesModal`: abre programaciones.

Razonamiento:

- Esta vista debe quedarse como administracion visual.
- La ejecucion real de reportes no deberia depender solo del frontend.

### `frontend/src/composables/reports/useReportTemplates.js`

Responsabilidad:

- Maneja plantillas base y personalizadas.
- Mantiene compatibilidad con presets.
- Sincroniza plantillas con reglas activas.
- Permite crear, actualizar y eliminar.

Funciones principales:

- `normalizeReportTemplateStoredEventRuleIds`
- `normalizeReportTemplateEventRuleIds`
- `hasRunnableReportTemplateRules`
- `canDeleteReportTemplate`
- `resolveReportTemplateWidgets`
- `mergeStoredDefaultTemplate`
- `useReportTemplates`

Razonamiento:

- Mantiene plantillas base sin perder personalizaciones.
- En produccion deberia guardar en backend con versionado.

### `frontend/src/composables/reports/useReportEventRules.js`

Responsabilidad:

- Define reglas base.
- Permite reglas editables.
- Normaliza condiciones, calendario, activacion y notificaciones.
- Expone reglas activas.

Funciones principales:

- `normalizeReportEventRuleId`
- `getActiveReportEventRulesSnapshot`
- `getReportEventRulesByIdSnapshot`
- `useReportEventRules`
- `normalizeEventRule`
- `normalizeSchedule`
- `normalizeActivation`
- `cloneNotifications`

Razonamiento:

- Es el “motor configurable” que compone reportes.
- En produccion, el backend debe ejecutar estas reglas para que PDF, Excel y programaciones den lo mismo aunque el usuario cierre el navegador.

### `frontend/src/utils/reports/event-rules/reportEventRuleEngine.js`

Responsabilidad:

- Decide si un reporte/evento cumple una regla.
- Evalua condiciones, horarios, grupos y senales operativas.

Funciones principales:

- `doesReportMatchEventRule`
- `doesReportMatchEventRules`
- `doesRuleApplyToGroup`
- `doesRuleApplyToSchedule`
- `getEventFieldValue`
- `compareCondition`
- `doesReportMatchOperationalRule`
- `hasIdleSignal`
- `hasSpeedingSignal`
- `hasGpsSignalIssue`
- `hasGeofenceSignal`

Razonamiento:

- Esta logica es core de negocio.
- Puede existir tambien en frontend para previsualizacion, pero la ejecucion oficial debe estar en backend.

### `frontend/src/composables/reports/useAssetReportExecution.js`

Responsabilidad:

- Ejecuta reporte sobre activos seleccionados.
- Procesa por lotes para no bloquear UI.
- Agrupa activos por empresa/sucursal/grupo.
- Devuelve filas y resumen.

Funciones principales:

- `useAssetReportExecution`
- `normalizeReportGroup`
- `getAssetGroupId`
- `getAssetGroupName`
- `waitForReportBatch`

Razonamiento:

- La ejecucion por lotes ayuda a no congelar el navegador.
- Si el volumen crece, esto debe migrar a jobs backend.

### Utils de reportes

Responsabilidad:

- Construir filas.
- Calcular columnas.
- Preparar exportacion.
- Dibujar imagen de mapa para viaje.
- Generar recomendaciones de graficos.

Archivos clave:

- `assetReportColumnUtils.js`: columnas y opciones.
- `assetReportRowBuilderUtils.js`: fila base de reporte.
- `assetReportExecutionUtils.js`: genera filas desde historial.
- `assetReportTripUtils.js`: separa viajes por reglas de movimiento/parada.
- `assetReportExportUtils.js`: exportacion.
- `routeTripMapImageUtils.js`: imagen de mapa para PDF/Excel.
- `reportOutputOptions.js`: opciones de salida.
- `reportWidgetUtils.js`: widgets visibles.
- `reportChartRowUtils.js`: filas para graficos.
- `reportChartRecommendations.js`: recomendaciones de graficos.

Razonamiento:

- Son funciones puras en su mayoria, por eso son testeables.
- La parte pesada es mapas/exportacion/reportes historicos.

## Auditoria

### `frontend/src/services/audit/useAuditService.js`

Responsabilidad:

- Guarda historial de auditoria en localStorage.
- Mantiene un maximo de 700 registros.
- Expone registros reactivos.

Funciones principales:

- `appendAuditLog`: agrega un registro.
- `clearAuditLog`: limpia auditoria.
- `resetAuditLog`: vuelve a semillas.
- `useAuditService`: expone `auditRecords` y acciones.
- `normalizeAuditRecord`: asegura forma consistente del registro.

Razonamiento:

- Sirve para probar el modulo.
- En produccion la auditoria debe ser backend append-only, no editable desde cliente.

### `frontend/src/composables/audit/useAuditTrail.js`

Responsabilidad:

- Wrapper para registrar auditoria desde cualquier vista.
- Resuelve usuario actual.
- Resuelve empresa actual desde ruta o parametro.

Funcion principal:

- `recordAudit`: agrega evento con usuario, empresa, modulo, accion, entidad y descripcion.

Razonamiento:

- Evita repetir armado de auditoria en cada componente.
- Es una buena fachada para luego cambiar `appendAuditLog` por una llamada API.

### `frontend/src/views/AuditView.vue`

Responsabilidad:

- Muestra listado de auditoria.
- Filtra por busqueda, modulo y estado.
- Agrupa por fecha.
- Exporta CSV si hay permiso.
- Abre modal detalle.

Funciones principales:

- `visibleRecords`: registros visibles por empresa.
- `moduleOptions`: modulos disponibles en filtros.
- `statusOptions`: estados disponibles.
- `filteredRecords`: aplica filtros.
- `groupedRecords`: agrupa por dia.
- `selectedRecord`: registro seleccionado.
- `summaryMetrics`: totales, correctos, alertas, fallidos.
- `clearFilters`: limpia filtros.
- `selectRecord`: abre detalle.
- `closeAuditDetailModal`: cierra detalle.
- `exportAuditCsv`: exporta CSV.

Componentes:

- `AuditSummaryHeader.vue`: resumen superior.
- `AuditFilters.vue`: filtros y exportacion.
- `AuditActivityTable.vue`: tabla agrupada.
- `AuditDetailModal.vue`: detalle modal.

Razonamiento:

- La modularizacion actual esta bien: `AuditView` concentra estado y los componentes renderizan.
- Lo que falta para produccion es backend real y paginacion server-side.

## Usuarios

### `frontend/src/views/UserManagementView.vue`

Responsabilidad:

- Gestiona usuarios, estado, filtros, edicion y accesos.
- Permite crear/editar usuarios si permisos lo permiten.
- Permite gestionar accesos por empresa/modulo/funcion.

Composables y utils:

- `useUserAccessManagement`: estado principal de usuarios/accesos.
- `useUserAccessDrafts`: formularios/drafts de permisos.
- `userAccessStateUtils.js`: normalizacion de permisos, scopes, drafts y validaciones.
- `userAccessUtils.js`: labels, estilos, busqueda, iniciales.

Razonamiento:

- Es modulo administrativo sensible.
- Backend debe validar identidad unica, roles, permisos y acceso.

## Empresas

### `frontend/src/views/CompanyManagementView.vue`

Responsabilidad:

- Gestiona empresas, sucursales, estado y configuracion.
- Muestra catalogo y panel de configuracion.

Composables y utils:

- `useCompanyManagement`: CRUD y seleccion de empresas.
- `useCompanyBranches`: CRUD de sucursales.
- `companyUtils.js`: labels, estados, rutas y busqueda.

Razonamiento:

- Empresa/sucursal son datos maestros.
- En produccion deben persistir en backend y auditar cambios.

## Espacios de trabajo

### `frontend/src/composables/workspaces/useWorkspaces.js`

Responsabilidad:

- Crea multiples espacios por usuario.
- Permite seleccionar, renombrar, compartir, guardar vista y eliminar.
- Guarda en localStorage.
- Registra auditoria.

Funciones principales:

- `ensureDefaultWorkspace`: crea vista principal si no existe.
- `selectWorkspace`: cambia workspace activo.
- `createWorkspace`: crea una vista guardada.
- `renameWorkspace`: renombra.
- `saveCurrentWorkspaceView`: guarda estado visual actual.
- `deleteWorkspace`: elimina si no es la unica vista propia.
- `shareWorkspace`: comparte con otros usuarios.

Razonamiento:

- El concepto esta bien ubicado como composable.
- Para que sea real multiusuario debe pasar a backend. En localStorage solo funciona por navegador.

### `frontend/src/composables/workspaces/useWorkspaceViewState.js`

Responsabilidad:

- Publicar estado actual de vista.
- Solicitar restauracion de vista.

Funciones:

- `publishWorkspaceViewState`: guarda snapshot actual.
- `requestWorkspaceViewRestore`: crea solicitud de restauracion.
- `useWorkspaceViewState`: expone estado.

Razonamiento:

- Es un puente liviano entre layout/header y vistas.
- Esta bien que sea frontend, pero la persistencia final debe ser backend.

## Direcciones y geocoding

### `frontend/src/services/location/reverseGeocodingService.js`

Responsabilidad:

- Resolver direcciones desde coordenadas.
- Cachear resultados.
- Decidir si una fuente necesita reverse geocoding.
- Resolver origen/destino en reportes de viaje.

Funciones importantes:

- `isReverseGeocodingEnabled`
- `getReverseGeocodeCoordinates`
- `getReverseGeocodeKey`
- `formatFallbackCoordinateAddress`
- `getCachedReverseGeocodeAddress`
- `shouldResolveReverseGeocode`
- `reverseGeocodeCoordinates`
- `resolveReverseGeocodedSources`
- `getRouteTripEndpointCoordinates`
- `getRouteTripEndpointAddressValue`
- `shouldResolveRouteTripEndpointReverseGeocode`
- `withResolvedRouteTripEndpointAddresses`

Razonamiento:

- Puede existir en frontend para enriquecer vista.
- Para reportes oficiales conviene backend, cache central y control de cuotas/errores.

## Exportaciones

### PDF, Excel, CSV

Partes principales:

- `useRouteDeviationDocument`: arma y captura PDF de desvio.
- `itineraryPanelExportService.js`: exporta itinerarios.
- `assetReportExportUtils.js`: exporta reportes de activos.
- `routeTripMapImageUtils.js`: arma imagen de mapa para reporte de viajes.
- `exportAuditCsv`: CSV de auditoria.

Razonamiento:

- Frontend sirve para exportaciones livianas.
- Si se exige consistencia, programacion automatica o grandes volumenes, los PDF/Excel deben ser backend jobs.

## Utilidades generales

Archivos importantes:

- `idUtils.js`: normaliza IDs.
- `numberUtils.js`: parseo numerico.
- `telemetryUtils.js`: timestamps y normalizacion de reportes de telemetria.
- `terminalUtils.js`: logs de terminal.
- `performanceUtils.js`: mediciones dev.
- `mapSignatureUtils.js`: firmas para evitar renders innecesarios.
- `geofenceUtils.js`: metadata visual y normalizacion de geocercas.
- `geofenceMapUtils.js`: helpers de dibujo.

Razonamiento:

- Las utils deben ser puras y testeables.
- Si una util toca localStorage, DOM, red o estado global, probablemente deberia ser service o composable.

## Que deberia quedar en frontend

Debe quedarse en frontend:

- Vistas y componentes visuales.
- Interaccion de formularios.
- Estado visual temporal.
- Render de mapas.
- Edicion visual de geocercas/rutas.
- Previsualizaciones.
- Validaciones livianas de UX.
- Preferencias visuales locales mientras exista backend.
- Formateo basico.

## Que deberia pasar a backend

Prioridad alta:

- Autenticacion real.
- Usuarios, roles y permisos.
- Empresas, aplicaciones, sucursales y activos.
- Auditoria append-only.
- Espacios de trabajo multiusuario y compartidos.
- Plantillas de reportes.
- Reglas de evento.
- Programaciones de reportes.
- Historial de telemetria.
- Generacion oficial de viajes.
- Geocercas persistentes.
- Eventos de geocercas.
- PDF/Excel programados o masivos.

Prioridad media:

- Reverse geocoding con cache central.
- Calculo de rutas OSRM.
- Comparacion de rutas planificadas vs reales.
- Resumenes agregados para dashboards.
- Recomendaciones de graficos/reportes.

## Cuellos de botella actuales

1. Telemetria en cliente

El mapa y la tabla reciben datos en vivo. Ya hay amortiguacion de tabla, pero si aumenta la flota, el cuello sera render de marcadores, historial y filtros.

2. Reportes en cliente

Generar reportes, mapas, Excel y PDF en el navegador puede bloquear UI y consumir mucha memoria.

3. localStorage como base de datos

No sirve para multiusuario real ni para consistencia entre dispositivos.

4. Auditoria local

No es confiable para produccion. El usuario puede limpiar o modificar localStorage.

5. Archivo HTML de trabajo

`frontend/src/views/a.html` pesa casi 492 KB, pero fue confirmado como archivo aparte en uso. No debe eliminarse ni moverse sin confirmacion explicita.

6. Encoding

Se reviso el codigo activo y no aparecieron textos rotos relevantes. Si vuelven a aparecer palabras con mojibake, conviene normalizar UTF-8 o mantener ASCII consistente.

7. Componentes aun grandes

`ActivosView.vue`, `ReportsView.vue`, `ReportExecutionModal.vue` y `ReportEventRuleFormModal.vue` concentran mucha logica.

## Archivos candidatos a revisar o eliminar

Candidatos claros:

- `frontend/src/views/a.html`: no tocar sin confirmacion; el archivo esta en uso como referencia/trabajo aparte.
- `frontend/src/views/a.hm`: aparece en el IDE, revisar si existe. No aparece listado por `rg --files`, pero si esta en disco deberia eliminarse o moverse fuera de `src`.
- Archivos mock bajo `frontend/src/data`: mantener solo para dev/prototipo.
- Mock adapters bajo `frontend/src/services/*/mock*.js`: mantener para dev/test, no como fuente productiva.

No eliminar sin revisar:

- Tests `*.test.js`: ayudan a proteger reglas complejas.
- Utils de reportes/mapas: aunque grandes, hoy soportan funcionalidad real.
- Composables de mapa: estan separando complejidad necesaria.

## Guia de lectura recomendada

Orden para entender el frontend:

1. `main.js` y `App.vue`.
2. `router/index.js`.
3. `useAuthSession.js`.
4. `useAccessControl.js`.
5. `useMockDatabase.js`.
6. `ActivosView.vue`.
7. `useActivosTelemetrySync.js` y `useFleetTelemetry.js`.
8. `ActivosMapPanel.vue` y `useActivosMap.js`.
9. `ReportsView.vue`.
10. `useReportTemplates.js`, `useReportEventRules.js`, `useAssetReportExecution.js`.
11. `reportEventRuleEngine.js` y `assetReportExecutionUtils.js`.
12. `AuditView.vue`, `useAuditTrail.js`, `useAuditService.js`.
13. `useWorkspaces.js` y `WorkspaceSelector.vue`.

## Arquitectura objetivo

Frontend:

- Presentacion.
- Formularios.
- Mapa interactivo.
- Previsualizaciones.
- Estado visual local.
- Cache liviano.

Backend:

- Auth.
- RBAC/permisos.
- Datos maestros.
- Auditoria.
- Telemetria historica.
- Reportes.
- Programaciones.
- Geocoding/routing cacheado.
- Comparacion de rutas.

Contrato API recomendado:

- `/auth/login`
- `/auth/logout`
- `/companies`
- `/companies/:id/assets`
- `/companies/:id/geofences`
- `/companies/:id/workspaces`
- `/users`
- `/users/:id/accesses`
- `/reports/templates`
- `/reports/event-rules`
- `/reports/executions`
- `/reports/schedules`
- `/audit`
- `/telemetry/live`
- `/telemetry/history`

## Criterio para seguir mejorando

Antes de mover codigo al backend:

- Separar adapter mock de adapter API.
- Mantener los mismos composables publicos para no romper pantallas.
- Agregar tests a reglas que ya funcionan.
- Cambiar una fuente de datos por vez.
- Validar que PDF, Excel y previsualizacion usan el mismo origen.

Prioridad sugerida:

1. Limpiar archivos temporales.
2. Definir adapters API sin eliminar mocks.
3. Migrar auditoria a backend.
4. Migrar espacios de trabajo a backend.
5. Migrar reportes/reglas/programaciones.
6. Migrar telemetria historica.
7. Dejar frontend solo con render, filtros y previsualizacion.

## Lectura del codigo con ejemplos

Esta seccion baja la guia a codigo real. La idea es entender no solo que archivo existe, sino como fluye la informacion, por que se hizo asi y donde tocar sin romper otras partes.

## Patron general de una vista Vue

La mayoria de las vistas usan esta forma:

```vue
<template>
  <!-- UI -->
</template>

<script setup>
import { computed, ref } from "vue"

const estado = ref("")
const datoCalculado = computed(() => {
  return estado.value
})

const accion = () => {
  estado.value = "nuevo valor"
}
</script>
```

Como leerlo:

1. Primero mira el `template`, porque ahi ves que componentes usa la pantalla.
2. Despues mira los `import`, porque te dicen que capas consume.
3. Luego busca `ref`: es estado editable local.
4. Luego busca `computed`: son datos derivados.
5. Luego busca funciones `handle...`, `open...`, `close...`, `save...`, `delete...`: son acciones de usuario.
6. Finalmente busca `watch`: son efectos automaticos cuando cambia algo.

Razonamiento:

- `ref` guarda estado.
- `computed` evita recalcular manualmente y mantiene datos sincronizados.
- `watch` debe usarse con cuidado, porque dispara efectos. Si hay muchos watchers o hacen trabajo pesado, puede producir lag.

## Flujo completo al abrir la plataforma

Codigo base:

```js
createApp(App).use(router).mount("#app")
```

Explicacion:

- Vue crea la app.
- El router decide que vista renderizar.
- `App.vue` recibe la ruta actual.
- Si la ruta es publica, muestra solo login/no-access.
- Si la ruta es privada, muestra header, sidebar y contenido.

En `App.vue`:

```vue
<router-view v-if="isPublicRoute" />

<div v-else class="fixed inset-0 flex flex-col overflow-hidden bg-gray-50 font-sans">
  <AppHeader @toggle-sidebar="toggleSidebar" />
  <ImpersonationBanner />

  <div class="relative flex min-h-0 flex-1 overflow-hidden">
    <AppSidebar :is-open="showSidebar" @update:is-open="showSidebar = $event" />

    <main class="min-h-0 flex-1 overflow-hidden bg-[#f3f3f3]">
      <router-view :app-sidebar-open="showSidebar" />
    </main>
  </div>
</div>
```

Explicacion:

- `isPublicRoute` sale de `route.meta.public`.
- Login no usa header/sidebar.
- Los modulos internos si usan shell completo.
- `showSidebar` se pasa al sidebar y tambien a la vista actual como prop.

Que tocar si quieres cambiar visual global:

- Header: `frontend/src/components/Layout/AppHeader.vue`
- Sidebar: `frontend/src/components/Layout/AppSidebar.vue`
- Contenedor principal: `frontend/src/App.vue`
- Estilos globales: `frontend/src/style.css`

## Flujo del router y permisos

Fragmento clave:

```js
router.beforeEach((to) => {
  const { isAuthenticated, isPlatformAdmin, defaultAuthenticatedRoute } = useAuthSession()
  const {
    accessibleCompanies,
    canAccessCompany,
    canAccessModule,
    canAccessFunction,
    canViewUsers,
  } = useAccessControl()

  if (to.meta.public) {
    return isAuthenticated.value ? defaultAuthenticatedRoute.value : true
  }

  if (!isAuthenticated.value) {
    return {
      name: "Login",
      query: {
        redirect: to.fullPath,
      },
    }
  }
})
```

Explicacion:

- Cada cambio de ruta pasa por `beforeEach`.
- Si la ruta es publica y el usuario ya esta logueado, lo manda a su ruta por defecto.
- Si no esta logueado y entra a una ruta privada, lo manda a login.
- Guarda `redirect` para volver a la pagina que intento abrir.

Bloque de permisos por funcion:

```js
if (to.meta.requiresFunction) {
  const functionAccess = to.meta.requiresFunction

  const canEnter = canAccessFunction(
    functionAccess.id,
    companyId || null,
    functionAccess.permission || "view",
  )

  if (!canEnter) {
    return {
      name: "NoAccess",
    }
  }
}
```

Explicacion:

- Las rutas pueden pedir una funcion especifica.
- Ejemplo: auditoria pide `audit-view`.
- `permission` puede ser `view`, `edit` o `admin`.
- Si no cumple, va a `NoAccess`.

Razonamiento:

- Esto mejora UX y oculta modulos no permitidos.
- No es seguridad real por si solo. El backend debe validar lo mismo.

## Login explicado

La funcion principal vive en `useAuthSession.js`.

Fragmento:

```js
const login = ({ identifier, password }) => {
  const normalizedIdentifier = String(identifier || "")
    .trim()
    .toLowerCase()
  const normalizedPassword = String(password || "")

  const user = users.value.find((item) => {
    return [item.username, item.email].some((value) => {
      return (
        String(value || "")
          .trim()
          .toLowerCase() === normalizedIdentifier
      )
    })
  })
}
```

Explicacion:

- El login acepta username o email.
- Normaliza espacios y mayusculas.
- Busca el usuario en el servicio de auth.
- Luego compara password.

Cuando falla:

```js
recordAuthAudit({
  actorId: "anonymous",
  actorName: normalizedIdentifier || "Anonimo",
  action: "auth:login",
  entityName: normalizedIdentifier || "Sin usuario",
  status: "failed",
  severity: "warning",
  description: "Intento de inicio de sesion rechazado por credenciales invalidas.",
})
```

Explicacion:

- No solo devuelve error visual.
- Tambien crea auditoria.
- `status: failed` marca resultado.
- `severity: warning` permite destacarlo en auditoria.

Cuando funciona:

```js
authenticatedUserId.value = String(user.id)
persistSessionValue(SESSION_KEY, user.id)
clearImpersonation()
user.lastAccess = "Ahora"
```

Explicacion:

- Guarda usuario en sessionStorage.
- Limpia suplantacion anterior.
- Actualiza ultimo acceso.

Razonamiento:

- El frontend hoy simula auth.
- En backend real, esta funcion deberia cambiar a:
  - llamar `/auth/login`
  - recibir token
  - guardar token seguro
  - pedir perfil y permisos
  - auditar desde backend

## Permisos explicados

Archivo: `useAccessControl.js`.

Funcion importante:

```js
const canAccessFunction = (functionId, companyId = null, permission = "view") => {
  if (isPlatformAdmin.value) return true

  return getAccessesForCompany(companyId).some((access) => {
    return accessHasFunction(access, functionId, permission)
  })
}
```

Explicacion:

- Si es admin plataforma, entra siempre.
- Si no, busca accesos de esa empresa.
- Revisa si algun acceso tiene la funcion y permiso solicitado.

La funcion interna:

```js
const accessHasFunction = (access, functionId, permission = "view") => {
  const functionAccess = access?.functions?.find((item) => {
    return normalizeKey(item.functionId) === normalizeKey(functionId)
  })
  const moduleId = moduleFunctionsById.value.get(normalizeKey(functionId))?.moduleId
  const moduleAccess = access?.modules?.find((item) => {
    return normalizeKey(item.moduleId) === normalizeKey(moduleId)
  })

  if (!functionAccess?.enabled) return false
  if (moduleAccess && !moduleAccess.enabled) return false
  if (!permission) return true

  return Boolean(functionAccess.permissions?.[permission])
}
```

Explicacion:

- Primero busca la funcion exacta.
- Luego descubre a que modulo pertenece.
- Si la funcion esta apagada, no pasa.
- Si el modulo padre esta apagado, tampoco pasa.
- Si el permiso puntual no existe, no pasa.

Razonamiento:

- Es una estructura correcta para RBAC por modulo/funcion.
- Lo que falta en produccion es que estos permisos vengan firmados/validados por backend.

## Servicios y adapters explicados

Ejemplo: `useActivosService.js`.

```js
import { createMockActivosAdapter } from "./mockActivosAdapter.js"

export const useActivosService = () => {
  return createMockActivosAdapter()
}
```

Explicacion:

- La vista no llama directo a `useMockDatabase`.
- Llama a `useActivosService`.
- Ese servicio hoy devuelve el adapter mock.

Adapter mock:

```js
export const createMockActivosAdapter = () => {
  const { assets, getApplicationForCompany, createAsset, updateAsset, deleteAsset } =
    useMockDatabase()

  const createActivo = ({ activo, companyId }) => {
    return createAsset(
      buildCreateActivoPayload({
        activo,
        companyId,
      }),
    )
  }

  return {
    activos: assets,
    createActivo,
    updateActivo: updateAsset,
    deleteActivo: deleteAsset,
  }
}
```

Explicacion:

- `assets` es estado reactivo.
- `createActivo` adapta el payload que recibe la UI al formato del mock DB.
- `updateActivo` y `deleteActivo` se reexportan desde la DB mock.

Razonamiento:

- Este patron permite cambiar a API real asi:

```js
export const useActivosService = () => {
  return createApiActivosAdapter()
}
```

- Si se mantiene la misma forma (`activos`, `createActivo`, `updateActivo`, `deleteActivo`), las vistas no deberian romperse.

## Mock database explicado

Archivo: `useMockDatabase.js`.

Este archivo esta actuando como backend temporal.

Partes internas:

```js
const companies = ref(...)
const applicationDefinitions = ref(...)
const assets = ref(...)
const users = ref(...)
const accesses = ref(...)
```

Explicacion:

- Cada `ref` representa una tabla mock.
- Vue reacciona cuando cambian.
- Luego los servicios leen estas listas.

Persistencia:

```js
const schedulePersistDatabase = () => {
  if (persistTimer) return

  persistTimer = globalThis.setTimeout(() => {
    persistTimer = null
    persistDatabase()
  }, PERSIST_DEBOUNCE_MS)
}
```

Explicacion:

- No guarda localStorage en cada cambio inmediatamente.
- Espera un poco para agrupar cambios.
- Esto reduce escrituras innecesarias.

CRUD:

```js
const updateAsset = (assetId, changes) => {
  const normalizedAssetId = normalizeKey(assetId)

  assets.value = assets.value.map((asset) => {
    return normalizeKey(asset.id) === normalizedAssetId
      ? normalizeAsset({
          ...asset,
          ...changes,
        })
      : asset
  })

  schedulePersistDatabase()
}
```

Explicacion:

- No muta el arreglo directamente.
- Crea un nuevo arreglo para que Vue detecte cambio.
- Normaliza el activo actualizado.
- Agenda persistencia.

Razonamiento:

- Bien para prototipo.
- En produccion es backend.
- Mantenerlo como mock/dev ayuda para pruebas locales.

## ActivosView explicado como controlador

`ActivosView.vue` junta muchos submodulos. La forma correcta de leerlo es por bloques.

### 1. Empresa activa

```js
const activeCompanyId = computed(() => String(route.params.empresaId || ""))
```

Explicacion:

- La empresa viene de la URL.
- Todo lo que se muestra depende de esa empresa.

### 2. Activos base

```js
const baseMockActivos = computed(() => {
  // filtra activos disponibles segun empresa/permisos
})
```

Explicacion:

- Es la fuente base para tabla y mapa.
- Luego la telemetria viva modifica snapshots.

### 3. Preferencias visuales

```js
const fleetTableColumnPreferences = ref({})
```

Explicacion:

- Guarda preferencias de columnas.
- Despues se usa en workspace settings.

### 4. Snapshot de workspace

```js
const buildActivosWorkspaceSettings = () => {
  return {
    leftPanelWidth: leftPanelWidth.value,
    activeSidebarSection: activeSidebarSection.value,
    statusFilter: statusFilter.value,
    searchTerm: searchTerm.value,
    fleetTableColumnPreferences: fleetTableColumnPreferences.value,
  }
}
```

Explicacion:

- Captura como esta configurada la pantalla.
- Esto permite guardar una vista.
- Debe incluir cada aspecto visual que el usuario espera recuperar.

Razonamiento:

- Si algo no se guarda en esta funcion, el workspace no lo va a recordar.
- Por eso ancho de mapa/sidebar, columnas, filtros y orden deben salir de aqui o de funciones relacionadas.

### 5. Aplicacion de workspace

```js
const applyActivosWorkspaceSettings = async (settings = {}) => {
  // restaura filtros, columnas, sidebar y estado visual
}
```

Explicacion:

- Toma una configuracion guardada y la aplica a la vista.
- Es la contraparte de `buildActivosWorkspaceSettings`.

Razonamiento:

- Siempre que se agregue una preferencia visual, hay que tocar ambas:
  - build/captura
  - apply/restauracion

## Telemetria explicada

Archivo: `useActivosTelemetrySync.js`.

Este composable existe para resolver un problema especifico: el mapa necesita telemetria inmediata, pero la tabla no debe actualizarse con cada pulso porque se pone lenta.

### Estado principal

```js
const tableActivos = shallowRef([])

let tableSyncTimer = null
let pendingFullTableSync = false
let pendingTableUpdateIds = new Set()
let lastTableSourceSnapshot = null
let isDisposed = false
```

Explicacion:

- `tableActivos`: snapshot usado por la tabla.
- `shallowRef`: Vue observa reemplazo del arreglo, no cada propiedad profunda.
- `pendingTableUpdateIds`: IDs que cambiaron y esperan sincronizacion.
- `pendingFullTableSync`: fuerza clonacion completa.
- `isDisposed`: evita efectos despues de desmontar.

### Mapa vs tabla

```js
const mapActivos = computed(() => {
  return filterActivosByCurrentState(normalizedActivos.value)
})

const filteredActivos = computed(() => {
  return filterActivosByCurrentState(tableActivos.value)
})
```

Explicacion:

- `mapActivos` usa datos vivos.
- `filteredActivos` usa snapshot amortiguado.
- Asi el mapa se mueve en vivo y la tabla respira.

### Recibir lote de telemetria

```js
const handleTelemetryBatch = (batch = []) => {
  if (isDisposed || !Array.isArray(batch) || batch.length === 0) {
    return
  }

  if (typeof onTelemetryBatch === "function") {
    onTelemetryBatch(batch)
  }

  if (typeof appendTelemetryPulses === "function") {
    appendTelemetryPulses(batch)
  }

  appendTelemetryReports(batch)

  scheduleTableActivosSync({
    updates: batch,
  })
}
```

Explicacion:

- Manda el lote al mapa inmediatamente.
- Manda el lote a terminal/historial.
- Guarda historial global para reportes.
- Agenda actualizacion de tabla.

Razonamiento:

- Esto evita regenerar reportes automaticamente.
- Los reportes leen el historial solo cuando el usuario presiona Generar.

### Sincronizacion incremental

```js
const syncTableActivosIncrementally = () => {
  const sourceSnapshot = normalizedActivos.value

  if (!pendingTableUpdateIds.size || !tableActivos.value.length) {
    syncTableActivos()
    return
  }

  if (sourceSnapshot.length !== tableActivos.value.length) {
    syncTableActivos()
    return
  }
}
```

Explicacion:

- Si no sabe que IDs cambiaron, hace sync completo.
- Si cambia el largo del arreglo, hace sync completo.
- Si puede, reemplaza solo activos modificados.

Razonamiento:

- Esta es una optimizacion importante.
- Mantiene tabla mas estable con flotas medianas/grandes.

## Workspaces explicados

Archivo: `useWorkspaces.js`.

### Crear workspace por defecto

```js
const ensureDefaultWorkspace = () => {
  const user = resolvedUserId.value

  if (!user) return null

  const existingWorkspace = accessibleWorkspaces.value[0]

  if (existingWorkspace) {
    if (!activeWorkspaceId.value) {
      setActiveWorkspaceId(existingWorkspace.id)
    }

    return existingWorkspace
  }
}
```

Explicacion:

- Si el usuario no tiene workspace, crea uno.
- Si ya tiene, lo activa.

### Guardar vista actual

```js
const saveCurrentWorkspaceView = (workspaceId = activeWorkspaceId.value) => {
  const workspace = resolveOwnedWorkspace(workspaceId)

  if (!workspace) return null

  const updatedWorkspace = toPersistedWorkspace({
    ...workspace,
    ...buildCurrentViewSnapshot(),
    updatedAt: new Date().toISOString(),
  })
}
```

Explicacion:

- Solo permite guardar si el workspace es propio.
- Mezcla datos anteriores con snapshot actual.
- Actualiza `updatedAt`.

Razonamiento:

- Esto replica la idea tipo GPSGate: guardar vista, guardar como, administrar espacios.
- Falta persistencia backend para que sea realmente por usuario y compartible entre usuarios/dispositivos.

### Compartir workspace

```js
const shareWorkspace = (workspaceId, sharedWithUserIds = []) => {
  const workspace = resolveOwnedWorkspace(workspaceId)

  if (!workspace) return null

  const sharedUserIds = normalizeUserIds(sharedWithUserIds).filter((sharedUserId) => {
    return sharedUserId !== resolvedUserId.value
  })
}
```

Explicacion:

- Solo el dueno puede compartir.
- No permite compartirse a si mismo.
- Guarda lista de usuarios compartidos.

Razonamiento:

- Correcto como modelo.
- En localStorage no es multiusuario real.

## Auditoria explicada

### Servicio

Archivo: `useAuditService.js`.

```js
export const appendAuditLog = (entry = {}) => {
  const record = normalizeAuditRecord(entry)

  auditRecords.value = [record, ...auditRecords.value].slice(0, MAX_AUDIT_RECORDS)
  persistAuditRecords()

  return record
}
```

Explicacion:

- Normaliza el registro.
- Lo inserta al principio.
- Corta el historial a 700.
- Persiste en localStorage.

Razonamiento:

- Suficiente para probar.
- No sirve como auditoria real porque el usuario podria borrar storage.

### Composable wrapper

Archivo: `useAuditTrail.js`.

```js
const recordAudit = (entry = {}) => {
  const explicitCompanyId = entry.companyId === undefined ? null : normalizeId(entry.companyId)
  const auditCompanyId = explicitCompanyId ?? resolvedCompanyId.value
  const company = auditCompanyId ? companiesById.value.get(auditCompanyId) : null
  const auditCompanyName =
    entry.companyName || company?.name || (auditCompanyId ? "Empresa" : "Plataforma")
  const user = currentUser.value
}
```

Explicacion:

- Si el evento trae empresa explicita, usa esa.
- Si no, usa la empresa de la ruta.
- Busca nombre de empresa.
- Busca usuario actual.
- Luego llama a `appendAuditLog`.

Razonamiento:

- Las vistas no necesitan saber como armar actor/empresa.
- Solo llaman `recordAudit({ module, action, entityType, entityName, description })`.

### Vista de auditoria

Archivo: `AuditView.vue`.

```js
const filteredRecords = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return visibleRecords.value.filter((record) => {
    if (selectedModule.value && record.module !== selectedModule.value) return false
    if (selectedStatus.value && record.status !== selectedStatus.value) return false

    if (!query) return true

    return [
      record.actorName,
      record.action,
      getRecordCompanyName(record),
      record.description,
      record.entityName,
      record.entityType,
      record.module,
      record.status,
    ].some((value) => {
      return String(value || "")
        .toLowerCase()
        .includes(query)
    })
  })
})
```

Explicacion:

- Primero filtra modulo.
- Luego filtra estado.
- Luego busca texto en varios campos.

Razonamiento:

- Para pocos registros esta bien.
- Con miles de registros, backend deberia filtrar y paginar.

## Reportes explicados

### Creacion/edicion de plantilla

Archivo: `useReportBuilder.js`.

Idea:

- `createEmptyReportDraft`: estado inicial para crear reporte.
- `createReportDraftFromTemplate`: convierte una plantilla existente en draft editable.
- `useReportBuilder`: mantiene el draft, validaciones y acciones de formulario.

Razonamiento:

- Separar draft de plantilla evita modificar datos reales mientras el modal esta abierto.
- Guardar ocurre solo al confirmar.

### Plantillas

Archivo: `useReportTemplates.js`.

Flujo:

1. Carga plantillas base desde `mockReportTemplates.js`.
2. Lee plantillas guardadas.
3. Mezcla base + guardadas.
4. Respeta eliminaciones de plantillas base.
5. Sincroniza reglas activas.

Funcion clave:

```js
export const canDeleteReportTemplate = (template = {}) => {
  return !template.isBaseTemplate || template.isUserEditable
}
```

Explicacion:

- Permite controlar si una plantilla base puede eliminarse.
- Esto responde al flujo que se queria: reportes base, pero modificables/eliminables cuando corresponde.

Razonamiento:

- Es correcto tener reglas explicitas de borrado.
- En backend debe quedar como politica por rol/tenant.

### Reglas de evento

Archivo: `useReportEventRules.js`.

Razonamiento:

- Las reglas componen el comportamiento de los reportes.
- Un reporte no deberia tener logica especial escondida en codigo si se puede expresar como regla.
- Por eso el modulo de reglas es central para reportes configurables.

Campos que normaliza:

- ID.
- Condiciones.
- Alcance.
- Calendario.
- Activacion.
- Notificaciones.

### Motor de reglas

Archivo: `reportEventRuleEngine.js`.

Funcion publica:

```js
export const doesReportMatchEventRule = ({ report, asset, rule }) => {
  // evalua si un evento/reporte cumple la regla
}
```

Explicacion:

- Revisa si la regla aplica al grupo.
- Revisa calendario.
- Revisa condiciones.
- Revisa senales por defecto como ralentí, exceso de velocidad, GPS o geocerca.

Funcion de varias reglas:

```js
export const doesReportMatchEventRules = ({ report, asset, template, eventRulesById }) => {
  // evalua una plantilla contra sus reglas activas
}
```

Explicacion:

- La plantilla dice que reglas usa.
- El motor decide si el registro entra o no.

Razonamiento:

- Esta parte deberia ser compartida entre frontend/backend o migrada a backend.
- Si PDF/Excel/backend no usan el mismo motor, van a aparecer diferencias.

## Ejecucion de reportes explicada

Archivo: `useAssetReportExecution.js`.

### Estado de ejecucion

```js
const dateFrom = ref(toDateInputValue(weekAgo))
const dateTo = ref(toDateInputValue(today))
const assetSearch = ref("")
const selectedGroupId = ref("all")
const selectedAssetIds = ref([])
const executedAt = ref(null)
const reportRows = shallowRef([])
```

Explicacion:

- Controla fechas.
- Controla busqueda de activos.
- Controla grupo seleccionado.
- Controla activos seleccionados.
- `reportRows` guarda el resultado.

### Validacion

```js
const dateRangeError = computed(() => {
  if (!dateFrom.value || !dateTo.value) {
    return "Debes seleccionar fecha desde y fecha hasta."
  }

  if (dateFrom.value > dateTo.value) {
    return "La fecha desde no puede ser mayor que la fecha hasta."
  }

  return ""
})
```

Explicacion:

- Impide generar sin fechas.
- Impide rango invertido.

### Puede ejecutar

```js
const canExecuteReport = computed(() => {
  return Boolean(
    selectedAssets.value.length && templateEventRuleIds.value.length && !dateRangeError.value,
  )
})
```

Explicacion:

- Debe haber activos.
- Debe haber reglas.
- El rango de fechas debe ser valido.

### Ejecucion por lotes

```js
for (
  let assetIndex = 0;
  assetIndex < selectedAssetsSnapshot.length;
  assetIndex += REPORT_ASSET_BATCH_SIZE
) {
  const assetBatch = selectedAssetsSnapshot.slice(
    assetIndex,
    assetIndex + REPORT_ASSET_BATCH_SIZE,
  )

  generatedRows.push(
    ...buildAssetReportRows({
      selectedAssets: assetBatch,
      reportColumns: reportColumnsSnapshot,
      companyNameById: companyNameByIdSnapshot,
      dateFrom: dateFromSnapshot,
      dateTo: dateToSnapshot,
      getReportsForAsset,
      getReportEventsForAsset,
      template: templateSnapshot,
      eventRulesById: eventRulesByIdSnapshot,
      geofences: geofencesSnapshot,
    }),
  )

  if (assetIndex + REPORT_ASSET_BATCH_SIZE < selectedAssetsSnapshot.length) {
    await waitForReportBatch()
  }
}
```

Explicacion:

- Toma activos de 20 en 20.
- Genera filas por lote.
- Cede el hilo con `setTimeout(0)` entre lotes.

Razonamiento:

- Evita congelar tanto el navegador.
- Para cientos/miles de activos, mejor backend jobs.

### Exportacion lazy

```js
const { exportAssetReportExcel } = await import("../utils/reports/export/assetReportExportUtils.js")
```

Explicacion:

- ExcelJS no se carga al abrir la pantalla.
- Se carga solo cuando el usuario exporta.

Razonamiento:

- Buen patron para performance.
- Tambien se usa para PDF.

## Viajes explicado

Archivo: `assetReportTripUtils.js`.

La idea de viaje se construye desde una linea temporal de puntos/eventos.

Funciones internas importantes:

- `isMovingTimelineItem`: detecta movimiento.
- `isTripEndTimelineItem`: detecta fin de viaje.
- `isStopTimelineItem`: detecta parada.
- `isIdleTimelineItem`: detecta ralentí.
- `buildRouteHistoryTrips`: separa la historia en viajes.
- `buildRouteHistoryTripReport`: arma resumen de un viaje.
- `buildRouteHistoryTripRows`: funcion publica que entrega filas de viajes.

Razonamiento:

- Segun tu regla, un viaje deberia cortarse cuando ignicion esta off y velocidad esta en 0.
- Esa regla debe vivir como regla configurable/event rule o como configuracion del reporte de viajes.
- Para produccion, el backend debe generar los viajes oficiales, porque depende de telemetria historica completa.

## Imagen de mapa en reportes

Archivo: `routeTripMapImageUtils.js`.

Responsabilidad:

- Tomar filas de viaje.
- Sacar puntos de mapa.
- Construir una imagen/render para PDF y Excel.
- Manejar varios dispositivos con colores distintos.
- Evitar que lineas gruesas tapen diferencias.

Razonamiento:

- La imagen del mapa pertenece a exportacion/previsualizacion.
- Si el reporte es oficial o programado, backend deberia generar o pedir esa imagen con los mismos datos.

## Mapa explicado

### `useActivosMap.js`

Responsabilidad:

- Inicializa Leaflet.
- Controla capas.
- Ajusta viewport.
- Coordina subcontroladores.

Como leerlo:

1. Buscar constantes de capas (`MAP_TILE_LAYERS`).
2. Buscar inicializacion de mapa.
3. Buscar watchers de props.
4. Buscar retornos publicos.

### Marcadores

Archivo: `useMapAssetMarkers.js`.

Responsabilidad:

- Crear/controlar marcadores.
- Actualizar iconos con telemetria.
- Aplicar clustering.
- Evitar recrear todo cuando cambia poco.

Razonamiento:

- Los marcadores son una de las mayores fuentes de lag.
- Por eso existen caches, firmas y actualizacion por lote.

### Clusters

Archivos:

- `assetMarkerClusterConfig.js`
- `assetMarkerClusterData.js`
- `assetMarkerClusterSignatures.js`
- `assetMarkerClusters.js`

Razonamiento:

- Si hay muchos activos, mostrar todos los puntos individuales es caro.
- El cluster reduce DOM/Leaflet layers.
- Las firmas evitan recalcular si el viewport o datos no cambiaron realmente.

### Tooltips

Archivo: `assetMarkerTooltips.js`.

Responsabilidad:

- Construir contenido del tooltip.
- Resolver direccion si esta habilitada.
- Cachear errores temporales para no insistir cada segundo.

Razonamiento:

- Los tooltips no deberian hacer geocoding masivo.
- Si todos los markers piden direccion al mismo tiempo, se vuelve cuello de botella.

## Geocercas explicado

### Persistencia

Archivo: `useGeofences.js`.

Flujo:

1. Lee geocercas guardadas.
2. Normaliza tipo y coordenadas.
3. Filtra por empresa.
4. Expone acciones de crear/editar/eliminar.
5. Persiste cambios.

Funcion conceptual:

```js
const normalizeGeofence = (geofence) => {
  // asegura id, tipo, nombre, color, coordenadas, radio y companyId
}
```

Explicacion:

- Evita que geocercas viejas o incompletas rompan el mapa.
- Tambien limpia formatos antiguos.

### Dibujo y edicion

Archivos:

- `useGeofenceDrawing.js`: dibujo nuevo.
- `useGeofenceEditing.js`: edicion.
- `useGeofenceRenderer.js`: render.
- `geofenceCreation.js`: crea objeto final desde puntos.
- `geofenceFocus.js`: centra mapa.
- `geofenceMapStyles.js`: colores y estilos.

Razonamiento:

- Crear/editar/renderizar son responsabilidades distintas.
- Esta separacion ayuda a no romper el mapa cuando se toca el formulario.

## Itinerarios explicado

Archivo: `useItineraryRoute.js`.

Flujo:

1. Toma activo seleccionado.
2. Lee reportes/historial.
3. Normaliza timestamps.
4. Filtra por fecha.
5. Une puntos.
6. Calcula resumen.

Funciones importantes:

- `parseMinutesFromLabel`: convierte duraciones textuales.
- `formatDistance`: muestra metros/km.
- `hasValidAssetLocation`: valida activo con coordenadas.
- `sortPointsByTimestamp`: ordena ruta.
- `mergeRoutePoints`: evita duplicados.
- `normalizeReportTimestamp`: robustez para timestamps distintos.
- `isPointInsideDateRange`: filtro por rango.

Razonamiento:

- El frontend tiene que soportar datos con nombres distintos porque vienen de fuentes mock/telemetria/reportes.
- En backend real conviene normalizar el contrato y reducir estos fallback.

## Modal de auditoria modular explicado

El modulo auditoria se separo asi:

- `AuditView.vue`: estado y reglas.
- `AuditSummaryHeader.vue`: header/resumen.
- `AuditFilters.vue`: inputs/selects/export.
- `AuditActivityTable.vue`: tabla agrupada.
- `AuditDetailModal.vue`: detalle.

Razonamiento:

- La vista mantiene la inteligencia.
- Los componentes reciben props y emiten eventos.
- Esto facilita cambiar visual sin tocar filtros/export.

Ejemplo de comunicacion padre-hijo:

```vue
<AuditFilters
  :search-term="searchTerm"
  @update:search-term="searchTerm = $event"
/>
```

Explicacion:

- El padre guarda `searchTerm`.
- El hijo emite el nuevo valor.
- Se evito `v-model:search-term` porque la regla actual de ESLint no acepta argumentos en `v-model`.

## Donde agregar codigo nuevo sin romper

### Si agregas una accion auditable

Usa:

```js
const { recordAudit } = useAuditTrail()

recordAudit({
  module: "reportes",
  action: "report:generate",
  entityType: "reporte",
  entityName: template.name,
  description: "Se genero un reporte.",
})
```

No llames directo a `appendAuditLog` desde todos lados, porque perderias la resolucion central de usuario/empresa.

### Si agregas una preferencia visual

Debes revisar:

- Donde vive el estado (`ref` o composable).
- Donde se guarda en workspace (`buildActivosWorkspaceSettings`).
- Donde se restaura (`applyActivosWorkspaceSettings`).
- Si necesita persistencia local adicional.

### Si agregas una columna de reporte

Debes revisar:

- `assetReportColumnUtils.js`
- `assetReportRowBuilderUtils.js`
- `assetReportExportUtils.js`
- UI del modal de reporte si debe ser configurable.
- Tests relacionados.

### Si agregas una regla de evento

Debes revisar:

- `reportEventRuleConfig.js`
- `useReportEventRules.js`
- `reportEventRuleEngine.js`
- `ReportEventRuleFormModal.vue`
- Secciones del formulario en `components/reports/event-rules`.

### Si agregas un dato del activo

Debes revisar:

- `useMockDatabase.js` para normalizacion mock.
- `fleetAssetFormUtils.js` si aparece en formulario.
- `fleetTelemetryColumns.js` si aparece en tabla.
- `assetMarkerTooltips.js` si aparece en mapa.
- Reportes si debe exportarse.

## Errores/deudas de codigo detectables

### Encoding

Se reviso el codigo activo y no aparecieron textos rotos relevantes. El problema a vigilar es mojibake en textos visibles, comentarios o mensajes.

Impacto:

- Visualmente se ve poco profesional.
- Puede aparecer en UI, comentarios o mensajes.

Solucion:

- Normalizar archivos a UTF-8.
- Corregir textos visibles.
- Mantener una politica clara: ASCII en codigo si se quiere evitar problemas, o UTF-8 real bien configurado.

### Archivo HTML de trabajo en vistas

`frontend/src/views/a.html` pesa casi 492 KB, pero esta confirmado como archivo aparte en uso.

Impacto:

- Puede confundir revisiones automaticas si se interpreta como vista Vue.
- Puede aumentar chequeos o busquedas.

Solucion:

- No eliminar ni mover sin confirmacion explicita.
- Si mas adelante deja de usarse, moverlo a `docs/` o fuera de `src`.

### Logica critica en frontend

Ejemplos:

- Password mock.
- Permisos mock.
- Auditoria local.
- Workspaces localStorage.
- Reportes historicos desde historial cliente.

Impacto:

- No es seguro.
- No es multiusuario real.
- Los datos cambian por navegador.

Solucion:

- Mantener composables.
- Cambiar services/adapters a API.

## Como documentar cada funcion de ahora en adelante

Formato recomendado:

```md
### `nombreFuncion`

Archivo:

- `ruta/del/archivo.js`

Entrada:

- Que parametros recibe.

Salida:

- Que retorna o que modifica.

Responsabilidad:

- Una frase clara.

Riesgo:

- Que podria romper si se modifica.

Backend:

- Si deberia quedarse en frontend o moverse.
```

Ejemplo:

```md
### `scheduleTableActivosSync`

Archivo:

- `frontend/src/composables/activos/view/useActivosTelemetrySync.js`

Entrada:

- `immediate`, `full`, `updates`, `changedIds`.

Salida:

- No retorna datos importantes. Agenda o ejecuta sincronizacion.

Responsabilidad:

- Evitar que la tabla se actualice por cada pulso de telemetria.

Riesgo:

- Si se elimina o se hace siempre inmediato, la tabla puede laggear con muchos activos.

Backend:

- Debe quedarse en frontend porque es optimizacion visual.
```

## Funciones mas importantes explicadas

Estas son las funciones que conviene entender antes de tocar el proyecto. Son importantes porque sostienen flujos completos: entrada a la app, permisos, activos, telemetria, reportes, auditoria, workspaces y mapa.

## 1. `router.beforeEach`

Archivo:

- `frontend/src/router/index.js`

Responsabilidad:

- Decide si una ruta se puede abrir.
- Redirige a login cuando no hay sesion.
- Redirige a `NoAccess` cuando no hay permiso.
- Recuerda la ultima empresa usada.

Codigo clave:

```js
router.beforeEach((to) => {
  const { isAuthenticated, isPlatformAdmin, defaultAuthenticatedRoute } = useAuthSession()
  const {
    accessibleCompanies,
    canAccessCompany,
    canAccessModule,
    canAccessFunction,
    canViewUsers,
  } = useAccessControl()

  if (to.meta.public) {
    return isAuthenticated.value ? defaultAuthenticatedRoute.value : true
  }

  if (!isAuthenticated.value) {
    return {
      name: "Login",
      query: {
        redirect: to.fullPath,
      },
    }
  }
})
```

Explicacion:

- `to` es la ruta destino.
- Si la ruta es publica, no exige sesion.
- Si la ruta es publica y el usuario ya esta autenticado, lo manda a la ruta principal.
- Si la ruta no es publica y no hay sesion, lo manda a login.
- Luego revisa permisos por plataforma, empresa, modulo y funcion.

Riesgo:

- Si se modifica mal, el usuario puede quedar atrapado en redirecciones.
- Tambien puede ver modulos que no deberia o perder acceso a modulos validos.

Backend:

- La validacion de permisos debe repetirse en backend.
- El frontend solo debe decidir experiencia visual y navegacion.

## 2. `login`

Archivo:

- `frontend/src/composables/auth/useAuthSession.js`

Responsabilidad:

- Validar credenciales.
- Guardar sesion.
- Limpiar suplantacion anterior.
- Registrar auditoria.

Codigo clave:

```js
const login = ({ identifier, password }) => {
  const normalizedIdentifier = String(identifier || "")
    .trim()
    .toLowerCase()
  const normalizedPassword = String(password || "")

  const user = users.value.find((item) => {
    return [item.username, item.email].some((value) => {
      return (
        String(value || "")
          .trim()
          .toLowerCase() === normalizedIdentifier
      )
    })
  })
}
```

Explicacion:

- `identifier` puede ser usuario o correo.
- Normaliza a minusculas.
- Busca coincidencia contra `users`.
- Despues compara password y estado del usuario.
- Si falla, audita intento fallido.
- Si funciona, guarda `SESSION_KEY` en sessionStorage.

Riesgo:

- Actualmente el password se valida en frontend porque es mock.
- En produccion esto es inseguro.

Backend:

- Debe pasar a `/auth/login`.
- El backend debe devolver token, usuario y permisos.
- La auditoria de login deberia generarse server-side.

## 3. `logout`

Archivo:

- `frontend/src/composables/auth/useAuthSession.js`

Responsabilidad:

- Cerrar sesion.
- Auditar salida.
- Limpiar usuario autenticado, suplantacion y retorno.

Codigo clave:

```js
const logout = () => {
  const user = currentUser.value

  if (user) {
    recordAuthAudit({
      actorId: user.id,
      actorName: getUserAuditName(user),
      action: "auth:logout",
      entityName: getUserAuditName(user),
      status: "success",
      severity: "info",
      description: "Sesion cerrada correctamente.",
    })
  }

  clearSession()
}
```

Explicacion:

- Toma el usuario efectivo actual.
- Registra evento de cierre.
- Llama `clearSession`.

Riesgo:

- Si no limpia bien la suplantacion, puede quedar estado cruzado.

Backend:

- En backend real deberia invalidar refresh/session token.

## 4. `startImpersonation` y `stopImpersonation`

Archivo:

- `frontend/src/composables/auth/useAuthSession.js`

Responsabilidad:

- Permitir que un administrador vea la plataforma como otro usuario.
- Guardar usuario suplantado.
- Registrar auditoria.

Codigo clave:

```js
const startImpersonation = (userId, returnPath = "/usuarios") => {
  const target = users.value.find((user) => String(user.id) === String(userId))

  if (!canImpersonateUser(userId)) {
    return {
      ok: false,
      message: "No es posible abrir la vista de este usuario.",
    }
  }

  impersonatedUserId.value = String(userId)
  persistSessionValue(IMPERSONATED_USER_KEY, userId)
  persistSessionValue(IMPERSONATION_RETURN_KEY, returnPath)
}
```

Explicacion:

- Primero valida que se pueda suplantar.
- Guarda el usuario destino.
- Guarda ruta de retorno.
- `currentUser` empieza a devolver el usuario suplantado.

Riesgo:

- Es una funcion sensible: permite cambiar permisos efectivos.
- Siempre debe auditar inicio y fin.

Backend:

- Debe exigir rol admin.
- Debe crear evento de auditoria obligatorio.

## 5. `canAccessFunction`

Archivo:

- `frontend/src/composables/auth/useAccessControl.js`

Responsabilidad:

- Determinar si un usuario puede usar una funcion especifica.

Codigo clave:

```js
const canAccessFunction = (functionId, companyId = null, permission = "view") => {
  if (isPlatformAdmin.value) return true

  return getAccessesForCompany(companyId).some((access) => {
    return accessHasFunction(access, functionId, permission)
  })
}
```

Explicacion:

- Admin plataforma tiene acceso completo.
- Usuario normal depende de sus accesos en la empresa.
- Usa `accessHasFunction` para validar funcion + permiso.

Riesgo:

- Si se usa mal `companyId`, puede dar permiso global donde deberia ser por empresa.

Backend:

- Debe existir igual en backend como middleware/policy.

## 6. `canAccessModule`

Archivo:

- `frontend/src/composables/auth/useAccessControl.js`

Responsabilidad:

- Saber si un modulo completo esta habilitado para el usuario.

Explicacion:

- Busca accesos activos de la empresa.
- Revisa si el modulo esta habilitado explicitamente.
- Si no, revisa si alguna funcion activa pertenece a ese modulo.

Riesgo:

- Si se activa un modulo por error, aparecen pantallas completas.

Backend:

- Debe validar endpoints por modulo.

## 7. `visibleAssets`

Archivo:

- `frontend/src/composables/auth/useAccessControl.js`

Responsabilidad:

- Entregar solo los activos que el usuario puede ver.

Codigo conceptual:

```js
const visibleAssets = computed(() => {
  if (isPlatformAdmin.value) return assets.value

  return assets.value.filter((asset) => {
    return getAccessesForCompany(asset.companyId).some((access) => {
      return accessHasModule(access, "assets") && accessAllowsAsset(access, asset)
    })
  })
})
```

Explicacion:

- Admin ve todos.
- Usuario normal ve activos por alcance:
  - todos los activos
  - activos por sucursal
  - activos seleccionados

Riesgo:

- Si falla, se filtra informacion de otras empresas o sucursales.

Backend:

- Critico moverlo a backend.
- La API debe devolver solo activos autorizados.

## 8. `useMockDatabase`

Archivo:

- `frontend/src/composables/mock/useMockDatabase.js`

Responsabilidad:

- Simular backend.
- Guardar datos en memoria/localStorage.
- Exponer CRUD de empresas, usuarios, accesos, activos y sucursales.

Funcion representativa:

```js
const updateAsset = (assetId, changes) => {
  const normalizedAssetId = normalizeKey(assetId)

  assets.value = assets.value.map((asset) => {
    return normalizeKey(asset.id) === normalizedAssetId
      ? normalizeAsset({
          ...asset,
          ...changes,
        })
      : asset
  })

  schedulePersistDatabase()
}
```

Explicacion:

- Busca por ID normalizado.
- Reemplaza solo el activo modificado.
- Normaliza el resultado.
- Agenda persistencia.

Razonamiento:

- Reemplazar el arreglo completo hace que Vue detecte el cambio.
- El debounce evita escribir localStorage demasiadas veces.

Riesgo:

- Esta funcion afecta toda la app porque los services usan este mock.

Backend:

- En produccion se reemplaza por llamadas API.

## 9. `useActivosTelemetrySync`

Archivo:

- `frontend/src/composables/activos/view/useActivosTelemetrySync.js`

Responsabilidad:

- Separar telemetria viva del mapa y snapshot amortiguado de tabla.

Codigo clave:

```js
const mapActivos = computed(() => {
  return filterActivosByCurrentState(normalizedActivos.value)
})

const filteredActivos = computed(() => {
  return filterActivosByCurrentState(tableActivos.value)
})
```

Explicacion:

- El mapa usa `normalizedActivos`: datos actualizados al momento.
- La tabla usa `tableActivos`: copia sincronizada cada cierto tiempo.
- Esto reduce renders de tabla.

Funcion critica:

```js
const scheduleTableActivosSync = ({
  immediate = false,
  full = false,
  updates = [],
  changedIds = [],
} = {}) => {
  if (isDisposed) return

  if (full) {
    pendingFullTableSync = true
  }

  queueTableUpdates(updates)
  queueTableChangedIds(changedIds)

  if (immediate) {
    clearTableSyncTimer()
    pendingFullTableSync = true
    flushTableActivosSync()
    return
  }
}
```

Explicacion:

- Recibe IDs o updates pendientes.
- Si es `full`, fuerza sincronizacion completa.
- Si es `immediate`, ejecuta ahora.
- Si no, agenda por timer.

Riesgo:

- Si se elimina la amortiguacion, la tabla puede laggear.
- Si se sincroniza demasiado tarde, la tabla se ve atrasada.

Backend:

- Debe quedarse en frontend porque es optimizacion visual.

## 10. `useFleetTelemetry`

Archivo:

- `frontend/src/composables/activos/fleet/useFleetTelemetry.js`

Responsabilidad:

- Mantener snapshot vivo de activos con telemetria.
- Aplicar lotes de actualizacion.
- Mantener indices por ID.
- Alimentar historial de reportes.

Funcion critica:

```js
const applyTelemetryBatch = (batch = []) => {
  const measure = startDevMeasure(APPLY_TELEMETRY_BATCH_MEASURE)

  try {
    if (!Array.isArray(batch) || !batch.length) return []

    const updatesById = new Map()

    batch.forEach((rawUpdate) => {
      const resolvedIndex = getActivoIdentityValues(rawUpdate)
        .map((identity) => indexById.get(identity))
        .find((index) => index !== undefined)
      const resolvedId =
        resolvedIndex === undefined ? "" : normalizeId(activos.value[resolvedIndex]?.id)
      const update = normalizeTelemetryUpdate(rawUpdate, resolvedId)

      if (!update) return

      updatesById.set(update.id, update)
    })
  } finally {
    endDevMeasure(measure)
  }
}
```

Explicacion:

- Recibe un lote de telemetria.
- Resuelve a que activo corresponde cada update.
- Normaliza el update.
- Evita duplicados usando `Map`.
- Fusiona datos con el activo actual.
- Dispara `triggerRef` porque usa `shallowRef`.

Razonamiento:

- `shallowRef` evita observacion profunda de todos los activos.
- Los indices evitan buscar linealmente cada activo en cada update.

Riesgo:

- Si la normalizacion de IDs falla, el activo no recibe telemetria.
- Si se muta sin `triggerRef`, Vue puede no renderizar.

Backend:

- La aplicacion visual queda en frontend.
- El stream real y persistencia historica deben venir de backend/websocket.

## 11. `appendTelemetryReports`

Archivo:

- `frontend/src/composables/activos/fleet/useTelemetryHistory.js`

Responsabilidad:

- Guardar historial de telemetria por activo para reportes.

Codigo clave:

```js
export const appendTelemetryReports = (batch = []) => {
  if (!Array.isArray(batch) || !batch.length) return []

  const appendedReports = []

  batch.forEach((rawUpdate) => {
    const activo = rawUpdate?.activo || {}
    const identityValues = getTelemetryIdentityValues({
      activo,
      update: rawUpdate,
    })

    if (!identityValues.length) return
  })

  appendReportEventsFromTelemetryReports(appendedReports)

  return appendedReports
}
```

Explicacion:

- Recibe lote de telemetria.
- Resuelve identidades posibles del activo.
- Encuentra ID canonico.
- Construye punto historico.
- Lo guarda ordenado por timestamp.
- Genera eventos derivados para reportes.

Riesgo:

- Si los alias de activo fallan, se separa historial de un mismo vehiculo en varios IDs.

Backend:

- El historial real debe estar en backend.

## 12. `getReportsForAsset`

Archivo:

- `frontend/src/composables/activos/fleet/useTelemetryHistory.js`

Responsabilidad:

- Entregar reportes historicos de un activo.

Codigo clave:

```js
export const getReportsForAsset = (asset) => {
  const identityValues = getAssetIdentityValues(asset)

  if (!identityValues.length) return []

  const canonicalAssetIds = Array.from(
    new Set(
      identityValues.map((identity) => {
        return telemetryCanonicalAssetIdByAlias.get(identity) || identity
      }),
    ),
  )
}
```

Explicacion:

- Saca todos los IDs posibles del activo.
- Los transforma al ID canonico.
- Junta reportes de esos IDs.
- Fusiona duplicados y ordena.

Riesgo:

- Si los reportes no estan ordenados, los viajes se cortan mal.

Backend:

- Deberia ser endpoint de historial por activo/rango.

## 13. `buildActivosWorkspaceSettings`

Archivo:

- `frontend/src/views/ActivosView.vue`

Responsabilidad:

- Capturar la configuracion visual actual del modulo activos.

Codigo clave:

```js
const buildActivosWorkspaceSettings = () => {
  return {
    module: ACTIVOS_WORKSPACE_MODULE,
    statusFilter: statusFilter.value,
    activeSidebarSection: activeSidebarSection.value,
    sectionSearch: {
      ...sectionSearch.value,
    },
    selectedActivoId: normalizeId(selectedId.value),
    selectedGeofenceId: normalizeId(selectedGeofenceId.value),
    selectedPersonalAssetGroupId: normalizeId(selectedPersonalAssetGroupId.value),
    leftPanelWidth: leftPanelWidth.value,
    fleetLayout: {
      leftPanelWidth: leftPanelWidth.value,
    },
    fleetTableColumns: normalizeFleetTableColumnPreferences(fleetTableColumnPreferences.value),
    useGeofenceLocationAddress: Boolean(useGeofenceLocationAddress.value),
  }
}
```

Explicacion:

- Guarda filtro de estado.
- Guarda seccion activa.
- Guarda busquedas.
- Guarda activo/geocerca/grupo seleccionado.
- Guarda ancho de panel.
- Guarda columnas visibles/orden/ancho.
- Guarda preferencia de direcciones.

Riesgo:

- Si una preferencia no se agrega aqui, nunca se guardara.

Backend:

- La captura es frontend.
- La persistencia deberia ser backend.

## 14. `applyActivosWorkspaceSettings`

Archivo:

- `frontend/src/views/ActivosView.vue`

Responsabilidad:

- Restaurar una configuracion visual guardada.

Codigo clave:

```js
const applyActivosWorkspaceSettings = async (settings = {}) => {
  if (!settings || (settings.module && settings.module !== ACTIVOS_WORKSPACE_MODULE)) return

  if (settings.sectionSearch && typeof settings.sectionSearch === "object") {
    sectionSearch.value = {
      ...sectionSearch.value,
      ...settings.sectionSearch,
    }
  }

  activeSidebarSection.value = normalizeWorkspaceSidebarSection(settings.activeSidebarSection)
  statusFilter.value = normalizeWorkspaceStatusFilter(settings.statusFilter)
}
```

Explicacion:

- Valida que la configuracion sea del modulo activos.
- Restaura busquedas.
- Restaura seccion activa.
- Restaura filtros.
- Restaura ancho y columnas mas abajo.

Riesgo:

- Si no valida valores, una vista vieja puede romper la pantalla.

Backend:

- La restauracion visual queda en frontend.

## 15. `createWorkspace`

Archivo:

- `frontend/src/composables/workspaces/useWorkspaces.js`

Responsabilidad:

- Crear un espacio de trabajo nuevo para el usuario.

Codigo clave:

```js
const createWorkspace = ({ name, sharedWithUserIds = [], ...snapshotOverrides } = {}) => {
  const user = resolvedUserId.value
  const workspaceName = normalizeName(name)

  if (!user || !workspaceName) return null

  const now = new Date().toISOString()
  const workspace = {
    id: buildWorkspaceId(user),
    userId: user,
    name: workspaceName,
    sharedWithUserIds: normalizeUserIds(sharedWithUserIds).filter((sharedUserId) => {
      return sharedUserId !== user
    }),
    ...buildCurrentViewSnapshot(snapshotOverrides),
    createdAt: now,
    updatedAt: now,
  }
}
```

Explicacion:

- Exige usuario y nombre.
- Genera ID unico.
- Guarda usuarios compartidos.
- Captura estado visual actual.
- Lo marca como activo.

Riesgo:

- Si el snapshot esta incompleto, el workspace existe pero no restaura bien.

Backend:

- Debe persistirse por usuario en backend.

## 16. `saveCurrentWorkspaceView`

Archivo:

- `frontend/src/composables/workspaces/useWorkspaces.js`

Responsabilidad:

- Sobrescribir un workspace propio con la vista actual.

Codigo clave:

```js
const saveCurrentWorkspaceView = (workspaceId = activeWorkspaceId.value) => {
  const workspace = resolveOwnedWorkspace(workspaceId)

  if (!workspace) return null

  const updatedWorkspace = toPersistedWorkspace({
    ...workspace,
    ...buildCurrentViewSnapshot(),
    updatedAt: new Date().toISOString(),
  })
}
```

Explicacion:

- Solo guarda si el workspace pertenece al usuario.
- Mezcla snapshot actual.
- Actualiza fecha.
- Audita cambio.

Riesgo:

- Si se permite guardar workspaces compartidos ajenos, se pisan vistas de otros usuarios.

Backend:

- Debe validar propietario/permisos.

## 17. `shareWorkspace`

Archivo:

- `frontend/src/composables/workspaces/useWorkspaces.js`

Responsabilidad:

- Compartir un workspace con otros usuarios.

Explicacion:

- Valida que el workspace sea propio.
- Normaliza IDs de usuarios.
- Excluye al propio usuario.
- Guarda lista de compartidos.
- Audita accion.

Riesgo:

- En localStorage no es compartido real entre navegadores.

Backend:

- Debe ser relacion en BD: workspace_id, owner_id, shared_user_id, permisos.

## 18. `recordAudit`

Archivo:

- `frontend/src/composables/audit/useAuditTrail.js`

Responsabilidad:

- Registrar auditoria sin repetir actor/empresa en cada vista.

Codigo clave:

```js
const recordAudit = (entry = {}) => {
  const explicitCompanyId = entry.companyId === undefined ? null : normalizeId(entry.companyId)
  const auditCompanyId = explicitCompanyId ?? resolvedCompanyId.value
  const company = auditCompanyId ? companiesById.value.get(auditCompanyId) : null
  const auditCompanyName =
    entry.companyName || company?.name || (auditCompanyId ? "Empresa" : "Plataforma")
  const user = currentUser.value
  const { companyId: _companyId, companyName: _companyName, ...auditEntry } = entry

  return appendAuditLog({
    actorId: user?.id || "system",
    actorName: getUserAuditName(user),
    companyId: auditCompanyId,
    companyName: auditCompanyName,
    status: "success",
    severity: "info",
    ...auditEntry,
  })
}
```

Explicacion:

- Resuelve empresa por parametro o ruta.
- Resuelve nombre de empresa.
- Resuelve usuario actual.
- Permite que la accion sobreescriba `status` o `severity`.
- Llama al servicio de auditoria.

Riesgo:

- Si se usa `appendAuditLog` directo en todas partes, se duplican criterios.

Backend:

- Esta funcion puede quedar como wrapper, pero deberia llamar API.

## 19. `appendAuditLog`

Archivo:

- `frontend/src/services/audit/useAuditService.js`

Responsabilidad:

- Insertar evento en historial local de auditoria.

Codigo clave:

```js
export const appendAuditLog = (entry = {}) => {
  const record = normalizeAuditRecord(entry)

  auditRecords.value = [record, ...auditRecords.value].slice(0, MAX_AUDIT_RECORDS)
  persistAuditRecords()

  return record
}
```

Explicacion:

- Normaliza campos.
- Lo pone arriba.
- Limita a 700 registros.
- Guarda localStorage.

Riesgo:

- Auditoria local no es confiable.

Backend:

- Debe pasar a append-only server-side.

## 20. `useReportTemplates`

Archivo:

- `frontend/src/composables/reports/useReportTemplates.js`

Responsabilidad:

- Manejar plantillas base, personalizadas, actualizadas y eliminadas.

Funciones internas importantes:

- `createReportTemplate`
- `updateReportTemplate`
- `deleteReportTemplate`
- `syncReportTemplatesWithSeed`
- `mergeStoredDefaultTemplate`

Codigo clave:

```js
const deleteReportTemplate = (templateId) => {
  const targetTemplate = reportTemplates.value.find((template) => {
    return String(template.id) === String(templateId)
  })

  if (!canDeleteReportTemplate(targetTemplate)) return false

  if (targetTemplate.isDefault || targetTemplate.type === REPORT_TEMPLATE_TYPES.DEFAULT) {
    const deletedTemplateIds = readDeletedReportTemplateIds()

    deletedTemplateIds.add(String(targetTemplate.id))
    persistDeletedReportTemplateIds(deletedTemplateIds)
  }
}
```

Explicacion:

- Busca plantilla.
- Valida si se puede eliminar.
- Si es base/default, no solo la borra del arreglo: guarda su ID como eliminada.
- Asi no vuelve a aparecer al mezclar con seeds.

Riesgo:

- Si no se guarda `deletedTemplateIds`, las plantillas base eliminadas vuelven.

Backend:

- Debe ser modelo con version, propietario, empresa y estado.

## 21. `useReportEventRules`

Archivo:

- `frontend/src/composables/reports/useReportEventRules.js`

Responsabilidad:

- Crear, editar, eliminar y listar reglas de evento.

Codigo clave:

```js
const createEventRule = (payload = {}) => {
  const nextRule = normalizeEventRule({
    id: createRuleId(payload.label || "regla"),
    label: payload.label || "Nueva regla",
    description: payload.description || "",
    source: "custom",
    active: payload.active !== false,
    alertType: payload.alertType,
    schedule: payload.schedule,
    activation: payload.activation,
    groupIds: payload.groupIds,
    notifications: payload.notifications,
    conditions: payload.conditions?.length
      ? payload.conditions
      : [
          {
            field: "event",
            operator: "exists",
            value: "",
          },
        ],
  })
}
```

Explicacion:

- Crea regla custom.
- Normaliza configuracion completa.
- Si no trae condiciones, crea una condicion minima.
- Persiste reglas.

Riesgo:

- Si una regla queda sin condiciones ni defaults claros, puede matchear demasiado.

Backend:

- Debe persistirse y ejecutarse en backend.

## 22. `doesReportMatchEventRule`

Archivo:

- `frontend/src/utils/reports/event-rules/reportEventRuleEngine.js`

Responsabilidad:

- Evaluar si un reporte/evento cumple una regla.

Codigo clave:

```js
export const doesReportMatchEventRule = ({ report, asset, rule }) => {
  if (!rule || rule.id === "all") return false
  if (rule.active === false) return false
  if (!doesRuleApplyToGroup({ report, asset, rule })) return false
  if (!doesRuleApplyToSchedule({ report, asset, rule })) return false
  if (isSpeedingEventRule(rule) && !hasSpeedingSignal({ report, asset, rule })) return false
  if (!doesReportHaveDefaultRuleSignal({ report, asset, rule })) return false
  if (hasDefaultRuleConditions(rule)) return true
  if (!Array.isArray(rule.conditions) || !rule.conditions.length) return true

  return rule.conditions.every((condition) => {
    const value = getEventFieldValue({
      field: condition.field,
      report,
      asset,
      rule,
    })

    return compareCondition({
      value,
      operator: condition.operator || "exists",
      expectedValue: condition.value,
    })
  })
}
```

Explicacion:

- Descarta reglas vacias/inactivas.
- Valida grupo.
- Valida horario/calendario.
- Valida senales especiales como exceso de velocidad.
- Valida condiciones configuradas.
- Usa `every`: todas las condiciones deben cumplirse.

Riesgo:

- Es una funcion core. Si cambia, cambian todos los reportes.

Backend:

- Debe compartirse o replicarse exactamente en backend.

## 23. `doesReportMatchEventRules`

Archivo:

- `frontend/src/utils/reports/event-rules/reportEventRuleEngine.js`

Responsabilidad:

- Evaluar un reporte contra todas las reglas de una plantilla.

Codigo clave:

```js
export const doesReportMatchEventRules = ({ report, asset, template, eventRulesById }) => {
  const eventRuleIds = normalizeEventRuleIds(template)

  if (!eventRuleIds.length) return false

  return eventRuleIds.some((eventRuleId) => {
    const rule = eventRulesById?.get?.(eventRuleId)

    return doesReportMatchEventRule({
      report,
      asset,
      rule,
    })
  })
}
```

Explicacion:

- Obtiene reglas asociadas a la plantilla.
- Si alguna regla cumple, el reporte entra.
- Usa `some`, por lo tanto es logica OR entre reglas.

Riesgo:

- Cambiar `some` por `every` modificaria completamente el comportamiento.

Backend:

- Debe ser parte del motor oficial de reportes.

## 24. `executeReport`

Archivo:

- `frontend/src/composables/reports/useAssetReportExecution.js`

Responsabilidad:

- Generar filas de reporte para activos seleccionados.

Codigo clave:

```js
const executeReport = async () => {
  if (!canExecuteReport.value) {
    clearReportPreview()
    return []
  }

  const selectedAssetsSnapshot = [...selectedAssets.value]
  const reportColumnsSnapshot = [...reportColumns.value]
  const companyNameByIdSnapshot = new Map(companyNameById.value)
  const eventRulesByIdSnapshot = new Map(eventRulesById.value)
  const geofencesSnapshot = [...(geofences?.value || [])]
}
```

Explicacion:

- Primero valida si se puede ejecutar.
- Captura snapshots de todo lo reactivo.
- Esto evita que cambios de UI durante la ejecucion cambien el resultado a medio camino.
- Procesa activos por lotes.
- Guarda filas en `reportRows`.
- Marca `executedAt`.

Riesgo:

- Si no captura snapshots, el resultado puede quedar inconsistente.
- Si no procesa por lotes, puede congelar la UI.

Backend:

- Para produccion deberia convertirse en job backend.

## 25. `exportExcel` y `exportPdf`

Archivo:

- `frontend/src/composables/reports/useAssetReportExecution.js`

Responsabilidad:

- Exportar el reporte ya generado.

Codigo clave:

```js
const { exportAssetReportExcel } = await import("../utils/reports/export/assetReportExportUtils.js")
```

Explicacion:

- Carga la dependencia solo al exportar.
- Usa filas actuales o filas override.
- Usa columnas y fechas snapshot.

Razonamiento:

- Lazy import reduce peso inicial.
- Evita cargar Excel/PDF en usuarios que solo entran a mirar.

Riesgo:

- Si `reportRows` no corresponde a la previsualizacion, PDF/Excel salen distintos.

Backend:

- Exportaciones programadas o masivas deben pasar a backend.

## 26. `buildAssetReportRows`

Archivo:

- `frontend/src/utils/reports/execution/assetReportExecutionUtils.js`

Responsabilidad:

- Construir las filas finales del reporte.

Codigo clave:

```js
export const buildAssetReportRows = ({
  selectedAssets,
  reportColumns,
  companyNameById,
  dateFrom,
  dateTo,
  getReportsForAsset,
  getReportEventsForAsset,
  template,
  eventRulesById,
  geofences = [],
}) => {
  const historyRows =
    buildAssetReportRowsFromHistory({
      selectedAssets,
      reportColumns,
      companyNameById,
      dateFrom,
      dateTo,
      getReportsForAsset,
      template,
      eventRulesById,
      geofences,
    }) || []
}
```

Explicacion:

- Recibe activos, columnas, fechas, plantilla, reglas y geocercas.
- Primero intenta generar filas desde historial.
- Si el reporte es de viajes, delega a `buildRouteHistoryTripRows`.
- Si no, aplica reglas sobre timeline y eventos.

Riesgo:

- Es punto central de consistencia entre vista previa, PDF y Excel.

Backend:

- Debe ser motor backend para reportes oficiales.

## 27. `buildRouteHistoryTripRows`

Archivo:

- `frontend/src/utils/reports/execution/assetReportTripUtils.js`

Responsabilidad:

- Convertir historial de un activo en filas de viajes.

Codigo clave:

```js
export const buildRouteHistoryTripRows = ({
  asset,
  reportTimeline,
  dateFrom,
  dateTo,
  reportColumns,
  companyNameById,
  eventRulesById,
  template,
}) => {
  const movementRule = eventRulesById?.get?.("movement") || null
  const stopsRule = eventRulesById?.get?.("stops") || null
  const idleRule = eventRulesById?.get?.("idle") || null
  const tripEndRule = eventRulesById?.get?.("tripEnd") || null
  const trips = buildRouteHistoryTrips({
    reportTimeline,
    asset,
    dateFrom,
    dateTo,
    movementRule,
    tripEndRule,
    template,
  })
}
```

Explicacion:

- Toma reglas relevantes:
  - movimiento
  - paradas
  - ralenti
  - fin de viaje
- Separa la linea temporal en viajes.
- Luego arma una fila por viaje.

Funcion interna importante:

```js
const buildRouteHistoryTrips = ({
  reportTimeline,
  asset,
  dateFrom,
  dateTo,
  movementRule,
  tripEndRule,
}) => {
  const trips = []
  let activeTrip = null
}
```

Explicacion:

- Recorre los puntos en orden.
- Si detecta fin de viaje, cierra el viaje activo.
- Si detecta movimiento, abre o continua viaje.
- Si esta detenido pero hay viaje activo, agrega el punto como parte del contexto.

Riesgo:

- Esta funcion define que es un viaje.
- Si cambia mal, los reportes de viaje pierden confianza.

Backend:

- Debe pasar a backend para viajes oficiales.

## 28. `buildRouteTripMapImageDataUrl`

Archivo:

- `frontend/src/utils/reports/route-map/routeTripMapImageUtils.js`

Responsabilidad:

- Generar imagen de mapa para reporte de viajes.

Explicacion:

- Lee filas de reporte.
- Extrae rutas/puntos.
- Calcula bounds.
- Dibuja mapa, lineas, puntos y leyenda.
- Devuelve una imagen en data URL para PDF/Excel.

Riesgo:

- Si el aspect ratio o bounds se calculan mal, la imagen sale achatada o cortada.
- Si usa datos distintos a la tabla, PDF/Excel no coinciden.

Backend:

- Puede quedar en frontend para exportacion manual.
- Para reportes programados conviene backend.

## 29. `useActivosMap`

Archivo:

- `frontend/src/composables/activos/map/useActivosMap.js`

Responsabilidad:

- Controlar Leaflet y coordinar capas del mapa.

Explicacion:

- Crea mapa.
- Define tile layers.
- Ajusta vista.
- Conecta marcadores, geocercas, itinerarios y trazas.
- Expone funciones para que el componente pueda enfocar o actualizar.

Riesgo:

- Si se rompe el ciclo de montaje/desmontaje, quedan capas o listeners vivos.

Backend:

- El render queda frontend.
- Calculos masivos de rutas/historial pueden ir backend.

## 30. `createAssetMarkerController`

Archivo:

- `frontend/src/composables/activos/map/useMapAssetMarkers.js`

Responsabilidad:

- Crear, actualizar y eliminar marcadores de activos.

Explicacion:

- Recibe activos visibles.
- Crea markers Leaflet.
- Actualiza posicion/icono/tooltips.
- Coordina clustering y cache.
- Aplica telemetria incremental cuando llega lote.

Riesgo:

- Es una zona sensible para performance.
- Crear todos los markers de nuevo en cada pulso causa lag.

Backend:

- Debe quedarse frontend.

## 31. `createAssetMarkerClusterController`

Archivo:

- `frontend/src/composables/activos/map/assetMarkers/assetMarkerClusters.js`

Responsabilidad:

- Agrupar activos cercanos para reducir carga visual.

Explicacion:

- Calcula clusters segun zoom/viewport.
- Crea icono de cluster.
- En click enfoca o acerca.
- Evita dibujar cientos de markers cuando no aporta detalle.

Riesgo:

- Si clusteriza demasiado, el usuario no ve activos individuales.
- Si clusteriza poco, el mapa se pone pesado.

Backend:

- Queda frontend porque depende del viewport.

## 32. `useGeofences`

Archivo:

- `frontend/src/composables/activos/geocercas/useGeofences.js`

Responsabilidad:

- Manejar geocercas locales por empresa.

Explicacion:

- Lee geocercas guardadas.
- Normaliza ID, tipo, coordenadas, radio, color y empresa.
- Evita duplicados.
- Expone crear, actualizar y eliminar.

Funcion conceptual:

```js
export function useGeofences({ companyId = "general" } = {}) {
  // expone geofences filtradas y acciones CRUD
}
```

Riesgo:

- Si la normalizacion falla, el mapa puede no dibujar o guardar geocercas invalidas.

Backend:

- Las geocercas reales deben vivir en backend.

## 33. `reverseGeocodeCoordinates`

Archivo:

- `frontend/src/services/location/reverseGeocodingService.js`

Responsabilidad:

- Convertir coordenadas en direccion.

Explicacion:

- Valida coordenadas.
- Crea llave de cache.
- Revisa si ya existe direccion.
- Consulta servicio externo si esta habilitado.
- Usa fallback con coordenadas cuando no puede resolver.

Riesgo:

- Muchas consultas simultaneas pueden hacer lenta la UI o bloquear por limite de proveedor.

Backend:

- Conviene backend con cache central.

## 34. `withResolvedRouteTripEndpointAddresses`

Archivo:

- `frontend/src/services/location/reverseGeocodingService.js`

Responsabilidad:

- Resolver origen y destino de viajes.

Explicacion:

- Revisa si el viaje ya trae direccion util.
- Si no trae, intenta resolver desde coordenadas.
- Devuelve el viaje enriquecido sin romper estructura original.

Riesgo:

- Si se usa en masa sin cache, puede generar demasiadas llamadas.

Backend:

- Debe pasar a backend para reportes oficiales.

## Resumen de prioridad tecnica

Prioridad 1:

- `router.beforeEach`
- `login`
- `canAccessFunction`
- `visibleAssets`
- `useMockDatabase`

Prioridad 2:

- `useFleetTelemetry`
- `useActivosTelemetrySync`
- `appendTelemetryReports`
- `getReportsForAsset`
- `useActivosMap`

Prioridad 3:

- `useReportTemplates`
- `useReportEventRules`
- `doesReportMatchEventRule`
- `executeReport`
- `buildAssetReportRows`
- `buildRouteHistoryTripRows`

Prioridad 4:

- `recordAudit`
- `appendAuditLog`
- `createWorkspace`
- `saveCurrentWorkspaceView`
- `shareWorkspace`

Lectura recomendada si vas a modificar:

1. Permisos/auth primero.
2. Mock database/services despues.
3. Activos y telemetria.
4. Reportes y reglas.
5. Workspaces/auditoria.
6. Mapa/geocercas/exportaciones.
