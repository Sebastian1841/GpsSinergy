# Alarms Service

Servicio local del modulo de Alertas.

## Archivos

- `useAlarmsService.js`: expone alertas reactivas y acciones para crear,
  actualizar, resolver y reabrir alertas.
- `useAutomaticAlertRulesService.js`: expone reglas automaticas reactivas y
  acciones para crear, actualizar, activar/pausar y eliminar reglas.

## Persistencia

Usa `localStorage` mediante `services/storage/browserStorage.js` con la clave
`sinergy-alarms`. Si no hay datos guardados, carga `data/mockAlarms.js`.

Las reglas automaticas usan la clave `sinergy-automatic-alert-rules`. Si no hay
datos guardados, cargan `data/mockAutomaticAlertRules.js`.
Las alertas semilla incluyen ruleId, pero cargar reglas existentes NO repone ni
reemplaza reglas a partir del historial de demo. Una lista vacia es valida.
Solo la ausencia total de almacenamiento inicializa semillas. JSON corrupto o
registros invalidos generan rulesLoadError y bloquean mutaciones sin sobrescribir.

## Escritura Comprobada

createRule/updateRule/deleteRule/toggleRule releen el estado actual y solo
publican el resultado reactivo cuando writeJsonStorage confirma escritura.
Al editar o borrar se compara la regla esperada con la actual; conflicto o fallo
devuelve null y expone rulesWriteError. reloadRules permite reintentar lectura.
La UI conserva borrador y seleccion al fallar. storage actualiza otras ventanas.
Estas garantias son del navegador, no transacciones entre usuarios de servidor.

## Estados

El flujo operativo maneja solo dos estados:

- `open`: alerta activa.
- `resolved`: alerta resuelta.

Cualquier estado antiguo distinto de `resolved` se normaliza como `open` al
cargar el servicio.

La bandeja agrega gestion en metadata.attention y attentionHistory: Sin iniciar,
En curso y Atendidas son estados derivados de atencion, no nuevos valores del
campo status. Acciones Era real/Falsa alarma resuelven; La estoy viendo/Llame al
conductor conservan open. Reglas automaticas y eventos ocurridos son colecciones
independientes. Las pruebas del servicio cubren semillas, borrado, errores y
conflictos (`useAutomaticAlertRulesService.test.js`).

## Regla de mantenimiento

El servicio no aplica permisos. Solo administra el estado de las alertas. El
alcance por empresa, usuario, etiquetas o activos debe aplicarse antes de
renderizar, desde `AlarmsView.vue` y `utils/alarms/alarmUtils.js`.

Las reglas automaticas no son alertas ocurridas. Solo describen condiciones que
podrian generar alertas cuando exista evaluacion real desde backend o telemetria.
