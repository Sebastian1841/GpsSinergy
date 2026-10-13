# Maintenance Utils

Funciones puras y configuracion del modulo; no dependen de componentes Vue.

## Archivos

- `maintenanceModuleConfig.js`: tabs, tipos, prioridades, templates y formularios.
  Los criterios disponibles son Odometro, Horometro y Fecha/Hora (Tiempo en UI).
- `maintenanceFormatUtils.js`: numeros, fechas, montos, lecturas e intervalos.
- `maintenanceUiUtils.js`: etiquetas, clases e iconos de plan, OT y prioridad.
- `maintenancePlanIndex.js`: indice de planes con alias de vehiculo/empresa.
- `maintenanceOrderSummary.js`: resumen en una pasada de estados, costos,
  atrasos y cierres. El cumplimiento solo mide OT finalizadas con cierre y
  fecha limite; si no hay casos medibles, la tasa es null, no un cero inventado.
- `maintenanceOrderCosts.js`: normalizacion y desglose de costos de OT.
- `maintenanceAnalysisData.js`: indice de ejecuciones finalizadas por mes,
  vehiculo y componentes de costo; agregacion del periodo.
- `maintenanceReadingSourceMigration.js`: convierte registros legacy de
  Valor manual a un criterio valido. Los planes migrados quedan sin configurar
  cuando falta intervalo; conserva identidad, evidencias y referencias a OT.

## Reglas

No confundir plan, OT activa y ultima ejecucion. Crear un plan no crea una OT.
El cierre registra la ejecucion; la renovacion del plan es una accion separada.
Los costos historicos deben venir de OT cerradas, y los estados actuales del
plan no deben reemplazar las fechas de una ejecucion para calcular cumplimiento.
La palabra manual puede identificar un plan creado por usuario, pero ya no es
un cuarto criterio de lectura.

Los archivos `*.test.js` junto a los helpers verifican resumen, costos,
indices, analisis y migracion.
