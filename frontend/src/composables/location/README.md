# Location Composables

Composables relacionados con ubicaciones.

## Archivos

- `useReverseGeocodedRows.js`: agrega direcciones por geocodificacion inversa a filas con coordenadas.
  Cada lote visible tiene AbortController. Desactivar resolucion o desmontar
  cancela sus suscripciones y limpia pendientes; no cancela otros consumidores
  compartidos. Cancelaciones no se registran como fallos para reintento. Al
  reactivar se reprograman reintentos previos pendientes.

## Regla de mantenimiento

El composable coordina cache y estado. La llamada concreta al proveedor debe quedar en `services/location`.
