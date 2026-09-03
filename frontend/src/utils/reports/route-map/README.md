# Route Trip Map

Generacion de imagen de mapa para reportes de viaje y detenciones.

## Archivos

- `routeTripMapImageUtils.js`: orquesta canvas, tiles, rutas, marcadores de inicio/fin, marcadores numerados de detenciones y resultado final.
- `routeTripMapRouteUtils.js`: normaliza rutas desde filas de reporte. En detenciones agrupa por dispositivo para dibujar un recorrido unico y superponer marcadores numerados de parada; si no llega `routeTrip.points`, arma fallback con `lat/lng` de las filas.
- `routeTripMapProjectionUtils.js`: bounds, zoom y proyeccion Mercator.
- `routeTripMapTileUtils.js`: carga y cache de tiles CARTO.
- `routeTripMapLegendUtils.js`: leyenda y rotulos del mapa.

## Criterio

Esta capa genera imagenes para preview/PDF/Excel. Debe mantenerse sin dependencia directa de Vue.

Para reportes de detenciones, la ejecucion intenta adjuntar el historial GPS completo del rango como `routeTrip.points`. Las filas de detencion ya llegan agrupadas por parada real, con microdetenciones filtradas, y siguen aportando coordenadas (`lat`, `lng`) y una ubicacion (`address` o equivalente) para marcar cada parada numerada sobre la ruta.
