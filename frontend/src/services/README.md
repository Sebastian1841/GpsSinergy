# Services

Capa de acceso a datos, adaptadores mock y servicios externos.

## Carpetas

- `access/`: empresas y permisos disponibles para la sesion.
- `activos/`: acceso a datos de activos.
- `audit/`: registros de auditoria.
- `auth/`: autenticacion.
- `companies/`: empresas y sucursales.
- `itinerarios/`: exportacion y procesamiento de itinerarios.
- `location/`: geocodificacion inversa.
- `reports/`: plantillas y programaciones de reportes.
- `routing/`: rutas externas OSRM.
- `storage/`: wrapper de almacenamiento local.
- `users/`: usuarios y permisos.

## Regla de mantenimiento

Los componentes no deben tocar mocks o localStorage directamente. Deben pasar por composables y services.
