# Auth Composables

Estado de autenticacion y permisos.

## Archivos

- `useAccessControl.js`: evalua permisos de acceso a funciones, empresas y activos. La UI actual administra alcance por toda la flota, activos especificos y etiquetas de acceso. No aplica sucursales como permiso directo; los alcances legacy por sucursal deben llegar migrados a activos especificos. Tampoco lee `scope.tagIds` en permisos activos; cualquier dato legacy debe migrarse antes a `scope.assetTagIds`.
- `useAuthSession.js`: administra sesion actual, login, logout e impersonacion.

## Regla de mantenimiento

El alcance por etiquetas reutiliza un Set normalizado al evaluar la lista de
activos mediante `assetMatchesNormalizedTagIds`; evita normalizacion repetida por
fila sin cambiar los permisos. Los filtros de pantalla nunca amplian ese alcance.

La UI debe consultar permisos a traves de estos composables. La fuente de datos real debe provenir de `services/auth` y `services/access`.
