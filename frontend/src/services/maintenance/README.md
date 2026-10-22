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
# Licencias De Conductores

La vista usa driverLicenseStore con driverLicenseRepository (IndexedDB), separado
por empresa y conductor. Cada cambio escribe solo los registros modificados y
una version de empresa en una transaccion; memoria se actualiza tras oncomplete.
La version impide sobrescribir cambios de otra pestana y un indice unico evita
RUTs duplicados por empresa. La implementacion sin repository conserva compatibilidad
con el almacenamiento anterior para sus pruebas/migraciones, no la usa la vista.
Valida datos y permisos antes de confirmar memoria; evita sobrescribir datos
ilegibles o cambios detectados de otra pestana. Renovar conserva licencia previa,
fotos y autor de renovacion. Los archivos no se guardan en JSON: se referencia
storageId de maintenanceEvidenceStorage. Los adjuntos nuevos fallidos se limpian;
fotos historicas se conservan. Datos locales sin backend, cifrado ni respaldo remoto.

# Seguimiento De Licencias

addManagement valida acceso, resultado, observacion y cita. Las gestiones incluyen
autor, fecha y licenseId; sobreviven a edicion y renovacion sin alterar vencimiento.
Cada renovacion genera nuevo licenseId y conserva el anterior en history. Registros
antiguos sin licenseId se vinculan por createdAt, sin borrar fotos o historial.

# Recarga Sin Reprocesamiento

El repositorio migra una sola vez la clave sinergy-driver-licenses-v1 por empresa,
en una transaccion atomica y sin eliminar la copia legacy. Una migracion fallida
no deja marcador parcial ni sobrescribe el original. No se vuelve a leer el JSON
una vez migrado. Recargas sin cambios consultan version y conservan referencias.

# Datos Visuales De Conductores

driverLicensePdfExport genera PDF A4 horizontal con logo, contexto/filtros,
tabla actual e historial en seccion separada, encabezados y pie por pagina.
No exporta enlaces locales de imagen; indica disponibilidad igual que Excel.

Exportar a Excel carga ExcelJS bajo demanda y genera hojas Conductores y Licencias
anteriores para todos los resultados filtrados/ordenados (no solo pagina actual).
Incluye logo, empresa, filtros, fechas y presencia de fotos, sin enlaces locales.
Formato alineado a Sin reportar: gutters simetricos de 3, zoom85, logo centrado
a escala85, titulo17/subtexto12, franja azul/naranja, encabezado38, filas alternas,
filtros y pie paginado; ancho objetivo1800 y margenes de impresion iguales.
El ancho objetivo se adapta a la ventana de exportacion menos32px (limites
1200/2560) para reducir el sobrante derecho; ambos gutters siguen midiendo3.

Los 15 conductores DEMO reciben dos licencias anteriores con clases y fechas,
sin fotos inventadas. La migracion es idempotente, solo aplica a RUTs sinteticos
y nombres DEMO sin historial; no cambia licencia actual ni historiales existentes.
Felipe Munoz DEMO recibe PNG sinteticos de frente/reverso en la ultima licencia
anterior, claramente marcados sin validez. Se guardan en IndexedDB y no reemplazan
fotos existentes; si falla el guardado se limpian los archivos nuevos.

Guardado auditado con alta, correccion, renovacion, carga desde instancias nuevas
y fallo de escritura. Las fotos anteriores se conservan en historial y un fallo
no cambia el registro persistido. La prueba browser aislada verifica IndexedDB real,
visualizacion de fotos, recarga de pagina y limpieza de archivos tras fallo.

driverLicenseDemo agrega 15 registros ficticios (DEMO) solo en desarrollo y para
Transportes Schuck, con permisos de edicion. Conserva registros existentes y evita
duplicados por RUT sintetico. Incluye los tres estados y gestiones variadas.

# Prueba De Persistencia Incremental

scripts/driver-persistence-browser-audit.js se ejecuta en navegador aislado. Con
1000 conductores y 10 historiales verifica migracion, una sola escritura por edicion,
cero serializaciones de la coleccion, rollback, concurrencia, recarga y aislamiento.
En Edge se midieron 3.9ms para la edicion; no es comparable directamente con el
benchmark previo en Node ni incluye preparacion/render de tabla o red.

