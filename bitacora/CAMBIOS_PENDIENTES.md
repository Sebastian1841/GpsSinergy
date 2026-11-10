# Resumen De Cambios Frontend Para Traspaso A Produccion

Este documento integra la seleccion de casos utiles para produccion y el inventario de archivos.
El inventario es una captura del momento en que se genero; no incluye automaticamente archivos agregados despues.
La seleccion no constituye aprobacion de despliegue ni auditoria del backend productivo.

Volver al [indice de bitacora](README.md). Para entregas especificas consultar
[Produccion](produccion/README.md). El inventario inferior conserva las rutas
originales de su captura, aunque despues se hayan reorganizado documentos.

## Alcance De Esta Entrega

Consolidacion documental al **2026-11-04** de los antecedentes de bitacora,
entregas anteriores y README del frontend. Resume resultados que interesa
conservar, no cada iteracion ni cada archivo modificado.

**No es un diff completo contra el frontend productivo:** ese repositorio y su
estado desplegado no se compararon. Algunos cambios historicos pueden estar
ya publicados; confirmar en destino antes de crear tareas o copiar codigo.
El inventario al final corresponde a otro corte y no define este alcance.

## Resumen Ejecutivo

- Unificar navegacion, iconos, cabeceras, filtros y densidad de las pantallas.
- Traspasar el diseno final de los cinco modulos de Configuracion junto a las
  protecciones de borrador, errores, alcance y guardado confirmado.
- Incorporar los flujos de planes, OT, renovacion y licencias de Mantenciones.
- Conservar la gestion de equipos Sin reportar y su historial por desconexion.
- Mantener filtros, permisos y consistencia entre pantalla, detalle y exportacion.
- Separar estas mejoras de los mocks, almacenamiento local y motores pendientes.

## Cambios Consolidados Por Modulo

Las rutas de esta seccion son relativas a `frontend/src/`. Son puntos de entrada,
no una lista para copiar archivos completos sobre el producto real.

### Elementos Compartidos

#### Navegacion y busqueda

**Cambios a conservar**

Sidebar por categorias con una abierta, tooltips flotantes, iconos semanticos, contexto del
modulo en header y busqueda global con apertura de resultados.

**Archivos de referencia**

- `components/Layout/`
- `composables/search/`
- `router/`
- `utils/layout/configurationNavigation.js`

**Pendiente para produccion**

Conservar rutas, empresa y permisos productivos; comprobar teclado, foco y menu
compacto/expandido.

### Configuracion

#### Limites

**Cambios a conservar**

Dos pestanas velocidad/consumo, seleccion por todos los tipos disponibles, imagenes
proporcionadas, campo con unidad, vista ilustrativa del umbral y resumen de cantidad/valor
guardado/original. Guardar, descartar y advertir al salir con cambios.

**Archivos de referencia**

- `views/ConfigurationLimitsView.vue`
- `utils/layout/limitsConfiguration.js`

**Pendiente para produccion**

Conectar catalogos y configuracion reales; preservar herencia empresa/plataforma/original. La
vista previa no implementa la alerta.

#### Etiquetas

**Cambios a conservar**

Lista/detalle integrado, busquedas general/de etiqueta/de vehiculo, asignacion individual o
masiva y modal compartido con Activos. Mantener formulario ante error.

**Archivos de referencia**

- `views/ConfigurationTagsView.vue`
- `components/activos/fleet/`
- `composables/mock/`

**Pendiente para produccion**

Extraer la UI del adaptador mock; guardar etiqueta y asignaciones de forma consistente en API;
respetar alcance al eliminar etiquetas.

#### Configuracion de alertas

**Cambios a conservar**

Lista continua y editor de tres pasos; condiciones, vigencia, alcance y canales diferenciados;
borrador protegido al cambiar regla o navegar.

**Archivos de referencia**

- `views/ConfigurationAlertsView.vue`
- `components/alarms/AlarmConfigPanel.vue`
- `composables/alarms/`
- `services/alarms/`

**Pendiente para produccion**

No recuperar reglas eliminadas ni cerrar tras un guardado fallido. Mantener tipos no disponibles
deshabilitados; integrar con el motor y proveedores existentes.

#### Ajustes avanzados

**Cambios a conservar**

Cuatro filas compactas para siete parametros, estado de cambios, restablecimiento
individual/global y revision antes de guardar. Historial centralizado en Auditoria.

**Archivos de referencia**

- `views/ConfigurationAdvancedView.vue`
- `utils/layout/advancedConfiguration.js`

**Pendiente para produccion**

API de parametros y auditoria; comprobar aplicacion efectiva por el procesamiento productivo. No
recuperar el modal de historial descartado.

#### Variables calculadas

**Cambios a conservar**

Consola visible en portada, cuatro KPI globales, busqueda y pendientes de prueba; seleccion
explicita abre editor Script/Probar/A que vehiculos. Plantillas, inspector de senales, entradas
manuales, compatibilidad y versiones de codigo.

**Archivos de referencia**

- `views/ConfigurationVariablesView.vue`
- `components/configuration/`
- `utils/layout/calculatedVariable*.js`

**Pendiente para produccion**

UI reutilizable; ejecucion no conectada. Conectar motor original, datos y pruebas reales antes
de habilitar guardado; compatibilidad estatica no equivale a prueba exitosa.

### Operacion

#### Activos, Fleet e Itinerarios

**Cambios a conservar**

Accesos contextuales a recorridos, alertas, etiquetas y mantenciones del activo; seleccion por
URL dentro del alcance autorizado. Exportaciones de itinerario con modelo comun y formatos
separados.

**Archivos de referencia**

- `views/ActivosView.vue`
- `components/activos/`
- `services/itinerarios/`

**Pendiente para produccion**

Preservar IDs, fechas, seleccion y filtros al navegar. Verificar mapa y recorrido con GPS real y
permisos.

#### Bandeja de alertas

**Cambios a conservar**

Separacion de reglas y eventos; Sin iniciar/En curso/Atendidas/Todas/Historicas, filtros,
detalle y atencion individual o multiple con acciones explicitas.

**Archivos de referencia**

- `views/AlarmsView.vue`
- `components/alarms/`
- `utils/alarms/`

**Pendiente para produccion**

Persistir atenciones y transiciones en API; preservar datos del evento al editar reglas. No
confundir este flujo con reglas de eventos de Reportes.

#### Mantenciones: Flota y OT

**Cambios a conservar**

Flota/Analisis/Ordenes/Conductores; planes por odometro, horometro o tiempo; crear plan sin
crear OT; cierre conserva ejecucion y deja ciclo Sin renovar; renovacion confirmada. Detalle
estable e historial por vehiculo.

**Archivos de referencia**

- `views/MaintenanceView.vue`
- `components/maintenance/`
- `composables/maintenance/`
- `utils/maintenance/`

**Pendiente para produccion**

Sustituir fixtures y fuentes locales. Acordar IDs, lecturas, estados y operaciones de
cierre/renovacion seguras ante reintentos.

#### Mantenciones: analisis y exportaciones

**Cambios a conservar**

Costos/cumplimiento desde ejecuciones medibles; distinguir sin datos de cero. Excel/PDF de flota
e historial con filtros coherentes y todas las filas filtradas, no solo pagina visible.
Cabeceras y controles compactos.

**Archivos de referencia**

- `services/maintenance/`
- `components/maintenance/maintenance.css`
- `utils/maintenance/`

**Pendiente para produccion**

Validar calculos, fechas, moneda y archivos reales con los datos productivos. No exportar
ejemplos como ejecuciones reales.

#### Conductores y licencias

**Cambios a conservar**

Tabla filtrable/ordenable con paginacion automatica; ficha de licencia actual e historial, fotos
frente/reverso y visor. Alta, edicion y renovacion separadas; renovacion confirmada conserva
licencia anterior. Exportacion Excel/PDF.

**Archivos de referencia**

- `components/maintenance/`
- `composables/maintenance/`
- `services/maintenance/`

**Pendiente para produccion**

Conectar conductores, licencias y archivos autorizados. Editar datos personales no debe saltarse
renovacion de vencimiento/clases. No recuperar Contactos ni Ultima gestion retirados.

#### Sin reportar

**Cambios a conservar**

Bandeja operativa sin graficos, filtros y prioridad por antiguedad; copiar IMEI, revisar equipo,
registrar/editar/eliminar consultas segun reglas y ver historial por episodio con evidencia
propia. Excel de resultados filtrados.

**Archivos de referencia**

- `components/unreported/`
- `composables/unreported/`
- `services/unreported/`
- `utils/unreported/`

**Pendiente para produccion**

Conectar telemetria y consultas persistidas; distinguir Sin uso, taller y perdida de reporte sin
cambiar artificialmente conectividad. Retirar simulaciones de recuperacion/desconexion.

#### Reportes

**Cambios a conservar**

Controles integrados al header global, preview/exportacion coherentes y contexto comun de
limite, consumo y precio; cambios de opciones invalidan resultados anteriores.

**Archivos de referencia**

- `components/reports/`
- `composables/reports/`
- `utils/reports/execution/`
- `utils/reports/event-rules/`

**Pendiente para produccion**

Reutilizar motor productivo y validar unidades/precedencia; un dato ausente no se convierte en
cero. No sustituir el motor por mocks.

### Administracion Y Soporte

#### Empresas y Usuarios

**Cambios a conservar**

Formularios, tablas y controles alineados; validacion/formato de RUT, agrupacion de acciones y
permisos/alcances por empresa y etiquetas.

**Archivos de referencia**

- `components/companies/`
- `components/users/`
- `composables/companies/`
- `composables/users/`

**Pendiente para produccion**

Comparar primero con produccion; conservar identidad, contratos y autorizacion reales. No
importar usuarios/empresas de muestra.

#### Auditoria

**Cambios a conservar**

Filtros compactos Desde/Hasta, busqueda, categorias claras, sin KPI redundantes, tabla paginada
y ficha de detalle; cambios de Configuracion consultables aqui.

**Archivos de referencia**

- `views/AuditView.vue`
- `components/audit/`
- `services/audit/`

**Pendiente para produccion**

Fuente de servidor con actor/fecha confiables; filtros y exportacion sobre total filtrado, no
pagina. El log local no es auditoria productiva.

#### Soporte

**Cambios a conservar**

Acceso desde menu de usuario, solicitudes y conversacion con alcance por rol.

**Archivos de referencia**

- `views/SupportView.vue` y sus dependencias

**Pendiente para produccion**

Antecedente funcional a comparar, no servicio productivo verificado. Requiere API de
solicitudes/mensajes y control de acceso.

## Mejoras Transversales Que No Deben Perderse

Correcciones agregadas el 2026-11-04 para incluir en el traspaso:

- Usuarios: proteger edicion de administradores y comprobar empresa destino de
  cada mutacion de permisos, rol, alcance o alta; no confiar solo en la ruta.
- OT derivadas: identidad estable, no indice de fila. Migrar datos antiguos con
  evidencia de pertenencia y conservar ambiguos sin atribuirlos a otro vehiculo.
- Planes: recalcular vencimiento y faltante al cambiar lectura/fecha, tanto en
  tabla como en detalle; no reutilizar indefinidamente el calculo del guardado.
- Guardado compartido y Soporte: conservar registros independientes y rechazar
  conflictos. Adaptar esta proteccion a transacciones/versiones en API real.
- GPS: conservar fecha real del punto; no presentar reportes antiguos como hoy.
- Soporte: borrador de respuesta por solicitud, limpio al enviar o cambiar usuario.
- Avanzado: error transitorio de escritura recuperable sin perder el borrador.

- **Guardado:** confirmar respuesta antes de publicar exito; errores conservan
  formulario y permiten reintentar. Lista vacia valida no se rellena con semillas.
- **Borradores:** avisos de salida y cambio de entidad; detectar version obsoleta.
  En servidor, revision/transaccion; localStorage no resuelve concurrencia multiusuario.
- **Permisos:** filtrar fuentes y acciones por empresa/activo/rol, no solo menus.
  Validar de nuevo en servidor; no ampliar alcance al limpiar filtros.
- **Rendimiento:** indices de planes/OT y conductores, agregaciones compartidas,
  debounce, paginacion y detalle historico bajo demanda; exportadores pesados
  cargados al descargar. Mantener caches acotadas y reiniciar al cambiar empresa.
- **Archivos:** conservar validaciones, errores, vistas previas y limpieza de URLs
  temporales; sustituir IndexedDB por almacenamiento compartido donde corresponda.
- **Presentacion:** azul/naranja corporativos, controles compactos y jerarquia
  coherente; no agrandar KPI para rellenar espacio ni ocultar overflow para
  simular ausencia de scroll. Mantener acciones y paginacion accesibles.

## Paquetes De Traspaso Propuestos

| Orden | Paquete | Condicion para incorporarlo |
| --- | --- | --- |
| 1 | Navegacion, iconos, estilos y cabeceras finales | Comparacion visual con destino sin alterar contratos ni permisos. |
| 2 | Protecciones de formularios, filtros y consistencia de exportacion | Pruebas de regresion con datos/servicios productivos. |
| 3 | Limites, Etiquetas, bandeja de alertas y Reportes | Adaptadores reales y comportamiento consistente entre consulta/guardado/exportacion. |
| 4 | Mantenciones, Conductores y Sin reportar | Contratos de operaciones, archivos, lecturas e historiales disponibles; sin fixtures. |
| 5 | Auditoria, Ajustes avanzados y Variables | Integracion especifica validada; mantener deshabilitadas las acciones sin servicio. |

Cada paquete debe tener su propio PR, evidencia antes/despues, pruebas y plan de
reversion. No trasladar el directorio completo ni sobrescribir servicios reales.

## Checklist De Aceptacion Del Traspaso

- [ ] Confirmar contra el repositorio destino que cambios aun faltan.
- [ ] Separar componentes/estilos de mocks, semillas y almacenamiento local.
- [ ] Validar consulta, editor y administrador en empresas diferentes.
- [ ] Probar carga, vacio, error, reintento, guardado y salida con borrador.
- [ ] Comprobar cierre/renovacion sin duplicados y cambios concurrentes.
- [ ] Comparar filtros, cantidades y totales entre pantalla, detalle y archivos.
- [ ] Revisar escritorio/movil, foco, tooltips, modales y filas completas.
- [ ] Ejecutar pruebas, lint y build en destino; registrar resultados nuevos.
- [ ] Mantener apagadas pruebas, guardados o notificaciones sin integracion.
- [ ] Actualizar README afectados y documentar rollback antes de publicar.

Esta consolidacion no ejecuta pruebas del producto ni certifica disponibilidad
del backend. Los resultados historicos de tests/build no reemplazan validacion
del paquete finalmente integrado.

## Fuentes Y Limites De La Consolidacion

- [Historial completo](bitacora.md): decisiones e iteraciones, incluidas reversiones.
- [Indice por modulo](modulos/README.md): enlaces al comportamiento actual.
- [Mantenciones y rendimiento](modulos/mantenciones-y-rendimiento.md) y
  [entrega de Mantenciones](produccion/mantenciones-2026-10-13.md): antecedentes
  al 2026-10-13, complementados aqui con Conductores y cambios posteriores.
- [Referencia visual](referencias/diseno-operacion-administracion.md): criterios,
  no funcionalidad productiva ni aprobacion del diseno de todos los modulos.

## Detalle De Protecciones E Integraciones

### 1. Priorizar: Presentacion Y Experiencia De Uso

| Caso | Conservar | Limite del traspaso |
| --- | --- | --- |
| Navegacion | Categorias de sidebar, tooltips, iconos semanticos y nombres de pantallas. | Conservar rutas y autorizacion reales. No exponer modulos aun desconectados. |
| Limites | Seleccion por tipo de vehiculo, campo compacto, unidades, valores guardado/original y vista previa. | La vista previa es ilustrativa; no sustituye las condiciones reales de alertas. |
| Etiquetas | Lista/detalle integrado, busquedas con alcance claro, tabla y paginacion. | Usar empresas, etiquetas y asignaciones reales, no las muestras del emulador. |
| Configuracion de alertas | Listado continuo, filtros, editor por pasos, alcance y canales claramente identificados. | Conservar avisos de proveedor ausente; no prometer envios no implementados. |
| Ajustes avanzados | Presentacion compacta de los siete parametros, comparaciones y revision antes de guardar. | Separar el diseno de su persistencia local y de la aplicacion efectiva a eventos. |
| Variables calculadas | Consola visible a altura completa, cuatro KPI, pendientes y cabeceras alineadas. | Datos y estados deben ser reales; no indicar ejecucion o guardado exitoso sin motor. |
| Mantenciones | Cabeceras contextuales, acciones/filtros de 38 px y tipografia mas legible. | No trasladar datos o calculos de ejemplo como parte del cambio visual. |

Archivos guia: `frontend/src/components/Layout/`,
`frontend/src/views/Configuration*View.vue`,
`frontend/src/components/alarms/AlarmConfigPanel.vue`,
`frontend/src/views/MaintenanceView.vue` y
`frontend/src/components/maintenance/maintenance.css`.

### 2. Alta Utilidad: Correcciones De Flujo

### Guardado Y Proteccion De Datos

- Publicar cambios en pantalla solo despues de confirmar la escritura.
- Conservar borradores y formularios abiertos ante fallos; permitir reintentar.
- Advertir al salir con cambios pendientes y al cambiar de entidad.
- Detectar configuracion modificada en otra ventana y evitar sobrescrituras.
- Respetar listas vacias guardadas: no restaurar automaticamente reglas eliminadas.
- Ante datos corruptos, informar y bloquear escritura; no sustituirlos por semillas.
- Etiquetas: actualizar etiqueta y asignaciones como una operacion atomica.
- Limites: guardar y descartar ambas pestanas de forma coherente.

Referencias: `useAlarmRuleDraftProtection.js`,
`useAutomaticAlertRulesService.js`, `limitsConfiguration.js`,
`ConfigurationTagsView.vue` y `composables/mock/assetTagConfiguration.test.js`.
En produccion, adaptar estas garantias a la API: transaccion y revision/version
del servidor. Comparar localStorage no resuelve concurrencia entre usuarios.

### Alcance Y Permisos

- Filtrar empresas, activos, etiquetas y geocercas autorizados antes de mostrarlos.
- Mantener restricciones de plataforma para Variables y Ajustes avanzados.
- Distinguir consulta y edicion, incluyendo edicion de reglas y atencion de alertas.
- Conservar seleccion al filtrar y evitar mezclar entidades de empresas distintas.

Referencias: `configurationNavigation.js`, `router/index.js`,
`useAlarmRuleAssetScope.js` y `ConfigurationAlertsView.vue`.
Los guards del frontend son experiencia de uso: el servidor debe volver a validar
permisos y pertenencia en cada consulta/escritura.

### 3. Utiles, Pero Requieren Integracion

| Caso | Valor que conservar | Pendiente antes de habilitar |
| --- | --- | --- |
| Limites e informes | Herencia empresa/plataforma/original; configuracion por tipo; consumo estimado con duracion y precio. | API persistente y acuerdo con el calculo productivo. Mantener un unico criterio de unidades y precedencia. |
| Reglas de alertas | Separacion entre reglas y eventos ocurridos; condiciones, alcance, geocercas y horarios estructurados. | Contratos reales y validacion del motor, zona horaria y entrega de notificaciones. No sustituir el motor productivo por utilidades del emulador. |
| Bandeja de alertas | Estados de atencion, pendientes, atraso y detalle contextual; conservar datos historicos al editar una regla. | Persistencia compartida de atencion, responsables, fechas y transiciones autorizadas. |
| Auditoria | Centralizar cambios con actor, fecha y antes/despues; reintentos sin duplicacion. | Registro del servidor con identidad y tiempo confiables. localStorage no es un registro de auditoria productivo. |
| Ajustes avanzados | Validacion de siete parametros, revision de cambios y restablecimiento. | Guardado por API y aplicacion efectiva en el procesamiento de eventos; hoy esta aplicacion sigue pendiente. |
| Variables calculadas | Editor en tres pasos, entradas separadas var/ficha, compatibilidad, pruebas y versiones solo ante cambios de codigo. | Motor original, funciones y topes verificados, ejecucion real y persistencia compartida. Guardar sigue bloqueado sin prueba real. |

Referencias adicionales: `reportLimitsContext.js`, `alarmAttention.js`,
`alarmInbox.js`, `advancedConfiguration.js`, `calculatedVariables.js`,
`calculatedVariableInputs.js`, `calculatedVariableTests.js` y
`calculatedVariableCompatibility.js`.
La deteccion estatica de referencias literales es una ayuda de interfaz: no es un
interprete ni garantiza que un script pueda ejecutarse correctamente.

### 4. Excluir Del Despliegue Productivo

- Datos semilla y modificaciones a `mockDatabase.js`, `mockAlarms.js` y servicios
  mock cuando su fin sea simular equipos, eventos o usuarios.
- `sampleAssetTags.js`: asignaciones a IDs de muestra.
- `limitsSampleAssets.js`: reparacion de tipos de dos activos de ejemplo.
- La variable semilla `estado_vehiculo` con alcance inicial de hasta 99 equipos:
  no crear definiciones ni asignaciones productivas automaticamente.
- Resultados, autores, fechas o contadores ficticios; ejemplos temporales ya
  retirados no deben recuperarse a partir de entradas antiguas de bitacora.
- Historial local presentado como auditoria compartida o prueba certificada.
- Rutas placeholder o funciones sin servicio disponible como si estuvieran listas.
- Fixtures, capturas y respaldos de `frontend/node_modules/.cache/`.
- Versiones visuales descartadas: portada compacta revertida y alternativas de
  iconos. Traspasar el estado final, no todas las iteraciones registradas.

Excluir significa no publicar estas dependencias/datos en el producto real; no
borrarlos sin mas de este emulador, donde hay imports que dependen de ellos.

### 5. Pruebas Y Condiciones De Salida

- Llevar las pruebas de regresion al repositorio productivo, fuera del bundle.
- Mantener casos de escritura fallida, datos corruptos, conflictos, borradores,
  asignaciones por empresa, unidades, herencia y cambios de paso.
- Variables: comprobar ficha ausente, cero/false validos, estados de prueba y
  versiones sin duplicacion por cambios cosmeticos.
- Ejecutar nuevamente pruebas, lint, build y revision responsive en el destino.
- Probar integracion real con usuario de consulta, editor y administrador, y con
  dos sesiones concurrentes. Sin pruebas de extremo a extremo no declarar los
  nuevos modulos funcionalmente listos para produccion.

### Orden Recomendado

1. Cambios visuales y navegacion, solo en funciones ya conectadas.
2. Protecciones de guardado, borradores y alcance adaptadas a la API existente.
3. Integracion de Etiquetas, Limites, informes y gestion de alertas.
4. Auditoria y Ajustes avanzados conectados al servidor.
5. Variables calculadas cuando este disponible y validado el motor original.

No realizar un traslado masivo de todos los archivos pendientes. Hay componentes
que mezclan presentacion, persistencia local y datos mock: separar esos cambios
por responsabilidad antes de incorporarlos al producto real.

## Inventario Original


Referencia: 4aeb6e6 (2026-10-22). Sin consultar el remoto.

## Archivos modificados (43)

- `README.md`
- `bitacora/bitacora.md`
- `frontend/src/components/Layout/AppHeader.vue`
- `frontend/src/components/Layout/AppSidebar.vue`
- `frontend/src/components/Layout/README.md`
- `frontend/src/components/activos/fleet/FleetAssetTagModal.vue`
- `frontend/src/components/activos/fleet/README.md`
- `frontend/src/components/alarms/AlarmConfigPanel.vue`
- `frontend/src/components/alarms/AlarmDetailPanel.vue`
- `frontend/src/components/alarms/AlarmFilters.vue`
- `frontend/src/components/alarms/AlarmList.vue`
- `frontend/src/components/alarms/AlarmRuleFilters.vue`
- `frontend/src/components/alarms/AlarmRuleNotificationsSection.vue`
- `frontend/src/components/alarms/AlarmRuleScopeSection.vue`
- `frontend/src/components/alarms/AlarmRuleTriggerSection.vue`
- `frontend/src/components/alarms/README.md`
- `frontend/src/components/icons/SvgIcon.vue`
- `frontend/src/components/maintenance/maintenance.css`
- `frontend/src/components/reports/ReportExecutionModal.vue`
- `frontend/src/composables/alarms/useAlarmRuleAssetScope.js`
- `frontend/src/composables/alarms/useAlarmRuleDraft.js`
- `frontend/src/composables/mock/useMockDatabase.js`
- `frontend/src/composables/reports/README.md`
- `frontend/src/composables/reports/useAssetReportExecution.js`
- `frontend/src/data/mockAlarms.js`
- `frontend/src/data/mockDatabase.js`
- `frontend/src/router/README.md`
- `frontend/src/router/index.js`
- `frontend/src/services/alarms/useAutomaticAlertRulesService.js`
- `frontend/src/services/alarms/useAutomaticAlertRulesService.test.js`
- `frontend/src/services/audit/useAuditService.js`
- `frontend/src/utils/alarms/automaticAlertRuleUtils.js`
- `frontend/src/utils/layout/README.md`
- `frontend/src/utils/reports/event-rules/reportEventRuleEngine.js`
- `frontend/src/utils/reports/execution/README.md`
- `frontend/src/utils/reports/execution/assetReportColumnUtils.js`
- `frontend/src/utils/reports/execution/assetReportRowBuilderUtils.js`
- `frontend/src/utils/reports/execution/assetReportValueUtils.js`
- `frontend/src/views/ActivosView.vue`
- `frontend/src/views/AlarmsView.vue`
- `frontend/src/views/AuditView.vue`
- `frontend/src/views/MaintenanceView.vue`
- `frontend/src/views/README.md`

## Archivos nuevos (82)

- `bitacora/referencia-visual-operacion-administracion.md`
- `frontend/src/components/Layout/AppSidebar.test.js`
- `frontend/src/components/activos/fleet/FleetAssetTagModal.test.js`
- `frontend/src/components/alarms/AlarmAttentionForm.vue`
- `frontend/src/components/alarms/AlarmConfigPanel.test.js`
- `frontend/src/components/alarms/AlarmRuleCompanyCombobox.vue`
- `frontend/src/components/alarms/AlarmRuleEpisodeSection.vue`
- `frontend/src/components/alarms/AlarmRuleFuelDropSection.vue`
- `frontend/src/components/alarms/AlarmRuleSignalSection.vue`
- `frontend/src/components/alarms/AlarmRuleSpeedingSection.vue`
- `frontend/src/components/alarms/AlarmRuleTimingSection.vue`
- `frontend/src/components/alarms/AlarmRuleWizardActions.vue`
- `frontend/src/components/configuration/CalculatedVariableEditor.test.js`
- `frontend/src/components/configuration/CalculatedVariableEditor.vue`
- `frontend/src/components/configuration/CalculatedVariableTest.vue`
- `frontend/src/components/configuration/CalculatedVariableVehicles.test.js`
- `frontend/src/components/configuration/CalculatedVariableVehicles.vue`
- `frontend/src/composables/alarms/useAlarmRuleAssetScope.test.js`
- `frontend/src/composables/alarms/useAlarmRuleDraftProtection.js`
- `frontend/src/composables/alarms/useAlarmRuleDraftProtection.test.js`
- `frontend/src/composables/mock/assetTagConfiguration.test.js`
- `frontend/src/data/limitsSampleAssets.js`
- `frontend/src/data/limitsSampleAssets.test.js`
- `frontend/src/data/mockAlarms.test.js`
- `frontend/src/data/sampleAssetTags.js`
- `frontend/src/data/sampleAssetTags.test.js`
- `frontend/src/services/audit/useAuditService.test.js`
- `frontend/src/utils/alarms/alarmAttention.js`
- `frontend/src/utils/alarms/alarmAttention.test.js`
- `frontend/src/utils/alarms/alarmEpisodeDisplay.js`
- `frontend/src/utils/alarms/alarmEpisodeDisplay.test.js`
- `frontend/src/utils/alarms/alarmInbox.js`
- `frontend/src/utils/alarms/alarmInbox.test.js`
- `frontend/src/utils/alarms/alarmRuleWizard.js`
- `frontend/src/utils/alarms/alarmRuleWizard.test.js`
- `frontend/src/utils/alarms/configurationAlertTypes.js`
- `frontend/src/utils/alarms/configurationAlertTypes.test.js`
- `frontend/src/utils/alarms/fuelDropEpisode.js`
- `frontend/src/utils/alarms/fuelDropEpisode.test.js`
- `frontend/src/utils/alarms/signalRulePresets.js`
- `frontend/src/utils/alarms/signalRulePresets.test.js`
- `frontend/src/utils/alarms/speedingRule.js`
- `frontend/src/utils/alarms/speedingRule.test.js`
- `frontend/src/utils/layout/advancedConfiguration.js`
- `frontend/src/utils/layout/advancedConfiguration.test.js`
- `frontend/src/utils/layout/calculatedVariableCompatibility.js`
- `frontend/src/utils/layout/calculatedVariableCompatibility.test.js`
- `frontend/src/utils/layout/calculatedVariableInputs.js`
- `frontend/src/utils/layout/calculatedVariableInputs.test.js`
- `frontend/src/utils/layout/calculatedVariableOutputs.test.js`
- `frontend/src/utils/layout/calculatedVariableReadings.js`
- `frontend/src/utils/layout/calculatedVariableReadings.test.js`
- `frontend/src/utils/layout/calculatedVariableSignals.js`
- `frontend/src/utils/layout/calculatedVariableSignals.test.js`
- `frontend/src/utils/layout/calculatedVariableSyntax.js`
- `frontend/src/utils/layout/calculatedVariableTemplates.js`
- `frontend/src/utils/layout/calculatedVariableTemplates.test.js`
- `frontend/src/utils/layout/calculatedVariableTestState.js`
- `frontend/src/utils/layout/calculatedVariableTestState.test.js`
- `frontend/src/utils/layout/calculatedVariableTests.js`
- `frontend/src/utils/layout/calculatedVariableTests.test.js`
- `frontend/src/utils/layout/calculatedVariables.js`
- `frontend/src/utils/layout/calculatedVariables.test.js`
- `frontend/src/utils/layout/configurationNavigation.js`
- `frontend/src/utils/layout/limitsConfiguration.js`
- `frontend/src/utils/layout/limitsConfiguration.test.js`
- `frontend/src/utils/layout/tagSearch.js`
- `frontend/src/utils/layout/tagSearch.test.js`
- `frontend/src/utils/reports/execution/reportLimitsContext.js`
- `frontend/src/utils/reports/execution/reportLimitsContext.test.js`
- `frontend/src/views/AlarmsView.test.js`
- `frontend/src/views/AuditView.test.js`
- `frontend/src/views/ConfigurationAdvancedView.test.js`
- `frontend/src/views/ConfigurationAdvancedView.vue`
- `frontend/src/views/ConfigurationAlertsView.test.js`
- `frontend/src/views/ConfigurationAlertsView.vue`
- `frontend/src/views/ConfigurationLimitsView.vue`
- `frontend/src/views/ConfigurationPlaceholderView.vue`
- `frontend/src/views/ConfigurationTagsView.test.js`
- `frontend/src/views/ConfigurationTagsView.vue`
- `frontend/src/views/ConfigurationVariablesView.vue`
- `frontend/src/views/MaintenanceView.test.js`
