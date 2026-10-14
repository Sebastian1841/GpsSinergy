# Support Components

`SupportRequestModal.vue` es el formulario de nueva solicitud, cargado bajo
demanda desde SupportView. Recibe empresas/activos autorizados y emite el borrador;
no guarda datos directamente. Incluye tipo, vehiculo opcional, asunto,
descripcion y adjuntos. Dialog nativo con cierre bloqueado durante el envio.

Los archivos se limitan a 5 por mensaje y 10 MB cada uno: PDF, PNG, JPG, WebP
y TXT. La validacion definitiva de produccion debe existir tambien en servidor.
