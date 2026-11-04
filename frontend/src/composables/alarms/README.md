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
- `useAlarmRuleDraftProtection.js`: captura firma del borrador y regla esperada,
  detecta cambios locales/conflictos y protege cierre y beforeunload. No ignora
  cambios de negocio; solo excluye timestamps de la firma del borrador.

## Alcance Y Guardado Actual (2026-11-04)

El wizard de Configuracion no trunca el universo autorizado a 120 activos.
La ventana renderizada es una optimizacion visual: seleccion masiva y conteos
operan sobre todos los resultados permitidos. platformScope conserva ids de
varias empresas al editar en plataforma; la ruta de empresa no amplia ese alcance.
Cambiar empresa reinicia o solicita descartar el borrador mediante el panel.

El payload se normaliza por tipo, incluidas opciones de exceso de velocidad,
episodios de combustible y aliases canonicos de senales. No convertir cero en
ausencia. Si el servicio devuelve null, no cerrar formulario ni registrar exito.
La persistencia sigue siendo local; no hay evaluador ni proveedor externo aqui.

Pruebas: `useAlarmRuleAssetScope.test.js` y
`useAlarmRuleDraftProtection.test.js`; reglas puras en utils/alarms.

## Regla de mantenimiento

Los componentes de `components/alarms` deben renderizar y emitir eventos. Si una
regla necesita calcular activos, geocercas, validacion o payload de guardado,
debe vivir aca o en `utils/alarms` si no depende de Vue.
