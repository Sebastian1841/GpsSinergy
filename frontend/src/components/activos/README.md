# Activos Components

Componentes visuales del modulo de activos.

## Carpetas

- `fleet/`: panel lateral, tabla, modales y acciones de flota.
- `geocercas/`: edicion, seleccion e historial de geocercas.
- `itinerarios/`: paneles, tablas y graficos de itinerarios.
- `map/`: mapa principal y controles flotantes.
- `routes/`: comparacion de rutas y configuracion de rutas planificadas.

## Regla de mantenimiento

Mantener esta carpeta orientada a UI. La sincronizacion de telemetria, filtros y persistencia vive en `composables/activos`.

Los grupos de vehiculos son organizativos y deben gestionarse desde el header
de Activos junto al filtro por ciudades. Sirven para crear, eliminar, asignar y
filtrar vehiculos dentro del universo autorizado. Las etiquetas de acceso son
las que controlan visibilidad real de activos para usuarios.

No debe existir un segundo administrador de grupos de vehiculos dentro de
Empresas ni dentro del panel lateral. Si se agrega otra UI para grupos, debe
consumir el mismo flujo del header de Activos.

El estado `stopped` representa un activo detenido. No debe mostrarse como
`Alerta`; las alertas operativas deben venir de reglas o campos de alerta
separados.
