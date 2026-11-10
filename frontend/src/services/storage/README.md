# Storage Services

Wrapper de almacenamiento local.

## Archivos

- `browserStorage.js`: funciones seguras sobre almacenamiento del navegador.
  `writeJsonStorageBatch` comprueba escrituras relacionadas y, si falla una,
  intenta restaurar las anteriores. Devuelve false aun si falla la restauracion;
  el consumidor no debe publicar exito ni cerrar el borrador. No es atomicidad
  entre ventanas ni protege ante cierre del proceso durante el lote.
- `confirmedFeatureWrites.test.js`: regresiones de fallos/reintentos de
  Geocercas, vistas guardadas, plantillas y reglas de Reportes, incluidos formularios.
- `browserStorage.test.js`: pruebas de almacenamiento.
- `collectionDatabaseStorage.js`: snapshot mock por colecciones versionadas y manifiesto. La primera escritura migra la base legacy; las posteriores serializan solo colecciones modificadas. Una escritura fallida no activa un manifiesto parcial ni pierde la version anterior.
- `collectionDatabaseStorage.test.js`: migracion, guardado parcial, fallo y reintento.

## Regla de mantenimiento

`mergeStoredRecords.js` combina cambios por ID contra el snapshot leido y el
ultimo guardado. Cambios independientes de otras ventanas se conservan;
ediciones incompatibles del mismo registro se rechazan sin activar el manifiesto.
`getError()` entrega el motivo; la base mock lo expone como `persistenceError`
y App muestra un aviso sin cerrar formularios ni descartar cambios.
No reemplaza una transaccion multiusuario de servidor para escrituras simultaneas.

Usar este wrapper en lugar de `localStorage` directo para controlar errores, defaults y migraciones.
