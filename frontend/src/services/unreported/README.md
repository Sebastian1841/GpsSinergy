# Unreported Services

`unreportedExcelExportService.js` carga ExcelJS bajo demanda y descarga
equipos-sin-reporte.xlsx. Incluye equipo, IMEI, empresa, estado, tiempo sin
reportar, ultimo reporte, condicion al cortarse y ubicacion.
Los IMEI se mantienen como texto; la cabecera tiene autofiltro y esta congelada.
La vista envia todas las filas filtradas, independientemente de la pagina.
`unreportedExcelExportService.test.js` prueba el contenido del libro.
La fuente de filas sigue siendo local/mock; no hay API de telemetria en este servicio.

El Excel incluye etiqueta breve y voltajes calculados por
utils/unreported/unreportedDiagnosis.js. Se retiraron las hipotesis largas
tanto de la tabla como de la exportacion.

La libreta de notas y su servicio se retiraron. La clave antigua
sinergy-unreported-notes-v1 no se lee ni escribe; los datos ya guardados no se
eliminan del navegador en esta retirada. El seguimiento permanece independiente.

## Ciclo De Seguimiento

`unreportedLifecycleStore.js` guarda estado por empresa/IMEI en
sinergy-unreported-lifecycle-v1. Tiene Sin reportar (active), Recuperados
(recovered). reporting es un estado interno
para equipos recientes sin incidencia previa: no se inventa una recuperacion.

- observe compara reportes y umbral; ignora datos atrasados/futuros y cambia el
  seguimiento al volver a transmitir o superar otra vez el umbral.
- receiveReport permite integrar un paquete nuevo y tambien la simulacion demo.
- Su quinto argumento opcional recibe diagnosticos normalizados del paquete:
  voltajes, SIM, registro movil, intensidad de senal y posicion GPS. Se guardan
  solo campos escalares permitidos con la fecha del paquete. Sin diagnosticos
  nuevos no se actualiza la fecha de las mediciones anteriores.
- observe tambien acepta row.telemetry con reportedAt igual a la fecha del
  reporte entrante. Datos atrasados/futuros no justifican un fallo actual.
- saveFault registra/edita fault, faultAt y faultBy sin retirar el equipo.
- La falla permanece al recuperarse y se incluye en Excel separada del GPS.
- observe migra retiros legacy a seguimiento segun ultimo reporte y umbral,
  conservando motivo, fecha y responsable como falla registrada.
- Registro local, editable, no historial de versiones ni confirmacion de reparacion.
- Flujo actual: addNote agrega notas independientes con ID, fecha y autor sin
  sobrescribir anteriores. observe convierte la falla anterior en una nota una
  sola vez; tambien se conservan al recuperar el equipo. Exportacion incluye notas.
- saveFault queda como compatibilidad de registros anteriores, no accion de UI.
- editNote/deleteNote validan alcance de empresa e ID existente y guardan de
  forma atomica. Editar conserva creacion/autor y agrega updatedAt/updatedBy.
  Borrar una nota migrada no vuelve a importarla al observar nuevos reportes.

La vista revisa cada minuto mientras esta abierta y al pulsar Actualizar.
Umbral local de 1/6/12/24 horas, persistido como preferencia. No hay API ni stream
GPS real conectado: Simular reporte (demo) es explicito y no confirma una
reparacion ni una conexion real. Para produccion, usar IDs estables, datos reales,
permisos de servidor y una evaluacion independiente de una pestaña abierta.
`unreportedLifecycleStore.test.js` cubre transiciones, persistencia, fechas y fallos.
