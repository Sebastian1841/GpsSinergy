# User Components

Componentes del modulo de usuarios y permisos.

## Archivos

- `UserAccessDetail.vue`: detalle de accesos asignados.
- `UserApplicationSearchSelect.vue`: selector/buscador de aplicaciones o modulos.
- `UserAssetScopeSelector.vue`: selector de alcance por activos.
- `UserCompanyAccessMatrix.vue`: matriz de accesos por empresa.
- `UserEditorModal.vue`: modal de creacion y edicion de usuario.
- `UserFiltersBar.vue`: filtros del listado de usuarios.
- `UserListPanel.vue`: panel/listado de usuarios.
- `UserManagementHeader.vue`: encabezado del modulo.
- `UserModulePermissionGrid.vue`: grilla de permisos por modulo.
- `UserOperationalScopePanel.vue`: panel de alcance operativo.
- `UserSucursalScopeSelector.vue`: selector de alcance por sucursales.

## Regla de mantenimiento

Los componentes presentan y editan drafts. La normalizacion de permisos y estados debe quedar en `composables/users` o `utils/users`.
