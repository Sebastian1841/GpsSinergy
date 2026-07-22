# Auth Components

Componentes relacionados con sesion y autenticacion.

## Archivos

- `ImpersonationBanner.vue`: banner visible cuando un usuario esta suplantando a otro.

## Regla de mantenimiento

La UI no debe validar permisos por si sola. Debe consumir `useAuthSession` y `useAccessControl`.
