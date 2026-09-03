# Map Components

Componentes visuales del mapa de activos.

## Archivos

- `ActivosMapPanel.vue`: contenedor del mapa Leaflet y sus capas. Recibe
  `geofenceGroups` desde `ActivosView.vue` y los entrega al editor de geocercas
  para que crear/editar use dropdown de grupos existentes. Cuando el usuario
  presiona el acceso de geocercas desde la barra flotante, emite hacia
  `ActivosView.vue` para abrir la seccion lateral `geocercas` en vez de montar
  un modal de edicion. El panel no muestra etiqueta flotante del tipo de mapa
  ni accesos rapidos de estela/limpieza sobre el mapa para evitar duplicar
  controles visuales.
- `MapFloatingTools.vue`: controles flotantes del mapa. El acceso `Geocercas`
  redirige al panel lateral de geocercas. La barra ya no muestra acceso a
  historial ni monta modales de selector/historial de geocercas.
- `TopStatsBar.vue`: barra superior de indicadores.

## Regla de mantenimiento

La manipulacion directa de Leaflet debe quedar encapsulada en composables de mapa para evitar que el componente principal crezca.

`stopped` se muestra como `Detenido` y usa color corporativo naranja. No debe
contarse como alerta critica en esta barra.
