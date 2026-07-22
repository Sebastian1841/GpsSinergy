# Auth Composables

Estado de autenticacion y permisos.

## Archivos

- `useAccessControl.js`: evalua permisos de acceso a funciones y empresas.
- `useAuthSession.js`: administra sesion actual, login, logout e impersonacion.

## Regla de mantenimiento

La UI debe consultar permisos a traves de estos composables. La fuente de datos real debe provenir de `services/auth` y `services/access`.
