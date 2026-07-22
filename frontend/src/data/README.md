# Data

Datos mock y configuraciones estaticas usadas por el prototipo.

## Archivos

- `mockDatabase.js`: base mock principal.
- `mockGeofenceHistoryData.js`: historial mock de geocercas.
- `mockItineraryData.js`: datos mock de itinerarios.
- `mockPlannedRoutes.js`: rutas planificadas mock.
- `mockReportTemplates.js`: plantillas mock de reportes.
- `mockTelemetryStream.js`: stream mock de telemetria.
- `reportEventRuleConfig.js`: configuracion base de reglas de evento.

## Regla de mantenimiento

Estos archivos no deben crecer como base de datos real. Para produccion, los datos deben venir desde backend y estos mocks quedar como fixtures de demo o tests.
