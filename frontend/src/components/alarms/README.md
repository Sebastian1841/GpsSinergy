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
  Incluye la accion `Nueva alerta` alineada con los filtros; el buscador usa el
  espacio flexible restante para no dejar vacios ni desplazar los controles.
  No filtra por si misma; solo emite cambios de `searchTerm`, tipo, empresa y
  estado al contenedor.
- `AlarmRuleTable.vue`: tabla/listado de reglas automaticas. Renderiza filas,
  estado, toggle, editar y eliminar. No modifica datos directamente; emite
  `select-rule`, `toggle-rule` y `delete-rule`. Los tipos sin reporte GPS,
  geocerca, combustible y velocidad usan iconos semanticos del catalogo
  `SvgIcon`, incluido `alarm-low-battery` para bateria baja. Los mismos iconos
  se reutilizan en historial y detalle. La
  prioridad usa `AlarmStatusBadge` para diferenciar baja, media, alta y critica,
  mientras el estado activo o desactivado conserva un badge con punto y borde
  suave junto al toggle. La fila no abre el editor al hacer clic: esa accion se
  reserva al boton `Editar` para evitar duplicidad y aperturas accidentales.
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

`AlarmList.vue` reutiliza los iconos semanticos de configuracion para identificar
el tipo de cada alerta en el historial. El punto superpuesto al icono conserva
el estado: rojo para activa y verde para resuelta.

En `AlarmDetailPanel.vue`, Empresa reutiliza `empresas`, Motivo muestra el icono
semantico del tipo de alerta y Descripcion usa `detail-info` desde el catalogo
central.

El historial usa un unico filtro de estado dentro de `AlarmFilters.vue`. No
agregar nuevamente contadores `Todas`, `Activas` y `Resueltas` sobre el listado,
porque duplican el mismo estado reactivo.

Cada alerta historica semilla referencia una regla automatica concreta mediante
`ruleId`. El titulo del evento y el nombre de esa regla deben ser identicos.
`useAutomaticAlertRulesService.js` migra las reglas guardadas equivalentes a la
regla semilla exacta y agrega las que falten, para que configuracion e historial
no presenten alertas diferentes.

## Regla de mantenimiento

La navegacion entre `Configuracion de alertas` e `Historial de alertas` usa
pestanas de texto sobre un divisor horizontal. La pestana activa se identifica
con texto azul y una linea naranja inferior; no debe mostrarse como boton solido
ni repetir iconos.

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
