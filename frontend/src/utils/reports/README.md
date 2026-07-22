# Report Utils

Logica pura de reportes. Esta carpeta vive dentro de `src/utils` para seguir la estructura base del frontend.

## Subcarpetas

- `config/`: opciones y configuracion comun.
- `execution/`: construccion de filas y aplicacion de reglas sobre telemetria.
- `export/`: Excel, PDF, charts y branding.
- `event-rules/`: motor y helpers de reglas de evento.
- `route-map/`: generacion de imagen de mapa de viajes.
- `schedules/`: programaciones de reportes.
- `views/`: helpers especificos de vistas o modales.

## Criterio

Esta carpeta concentra comportamiento testeable y portable. Si una funcion no necesita Vue ni DOM, debe vivir aqui.
