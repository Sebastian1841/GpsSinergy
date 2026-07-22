# Composables

Hooks Vue que coordinan estado, efectos, watchers y flujos de pantalla.

## Carpetas

- `activos/`: estado de activos, mapa, flota, geocercas, rutas e itinerarios.
- `audit/`: historial de auditoria en cliente.
- `auth/`: sesion y control de acceso.
- `companies/`: gestion de empresas y sucursales.
- `location/`: geocodificacion inversa para filas.
- `mock/`: base mock local.
- `reports/`: ejecucion y configuracion de reportes.
- `ui/`: estado de UI reutilizable.
- `users/`: gestion de usuarios y accesos.
- `workspaces/`: espacios de trabajo y persistencia visual.

## Regla de mantenimiento

Un composable puede usar Vue y servicios. Si una funcion no requiere Vue, moverla a `utils`.
