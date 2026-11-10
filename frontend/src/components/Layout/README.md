# Layout Components

Vistas guardadas (2026-11-05): WorkspaceSelector recibe writeError y espera
confirmacion del header antes de limpiar el formulario de alta/edicion o cerrar
al seleccionar una vista. AppHeader guarda nombre y usuarios compartidos en una
operacion y muestra el error del composable. Un fallo conserva los campos.

La sidebar agrupa Operacion, Configuracion y Administracion en ese orden.
Ambos modos comparten categorias autorizadas; se muestra una categoria a la vez.
Los botones del panel usan aria-expanded y el selector compacto aria-pressed;
cambiar categoria no cambia la ruta. La ruta activa selecciona su categoria.
La barra compacta admite scroll vertical y conserva seleccion naranja.
Configuracion usa el catalogo
configurationNavigation.js: limites, etiquetas y alertas requieren permisos
configuration-limits, configuration-tags y configuration-alerts respectivamente;
variables calculadas y avanzado son exclusivos de plataforma. No se conceden
permisos nuevos de forma automatica. Auditoria mantiene audit-view al cambiar
de categoria. Los accesos Activos por empresa conservan el destino y muestran
el nombre de empresa como contexto.

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
- `AppSidebar.vue`: navegacion lateral. Incluye accesos a Activos, Reportes,
  Alertas, Auditoria, Mantenciones, Sin reportar y modulos administrativos segun permisos.
  Los accesos por empresa conservan la empresa activa cuando la ruta actual
  tiene `empresaId`, o usan una empresa accesible como respaldo. En escritorio
  ofrece una barra compacta de `76px` y un panel expandido de `292px`; ambos
  consumen la misma lista autorizada de modulos. La preferencia de mostrar la
  barra compacta se guarda en `localStorage` bajo `sinergy-sidebar-compact`.
  En pantallas pequenas la barra compacta se oculta y el panel se abre desde el
  boton del header. Cada icono compacto muestra el nombre de su modulo mediante
  tooltip flotante compartido, tambien al enfocar con teclado; se retira al
  navegar, hacer click, desplazar o redimensionar. Los SVG de navegacion
  usan una caja fija de `20x20px` para evitar que trazados sin dimensiones
  propias desborden la barra.
- `HeaderFleetAssetFilterMenu.vue`: selector unico del header para la vista
  Activos. Contiene dos conceptos visuales: ciudades calculadas por GPS y
  grupos de vehiculos. Desde la pestana de grupos se pueden crear, eliminar y
  asignar vehiculos a grupos, siempre usando solamente activos ya autorizados.
  No administra etiquetas de acceso ni grupos de geocercas.
- `WorkspaceSelector.vue`: selector de espacios de trabajo.

## Regla de mantenimiento

El menu de usuario incluye Panel de soporte, que abre /soporte y conserva
la empresa como filtro inicial cuando hay contexto. No se agrega a la sidebar.

Layout puede coordinar navegacion y controles globales, pero no debe contener reglas internas de flota, reportes o usuarios. Si un control necesita cruzar dominios, mover la composicion de datos a `composables`.

`App.vue` monta este layout para rutas privadas y dispara
`preloadPrivateRouteViews()` tras autenticarse. Solo precarga las vistas livianas
permitidas por el router; no afirmar que Usuarios o todos los modulos se precargan.

`AppHeader.vue` identifica el modulo y muestra la empresa como contexto secundario.
Mantenciones conserva el titulo del modulo aun con empresaId; Conductores se
identifica cuando query.tab=drivers. Los nombres de Configuracion vienen de su
catalogo compartido, incluido Ajustes avanzados (sin Avanzado PLAT).

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

Cuando no hay empresa activa, `activeContextName` debe reconocer explicitamente
las rutas generales de cada modulo. `Reports` muestra `Reportes` y no debe caer
en el respaldo `Selecciona una empresa`.

Los filtros de flota del header deben aplicarse siempre sobre `visibleAssets`.
La cadena esperada es: permisos/etiquetas de acceso -> activos autorizados ->
grupos o ciudades como filtros visuales. Un grupo de vehiculos nunca debe
ampliar el alcance real del usuario, y una etiqueta de acceso nunca debe
tratarse solo como filtro visual.
# Contexto De Mantenciones

En Maintenance y AppMaintenance el encabezado muestra Mantenciones como titulo y
la empresa en la etiqueta de contexto, incluso en rutas con empresaId.

# Ubicacion Actual Visible

El nombre de modulo prevalece sobre la empresa en todas las rutas. Texto de 18px,
empresa de 12px y marca naranja; en movil bajo 520px se muestra en fila propia.
El buscador global permanece independiente del titulo del modulo.

# Letras Del Modulo

El encabezado identifica Conductores cuando la ruta de mantenciones usa
query.tab=drivers; las otras pestanas mantienen el titulo Mantenciones.

module-location-title combina relleno blanco con contorno naranja de 0.6px y
paint-order stroke fill, conservando el interior legible en escritorio y movil.

## Iconos De Configuracion

Catalogo actual (2026-11-04), igual en barra y panel:
`configuration-limits` (velocimetro simple), `configuration-tags`,
`configuration-alerts`, `variable-code` y `configuration-sliders`.
No cambiar `maintenance-odometer` para ajustar Limites: son nombres independientes.
Los iconos de Operacion y Administracion no se reemplazaron con este cambio.
Pruebas de categorias, rutas y permisos: `AppSidebar.test.js`.

