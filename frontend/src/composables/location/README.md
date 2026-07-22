# Location Composables

Composables relacionados con ubicaciones.

## Archivos

- `useReverseGeocodedRows.js`: agrega direcciones por geocodificacion inversa a filas con coordenadas.

## Regla de mantenimiento

El composable coordina cache y estado. La llamada concreta al proveedor debe quedar en `services/location`.
