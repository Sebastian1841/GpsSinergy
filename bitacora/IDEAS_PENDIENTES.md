# Ideas Pendientes

Propuestas para evaluar. No son funcionalidades implementadas ni cambios listos
para produccion.

## Soporte: Plantillas De Respuesta

- Registrada: 2026-11-05. El usuario la considera una posibilidad; pendiente de
  evaluar y autorizar implementacion.
- Guardar respuestas frecuentes e insertarlas al responder un caso.
- Permitir editar el texto antes de enviar; nunca enviar automaticamente ni
  reemplazar un borrador existente sin confirmacion.
- Valor: reducir redaccion repetitiva y recordar antecedentes necesarios para
  resolver casos, por ejemplo equipos sin comunicacion.
- Prototipo posible en frontend con persistencia local. Compartir plantillas
  entre operadores o dispositivos requiere definir persistencia e integracion.

## Mantenciones: Anadir A Google Calendar

- Registrada: 2026-11-05. El usuario solicito dejarla pendiente, sin implementar.
- Abrir Google Calendar con un borrador de evento precargado desde una OT;
  el usuario revisa y guarda en Google.
- La fecha limite no debe presentarse como cita de taller. Sin sincronizacion
  automatica con modificaciones o cancelaciones de la OT.
- No confundir con Google Meet, que agrega videoconferencia.
- Antecedente: el experimento de descarga .ics fue revertido con nutella.

## Soporte: Biblioteca De Soluciones

- Registrada: 2026-11-05. Candidata aceptada para anotar; no autorizada para
  implementacion todavia.
- Crear una ficha desde un caso resuelto, con problema, sintomas, pasos de
  solucion y archivos de apoyo. Revision manual antes de publicar.
- Buscar y vincular soluciones a otros casos para reutilizar conocimiento.
- No copiar automaticamente conversaciones, datos privados ni adjuntos del
  cliente. Revisar contenido y permisos antes de compartir cualquier archivo.
- Diferencia con plantillas: documenta como resolver, no solo que responder.
- Editor, buscador y vinculacion se pueden prototipar en frontend; compartir
  fichas entre usuarios requiere persistencia e integracion definidas.

## Transversal: Ayuda Contextual (Etapa Final)

- Registrada: 2026-11-05. El usuario quiere incorporarla mas adelante,
  expresamente al final; no implementar ahora.
- Consultar desde cada pantalla el significado de campos, estados e indicadores,
  incluyendo calculo e implicaciones cuando corresponda.
- Contenido revisado contra el funcionamiento real, no respuestas generadas
  automaticamente ni explicaciones basadas en funciones aun no conectadas.
- Abordar cuando pantallas y flujos esten estabilizados para evitar documentar
  comportamientos transitorios. Alcance principalmente frontend.
