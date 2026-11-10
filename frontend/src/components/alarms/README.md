# Alarm Components

Componentes visuales de la bandeja operativa y de Configuracion de alertas.
Estado contrastado con el codigo: 2026-11-04.

## Archivos

- `AlarmDetailPanel.vue`: panel lateral de detalle de una alerta. Muestra
  estado operativo, activo, empresa, fecha, ubicacion, motivo de activacion,
  descripcion y acciones. La accion principal `Ver recorrido` vive aqui para
  evitar acciones duplicadas en la cabecera. Emite la alerta completa para que
  la vista navegue a `AppActivos` con `section=itinerarios`, `activoId`, `date`,
  `from=alertas` y `alarmId`.
- `AlarmConfigPanel.vue`: contenedor de configuracion de reglas automaticas.
  Mantiene seleccion, filtros, apertura del modal y persistencia. Delega filtros
  a `AlarmRuleFilters.vue`. En presentation=configuration renderiza un listado
  blanco continuo con divisores; en el modo alternativo usa AlarmRuleTable.
  No estira filas y no repite condicion si ya coincide con la descripcion.
  Dentro del modal de
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
- `AlarmAttentionForm.vue`: captura accion y nota para la atencion individual o
  masiva; la vista calcula destinos autorizados y aplica cambios.
  No limpia campos al emitir Guardar: el padre cierra solo despues de persistir.
  Si falla, conserva accion y nota para reintentar.
- `AlarmRuleCompanyCombobox.vue`: selector buscable de empresa en el editor.
- `AlarmRuleTimingSection.vue`: ruido, silencio, horario y dias de vigencia.
- `AlarmRuleEpisodeSection.vue`: condiciones especificas por tipo de episodio.
- `AlarmRuleSpeedingSection.vue`: limite por tipo o propio, duracion y severidad.
- `AlarmRuleFuelDropSection.vue`: parametros propios de caida de combustible.
- `AlarmRuleSignalSection.vue`: senales canonicas/presets e inspector del ultimo
  reporte autorizado. Cero es dato valido; no es un historial de 30 dias.
- `AlarmRuleWizardActions.vue`: canales y acciones; integraciones no disponibles
  se identifican como tales y no se ejecutan.

## Editor De Configuracion

Tres pasos: deteccion, ruido/vigencia, alcance/acciones. Nuevas reglas de este
flujo nacen inactivas. Algunos tipos del catalogo estan deshabilitados como
Proximamente; no interpretar los diez tipos del catalogo como diez detectores
operativos. Tipos legacy se conservan para editar sin convertir sus datos.
Plataforma usa todos los activos autorizados del alcance permitido; la variante
por empresa no edita reglas platformScope de otras empresas.
La seleccion masiva respeta filtros/alcance y no se limita a la ventana renderizada.

El borrador se conserva si falla la escritura. Cierre, cambio de regla, ruta o
empresa consultan cambios pendientes; una version externa conflictiva no se
sobrescribe. Validacion por paso y normalizacion viven en composables/utils.
Prueba historica, motor automatico y proveedores externos no estan conectados.

`AlarmList.vue` reutiliza los iconos semanticos de configuracion para identificar
el tipo de cada alerta en el historial. El punto superpuesto al icono conserva
el estado: rojo para activa y verde para resuelta.

En `AlarmDetailPanel.vue`, Empresa reutiliza `empresas`, Motivo muestra el icono
semantico del tipo de alerta y Descripcion usa `detail-info` desde el catalogo
central.

El historial usa un unico filtro de estado dentro de `AlarmFilters.vue`. No
agregar nuevamente contadores `Todas`, `Activas` y `Resueltas` sobre el listado,
porque duplican el mismo estado reactivo.

Cada alerta historica semilla referencia su regla original mediante `ruleId`.
El evento conserva su titulo aunque la regla se renombre o elimine.
`useAutomaticAlertRulesService.js` carga ejemplos solo si no existe configuracion
guardada. Una lista vacia es valida: nunca se reconstruyen reglas eliminadas ni
se sustituyen reglas personalizadas. Datos corruptos muestran un error y bloquean
las modificaciones hasta recuperar una configuracion legible.

## Regla de mantenimiento

La configuracion vive en su ruta propia. Ver la bandeja abre la ruta operativa;
no recrear las antiguas pestanas Historial/Configuracion dentro de AlarmsView.
La bandeja ofrece Sin iniciar, En curso, Atendidas, Todas e Historicas, ademas
de filtros y detalle lateral. Estado de atencion no equivale a tipo de regla.

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
