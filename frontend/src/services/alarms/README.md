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
Cuando ya existe una lista guardada, se respeta tal cual para que las reglas
eliminadas por el usuario no vuelvan a aparecer al recargar.

## Estados

El flujo operativo maneja solo dos estados:

- `open`: alerta activa.
- `resolved`: alerta resuelta.

Cualquier estado antiguo distinto de `resolved` se normaliza como `open` al
cargar el servicio.

## Regla de mantenimiento

El servicio no aplica permisos. Solo administra el estado de las alertas. El
alcance por empresa, usuario, etiquetas o activos debe aplicarse antes de
renderizar, desde `AlarmsView.vue` y `utils/alarms/alarmUtils.js`.

Las reglas automaticas no son alertas ocurridas. Solo describen condiciones que
podrian generar alertas cuando exista evaluacion real desde backend o telemetria.
