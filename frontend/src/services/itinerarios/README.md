# Itinerario Services

Servicios de exportacion y procesamiento de itinerarios.

## Archivos

- `itineraryExportFormatUtils.js`: helpers de formato para exportacion.
- `itineraryExportService.js`: generacion de archivos de exportacion. Usa por defecto el PDF vertical corporativo con encabezado, datos generales, resumen, mapa cuando existe, activos incluidos y detalle. La hoja principal de Excel (`Reporte`) sigue el mismo orden visual de la vista previa: encabezado blanco para que el logo azul sea legible, datos generales, resumen, mapa, graficos y tablas; usa zoom normal, malla visual A:R, ancho completo y area de impresion hasta el ultimo bloque renderizado. Las hojas `Detalle GPS` y `Activos` conservan el detalle completo. Cuando el PDF recibe mas columnas de las que caben legibles en la tabla principal, agrega una seccion `Detalle adicional` con las columnas restantes. Conserva el PDF horizontal anterior solo como layout `legacy-landscape`.
- `itineraryExportService.test.js`: pruebas de exportacion.
- `itineraryPanelExportService.js`: exportacion desde el panel de itinerarios.
- `nativeExcelCharts.js`: soporte de graficos nativos para Excel. Puede anexar graficos y logo a una hoja que ya tenga dibujos de ExcelJS, como el mapa de ruta.

## Regla de mantenimiento

La generacion pesada de documentos puede vivir aqui durante prototipo. Para produccion conviene moverla a backend o workers.
