# Support Composables

`useSupportPanel.js` coordina filtros, paginacion de 10 filas, seleccion,
creacion, respuestas, gestion y descargas del Panel de soporte.

`useSupportReplyDrafts.js` conserva texto y archivos por solicitud durante la
sesion de la vista. Filtrar, dejar la lista vacia o cambiar de solicitud no borra
la respuesta pendiente. El envio correcto limpia solo el borrador enviado;
un error lo conserva. Cambiar usuario elimina borradores y archivos en memoria.
No se persisten adjuntos File en localStorage. Prueba junto al composable.

- El cliente consulta solicitudes de sus empresas accesibles.
- El administrador de plataforma gestiona las empresas de su alcance.
- El rol technician gestiona solicitudes solo de sus empresas autorizadas.
- Los vehiculos del formulario provienen de visibleAssets y se recortan por empresa.
- Responsables: usuarios activos de plataforma o tecnicos de la empresa seleccionada.
- Cambiar estado/responsable/fecha deja eventos en la conversacion.
- Responder a una solicitud resuelta la reabre como Recibida.
- La carga de adjuntos se revierte si falla el guardado de la solicitud; un cambio
  de sesion durante la carga impide confirmar la operacion para otro usuario.

No hay rol global de soporte nuevo ni permisos backend; se reutiliza el rol tecnico
del prototipo. No es un servicio compartido entre navegadores.
