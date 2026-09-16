# Utils

Funciones puras y helpers compartidos.

## Archivos directos

- `geofenceMapUtils.js`: helpers de geocercas para mapa.
- `geofenceImportExportUtils.js`: conversion de geocercas a/desde KML, KMZ,
  GeoJSON, CSV y XML. El CSV acepta el formato exportado por la plataforma y
  columnas comunes como `name`, `lat`, `lng`, `radius` o `wkt`. El XML acepta el
  formato Sinergy, KML con extension `.xml`, GPX, WKT, XML de grupos GpsGate y
  etiquetas habituales como `zona`, `area`, `latitud`, `longitud`, `radio`,
  `vertex` o `coordinates`. GeoJSON soporta `FeatureCollection`, `Feature`,
  `Point` con radio, `LineString`, `Polygon`, `MultiLineString` y
  `MultiPolygon`. KMZ se maneja como KML comprimido en ZIP.
- `geofenceImportExportUtils.test.js`: pruebas de importacion/exportacion de
  geocercas. Cubre CSV, XML, KML, GeoJSON, KMZ, WKT, GPX, grupos de GpsGate y
  seleccion de grupos al exportar.
- `geofenceUtils.js`: funciones generales de geocercas.
- `idUtils.js`: normalizacion de identificadores.
- `layout/`: helpers puros para alcance y datos del layout.
- `mapSignatureUtils.js`: firmas para detectar cambios de mapa.
- `numberUtils.js`: helpers numericos.
- `performanceUtils.js`: utilidades de rendimiento.
- `telemetryUtils.js`: normalizacion de telemetria.
- `terminalUtils.js`: helpers de terminal.

## Carpetas

- `activos/`: helpers de activos.
- `alarms/`: helpers puros de alcance, filtros, orden y resumen de alertas y
  reglas automaticas.
- `companies/`: helpers de empresas.
- `maintenance/`: configuracion, formato y helpers visuales de mantenciones.
- `pdf/`: dependencias opcionales de PDF.
- `reports/`: helpers de reportes.
- `users/`: helpers de usuarios.

## Regla de mantenimiento

No usar Vue ni DOM aqui salvo excepciones muy justificadas. Esta carpeta debe ser facil de testear.
