# Support Services

- `useSupportService.js`: instancia local compartida dentro de la app.
  Persiste metadatos en sinergy-support-requests-v1 mediante browserStorage.
- `supportRequestStore.js`: creacion, conversacion, gestion y comprobaciones
  de alcance. Solo actualiza estado reactivo si la escritura fue confirmada.
- `supportAttachmentStorage.js`: archivos en IndexedDB sinergy-support-files,
  almacen files. Los mensajes guardan metadatos y storageId, no base64.
- `supportRequestStore.test.js`: permisos, validaciones, persistencia, estados,
  responsable, cita y reapertura.

Cada operacion recibe el contexto autorizado actual; las descargas comprueban
acceso y pertenencia del archivo a la conversacion. Esto no sustituye autorizacion
de servidor. No hay sincronizacion entre usuarios en equipos distintos, correo,
notificaciones externas ni respaldo central. Para produccion, sustituir storage
por API y almacenamiento de archivos con validacion y permisos reales.
