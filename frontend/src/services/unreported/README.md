# Unreported Services

`unreportedExcelExportService.js` carga ExcelJS bajo demanda y descarga
equipos-sin-reporte.xlsx. Incluye equipo, IMEI, empresa, estado, tiempo sin
reportar, ultimo reporte, condicion al cortarse y ubicacion.
Los IMEI se mantienen como texto; la cabecera tiene autofiltro y esta congelada.
La vista envia todas las filas filtradas, independientemente de la pagina.
`unreportedExcelExportService.test.js` prueba el contenido del libro.
La fuente de filas sigue siendo local/mock; no hay API de telemetria en este servicio.
