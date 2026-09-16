# Alarm Composables

Composables del modulo de Alertas. Mantienen la logica de configuracion de
reglas automaticas fuera de los componentes visuales.

## Archivos

- `useAlarmRuleAssetScope.js`: calcula activos disponibles para la empresa del
  draft, busqueda de activos, ventana visible del selector, etiquetas de acceso
  disponibles y seleccion por `all`, `specific` o `asset-tags`.
- `useAlarmRuleGeofenceSelection.js`: calcula geocercas y grupos disponibles
  para la empresa del draft, busqueda, ventana visible del selector y escritura
  normalizada de `geofenceScope`, `geofenceGroupId`, `geofenceGroupName`,
  `geofenceIds` y `geofenceNames`.
- `useAlarmRuleDraft.js`: normaliza el draft de una regla automatica, aplica
  presets por tipo de alerta, valida si se puede guardar y arma el payload final
  que consume `useAutomaticAlertRulesService.js`.

## Regla de mantenimiento

Los componentes de `components/alarms` deben renderizar y emitir eventos. Si una
regla necesita calcular activos, geocercas, validacion o payload de guardado,
debe vivir aca o en `utils/alarms` si no depende de Vue.
