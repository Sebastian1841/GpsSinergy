# Layout Utils

Helpers puros de navegacion y configuracion. Estado documentado: 2026-11-04.

## Archivos

- `appHeaderAccessScopeUtils.js`: calcula usuarios permitidos para el buscador
  global y el selector de espacios. La regla clave es que un usuario normal solo
  ve usuarios asociados a empresas donde tenga `users-view`; el administrador de
  plataforma mantiene alcance global.
- `appHeaderAccessScopeUtils.test.js`: pruebas del alcance de usuarios del
  header.

## Regla de mantenimiento

Mantener aqui funciones sin Vue ni DOM. Las reglas de permisos que afecten el
header deben probarse antes de conectarlas a componentes.
## Configuracion De Limites

limitsConfiguration.js define valores de referencia por tipo, identifica activos
sin tipo sin convertirlos a automovil, valida velocidad y consumo y guarda solo
la configuracion local del alcance solicitado. Cada escritura relee los datos
para conservar otros campos; rechaza JSON corrupto, falta de permiso y errores
de almacenamiento. Eliminar un valor propio restaura la herencia. La lectura
para informes se compone en reports/execution/reportLimitsContext.js, que toma
una instantanea por empresa y no relee almacenamiento por cada muestra GPS.

La escritura explicita conserva borradores ante fallo y compara configuracion
esperada para detectar conflictos. La vista agrega avisos al salir, descarte de
ambas pestanas, vista previa y valores guardado/original. No es una API productiva.

## Catalogo Y Etiquetas

- `configurationNavigation.js`: cinco entradas compartidas por router/sidebar.
  Limites, Etiquetas y Alertas tienen variante por empresa con permiso de funcion;
  Variables y Avanzado son exclusivos de plataforma.
- `tagSearch.js`: busqueda general por etiqueta o activo y refinamiento local de
  activos asignados. Buscar un activo reduce las filas, no solo localiza su etiqueta.

## Ajustes Avanzados

`advancedConfiguration.js` define grupos, siete campos, defaults, validacion,
diferencias y almacenamiento `sinergy-advanced-configuration-v1:platform`.
Guardado local con revision esperada y evento de auditoria pendiente en la misma
operacion. `syncAdvancedAudit` reintenta el registro central sin duplicarlo y
conserva eventos posteriores. Importa historial legacy real, no datos de demo.
El guardado no implica aplicacion al procesamiento de eventos: falta backend.

## Variables Calculadas

- `calculatedVariables.js`: definiciones de plataforma en
  `sinergy-calculated-variables-v1:platform`; validacion, escritura comprobada y
  conflictos. Lista vacia persistida no restaura semillas. Nuevas definiciones
  nacen pausadas. `readsProfile` se deriva del script, no de un checkbox.
- Versiones: solo un cambio exacto de codigo agrega version. Metadata y alcance
  no duplican codigo; se conservan autores/fechas y hasta 100 versiones con
  numeracion continua. No es historial completo de configuracion.
- `calculatedVariableInputs.js`: descubre referencias literales var/ficha/out
  ignorando comentarios y textos. Ofrece aviso de salida y renombrado explicito
  solo cuando hay una salida fija no ambigua. No interpreta ni valida ejecucion.
- `calculatedVariableCompatibility.js`: presencia de entradas de ambos origenes;
  no confunde telemetria con ficha ni descarta cero/false.
- `calculatedVariableSignals.js`: catalogo, aliases y ultimas lecturas locales
  dentro de 30 dias (maximo 500). `calculatedVariableReadings.js` prepara filas de
  prueba y entradas manuales; sin historial usa snapshot identificado como local.
- `calculatedVariableTemplates.js`: cuatro plantillas. Firmas propuestas de
  limpiar/numero/partir/promedio pendientes de verificar con el motor original.
- `calculatedVariableSyntax.js`: tokens de resaltado seguro, sin ejecutar codigo.
- `calculatedVariableTestState.js`: entradas temporales de var/ficha, reconciliadas
  al cambiar referencias. No se serializan con la definicion.
- `calculatedVariableTests.js`: registro separado de respuestas reales del motor,
  nunca probado/modificado/error/prueba vigente. Codigo y clave deben coincidir
  exactamente con el resultado para considerarlo vigente.

La funcion de registro de pruebas es una frontera de integracion: hoy no hay
ejecutor conectado y la vista no la llama para inventar resultados. Guardar
permanece bloqueado. La semilla estado_vehiculo y sus hasta 99 activos iniciales
son del prototipo, no una migracion para produccion.

## Verificacion

Pruebas junto a cada utilidad (`*.test.js`): corrupcion, conflictos, escritura
fallida, herencia, salidas, entradas, compatibilidad, estados y versiones.
El frontend no reemplaza permisos, transacciones o auditoria del servidor.
