# Audit Services

Servicios de auditoria.

## Archivos

- `useAuditService.js`: expone registros de auditoria hacia vistas y composables.

## Registro Comprobado (2026-11-04)

`appendAuditLog(entry, { requirePersistence: true })` relee la coleccion local,
rechaza JSON corrupto, deduplica por id y escribe antes de publicar el registro.
Si falla la persistencia lanza error; no afirmar exito en el llamador.
La via sin esa opcion conserva el comportamiento local existente, no ofrece la
misma garantia de escritura comprobada.

Ajustes avanzados usa la via estricta para vaciar su cola pendiente, con actor,
fecha y antes/despues. El reintento conserva ids para no duplicar eventos y no
debe perder eventos de una escritura posterior. Clave sinergy-audit-log, hasta
700 registros. Pruebas en useAuditService.test.js y advancedConfiguration.test.js.
Este modulo centraliza el historial de configuracion; no agregar otro historial
independiente en Ajustes avanzados.

## Regla de mantenimiento

Para prototipo puede leer auditoria local. En produccion debe consultar registros firmes del backend.
