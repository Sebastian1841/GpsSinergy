# Utils

Funciones puras y helpers compartidos.

## Archivos directos

- `geofenceMapUtils.js`: helpers de geocercas para mapa.
- `geofenceUtils.js`: funciones generales de geocercas.
- `idUtils.js`: normalizacion de identificadores.
- `mapSignatureUtils.js`: firmas para detectar cambios de mapa.
- `numberUtils.js`: helpers numericos.
- `performanceUtils.js`: utilidades de rendimiento.
- `telemetryUtils.js`: normalizacion de telemetria.
- `terminalUtils.js`: helpers de terminal.

## Carpetas

- `activos/`: helpers de activos.
- `companies/`: helpers de empresas.
- `pdf/`: dependencias opcionales de PDF.
- `reports/`: helpers de reportes.
- `users/`: helpers de usuarios.

## Regla de mantenimiento

No usar Vue ni DOM aqui salvo excepciones muy justificadas. Esta carpeta debe ser facil de testear.
