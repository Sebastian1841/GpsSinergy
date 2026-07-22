# Route Trip Map

Generacion de imagen de mapa para reportes de viaje.

## Archivos

- `routeTripMapImageUtils.js`: orquesta canvas, tiles, rutas y resultado final.
- `routeTripMapRouteUtils.js`: normaliza rutas desde filas de reporte.
- `routeTripMapProjectionUtils.js`: bounds, zoom y proyeccion Mercator.
- `routeTripMapTileUtils.js`: carga y cache de tiles CARTO.
- `routeTripMapLegendUtils.js`: leyenda y rotulos del mapa.

## Criterio

Esta capa genera imagenes para preview/PDF/Excel. Debe mantenerse sin dependencia directa de Vue.
