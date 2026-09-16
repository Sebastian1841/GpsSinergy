# Itinerario Composables

Estado y datos derivados de itinerarios.

## Archivos

- `useItineraryAssets.js`: seleccion y preparacion de activos para itinerarios.
- `useItineraryFilters.js`: filtros de consulta. Soporta rangos rapidos de hoy,
  ayer, esta semana, ultima semana, este mes y ultimo mes, ademas de fecha
  personalizada. `Esta semana` usa la semana calendario vigente desde lunes
  hasta la fecha actual; `Ultima semana` usa la semana calendario anterior
  completa.
- `useItineraryRoute.js`: calculo y estado de ruta de itinerario. Permite
  desactivar el fallback mock; la vista normal lo usa apagado para que
  `Itinerarios` y `Resumen del dia` no inventen recorridos de dias sin historial
  real/local. El contexto externo de Alertas puede encender ese fallback solo
  para mostrar el recorrido de prototipo del dia de la alerta. Busca historial
  usando todos los identificadores del activo disponibles, como `id`, `deviceId`,
  IMEI o patente.
- `useItineraryFilters.test.js`: pruebas de los rangos rapidos de fechas,
  especialmente semanas calendario.
- `useItineraryRoute.test.js`: pruebas de ruta de itinerario.
- `useItineraryTableRows.js`: filas visibles de la tabla.

## Regla de mantenimiento

Estos composables preparan datos para componentes. Exportaciones y formatos de archivo deben vivir en `services/itinerarios`.
