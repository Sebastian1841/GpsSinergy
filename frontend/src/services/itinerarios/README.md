# Itinerario Services

Servicios de exportacion y procesamiento de itinerarios.

## Archivos

- `itineraryExportFormatUtils.js`: helpers de formato para exportacion.
- `itineraryExportService.js`: generacion de archivos de exportacion.
- `itineraryExportService.test.js`: pruebas de exportacion.
- `itineraryPanelExportService.js`: exportacion desde el panel de itinerarios.
- `nativeExcelCharts.js`: soporte de graficos nativos para Excel.

## Regla de mantenimiento

La generacion pesada de documentos puede vivir aqui durante prototipo. Para produccion conviene moverla a backend o workers.
