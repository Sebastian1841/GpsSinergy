# Alarm Components

Componentes visuales del modulo de Alertas.

## Archivos

- `AlarmDetailPanel.vue`: panel lateral de detalle de una alerta. Muestra
  estado operativo, activo, empresa, fecha, ubicacion, motivo de activacion,
  descripcion y acciones. La accion principal `Ver recorrido` vive aqui para
  evitar acciones duplicadas en la cabecera. Emite la alerta completa para que
  la vista navegue a `AppActivos` con `section=itinerarios`, `activoId`, `date`,
  `from=alertas` y `alarmId`.
- `AlarmConfigPanel.vue`: contenedor de configuracion de reglas automaticas.
  Mantiene seleccion, filtros, apertura del modal y persistencia. Delega filtros
  a `AlarmRuleFilters.vue` y listado a `AlarmRuleTable.vue`. Dentro del modal de
  crear/editar delega informacion general, alcance, configuracion de disparo y
  notificaciones a componentes dedicados. El calculo de alcance, geocercas,
  validacion y payload vive en `composables/alarms`.
- `AlarmRuleFilters.vue`: barra de busqueda y filtros de reglas automaticas.
  No filtra por si misma; solo emite cambios de `searchTerm`, tipo, empresa y
  estado al contenedor.
- `AlarmRuleTable.vue`: tabla/listado de reglas automaticas. Renderiza filas,
  estado, toggle, editar y eliminar. No modifica datos directamente; emite
  `select-rule`, `toggle-rule` y `delete-rule`.
- `AlarmRuleGeneralSection.vue`: seccion del modal para nombre, tipo y
  descripcion de la regla.
- `AlarmRuleScopeSection.vue`: seccion del modal para empresa, alcance, activos
  especificos y etiquetas de acceso.
- `AlarmRuleNotificationsSection.vue`: seccion del modal para canales de
  notificacion en plataforma y correo.
- `AlarmRuleTriggerSection.vue`: seccion del modal para condiciones por tipo de
  alerta, seleccion de geocercas y horario de evaluacion. No guarda reglas; solo
  renderiza controles y emite acciones al contenedor.
- `AlarmFilters.vue`: barra de filtros de busqueda, estado, empresa y fecha.
- `AlarmList.vue`: historial de alertas activadas como filas seleccionables con
  encabezado ligero. Usa alerta, empresa, ubicacion y fecha para evitar columnas
  visualmente vacias. No administra acciones de estado; esas acciones viven en el
  panel lateral de detalle.
- `AlarmStatusBadge.vue`: badge reutilizable para estado y prioridad.
- `AlarmSummaryHeader.vue`: filtros superiores de estado `Todas`, `Activas` y
  `Resueltas`.

## Regla de mantenimiento

Estos componentes no calculan permisos ni deciden que alertas puede ver el
usuario. Deben recibir filas ya autorizadas desde `AlarmsView.vue`.

La logica de alcance vive en `utils/alarms/alarmUtils.js`: primero se cruzan las
alertas contra `visibleAssets` y despues se aplican filtros visuales.

La navegacion al recorrido no calcula permisos en el componente. `AlarmsView.vue`
solo navega con datos de una alerta ya autorizada; `ActivosView.vue` vuelve a
validar contra sus activos visibles antes de abrir Itinerarios y enfocar el punto
mas cercano a la hora de la alerta. El detalle y el tooltip de Itinerarios deben
mostrar el motivo de activacion calculado desde `metadata`, no solo la
descripcion general.

Las reglas automaticas viven separadas de las alertas ya generadas. El panel
de configuracion debe mantenerse como CRUD simple de reglas y usar
`useAutomaticAlertRulesService.js`, sin modificar directamente
`useAlarmsService.js` ni mezclar acciones de alertas ocurridas.

La logica del formulario de reglas automaticas vive en
`frontend/src/composables/alarms`: activos/etiquetas en
`useAlarmRuleAssetScope.js`, geocercas/grupos en
`useAlarmRuleGeofenceSelection.js` y draft/payload en `useAlarmRuleDraft.js`.
`AlarmConfigPanel.vue` solo debe orquestar esos composables y persistir el
resultado.

Las condiciones de geocerca no usan texto libre. `AlarmsView.vue` entrega
`geofences` y `geofenceGroups` desde `useGeofences`, y el formulario guarda
`geofenceScope` (`all`, `group` o `specific`), `geofenceGroupId` /
`geofenceGroupName` o `geofenceIds` / `geofenceNames` segun corresponda.

Si se agregan nuevos selectores masivos dentro del modal, no renderizar listas
completas sin limite. Mantener una ventana visible y usar `Set` para consultas
de seleccion por fila.
