# Unreported Utils

`unreportedDiagnosis.js` transforma lecturas en etiqueta breve y valores.
Recibe voltajes estructurados y fechas del reporte y de la
medicion; parseUnreportedPower es un adaptador del texto de las filas mock.
No interpreta datos ausentes como 0 V ni muestra hipotesis de bateria/fusible/SIM.
Acepta simStatus (absent/error/pin_required), mobileRegistered,
mobileRegistration y mobileSignalDbm para mostrar fallos expresamente reportados.
gpsFixValid, gpsFix y satellites describen posicion GPS, no prueban la causa
de una interrupcion de comunicacion. La intensidad de senal sola tampoco la prueba.
Solo atribuye una condicion al ultimo reporte cuando coincide su timestamp
con el de las mediciones. Sin evidencia suficiente muestra Causa no determinada.
Los mocks actuales no aportan estados SIM/modem/GPS; no se inventan estos datos.
Sin comunicacion muestra solo SIM/red/senal, sin voltajes ni posicion GPS.
Sin campos de conexion muestra Sin datos de conexion y Causa no determinada.
Los fallos de SIM y registro movil tampoco incluyen voltajes ajenos al motivo.
Si un reporte nuevo no aporta nuevas mediciones, las
lecturas antiguas no se reutilizan como prueba de un corte actual.

Tambien distingue recuperacion, ausencia de reportes y retiro manual.
previousExternalVoltage permite mostrar valor anterior -> ultimo valor solo si
el dato anterior existe. Las filas mock actuales no tienen voltaje externo
anterior al corte; el valor habitual de bateria interna no se usa como reemplazo.
`unreportedDiagnosis.test.js` valida estos limites. Para produccion, enviar
campos de telemetria numericos y timestamps desde API, no etiquetas de texto.
