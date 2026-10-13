# Storage Services

Wrapper de almacenamiento local.

## Archivos

- `browserStorage.js`: funciones seguras sobre almacenamiento del navegador.
- `browserStorage.test.js`: pruebas de almacenamiento.
- `collectionDatabaseStorage.js`: snapshot mock por colecciones versionadas y manifiesto. La primera escritura migra la base legacy; las posteriores serializan solo colecciones modificadas. Una escritura fallida no activa un manifiesto parcial ni pierde la version anterior.
- `collectionDatabaseStorage.test.js`: migracion, guardado parcial, fallo y reintento.

## Regla de mantenimiento

Usar este wrapper en lugar de `localStorage` directo para controlar errores, defaults y migraciones.
