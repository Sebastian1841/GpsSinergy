# Routing Services

Servicios externos de ruteo.

## Archivos

- `osrmRouteService.js`: consulta y normalizacion de rutas OSRM.
- `osrmRouteService.test.js`: pruebas del servicio OSRM.

## Regla de mantenimiento

Encapsular URLs, retries y normalizacion en esta carpeta. La UI no debe conocer detalles del proveedor.
