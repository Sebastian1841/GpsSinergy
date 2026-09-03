# Itinerario Components

Componentes visuales de itinerarios.

## Archivos

- `ItineraryCharts.vue`: graficos del comportamiento del itinerario.
- `ItineraryDaySummary.vue`: resumen diario en formato tabla por activo, similar
  al flujo GPSGate pero mas completo. Mantiene la tabla por activo y agrega KPI
  compactos, grafico Chart.js de distancia por tiempo y bloque de jornada sin
  tarjeta duplicada de mayor recorrido. Carga Chart.js de forma lazy para no
  afectar el arranque del modulo. No usa fallback mock; solo resume historial
  real/local y la ubicacion actual cuando corresponde al rango. Ademas filtra
  sus filas por `fromDate` y `toDate` antes de calcular metricas para no mostrar
  datos de hoy cuando el rango activo es ayer. No debe repetir el detalle punto
  a punto del itinerario.
- `ItineraryPanel.vue`: panel principal de itinerarios. Acepta
  `contextRequest` desde el menu contextual de activos para seleccionar un
  vehiculo, aplicar rango rapido, abrir `Itinerarios` o `Resumen del dia` y
  generar la consulta automaticamente. Tambien puede agregar un activo al
  resumen diario actual sin reemplazar la seleccion existente. Cuando ya hay un
  resultado cargado, los rangos rapidos refrescan la consulta para evitar que la
  etiqueta del rango quede distinta a los datos visibles. La consulta normal no
  usa recorridos mock como respaldo; si un rango no tiene historial real/local,
  ambos tabs muestran estado vacio.
- `ItinerarySummary.vue`: metricas generales.
- `ItineraryTable.vue`: tabla de recorridos y eventos.

## Regla de mantenimiento

Los componentes consumen datos ya preparados desde composables. Transformaciones de filas o rutas deben estar en `composables/activos/itinerarios` o `utils/activos`.
