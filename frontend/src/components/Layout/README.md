# Layout Components

Componentes estructurales de la aplicacion.

## Archivos

- `AppHeader.vue`: header principal con contexto de empresa, usuario y controles
  de vista. Compone el alcance autorizado con `useAppHeaderAccessScope` y pasa
  datos ya filtrados a los controles hijos.
- `HeaderGlobalSearch.vue`: buscador global visible para usuarios autenticados.
  Maneja el estado visual del buscador con `useAppHeaderGlobalSearchState` y
  consulta `useGlobalSearch.js` con empresas, activos, usuarios y espacios ya
  acotados por permisos. Permite filtrar por tipo de resultado (`Todo`,
  `Empresas`, `Activos`, `Reportes`, `Usuarios`, `Espacios`, `Auditoria`) y
  navega al resultado seleccionado.
- `AppSidebar.vue`: navegacion lateral. Incluye accesos a Activos, Reportes, Auditoria, Mantenciones y modulos administrativos segun permisos. El acceso a Mantenciones conserva la empresa activa cuando la ruta actual tiene `empresaId`, o usa una empresa accesible como respaldo.
- `HeaderFleetAssetFilterMenu.vue`: selector unico del header para la vista
  Activos. Contiene dos conceptos visuales: ciudades calculadas por GPS y
  grupos de vehiculos. Desde la pestana de grupos se pueden crear, eliminar y
  asignar vehiculos a grupos, siempre usando solamente activos ya autorizados.
  No administra etiquetas de acceso ni grupos de geocercas.
- `WorkspaceSelector.vue`: selector de espacios de trabajo.

## Regla de mantenimiento

Layout puede coordinar navegacion y controles globales, pero no debe contener reglas internas de flota, reportes o usuarios. Si un control necesita cruzar dominios, mover la composicion de datos a `composables`.

`App.vue` monta este layout para rutas privadas y dispara `preloadPrivateRouteViews()` cuando hay sesion autenticada. Ese precalentamiento evita que el primer cambio hacia Reportes, Auditoria, Usuarios o Empresas tenga que descargar el modulo completo justo al hacer click.

`AppHeader.vue` debe reconocer el contexto textual de cada vista nueva. Mantenciones usa la etiqueta `Mantenciones` cuando no hay empresa activa; si la ruta incluye `empresaId`, el header muestra `Empresa actual` y resuelve el nombre desde `companyRecords` con fallback a `accessibleCompanies`, evitando que una carga parcial vuelva a `Vista actual`.

El filtro por tipo del buscador global debe pasarse como `typeFilter` a
`useGlobalSearch.js`. No filtrar solo en el template: el composable debe aplicar
el tipo antes del limite global para que una busqueda de empresas no quede
tapada por activos u otros resultados.

La busqueda global debe estar visible para cualquier usuario autenticado, pero
sus resultados deben salir solo del alcance permitido: empresas accesibles,
activos visibles y modulos o funciones autorizadas por `useAccessControl`.
Los usuarios buscables y compartibles deben llegar ya filtrados desde
`useAppHeaderAccessScope`; no pasar `users` crudo desde servicios al buscador ni
al selector de espacios.

El modo `Todo` mantiene limite de resultados para cuidar el header. Cuando el
usuario selecciona un tipo concreto, por ejemplo `Activos`, el composable debe
devolver todos los resultados de ese tipo disponibles para los permisos actuales.

El header no debe administrar editores secundarios. Si una accion requiere un
modal o flujo de configuracion, mantenerlo dentro del modulo dueno y dejar el
header solo como punto de navegacion o seleccion global.

Los filtros de flota del header deben aplicarse siempre sobre `visibleAssets`.
La cadena esperada es: permisos/etiquetas de acceso -> activos autorizados ->
grupos o ciudades como filtros visuales. Un grupo de vehiculos nunca debe
ampliar el alcance real del usuario, y una etiqueta de acceso nunca debe
tratarse solo como filtro visual.
