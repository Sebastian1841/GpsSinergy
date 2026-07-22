# User Composables

Estado del modulo de usuarios.

## Archivos

- `useUserAccessDrafts.js`: borradores de permisos y accesos.
- `useUserAccessManagement.js`: administracion de usuarios, empresas y permisos.

## Regla de mantenimiento

La logica de permisos compleja debe estar en `utils/users`. Los servicios de persistencia deben quedar en `services/users`.
