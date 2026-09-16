# User Composables

Estado del modulo de usuarios.

## Archivos

- `useUserAccessManagement.js`: orquesta usuarios, empresas, aplicaciones,
  roles, filtros, seleccion, ordenamiento, paginacion, modo visual del listado y
  acciones de estado. Acepta `routeCompanyId` para bloquear el filtro de empresa
  cuando la pantalla se abre desde `/app/:empresaId/usuarios`.
- `useUserAccessDrafts.js`: administra borradores de accesos, modulos, funciones y alcances operativos antes de persistir cambios. Los alcances editables son toda la flota, activos especificos y etiquetas de activos mediante `assetTagIds`; no crea nuevos alcances por sucursal.

## Flujo Actual

`UserManagementView.vue` consume `useUserAccessManagement({ routeCompanyId })`
y entrega estado a componentes presentacionales. El composable mantiene
`selectedCompany`, `selectedStatus`, `selectedRole`, `selectedModule`,
`searchTerm`, `userSortKey`, `userSortDirection`, `currentPage`, `pageSize` y
`userViewMode`.

`userViewMode` controla solo la presentacion del directorio entre `list` y
`cards`. No modifica filtros, permisos, accesos ni la apertura del drawer de
detalle.

El flujo del directorio es:

1. `filteredUsers`: aplica busqueda, empresa, rol, estado y modulo.
2. `sortedUsers`: ordena el resultado filtrado por nombre, rol, empresa,
   accesos o estado.
3. `paginatedUsers`: corta la pagina actual usando `currentPage` y `pageSize`.

Los cambios de filtros u orden reinician `currentPage` a `1` para evitar paginas
vacias despues de acotar resultados.

Los usuarios con `isPlatformAdmin` reciben desde `useMockDatabase.js` accesos `admin` a todas las aplicaciones. Por eso el modulo de usuarios no debe crear accesos manuales por empresa para el administrador principal.

Cuando el usuario seleccionado es `isPlatformAdmin`, `useUserAccessDrafts.js`
bloquea mutaciones sobre accesos, roles, estado de accesos, modulos, funciones,
permisos y alcance operacional. La vista puede mostrar sus accesos para revision,
pero deben quedar en modo lectura porque el administrador global siempre tiene
todo habilitado.

Los KPIs del encabezado cambian `selectedStatus`, por lo que funcionan como filtros rapidos sin duplicar logica en componentes.

`companyFilterLocked` evita que el usuario salga accidentalmente del contexto de la empresa actual cuando la ruta ya define una empresa.

## Regla de mantenimiento

La logica de permisos compleja debe estar en `utils/users`. Los servicios de persistencia deben quedar en `services/users`.

Si se agrega un filtro nuevo, debe vivir primero en `useUserAccessManagement.js`
y luego exponerse al componente visual correspondiente. Tambien debe reiniciar la
paginacion si altera el conjunto visible.

Los nuevos tipos de alcance deben agregarse en `useUserAccessDrafts.js`, propagarse desde `useUserAccessManagement.js` y evaluarse finalmente en `composables/auth/useAccessControl.js`. No reintroducir sucursales como alcance visual de usuarios; para controlar visibilidad por grupo operativo se deben usar etiquetas.
