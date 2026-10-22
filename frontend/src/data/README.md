# Data

Datos mock y configuraciones estaticas usadas por el prototipo.

## Archivos

- `mockAssetReporting.js`: completa fixtures de Activos con reportes fechados.
  Offline: escenarios de 2/4/8/15/30 dias y diagnosticos demostrativos de alimentacion,
  SIM/red o causa no determinada. En linea: 1 a 5 minutos antes del snapshot inicial.
  Conserva fechas completas y campos existentes; solo source mock-database sin
  reporte explicito. Fecha completa en datosUlt y canonical reportedAt/lastReportAt.
  No representa telemetria real ni stream continuo. Pruebas de escenarios y compatibilidad.

- `mockDatabase.js`: base mock principal. Incluye usuarios, accesos y scopes operativos. El alcance editable de flota se modela por toda la flota, activos especificos o etiquetas de activos; los ejemplos no deben volver a crear scopes por sucursal.
- `mockAlarms.js`: alertas mock por empresa y activo. Sirve como semilla del
  servicio local de alertas; la vista debe cruzarlas contra `visibleAssets`
  antes de mostrarlas.
- `mockAutomaticAlertRules.js`: reglas mock de alertas automaticas por empresa.
  Sirve como semilla del panel de configuracion de reglas.
- `mockGeofenceHistoryData.js`: historial mock de geocercas.
- `mockItineraryData.js`: datos mock de itinerarios.
- `mockPlannedRoutes.js`: rutas planificadas mock.
- `mockReportTemplates.js`: plantillas mock de reportes. La plantilla de detenciones incluye columnas de ubicacion y coordenadas para que el prototipo pueda generar mapa en preview/PDF/Excel. La plantilla de geocercas incluye columnas de hora de entrada y hora de salida para que la regla de entradas/salidas tenga campos visibles al crear o editar el reporte.
- `mockTelemetryStream.js`: stream mock de telemetria. La simulacion favorece mas transiciones a `stopped` para que mapas e informes de detenciones tengan paradas suficientes en demo.
- `reportEventRuleConfig.js`: configuracion base de reglas de evento.

## Regla de mantenimiento

Estos archivos no deben crecer como base de datos real. Para produccion, los datos deben venir desde backend y estos mocks quedar como fixtures de demo o tests.

`mockDatabase.js` incluye el modulo `maintenance` y sus funciones `maintenance-view`, `maintenance-orders` y `maintenance-plans` solo para permisos y navegacion del prototipo. La vista actual de mantenciones no persiste ordenes reales ni planes reales.
