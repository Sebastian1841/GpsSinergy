# Location Services

Servicios de ubicacion.

## Archivos

- `reverseGeocodingService.js`: geocodificacion inversa.
- `reverseGeocodingService.test.js`: pruebas de geocodificacion inversa.

## Regla de mantenimiento

Centralizar proveedor, cache y limites de uso para no repartir llamadas de geocoding por componentes.
