# Maintenance Services

Persistencia local, adjuntos y generacion de archivos. No hay backend de
mantenciones ni sincronizacion entre navegadores.

## Persistencia Y Evidencias

- `maintenanceStateStorage.js`: secciones versionadas de localStorage y
  manifiesto; confirma el conjunto solo si todas las escrituras resultan.
  Migra el snapshot antiguo y conserva la version anterior ante errores.
- `maintenanceStatePersistence.js`: agrupa cambios durante 350 ms, guarda
  secciones con nueva referencia y vacia pendientes al salir/ocultar la pagina.
- `maintenanceEvidenceStorage.js`: archivos en IndexedDB y migracion de
  adjuntos base64. El estado contiene metadatos y storageId, no el archivo.
- `maintenanceEvidenceSession.js`: carga concurrente controlada y limpieza
  de archivos temporales sin borrar evidencias aun referenciadas.

## Exportadores

- `workOrderExportService.js`: PDF de una OT, importado al solicitar descarga.
- `maintenanceFleetExportService.js`: Excel con Reporte, Resumen, Vehiculos y
  Planes; conserva datos completos en hojas tabulares.
- `maintenanceFleetReportSheet.js`: hoja Reporte agrupada por vehiculo,
  encabezado corporativo, bandas por activo, estados coloreados, margenes
  simetricos y columnas ajustadas al ancho solicitado.
- `maintenanceFleetPdfExportService.js`: PDF horizontal por vehiculo con
  encabezados repetidos y paginacion; varios bloques pequenos comparten pagina.
- `maintenanceHistoryExportService.js`: Excel/PDF de ejecuciones filtradas
  del vehiculo. Incluye OT, mantencion, cierre, lectura, criterio, responsable,
  taller, costos y fecha limite. Fechas de cierre ISO se muestran en horario
  America/Santiago. Los costos de Excel permanecen numericos.
  El Excel tiene encabezado corporativo, margenes iguales, espacio interior
  de celdas y columnas proporcionales. El PDF usa cabecera blanca sobre azul
  y la repite en cada pagina.

## Contratos Y Limites

La seleccion y los filtros se resuelven antes de invocar exportadores; estos
no deben recuperar todos los planes silenciosamente. El historial descarga
todas las filas filtradas, no solo la pagina visible.
ExcelJS y jsPDF se cargan bajo demanda. reportWidthPx aproxima el ancho al
crear el archivo: Excel no es responsive al cambiar de monitor o zoom.
Los archivos descargados son snapshots, no datos enlazados al prototipo.

Las pruebas locales cubren almacenamiento, evidencias y exportaciones.
No se consideran una verificacion visual en Excel ni un render visual del PDF.
