# Auth Composables

Estado de autenticacion y permisos.

## Archivos

- `useAccessControl.js`: evalua permisos de acceso a funciones, empresas y activos. La UI actual administra alcance por toda la flota, activos especificos y etiquetas de activos. Mantiene lectura legacy de alcances por sucursal para no romper permisos antiguos guardados.
- `useAuthSession.js`: administra sesion actual, login, logout e impersonacion.

## Regla de mantenimiento

La UI debe consultar permisos a traves de estos composables. La fuente de datos real debe provenir de `services/auth` y `services/access`.
