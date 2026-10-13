# Itinerario Services

Servicios de exportacion y procesamiento de itinerarios.

## Archivos

- `itineraryExportFormatUtils.js`: helpers de formato para exportacion.
- `itineraryExportService.js`: fachada publica de exportacion. Conserva los mismos exports para que los consumidores no dependan de la implementacion de cada formato.
- `itineraryExportModel.js`: columnas, normalizacion de celdas, ordenamiento de activos y filas, y metricas compartidas por PDF y Excel.
- `itineraryPdfExportService.js`: composicion y descarga del PDF corporativo. Incluye encabezado, datos generales, resumen, mapa, activos y detalle; limita las columnas legibles y agrega `Detalle adicional` cuando corresponde. Conserva el layout horizontal anterior como `legacy-landscape`.
- `itineraryExcelExportService.js`: construccion del libro Excel. La hoja `Reporte` sigue el orden visual de la vista previa y las hojas `Detalle GPS` y `Activos` conservan los datos completos.
- `itineraryExportService.test.js`: pruebas de exportacion.
- `itineraryPanelExportService.js`: exportacion desde el panel de itinerarios.
- `nativeExcelCharts.js`: soporte de graficos nativos para Excel. Puede anexar graficos y logo a una hoja que ya tenga dibujos de ExcelJS, como el mapa de ruta.

## Regla de mantenimiento

Los consumidores deben importar desde `itineraryExportService.js`. Los modulos PDF y Excel pueden evolucionar de forma independiente, mientras que toda transformacion compartida debe vivir en `itineraryExportModel.js`. Para produccion, la generacion pesada puede moverse a backend o workers sin cambiar la fachada publica.
