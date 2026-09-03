# Location Services

Servicios de ubicacion.

## Archivos

- `reverseGeocodingService.js`: geocodificacion inversa. Centraliza proveedor, cache, cola de peticiones, limites de resolucion y override de URL usando `browserStorage`.
- `reverseGeocodingService.test.js`: pruebas de geocodificacion inversa.

## Regla de mantenimiento

Centralizar proveedor, cache y limites de uso para no repartir llamadas de geocoding por componentes.
