# Views

Pantallas principales conectadas al router.

## Archivos

- `a.html`: archivo HTML auxiliar usado aparte por el usuario. No eliminar sin confirmacion explicita.
- `ActivosView.vue`: vista principal de monitoreo de activos.
- `AuditView.vue`: vista de auditoria.
- `CompanyManagementView.vue`: vista de administracion de empresas.
- `LoginView.vue`: vista de inicio de sesion.
- `NoAccessView.vue`: vista de acceso denegado.
- `ReportsView.vue`: vista de reportes.
- `UserManagementView.vue`: vista de administracion de usuarios.

## Regla de mantenimiento

Las vistas deben orquestar componentes y composables. Si una vista crece demasiado, extraer secciones visuales a `components` y estado a `composables`.
